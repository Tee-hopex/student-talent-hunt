import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Award, CheckCircle2, Trophy } from "lucide-react";
import { api } from "@/lib/api";
import type { Event, ResultRanking } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { SelectField } from "@/components/form/Field";

export function ResultsTab({ event }: { event?: Event }) {
  const queryClient = useQueryClient();
  const [categoryId, setCategoryId] = useState("");
  const activeCategoryId = categoryId || event?.categories[0]?.id || "";

  const publishMutation = useMutation({
    mutationFn: async (publish: boolean) => {
      await api.patch(`/events/${event!.id}`, {
        resultsPublishedAt: publish ? new Date().toISOString() : null,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }),
  });

  const { data: ranking, isLoading } = useQuery({
    queryKey: ["reports", "results", activeCategoryId],
    queryFn: async () => {
      const { data } = await api.get<ResultRanking[]>("/reports/results", { params: { categoryId: activeCategoryId } });
      return data;
    },
    enabled: !!activeCategoryId,
  });

  if (!event) return null;

  const isPublished = !!event.resultsPublishedAt && new Date(event.resultsPublishedAt) <= new Date();

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center justify-between gap-4 p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-full border-2 border-ink bg-gold text-ink">
            <Trophy className="size-5" />
          </span>
          <div>
            <p className="text-lg text-ink">{isPublished ? "Results are live" : "Results are hidden"}</p>
            <p className="text-sm text-ink-soft">
              {isPublished
                ? "The public results/leaderboard page is showing winners now."
                : "Publish when judging is complete to reveal winners to the public."}
            </p>
          </div>
        </div>
        <Button
          variant={isPublished ? "outline" : "primary"}
          isLoading={publishMutation.isPending}
          onClick={() => publishMutation.mutate(!isPublished)}
        >
          <CheckCircle2 className="size-4" /> {isPublished ? "Unpublish" : "Publish results"}
        </Button>
      </Card>

      <SelectField
        label="Category"
        value={activeCategoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        options={event.categories.map((c) => ({ value: c.id, label: c.name }))}
        className="w-64"
      />

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : !ranking || ranking.length === 0 ? (
        <EmptyState icon={Award} title="No approved contestants yet" description="Standings appear once applications are approved and scored." />
      ) : (
        <div className="space-y-3">
          {ranking.map((r, i) => (
            <Card key={r.applicationId} className="flex items-center gap-4 p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-gold font-display text-lg text-ink">
                {i + 1}
              </span>
              <div className="flex-1">
                <p className="font-display text-lg text-ink">{r.studentName}</p>
                <p className="text-xs text-ink-soft">{r.school}</p>
              </div>
              <div className="flex gap-4 text-right">
                <div>
                  <p className="text-xs text-ink-soft">Score</p>
                  <p className="font-semibold text-ink">{r.avgScore} ({r.judgeCount})</p>
                </div>
                <div>
                  <p className="text-xs text-ink-soft">Votes</p>
                  <p className="font-semibold text-ink">{r.voteCount}</p>
                </div>
              </div>
              {i === 0 && <Badge variant="gold">Leading</Badge>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
