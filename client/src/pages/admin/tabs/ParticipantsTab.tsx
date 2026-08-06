import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Eye, FileText, Loader2, ShieldCheck, Ticket, X } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import { cn, fileUrl, formatDate } from "@/lib/utils";
import type { AccessLog, Application, ApplicationStatus, Event } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { SelectField, TextareaField } from "@/components/form/Field";

const STATUS_VARIANT: Record<ApplicationStatus, "warning" | "success" | "danger"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

export function ParticipantsTab({ event }: { event?: Event }) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "">("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [rejecting, setRejecting] = useState<Application | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [viewingDocs, setViewingDocs] = useState<Application | null>(null);

  const { data: applications, isLoading } = useQuery({
    queryKey: ["applications", "admin", event?.id, statusFilter, categoryFilter],
    queryFn: async () => {
      const { data } = await api.get<Application[]>("/applications", {
        params: {
          eventId: event?.id,
          status: statusFilter || undefined,
          categoryId: categoryFilter || undefined,
        },
      });
      return data;
    },
    enabled: !!event,
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status, rejectionReason }: { id: string; status: "APPROVED" | "REJECTED"; rejectionReason?: string }) => {
      await api.patch(`/applications/${id}/status`, { status, rejectionReason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications", "admin"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      setRejecting(null);
      setRejectReason("");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4">
        <SelectField
          label="Status"
          placeholder="All statuses"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | "")}
          options={[
            { value: "PENDING", label: "Pending" },
            { value: "APPROVED", label: "Approved" },
            { value: "REJECTED", label: "Rejected" },
          ]}
          className="w-48"
        />
        <SelectField
          label="Category"
          placeholder="All categories"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          options={(event?.categories ?? []).map((c) => ({ value: c.id, label: c.name }))}
          className="w-48"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !applications || applications.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No applications match"
          description="Try a different filter, or check back once students start registering."
        />
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <Card key={app.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                {app.photoUrl && (
                  <img src={fileUrl(app.photoUrl)} alt="" className="size-14 border-2 border-ink object-cover" />
                )}
                <div>
                  <p className="font-display text-lg text-ink">{app.student?.fullName}</p>
                  <p className="text-xs text-ink-soft">
                    {app.student?.school} · {app.student?.studentClass} · {app.category?.name}
                  </p>
                  <p className="mt-0.5 text-[0.65rem] text-ink-soft/70">Submitted {formatDate(app.submittedAt)}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={STATUS_VARIANT[app.status]}>{app.status}</Badge>
                <Button variant="outline" size="sm" onClick={() => setViewingDocs(app)}>
                  <Eye className="size-3.5" /> Documents
                </Button>
                {app.status !== "APPROVED" && (
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={statusMutation.isPending && statusMutation.variables?.id === app.id}
                    onClick={() => statusMutation.mutate({ id: app.id, status: "APPROVED" })}
                  >
                    <Check className="size-3.5" /> Approve
                  </Button>
                )}
                {app.status !== "REJECTED" && (
                  <Button variant="dark" size="sm" onClick={() => setRejecting(app)}>
                    <X className="size-3.5" /> Reject
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={!!rejecting}
        onOpenChange={(open) => !open && setRejecting(null)}
        title="Reject application"
        description={rejecting ? `${rejecting.student?.fullName}'s application` : ""}
      >
        <TextareaField
          label="Reason"
          required
          hint="Shown to the student, so make it specific and actionable."
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
        {statusMutation.isError && (
          <p className="mt-2 text-xs font-semibold text-coral">{getErrorMessage(statusMutation.error)}</p>
        )}
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setRejecting(null)}>
            Cancel
          </Button>
          <Button
            variant="dark"
            disabled={!rejectReason.trim()}
            isLoading={statusMutation.isPending}
            onClick={() => rejecting && statusMutation.mutate({ id: rejecting.id, status: "REJECTED", rejectionReason: rejectReason })}
          >
            Confirm rejection
          </Button>
        </div>
      </Modal>

      <DocumentsModal application={viewingDocs} onClose={() => setViewingDocs(null)} />
    </div>
  );
}

function DocumentsModal({ application, onClose }: { application: Application | null; onClose: () => void }) {
  const { data: accessLog } = useQuery({
    queryKey: ["access-log", application?.id],
    queryFn: async () => {
      const { data } = await api.get<AccessLog[]>(`/documents/applications/${application!.id}/access-log`);
      return data;
    },
    enabled: !!application,
  });

  const [loadingDoc, setLoadingDoc] = useState<"government-id" | "parental-consent" | null>(null);

  async function openSecureFile(kind: "government-id" | "parental-consent") {
    setLoadingDoc(kind);
    try {
      const res = await api.get(`/documents/applications/${application!.id}/${kind}`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data as Blob);
      window.open(url, "_blank");
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setLoadingDoc(null);
    }
  }

  if (!application) return null;

  return (
    <Modal open={!!application} onOpenChange={(open) => !open && onClose()} title="Application documents">
      <div className="space-y-3">
        <button
          onClick={() => openSecureFile("government-id")}
          disabled={loadingDoc !== null}
          className="flex w-full items-center gap-3 border-2 border-ink bg-white p-4 text-left hover:bg-ink/5 disabled:opacity-60"
        >
          {loadingDoc === "government-id" ? (
            <Loader2 className="size-5 animate-spin text-coral" />
          ) : (
            <FileText className="size-5 text-coral" />
          )}
          <div>
            <p className="text-sm font-semibold text-ink">Government ID</p>
            <p className="text-xs text-ink-soft">
              {loadingDoc === "government-id" ? "Decrypting…" : "Encrypted — opens in a new tab, access is logged"}
            </p>
          </div>
        </button>
        <button
          onClick={() => openSecureFile("parental-consent")}
          disabled={loadingDoc !== null}
          className="flex w-full items-center gap-3 border-2 border-ink bg-white p-4 text-left hover:bg-ink/5 disabled:opacity-60"
        >
          {loadingDoc === "parental-consent" ? (
            <Loader2 className="size-5 animate-spin text-coral" />
          ) : (
            <ShieldCheck className="size-5 text-coral" />
          )}
          <div>
            <p className="text-sm font-semibold text-ink">Parental consent</p>
            <p className="text-xs text-ink-soft">
              {loadingDoc === "parental-consent" ? "Decrypting…" : "Encrypted — opens in a new tab, access is logged"}
            </p>
          </div>
        </button>

        {accessLog && accessLog.length > 0 && (
          <div className="mt-4 border-t-2 border-dashed border-ink/20 pt-4">
            <p className="mb-2 text-xs font-bold tracking-wide text-ink-soft uppercase">Access history</p>
            <div className="space-y-1.5">
              {accessLog.slice(0, 5).map((log) => (
                <p key={log.id} className={cn("text-xs text-ink-soft")}>
                  {log.actor.name} — {log.action.replace("_", " ").toLowerCase()} — {formatDate(log.createdAt)}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
