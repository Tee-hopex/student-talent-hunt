import express from "express";
import path from "node:path";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { env, isProduction } from "./config/env";
import { apiLimiter } from "./middleware/rateLimit";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

import { authRouter } from "./modules/auth/auth.routes";
import { studentsRouter } from "./modules/students/students.routes";
import { eventsRouter } from "./modules/events/events.routes";
import { categoriesRouter } from "./modules/categories/categories.routes";
import { applicationsRouter } from "./modules/applications/applications.routes";
import { judgesRouter } from "./modules/judges/judges.routes";
import { scoresRouter } from "./modules/scores/scores.routes";
import { votesRouter } from "./modules/votes/votes.routes";
import { blogRouter } from "./modules/blog/blog.routes";
import { galleryRouter } from "./modules/gallery/gallery.routes";
import { contactRouter } from "./modules/contact/contact.routes";
import { documentsRouter } from "./modules/documents/documents.routes";
import { reportsRouter } from "./modules/reports/reports.routes";
import { notificationsRouter } from "./modules/notifications/notifications.routes";

export const app = express();

const UPLOAD_ROOT = path.resolve(process.cwd(), env.UPLOAD_DIR);

// Client and server are always different origins (different ports in dev,
// likely different subdomains in production), so Helmet's default
// same-origin Cross-Origin-Resource-Policy would silently block the client
// from loading public images (photos, gallery) it fetches from the API.
// Those resources are meant to be publicly embeddable; sensitive documents
// never go through static serving in the first place — they're gated by
// JWT auth in the /api/documents routes, not by this header.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(isProduction ? "combined" : "dev"));
app.use("/api", apiLimiter);

// Public, non-sensitive media only. Government IDs / consent forms live
// under applications/secure and are NEVER mounted here — they're only
// reachable through the authenticated, access-logged /api/documents routes.
app.use("/uploads/applications/photo", express.static(path.join(UPLOAD_ROOT, "applications/photo")));
app.use("/uploads/applications/video", express.static(path.join(UPLOAD_ROOT, "applications/video")));
app.use("/uploads/gallery", express.static(path.join(UPLOAD_ROOT, "gallery")));

app.get("/api/health", (_req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

app.use("/api/auth", authRouter);
app.use("/api/students", studentsRouter);
app.use("/api/events", eventsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/applications", applicationsRouter);
app.use("/api/judges", judgesRouter);
app.use("/api/scores", scoresRouter);
app.use("/api/votes", votesRouter);
app.use("/api/blog", blogRouter);
app.use("/api/gallery", galleryRouter);
app.use("/api/contact", contactRouter);
app.use("/api/documents", documentsRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/notifications", notificationsRouter);

app.use(notFoundHandler);
app.use(errorHandler);
