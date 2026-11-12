
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import multer from "multer";
import shareRoutes from "./routes/shareRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import upgradeRoutes from "./routes/upgradeRoutes.js";

dotenv.config();

const app = express();

// Resolve the exact frontend origin.
const CLIENT_ORIGIN = new URL(
  process.env.CLIENT_URL || "http://localhost:5173"
).origin;

// Security headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);

// CSRF protection through request-origin validation.
// CORS alone does not provide CSRF protection.
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

app.use((req, res, next) => {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  let requestOrigin = req.get("Origin");

  // Use Referer only when Origin is not provided.
  if (!requestOrigin) {
    const referer = req.get("Referer");

    if (referer) {
      try {
        requestOrigin = new URL(referer).origin;
      } catch {
        return res.status(403).json({
          success: false,
          message: "Request origin could not be verified.",
        });
      }
    }
  }

  if (!requestOrigin || requestOrigin !== CLIENT_ORIGIN) {
    return res.status(403).json({
      success: false,
      message: "Request origin is not allowed.",
    });
  }

  return next();
});

// Request parsing
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/shares", shareRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upgrades", upgradeRoutes);

// Handle document upload errors
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        message: "File size exceeds the 10 MB limit.",
      });
    }

    return res.status(400).json({
      success: false,
      message: "Invalid file upload request.",
    });
  }

  if (
    err.message ===
    "Unsupported file type. Allowed: PDF, JPEG, PNG, WebP, TXT."
  ) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  console.error("Server error:", err);

  return res.status(500).json({
    success: false,
    message: "An unexpected server error occurred.",
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "DocuFortis API is running",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`DocuFortis server running on port ${PORT}`);
});
