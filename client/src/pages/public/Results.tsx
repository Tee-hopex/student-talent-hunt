import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Award, Medal, Sparkles, Trophy } from "lucide-react";
import { api } from "@/lib/api";
import { fileUrl } from "@/lib/utils";
import type { Event, PublishedResults } from "@/types";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";

const RANK_STYLE = [
  { bg: "bg-gold", icon: Trophy, label: "Winner" },
  { bg: "bg-cream-dim", icon: Medal, label: "2nd place" },
  { bg: "bg-coral-light", icon: Award, label: "3rd place" },
];

export function Results() {
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ["events", "current"],
    queryFn: async () => {
      const { data } = await api.get<Event | null>("/events/current");
      return data;
    },
  });

  const { data: results, isLoading: resultsLoading } = useQuery({
    queryKey: ["events", event?.slug, "results"],
    queryFn: async () => {
      const { data } = await api.get<PublishedResults>(`/events/${event!.slug}/results`);
      return data;
    },
    enabled: !!event?.slug,
  });

  const isLoading = eventLoading || (!!event && resultsLoading);

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
      <SectionHeading
        eyebrow="The results are in"
        title="Winners by category."
        description="Judge scores and public votes, combined."
        align="center"
        className="mx-auto"
      />

      <div className="mt-10">
        {isLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : !event ? (
          <EmptyState icon={Sparkles} title="No event right now" description="Check back closer to the show." />
        ) : !results?.published ? (
          <EmptyState
            icon={Trophy}
            title="Results haven't been announced yet"
            description="The admin team publishes winners once judging wraps up. Check back soon!"
          />
        ) : (
          <div className="space-y-10">
            {results.categories.map((cat) => (
              <div key={cat.categoryId}>
                <h3 className="mb-4 text-2xl text-ink">{cat.categoryName}</h3>
                {cat.ranking.length === 0 ? (
                  <p className="text-sm text-ink-soft">No approved contestants in this category.</p>
                ) : (
                  <div className="space-y-3">
                    {cat.ranking.map((r, i) => {
                      const rank = RANK_STYLE[i];
                      return (
                        <motion.div
                          key={r.applicationId}
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.35, delay: i * 0.05 }}
                        >
                          <Card className="flex items-center gap-4 p-5">
                            <span
                              className={`flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-ink font-display text-lg text-ink ${rank?.bg ?? "bg-white"}`}
                            >
                              {rank ? <rank.icon className="size-5" /> : i + 1}
                            </span>
                            {r.photoUrl && (
                              <img src={fileUrl(r.photoUrl)} alt="" className="size-12 border-2 border-ink object-cover" />
                            )}
                            <div className="flex-1">
                              <p className="font-display text-lg text-ink">{r.studentName}</p>
                              <p className="text-xs text-ink-soft">{r.school}</p>
                            </div>
                            <div className="flex gap-5 text-right">
                              <div>
                                <p className="text-xs text-ink-soft">Score</p>
                                <p className="font-semibold text-ink">{r.avgScore}</p>
                              </div>
                              <div>
                                <p className="text-xs text-ink-soft">Votes</p>
                                <p className="font-semibold text-ink">{r.voteCount}</p>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
