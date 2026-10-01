import "reflect-metadata";
import * as dotenv from "dotenv";
import { DataSource, EntityTarget, ObjectLiteral, Repository } from "typeorm";
import { entities } from "./entities";

dotenv.config();

/**
 * Connection options shared by the app's DataSource and the migration CLI's
 * DataSource, so the two can never drift apart.
 *
 * `synchronize` is permanently false: the schema is owned by the migrations in
 * ./migrations, never by entity metadata. That keeps a stray entity edit from
 * silently dropping a column on startup.
 *
 * Note there is deliberately no `migrations` glob here — see ./migrate-data-source.
 *
 * Table names are snake_case but column names are camelCase (both are what the
 * existing database already uses), so the entity decorators carry the exact
 * names and TypeORM's default column naming — which reuses the property name —
 * is correct here. A snake_case naming strategy would break every column.
 */
export const dataSourceOptions = {
  type: "postgres" as const,
  url: process.env.DATABASE_URL,
  entities,
  synchronize: false,
  logging: process.env.DB_LOGGING === "true",
};

export const AppDataSource = new DataSource(dataSourceOptions);

export async function initializeDb(): Promise<DataSource> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  return AppDataSource;
}

export async function closeDb(): Promise<void> {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
}

/**
 * Repository accessor for services. Resolved per call rather than captured at
 * module load, so a service module can be imported before the DataSource has
 * connected (which is what the test harness does).
 */
export function repo<T extends ObjectLiteral>(entity: EntityTarget<T>): Repository<T> {
  if (!AppDataSource.isInitialized) {
    throw new Error(
      "Database is not initialized. Call initializeDb() during app/test startup.",
    );
  }
  return AppDataSource.getRepository<T>(entity);
}