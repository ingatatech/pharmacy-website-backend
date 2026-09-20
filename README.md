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
│   ├── routes/          # Express route handlers
│   ├── middleware/      # auth, role-checking, rate limiting, audit logging
│   ├── utils/           # JWT signing/verification, pagination, Prisma error helpers
│   ├── types.ts         # shared string-union types (roles, statuses, etc.)
│   ├── prisma.ts        # PrismaClient singleton (driver adapter + passwordHash omit)
│   ├── swagger.ts       # OpenAPI spec config
│   ├── seed-admin.ts    # one-time admin user seed script
│   └── index.ts         # Express app entry point
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Data model

Defined in `prisma/schema.prisma`. Enum-like fields (`role`, `status`, `type`, `availabilityStatus`) are plain `varchar` columns rather than native Postgres enums; their allowed values are typed as string-union types in `src/types.ts`.

| Model | Purpose |
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
| `SiteSetting` | Singleton record for corporate content: About Us, mission/vision/values, homepage hero copy, footer contact info, social links |
| `AuditLog` | Records every successful authenticated create/update/delete: actor, method, path, status code, timestamp |

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
| `/site-settings` | `GET /` | `PATCH /` |
| `/audit-logs` | — | `GET /` |
| `/uploads` | — | `POST /` (multipart/form-data, field `image`) |

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

## Environment variables

**`.env`** (see `.env.example`):

| Variable | Purpose |
|---|---|
| `NODE_ENV` | `production`/`development` |
| `PORT` | Backend HTTP port (default `4000`) |
| `DATABASE_URL` | PostgreSQL connection string, e.g. `postgresql://user:pass@host:5432/db?schema=public` — read by both the app (`src/prisma.ts`) and the Prisma CLI (`prisma.config.ts`) |
| `JWT_SECRET` | Signing secret for auth tokens — must be set, no default |
| `FRONTEND_URL` | Restricts CORS to this origin; unset allows any origin (e.g. local dev) |
