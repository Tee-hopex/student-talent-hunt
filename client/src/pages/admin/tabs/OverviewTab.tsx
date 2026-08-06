import { useQuery } from "@tanstack/react-query";
import { BarChart3, CheckCircle2, Clock, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import type { Event, ReportOverview } from "@/types";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

function StatTile({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: React.ElementType; tone: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <span className={`flex size-10 items-center justify-center rounded-full border-2 border-ink ${tone}`}>
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-xs font-bold tracking-wide text-ink-soft uppercase">{label}</p>
          <p className="font-display text-2xl text-ink">{value}</p>
        </div>
      </div>
    </Card>
  );
}

export function OverviewTab({ event }: { event?: Event }) {
  const { data, isLoading } = useQuery({
    queryKey: ["reports", "overview", event?.id],
    queryFn: async () => {
      const { data } = await api.get<ReportOverview>("/reports/overview", { params: { eventId: event?.id } });
      return data;
    },
    enabled: !!event,
  });

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (!data) return null;

  const maxCategoryCount = Math.max(1, ...data.byCategory.map((c) => c.count));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatTile label="Total" value={data.totals.total} icon={BarChart3} tone="bg-plum text-cream" />
        <StatTile label="Approved" value={data.totals.approved} icon={CheckCircle2} tone="bg-green text-cream" />
        <StatTile label="Pending" value={data.totals.pending} icon={Clock} tone="bg-gold text-ink" />
        <StatTile label="Rejected" value={data.totals.rejected} icon={XCircle} tone="bg-coral text-cream" />
        <StatTile label="Approval rate" value={`${data.totals.approvalRate}%`} icon={CheckCircle2} tone="bg-ink text-cream" />
      </div>

      <Card className="p-6">
        <h3 className="text-xl text-ink">Registrations by category</h3>
        {data.byCategory.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="No registrations yet"
            description="Once students start applying, category breakdowns show up here."
            className="mt-4"
          />
        ) : (
          <div className="mt-5 space-y-4">
            {data.byCategory.map((c) => (
              <div key={c.categoryId}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-semibold text-ink">{c.categoryName}</span>
                  <span className="text-ink-soft">{c.count}</span>
                </div>
                <div className="h-3 border-2 border-ink bg-cream-dim">
                  <div
                    className="h-full bg-coral"
                    style={{ width: `${(c.count / maxCategoryCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
