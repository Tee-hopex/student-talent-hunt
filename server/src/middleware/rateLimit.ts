import rateLimit from "express-rate-limit";

// General API guardrail.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

// Tighter limits on auth endpoints to slow down credential stuffing.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again later." },
});

// Registration/contact forms — generous enough for real users, tight enough to blunt bots.
export const formLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many submissions from this network. Please try again later." },
});

// Voting: one request per few seconds per IP as a first line of defense.
// The real dedup guarantee is the Vote.voterHash unique constraint — this
// just keeps a single client from hammering the endpoint.
// NOTE: flagged in README as needing stronger fraud prevention later
// (e.g. per-device tokens, CAPTCHA-on-vote, anomaly detection).
export const voteLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "You're voting too fast. Please slow down." },
});
