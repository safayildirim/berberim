BINARY := berberim-api
MAIN   := ./cmd/berberim/main.go

MIGRATE_DB := postgres://postgres:postgres@postgres:5432/berberim?sslmode=disable
_MIG_DIR := $(dir $(lastword $(MAKEFILE_LIST)))
MIGRATION_NEXT := $(shell cd $(_MIG_DIR) && (ls migrations/*.up.sql 2>/dev/null | sed 's/.*\///;s/_.*//' | sort -n | tail -1 | awk '{print $$1+1}') || echo 1)
MIGRATION_PAD  := $(shell printf "%03d" $(MIGRATION_NEXT))

.PHONY: all build run test test-race tidy clean generate gen-keys seed

all: build

build:
	go build -o bin/$(BINARY) $(MAIN)

run:
	go run $(MAIN)

test:
	go test ./... -v -count=1

test-race:
	go test ./... -v -count=1 -race

test-integration:
	go test ./... -v -count=1 -tags=integration

tidy:
	go mod tidy

clean:
	rm -rf bin/

generate:
	buf generate

gen-keys:
	@mkdir -p keys
	@openssl genrsa -out keys/private.pem 2048
	@echo "Generated keys/private.pem"

generate-mocks:
	$(shell go env GOPATH)/bin/mockery

docker-up:
	docker compose down
	docker compose up -d --build

reset:
	docker compose down
	docker compose up -d --build

reset-force:
	docker compose down --volumes
	docker compose up -d --build

# Usage: make migration-add NAME=add_foo_table
migration-add:
	@test -n "$(NAME)" || (echo "Usage: make migration-add NAME=<snake_case_name>"; exit 1)
	@touch migrations/$(MIGRATION_PAD)_$(NAME).up.sql migrations/$(MIGRATION_PAD)_$(NAME).down.sql
	@echo "Created migrations/$(MIGRATION_PAD)_$(NAME).up.sql and migrations/$(MIGRATION_PAD)_$(NAME).down.sql"

migrate-up:
	docker compose run --rm migrate -path /migrations -database "$(MIGRATE_DB)" up

migrate-down:
	docker compose run --rm migrate -path /migrations -database "$(MIGRATE_DB)" down

seed:
	docker compose exec postgres psql -U postgres -d berberim -f /dev/stdin < seeds/example.sql