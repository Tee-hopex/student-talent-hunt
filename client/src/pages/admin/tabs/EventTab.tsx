import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2, Plus, Tags, Trash2 } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import type { Event } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { InputField, SelectField, TextareaField } from "@/components/form/Field";

function toLocalInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const eventSchema = z.object({
  title: z.string().min(3, "Title is too short"),
  description: z.string().min(10, "Add a bit more description"),
  location: z.string().min(2, "Enter a location"),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  registrationOpensAt: z.string().min(1, "Required"),
  registrationClosesAt: z.string().min(1, "Required"),
  competitionStartsAt: z.string().min(1, "Required"),
  competitionEndsAt: z.string().min(1, "Required"),
  votingOpensAt: z.string().optional(),
  firstPrize: z.string().optional(),
  secondPrize: z.string().optional(),
  thirdPrize: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventSchema>;

export function EventTab({ event }: { event?: Event }) {
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors } } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    values: event
      ? {
          title: event.title,
          description: event.description,
          location: event.location,
          status: event.status,
          registrationOpensAt: toLocalInput(event.registrationOpensAt),
          registrationClosesAt: toLocalInput(event.registrationClosesAt),
          competitionStartsAt: toLocalInput(event.competitionStartsAt),
          competitionEndsAt: toLocalInput(event.competitionEndsAt),
          votingOpensAt: toLocalInput(event.votingOpensAt),
          firstPrize: event.firstPrize ?? "",
          secondPrize: event.secondPrize ?? "",
          thirdPrize: event.thirdPrize ?? "",
        }
      : undefined,
    defaultValues: {
      status: "DRAFT",
      title: "",
      description: "",
      location: "",
      registrationOpensAt: "",
      registrationClosesAt: "",
      competitionStartsAt: "",
      competitionEndsAt: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: EventFormValues) => {
      if (event) {
        await api.patch(`/events/${event.id}`, data);
      } else {
        await api.post("/events", data);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }),
  });

  return (
    <div className="space-y-8">
      <Card className="p-6 sm:p-8">
        <h3 className="text-xl text-ink">{event ? "Edit event" : "Create your first event"}</h3>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="mt-5 space-y-5">
          {mutation.isError && (
            <div className="flex items-start gap-3 border-2 border-coral bg-coral/5 p-4">
              <AlertTriangle className="size-5 shrink-0 text-coral" />
              <p className="text-sm text-ink">{getErrorMessage(mutation.error)}</p>
            </div>
          )}
          {mutation.isSuccess && <p className="text-sm font-semibold text-green">Saved.</p>}

          <InputField label="Title" required error={errors.title?.message} {...register("title")} />
          <TextareaField label="Description" required error={errors.description?.message} {...register("description")} />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <InputField label="Location" required error={errors.location?.message} {...register("location")} />
            <SelectField
              label="Status"
              options={[
                { value: "DRAFT", label: "Draft (hidden)" },
                { value: "PUBLISHED", label: "Published (live)" },
                { value: "ARCHIVED", label: "Archived" },
              ]}
              {...register("status")}
            />
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <InputField
              label="Registration opens"
              type="datetime-local"
              required
              error={errors.registrationOpensAt?.message}
              {...register("registrationOpensAt")}
            />
            <InputField
              label="Registration closes"
              type="datetime-local"
              required
              error={errors.registrationClosesAt?.message}
              {...register("registrationClosesAt")}
            />
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <InputField
              label="Competition starts"
              type="datetime-local"
              required
              error={errors.competitionStartsAt?.message}
              {...register("competitionStartsAt")}
            />
            <InputField
              label="Competition ends"
              type="datetime-local"
              required
              error={errors.competitionEndsAt?.message}
              {...register("competitionEndsAt")}
            />
          </div>
          <InputField label="Voting opens" type="datetime-local" hint="Optional" {...register("votingOpensAt")} />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <InputField label="1st prize" {...register("firstPrize")} />
            <InputField label="2nd prize" {...register("secondPrize")} />
            <InputField label="3rd prize" {...register("thirdPrize")} />
          </div>

          <Button type="submit" variant="primary" isLoading={mutation.isPending}>
            {event ? "Save changes" : "Create event"}
          </Button>
        </form>
      </Card>

      {event && <CategoriesCard event={event} />}
    </div>
  );
}

const categorySchema = z.object({
  name: z.string().min(2, "Enter a category name"),
  description: z.string().optional(),
  maxScore: z.coerce.number().int().positive().default(100),
});
type CategoryFormValues = z.input<typeof categorySchema>;

function CategoriesCard({ event }: { event: Event }) {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", description: "", maxScore: 100 },
  });

  const addMutation = useMutation({
    mutationFn: async (data: CategoryFormValues) => {
      await api.post("/categories", { ...data, eventId: event.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      reset();
      setAdding(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/categories/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }),
  });

  return (
    <Card className="p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <h3 className="text-xl text-ink">Talent categories</h3>
        <Button variant="outline" size="sm" onClick={() => setAdding((v) => !v)}>
          <Plus className="size-4" /> Add category
        </Button>
      </div>

      {adding && (
        <form
          onSubmit={handleSubmit((data) => addMutation.mutate(data))}
          className="mt-5 space-y-4 border-2 border-dashed border-ink/30 p-4"
        >
          <InputField label="Name" required error={errors.name?.message} {...register("name")} />
          <TextareaField label="Description" hint="Optional" {...register("description")} />
          <InputField label="Max score" type="number" {...register("maxScore")} />
          {addMutation.isError && <p className="text-xs font-semibold text-coral">{getErrorMessage(addMutation.error)}</p>}
          <Button type="submit" variant="primary" size="sm" isLoading={addMutation.isPending}>
            Add
          </Button>
        </form>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        {event.categories.length === 0 ? (
          <p className="text-sm text-ink-soft">No categories yet — add your first one above.</p>
        ) : (
          event.categories.map((c) => {
            const isDeleting = deleteMutation.isPending && deleteMutation.variables === c.id;
            return (
              <span key={c.id} className="inline-flex items-center gap-2 border-2 border-ink bg-white px-3 py-1.5 text-sm">
                <Tags className="size-3.5" />
                {c.name}
                <button
                  onClick={() => deleteMutation.mutate(c.id)}
                  disabled={isDeleting}
                  className="text-ink-soft hover:text-coral disabled:opacity-60"
                  aria-label={`Remove ${c.name}`}
                >
                  {isDeleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                </button>
              </span>
            );
          })
        )}
      </div>
    </Card>
  );
}
