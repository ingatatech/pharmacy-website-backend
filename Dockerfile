FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=optional --fetch-retries=5 --fetch-retry-maxtimeout=120000
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev --omit=optional --fetch-retries=5 --fetch-retry-maxtimeout=120000
COPY --from=build /app/dist ./dist

# Migrations run from the compiled output rather than via `npm run db:migrate`,
# which needs ts-node — a devDependency this stage deliberately omits. The
# compiled DataSource globs `dist/db/migrations/*.js`, the same classes the
# ts-node CLI loads in development.
EXPOSE 4000
CMD ["sh", "-c", "npx typeorm migration:run -d dist/db/migrate-data-source.js && node dist/index.js"]