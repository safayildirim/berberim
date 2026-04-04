package server

import (
	"context"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/labstack/echo/v5"
	"github.com/labstack/echo/v5/middleware"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	berberimv1 "github.com/berberim/api/api/v1"
	"github.com/berberim/api/internal/analytics"
	apihandler "github.com/berberim/api/internal/api"
	"github.com/berberim/api/internal/appointment"
	"github.com/berberim/api/internal/auth"
	authjwt "github.com/berberim/api/internal/auth/jwt"
	"github.com/berberim/api/internal/config"
	"github.com/berberim/api/internal/customer"
	grpcinterceptor "github.com/berberim/api/internal/grpc"
	"github.com/berberim/api/internal/loyalty"
	"github.com/berberim/api/internal/notification"
	"github.com/berberim/api/internal/review"
	"github.com/berberim/api/internal/tenant"
)

const (
	jwksCacheTTL   = 5 * time.Minute
	jwksRatePerMin = 120
)

type Server struct {
	cfg         *config.Config
	logger      *zap.Logger
	db          *gorm.DB
	apiHandler  *apihandler.Handler
	authHandler *auth.Handler
	notifySvc   *notification.Service
	keyProvider authjwt.KeyProvider
}

func New() *Server {
	cfg := config.Load()
	logger := zap.Must(zap.NewProduction())

	db, err := gorm.Open(postgres.Open(cfg.DB.URL), &gorm.Config{})
	if err != nil {
		log.Fatalf("db: %v", err)
	}
	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("db.DB: %v", err)
	}
	sqlDB.SetMaxOpenConns(cfg.DB.Pool.MaxOpenConns)
	sqlDB.SetMaxIdleConns(cfg.DB.Pool.MaxIdleConns)
	sqlDB.SetConnMaxLifetime(cfg.DB.Pool.ConnMaxLifetime)
	sqlDB.SetConnMaxIdleTime(cfg.DB.Pool.ConnMaxIdleTime)

	keyProvider, err := authjwt.NewStaticKeyProvider(cfg.JWT.PrivateKeyPath, cfg.JWT.Algorithm)
	if err != nil {
		log.Fatalf("key provider: %v", err)
	}

	jwtMgr := authjwt.NewJWTManager(keyProvider, cfg.JWT.Issuer)

	// ── Auth domain ───────────────────────────────────────────────────────────
	authRepo := auth.NewRepo(db)
	authSvc := auth.NewService(logger, authRepo, jwtMgr, cfg.JWT.AccessTokenTTL, cfg.JWT.RefreshTokenTTL)
	authHandler := auth.NewHandler(logger, authSvc)

	// ── Tenant domain ─────────────────────────────────────────────────────────
	tenantRepo := tenant.NewRepo(db)
	tenantSvc := tenant.NewService(logger, tenantRepo)
	tenantHandler := tenant.NewHandler(logger, tenantSvc)

	// ── Loyalty domain ────────────────────────────────────────────────────────
	loyaltyRepo := loyalty.NewRepo(db)
	loyaltySvc := loyalty.NewService(loyaltyRepo, logger)
	loyaltyHandler := loyalty.NewHandler(loyaltySvc)

	// ── Appointment domain ────────────────────────────────────────────────────
	appointmentRepo := appointment.NewRepo(db)
	appointmentSvc := appointment.NewService(appointmentRepo, loyaltySvc, logger)
	appointmentHandler := appointment.NewHandler(appointmentSvc, logger)

	// ── Notification domain ────────────────────────────────────────────────────
	notificationRepo := notification.NewRepo(db)
	pushProvider := notification.NewExpoPushProvider()
	notificationSvc := notification.NewService(logger, notificationRepo, pushProvider)
	notificationHandler := notification.NewHandler(notificationSvc)
	appointmentSvc.SetReminderScheduler(notificationSvc)

	// ── Customer domain ───────────────────────────────────────────────────────
	customerRepo := customer.NewRepo(db)
	customerSvc := customer.NewService(customerRepo)
	customerHandler := customer.NewHandler(customerSvc)

	// ── Review domain ─────────────────────────────────────────────────────────
	reviewRepo := review.NewRepo(db)
	reviewSvc := review.NewService(reviewRepo, logger)
	reviewHandler := review.NewHandler(reviewSvc)

	// ── Analytics domain ──────────────────────────────────────────────────────
	analyticsRepo := analytics.NewRepo(db)
	analyticsSvc := analytics.NewService(logger, analyticsRepo)
	analyticsHandler := analytics.NewHandler(logger, analyticsSvc)

	// ── Compose ───────────────────────────────────────────────────────────────
	composed := apihandler.NewHandler(authHandler, tenantHandler, appointmentHandler, loyaltyHandler, customerHandler, notificationHandler, reviewHandler, analyticsHandler)

	return &Server{
		cfg:         cfg,
		logger:      logger,
		db:          db,
		apiHandler:  composed,
		authHandler: authHandler,
		notifySvc:   notificationSvc,
		keyProvider: keyProvider,
	}
}

