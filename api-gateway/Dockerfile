FROM golang:1.25-alpine AS builder
WORKDIR /app
COPY go.work .
COPY api/ api/
COPY api-gateway/ api-gateway/
WORKDIR /app/api-gateway
RUN go mod download
RUN go build -o /api-gateway ./cmd

FROM alpine:3.20
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=builder /api-gateway .
COPY --from=builder /app/api-gateway/config ./config
EXPOSE 8080
CMD ["./api-gateway", "server"]
