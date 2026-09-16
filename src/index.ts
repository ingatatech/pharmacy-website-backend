import "reflect-metadata";
import path from "path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import * as dotenv from "dotenv";
import { AppDataSource } from "./data-source";
import swaggerSpec from "./swagger";
import { auditLog } from "./middleware/auditLog";
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
import auditLogsRouter from "./routes/audit-logs";
import uploadsRouter from "./routes/uploads";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(helmet());
// FRONTEND_URL restricts CORS to the deployed frontend; unset (e.g. local dev) allows any origin.
app.use(cors({ origin: process.env.FRONTEND_URL || true }));
app.use(express.json());
app.use(auditLog);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

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
app.use("/api/audit-logs", auditLogsRouter);
app.use("/api/uploads", uploadsRouter);

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
