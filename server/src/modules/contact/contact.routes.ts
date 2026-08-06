import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../lib/asyncHandler";
import { validate } from "../../middleware/validate";
import { authenticate, requireRole } from "../../middleware/auth";
import { formLimiter } from "../../middleware/rateLimit";
import { verifyCaptcha } from "../../middleware/captcha";

export const contactRouter = Router();

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string().min(2),
  message: z.string().min(10),
});

contactRouter.post(
  "/",
  formLimiter,
  validate(contactSchema),
  verifyCaptcha(),
  asyncHandler(async (req, res) => {
    const message = await prisma.contactMessage.create({ data: req.body });
    res.status(201).json({ id: message.id });
  }),
);

contactRouter.get(
  "/",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (_req, res) => {
    const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } });
    res.json(messages);
  }),
);

contactRouter.patch(
  "/:id/read",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const message = await prisma.contactMessage.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    res.json(message);
  }),
);
