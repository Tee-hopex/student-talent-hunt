import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "react-router";
import { AlertTriangle, ArrowRight, Star } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { AuthUser } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { InputField } from "@/components/form/Field";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function dashboardPath(role: AuthUser["role"]) {
  if (role === "ADMIN") return "/admin";
  if (role === "JUDGE") return "/judge";
  return "/dashboard";
}

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const mutation = useMutation({
    mutationFn: async (data: LoginFormValues) => {
      const { data: res } = await api.post<{ token: string; user: AuthUser }>("/auth/login", data);
      return res;
    },
    onSuccess: (res) => {
      login(res.token, res.user);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? dashboardPath(res.user.role));
    },
  });

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:py-24">
      <div className="mb-8 text-center">
        <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full border-2 border-ink bg-gold text-ink">
          <Star className="size-6" fill="currentColor" />
        </span>
        <Badge variant="coral" className="mb-4">
          Welcome back
        </Badge>
        <h1 className="text-4xl text-ink">Log in.</h1>
        <p className="mt-2 text-ink-soft">Students, judges, and admins all sign in here.</p>
      </div>

      <Card className="p-6 sm:p-8">
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-5">
          {mutation.isError && (
            <div className="flex items-start gap-3 border-2 border-coral bg-coral/5 p-4">
              <AlertTriangle className="size-5 shrink-0 text-coral" />
              <p className="text-sm text-ink">{getErrorMessage(mutation.error)}</p>
            </div>
          )}

          <InputField
            label="Email address"
            type="email"
            required
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <InputField
            label="Password"
            type="password"
            required
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password")}
          />

          <Button type="submit" variant="gold" className="w-full" isLoading={mutation.isPending}>
            Log in <ArrowRight className="size-4" />
          </Button>
        </form>
      </Card>

      <p className="mt-6 text-center text-sm text-ink-soft">
        New here?{" "}
        <Link to="/register" className="font-semibold text-coral underline">
          Register your act
        </Link>
      </p>
    </div>
  );
}
