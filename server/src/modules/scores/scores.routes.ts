import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../lib/asyncHandler";
import { validate } from "../../middleware/validate";
import { authenticate, requireRole } from "../../middleware/auth";
import { badRequest, forbidden, notFound } from "../../lib/errors";

export const scoresRouter = Router();

const scoreSchema = z.object({
  applicationId: z.string().min(1),
  score: z.number().min(0),
  comment: z.string().optional(),
});

scoresRouter.post(
  "/",
  authenticate,
  requireRole("JUDGE"),
  validate(scoreSchema),
  asyncHandler(async (req, res) => {
    const data = req.body as z.infer<typeof scoreSchema>;

    const judge = await prisma.judge.findUnique({ where: { userId: req.user!.sub } });
    if (!judge) throw forbidden();

    const application = await prisma.application.findUnique({
      where: { id: data.applicationId },
      include: { category: true },
    });
    if (!application) throw notFound("Application not found");
    if (application.status !== "APPROVED") {
      throw badRequest("Only approved applications can be scored");
    }

    const assigned = await prisma.judgeCategory.findUnique({
      where: { judgeId_categoryId: { judgeId: judge.id, categoryId: application.categoryId } },
    });
    if (!assigned) throw forbidden("You are not assigned to this category");

    if (data.score > application.category.maxScore) {
      throw badRequest(`Score cannot exceed ${application.category.maxScore}`);
    }

    const score = await prisma.score.upsert({
      where: { applicationId_judgeId: { applicationId: data.applicationId, judgeId: judge.id } },
      update: { score: data.score, comment: data.comment },
      create: { applicationId: data.applicationId, judgeId: judge.id, score: data.score, comment: data.comment },
    });

    res.status(201).json(score);
  }),
);

scoresRouter.get(
  "/application/:applicationId",
  authenticate,
  requireRole("ADMIN", "JUDGE"),
  asyncHandler(async (req, res) => {
    const scores = await prisma.score.findMany({
      where: { applicationId: req.params.applicationId },
      include: { judge: { include: { user: { select: { name: true } } } } },
    });
    res.json(scores);
  }),
);
