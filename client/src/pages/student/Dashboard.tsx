import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  Mic2,
  Pencil,
  Ticket,
  Upload,
  XCircle,
} from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { cn, fileUrl, formatDate } from "@/lib/utils";
import type { Application, Notification, StudentProfile } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { InputField, TextareaField } from "@/components/form/Field";
import { FileDropField } from "@/components/form/FileDropField";

const STATUS_META = {
  PENDING: { label: "Under review", icon: Clock, badge: "warning" as const },
  APPROVED: { label: "Approved", icon: CheckCircle2, badge: "success" as const },
  REJECTED: { label: "Not approved", icon: XCircle, badge: "danger" as const },
};

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] as const },
  };
}

export function StudentDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["students", "me"],
    queryFn: async () => {
      const { data } = await api.get<StudentProfile>("/students/me");
      return data;
    },
  });

  const { data: applications, isLoading: appsLoading } = useQuery({
    queryKey: ["applications", "mine"],
    queryFn: async () => {
      const { data } = await api.get<Application[]>("/applications/mine");
      return data;
    },
  });

  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await api.get<Notification[]>("/notifications");
      return data;
    },
  });

  const application = applications?.[0];
  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await api.patch("/notifications/read-all");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <motion.div {...fadeUp()} className="mb-10">
        <Badge variant="coral" className="mb-3">
          Student dashboard
        </Badge>
        <h1 className="text-4xl text-ink sm:text-5xl">
          Hey {user?.name.split(" ")[0] ?? "there"}.
        </h1>
        <p className="mt-2 text-ink-soft">Here's where things stand with your act.</p>
      </motion.div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-8">
          <motion.div {...fadeUp(0.05)}>
            {appsLoading ? (
              <Skeleton className="h-56 w-full" />
            ) : !application ? (
              <EmptyState
                icon={Ticket}
                title="No application on file"
                description="Your account was created but we don't see a submitted application. Reach out via the contact page and we'll help you sort it out."
                action={
                  <Button variant="outline" asChild>
                    <Link to="/contact">Contact support</Link>
                  </Button>
                }
              />
            ) : (
              <ApplicationCard application={application} />
            )}
          </motion.div>

          {application && (application.status === "PENDING" || application.status === "APPROVED") && (
            <motion.div {...fadeUp(0.1)}>
              <MediaUpdateCard application={application} />
            </motion.div>
          )}
        </div>

        <div className="space-y-8">
          <motion.div {...fadeUp(0.05)}>
            {profileLoading ? <Skeleton className="h-72 w-full" /> : profile && <ProfileCard profile={profile} />}
          </motion.div>

          <motion.div {...fadeUp(0.15)}>
            <NotificationsCard
              notifications={notifications}
              isLoading={notificationsLoading}
              unreadCount={unreadCount}
              isMarkingAllRead={markAllReadMutation.isPending}
              onMarkAllRead={() => markAllReadMutation.mutate()}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function ApplicationCard({ application }: { application: Application }) {
  const meta = STATUS_META[application.status];
  const Icon = meta.icon;

  return (
    <Card ticket className="overflow-visible">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-full border-2 border-ink bg-gold text-ink">
              <Mic2 className="size-5" />
            </span>
            <div>
              <p className="text-xs font-bold tracking-wide text-ink-soft uppercase">
                {application.category?.name ?? "Category"}
              </p>
              <h2 className="text-2xl text-ink">{application.event?.title ?? "Your act"}</h2>
            </div>
          </div>
          <Badge variant={meta.badge}>
            <Icon className="size-3.5" /> {meta.label}
          </Badge>
        </div>

        {application.status === "REJECTED" && application.rejectionReason && (
          <div className="mt-5 flex items-start gap-3 border-2 border-coral bg-coral/5 p-4">
            <AlertTriangle className="size-5 shrink-0 text-coral" />
            <div>
              <p className="text-sm font-semibold text-ink">Why it wasn't approved</p>
              <p className="mt-1 text-sm text-ink-soft">{application.rejectionReason}</p>
            </div>
          </div>
        )}

        {application.status === "PENDING" && (
          <p className="mt-5 text-sm text-ink-soft">
            The admin team is reviewing your application. This usually doesn't take long — we'll
            notify you the moment there's an update.
          </p>
        )}

        {application.status === "APPROVED" && (
          <p className="mt-5 text-sm text-ink-soft">
            You're confirmed for the show. Make sure your performance video is uploaded before the
            deadline if you haven't added one yet.
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-4 text-xs text-ink-soft">
          {application.photoUrl && (
            <img
              src={fileUrl(application.photoUrl)}
              alt="Your submitted photo"
              className="size-16 border-2 border-ink object-cover"
            />
          )}
          <div className="self-center">
            <p>Submitted {formatDate(application.submittedAt)}</p>
            <p className="mt-0.5">{application.videoUrl ? "Performance video on file" : "No performance video yet"}</p>
          </div>
        </div>
      </div>
      <div className="border-t-2 border-dashed border-ink/40 px-6 py-3">
        <p className="text-[0.65rem] font-bold tracking-[0.2em] text-ink-soft uppercase">
          Application #{application.id.slice(-6).toUpperCase()}
        </p>
      </div>
    </Card>
  );
}

function MediaUpdateCard({ application }: { application: Application }) {
  const queryClient = useQueryClient();
  const [video, setVideo] = useState<File | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      if (photo) formData.append("photo", photo);
      if (video) formData.append("video", video);
      await api.patch(`/applications/${application.id}/media`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications", "mine"] });
      setVideo(null);
      setPhoto(null);
    },
  });

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-full border-2 border-ink bg-teal text-ink">
          <Upload className="size-5" />
        </span>
        <h3 className="text-xl text-ink">Update your media</h3>
      </div>
      <p className="mt-2 text-sm text-ink-soft">
        Swap in a new photo or add/replace your performance video. This overwrites what's currently
        on file.
      </p>

      <div className="mt-5 space-y-4">
        <FileDropField
          label="Photo"
          accept="image/png,image/jpeg,image/webp"
          value={photo}
          onChange={setPhoto}
        />
        <FileDropField
          label="Performance video"
          accept="video/mp4,video/quicktime,video/webm"
          hint="Max 5 minutes"
          value={video}
          onChange={setVideo}
        />
      </div>

      {mutation.isError && (
        <div className="mt-4 flex items-start gap-3 border-2 border-coral bg-coral/5 p-3">
          <AlertTriangle className="size-4 shrink-0 text-coral" />
          <p className="text-xs text-ink">{getErrorMessage(mutation.error)}</p>
        </div>
      )}
      {mutation.isSuccess && (
        <p className="mt-4 text-xs font-semibold text-green">Updated! Your file is on record.</p>
      )}

      <Button
        variant="dark"
        className="mt-5"
        disabled={!photo && !video}
        isLoading={mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        Save changes
      </Button>
    </Card>
  );
}

