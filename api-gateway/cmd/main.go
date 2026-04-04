package main

import (
	"os"

	"github.com/spf13/cobra"
)

func main() {
	root := &cobra.Command{
		Use:   "api-gateway",
		Short: "Ledgra API gateway",
	}
	root.AddCommand(NewServerCmd())
	root.SilenceUsage = true

	if len(os.Args) == 1 {
		os.Args = append(os.Args, "server")
	}

	_ = root.Execute()
}
