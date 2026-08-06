import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../lib/asyncHandler";
import { validate } from "../../middleware/validate";
import { authenticate, requireRole } from "../../middleware/auth";
import { notFound } from "../../lib/errors";

export const studentsRouter = Router();

studentsRouter.get(
  "/me",
  authenticate,
  requireRole("STUDENT"),
  asyncHandler(async (req, res) => {
    const student = await prisma.student.findUnique({
      where: { userId: req.user!.sub },
      include: { user: { select: { email: true, name: true, phone: true } } },
    });
    if (!student) throw notFound("Student profile not found");
    res.json(student);
  }),
);

const updateSchema = z.object({
  school: z.string().min(2).optional(),
  guardianName: z.string().min(2).optional(),
  guardianPhone: z.string().min(7).optional(),
  guardianEmail: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  phone: z.string().min(7).optional(),
});

studentsRouter.patch(
  "/me",
  authenticate,
  requireRole("STUDENT"),
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const { phone, ...studentData } = req.body as z.infer<typeof updateSchema>;

    const student = await prisma.student.update({
      where: { userId: req.user!.sub },
      data: studentData,
    });

    if (phone) {
      await prisma.user.update({ where: { id: req.user!.sub }, data: { phone } });
    }

    res.json(student);
  }),
);

// Admin: list all students (for participant management context)
studentsRouter.get(
  "/",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (_req, res) => {
    const students = await prisma.student.findMany({
      include: { user: { select: { email: true, isActive: true } }, applications: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(students);
  }),
);
