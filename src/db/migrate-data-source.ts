import "reflect-metadata";
import * as path from "path";
import { DataSource } from "typeorm";
import { dataSourceOptions } from "./data-source";

/**
 * DataSource used *only* by the TypeORM CLI (`npm run db:migrate` /
 * `npm run db:revert`), never by the running app.
 *
 * The app's AppDataSource deliberately carries no `migrations` glob. A glob is
 * expanded when the DataSource initializes, so leaving it in place made every
 * server process and every test worker import the migration classes at
 * startup — work they never need, and a hard failure under Vitest, which
 * loads them as ESM while typeorm is CommonJS.
 *
 * Exported as the sole default export because the TypeORM CLI rejects a `-d`
 * file that exports more than one DataSource instance.
 */
export default new DataSource({
  ...dataSourceOptions,
  // `.ts` when running via ts-node, `.js` once compiled into dist/.
  migrations: [path.join(__dirname, "migrations/*.{ts,js}")],
  migrationsTableName: "migrations",
});