# PulseSupply

> **Enterprise Inventory & Order Management SaaS** — A portfolio-grade, production-quality multi-service system built for technical interview demonstration.

[![CI/CD](https://github.com/YOUR_GITHUB/pulsesupply/actions/workflows/deploy.yml/badge.svg)](https://github.com/YOUR_GITHUB/pulsesupply/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Nginx Reverse Proxy                      │
│               (SSL Termination · API Gateway)                │
└──────┬──────────────────────────────────┬───────────────────┘
       │                                  │
┌──────▼──────┐                  ┌────────▼────────┐
│  Frontend   │                  │  Order Service  │
│  Next.js    │                  │  Node/Express   │
│  → Nginx    │                  │  TypeScript     │
│  Alpine     │                  │  Prisma ORM     │
└─────────────┘                  └────────┬────────┘
                                          │
                         ┌────────────────┼────────────────┐
                         │                                  │
                 ┌───────▼───────┐              ┌───────────▼──────┐
                 │  PostgreSQL   │              │  Analytics Svc   │
                 │  postgres:16  │◄─────────────│  Python FastAPI  │
                 │  (db-net      │              │  BullMQ Worker   │
                 │   isolated)   │              └──────────────────┘
                 └───────────────┘                        │
                                              ┌───────────▼──────┐
                                              │      Redis       │
                                              │  Session Cache   │
                                              │  Task Queue      │
                                              └──────────────────┘
```

### Services

| Service | Technology Stack | Port (internal) |
|---|---|---|
| **Frontend** | Next.js 14 · Tailwind CSS · Recharts · Framer Motion | 80 |
| **Order & Auth Service** | Node.js 20 · Express · TypeScript · Prisma ORM | 4000 |
| **Analytics Engine** | Python 3.11 · FastAPI · SQLAlchemy · Background Workers | 8000 |
| **Database** | PostgreSQL 16 (db-net isolated) | 5432 |
| **Cache & Queue** | Redis 7.2 · BullMQ | 6379 |
| **Ingress** | Nginx 1.27 (SSL termination · reverse proxy) | 80, 443 |

### Docker Network Topology

```
frontend-net ─── nginx-proxy ─── frontend
backend-net  ─── nginx-proxy ─── order-service ─── analytics-service ─── redis
db-net       ─── order-service ─── analytics-service ─── postgres-db
                                            ↑ INTERNAL ONLY (no external traffic)
```

---

## 📁 Project Structure

```
PulseSupply/
├── .github/
│   └── workflows/
│       └── deploy.yml              # 4-job CI/CD pipeline
├── nginx/
│   ├── nginx.conf                  # Reverse proxy + SSL config
│   └── Dockerfile                  # Nginx gateway image
├── services/
│   ├── frontend/                   # Next.js app
│   │   ├── src/
│   │   │   ├── app/                # Next.js App Router
│   │   │   ├── components/         # React components
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── DashboardView.tsx
│   │   │   │   ├── OrdersView.tsx
│   │   │   │   ├── InventoryView.tsx
│   │   │   │   ├── AnalyticsView.tsx
│   │   │   │   ├── CreateOrderModal.tsx
│   │   │   │   └── AdjustStockModal.tsx
│   │   │   ├── lib/api.ts          # Unified API client
│   │   │   └── types/index.ts      # Shared TypeScript types
│   │   ├── Dockerfile              # Multi-stage: Next.js → Nginx Alpine
│   │   └── nginx.conf
│   ├── order-service/              # Node.js / Express API
│   │   ├── prisma/
│   │   │   └── schema.prisma       # PostgreSQL schema
│   │   ├── src/
│   │   │   ├── config/             # DB, Redis, app config
│   │   │   ├── controllers/        # Express request handlers
│   │   │   ├── middlewares/        # Auth, validation, error handling
│   │   │   ├── routes/             # Express routers
│   │   │   ├── services/           # Business logic layer
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── order.service.ts
│   │   │   │   ├── product.service.ts
│   │   │   │   └── queue.service.ts  # BullMQ dispatcher
│   │   │   ├── validators/         # Zod input schemas
│   │   │   ├── utils/
│   │   │   │   ├── errors.ts       # Typed error classes
│   │   │   │   └── logger.ts
│   │   │   ├── app.ts              # Express app factory
│   │   │   └── index.ts            # Server entry & graceful shutdown
│   │   ├── tests/
│   │   │   ├── auth.test.ts
│   │   │   └── order.test.ts
│   │   └── Dockerfile
│   └── analytics-service/          # Python FastAPI
│       ├── app/
│       │   ├── api/endpoints.py    # FastAPI route handlers
│       │   ├── schemas/analytics.py  # Pydantic response models
│       │   ├── services/
│       │   │   ├── analytics_service.py  # SQL metric queries
│       │   │   └── worker.py         # Background BullMQ consumer
│       │   ├── config.py
│       │   ├── database.py
│       │   ├── redis_client.py
│       │   └── main.py
│       ├── tests/
│       │   └── test_analytics.py
│       └── Dockerfile
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites

- **Docker Desktop** ≥ 4.25 and Docker Compose v2
- **Git**

### 1 — Clone and Configure Environment

```bash
git clone https://github.com/YOUR_GITHUB/pulsesupply.git
cd pulsesupply

# Copy and edit environment variables
cp .env.example .env
# Edit .env to set strong secrets before running
```

> **Important**: Change all default passwords and secrets in `.env` before running, especially `JWT_SECRET`, `POSTGRES_PASSWORD`, and `REDIS_PASSWORD`.

### 2 — Build and Start All Services

```bash
docker compose up --build -d
```

Docker Compose will:
1. Build all 4 service images (frontend, order-service, analytics-service, nginx-gateway)
2. Start PostgreSQL and wait for the healthcheck to pass
3. Start Redis and wait for the healthcheck to pass
4. Start the Order Service (which runs `prisma migrate deploy` on boot)
5. Start the Analytics Service
6. Start the Frontend
7. Start the Nginx gateway

### 3 — Seed the Database

```bash
docker compose exec order-service node dist/prisma/seed.js
```

This seeds:
- 2 user accounts (admin + staff)
- 5 medical supply products with realistic stock levels
- 1 sample supply order

### 4 — Access the Application

| Service | URL |
|---|---|
| **Frontend Dashboard** | https://localhost (self-signed cert) |
| **Order Service API** | https://localhost/api/v1 |
| **Analytics API** | https://localhost/api/v1/analytics |
| **FastAPI Swagger Docs** | http://localhost:8000/docs |
| **Order Service Health** | https://localhost/api/v1/auth/profile → after login |

> Accept the browser self-signed certificate warning (expected in local dev without a real cert).

---

## 🔑 API Reference

### Authentication

```bash
# Register a new user
curl -X POST https://localhost/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hospital.org","password":"SecurePass123!","firstName":"Sarah","lastName":"Connor","role":"ADMIN"}' \
  -k

# Login
curl -X POST https://localhost/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pulsesupply.io","password":"AdminPass2026!"}' \
  -k

# Returns: { "data": { "token": "eyJ..." } }
export TOKEN="<paste-token-here>"
```

### Products & Inventory

```bash
# List all products
curl -H "Authorization: Bearer $TOKEN" https://localhost/api/v1/products -k

# Create a product (ADMIN/MANAGER only)
curl -X POST https://localhost/api/v1/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sku":"TEST-001","name":"Test Device","category":"Medical Devices","unitPrice":999.99,"costPrice":600.00,"stockQuantity":50,"minStockThreshold":10}' -k

# Adjust stock (triggers BullMQ low-stock event if threshold crossed)
curl -X POST https://localhost/api/v1/products/{id}/stock-adjust \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quantity":-5,"type":"ADJUSTMENT","reason":"Damaged goods write-off"}' -k
```

### Orders

```bash
# Create supply order (atomic stock reservation + BullMQ event)
curl -X POST https://localhost/api/v1/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "City Medical Center",
    "customerEmail": "procurement@citymed.org",
    "items": [{"productId": "<product-uuid>", "quantity": 2}],
    "notes": "Urgent ICU restock"
  }' -k

# Update order status lifecycle (CONFIRMED → PROCESSING → SHIPPED → DELIVERED)
curl -X PATCH https://localhost/api/v1/orders/{id}/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"SHIPPED"}' -k
```

### Analytics Engine

```bash
# Executive KPI summary
curl https://localhost/api/v1/analytics/summary -k

# 7-day revenue trend
curl https://localhost/api/v1/analytics/sales-trend?days=7 -k

# Inventory valuation by category
curl https://localhost/api/v1/analytics/inventory-turnover -k

# Live low-stock alerts
curl https://localhost/api/v1/analytics/stock-alerts -k

# Order velocity metrics
curl https://localhost/api/v1/analytics/velocity -k
```

---

## 🧪 Running Tests

### Order & Auth Service (Jest)

```bash
# With a local PostgreSQL running (see .env.example for test DB config)
cd services/order-service
npm ci
npx prisma generate
npx prisma db push
npm test
```

### Analytics Service (Pytest)

```bash
cd services/analytics-service
pip install -r requirements.txt
pytest -v
```

### Run All Tests in Docker (CI Mode)

```bash
# Start just the dependency services
docker compose up postgres-db redis -d

# Order Service tests
docker compose run --rm order-service npm test

# Analytics Service tests
docker compose run --rm analytics-service pytest -v
```

---

## 🔄 CI/CD Pipeline (`.github/workflows/deploy.yml`)

The 4-stage GitHub Actions pipeline runs on every push to `main` and on version tags (`v*.*.*`):

```
Job 1: lint-and-audit
  ├─ ESLint (TypeScript order-service)
  ├─ Flake8 (Python analytics-service)
  ├─ Hadolint (all Dockerfiles)
  └─ Trivy CVE scan (base images)

Job 2: test (needs: lint-and-audit)
  ├─ Spin up PostgreSQL 16 service container
  ├─ Spin up Redis 7.2 service container
  ├─ Run Jest integration tests (order-service)
  └─ Run Pytest (analytics-service)

Job 3: build-and-push (needs: test, on push only)
  ├─ Set up QEMU + Docker Buildx
  ├─ Build linux/amd64 + linux/arm64 images
  ├─ Tag with git SHA and semver (from tag)
  └─ Push to GitHub Container Registry (ghcr.io)

Job 4: deploy (needs: build-and-push, main branch or tag only)
  ├─ SSH into production VM
  ├─ docker compose pull (new images)
  └─ docker compose up -d --remove-orphans (rolling restart)
```

### Required GitHub Secrets

Set these in your repository under **Settings → Secrets and variables → Actions**:

| Secret | Description |
|---|---|
| `DEPLOY_SSH_HOST` | IP or hostname of your production server |
| `DEPLOY_SSH_USER` | SSH username (e.g., `ubuntu`) |
| `DEPLOY_SSH_KEY` | Private SSH key content (RSA or ED25519) |
| `DEPLOY_SSH_PORT` | SSH port (default: 22) |
| `GITHUB_TOKEN` | Automatically provided by GitHub Actions |

---

## ☁️ Production Deployment (Cloud VM)

### On Your Server (AWS EC2 / DigitalOcean Droplet)

```bash
# Install Docker & Compose plugin
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Clone repository to server
git clone https://github.com/YOUR_GITHUB/pulsesupply.git /opt/pulsesupply
cd /opt/pulsesupply

# Configure production environment
cp .env.example .env
nano .env   # Set strong secrets and your domain name

# First deployment
docker compose pull
docker compose up -d
docker compose exec order-service node dist/prisma/seed.js
```

### Setting Up Real SSL (Certbot / Let's Encrypt)

```bash
# Install certbot
sudo apt install certbot

# Obtain certificate
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates to nginx/certs/
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/certs/server.crt
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/certs/server.key
sudo chmod 644 nginx/certs/*.crt nginx/certs/*.key

# Restart nginx
docker compose restart nginx-proxy
```

### Renewing Certificates Automatically

```bash
# Add to crontab (runs twice daily)
0 12 * * * certbot renew --quiet && \
  cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/pulsesupply/nginx/certs/server.crt && \
  cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /opt/pulsesupply/nginx/certs/server.key && \
  docker compose -f /opt/pulsesupply/docker-compose.yml restart nginx-proxy
```

---

## 🔐 Security Design

| Layer | Control |
|---|---|
| **TLS** | Nginx terminates HTTPS with TLS 1.2/1.3 only |
| **Network** | 3 isolated bridge networks; `db-net` is `internal: true` |
| **Containers** | All services run as non-root users (UID 1001) |
| **Auth** | JWT-based with configurable expiry; bcrypt password hashing |
| **Input** | Zod schema validation (Node) + Pydantic models (Python) |
| **Headers** | Helmet.js (Node) + security headers in Nginx |
| **Secrets** | Environment variables only; never committed to Git |
| **Redis** | Password-protected with `requirepass`; AOF persistence |

---

## 🛠️ Development Workflow

### Local Order Service (without Docker)

```bash
cd services/order-service
cp ../../.env.example .env
# Edit .env to point DATABASE_URL/REDIS_URL to localhost
npm install
npx prisma generate
npx prisma db push
npm run dev      # ts-node-dev with hot reload
```

### Local Analytics Service (without Docker)

```bash
cd services/analytics-service
python -m venv .venv
source .venv/Scripts/activate   # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Local Frontend (without Docker)

```bash
cd services/frontend
npm install
npm run dev      # http://localhost:3000
```

---

## 🗄️ Data Model (Prisma Schema)

```
User           Order              Product
─────          ──────             ───────
id             id                 id
email          orderNumber (uniq) sku (uniq)
passwordHash   customerName       name
firstName      customerEmail      category
lastName       status             unitPrice
role           totalAmount        costPrice
               notes              stockQuantity
               items[]            minStockThreshold
                                  status
                                  stockMovements[]

OrderItem      StockMovement
─────────      ─────────────
orderId        productId
productId      type (RESTOCK | ORDER_DEDUCTION | RETURN | ADJUSTMENT)
quantity       quantity
unitPrice      previousStock
totalPrice     newStock
               referenceId
```

---

## 📊 BullMQ Queue Event Flow

```
Order Created ──────► analyticsQueue ──────► Analytics Worker
                                              ├─ Increments velocity counter
                                              └─ Updates Redis KPI cache

Stock Deducted ─────► Check threshold
                        └─ Below min? ──────► stockAlertQueue ──────► Alert Worker
                                                                        ├─ Logs critical alert
                                                                        └─ Pushes to Redis recent_alerts list
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit with conventional commits: `git commit -m "feat(orders): add bulk status update endpoint"`
4. Push and open a pull request against `main`
5. The CI pipeline must pass all 4 jobs before merge

---

## 📝 License

MIT © PulseSupply DevOps Team

