import "express-async-errors";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger";
import { auditLog } from "./middleware/auditLog.middleware";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { corsOptions } from "./config/cors";
import authRouter from "./routes/auth.routes";
import serviceRouter from "./routes/service.routes";
import productRouter from "./routes/product.routes";
import categoryRouter from "./routes/category.routes";
import faqRouter from "./routes/faq.routes";
import testimonialRouter from "./routes/testimonial.routes";
import locationRouter from "./routes/location.routes";
import teamRouter from "./routes/team.routes";
import scheduleRouter from "./routes/schedule.routes";
import articleRouter from "./routes/article.routes";
import pharmacistRouter from "./routes/pharmacist.routes";
import contactRouter from "./routes/contact.routes";
import refillRouter from "./routes/refill.routes";
import siteSettingRouter from "./routes/site-setting.routes";
import auditLogRouter from "./routes/audit-log.routes";
import uploadRouter from "./routes/upload.routes";
import userRouter from "./routes/user.routes";

// Builds and configures the Express app, but never calls app.listen().
// Kept separate from index.ts so tests can import this file with Supertest
// (which starts its own throwaway server per test) instead of accidentally
// binding a second real server on PORT every time the test suite runs.
export const app = express();

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(auditLog);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// The interactive API docs are a development aid, so they are served unless
// the process is running in production. Set ENABLE_DOCS=true to expose them in
// production as well (e.g. for a demo), otherwise the route simply 404s.
const docsEnabled = process.env.NODE_ENV !== "production" || process.env.ENABLE_DOCS === "true";
if (docsEnabled) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

app.use("/api/auth", authRouter);
app.use("/api/services", serviceRouter);
app.use("/api/products", productRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/faqs", faqRouter);
app.use("/api/testimonials", testimonialRouter);
app.use("/api/locations", locationRouter);
app.use("/api/team", teamRouter);
app.use("/api/schedule", scheduleRouter);
app.use("/api/articles", articleRouter);
app.use("/api/pharmacist", pharmacistRouter);
app.use("/api/contact", contactRouter);
app.use("/api/prescription-refill", refillRouter);
app.use("/api/site-settings", siteSettingRouter);
app.use("/api/audit-logs", auditLogRouter);
app.use("/api/uploads", uploadRouter);
app.use("/api/admin/users", userRouter);

app.use(notFoundHandler);
app.use(errorHandler);
