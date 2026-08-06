import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../lib/asyncHandler";
import { authenticate, requireRole } from "../../middleware/auth";
import { registrationUploadFields, upload } from "../../middleware/upload";
import { formLimiter } from "../../middleware/rateLimit";
import { verifyCaptcha } from "../../middleware/captcha";
import { localStorageAdapter } from "../../storage/localStorageAdapter";
import { encryptBuffer } from "../../lib/crypto";
import { badRequest, forbidden, notFound } from "../../lib/errors";
import type { Express } from "express";

export const applicationsRouter = Router();

type UploadedFiles = Record<string, Express.Multer.File[]>;

const applySchema = z.object({
  eventId: z.string().min(1),
  categoryId: z.string().min(1),
  governmentIdType: z.string().min(2),
});

applicationsRouter.post(
  "/",
  authenticate,
  requireRole("STUDENT"),
  formLimiter,
  registrationUploadFields,
  verifyCaptcha(),
  asyncHandler(async (req, res) => {
    const data = applySchema.parse(req.body);
    const files = (req.files ?? {}) as UploadedFiles;

    const photo = files.photo?.[0];
    const video = files.video?.[0];
    const governmentId = files.governmentId?.[0];
    const parentalConsent = files.parentalConsent?.[0];

    if (!photo) throw badRequest("A photo is required");
    if (!governmentId) throw badRequest("A government ID document is required");
    if (!parentalConsent) throw badRequest("Parental consent document is required");

    const student = await prisma.student.findUnique({ where: { userId: req.user!.sub } });
    if (!student) throw notFound("Student profile not found");

    if (student.studentClass !== "SS3" && student.studentClass !== "JSS3") {
      throw badRequest("Only SS3 and JSS3 students are eligible");
    }

    const event = await prisma.event.findUnique({ where: { id: data.eventId } });
    if (!event) throw notFound("Event not found");
    const now = new Date();
    if (now < event.registrationOpensAt || now > event.registrationClosesAt) {
      throw badRequest("Registration is not currently open for this event");
    }

    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, eventId: data.eventId },
    });
    if (!category) throw badRequest("Invalid category for this event");

    const existing = await prisma.application.findUnique({
      where: { studentId_eventId: { studentId: student.id, eventId: data.eventId } },
    });
    if (existing) throw badRequest("You have already applied to this event");

    const [photoSaved, videoSaved, idSaved, consentSaved] = await Promise.all([
      localStorageAdapter.save("applications/photo", photo.originalname, photo.buffer),
      video
        ? localStorageAdapter.save("applications/video", video.originalname, video.buffer)
        : Promise.resolve(null),
      localStorageAdapter.save(
        "applications/secure",
        `${governmentId.originalname}.enc`,
        encryptBuffer(governmentId.buffer),
      ),
      localStorageAdapter.save(
        "applications/secure",
        `${parentalConsent.originalname}.enc`,
        encryptBuffer(parentalConsent.buffer),
      ),
    ]);

    const application = await prisma.application.create({
      data: {
        studentId: student.id,
        eventId: data.eventId,
        categoryId: data.categoryId,
        photoUrl: photoSaved.key,
        videoUrl: videoSaved?.key,
        governmentIdType: data.governmentIdType,
        governmentIdUrl: idSaved.key,
        parentalConsentUrl: consentSaved.key,
      },
      include: { category: true, event: true },
    });

    res.status(201).json(application);
  }),
);

