import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../lib/asyncHandler";
import { validate } from "../../middleware/validate";
import { authenticate, requireRole } from "../../middleware/auth";

export const categoriesRouter = Router();

// GET /api/categories?eventId=... — public
categoriesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { eventId } = req.query as { eventId?: string };
    const categories = await prisma.category.findMany({
      where: eventId ? { eventId } : undefined,
      orderBy: { name: "asc" },
    });
    res.json(categories);
  }),
);

const categorySchema = z.object({
  eventId: z.string().min(1),
  name: z.string().min(2),
  description: z.string().optional(),
  maxScore: z.number().int().positive().default(100),
});

categoriesRouter.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  validate(categorySchema),
  asyncHandler(async (req, res) => {
    const category = await prisma.category.create({ data: req.body });
    res.status(201).json(category);
  }),
);

categoriesRouter.patch(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  validate(categorySchema.partial()),
  asyncHandler(async (req, res) => {
    const category = await prisma.category.update({ where: { id: req.params.id }, data: req.body });
    res.json(category);
  }),
);

categoriesRouter.delete(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);
