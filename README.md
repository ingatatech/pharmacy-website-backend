# Ingata Pharmacy — Backend

Node.js/Express/TypeORM API on PostgreSQL with JWT authentication and role-based authorization, for the Ingata Pharmacy application. The frontend lives in the separate [pharmacy-website-frontend](https://github.com/ingatatech/pharmacy-website-frontend) repo.

## Stack

- **Backend:** Node.js, Express, TypeScript, TypeORM, PostgreSQL, JWT auth, Swagger/OpenAPI docs
- **Infra:** Docker, Docker Compose, GitHub Actions

## Project structure

```
pharmacy-website-backend/
├── src/
│   ├── db/
│   │   ├── data-source.ts        # shared DataSource + initializeDb()/closeDb()/repo()
│   │   ├── migrate-data-source.ts# DataSource used only by the TypeORM CLI (adds the migrations glob)
│   │   ├── entities/             # one entity per table — the schema's source of truth
│   │   ├── migrations/           # versioned SQL migrations
│   │   └── errors.ts             # NotFoundError, SQLSTATE mapping, affected-row helpers
│   ├── routes/          # Express route definitions (path + middleware -> controller)
│   ├── controllers/     # HTTP request/response handling
│   ├── services/        # business logic — the only layer that touches the database
│   ├── validators/      # Zod schemas for request bodies/params
│   ├── middleware/      # auth, role-checking, rate limiting, audit logging, validation, errors
│   ├── config/          # small runtime config modules (e.g. CORS)
│   ├── utils/           # JWT signing/verification, pagination
│   ├── types/index.ts   # shared string-union types (roles, statuses, etc.)
│   ├── app.ts            # builds the Express app (no .listen()) — imported by both index.ts and the tests
│   ├── swagger.ts        # OpenAPI spec config
│   ├── seed-admin.ts     # one-time admin user seed script
│   └── index.ts          # entry point: connects the database, then app.listen()
├── tests/                # Vitest + Supertest integration tests (run against a separate test database)
├── vitest.config.ts
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Data model

Defined by the entities in `src/db/entities/`. Enum-like fields (`role`, `status`, `type`, `availabilityStatus`) are plain `varchar` columns rather than native Postgres enums; their allowed values are typed as string-union types in `src/types/index.ts`.

Table names are snake_case and column names are camelCase — both are what the existing database already uses, so the entity decorators carry the explicit names and no naming strategy is configured. A naming strategy here would break every column.

`synchronize` is permanently `false`: the schema is owned by `src/db/migrations/` and never by entity metadata, so a stray entity edit cannot silently drop a column on startup.

| Table | Purpose |
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
| `AuditLog` | Records every successful staff (`admin`/`pharmacist_reviewer`) create/update/delete: actor, method, path, status code, timestamp. A logged-in `customer` submitting a public form is deliberately **not** logged here — this is a staff-accountability trail, not a record of routine customer activity. |

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
| `/contact` | `POST /` (rate limited), `GET /mine`\* | `GET /admin/all`, `PATCH /admin/:id` |
| `/prescription-refill` | `POST /` (rate limited), `GET /mine`\* | `GET /admin/all`, `PATCH /admin/:id` |
| `/site-settings` | `GET /` | `PATCH /` |
| `/audit-logs` | — | `GET /` |
| `/uploads` | — | `POST /` (multipart/form-data, field `image`) |
| `/admin/users` | — | `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id` — manage any account's role (admin/pharmacist_reviewer/customer) |

`GET /products`, `/services`, `/articles`, `/contact/admin/all` and `/prescription-refill/admin/all` accept optional `?page=`/`?limit=` (default limit 50, max 200) — omit both to get the full list as before. The total match count is returned in the `X-Total-Count` response header either way.

\* `GET /contact/mine` and `GET /prescription-refill/mine` require authentication but not any particular role — any logged-in account (including `customer`) can see their own past submissions. `POST /contact` and `POST /prescription-refill` still work without an account exactly as before; if the caller happens to send a valid token, the submission is additionally linked to that account (via a nullable `userId`) so it shows up in `/mine` — this never gates or changes the anonymous flow.

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
        -> controller -> service -> TypeORM -> PostgreSQL
```

## Rate limiting

The public `POST /api/contact` and `POST /api/prescription-refill` endpoints are limited to **5 requests per 15 minutes per IP**. Exceeding the limit returns `429 { error: "Too many requests. Please try again later." }`. `POST /api/auth/register` has its own separate 5-per-15-minutes bucket (account creation is a higher-value abuse target, so it isn't allowed to share a budget with the other two). `POST /api/auth/login` has its own bucket too, at **10 requests per 15 minutes per IP** — slightly more generous than the others since legitimate users mistype passwords, but still enough to make brute-forcing a password from one IP impractical. All rate limiting is disabled when `NODE_ENV=test`, so the automated test suite can exercise these endpoints repeatedly without tripping it.

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
npm install              # installs dependencies; there is no code-generation step
npm run db:migrate       # applies pending TypeORM migrations to your database
npm run dev               # http://localhost:4000
```

Generate a `JWT_SECRET` for local dev with: `openssl rand -hex 64` (or `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).

Create the first admin account. This is the **only** way an admin is created — no API endpoint can create or promote one. Email and full name are optional arguments; the password is never passed on the command line:

```bash
# Prompted for the password (input is hidden) — recommended when running by hand:
npm run seed:admin -- admin@ingata.com "Ingata Admin"

# Or supply it through the environment, e.g. for a scripted/unattended setup:
ADMIN_PASSWORD='a-long-random-password' npm run seed:admin -- admin@ingata.com "Ingata Admin"
```

On Windows PowerShell:
```powershell
$env:ADMIN_PASSWORD = 'a-long-random-password'; npm run seed:admin -- admin@ingata.com "Ingata Admin"
```

Defaults are email `admin@ingata.com` and name `Ingata Admin`. The password is required (minimum 8 characters) and is read from the `ADMIN_PASSWORD` environment variable or an interactive prompt. If an account with that email already exists the script makes no changes — it never overwrites an existing admin. When `DATABASE_URL` points at a remote host (such as Render), the script connects over SSL automatically.

Seed sample categories, services, products, FAQs, a branch location, site settings, and a published article (safe to re-run — skips any entity type that already has rows):

```bash
npm run seed:data
```

Other scripts: `npm run build` (plain `tsc`), `npm start`, `npm run typecheck`, `npm run db:verify` (prints the SQL TypeORM would need to make the live database match the entities — should print nothing but `OK`), `npm run db:revert`, `npm run test`, `npm run test:watch`, and the `seed:*` scripts. There is no Studio equivalent — use `psql` or a GUI client against your own database.

To create a new migration after changing an entity:

```bash
npm run db:migrate:generate -- src/db/migrations/AddSomething.ts
```

Then edit the generated file if needed, apply it with `npm run db:migrate`, and confirm with `npm run db:verify` that the entities and the live schema still agree exactly.

Migrations run through `ts-node` in development. In the Docker image they run from the compiled output instead (`typeorm migration:run -d dist/db/migrate-data-source.js`), because `ts-node` is a devDependency that the runtime image deliberately omits.

Uploaded images (`POST /api/uploads`) are written to `./uploads` and served at `/uploads/<filename>`; the directory is created automatically and is gitignored.

## Automated testing

Tests are **integration/API tests**: Vitest drives Supertest, which sends real HTTP requests into the Express app (`src/app.ts`) and asserts on the actual response — status code and body — going all the way through validation, auth, the service layer, and a real Postgres database via TypeORM. No mocking of Express or the database.

This is a deliberate choice over the two alternatives:

- **Unit tests** exercise one function in isolation (e.g. does `parsePagination` compute the right `skip`/`take`?), with everything around it mocked. Fast, but they don't prove the pieces work together.
- **Integration tests** (what this project uses) exercise several real layers together — here, the full route → validate → controller → service → TypeORM → Postgres chain — with only the outermost boundary (the HTTP client) faked. This is the sweet spot for an API: it proves the actual contract (status codes, response shapes, auth rules) without the cost/flakiness of a full browser.
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

`vitest.config.ts` loads `.env.test` and, via `globalSetup` (`tests/global-setup.ts`), runs pending TypeORM migrations against it automatically before any test runs — so `npm test` alone keeps the test database's schema current, no manual migration step needed. As a safety net, that setup script refuses to run if `DATABASE_URL` doesn't contain the word "test", so a misconfigured `.env.test` can't accidentally wipe your real database.

It shells out to `npm run db:migrate` in a child process rather than running the migrations in-process. Vitest transforms test files as ES modules, and the migrations use the CommonJS-style `export default` DataSource convention the TypeORM CLI requires; keeping that in a separate `ts-node` process avoids the two loaders meeting in the same runtime. For the same reason `src/db/data-source.ts` (used by the app and the tests) never lists migration classes, and only `src/db/migrate-data-source.ts` does.

`tests/setup.ts` seeds two known accounts (one `admin`, one `pharmacist_reviewer`) before each test file via `upsert`, so re-running the suite never fails on "already exists". Tests that create their own data (e.g. a category or a user) clean it up in `afterEach`/`afterAll`.

## Environment variables

**`.env`** (see `.env.example`):

| Variable | Purpose |
|---|---|
| `NODE_ENV` | `production`/`development` |
| `PORT` | Backend HTTP port (default `4000`) |
| `DATABASE_URL` | PostgreSQL connection string, e.g. `postgresql://user:pass@host:5432/db?schema=public` — read by `src/db/data-source.ts` at runtime and by `src/db/migrate-data-source.ts` for the migration CLI |
| `JWT_SECRET` | Signing secret for auth tokens — must be set, no default |
| `FRONTEND_URL` | Comma-separated allowlist of browser origins the API's CORS policy trusts (see `src/config/cors.ts`), e.g. `https://your-pharmacy-frontend.vercel.app`. Include the scheme and no trailing slash; a `https://*.domain` entry allows any subdomain. In development `http://localhost:3000` is allowed regardless; in production only this list is trusted, so set it explicitly before deploying. |
| `ADMIN_PASSWORD` | Used only by `npm run seed:admin`. If unset, the script prompts for the password interactively (input hidden). Never pass it on the command line. |
| `ENABLE_DOCS` | Set to `true` to serve the Swagger UI at `/api-docs` when `NODE_ENV=production`. Outside production the docs are always served. |

**`.env.test`** (see `.env.test.example`) — same shape as `.env`, but `DATABASE_URL` must point at a separate database (its name must contain `test`). Used only by `npm test`/`npm run test:watch`, never by `npm run dev` or the deployed app.
