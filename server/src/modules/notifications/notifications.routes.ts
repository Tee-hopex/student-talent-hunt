import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../lib/asyncHandler";
import { authenticate } from "../../middleware/auth";

export const notificationsRouter = Router();

notificationsRouter.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.sub },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json(notifications);
  }),
);

notificationsRouter.patch(
  "/:id/read",
  authenticate,
  asyncHandler(async (req, res) => {
    const notification = await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user!.sub },
      data: { isRead: true },
    });
    res.json({ updated: notification.count });
  }),
);

notificationsRouter.patch(
  "/read-all",
  authenticate,
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({
      where: { userId: req.user!.sub, isRead: false },
      data: { isRead: true },
    });
    res.status(204).send();
  }),
);
