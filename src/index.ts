import { app } from "./app";
import { initializeDb } from "./db/data-source";

const port = process.env.PORT || 4000;

initializeDb()
  .then(() => {
    console.log("Database connection established");
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      if (process.env.NODE_ENV !== "production" || process.env.ENABLE_DOCS === "true") {
        console.log(`API docs available at http://localhost:${port}/api-docs`);
      }
    });
  })
  .catch((error) => {
    console.error("Error connecting to the database:", error);
    process.exit(1);
  });