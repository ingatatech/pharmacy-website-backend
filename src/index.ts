import path from "path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import * as dotenv from "dotenv";
import { prisma } from "./prisma";
import swaggerSpec from "./swagger";
import { auditLog } from "./middleware/auditLog.middleware";
import authRouter from "./routes/auth.routes";
import serviceRouter from "./routes/service.routes";
import productRouter from "./routes/product.routes";
import categoryRouter from "./routes/category.routes";
import faqRouter from "./routes/faq.routes";
import locationRouter from "./routes/location.routes";
import articleRouter from "./routes/article.routes";
import contactRouter from "./routes/contact.routes";
import refillRouter from "./routes/refill.routes";
import siteSettingRouter from "./routes/site-setting.routes";
import auditLogRouter from "./routes/audit-log.routes";
import uploadRouter from "./routes/upload.routes";

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
app.use("/api/services", serviceRouter);
app.use("/api/products", productRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/faqs", faqRouter);
app.use("/api/locations", locationRouter);
app.use("/api/articles", articleRouter);
app.use("/api/contact", contactRouter);
app.use("/api/prescription-refill", refillRouter);
app.use("/api/site-settings", siteSettingRouter);
app.use("/api/audit-logs", auditLogRouter);
app.use("/api/uploads", uploadRouter);

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
