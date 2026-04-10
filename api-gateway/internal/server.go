package internal

import (
	"errors"
	"log"
	"net/http"

	"github.com/berberim/api-gateway/internal/apierr"
	"github.com/berberim/api-gateway/internal/config"
	"github.com/berberim/api-gateway/internal/grpcclient"
	"github.com/berberim/api-gateway/internal/handler"
	authzmw "github.com/berberim/api-gateway/internal/middleware"
	"github.com/berberim/api-gateway/internal/security"
	"github.com/labstack/echo/v5"
	"github.com/labstack/echo/v5/middleware"
)

// NewRouter builds the Echo router wired to all domain gateway handlers.
func NewRouter(cfg *config.Config, h *handler.Handlers, jwtValidator security.JWTValidator) *echo.Echo {
	validateJWT := authzmw.ValidateJWT(jwtValidator)

	e := echo.New()
	e.Use(middleware.Recover())
	e.Use(middleware.RequestID())
	e.Use(authzmw.RequestBodyLogger())

	e.GET("/health", func(c *echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
	})

	// ── Public API (no auth) ──────────────────────────────────────────────────
	// Tenant resolved from ?tenant_id= query param or request body.
	pub := e.Group("/api/v1/public")
	pub.GET("/tenants/:tenant_id/bootstrap", h.Public.GetBootstrap)
	pub.GET("/services", h.Public.ListServices)
	pub.GET("/services/:serviceId", h.Public.GetService)
	pub.GET("/staff", h.Public.ListStaff)
	pub.GET("/staff/:staffId", h.Public.GetStaff)
	pub.GET("/staff/:staffId/services", h.Public.ListStaffServices)
	pub.POST("/availability/search", h.Public.SearchAvailability)
	pub.GET("/availability/days", h.Public.GetAvailabilityDays)

	// ── Customer Auth ──────────────────────────────────────────────────────────
	customerAuth := e.Group("/api/v1/auth/customers")
	customerAuth.POST("/login", h.Auth.SendCustomerOTP)
	customerAuth.POST("/login/verify", h.Auth.VerifyCustomerOTP)
	customerAuth.POST("/login/social", h.Auth.VerifySocialLogin)

	// ── Tenant Auth ────────────────────────────────────────────────────────────
	tenantAuth := e.Group("/api/v1/auth/tenant")
	tenantAuth.POST("/login", h.Auth.LoginTenantUser)

	// ── Platform Auth ─────────────────────────────────────────────────────────
	platformAuth := e.Group("/api/v1/auth/platform")
	platformAuth.POST("/login", h.Auth.LoginPlatformUser)

	// ── Shared Auth (all token types) ─────────────────────────────────────────
	auth := e.Group("/api/v1/auth")
	auth.POST("/refresh", h.Auth.RefreshToken)
	auth.POST("/logout", h.Auth.Logout)

	authJWT := e.Group("/api/v1/auth", validateJWT)
	authJWT.POST("/logout-all", h.Auth.LogoutAll)
	authJWT.GET("/sessions", h.Auth.ListSessions)
	authJWT.DELETE("/sessions/:session_id", h.Auth.RevokeSession)

	// ── Customer API ──────────────────────────────────────────────────────────
	// Who:   authenticated customers
	// Scope: tenant from JWT claim
	customer := e.Group("/api/v1/customer",
		validateJWT,
		authzmw.RequireTokenType("customer"),
		authzmw.RequireTenantID(),
	)
	customer.GET("/me", h.Customer.GetProfile)
	customer.PATCH("/me", h.Customer.UpdateProfile)
	customer.GET("/slot-recommendations", h.Customer.GetSlotRecommendations)
	customer.GET("/booking-limit", h.Customer.GetBookingLimitStatus)
	customer.GET("/appointments", h.Customer.ListMyAppointments)
	customer.POST("/appointments", h.Customer.CreateAppointment)
	customer.GET("/appointments/:id", h.Customer.GetAppointment)
	customer.POST("/appointments/:id/cancel", h.Customer.CancelAppointment)
	customer.POST("/appointments/:id/reschedule", h.Customer.RescheduleAppointment)
	customer.GET("/loyalty/balance", h.Customer.GetLoyaltyBalance)
	customer.GET("/loyalty/transactions", h.Customer.GetLoyaltyTransactions)
	customer.GET("/loyalty/rewards", h.Customer.ListRewards)
	customer.POST("/push-devices", h.Customer.RegisterPushDevice)
	customer.DELETE("/push-devices/:id", h.Customer.DeletePushDevice)
	customer.POST("/reviews", h.Customer.CreateReview)
	customer.PATCH("/reviews/:id", h.Customer.UpdateReview)
	customer.DELETE("/reviews/:id", h.Customer.DeleteReview)
	customer.GET("/appointments/:id/review", h.Customer.GetMyReviewForAppointment)
	customer.GET("/notifications", h.Customer.ListNotifications)
	customer.GET("/notifications/unread-count", h.Customer.GetUnreadNotificationCount)
	customer.PATCH("/notifications/read-all", h.Customer.MarkAllNotificationsRead)
	customer.PATCH("/notifications/:id/read", h.Customer.MarkNotificationRead)
	customer.POST("/avatar/upload-url", h.Customer.GenerateAvatarUploadURL)
	customer.PUT("/avatar/confirm", h.Customer.ConfirmAvatarUpload)

	// ── Tenant API — staff + admin ────────────────────────────────────────────
	// Who:   tenant_user (role=staff or role=admin)
	// Scope: tenant from JWT claim
	tenant := e.Group("/api/v1/tenant",
		validateJWT,
		authzmw.RequireTokenType("tenant_user"),
		authzmw.RequireTenantID(),
	)
	tenant.GET("/me", h.Tenant.GetProfile)
	tenant.GET("/calendar", h.Tenant.GetCalendar)
	tenant.POST("/push-devices", h.Tenant.RegisterPushDevice)
	tenant.DELETE("/push-devices/:id", h.Tenant.DeletePushDevice)
	tenant.POST("/avatar/upload-url", h.Tenant.GenerateStaffAvatarUploadURL)
	tenant.PUT("/avatar/confirm", h.Tenant.ConfirmStaffAvatarUpload)

	tenant.GET("/services", h.Tenant.ListServices)
	tenant.GET("/services/:id", h.Tenant.GetService)

	tenant.GET("/staff", h.Tenant.ListStaff)
	tenant.GET("/staff/:id", h.Tenant.GetStaff)
	tenant.GET("/staff/:id/services", h.Tenant.GetStaffServices)
	tenant.PUT("/staff/:id/services", h.Tenant.SetStaffServices)
	tenant.GET("/staff/:id/schedule-rules", h.Tenant.ListScheduleRules)
	tenant.POST("/staff/:id/schedule-rules", h.Tenant.CreateScheduleRule)
	tenant.PATCH("/staff/:id/schedule-rules/:ruleId", h.Tenant.UpdateScheduleRule)
	tenant.DELETE("/staff/:id/schedule-rules/:ruleId", h.Tenant.DeleteScheduleRule)
	tenant.GET("/staff/:id/time-offs", h.Tenant.ListTimeOffs)
	tenant.POST("/staff/:id/time-offs", h.Tenant.CreateTimeOff)
	tenant.PATCH("/staff/:id/time-offs/:timeOffId", h.Tenant.UpdateTimeOff)
	tenant.DELETE("/staff/:id/time-offs/:timeOffId", h.Tenant.DeleteTimeOff)
	tenant.GET("/staff/:id/reviews", h.Tenant.ListStaffReviews)

	tenant.GET("/appointments", h.Tenant.ListAppointments)
	tenant.GET("/appointments/:id", h.Tenant.GetAppointment)
	tenant.POST("/appointments", h.Tenant.CreateAppointment)
	tenant.POST("/appointments/:id/cancel", h.Tenant.CancelAppointment)
	tenant.POST("/appointments/:id/complete", h.Tenant.CompleteAppointment)
	tenant.POST("/appointments/:id/mark-no-show", h.Tenant.MarkNoShow)
	tenant.POST("/appointments/:id/mark-payment-received", h.Tenant.MarkPaymentReceived)
	tenant.POST("/appointments/:id/reschedule", h.Tenant.RescheduleAppointment)
	tenant.POST("/availability/search", h.Tenant.SearchAvailability)

	tenant.GET("/customers", h.Tenant.ListCustomers)
	tenant.GET("/customers/:id", h.Tenant.GetCustomer)
	tenant.GET("/customers/:id/appointments", h.Tenant.ListCustomerAppointments)

	tenant.GET("/rewards", h.Tenant.ListRewards)
	tenant.GET("/rewards/:id", h.Tenant.GetReward)

	// ── Tenant API — admin only ───────────────────────────────────────────────
	// Who:   tenant_user with role=admin
	// Scope: tenant from JWT claim
	tenantAdmin := e.Group("/api/v1/tenant",
		validateJWT,
		authzmw.RequireTokenType("tenant_user"),
		authzmw.RequireTenantID(),
		authzmw.RequireRole("admin"),
	)
	tenantAdmin.GET("/settings", h.Tenant.GetSettings)
	tenantAdmin.PATCH("/settings", h.Tenant.UpdateSettings)
	tenantAdmin.GET("/notification-settings", h.Tenant.GetNotificationSettings)
	tenantAdmin.PATCH("/notification-settings", h.Tenant.UpdateNotificationSettings)

	tenantAdmin.POST("/services", h.Tenant.CreateService)
	tenantAdmin.PATCH("/services/:id", h.Tenant.UpdateService)
	tenantAdmin.DELETE("/services/:id", h.Tenant.DeleteService)

	tenantAdmin.POST("/staff", h.Tenant.CreateStaff)
	tenantAdmin.PATCH("/staff/:id", h.Tenant.UpdateStaff)
	tenantAdmin.DELETE("/staff/:id", h.Tenant.DeleteStaff)
	tenantAdmin.PATCH("/staff/:id/status", h.Tenant.SetStaffStatus)

	tenantAdmin.GET("/loyalty/settings", h.Tenant.GetLoyaltySettings)
	tenantAdmin.PATCH("/loyalty/settings", h.Tenant.UpdateLoyaltySettings)

	tenantAdmin.POST("/rewards", h.Tenant.CreateReward)
	tenantAdmin.PATCH("/rewards/:id", h.Tenant.UpdateReward)
	tenantAdmin.DELETE("/rewards/:id", h.Tenant.DeleteReward)
	tenantAdmin.PATCH("/rewards/:id/status", h.Tenant.SetRewardStatus)

	tenantAdmin.GET("/analytics/overview", h.Tenant.GetAnalyticsOverview)
	tenantAdmin.GET("/analytics/cohorts", h.Tenant.GetCohortAnalysis)
	tenantAdmin.GET("/analytics/retention", h.Tenant.GetRetentionAnalysis)
	tenantAdmin.GET("/analytics/ltv", h.Tenant.GetCustomerLTV)
	tenantAdmin.GET("/analytics/no-shows", h.Tenant.GetNoShowAnalysis)

	tenantAdmin.POST("/customers", h.Tenant.CreateCustomer)
	tenantAdmin.PATCH("/customers/:id", h.Tenant.UpdateCustomer)
	tenantAdmin.PATCH("/customers/:id/status", h.Tenant.SetCustomerStatus)

	// ── Platform API ──────────────────────────────────────────────────────────
	// Who:   platform_user (super admin)
	// Scope: cross-tenant
	platform := e.Group("/api/v1/platform",
		validateJWT,
		authzmw.RequireTokenType("platform_user"),
	)
	platform.GET("/tenants", h.Platform.ListTenants)
	platform.POST("/tenants", h.Platform.CreateTenant)
	platform.GET("/tenants/:id", h.Platform.GetTenant)
	platform.PATCH("/tenants/:id", h.Platform.UpdateTenant)
	platform.POST("/tenants/:id/freeze", h.Platform.FreezeTenant)
	platform.POST("/tenants/:id/reactivate", h.Platform.ReactivateTenant)
	platform.POST("/tenants/:id/cancel-subscription", h.Platform.CancelSubscription)
	platform.POST("/tenants/:id/extend-subscription", h.Platform.ExtendSubscription)
	platform.GET("/tenants/:tenant_id/users", h.Platform.ListTenantUsers)
	platform.POST("/tenants/:tenant_id/users", h.Platform.CreateTenantUser)
	platform.PUT("/tenants/:tenant_id/users/:user_id/disable", h.Platform.DisableTenantUser)
	platform.PUT("/tenants/:tenant_id/users/:user_id/enable", h.Platform.EnableTenantUser)

	platform.GET("/users", h.Platform.ListPlatformUsers)
	platform.POST("/users", h.Platform.CreatePlatformUser)
	platform.GET("/users/:id", h.Platform.GetPlatformUser)
	platform.PATCH("/users/:id", h.Platform.UpdatePlatformUser)
	platform.DELETE("/users/:id", h.Platform.DeletePlatformUser)

	e.Any("/*", func(c *echo.Context) error {
		return apierr.Write(c, http.StatusNotFound, apierr.New("not_found", "unknown route"))
	})

	return e
}

// Start runs the API gateway.
func Start() error {
	cfg := config.LoadConfig()

	client, conn, err := grpcclient.New(cfg.Env, cfg.APIGRPCAddr)
	if err != nil {
		log.Fatalf("gateway grpc client: %v", err)
	}
	defer conn.Close()

	jwtValidator, err := security.NewJWTValidator(cfg.Env, cfg.Authz)
	if err != nil {
		log.Fatalf("gateway JWT validator: %v", err)
	}

	h := &handler.Handlers{
		Auth:     handler.NewAuthHandler(client),
		Public:   handler.NewPublicHandler(client),
		Customer: handler.NewCustomerHandler(client),
		Tenant:   handler.NewTenantHandler(client),
		Platform: handler.NewPlatformHandler(client),
	}

	e := NewRouter(cfg, h, jwtValidator)

	addr := ":" + cfg.Port

	log.Printf("API gateway listening on %s → gRPC %s", addr, cfg.APIGRPCAddr)

	if err := e.Start(addr); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("gateway: %v", err)
	}

	return nil
}
