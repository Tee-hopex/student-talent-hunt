import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { verifyAuthToken } from "../lib/jwt";
import { forbidden, unauthorized } from "../lib/errors";

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  if (req.cookies?.token) return req.cookies.token;
  return null;
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) return next(unauthorized("Authentication required"));

  try {
    req.user = verifyAuthToken(token);
    next();
  } catch {
    next(unauthorized("Invalid or expired session"));
  }
}

/** Optional auth: attaches req.user if a valid token is present, but never blocks the request. */
export function attachUserIfPresent(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) return next();
  try {
    req.user = verifyAuthToken(token);
  } catch {
    // ignore invalid token on optional routes
  }
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(unauthorized("Authentication required"));
    if (!roles.includes(req.user.role)) return next(forbidden("You do not have access to this resource"));
    next();
  };
}
