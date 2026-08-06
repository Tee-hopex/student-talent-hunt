import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../lib/asyncHandler";
import { validate } from "../../middleware/validate";
import { authenticate, requireRole } from "../../middleware/auth";
import { notFound } from "../../lib/errors";

export const eventsRouter = Router();

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// GET /api/events — public list (most recent first)
eventsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const events = await prisma.event.findMany({
      where: { status: { not: "DRAFT" } },
      orderBy: { competitionStartsAt: "desc" },
      include: { categories: true },
    });
    res.json(events);
  }),
);

// GET /api/events/current — the active/most relevant event for the public site
eventsRouter.get(
  "/current",
  asyncHandler(async (_req, res) => {
    const event = await prisma.event.findFirst({
      where: { status: "PUBLISHED" },
      orderBy: { competitionStartsAt: "desc" },
      include: { categories: true },
    });
    res.json(event);
  }),
);

// Admin list — includes DRAFT/ARCHIVED events the public list hides.
// Registered before "/:slug" so it isn't swallowed by that param route.
eventsRouter.get(
  "/admin/all",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (_req, res) => {
    const events = await prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      include: { categories: true },
    });
    res.json(events);
  }),
);

eventsRouter.get(
  "/:slug",
  asyncHandler(async (req, res) => {
    const event = await prisma.event.findUnique({
      where: { slug: req.params.slug },
      include: { categories: true },
    });
    if (!event) throw notFound("Event not found");
    res.json(event);
  }),
);

// Public results — only visible once the admin has published them.
eventsRouter.get(
  "/:slug/results",
  asyncHandler(async (req, res) => {
    const event = await prisma.event.findUnique({
      where: { slug: req.params.slug },
      include: { categories: true },
    });
    if (!event) throw notFound("Event not found");
    if (!event.resultsPublishedAt || event.resultsPublishedAt > new Date()) {
      res.json({ published: false, categories: [] });
      return;
    }

    const categories = await Promise.all(
      event.categories.map(async (category) => {
        const applications = await prisma.application.findMany({
          where: { categoryId: category.id, status: "APPROVED" },
          include: {
            student: { select: { fullName: true, school: true } },
            scores: true,
            _count: { select: { votes: true } },
          },
        });

        const ranked = applications
          .map((a) => ({
            applicationId: a.id,
            studentName: a.student.fullName,
            school: a.student.school,
            photoUrl: a.photoUrl,
            avgScore: a.scores.length
              ? Number((a.scores.reduce((sum, s) => sum + s.score, 0) / a.scores.length).toFixed(2))
              : 0,
            voteCount: a._count.votes,
          }))
          .sort((a, b) => b.avgScore - a.avgScore);

        return { categoryId: category.id, categoryName: category.name, ranking: ranked };
      }),
    );

    res.json({ published: true, categories });
  }),
);

const eventSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  location: z.string().min(2),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  registrationOpensAt: z.coerce.date(),
  registrationClosesAt: z.coerce.date(),
  competitionStartsAt: z.coerce.date(),
  competitionEndsAt: z.coerce.date(),
  votingOpensAt: z.coerce.date().optional(),
  resultsPublishedAt: z.coerce.date().nullable().optional(),
  firstPrize: z.string().optional(),
  secondPrize: z.string().optional(),
  thirdPrize: z.string().optional(),
});

eventsRouter.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  validate(eventSchema),
  asyncHandler(async (req, res) => {
    const data = req.body as z.infer<typeof eventSchema>;
    let slug = slugify(data.title);
    const clash = await prisma.event.findUnique({ where: { slug } });
    if (clash) slug = `${slug}-${Date.now().toString(36)}`;

    const event = await prisma.event.create({ data: { ...data, slug } });
    res.status(201).json(event);
  }),
);

eventsRouter.patch(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  validate(eventSchema.partial()),
  asyncHandler(async (req, res) => {
    const event = await prisma.event.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(event);
  }),
);

eventsRouter.delete(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    await prisma.event.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);