const profileSchema = {
  guardianName: "",
  guardianPhone: "",
  guardianEmail: "",
  address: "",
  phone: "",
};

function ProfileCard({ profile }: { profile: StudentProfile }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      ...profileSchema,
      guardianName: profile.guardianName,
      guardianPhone: profile.guardianPhone,
      guardianEmail: profile.guardianEmail ?? "",
      address: profile.address ?? "",
      phone: profile.user.phone ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof profileSchema) => {
      await api.patch("/students/me", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", "me"] });
      setEditing(false);
    },
  });

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl text-ink">Your profile</h3>
        <button
          onClick={() => {
            if (editing) reset();
            setEditing((v) => !v);
          }}
          className="flex size-8 items-center justify-center rounded-full border-2 border-ink text-ink hover:bg-ink/5"
          aria-label="Edit profile"
        >
          <Pencil className="size-3.5" />
        </button>
      </div>

      {!editing ? (
        <dl className="mt-4 space-y-3 text-sm">
          {[
            ["Name", profile.fullName],
            ["School", `${profile.school} (${profile.studentClass})`],
            ["Email", profile.user.email],
            ["Phone", profile.user.phone || "—"],
            ["Guardian", profile.guardianName],
            ["Guardian phone", profile.guardianPhone],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 border-b border-ink/10 pb-2">
              <dt className="text-ink-soft">{label}</dt>
              <dd className="text-right font-semibold text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <form
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          className="mt-4 space-y-4"
        >
          <InputField label="Your phone" {...register("phone")} />
          <InputField label="Guardian's name" {...register("guardianName")} />
          <InputField label="Guardian's phone" {...register("guardianPhone")} />
          <InputField label="Guardian's email" type="email" {...register("guardianEmail")} />
          <TextareaField label="Address" {...register("address")} />
          {mutation.isError && <p className="text-xs font-semibold text-coral">{getErrorMessage(mutation.error)}</p>}
          <Button type="submit" variant="primary" size="sm" isLoading={mutation.isPending}>
            Save
          </Button>
        </form>
      )}
    </Card>
  );
}

function NotificationsCard({
  notifications,
  isLoading,
  unreadCount,
  isMarkingAllRead,
  onMarkAllRead,
}: {
  notifications?: Notification[];
  isLoading: boolean;
  unreadCount: number;
  isMarkingAllRead: boolean;
  onMarkAllRead: () => void;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="size-5 text-ink" />
          <h3 className="text-xl text-ink">Notifications</h3>
          {unreadCount > 0 && <Badge variant="coral">{unreadCount} new</Badge>}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            disabled={isMarkingAllRead}
            className="text-xs font-semibold text-coral underline disabled:opacity-60"
          >
            {isMarkingAllRead ? "Marking…" : "Mark all read"}
          </button>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : !notifications || notifications.length === 0 ? (
          <p className="text-sm text-ink-soft">Nothing yet — updates about your application will show up here.</p>
        ) : (
          notifications.slice(0, 6).map((n) => (
            <div
              key={n.id}
              className={cn("border-l-4 py-1.5 pl-3 text-sm", n.isRead ? "border-ink/15" : "border-coral")}
            >
              <p className="font-semibold text-ink">{n.title}</p>
              <p className="mt-0.5 text-xs text-ink-soft">{n.message}</p>
              <p className="mt-1 text-[0.65rem] text-ink-soft/70">{formatDate(n.createdAt)}</p>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
