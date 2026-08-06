import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import { encryptBuffer } from "../src/lib/crypto";
import { localStorageAdapter } from "../src/storage/localStorageAdapter";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Password123!";

async function main() {
  console.log("Seeding database…");

  const passwordHash = await argon2.hash(DEMO_PASSWORD);

  // ── Admin ────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: "admin@studentgottalent.demo" },
    update: {},
    create: {
      email: "admin@studentgottalent.demo",
      passwordHash,
      role: "ADMIN",
      name: "Ada Okafor",
      phone: "+2348000000001",
    },
  });

  // ── Event ────────────────────────────────────────────────────────────
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const event = await prisma.event.upsert({
    where: { slug: "student-got-talent-2026" },
    update: {},
    create: {
      title: "Student Talent Hunt 2026",
      slug: "student-got-talent-2026",
      description:
        "The biggest inter-school talent showcase of the year. SS3 and JSS3 students compete across singing, dancing, spoken word, and more for the chance to be crowned this year's champion.",
      location: "Main Auditorium, Lagos",
      status: "PUBLISHED",
      registrationOpensAt: new Date(now - 5 * day),
      registrationClosesAt: new Date(now + 20 * day),
      competitionStartsAt: new Date(now + 25 * day),
      competitionEndsAt: new Date(now + 27 * day),
      votingOpensAt: new Date(now - 1 * day),
      resultsPublishedAt: null,
      firstPrize: "₦500,000 + Trophy",
      secondPrize: "₦250,000 + Trophy",
      thirdPrize: "₦100,000 + Trophy",
    },
  });

  // ── Categories ───────────────────────────────────────────────────────
  const categoryNames = ["Singing", "Dancing", "Spoken Word", "Instrumental Performance"];
  const categories = [];
  for (const name of categoryNames) {
    const category = await prisma.category.upsert({
      where: { eventId_name: { eventId: event.id, name } },
      update: {},
      create: {
        eventId: event.id,
        name,
        description: `Showcase your best ${name.toLowerCase()} performance.`,
        maxScore: 100,
      },
    });
    categories.push(category);
  }

  // ── Judges ───────────────────────────────────────────────────────────
  const judgeSeeds = [
    { name: "Chidi Emeka", email: "chidi.judge@studentgottalent.demo", categoryIdx: [0, 1] },
    { name: "Funmi Bello", email: "funmi.judge@studentgottalent.demo", categoryIdx: [2, 3] },
  ];

  const judges = [];
  for (const j of judgeSeeds) {
    const user = await prisma.user.upsert({
      where: { email: j.email },
      update: {},
      create: { email: j.email, passwordHash, role: "JUDGE", name: j.name },
    });
    const judge = await prisma.judge.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, bio: `Experienced judge specializing in performing arts.` },
    });
    for (const idx of j.categoryIdx) {
      await prisma.judgeCategory.upsert({
        where: { judgeId_categoryId: { judgeId: judge.id, categoryId: categories[idx].id } },
        update: {},
        create: { judgeId: judge.id, categoryId: categories[idx].id },
      });
    }
    judges.push(judge);
  }

  // ── Students + applications ─────────────────────────────────────────
  const studentSeeds = [
    {
      name: "Tolu Adeyemi",
      email: "tolu.student@studentgottalent.demo",
      school: "Greenfield High School",
      studentClass: "SS3" as const,
      categoryIdx: 0,
      status: "APPROVED" as const,
    },
    {
      name: "Ngozi Umeh",
      email: "ngozi.student@studentgottalent.demo",
      school: "Kings College",
      studentClass: "SS3" as const,
      categoryIdx: 1,
      status: "APPROVED" as const,
    },
    {
      name: "Ibrahim Musa",
      email: "ibrahim.student@studentgottalent.demo",
      school: "Queens College",
      studentClass: "JSS3" as const,
      categoryIdx: 2,
      status: "PENDING" as const,
    },
    {
      name: "Blessing Eze",
      email: "blessing.student@studentgottalent.demo",
      school: "Corona Secondary School",
      studentClass: "JSS3" as const,
      categoryIdx: 3,
      status: "REJECTED" as const,
    },
  ];

  const placeholderDoc = Buffer.from("DEMO SEED DOCUMENT — NOT A REAL ID", "utf8");

  for (const s of studentSeeds) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        email: s.email,
        passwordHash,
        role: "STUDENT",
        name: s.name,
        phone: "+2348000000000",
      },
    });

    const student = await prisma.student.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        fullName: s.name,
        school: s.school,
        studentClass: s.studentClass,
        dateOfBirth: new Date("2009-05-14"),
        guardianName: `${s.name.split(" ")[0]}'s Guardian`,
        guardianPhone: "+2348000000002",
        guardianEmail: "guardian@studentgottalent.demo",
        address: "12 Demo Street, Lagos",
      },
    });

    const existingApplication = await prisma.application.findUnique({
      where: { studentId_eventId: { studentId: student.id, eventId: event.id } },
    });
    if (existingApplication) continue;

    const [idDoc, consentDoc] = await Promise.all([
      localStorageAdapter.save("applications/secure", "demo-id.txt.enc", encryptBuffer(placeholderDoc)),
      localStorageAdapter.save("applications/secure", "demo-consent.txt.enc", encryptBuffer(placeholderDoc)),
    ]);

    const application = await prisma.application.create({
      data: {
        studentId: student.id,
        eventId: event.id,
        categoryId: categories[s.categoryIdx].id,
        status: s.status,
        rejectionReason: s.status === "REJECTED" ? "Performance video did not meet submission guidelines." : null,
        governmentIdType: "NIN",
        governmentIdUrl: idDoc.key,
        parentalConsentUrl: consentDoc.key,
        reviewedAt: s.status === "PENDING" ? null : new Date(),
        reviewedBy: s.status === "PENDING" ? null : admin.id,
      },
    });

    if (s.status === "APPROVED") {
      const judgeForCategory = judges.find((j) => j !== undefined);
      if (judgeForCategory) {
        await prisma.score.upsert({
          where: {
            applicationId_judgeId: { applicationId: application.id, judgeId: judgeForCategory.id },
          },
          update: {},
          create: {
            applicationId: application.id,
            judgeId: judgeForCategory.id,
            score: 82,
            comment: "Strong stage presence and technical execution.",
          },
        });
      }
    }
  }

  // ── Blog posts ───────────────────────────────────────────────────────
  await prisma.blogPost.upsert({
    where: { slug: "registration-now-open" },
    update: {},
    create: {
      title: "Registration is now open for Student Talent Hunt 2026!",
      slug: "registration-now-open",
      excerpt: "SS3 and JSS3 students, get ready — applications close in 3 weeks.",
      content:
        "We're excited to announce that registration for Student Talent Hunt 2026 is officially open! Head to the registration page to submit your application, performance video, and required documents before the deadline.",
      type: "ANNOUNCEMENT",
      isPublished: true,
      publishedAt: new Date(now - 4 * day),
      authorId: admin.id,
    },
  });

  await prisma.blogPost.upsert({
    where: { slug: "deadline-reminder-3-weeks-left" },
    update: {},
    create: {
      title: "Reminder: 3 weeks left to register",
      slug: "deadline-reminder-3-weeks-left",
      excerpt: "Don't miss out — the registration window closes soon.",
      content:
        "This is a friendly reminder that the registration window for Student Talent Hunt 2026 closes soon. Make sure your application, photo, performance video, and consent documents are submitted on time.",
      type: "DEADLINE_REMINDER",
      isPublished: true,
      publishedAt: new Date(now - 1 * day),
      authorId: admin.id,
    },
  });

  console.log("Seed complete.");
  console.log("\nDemo accounts (all use password: Password123!)");
  console.log("  Admin: admin@studentgottalent.demo");
  console.log("  Judge: chidi.judge@studentgottalent.demo");
  console.log("  Judge: funmi.judge@studentgottalent.demo");
  console.log("  Student: tolu.student@studentgottalent.demo (approved)");
  console.log("  Student: ngozi.student@studentgottalent.demo (approved)");
  console.log("  Student: ibrahim.student@studentgottalent.demo (pending)");
  console.log("  Student: blessing.student@studentgottalent.demo (rejected)");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
