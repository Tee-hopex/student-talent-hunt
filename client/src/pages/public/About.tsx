import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  FileCheck2,
  Mic2,
  ShieldCheck,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Event } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";

const ELIGIBILITY = [
  {
    icon: BadgeCheck,
    title: "SS3 or JSS3 only",
    description: "Open exclusively to students currently enrolled in SS3 or JSS3 at a recognized school.",
  },
  {
    icon: FileCheck2,
    title: "Valid government ID",
    description: "A National Identification Number (NIN) or other accepted government-issued ID is required.",
  },
  {
    icon: ShieldCheck,
    title: "Parental consent",
    description: "Since participants are minors, signed consent from a parent or guardian is mandatory.",
  },
  {
    icon: Camera,
    title: "Original performance",
    description: "Your submitted photo and performance video must be your own, recent work.",
  },
];

const RULES = [
  "Each student may register for one talent category per event.",
  "Performance videos must be no longer than 5 minutes and clearly show the full performance.",
  "Content must be school-appropriate — no explicit language, violence, or unsafe stunts.",
  "Applications are reviewed by the admin team; approval is not automatic.",
  "Judges' scores and public votes are combined to determine category winners.",
  "Decisions made by judges and event organizers are final.",
  "Participants must be available for the live competition dates if shortlisted.",
  "Any attempt to manipulate voting (bots, multiple devices, etc.) leads to disqualification.",
];

const CATEGORY_ICONS = [Mic2, Users, Trophy, Camera, Star];

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" },
    transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] as const },
  };
}

export function About() {
  const { data: event, isLoading } = useQuery({
    queryKey: ["events", "current"],
    queryFn: async () => {
      const { data } = await api.get<Event | null>("/events/current");
      return data;
    },
  });

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b-2 border-ink bg-plum py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 bg-grain" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <Badge variant="gold" className="mb-6">
            About the show
          </Badge>
          <h1 className="font-display text-5xl text-cream sm:text-7xl">
            More than a competition — <span className="text-gradient-marquee">it's a platform.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl font-sans text-base normal-case text-cream/70 sm:text-lg">
            Student Talent Hunt exists to give every SS3 and JSS3 student a real stage, a fair
            judging process, and a chance to be seen for what they can do — not just what's on
            their report card.
          </p>
        </div>
      </section>

      {/* ── Purpose ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          {[
            {
              title: "Discover talent",
              body: "We believe every school has students with real, undiscovered ability — this is where they get found.",
            },
            {
              title: "Build confidence",
              body: "Performing in front of judges and a live audience builds a kind of confidence classrooms rarely can.",
            },
            {
              title: "Celebrate fairly",
              body: "A transparent mix of judge scoring and public voting means results reflect both skill and support.",
            },
          ].map((item, i) => (
            <motion.div key={item.title} {...fadeUp(i * 0.1)}>
              <h3 className="text-xl text-ink">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{item.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Eligibility ──────────────────────────────────────────────── */}
      <section className="border-y-2 border-ink bg-cream-dim py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Before you apply"
            title="Eligibility requirements"
            description="Make sure you meet these before starting your registration."
          />
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ELIGIBILITY.map((item, i) => (
              <motion.div key={item.title} {...fadeUp(i * 0.08)}>
                <Card className="h-full p-6">
                  <div className="flex size-11 items-center justify-center rounded-full border-2 border-ink bg-green text-cream">
                    <item.icon className="size-5" />
                  </div>
                  <h3 className="mt-4 text-lg text-ink">{item.title}</h3>
                  <p className="mt-2 text-sm text-ink-soft">{item.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Rules ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Fine print" title="Rules & regulations" align="left" />
        <ol className="mt-10 space-y-4">
          {RULES.map((rule, i) => (
            <motion.li
              key={rule}
              {...fadeUp(i * 0.04)}
              className="flex items-start gap-4 border-2 border-ink bg-white p-4 shadow-[var(--shadow-sticker-sm)]"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-coral font-display text-sm text-cream">
                {i + 1}
              </span>
              <p className="text-sm text-ink-soft">{rule}</p>
            </motion.li>
          ))}
        </ol>
      </section>

      {/* ── Categories ───────────────────────────────────────────────── */}
      <section className="border-y-2 border-ink bg-cream-dim py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Competition categories"
            title="Choose where you shine"
            description="Every category is scored on the same 100-point scale by assigned judges, plus public votes."
          />
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)
              : event?.categories.map((category, i) => {
                  const Icon = CATEGORY_ICONS[i % CATEGORY_ICONS.length];
                  return (
                    <motion.div key={category.id} {...fadeUp(i * 0.08)}>
                      <Card className="h-full p-6">
                        <div className="flex size-11 items-center justify-center rounded-full border-2 border-ink bg-gold text-ink">
                          <Icon className="size-5" />
                        </div>
                        <h3 className="mt-4 text-lg text-ink">{category.name}</h3>
                        <p className="mt-2 text-sm text-ink-soft">
                          {category.description ?? `Show off your ${category.name.toLowerCase()} skills.`}
                        </p>
                        <p className="mt-3 text-xs font-bold text-ink-soft/70 uppercase">
                          Scored out of {category.maxScore}
                        </p>
                      </Card>
                    </motion.div>
                  );
                })}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h2 className="text-4xl text-ink sm:text-5xl">Think you meet the criteria?</h2>
        <p className="mx-auto mt-3 max-w-md text-ink-soft">
          Registration only takes a few minutes. Have your photo, video, and documents ready.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button variant="primary" size="lg" asChild>
            <Link to="/register">
              Register your act <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to="/contact">Have questions?</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
