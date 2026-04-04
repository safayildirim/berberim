# Berberim

Berberim is an appointment booking and business management platform for barbershops and salons. Customers book appointments and track loyalty rewards through a mobile app, while shop owners and staff manage their operations through a separate management app.

For a detailed product overview see [docs/overview.md](docs/overview.md).

## Repository Structure

This is a monorepo with four components:

| Directory | Description |
|---|---|
| `api/` | Core backend — business logic, database, auth (Go, gRPC + HTTP) |
| `api-gateway/` | REST gateway — translates HTTP/JSON to gRPC (Go, Echo) |
| `tenant-app/` | Staff & admin mobile app (React Native / Expo) |
| `berberim-customer-app/` | Customer-facing mobile app (React Native / Expo) |

Request flow: **Mobile apps → api-gateway (REST) → api (gRPC) → PostgreSQL**

## Running the Full Stack

Requires Docker and Docker Compose.

```bash
# Generate RSA keys for JWT signing (first time only)
cd api && make gen-keys && cd ..

# Start everything (postgres, migrations, api, api-gateway)
docker compose up -d --build

# Full reset including database
docker compose down --volumes
```

The API gateway is available at `http://localhost:8080`.

## Development

### Backend (api/)

```bash
make build          # compile
make run            # run locally
make test           # run tests
make generate       # regenerate protobuf code
make migration-add NAME=add_foo   # scaffold a new migration
make migrate-up     # apply pending migrations
```

### API Gateway (api-gateway/)

```bash
make build
make run
make test
```

### Mobile Apps (tenant-app/ or berberim-customer-app/)

```bash
npm install
npx expo start      # start dev server
npm run typecheck   # type check
npm run test        # run tests
npm run lint        # lint
```

## Documentation

- [Product Overview](docs/overview.md)
- [Customer App](docs/customer-app.md)
- [Tenant App](docs/tenant-app.md)
