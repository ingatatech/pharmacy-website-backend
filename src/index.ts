import * as dotenv from "dotenv";
dotenv.config();

import { app } from "./app";
import { prisma } from "./prisma";

const port = process.env.PORT || 4000;

prisma
  .$connect()
  .then(() => {
    console.log("Database connection established");
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`API docs available at http://localhost:${port}/api-docs`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to the database:", error);
  });
