import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../lib/asyncHandler";
import { validate } from "../../middleware/validate";
import { authenticate, requireRole } from "../../middleware/auth";
import { notFound } from "../../lib/errors";

export const blogRouter = Router();

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

blogRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { type } = req.query as { type?: string };
    const posts = await prisma.blogPost.findMany({
      where: { isPublished: true, type: type as never },
      orderBy: { publishedAt: "desc" },
      include: { author: { select: { name: true } } },
    });
    res.json(posts);
  }),
);

blogRouter.get(
  "/admin",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (_req, res) => {
    const posts = await prisma.blogPost.findMany({
      orderBy: { createdAt: "desc" },
      include: { author: { select: { name: true } } },
    });
    res.json(posts);
  }),
);

blogRouter.get(
  "/:slug",
  asyncHandler(async (req, res) => {
    const post = await prisma.blogPost.findUnique({ where: { slug: req.params.slug } });
    if (!post || !post.isPublished) throw notFound("Post not found");
    res.json(post);
  }),
);

const postSchema = z.object({
  title: z.string().min(3),
  excerpt: z.string().optional(),
  content: z.string().min(10),
  coverImageUrl: z.string().optional(),
  type: z.enum(["NEWS", "ANNOUNCEMENT", "DEADLINE_REMINDER"]).default("NEWS"),
  isPublished: z.boolean().default(false),
});

blogRouter.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  validate(postSchema),
  asyncHandler(async (req, res) => {
    const data = req.body as z.infer<typeof postSchema>;
    let slug = slugify(data.title);
    const clash = await prisma.blogPost.findUnique({ where: { slug } });
    if (clash) slug = `${slug}-${Date.now().toString(36)}`;

    const post = await prisma.blogPost.create({
      data: {
        ...data,
        slug,
        authorId: req.user!.sub,
        publishedAt: data.isPublished ? new Date() : null,
      },
    });
    res.status(201).json(post);
  }),
);

blogRouter.patch(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  validate(postSchema.partial()),
  asyncHandler(async (req, res) => {
    const data = req.body as Partial<z.infer<typeof postSchema>>;
    const existing = await prisma.blogPost.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound("Post not found");

    const post = await prisma.blogPost.update({
      where: { id: req.params.id },
      data: {
        ...data,
        publishedAt: data.isPublished && !existing.publishedAt ? new Date() : existing.publishedAt,
      },
    });
    res.json(post);
  }),
);

blogRouter.delete(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    await prisma.blogPost.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);
