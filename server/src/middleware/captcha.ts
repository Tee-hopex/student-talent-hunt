import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { badRequest } from "../lib/errors";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

let warnedUnconfigured = false;

/**
 * Verifies a Cloudflare Turnstile token sent as `captchaToken` in the body.
 * If TURNSTILE_SECRET_KEY is unset — in dev intentionally, or in production
 * because Turnstile setup hasn't happened yet — this is a no-op rather than
 * a hard failure, so the app stays usable end-to-end. It logs loudly (once
 * per process) so an unprotected deploy is never silent. Set
 * TURNSTILE_SECRET_KEY (and the client's VITE_TURNSTILE_SITE_KEY) as soon
 * as Cloudflare access is available — no code change needed, just the env
 * vars.
 */
export function verifyCaptcha() {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!env.TURNSTILE_SECRET_KEY) {
      if (!warnedUnconfigured) {
        warnedUnconfigured = true;
        console.warn(
          "[captcha] TURNSTILE_SECRET_KEY is not set — registration/voting/contact are running WITHOUT bot protection. Set TURNSTILE_SECRET_KEY to enable it.",
        );
      }
      return next();
    }

    const token = req.body?.captchaToken;
    if (!token) return next(badRequest("CAPTCHA verification is required"));

    try {
      const response = await fetch(VERIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: env.TURNSTILE_SECRET_KEY,
          response: token,
          remoteip: req.ip,
        }),
      });
      const result = (await response.json()) as { success: boolean };
      if (!result.success) return next(badRequest("CAPTCHA verification failed"));
      next();
    } catch (err) {
      next(err);
    }
  };
}
