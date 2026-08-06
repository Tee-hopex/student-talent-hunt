import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../lib/asyncHandler";
import { authenticate, requireRole } from "../../middleware/auth";
import { localStorageAdapter } from "../../storage/localStorageAdapter";
import { decryptBuffer } from "../../lib/crypto";
import { notFound } from "../../lib/errors";
import type { DocumentAction } from "@prisma/client";

export const documentsRouter = Router();

// Admin-only, access-logged retrieval of sensitive application documents
// (government ID, parental consent). Never exposed via a public/static path.
async function serveSecureDocument(
  req: import("express").Request,
  res: import("express").Response,
  field: "governmentIdUrl" | "parentalConsentUrl",
  action: DocumentAction,
) {
  const application = await prisma.application.findUnique({ where: { id: req.params.id } });
  if (!application || !application[field]) throw notFound("Document not found");

  await prisma.accessLog.create({
    data: {
      actorId: req.user!.sub,
      applicationId: application.id,
      action,
      ipAddress: req.ip ?? "unknown",
    },
  });

  const encrypted = await localStorageAdapter.read(application[field]!);
  const decrypted = decryptBuffer(encrypted);
  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Cache-Control", "no-store");
  res.send(decrypted);
}

documentsRouter.get(
  "/applications/:id/government-id",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler((req, res) => serveSecureDocument(req, res, "governmentIdUrl", "VIEW_ID")),
);

documentsRouter.get(
  "/applications/:id/parental-consent",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler((req, res) => serveSecureDocument(req, res, "parentalConsentUrl", "VIEW_CONSENT")),
);

documentsRouter.get(
  "/applications/:id/access-log",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const logs = await prisma.accessLog.findMany({
      where: { applicationId: req.params.id },
      include: { actor: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(logs);
  }),
);