applicationsRouter.get(
  "/mine",
  authenticate,
  requireRole("STUDENT"),
  asyncHandler(async (req, res) => {
    const student = await prisma.student.findUnique({ where: { userId: req.user!.sub } });
    if (!student) throw notFound("Student profile not found");

    const applications = await prisma.application.findMany({
      where: { studentId: student.id },
      include: { category: true, event: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(applications);
  }),
);

const listQuerySchema = z.object({
  eventId: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
});

applicationsRouter.get(
  "/",
  authenticate,
  requireRole("ADMIN", "JUDGE"),
  asyncHandler(async (req, res) => {
    const query = listQuerySchema.parse(req.query);

    let categoryFilter = query.categoryId ? [query.categoryId] : undefined;

    if (req.user!.role === "JUDGE") {
      const judge = await prisma.judge.findUnique({
        where: { userId: req.user!.sub },
        include: { categories: true },
      });
      if (!judge) throw forbidden();
      const assigned = judge.categories.map((c) => c.categoryId);
      categoryFilter = categoryFilter
        ? categoryFilter.filter((id) => assigned.includes(id))
        : assigned;
      if (categoryFilter.length === 0) return res.json([]);
    }

    const applications = await prisma.application.findMany({
      where: {
        eventId: query.eventId,
        status: query.status,
        categoryId: categoryFilter ? { in: categoryFilter } : undefined,
      },
      include: {
        student: { select: { fullName: true, school: true, studentClass: true } },
        category: true,
        event: { select: { title: true, slug: true } },
        scores: req.user!.role === "JUDGE" ? { where: { judge: { userId: req.user!.sub } } } : true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(applications);
  }),
);

applicationsRouter.get(
  "/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: { student: true, category: true, event: true, scores: true },
    });
    if (!application) throw notFound("Application not found");

    if (req.user!.role === "STUDENT") {
      const student = await prisma.student.findUnique({ where: { userId: req.user!.sub } });
      if (student?.id !== application.studentId) throw forbidden();
    }

    if (req.user!.role === "JUDGE") {
      const assigned = await prisma.judgeCategory.findFirst({
        where: { categoryId: application.categoryId, judge: { userId: req.user!.sub } },
      });
      if (!assigned) throw forbidden();

      // Judges need enough to identify and score a contestant, not the
      // guardian's contact details or the student's date of birth —
      // least-privilege at the API layer, not just in what the UI happens
      // to render.
      const { fullName, school, studentClass } = application.student;
      res.json({ ...application, student: { fullName, school, studentClass } });
      return;
    }

    res.json(application);
  }),
);

// Lets a student swap their photo and/or performance video after
// submitting — e.g. they only had a photo ready at registration time and
// want to add the video later, or want to replace either before the
// registration window closes.
applicationsRouter.patch(
  "/:id/media",
  authenticate,
  requireRole("STUDENT"),
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  asyncHandler(async (req, res) => {
    const student = await prisma.student.findUnique({ where: { userId: req.user!.sub } });
    if (!student) throw notFound("Student profile not found");

    const application = await prisma.application.findUnique({ where: { id: req.params.id } });
    if (!application) throw notFound("Application not found");
    if (application.studentId !== student.id) throw forbidden();

    const files = (req.files ?? {}) as UploadedFiles;
    const photo = files.photo?.[0];
    const video = files.video?.[0];
    if (!photo && !video) throw badRequest("Attach a photo and/or video to update");

    const [photoSaved, videoSaved] = await Promise.all([
      photo ? localStorageAdapter.save("applications/photo", photo.originalname, photo.buffer) : null,
      video ? localStorageAdapter.save("applications/video", video.originalname, video.buffer) : null,
    ]);

    const [oldPhotoKey, oldVideoKey] = [application.photoUrl, application.videoUrl];

    const updated = await prisma.application.update({
      where: { id: application.id },
      data: {
        photoUrl: photoSaved?.key ?? undefined,
        videoUrl: videoSaved?.key ?? undefined,
      },
      include: { category: true, event: true },
    });

    await Promise.all([
      photoSaved && oldPhotoKey ? localStorageAdapter.remove(oldPhotoKey) : Promise.resolve(),
      videoSaved && oldVideoKey ? localStorageAdapter.remove(oldVideoKey) : Promise.resolve(),
    ]);

    res.json(updated);
  }),
);

const statusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  rejectionReason: z.string().optional(),
});

applicationsRouter.patch(
  "/:id/status",
  authenticate,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const { status, rejectionReason } = statusSchema.parse(req.body);
    if (status === "REJECTED" && !rejectionReason) {
      throw badRequest("A rejection reason is required");
    }

    const application = await prisma.application.update({
      where: { id: req.params.id },
      data: {
        status,
        rejectionReason: status === "REJECTED" ? rejectionReason : null,
        reviewedAt: new Date(),
        reviewedBy: req.user!.sub,
      },
      include: { student: { include: { user: true } } },
    });

    await prisma.notification.create({
      data: {
        userId: application.student.userId,
        title: status === "APPROVED" ? "Application approved!" : "Application update",
        message:
          status === "APPROVED"
            ? "Your talent hunt application has been approved. Get ready to shine!"
            : `Your application was not approved. Reason: ${rejectionReason}`,
      },
    });

    res.json(application);
  }),
);
