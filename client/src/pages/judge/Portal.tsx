import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Gavel, PlayCircle, Star } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import { cn, fileUrl } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import type { Application } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { StampReveal } from "@/components/ui/StampReveal";
import { InputField, TextareaField } from "@/components/form/Field";

export function JudgePortal() {
  const { user } = useAuth();
  const [categoryFilter, setCategoryFilter] = useState("");

  const { data: applications, isLoading } = useQuery({
    queryKey: ["applications", "judge"],
    queryFn: async () => {
      const { data } = await api.get<Application[]>("/applications", { params: { status: "APPROVED" } });
      return data;
    },
  });

  const categories = Array.from(
    new Map((applications ?? []).map((a) => [a.category!.id, a.category!])).values(),
  );
  const visible = categoryFilter ? applications?.filter((a) => a.categoryId === categoryFilter) : applications;
  const scoredCount = applications?.filter((a) => (a.scores?.length ?? 0) > 0).length ?? 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8">
        <Badge variant="coral" className="mb-3">
          Judges' portal
        </Badge>
        <h1 className="text-4xl text-ink sm:text-5xl">
          Hey {user?.name.split(" ")[0] ?? "judge"}.
        </h1>
        <p className="mt-2 text-ink-soft">
          {applications
            ? `${scoredCount} of ${applications.length} contestants scored so far.`
            : "Loading your assigned contestants…"}
        </p>
      </div>

      {categories.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setCategoryFilter("")}
            className={cn(
              "rounded-full border-2 border-ink px-4 py-2 text-xs font-bold tracking-wide uppercase",
              !categoryFilter ? "bg-ink text-cream" : "bg-white text-ink hover:bg-ink/5",
            )}
          >
            All categories
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryFilter(c.id)}
              className={cn(
                "rounded-full border-2 border-ink px-4 py-2 text-xs font-bold tracking-wide uppercase",
                categoryFilter === c.id ? "bg-ink text-cream" : "bg-white text-ink hover:bg-ink/5",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : !visible || visible.length === 0 ? (
        <EmptyState
          icon={Gavel}
          title="Nothing to score yet"
          description="Once applications in your assigned categories are approved, they'll show up here."
        />
      ) : (
        <div className="space-y-6">
          {visible.map((app) => (
            <ScoreCard key={app.id} application={app} />
          ))}
        </div>
      )}
    </div>
  );
}

const scoreSchema = { score: 0, comment: "" };
type ScoreFormValues = typeof scoreSchema;

function ScoreCard({ application }: { application: Application }) {
  const queryClient = useQueryClient();
  const existing = application.scores?.[0];
  const [justScored, setJustScored] = useState(false);
  const maxScore = application.category?.maxScore ?? 100;

  const { register, handleSubmit, formState: { errors } } = useForm<ScoreFormValues>({
    defaultValues: { score: existing?.score ?? 0, comment: existing?.comment ?? "" },
  });

  const mutation = useMutation({
    mutationFn: async (data: ScoreFormValues) => {
      await api.post("/scores", { applicationId: application.id, score: Number(data.score), comment: data.comment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications", "judge"] });
      setJustScored(true);
      setTimeout(() => setJustScored(false), 2200);
    },
  });

  return (
    <Card ticket className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {application.photoUrl && (
            <img src={fileUrl(application.photoUrl)} alt="" className="size-16 border-2 border-ink object-cover" />
          )}
          <div>
            <p className="font-display text-xl text-ink">{application.student?.fullName}</p>
            <p className="text-xs text-ink-soft">
              {application.student?.school} · {application.student?.studentClass}
            </p>
            <Badge variant="plum" className="mt-1.5">
              {application.category?.name}
            </Badge>
          </div>
        </div>

        {existing && !justScored && (
          <Badge variant="success">
            <Star className="size-3.5" /> Scored {existing.score}/{maxScore}
          </Badge>
        )}
      </div>

      {application.videoUrl ? (
        <a
          href={fileUrl(application.videoUrl)}
          target="_blank"
          rel="noreferrer"
          className="mt-4 flex items-center gap-2 border-2 border-ink bg-cream-dim px-4 py-3 text-sm font-semibold text-ink hover:bg-gold/20"
        >
          <PlayCircle className="size-5 text-coral" /> Watch performance video
        </a>
      ) : (
        <p className="mt-4 text-xs text-ink-soft italic">No performance video uploaded yet.</p>
      )}

      {justScored ? (
        <div className="mt-6 flex justify-center py-4">
          <StampReveal text="Scored!" />
        </div>
      ) : (
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="mt-5 space-y-4">
          {mutation.isError && (
            <div className="flex items-start gap-3 border-2 border-coral bg-coral/5 p-3">
              <AlertTriangle className="size-4 shrink-0 text-coral" />
              <p className="text-xs text-ink">{getErrorMessage(mutation.error)}</p>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[140px_1fr]">
            <InputField
              label={`Score (0-${maxScore})`}
              type="number"
              min={0}
              max={maxScore}
              error={errors.score?.message}
              {...register("score", {
                valueAsNumber: true,
                min: { value: 0, message: "Too low" },
                max: { value: maxScore, message: `Max is ${maxScore}` },
              })}
            />
            <TextareaField label="Feedback" hint="Shared with the admin team" {...register("comment")} />
          </div>
          <Button type="submit" variant="primary" size="sm" isLoading={mutation.isPending}>
            {existing ? "Update score" : "Submit score"}
          </Button>
        </form>
      )}
    </Card>
  );
}
