import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { Role } from "@prisma/client";

export interface AuthTokenPayload {
  sub: string; // User.id
  role: Role;
  email: string;
}

const JWT_ALGORITHM = "HS256" as const;

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    algorithm: JWT_ALGORITHM,
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  // Explicitly pin the accepted algorithm rather than trusting whatever
  // the token header claims — defense in depth against algorithm-confusion
  // attacks, even though jsonwebtoken already rejects "alg: none" by default.
  return jwt.verify(token, env.JWT_SECRET, { algorithms: [JWT_ALGORITHM] }) as AuthTokenPayload;
}
