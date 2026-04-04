package main

import (
	"os"

	"github.com/berberim/api/internal/server"
	"github.com/spf13/cobra"
)

func main() {
	root := &cobra.Command{
		Use:   "berberim-api",
		Short: "Berberim API: gRPC and HTTP servers",
	}

	root.AddCommand(serveCmd())
	root.AddCommand(httpCmd())
	root.AddCommand(grpcCmd())
	root.AddCommand(reminderWorkerCmd())
	root.SilenceUsage = true

	if len(os.Args) == 1 {
		os.Args = append(os.Args, "serve")
	}

	_ = root.Execute()
}

func serveCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "serve",
		Short: "Run both HTTP and gRPC servers",
		RunE: func(*cobra.Command, []string) error {
			return server.New().Run()
		},
	}
}

func httpCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "http",
		Short: "Run the HTTP server only",
		RunE: func(*cobra.Command, []string) error {
			return server.New().RunHTTP()
		},
	}
}

func grpcCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "grpc",
		Short: "Run the gRPC server only",
		RunE: func(*cobra.Command, []string) error {
			return server.New().RunGRPC()
		},
	}
}

func reminderWorkerCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "reminder-worker",
		Short: "Run notification reminder worker",
		RunE: func(*cobra.Command, []string) error {
			return server.New().RunReminderWorker()
		},
	}
}
