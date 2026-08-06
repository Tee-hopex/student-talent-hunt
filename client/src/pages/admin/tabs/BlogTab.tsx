import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Newspaper, Plus, Trash2 } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { BlogPost } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { InputField, SelectField, TextareaField } from "@/components/form/Field";
import { CheckboxField } from "@/components/form/Checkbox";

const postSchema = z.object({
  title: z.string().min(3, "Title is too short"),
  excerpt: z.string().optional(),
  content: z.string().min(10, "Add more content"),
  type: z.enum(["NEWS", "ANNOUNCEMENT", "DEADLINE_REMINDER"]),
  isPublished: z.boolean(),
});
type PostFormValues = z.infer<typeof postSchema>;

export function BlogTab() {
  const queryClient = useQueryClient();
  const [composing, setComposing] = useState(false);

  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog", "admin"],
    queryFn: async () => {
      const { data } = await api.get<BlogPost[]>("/blog/admin");
      return data;
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: { type: "NEWS", isPublished: true },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PostFormValues) => {
      await api.post("/blog", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog"] });
      reset();
      setComposing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/blog/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blog"] }),
  });

  const publishMutation = useMutation({
    mutationFn: async ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      api.patch(`/blog/${id}`, { isPublished }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blog"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl text-ink">News & announcements</h3>
        <Button variant="outline" size="sm" onClick={() => setComposing((v) => !v)}>
          <Plus className="size-4" /> New post
        </Button>
      </div>

      {composing && (
        <Card className="p-6">
          <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
            {createMutation.isError && (
              <div className="flex items-start gap-3 border-2 border-coral bg-coral/5 p-4">
                <AlertTriangle className="size-5 shrink-0 text-coral" />
                <p className="text-sm text-ink">{getErrorMessage(createMutation.error)}</p>
              </div>
            )}
            <InputField label="Title" required error={errors.title?.message} {...register("title")} />
            <TextareaField label="Excerpt" hint="Short summary shown in listings" {...register("excerpt")} />
            <TextareaField label="Content" required error={errors.content?.message} {...register("content")} />
            <SelectField
              label="Type"
              options={[
                { value: "NEWS", label: "News" },
                { value: "ANNOUNCEMENT", label: "Announcement" },
                { value: "DEADLINE_REMINDER", label: "Deadline reminder" },
              ]}
              {...register("type")}
            />
            <CheckboxField label="Publish immediately" {...register("isPublished")} />
            <Button type="submit" variant="primary" size="sm" isLoading={createMutation.isPending}>
              Save post
            </Button>
          </form>
        </Card>
      )}

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : !posts || posts.length === 0 ? (
        <EmptyState icon={Newspaper} title="No posts yet" description="Write your first update above." />
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Card key={post.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant={post.isPublished ? "success" : "neutral"}>
                    {post.isPublished ? "Published" : "Draft"}
                  </Badge>
                  <Badge variant="plum">{post.type.replace("_", " ")}</Badge>
                </div>
                <p className="mt-2 font-display text-lg text-ink">{post.title}</p>
                {post.publishedAt && <p className="text-xs text-ink-soft">{formatDate(post.publishedAt)}</p>}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  isLoading={publishMutation.isPending && publishMutation.variables?.id === post.id}
                  onClick={() => publishMutation.mutate({ id: post.id, isPublished: !post.isPublished })}
                >
                  {post.isPublished ? "Unpublish" : "Publish"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-coral hover:bg-coral/10"
                  isLoading={deleteMutation.isPending && deleteMutation.variables === post.id}
                  onClick={() => confirm(`Delete "${post.title}"?`) && deleteMutation.mutate(post.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
