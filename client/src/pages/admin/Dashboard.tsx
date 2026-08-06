import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Event } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { CalendarOff } from "lucide-react";
import { OverviewTab } from "./tabs/OverviewTab";
import { EventTab } from "./tabs/EventTab";
import { ParticipantsTab } from "./tabs/ParticipantsTab";
import { JudgesTab } from "./tabs/JudgesTab";
import { BlogTab } from "./tabs/BlogTab";
import { ResultsTab } from "./tabs/ResultsTab";

export function AdminDashboard() {
  const { data: events, isLoading } = useQuery({
    queryKey: ["events", "admin", "all"],
    queryFn: async () => {
      const { data } = await api.get<Event[]>("/events/admin/all");
      return data;
    },
  });

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const event = events?.find((e) => e.id === selectedEventId) ?? events?.[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge variant="plum" className="mb-3">
            Admin
          </Badge>
          <h1 className="text-4xl text-ink sm:text-5xl">Run the show.</h1>
        </div>

        {events && events.length > 1 && (
          <select
            value={event?.id}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="border-2 border-ink bg-white px-4 py-2.5 text-sm font-semibold text-ink"
          >
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} ({e.status})
              </option>
            ))}
          </select>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : !events || events.length === 0 ? (
        <div className="space-y-8">
          <EmptyState
            icon={CalendarOff}
            title="No event yet"
            description="Create your first event below to start accepting registrations."
          />
          <EventTab event={undefined} />
        </div>
      ) : (
        <Tabs defaultValue="overview">
          <TabsList className="mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="participants">Participants</TabsTrigger>
            <TabsTrigger value="judges">Judges</TabsTrigger>
            <TabsTrigger value="blog">News & Blog</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="event">Event settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab event={event} />
          </TabsContent>
          <TabsContent value="participants">
            <ParticipantsTab event={event} />
          </TabsContent>
          <TabsContent value="judges">
            <JudgesTab event={event} />
          </TabsContent>
          <TabsContent value="blog">
            <BlogTab />
          </TabsContent>
          <TabsContent value="results">
            <ResultsTab event={event} />
          </TabsContent>
          <TabsContent value="event">
            <EventTab event={event} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
