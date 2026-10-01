import "reflect-metadata";
import * as dotenv from "dotenv";
import { AppDataSource, initializeDb, closeDb } from "../src/db/data-source";

dotenv.config();

/**
 * Prints every SQL statement TypeORM believes is needed to make the live
 * database match the entity metadata.
 *
 * A correct entity set produces nothing here. Any output means an entity and
 * the real schema have drifted apart, which would silently change a column
 * type or drop a column as soon as a migration is generated.
 */
async function main() {
  await initializeDb();

  const schemaBuilder = AppDataSource.driver.createSchemaBuilder();
  const sqlInMemory = await schemaBuilder.log();

  const upQueries = sqlInMemory.upQueries
    .map((query) => query.query)
    .filter((query) => query && query.trim().length > 0);

  if (upQueries.length === 0) {
    console.log("OK: entities match the live schema exactly — no drift.");
  } else {
    console.log(`DRIFT: ${upQueries.length} statement(s) TypeORM would run:\n`);
    for (const query of upQueries) {
      console.log("---");
      console.log(query);
    }
  }

  await closeDb();
  process.exit(upQueries.length === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});