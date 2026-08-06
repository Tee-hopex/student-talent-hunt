import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../lib/asyncHandler";
import { authenticate, requireRole } from "../../middleware/auth";

export const reportsRouter = Router();

reportsRouter.get(
  "/overview",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const { eventId } = req.query as { eventId?: string };
    const where = eventId ? { eventId } : {};

    const [total, approved, rejected, pending, byCategory] = await Promise.all([
      prisma.application.count({ where }),
      prisma.application.count({ where: { ...where, status: "APPROVED" } }),
      prisma.application.count({ where: { ...where, status: "REJECTED" } }),
      prisma.application.count({ where: { ...where, status: "PENDING" } }),
      prisma.application.groupBy({
        by: ["categoryId"],
        where,
        _count: { _all: true },
      }),
    ]);

    const categories = await prisma.category.findMany({
      where: byCategory.length ? { id: { in: byCategory.map((c) => c.categoryId) } } : undefined,
    });

    res.json({
      totals: {
        total,
        approved,
        rejected,
        pending,
        approvalRate: total > 0 ? Number(((approved / total) * 100).toFixed(1)) : 0,
      },
      byCategory: byCategory.map((row) => ({
        categoryId: row.categoryId,
        categoryName: categories.find((c) => c.id === row.categoryId)?.name ?? "Unknown",
        count: row._count._all,
      })),
    });
  }),
);

reportsRouter.get(
  "/results",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const { categoryId } = req.query as { categoryId?: string };
    if (!categoryId) return res.status(400).json({ error: "categoryId is required" });

    const applications = await prisma.application.findMany({
      where: { categoryId, status: "APPROVED" },
      include: {
        student: { select: { fullName: true, school: true } },
        scores: true,
        _count: { select: { votes: true } },
      },
    });

    const ranked = applications
      .map((a) => {
        const avgScore = a.scores.length
          ? a.scores.reduce((sum, s) => sum + s.score, 0) / a.scores.length
          : 0;
        return {
          applicationId: a.id,
          studentName: a.student.fullName,
          school: a.student.school,
          avgScore: Number(avgScore.toFixed(2)),
          judgeCount: a.scores.length,
          voteCount: a._count.votes,
        };
      })
      .sort((a, b) => b.avgScore - a.avgScore);

    res.json(ranked);
  }),
);
