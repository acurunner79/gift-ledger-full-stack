import "dotenv/config";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import express, {
  type ErrorRequestHandler,
  type RequestHandler
} from "express";
import { authRouter } from "./routes/auth.routes.js";
import { claimRouter } from "./routes/claim.routes.js";
import { connectionRouter } from "./routes/connection.routes.js";
import { giftRouter } from "./routes/gift.routes.js";
import { healthRouter } from "./routes/health.routes.js";
import { listRouter } from "./routes/list.routes.js";
import { settingsRouter } from "./routes/settings.routes.js";
import { themeRouter } from "./routes/theme.routes.js";

const app = express();

app.set("trust proxy", 1);

const PORT = process.env.PORT || 3001;

const allowedOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"]
  })
);

const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
};

const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  console.error(err);

  res.status(500).json({
    message: "Internal server error"
  });
};

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 25,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Too many authentication attempts. Please try again later."
  }
});

app.use(
  express.json({
    limit: "100kb"
  })
);

app.use("/health", healthRouter);
app.use("/api/auth", authRateLimiter, authRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/themes", themeRouter);
app.use("/api/gifts", giftRouter);
app.use("/api/connections", connectionRouter);
app.use("/api/gift-claims", claimRouter);
app.use("/api/lists", listRouter);
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Gift Ledger API running on port ${PORT}`);
});