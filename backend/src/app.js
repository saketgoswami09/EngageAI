require("./config/env"); // ← validates all required env vars at startup
const env = require("./config/env");
require("express-async-errors");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");

const connectDB = require("./config/db");
const { connectRedis } = require("./config/redis");
const logger = require("./utils/logger");
const errorHandler = require("./middleware/errorHandler");
const { apiLimiter } = require("./middleware/rateLimiter");
const AppError = require("./utils/AppError");

// Routes
const webhookRoutes = require("./routes/webhook");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const conversationRoutes = require("./routes/conversations");
const leadRoutes = require("./routes/leads");
const documentRoutes = require("./routes/documents");
const analyticsRoutes = require("./routes/analytics");
const settingsRoutes = require("./routes/settings");

const app = express();

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  }),
);
app.set("trust proxy", 1);

// ─── Webhook — needs raw body for HMAC verification ───────────────────────────
// IMPORTANT: Mount BEFORE json() middleware
app.use("/webhook", webhookRoutes);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(mongoSanitize()); // NoSQL injection protection

// ─── HTTP Logging ─────────────────────────────────────────────────────────────
const morganFormat = env.NODE_ENV === "production" ? "combined" : "dev";
app.use(
  morgan(morganFormat, { stream: { write: (msg) => logger.http(msg.trim()) } }),
);

// ─── Global Rate Limiter ──────────────────────────────────────────────────────
app.use("/api", apiLimiter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: env.NODE_ENV,
    uptime: process.uptime(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/settings", settingsRoutes);

// ─── Root Route ───────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    service: "EngageAI API",
    status: "healthy",
    version: "1.0.0",
    environment: env.NODE_ENV,
  });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.all("*", (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = env.PORT; // Joi-coerced to number, defaults to 5000

const start = async () => {
  await connectDB();
  await connectRedis();
  app.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT} [${env.NODE_ENV}]`);
  });
};

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received — shutting down gracefully");
  process.exit(0);
});
process.on("unhandledRejection", (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  process.exit(1);
});

start();

module.exports = app; // for testing
