import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../lib/asyncHandler";
import { validate } from "../../middleware/validate";
import { voteLimiter } from "../../middleware/rateLimit";
import { verifyCaptcha } from "../../middleware/captcha";
import { hashIdentifier } from "../../lib/crypto";
import { badRequest, notFound } from "../../lib/errors";

export const votesRouter = Router();

const voteSchema = z.object({
  applicationId: z.string().min(1),
  deviceId: z.string().min(8, "Missing device identifier"),
  captchaToken: z.string().optional(),
});

// One vote per (device, category) — enforced by a unique constraint on the
// hashed (deviceId + IP + categoryId) combination. This is a first line of
// defense, not a fraud-proof guarantee; see README for hardening notes.
votesRouter.post(
  "/",
  voteLimiter,
  validate(voteSchema),
  verifyCaptcha(),
  asyncHandler(async (req, res) => {
    const { applicationId, deviceId } = req.body as z.infer<typeof voteSchema>;

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { event: true },
    });
    if (!application) throw notFound("Contestant not found");
    if (application.status !== "APPROVED") throw badRequest("This contestant is not open for voting");

    const now = new Date();
    if (!application.event.votingOpensAt || now < application.event.votingOpensAt) {
      throw badRequest("Voting has not opened yet");
    }

    const ipHash = hashIdentifier(req.ip ?? "unknown");
    const voterHash = hashIdentifier(`${deviceId}:${req.ip}:${application.categoryId}`);

    const alreadyVoted = await prisma.vote.findUnique({
      where: { voterHash_categoryId: { voterHash, categoryId: application.categoryId } },
    });
    if (alreadyVoted) throw badRequest("You've already voted in this category");

    const vote = await prisma.vote.create({
      data: { applicationId, categoryId: application.categoryId, voterHash, ipHash },
    });

    const count = await prisma.vote.count({ where: { applicationId } });
    res.status(201).json({ vote, voteCount: count });
  }),
);

votesRouter.get(
  "/leaderboard",
  asyncHandler(async (req, res) => {
    const { categoryId } = req.query as { categoryId?: string };
    if (!categoryId) throw badRequest("categoryId is required");

    const applications = await prisma.application.findMany({
      where: { categoryId, status: "APPROVED" },
      include: {
        student: { select: { fullName: true, school: true } },
        _count: { select: { votes: true } },
      },
    });

    const ranked = applications
      .map((a) => ({
        applicationId: a.id,
        studentName: a.student.fullName,
        school: a.student.school,
        photoUrl: a.photoUrl,
        voteCount: a._count.votes,
      }))
      .sort((a, b) => b.voteCount - a.voteCount);

    res.json(ranked);
  }),
);
