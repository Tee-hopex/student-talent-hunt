import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Gavel, Loader2, Plus, UserX, X } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import type { Event, Judge } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { InputField, TextareaField } from "@/components/form/Field";
import { CheckboxField } from "@/components/form/Checkbox";

const inviteSchema = z.object({
  name: z.string().min(2, "Enter a name"),
  email: z.string().email("Enter a valid email"),
  bio: z.string().optional(),
});
type InviteFormValues = z.infer<typeof inviteSchema>;

export function JudgesTab({ event }: { event?: Event }) {
  const queryClient = useQueryClient();
  const [inviting, setInviting] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  const { data: judges, isLoading } = useQuery({
    queryKey: ["judges"],
    queryFn: async () => {
      const { data } = await api.get<Judge[]>("/judges");
      return data;
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
  });

  const inviteMutation = useMutation({
    mutationFn: async (data: InviteFormValues) => {
      await api.post("/judges", { ...data, categoryIds: selectedCategoryIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["judges"] });
      reset();
      setSelectedCategoryIds([]);
      setInviting(false);
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await api.patch(`/judges/${id}/status`, { isActive });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["judges"] }),
  });

  const assignMutation = useMutation({
    mutationFn: async ({ judgeId, categoryId }: { judgeId: string; categoryId: string }) => {
      await api.post(`/judges/${judgeId}/categories`, { categoryId });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["judges"] }),
  });

  const unassignMutation = useMutation({
    mutationFn: async ({ judgeId, categoryId }: { judgeId: string; categoryId: string }) => {
      await api.delete(`/judges/${judgeId}/categories/${categoryId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["judges"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl text-ink">Judges</h3>
        <Button variant="outline" size="sm" onClick={() => setInviting((v) => !v)}>
          <Plus className="size-4" /> Invite judge
        </Button>
      </div>

      {inviting && (
        <Card className="p-6">
          <form onSubmit={handleSubmit((data) => inviteMutation.mutate(data))} className="space-y-4">
            {inviteMutation.isError && (
              <div className="flex items-start gap-3 border-2 border-coral bg-coral/5 p-4">
                <AlertTriangle className="size-5 shrink-0 text-coral" />
                <p className="text-sm text-ink">{getErrorMessage(inviteMutation.error)}</p>
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputField label="Name" required error={errors.name?.message} {...register("name")} />
              <InputField label="Email" type="email" required error={errors.email?.message} {...register("email")} />
            </div>
            <TextareaField label="Bio" hint="Optional" {...register("bio")} />

            {event && event.categories.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-bold tracking-wide text-ink uppercase">Assign categories</p>
                <div className="space-y-2">
                  {event.categories.map((c) => (
                    <CheckboxField
                      key={c.id}
                      label={c.name}
                      checked={selectedCategoryIds.includes(c.id)}
                      onChange={(e) =>
                        setSelectedCategoryIds((prev) =>
                          e.target.checked ? [...prev, c.id] : prev.filter((id) => id !== c.id),
                        )
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-ink-soft">
              A temporary password is generated and logged server-side (email delivery is stubbed in
              dev) — the judge should change it after their first login.
            </p>

            <Button type="submit" variant="primary" size="sm" isLoading={inviteMutation.isPending}>
              Send invite
            </Button>
          </form>
        </Card>
      )}

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : !judges || judges.length === 0 ? (
        <EmptyState icon={Gavel} title="No judges yet" description="Invite your first judge above." />
      ) : (
        <div className="space-y-4">
          {judges.map((judge) => (
            <Card key={judge.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-display text-lg text-ink">{judge.user.name}</p>
                  <p className="text-xs text-ink-soft">{judge.user.email}</p>
                  {judge.bio && <p className="mt-1 text-sm text-ink-soft">{judge.bio}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {!judge.user.isActive && <Badge variant="danger">Deactivated</Badge>}
                  <Button
                    variant="ghost"
                    size="sm"
                    isLoading={statusMutation.isPending && statusMutation.variables?.id === judge.id}
                    onClick={() => statusMutation.mutate({ id: judge.id, isActive: !judge.user.isActive })}
                  >
                    <UserX className="size-3.5" /> {judge.user.isActive ? "Deactivate" : "Reactivate"}
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {judge.categories.map(({ category }) => {
                  const isUnassigning =
                    unassignMutation.isPending &&
                    unassignMutation.variables?.judgeId === judge.id &&
                    unassignMutation.variables?.categoryId === category.id;
                  return (
                    <span
                      key={category.id}
                      className="inline-flex items-center gap-1.5 border-2 border-ink bg-gold/20 px-2.5 py-1 text-xs font-semibold"
                    >
                      {category.name}
                      <button
                        onClick={() => unassignMutation.mutate({ judgeId: judge.id, categoryId: category.id })}
                        disabled={isUnassigning}
                        aria-label={`Unassign ${category.name}`}
                      >
                        {isUnassigning ? <Loader2 className="size-3 animate-spin" /> : <X className="size-3" />}
                      </button>
                    </span>
                  );
                })}
                {event?.categories
                  .filter((c) => !judge.categories.some((jc) => jc.category.id === c.id))
                  .map((c) => {
                    const isAssigning =
                      assignMutation.isPending &&
                      assignMutation.variables?.judgeId === judge.id &&
                      assignMutation.variables?.categoryId === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => assignMutation.mutate({ judgeId: judge.id, categoryId: c.id })}
                        disabled={isAssigning}
                        className="inline-flex items-center gap-1 border-2 border-dashed border-ink/40 px-2.5 py-1 text-xs text-ink-soft hover:border-ink hover:text-ink disabled:opacity-60"
                      >
                        {isAssigning ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />} {c.name}
                      </button>
                    );
                  })}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
