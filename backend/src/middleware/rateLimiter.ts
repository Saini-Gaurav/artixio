import rateLimit from "express-rate-limit";
import { env } from "../config/env";

export const apiRateLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please slow down.",
  },
});

// Slightly tighter limit for write operations - status changes are the
// one thing an over-eager script could hammer.
export const writeRateLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: Math.max(20, Math.floor(env.rateLimit.max / 4)),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many write requests, please slow down.",
  },
});
