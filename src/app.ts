import "express-async-errors";
import path from "path";
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
import articleRouter from "./routes/article.routes";
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
// helmet's default Cross-Origin-Resource-Policy (same-origin) blocks the
// frontend, on its own origin/port, from rendering these images in <img>/
// next/image — CORP is enforced by the browser regardless of the
// Access-Control-Allow-Origin header below, so it needs its own override.
app.use(
  "/uploads",
  (_req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(process.cwd(), "uploads"))
);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/auth", authRouter);
app.use("/api/services", serviceRouter);
app.use("/api/products", productRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/faqs", faqRouter);
app.use("/api/testimonials", testimonialRouter);
app.use("/api/locations", locationRouter);
app.use("/api/team", teamRouter);
app.use("/api/articles", articleRouter);
app.use("/api/contact", contactRouter);
app.use("/api/prescription-refill", refillRouter);
app.use("/api/site-settings", siteSettingRouter);
app.use("/api/audit-logs", auditLogRouter);
app.use("/api/uploads", uploadRouter);
app.use("/api/admin/users", userRouter);

app.use(notFoundHandler);
app.use(errorHandler);
