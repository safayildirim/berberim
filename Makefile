.PHONY: up down api gateway customer tenant test

# ── Docker ────────────────────────────────────────────────────────────────────
up:
	docker compose up -d --build

down:
	docker compose down

reset:
	docker compose down
	docker compose up -d --build

reset-force:
	docker compose down --volumes
	docker compose up -d --build

# ── Local dev ─────────────────────────────────────────────────────────────────
api:
	cd api && make run

gateway:
	cd api-gateway && make run

customer:
	cd customer-app && npx expo start

tenant:
	cd tenant-app && npx expo start

# ── Test ──────────────────────────────────────────────────────────────────────
test:
	cd api && make test
	cd api-gateway && make test
