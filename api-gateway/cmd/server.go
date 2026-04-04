package main

import (
	apigateway "github.com/berberim/api-gateway/internal"
	"github.com/spf13/cobra"
)

func NewServerCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "server",
		Short: "Run the api-gateway HTTP server",
		RunE:  runServer,
	}
}

func runServer(*cobra.Command, []string) error {
	return apigateway.Start()
}
