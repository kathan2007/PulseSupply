##
# PulseSupply — Developer Makefile
# Provides convenient shortcuts for common operations.
# Usage: make <target>
##

.DEFAULT_GOAL := help

COMPOSE      := docker compose
COMPOSE_PROD := docker compose -f docker-compose.yml
ORDER_SVC    := order-service
ANALYTICS    := analytics-service

.PHONY: help up down build logs seed test-order test-analytics test-all ps clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-18s\033[0m %s\n", $$1, $$2}'

up: ## Build and start all services (dev mode with hot-reload)
	$(COMPOSE) up --build -d
	@echo "\n✅ PulseSupply running:"
	@echo "   Dashboard → https://localhost (accept self-signed cert)"
	@echo "   API Docs  → http://localhost:8000/docs"

down: ## Stop and remove all containers
	$(COMPOSE) down

build: ## Rebuild all images without cache
	$(COMPOSE) build --no-cache

logs: ## Tail logs from all services
	$(COMPOSE) logs -f --tail=100

logs-order: ## Tail logs for order-service only
	$(COMPOSE) logs -f --tail=100 $(ORDER_SVC)

logs-analytics: ## Tail logs for analytics-service only
	$(COMPOSE) logs -f --tail=100 $(ANALYTICS)

seed: ## Seed the database with initial products, users, and sample orders
	$(COMPOSE) exec $(ORDER_SVC) node dist/prisma/seed.js

migrate: ## Run Prisma migrations
	$(COMPOSE) exec $(ORDER_SVC) npx prisma migrate deploy

studio: ## Open Prisma Studio (database GUI)
	cd services/order-service && npx prisma studio

test-order: ## Run order-service Jest tests
	cd services/order-service && npm test

test-analytics: ## Run analytics-service Pytest suite
	cd services/analytics-service && python -m pytest -v

test-all: test-order test-analytics ## Run all tests

ps: ## Show running containers and health status
	$(COMPOSE) ps

shell-order: ## Open a shell inside the order-service container
	$(COMPOSE) exec $(ORDER_SVC) sh

shell-analytics: ## Open a shell inside the analytics-service container
	$(COMPOSE) exec $(ANALYTICS) bash

clean: ## Remove all containers, volumes, and local images
	$(COMPOSE) down -v --rmi local
	@echo "🧹 Cleaned containers, volumes and local images."

prod-deploy: ## Pull and restart in production (no override file)
	$(COMPOSE_PROD) pull
	$(COMPOSE_PROD) up -d --remove-orphans

