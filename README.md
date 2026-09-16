# Ingata Pharmacy — Backend

Node.js/Express/TypeORM API on PostgreSQL with JWT authentication and role-based authorization, for the Ingata Pharmacy application. The frontend lives in the separate [pharmacy-website-frontend](https://github.com/ingatatech/pharmacy-website-frontend) repo.

## Stack

- **Backend:** Node.js, Express, TypeScript, TypeORM, PostgreSQL, JWT auth, Swagger/OpenAPI docs
- **Infra:** Docker, Docker Compose, GitHub Actions

## Project structure

```
pharmacy-website-backend/
├── src/
│   ├── entities/       # TypeORM entities
│   ├── routes/         # Express route handlers
│   ├── middleware/     # auth, role-checking, rate limiting
│   ├── utils/          # JWT signing/verification
│   ├── data-source.ts  # TypeORM + Postgres connection
│   ├── swagger.ts      # OpenAPI spec config
│   ├── seed-admin.ts   # one-time admin user seed script
│   └── index.ts        # Express app entry point
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Data model

| Entity | Purpose |
|---|---|
| `User` | Admin / pharmacist-reviewer accounts (email, bcrypt password hash, role) |
| `Category` | Shared category taxonomy for services and products |
| `Service` | Pharmacy services (e.g. prescription refills, vaccinations) |
| `Product` | Catalog items (medications, OTC products) |
| `Article` | Editorial content with a draft → review → publish workflow |
| `Faq` | Published FAQ entries |
| `PharmacyLocation` | Branch locations, opening hours, offered services |
| `ContactInquiry` | Submissions from the public contact form |
| `RefillRequest` | Submissions from the public prescription refill form |

## API overview

Base URL: `http://localhost:4000/api`. Full interactive documentation (with a "try it out" console) is served at **`http://localhost:4000/api-docs`** once the backend is running.

| Resource | Public routes | Admin-only routes |
|---|---|---|
| `/auth` | `POST /login` | `GET /me` (any authenticated user) |
| `/services` | `GET /`, `GET /:slug` | `POST /`, `PATCH /:id`, `DELETE /:id` |
| `/products` | `GET /`, `GET /search?q=`, `GET /:slug` | `POST /`, `PATCH /:id`, `DELETE /:id` |
| `/categories` | `GET /` (`?type=service\|product`) | `POST /`, `PATCH /:id`, `DELETE /:id` |
| `/faqs` | `GET /` | `POST /`, `PATCH /:id`, `DELETE /:id` |
| `/locations` | `GET /` | `POST /`, `PATCH /:id`, `DELETE /:id` |
| `/articles` | `GET /`, `GET /:slug` (published only) | `GET /admin/all`, `POST /`, `PATCH /:id`, plus the workflow actions below |
| `/contact` | `POST /` (rate limited) | `GET /admin/all`, `PATCH /admin/:id` |
| `/prescription-refill` | `POST /` (rate limited) | `GET /admin/all`, `PATCH /admin/:id` |

**Article review workflow** (`/api/articles/:id/...`):

```
draft --submit-for-review--> pending_review --approve--> approved --publish--> published
                                    |
                                  reject
                                    v
                                  draft
```

- `submit-for-review` and `publish` require the **admin** role.
- `approve` and `reject` require the **pharmacist_reviewer** role — by design, an admin alone cannot approve or reject an article.

## Authentication & authorization

- Login via `POST /api/auth/login` with `{ email, password }` returns a JWT (8-hour expiry) and the user's public profile.
- Send the token on protected routes as `Authorization: Bearer <token>`.
- Two roles exist: `admin` and `pharmacist_reviewer`. Admin write routes require `admin`; article approve/reject require `pharmacist_reviewer`.
- Missing/invalid token → `401 { error: "Authentication required" }`. Wrong role → `403 { error: "You do not have permission to perform this action" }`.

## Rate limiting

The public `POST /api/contact` and `POST /api/prescription-refill` endpoints are limited to **5 requests per 15 minutes per IP**. Exceeding the limit returns `429 { error: "Too many requests. Please try again later." }`.

## Run locally with Docker Compose

From the project root:

```bash
docker compose up --build
```

This starts two services:

- `postgres` — PostgreSQL 16 on host port `5435`, data persisted in the `postgres_data` volume
- `backend` — Express API at http://localhost:4000 (docs at `/api-docs`)

To also run the frontend, clone [pharmacy-website-frontend](https://github.com/ingatatech/pharmacy-website-frontend) and run it separately (its own `docker compose up --build` or `npm run dev`), pointing `NEXT_PUBLIC_API_URL` at this backend.

Check the API is up: `curl http://localhost:4000/api/health`

> The backend's `JWT_SECRET` in `docker-compose.yml` is a placeholder. Replace it with a long random string before deploying anywhere real.

To stop: `docker compose down` (add `-v` to also remove the Postgres volume).

## Run locally without Docker (development)

Requires a local PostgreSQL instance (or run just the `postgres` service from Docker Compose: `docker compose up -d postgres`, exposed on host port `5435`).

```bash
cp .env.example .env   # edit DB_* to match your Postgres, and set a real JWT_SECRET
npm install
npm run dev             # http://localhost:4000
```

Generate a `JWT_SECRET` for local dev with: `openssl rand -hex 64` (or `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).

Create a test admin account (reads `admin@ingata.com` / `changeme123` by default — override with `npm run seed:admin -- <email> <password> <fullName>`):

```bash
npm run seed:admin
```

Other scripts: `npm run build`, `npm start`, `npm run typecheck`.

## Environment variables

**`.env`** (see `.env.example`):

| Variable | Purpose |
|---|---|
| `NODE_ENV` | `development` disables TypeORM's schema sync in `production` |
| `PORT` | Backend HTTP port (default `4000`) |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | PostgreSQL connection |
| `JWT_SECRET` | Signing secret for auth tokens — must be set, no default |
