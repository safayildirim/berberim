package grpcclient

import (
	"context"
	"crypto/tls"
	"fmt"
	"os"
	"strings"

	berberimv1 "github.com/berberim/api/api/v1"
	"google.golang.org/api/idtoken"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/metadata"
)

// New creates a gRPC client connection to the berberim API and returns the client
// and the underlying connection (caller is responsible for closing it).
//
// addr must be in host:port format (e.g. "service.run.app:443" for Cloud Run,
// or "localhost:9091" for local development).
//
// When running in Cloud Run (K_SERVICE is set), TLS is used and every call
// carries a Cloud Run OIDC ID token. Locally, insecure credentials are used.
func New(env, addr string) (berberimv1.BerberimAPIClient, *grpc.ClientConn, error) {
	var opts []grpc.DialOption

	_, inCloudRun := os.LookupEnv("K_SERVICE")
	if !inCloudRun {
		opts = append(opts, grpc.WithTransportCredentials(insecure.NewCredentials()))
	} else {
		// Derive audience from addr: "host:443" → "https://host"
		host := strings.TrimSuffix(addr, ":443")
		audience := "https://" + host

		ts, err := idtoken.NewTokenSource(context.Background(), audience)
		if err != nil {
			return nil, nil, fmt.Errorf("grpcclient: oidc token source for %s: %w", audience, err)
		}

		opts = append(opts,
			grpc.WithTransportCredentials(credentials.NewTLS(&tls.Config{})),
			grpc.WithUnaryInterceptor(func(
				ctx context.Context,
				method string,
				req, reply any,
				cc *grpc.ClientConn,
				invoker grpc.UnaryInvoker,
				callOpts ...grpc.CallOption,
			) error {
				token, err := ts.Token()
				if err != nil {
					return fmt.Errorf("grpcclient: get oidc token: %w", err)
				}
				ctx = metadata.AppendToOutgoingContext(ctx, "authorization", "Bearer "+token.AccessToken)
				return invoker(ctx, method, req, reply, cc, callOpts...)
			}),
		)
	}

	conn, err := grpc.NewClient(addr, opts...)
	if err != nil {
		return nil, nil, err
	}
	return berberimv1.NewBerberimAPIClient(conn), conn, nil
}
