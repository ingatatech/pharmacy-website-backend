import "reflect-metadata";
import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import * as dotenv from "dotenv";
import { AppDataSource } from "./data-source";
import swaggerSpec from "./swagger";
import authRouter from "./routes/auth";
import servicesRouter from "./routes/services";
import productsRouter from "./routes/products";
import categoriesRouter from "./routes/categories";
import faqsRouter from "./routes/faqs";
import locationsRouter from "./routes/locations";
import articlesRouter from "./routes/articles";
import contactRouter from "./routes/contact";
import refillRouter from "./routes/refill";
import siteSettingsRouter from "./routes/site-settings";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/auth", authRouter);
app.use("/api/services", servicesRouter);
app.use("/api/products", productsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/faqs", faqsRouter);
app.use("/api/locations", locationsRouter);
app.use("/api/articles", articlesRouter);
app.use("/api/contact", contactRouter);
app.use("/api/prescription-refill", refillRouter);
app.use("/api/site-settings", siteSettingsRouter);

AppDataSource.initialize()
  .then(() => {
    console.log("Data Source has been initialized");
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`API docs available at http://localhost:${port}/api-docs`);
    });
  })
  .catch((error) => {
    console.error("Error during Data Source initialization:", error);
  });
