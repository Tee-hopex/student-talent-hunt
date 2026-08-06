import { Router } from "express";
import argon2 from "argon2";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../lib/asyncHandler";
import { validate } from "../../middleware/validate";
import { authenticate } from "../../middleware/auth";
import { authLimiter } from "../../middleware/rateLimit";
import { signAuthToken } from "../../lib/jwt";
import { badRequest, unauthorized } from "../../lib/errors";
import { isProduction } from "../../config/env";

export const authRouter = Router();

const COOKIE_NAME = "token";
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function setAuthCookie(res: import("express").Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_MS,
  });
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) throw unauthorized("Invalid email or password");

    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) throw unauthorized("Invalid email or password");

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const token = signAuthToken({ sub: user.id, role: user.role, email: user.email });
    setAuthCookie(res, token);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  }),
);

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2),
  phone: z.string().min(7),
  school: z.string().min(2),
  studentClass: z.enum(["JSS3", "SS3"]),
  dateOfBirth: z.coerce.date(),
  guardianName: z.string().min(2),
  guardianPhone: z.string().min(7),
  guardianEmail: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
});

// Creates both the User (role=STUDENT) and the Student profile in one step.
// Talent-category application/upload happens separately in /api/applications.
authRouter.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const data = req.body as z.infer<typeof registerSchema>;

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw badRequest("An account with this email already exists");

    const passwordHash = await argon2.hash(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: "STUDENT",
        name: data.fullName,
        phone: data.phone,
        student: {
          create: {
            fullName: data.fullName,
            school: data.school,
            studentClass: data.studentClass,
            dateOfBirth: data.dateOfBirth,
            guardianName: data.guardianName,
            guardianPhone: data.guardianPhone,
            guardianEmail: data.guardianEmail || null,
            address: data.address,
          },
        },
      },
      include: { student: true },
    });

    const token = signAuthToken({ sub: user.id, role: user.role, email: user.email });
    setAuthCookie(res, token);
    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  }),
);

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.status(204).send();
});

authRouter.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      include: { student: true, judge: { include: { categories: { include: { category: true } } } } },
    });
    if (!user) throw unauthorized();
    const { passwordHash: _passwordHash, ...safeUser } = user;
    void _passwordHash;
    res.json(safeUser);
  }),
);
