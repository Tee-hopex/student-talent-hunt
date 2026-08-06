import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../lib/asyncHandler";
import { validate } from "../../middleware/validate";
import { authenticate, requireRole } from "../../middleware/auth";
import { upload } from "../../middleware/upload";
import { localStorageAdapter } from "../../storage/localStorageAdapter";
import { badRequest } from "../../lib/errors";

export const galleryRouter = Router();

galleryRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { eventId, featured } = req.query as { eventId?: string; featured?: string };
    const items = await prisma.galleryItem.findMany({
      where: { eventId, isFeatured: featured === "true" ? true : undefined },
      orderBy: { createdAt: "desc" },
    });
    res.json(items);
  }),
);

const metaSchema = z.object({
  title: z.string().optional(),
  eventId: z.string().optional(),
  mediaType: z.enum(["PHOTO", "VIDEO"]),
  isFeatured: z.coerce.boolean().optional().default(false),
});

galleryRouter.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  upload.single("file"),
  validate(metaSchema),
  asyncHandler(async (req, res) => {
    const data = req.body as z.infer<typeof metaSchema>;
    if (!req.file) throw badRequest("A file is required");

    const saved = await localStorageAdapter.save("gallery", req.file.originalname, req.file.buffer);

    const item = await prisma.galleryItem.create({
      data: {
        title: data.title,
        eventId: data.eventId,
        mediaType: data.mediaType,
        isFeatured: data.isFeatured,
        url: saved.key,
      },
    });
    res.status(201).json(item);
  }),
);

galleryRouter.delete(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const item = await prisma.galleryItem.findUnique({ where: { id: req.params.id } });
    if (item) await localStorageAdapter.remove(item.url);
    await prisma.galleryItem.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);
