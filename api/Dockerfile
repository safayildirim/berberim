FROM golang:1.25-alpine AS builder
WORKDIR /app
COPY go.work .
COPY api/ api/
COPY api-gateway/ api-gateway/
WORKDIR /app/api
RUN go mod download
RUN go build -o /berberim-api ./cmd/berberim/main.go

FROM alpine:3.20
RUN apk add --no-cache ca-certificates netcat-openbsd
WORKDIR /app
COPY --from=builder /berberim-api .
COPY --from=builder /app/api/config ./config
EXPOSE 8081 9091
CMD ["./berberim-api", "serve"]