func (s *Server) Run() error {
	defer s.logger.Sync()
	s.logger.Info("starting servers", zap.String("env", s.cfg.Env))
	grpcServer := s.startGRPC()
	if err := s.serveHTTP(); err != nil {
		return err
	}
	grpcServer.GracefulStop()
	return nil
}

func (s *Server) RunHTTP() error {
	defer s.logger.Sync()
	return s.serveHTTP()
}

func (s *Server) RunGRPC() error {
	defer s.logger.Sync()
	grpcServer := s.startGRPC()
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	<-ctx.Done()
	grpcServer.GracefulStop()
	return nil
}

func (s *Server) RunReminderWorker() error {
	defer s.logger.Sync()
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	worker := notification.NewWorker(s.logger, s.notifySvc, 20*time.Second, 100)
	s.logger.Info("notification reminder worker started")
	if err := worker.Run(ctx); err != nil && err != context.Canceled {
		return err
	}
	return nil
}

func (s *Server) startGRPC() *grpc.Server {
	grpcServer := grpc.NewServer(
		grpc.ChainUnaryInterceptor(
			grpcinterceptor.InjectRequestID(),
			grpcinterceptor.InjectClientMeta(),
			grpcinterceptor.InjectIdentity(),
			grpcinterceptor.LoggingUnaryServerInterceptor(s.logger),
		),
	)
	berberimv1.RegisterBerberimAPIServer(grpcServer, s.apiHandler)
	reflection.Register(grpcServer)

	lis, err := net.Listen("tcp", ":"+s.cfg.GrpcPort)
	if err != nil {
		log.Fatalf("grpc listen: %v", err)
	}
	go func() {
		s.logger.Info("gRPC listening", zap.String("addr", ":"+s.cfg.GrpcPort))
		if err := grpcServer.Serve(lis); err != nil && err != grpc.ErrServerStopped {
			s.logger.Error("grpc serve", zap.Error(err))
		}
	}()
	return grpcServer
}

func (s *Server) serveHTTP() error {
	jwksBuilder := authjwt.NewJWKSBuilder(s.keyProvider)
	jwksCache := authjwt.NewJWKSCache(jwksCacheTTL, jwksBuilder.GetJWKS)
	jwksLimit := authjwt.NewJWKSRateLimiter(jwksRatePerMin, time.Minute)

	e := echo.New()
	e.Use(middleware.RequestID())
	e.Use(middleware.Recover())
	e.Use(middleware.RequestLogger())

	e.GET("/healthz", Health)
	e.GET("/.well-known/jwks.json", s.authHandler.JWKS(jwksCache, jwksLimit))

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	httpAddr := s.cfg.HttpListenAddress + ":" + s.cfg.Port
	startCfg := echo.StartConfig{
		Address:         httpAddr,
		HideBanner:      true,
		GracefulTimeout: 10 * time.Second,
	}
	s.logger.Info("HTTP listening", zap.String("addr", httpAddr))
	if err := startCfg.Start(ctx, e); err != nil && err != context.Canceled && err != http.ErrServerClosed {
		s.logger.Fatal("http server", zap.Error(err))
	}
	return nil
}

func Health(c *echo.Context) error {
	return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
}
