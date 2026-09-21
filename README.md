# Ingata Pharmacy — Backend

Node.js/Express/Prisma API on PostgreSQL with JWT authentication and role-based authorization, for the Ingata Pharmacy application. The frontend lives in the separate [pharmacy-website-frontend](https://github.com/ingatatech/pharmacy-website-frontend) repo.

## Stack

- **Backend:** Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, JWT auth, Swagger/OpenAPI docs
- **Infra:** Docker, Docker Compose, GitHub Actions

## Project structure

```
pharmacy-website-backend/
├── prisma/
│   ├── schema.prisma    # Prisma models — the single source of truth for the schema
│   └── migrations/      # versioned SQL migrations
├── prisma.config.ts     # Prisma CLI config (schema path, migrations path, datasource URL)
├── src/
│   ├── routes/          # Express route definitions (path + middleware -> controller)
│   ├── controllers/     # HTTP request/response handling
│   ├── services/        # business logic — the only layer that calls Prisma
│   ├── validators/      # Zod schemas for request bodies/params
│   ├── middleware/      # auth, role-checking, rate limiting, audit logging, validation, errors
│   ├── config/          # small runtime config modules (e.g. CORS)
│   ├── utils/           # JWT signing/verification, pagination, Prisma error helpers
│   ├── types/index.ts   # shared string-union types (roles, statuses, etc.)
│   ├── prisma.ts        # PrismaClient singleton (driver adapter + passwordHash omit)
│   ├── app.ts            # builds the Express app (no .listen()) — imported by both index.ts and the tests
│   ├── swagger.ts        # OpenAPI spec config
│   ├── seed-admin.ts     # one-time admin user seed script
│   └── index.ts          # entry point: connects Prisma, then app.listen()
├── tests/                # Vitest + Supertest integration tests (run against a separate test database)
├── vitest.config.ts
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Data model

Defined in `prisma/schema.prisma`. Enum-like fields (`role`, `status`, `type`, `availabilityStatus`) are plain `varchar` columns rather than native Postgres enums; their allowed values are typed as string-union types in `src/types/index.ts`.

| Model | Purpose |
|---|---|
| `User` | Every account — staff (`admin`, `pharmacist_reviewer`) and self-registered (`customer`) alike (email, bcrypt password hash, role) |
| `Category` | Shared category taxonomy for services and products |
| `Service` | Pharmacy services (e.g. prescription refills, vaccinations) |
| `Product` | Catalog items (medications, OTC products) |
| `Article` | Editorial content with a draft → review → publish workflow |
| `Faq` | Published FAQ entries |
| `PharmacyLocation` | Branch locations, opening hours, offered services |
| `ContactInquiry` | Submissions from the public contact form |
| `RefillRequest` | Submissions from the public prescription refill form |
| `SiteSetting` | Singleton record for corporate content: About Us, mission/vision/values, homepage hero copy, footer contact info, social links |
| `AuditLog` | Records every successful authenticated create/update/delete: actor, method, path, status code, timestamp |

## API overview

Base URL: `http://localhost:4000/api`. Full interactive documentation (with a "try it out" console) is served at **`http://localhost:4000/api-docs`** once the backend is running.

| Resource | Public routes | Admin-only routes |
|---|---|---|
| `/auth` | `POST /register` (rate limited, always creates a `customer` account), `POST /login` | `GET /me` (any authenticated user) |
| `/services` | `GET /`, `GET /:slug` | `POST /`, `PATCH /:id`, `DELETE /:id` |
| `/products` | `GET /`, `GET /search?q=`, `GET /:slug` | `POST /`, `PATCH /:id`, `DELETE /:id` |
| `/categories` | `GET /` (`?type=service\|product`), `GET /:slug` | `POST /`, `PATCH /:id`, `DELETE /:id` |
| `/faqs` | `GET /` | `POST /`, `PATCH /:id`, `DELETE /:id` |
| `/locations` | `GET /` | `POST /`, `PATCH /:id`, `DELETE /:id` |
| `/articles` | `GET /`, `GET /:slug` (published only) | `GET /admin/all`, `POST /`, `PATCH /:id`, plus the workflow actions below |
| `/contact` | `POST /` (rate limited) | `GET /admin/all`, `PATCH /admin/:id` |
| `/prescription-refill` | `POST /` (rate limited) | `GET /admin/all`, `PATCH /admin/:id` |
| `/site-settings` | `GET /` | `PATCH /` |
| `/audit-logs` | — | `GET /` |
| `/uploads` | — | `POST /` (multipart/form-data, field `image`) |
| `/admin/users` | — | `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id` — manage any account's role (admin/pharmacist_reviewer/customer) |

`GET /products`, `/services`, `/articles`, `/contact/admin/all` and `/prescription-refill/admin/all` accept optional `?page=`/`?limit=` (default limit 50, max 200) — omit both to get the full list as before. The total match count is returned in the `X-Total-Count` response header either way.

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
- Anyone can self-register via `POST /api/auth/register` — this always creates a `customer` account and logs them in immediately (same response shape as login). There is no way to request a different role through this endpoint; the request body doesn't even accept a `role` field.
- Send the token on protected routes as `Authorization: Bearer <token>`.
- Three roles exist: `admin` (full access, including managing other accounts), `pharmacist_reviewer` (can only approve/reject articles), and `customer` (no admin access at all — can only log in and browse the public API, same as an anonymous visitor). Admin write routes require `admin`; article approve/reject require `pharmacist_reviewer`.
- The **only** way any account's role is ever set to `admin` or `pharmacist_reviewer` is an existing admin calling `PATCH /api/admin/users/:id` — nothing else in the system can grant elevated access. An admin also cannot change their own role or delete their own account, so there's always at least one admin left.
- Missing/invalid token → `401 { error: "Authentication required" }`. Wrong role → `403 { error: "You do not have permission to perform this action" }`.

Every protected route follows the same middleware chain, in this order:

```
request -> authenticate (401 if no/invalid token)
        -> requireRole(...) (403 if wrong role)
        -> validateBody/validateParams (400 if invalid)
        -> controller -> service -> Prisma -> PostgreSQL
```

## Rate limiting

The public `POST /api/contact` and `POST /api/prescription-refill` endpoints are limited to **5 requests per 15 minutes per IP**. Exceeding the limit returns `429 { error: "Too many requests. Please try again later." }`. `POST /api/auth/register` has its own separate 5-per-15-minutes bucket (account creation is a higher-value abuse target, so it isn't allowed to share a budget with the other two). All rate limiting is disabled when `NODE_ENV=test`, so the automated test suite can exercise these endpoints repeatedly without tripping it.

## Run locally with Docker Compose

From the project root:

```bash
docker compose up --build
```

This starts two services:

- `postgres` — PostgreSQL 16 on host port `5435`, data persisted in the `postgres_data` volume
- `backend` — Express API at http://localhost:4000 (docs at `/api-docs`), uploaded images persisted in the `uploads_data` volume

To also run the frontend, clone [pharmacy-website-frontend](https://github.com/ingatatech/pharmacy-website-frontend) and run it separately (its own `docker compose up --build` or `npm run dev`), pointing `NEXT_PUBLIC_API_URL` at this backend.

Check the API is up: `curl http://localhost:4000/api/health`

> The backend's `JWT_SECRET` in `docker-compose.yml` is a placeholder. Replace it with a long random string before deploying anywhere real.

To stop: `docker compose down` (add `-v` to also remove the Postgres volume).

## Run locally without Docker (development)

Requires a local PostgreSQL instance (or run just the `postgres` service from Docker Compose: `docker compose up -d postgres`, exposed on host port `5435`).

```bash
cp .env.example .env    # edit DATABASE_URL to match your Postgres, and set a real JWT_SECRET
npm install              # postinstall runs `prisma generate`
npm run db:migrate       # applies prisma/migrations to your database (dev-mode, creates new migrations as needed)
npm run dev               # http://localhost:4000
```

Generate a `JWT_SECRET` for local dev with: `openssl rand -hex 64` (or `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).

Create a test admin account (reads `admin@ingata.com` / `changeme123` by default — override with `npm run seed:admin -- <email> <password> <fullName>`):

```bash
npm run seed:admin
```

Seed sample categories, services, products, FAQs, a branch location, site settings, and a published article (safe to re-run — skips any entity type that already has rows):

```bash
npm run seed:data
```

Other scripts: `npm run build` (runs `prisma generate` then `tsc`), `npm start`, `npm run typecheck`, `npm run db:deploy` (applies committed migrations without prompting — used in production/CI), `npm run db:studio` (Prisma Studio, a local DB browser UI).

Uploaded images (`POST /api/uploads`) are written to `./uploads` and served at `/uploads/<filename>`; the directory is created automatically and is gitignored.

## Automated testing

Tests are **integration/API tests**: Vitest drives Supertest, which sends real HTTP requests into the Express app (`src/app.ts`) and asserts on the actual response — status code and body — going all the way through validation, auth, the service layer, and a real Postgres database via Prisma. No mocking of Express or Prisma.

This is a deliberate choice over the two alternatives:

- **Unit tests** exercise one function in isolation (e.g. does `parsePagination` compute the right `skip`/`take`?), with everything around it mocked. Fast, but they don't prove the pieces work together.
- **Integration tests** (what this project uses) exercise several real layers together — here, the full route → validate → controller → service → Prisma → Postgres chain — with only the outermost boundary (the HTTP client) faked. This is the sweet spot for an API: it proves the actual contract (status codes, response shapes, auth rules) without the cost/flakiness of a full browser.
- **End-to-end (E2E) tests** drive the whole system as a real user would — a real browser against a real deployed frontend and backend. None exist here yet; they'd belong to the frontend repo once it has UI to click through.

**Setup (one-time):**

1. Create a separate database — never point tests at your dev database, since the suite freely creates and deletes rows:
   ```bash
   docker exec pharmacy-website-backend-postgres-1 psql -U postgres -c "CREATE DATABASE ingata_pharmacy_test;"
   ```
   (adjust the container name/credentials to match your own Postgres.)
2. Copy the test env template and point it at that database:
   ```bash
   cp .env.test.example .env.test
   ```

**Running tests:**

```bash
npm test         # runs the whole suite once and exits (used in CI)
npm run test:watch   # re-runs affected tests on file changes, for local development
```

`vitest.config.ts` loads `.env.test` and, via `globalSetup` (`tests/global-setup.ts`), runs `prisma migrate deploy` against it automatically before any test runs — so `npm test` alone keeps the test database's schema current, no manual migration step needed. As a safety net, that setup script refuses to run if `DATABASE_URL` doesn't contain the word "test", so a misconfigured `.env.test` can't accidentally wipe your real database.

`tests/setup.ts` seeds two known accounts (one `admin`, one `pharmacist_reviewer`) before each test file via `upsert`, so re-running the suite never fails on "already exists". Tests that create their own data (e.g. a category or a user) clean it up in `afterEach`/`afterAll`.

## Environment variables

**`.env`** (see `.env.example`):

| Variable | Purpose |
|---|---|
| `NODE_ENV` | `production`/`development` |
| `PORT` | Backend HTTP port (default `4000`) |
| `DATABASE_URL` | PostgreSQL connection string, e.g. `postgresql://user:pass@host:5432/db?schema=public` — read by both the app (`src/prisma.ts`) and the Prisma CLI (`prisma.config.ts`) |
| `JWT_SECRET` | Signing secret for auth tokens — must be set, no default |
| `FRONTEND_URL` | The only origin the API's CORS policy allows (see `src/config/cors.ts`). If unset, falls back to `http://localhost:3000` and logs a warning — set it explicitly before deploying anywhere real, e.g. `https://your-pharmacy-frontend.com` in production. |

**`.env.test`** (see `.env.test.example`) — same shape as `.env`, but `DATABASE_URL` must point at a separate database (its name must contain `test`). Used only by `npm test`/`npm run test:watch`, never by `npm run dev` or the deployed app.
