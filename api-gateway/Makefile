BINARY := api-gateway
MAIN   := ./cmd/main.go

.PHONY: all build run test test-race tidy clean generate

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

generate-mocks:
	$(shell go env GOPATH)/bin/mockery

docker-up:
	docker compose up -d --build

reset:
	docker compose down
	docker compose up -d --build
