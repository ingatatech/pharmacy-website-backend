# Ingata Pharmacy

Full-stack pharmacy management application. Backend is a Node.js/Express/TypeORM API on PostgreSQL; frontend is a Next.js (App Router) app styled with Tailwind CSS.

## Stack

- **Backend:** Node.js, Express, TypeScript, TypeORM, PostgreSQL
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
- **Infra:** Docker, Docker Compose, GitHub Actions

## Project structure

```
ingata-pharmacy/
├── backend/    # Express API + TypeORM
├── frontend/   # Next.js app
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Run locally with Docker Compose

From the project root:

```bash
docker compose up --build
```

This starts three services:

- `postgres` — PostgreSQL 16, data persisted in the `postgres_data` volume
- `backend` — Express API at http://localhost:4000
- `frontend` — Next.js app at http://localhost:3000

Check the API is up: `curl http://localhost:4000/api/health`

To stop: `docker compose down` (add `-v` to also remove the Postgres volume).

## Run locally without Docker (development)

Requires a local PostgreSQL instance.

### Backend

```bash
cd backend
cp .env.example .env   # edit DB_* values to match your local Postgres
npm install
npm run dev             # http://localhost:4000
```

Other scripts: `npm run build`, `npm start`, `npm run typecheck`.

### Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev             # http://localhost:3000
```

Other scripts: `npm run build`, `npm start`, `npm run typecheck`.
