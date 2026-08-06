import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertTriangle, Heart, Timer, Vote as VoteIcon } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import { cn, fileUrl } from "@/lib/utils";
import { getDeviceId } from "@/lib/device";
import type { Event, VoteLeaderboardEntry } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { StampReveal } from "@/components/ui/StampReveal";
import { Turnstile } from "@/components/form/Turnstile";

const VOTED_KEY = "sgt_voted_categories";

function getVotedCategories(): string[] {
  try {
    return JSON.parse(localStorage.getItem(VOTED_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function markCategoryVoted(categoryId: string) {
  const current = getVotedCategories();
  if (!current.includes(categoryId)) {
    localStorage.setItem(VOTED_KEY, JSON.stringify([...current, categoryId]));
  }
}

export function Vote() {
  const [categoryId, setCategoryId] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [votedCategories, setVotedCategories] = useState<string[]>([]);
  const [justVotedFor, setJustVotedFor] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => setVotedCategories(getVotedCategories()), []);

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ["events", "current"],
    queryFn: async () => {
      const { data } = await api.get<Event | null>("/events/current");
      return data;
    },
  });

  const activeCategoryId = categoryId || event?.categories[0]?.id || "";
  const hasVotedThisCategory = votedCategories.includes(activeCategoryId);

  const { data: leaderboard, isLoading: boardLoading } = useQuery({
    queryKey: ["votes", "leaderboard", activeCategoryId],
    queryFn: async () => {
      const { data } = await api.get<VoteLeaderboardEntry[]>("/votes/leaderboard", { params: { categoryId: activeCategoryId } });
      return data;
    },
    enabled: !!activeCategoryId,
    refetchInterval: 15000,
  });

  const voteMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      await api.post("/votes", { applicationId, deviceId: getDeviceId(), captchaToken });
    },
    onSuccess: (_data, applicationId) => {
      markCategoryVoted(activeCategoryId);
      setVotedCategories(getVotedCategories());
      setJustVotedFor(applicationId);
      queryClient.invalidateQueries({ queryKey: ["votes", "leaderboard", activeCategoryId] });
      setTimeout(() => setJustVotedFor(null), 2200);
    },
    onError: () => {
      // If the server says we've already voted, sync local state so the UI
      // reflects reality even if this browser's localStorage got cleared.
      markCategoryVoted(activeCategoryId);
      setVotedCategories(getVotedCategories());
    },
  });

  const now = new Date();
  const votingOpen = event?.votingOpensAt && new Date(event.votingOpensAt) <= now;

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
      <SectionHeading
        eyebrow="Public vote"
        title="Cast your vote."
        description="One vote per category, per device. Pick your favorite act below."
        align="center"
        className="mx-auto"
      />

      {eventLoading ? (
        <Skeleton className="mt-10 h-96 w-full" />
      ) : !event ? (
        <EmptyState icon={VoteIcon} title="No event right now" description="Check back closer to the show." className="mt-10" />
      ) : !votingOpen ? (
        <EmptyState
          icon={Timer}
          title="Voting hasn't opened yet"
          description={
            event.votingOpensAt
              ? `Come back after ${new Date(event.votingOpensAt).toLocaleString()} to vote for your favorite act.`
              : "The admin team hasn't scheduled voting for this event yet."
          }
          className="mt-10"
        />
      ) : (
        <div className="mt-10">
          <div className="mb-6 flex flex-wrap justify-center gap-2">
            {event.categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategoryId(c.id)}
                className={cn(
                  "rounded-full border-2 border-ink px-4 py-2 text-xs font-bold tracking-wide uppercase",
                  c.id === activeCategoryId ? "bg-ink text-cream" : "bg-white text-ink hover:bg-ink/5",
                )}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="mb-6 mx-auto max-w-sm">
            <Turnstile onVerify={setCaptchaToken} />
          </div>

          {hasVotedThisCategory && (
            <div className="mb-6 flex items-center justify-center gap-2 border-2 border-green bg-green/10 px-4 py-3 text-sm font-semibold text-ink">
              <Heart className="size-4 fill-green text-green" /> You've already voted in this category — thanks for taking part!
            </div>
          )}

          {voteMutation.isError && !hasVotedThisCategory && (
            <div className="mb-6 flex items-center justify-center gap-2 border-2 border-coral bg-coral/5 px-4 py-3 text-sm text-ink">
              <AlertTriangle className="size-4 shrink-0 text-coral" /> {getErrorMessage(voteMutation.error)}
            </div>
          )}

          {boardLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : !leaderboard || leaderboard.length === 0 ? (
            <EmptyState icon={VoteIcon} title="No contestants yet" description="Approved acts in this category will appear here." />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {leaderboard.map((entry, i) => (
                <motion.div
                  key={entry.applicationId}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.04 }}
                >
                  <Card className="flex h-full flex-col p-5">
                    <div className="flex items-center gap-4">
                      {entry.photoUrl && (
                        <img src={fileUrl(entry.photoUrl)} alt="" className="size-14 border-2 border-ink object-cover" />
                      )}
                      <div>
                        <p className="font-display text-lg text-ink">{entry.studentName}</p>
                        <p className="text-xs text-ink-soft">{entry.school}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-1 items-end justify-between">
                      <Badge variant="plum">{entry.voteCount} {entry.voteCount === 1 ? "vote" : "votes"}</Badge>
                      {justVotedFor === entry.applicationId ? (
                        <StampReveal text="Voted!" className="px-3 py-1.5 text-base" />
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={hasVotedThisCategory}
                          isLoading={voteMutation.isPending && voteMutation.variables === entry.applicationId}
                          onClick={() => voteMutation.mutate(entry.applicationId)}
                        >
                          <Heart className="size-3.5" /> Vote
                        </Button>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
