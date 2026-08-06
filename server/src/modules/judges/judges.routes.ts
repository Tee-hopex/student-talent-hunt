import { Router } from "express";
import crypto from "node:crypto";
import argon2 from "argon2";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../lib/asyncHandler";
import { validate } from "../../middleware/validate";
import { authenticate, requireRole } from "../../middleware/auth";
import { badRequest } from "../../lib/errors";

export const judgesRouter = Router();

judgesRouter.get(
  "/",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (_req, res) => {
    const judges = await prisma.judge.findMany({
      include: { user: { select: { id: true, name: true, email: true, isActive: true } }, categories: { include: { category: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(judges);
  }),
);

const inviteSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  bio: z.string().optional(),
  categoryIds: z.array(z.string()).optional().default([]),
});

// Invites a judge by provisioning their account with a temporary password.
// Email delivery is a console-log stub for now (see lib/mailer.ts) —
// swap in a real provider without touching this route.
judgesRouter.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  validate(inviteSchema),
  asyncHandler(async (req, res) => {
    const data = req.body as z.infer<typeof inviteSchema>;
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw badRequest("An account with this email already exists");

    const tempPassword = crypto.randomBytes(9).toString("base64url");
    const passwordHash = await argon2.hash(tempPassword);

    const judge = await prisma.judge.create({
      data: {
        bio: data.bio,
        user: {
          create: { name: data.name, email: data.email, passwordHash, role: "JUDGE" },
        },
        categories: {
          create: data.categoryIds.map((categoryId) => ({ categoryId })),
        },
      },
      include: { user: true, categories: { include: { category: true } } },
    });

    const { sendMail } = await import("../../lib/mailer");
    await sendMail({
      to: data.email,
      subject: "You've been invited to judge Student Talent Hunt",
      text: `Hi ${data.name},\n\nYou've been added as a judge. Sign in at ${req.protocol}://${req.get("host")} with:\nEmail: ${data.email}\nTemporary password: ${tempPassword}\n\nPlease change your password after logging in.`,
    });

    res.status(201).json(judge);
  }),
);

judgesRouter.post(
  "/:id/categories",
  authenticate,
  requireRole("ADMIN"),
  validate(z.object({ categoryId: z.string().min(1) })),
  asyncHandler(async (req, res) => {
    const assignment = await prisma.judgeCategory.create({
      data: { judgeId: req.params.id, categoryId: req.body.categoryId },
      include: { category: true },
    });
    res.status(201).json(assignment);
  }),
);

judgesRouter.delete(
  "/:id/categories/:categoryId",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    await prisma.judgeCategory.delete({
      where: { judgeId_categoryId: { judgeId: req.params.id, categoryId: req.params.categoryId } },
    });
    res.status(204).send();
  }),
);

judgesRouter.patch(
  "/:id/status",
  authenticate,
  requireRole("ADMIN"),
  validate(z.object({ isActive: z.boolean() })),
  asyncHandler(async (req, res) => {
    const judge = await prisma.judge.findUniqueOrThrow({ where: { id: req.params.id } });
    await prisma.user.update({ where: { id: judge.userId }, data: { isActive: req.body.isActive } });
    res.status(204).send();
  }),
);
