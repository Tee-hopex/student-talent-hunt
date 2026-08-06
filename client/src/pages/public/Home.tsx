import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, Camera, ImageOff, Mic2, Newspaper, Trophy, Users } from "lucide-react";
import { api } from "@/lib/api";
import { cn, fileUrl, formatDate } from "@/lib/utils";
import type { BlogPost, Event, GalleryItem } from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { MarqueeCountdown } from "@/components/ui/MarqueeCountdown";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";

const CATEGORY_ICONS = [Mic2, Users, Trophy, Camera];

function useCurrentEvent() {
  return useQuery({
    queryKey: ["events", "current"],
    queryFn: async () => {
      const { data } = await api.get<Event | null>("/events/current");
      return data;
    },
  });
}

function useFeaturedGallery() {
  return useQuery({
    queryKey: ["gallery", "featured"],
    queryFn: async () => {
      const { data } = await api.get<GalleryItem[]>("/gallery", { params: { featured: "true" } });
      return data;
    },
  });
}

function useLatestNews() {
  return useQuery({
    queryKey: ["blog", "latest"],
    queryFn: async () => {
      const { data } = await api.get<BlogPost[]>("/blog");
      return data.slice(0, 3);
    },
  });
}

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] as const },
  };
}

export function Home() {
  const { data: event, isLoading: eventLoading } = useCurrentEvent();
  const { data: gallery, isLoading: galleryLoading } = useFeaturedGallery();
  const { data: news, isLoading: newsLoading } = useLatestNews();

  const now = new Date();
  const registrationOpen =
    event && now >= new Date(event.registrationOpensAt) && now <= new Date(event.registrationClosesAt);
  const countdownTarget = registrationOpen ? event?.registrationClosesAt : event?.competitionStartsAt;
  const countdownLabel = registrationOpen ? "Registration closes in" : "Curtain rises in";

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-plum">
        <div className="pointer-events-none absolute inset-0 bg-grain" />
        <div className="relative mx-auto max-w-7xl px-4 pt-14 pb-16 sm:px-6 sm:pt-20 sm:pb-24 lg:px-8">
          <motion.div {...fadeUp()} className="mx-auto max-w-3xl text-center">
            <Badge variant="gold" className="mb-6">
              {event ? event.title : "Student Talent Hunt"}
            </Badge>
            <h1 className="font-display text-5xl leading-[0.95] text-cream sm:text-7xl md:text-8xl">
              Every student
              <br />
              gets a <span className="text-gradient-marquee">spotlight.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl font-sans text-base font-normal normal-case text-cream/70 sm:text-lg">
              SS3 and JSS3 students — sing, dance, act, or speak your truth. Register your act,
              submit your performance, and take the stage in front of judges, your school, and the
              public vote.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button variant="gold" size="lg" asChild>
                <Link to="/register">
                  Register your act <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button variant="outline-light" size="lg" asChild>
                <Link to="/about">See the rules</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div {...fadeUp(0.15)} className="mt-12 flex flex-col items-center gap-3">
            {eventLoading ? (
              <Skeleton className="h-24 w-full max-w-lg" />
            ) : event && countdownTarget ? (
              <>
                <span className="text-xs font-bold tracking-[0.2em] text-cream/50 uppercase">
                  {countdownLabel}
                </span>
                <MarqueeCountdown target={countdownTarget} />
              </>
            ) : null}
          </motion.div>
        </div>
      </section>

      {/* ── Quick facts ──────────────────────────────────────────────── */}
      {event && (
        <section className="border-b-2 border-ink bg-cream sm:px-4 lg:px-8">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px overflow-hidden border-2 border-ink bg-ink sm:my-8 sm:rounded-sm md:grid-cols-4">
            {[
              { icon: Calendar, label: "Show date", value: formatDate(event.competitionStartsAt) },
              { icon: Users, label: "Categories", value: `${event.categories.length} categories` },
              { icon: Trophy, label: "Top prize", value: event.firstPrize ?? "TBA" },
              { icon: Mic2, label: "Venue", value: event.location },
            ].map((fact) => (
              <div key={fact.label} className="flex items-start gap-3 bg-cream px-5 py-6">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-coral text-cream">
                  <fact.icon className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-bold tracking-wide text-ink-soft uppercase">{fact.label}</p>
                  <p className="font-display text-base text-ink">{fact.value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Categories — ticket-stub cards ──────────────────────────── */}
      {event && event.categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Talent categories"
            title="Pick your stage."
            description="Whatever your act, there's a category for it. Choose one below and start preparing your submission."
          />
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {event.categories.map((category, i) => {
              const Icon = CATEGORY_ICONS[i % CATEGORY_ICONS.length];
              return (
                <motion.div key={category.id} {...fadeUp(i * 0.05)}>
                  <Card ticket className="flex h-full flex-col overflow-visible">
                    <div className="flex flex-1 flex-col p-6">
                      <div className="flex size-12 items-center justify-center rounded-full border-2 border-ink bg-gold text-ink">
                        <Icon className="size-6" />
                      </div>
                      <h3 className="mt-4 font-display text-2xl text-ink">{category.name}</h3>
                      <p className="mt-1.5 flex-1 text-sm text-ink-soft">
                        {category.description ?? `Show off your ${category.name.toLowerCase()} talent.`}
                      </p>
                    </div>
                    <div className="border-t-2 border-dashed border-ink/40 px-6 py-3">
                      <p className="text-[0.65rem] font-bold tracking-[0.2em] text-ink-soft uppercase">
                        Admit one · Scored out of {category.maxScore}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Featured gallery ─────────────────────────────────────────── */}
      <section className="border-y-2 border-ink bg-cream-dim py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              eyebrow="Moments"
              title="Highlights from past shows."
              description="A glimpse of the energy, talent, and unforgettable performances."
            />
            <Button variant="outline" size="sm" asChild>
              <Link to="/gallery">
                See who's performing <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {galleryLoading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            ) : gallery && gallery.length > 0 ? (
              gallery.slice(0, 8).map((item, i) => (
                <motion.div
                  key={item.id}
                  {...fadeUp((i % 4) * 0.05)}
                  className={cn(
                    "group relative aspect-square overflow-hidden border-2 border-ink bg-ink/5",
                    i === 0 && "col-span-2 row-span-2 aspect-auto",
                  )}
                >
                  <img
                    src={fileUrl(item.url)}
                    alt={item.title ?? "Event highlight"}
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-coral/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                </motion.div>
              ))
            ) : (
              <div className="col-span-full">
                <EmptyState
                  icon={ImageOff}
                  title="The stage is being set"
                  description="Photos and videos from the show land here once the lights go up. Check back soon."
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Latest news ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Stay in the loop"
            title="Latest news & updates."
            description="Deadlines, announcements, and everything you need to know."
          />
          <Button variant="outline" size="sm" asChild>
            <Link to="/blog">
              Read all updates <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {newsLoading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          ) : news && news.length > 0 ? (
            news.map((post, i) => (
              <motion.div key={post.id} {...fadeUp(i * 0.08)}>
                <Link to={`/blog/${post.slug}`}>
                  <Card className="h-full p-6 transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--color-ink)]">
                    <Badge
                      variant={post.type === "DEADLINE_REMINDER" ? "warning" : post.type === "ANNOUNCEMENT" ? "coral" : "plum"}
                    >
                      {post.type.replace("_", " ")}
                    </Badge>
                    <h3 className="mt-4 font-display text-xl text-ink">{post.title}</h3>
                    {post.excerpt && (
                      <p className="mt-2 line-clamp-2 font-sans text-sm normal-case text-ink-soft">
                        {post.excerpt}
                      </p>
                    )}
                    {post.publishedAt && (
                      <p className="mt-4 text-xs font-bold text-ink-soft/70">{formatDate(post.publishedAt)}</p>
                    )}
                  </Card>
                </Link>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full">
              <EmptyState
                icon={Newspaper}
                title="No headlines yet"
                description="Deadline reminders and competition updates will be posted here as the show gets closer."
              />
            </div>
          )}
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t-2 border-ink bg-plum py-20">
        <div className="pointer-events-none absolute inset-0 bg-grain" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-4xl text-cream sm:text-6xl">
            Ready to take the <span className="text-gradient-marquee">stage?</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg font-sans text-base normal-case text-cream/70">
            Registration takes less than 10 minutes. Bring your photo, your performance video, and
            your confidence.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button variant="gold" size="lg" asChild>
              <Link to="/register">
                Register your act <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button variant="outline-light" size="lg" asChild>
              <Link to="/login">I already have an account</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
