import type { NextFunction, Request, Response } from "express";
import { env, isProduction } from "../config/env";
import { badRequest } from "../lib/errors";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Verifies a Cloudflare Turnstile token sent as `captchaToken` in the body.
 * In development, if TURNSTILE_SECRET_KEY is unset, this is a no-op so the
 * app runs end-to-end without a Cloudflare account.
 */
export function verifyCaptcha() {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!env.TURNSTILE_SECRET_KEY) {
      if (isProduction) return next(badRequest("CAPTCHA is not configured"));
      return next(); // dev convenience — stubbed per project setup
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
