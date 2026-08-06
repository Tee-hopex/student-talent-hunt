import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, ArrowRight, PartyPopper } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { Event } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StampReveal } from "@/components/ui/StampReveal";
import { Skeleton } from "@/components/ui/Skeleton";
import { InputField, SelectField, TextareaField } from "@/components/form/Field";
import { CheckboxField } from "@/components/form/Checkbox";
import { FileDropField } from "@/components/form/FileDropField";
import { StepIndicator } from "@/components/form/StepIndicator";
import { Turnstile } from "@/components/form/Turnstile";

const STEPS = ["Details", "Guardian", "Uploads", "Review"];

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Enter your full name"),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
    phone: z.string().min(7, "Enter a valid phone number"),
    school: z.string().min(2, "Enter your school's name"),
    studentClass: z.enum(["JSS3", "SS3"], { errorMap: () => ({ message: "Select your class" }) }),
    dateOfBirth: z.string().min(1, "Enter your date of birth"),
    guardianName: z.string().min(2, "Enter your guardian's full name"),
    guardianPhone: z.string().min(7, "Enter a valid phone number"),
    guardianEmail: z.string().email("Enter a valid email address").optional().or(z.literal("")),
    address: z.string().optional(),
    categoryId: z.string().min(1, "Choose a talent category"),
    governmentIdType: z.string().min(1, "Select an ID type"),
    agreeToRules: z.literal(true, { errorMap: () => ({ message: "You need to agree to the rules to continue" }) }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

const STEP_FIELDS: (keyof RegisterFormValues)[][] = [
  ["fullName", "email", "password", "confirmPassword", "phone", "dateOfBirth", "school", "studentClass"],
  ["guardianName", "guardianPhone", "guardianEmail", "address", "categoryId"],
  ["governmentIdType", "agreeToRules"],
  [],
];

const ID_TYPES = [
  { value: "NIN", label: "National ID (NIN)" },
  { value: "BIRTH_CERTIFICATE", label: "Birth Certificate" },
  { value: "STUDENT_ID", label: "School Student ID" },
  { value: "PASSPORT", label: "International Passport" },
];

export function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [governmentId, setGovernmentId] = useState<File | null>(null);
  const [parentalConsent, setParentalConsent] = useState<File | null>(null);
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ["events", "current"],
    queryFn: async () => {
      const { data } = await api.get<Event | null>("/events/current");
      return data;
    },
  });

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { studentClass: undefined, categoryId: "" },
  });

  const values = watch();

  const mutation = useMutation({
    mutationFn: async (data: RegisterFormValues) => {
      if (!photo || !governmentId || !parentalConsent) {
        throw new Error("Missing required files");
      }

      const { data: authRes } = await api.post("/auth/register", {
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phone: data.phone,
        school: data.school,
        studentClass: data.studentClass,
        dateOfBirth: data.dateOfBirth,
        guardianName: data.guardianName,
        guardianPhone: data.guardianPhone,
        guardianEmail: data.guardianEmail || undefined,
        address: data.address || undefined,
      });
      login(authRes.token, authRes.user);

      const formData = new FormData();
      formData.append("eventId", event!.id);
      formData.append("categoryId", data.categoryId);
      formData.append("governmentIdType", data.governmentIdType);
      if (captchaToken) formData.append("captchaToken", captchaToken);
      formData.append("photo", photo);
      if (video) formData.append("video", video);
      formData.append("governmentId", governmentId);
      formData.append("parentalConsent", parentalConsent);

      await api.post("/applications", formData);
    },
    onSuccess: () => setSubmitted(true),
  });

  async function goNext() {
    const valid = await trigger(STEP_FIELDS[step]);
    if (!valid) return;

    if (step === 2) {
      const nextFileErrors: Record<string, string> = {};
      if (!photo) nextFileErrors.photo = "Add a photo of yourself";
      if (!governmentId) nextFileErrors.governmentId = "Upload your ID document";
      if (!parentalConsent) nextFileErrors.parentalConsent = "Upload your signed consent form";
      setFileErrors(nextFileErrors);
      if (Object.keys(nextFileErrors).length > 0) return;
    }

    // The step swap (Continue -> Submit button in the same slot) is deferred
    // to a macrotask. Without this, the async `trigger()` above can resolve
    // fast enough that React swaps in the "Submit" button — at the same
    // screen position — while the click that triggered this handler is
    // still being dispatched (mousedown/mouseup/click as separate native
    // events), so that same click ends up landing on the new Submit button
    // and firing a real form submission. Pushing the swap past the current
    // task guarantees it happens after the click has fully resolved.
    setTimeout(() => {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 0);
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (submitted) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 py-24 text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <PartyPopper className="mx-auto mb-6 size-14 text-gold" />
        </motion.div>
        <StampReveal text="Registered!" />
        <h1 className="mt-8 text-3xl text-ink">You're in the lineup.</h1>
        <p className="mt-3 text-ink-soft">
          Your application has been submitted for review. We'll email you once the admin team has
          approved your act — you can also track its status any time from your dashboard.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button variant="primary" onClick={() => navigate("/dashboard")}>
            Go to your dashboard
          </Button>
          <Button variant="outline" onClick={() => navigate("/")}>
            Back to home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
      <div className="mb-8 text-center">
        <Badge variant="coral" className="mb-4">
          Registration
        </Badge>
        <h1 className="text-4xl text-ink sm:text-5xl">Register your act.</h1>
        <p className="mt-3 text-ink-soft">Takes about 10 minutes. Have your documents ready.</p>
      </div>

      <div className="mb-10">
        <StepIndicator steps={STEPS} current={step} />
      </div>

      {eventLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : !event ? (
        <Card className="p-8 text-center">
          <AlertTriangle className="mx-auto mb-3 size-8 text-coral" />
          <h2 className="text-xl text-ink">Registration isn't open right now</h2>
          <p className="mt-2 text-sm text-ink-soft">
            There's no active event accepting applications at the moment. Check back closer to the
            next show, or see our news page for updates.
          </p>
        </Card>
      ) : (
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
          <Card className="p-6 sm:p-8">
            {mutation.isError && (
              <div className="mb-6 flex items-start gap-3 border-2 border-coral bg-coral/5 p-4">
                <AlertTriangle className="size-5 shrink-0 text-coral" />
                <p className="text-sm text-ink">{getErrorMessage(mutation.error)}</p>
              </div>
            )}

            {/* ── Step 0: Your details ─────────────────────────────── */}
            {step === 0 && (
              <div className="space-y-5">
                <InputField
                  label="Full name"
                  required
                  placeholder="e.g. Tolu Adeyemi"
                  error={errors.fullName?.message}
                  {...register("fullName")}
                />
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <InputField
                    label="Email address"
                    type="email"
                    required
                    placeholder="you@example.com"
                    error={errors.email?.message}
                    {...register("email")}
                  />
                  <InputField
                    label="Phone number"
                    type="tel"
                    required
                    placeholder="080..."
                    error={errors.phone?.message}
                    {...register("phone")}
                  />
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <InputField
                    label="Password"
                    type="password"
                    required
                    hint="At least 8 characters"
                    error={errors.password?.message}
                    {...register("password")}
                  />
                  <InputField
                    label="Confirm password"
                    type="password"
                    required
                    error={errors.confirmPassword?.message}
                    {...register("confirmPassword")}
                  />
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <InputField
                    label="School"
                    required
                    placeholder="e.g. Greenfield High School"
                    error={errors.school?.message}
                    {...register("school")}
                  />
                  <SelectField
                    label="Class"
                    required
                    placeholder="Select your class"
                    options={[
                      { value: "SS3", label: "SS3" },
                      { value: "JSS3", label: "JSS3" },
                    ]}
                    error={errors.studentClass?.message}
                    {...register("studentClass")}
                  />
                </div>
                <InputField
                  label="Date of birth"
                  type="date"
                  required
                  error={errors.dateOfBirth?.message}
                  {...register("dateOfBirth")}
                />
              </div>
            )}

            {/* ── Step 1: Guardian & category ──────────────────────── */}
            {step === 1 && (
              <div className="space-y-5">
                <p className="text-sm text-ink-soft">
                  Since performers are minors, we need a parent or guardian's contact details.
                </p>
                <InputField
                  label="Guardian's full name"
                  required
                  error={errors.guardianName?.message}
                  {...register("guardianName")}
                />
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <InputField
                    label="Guardian's phone"
                    type="tel"
                    required
                    error={errors.guardianPhone?.message}
                    {...register("guardianPhone")}
                  />
                  <InputField
                    label="Guardian's email"
                    type="email"
                    hint="Optional"
                    error={errors.guardianEmail?.message}
                    {...register("guardianEmail")}
                  />
                </div>
                <TextareaField label="Home address" hint="Optional" {...register("address")} />
                <SelectField
                  label="Talent category"
                  required
                  placeholder="Choose your category"
                  options={event.categories.map((c) => ({ value: c.id, label: c.name }))}
                  error={errors.categoryId?.message}
                  {...register("categoryId")}
                />
              </div>
            )}

            {/* ── Step 2: Uploads ───────────────────────────────────── */}
            {step === 2 && (
              <div className="space-y-5">
                <FileDropField
                  label="Your photo"
                  required
                  accept="image/png,image/jpeg,image/webp"
                  hint="A clear photo of yourself, JPG/PNG/WEBP"
                  value={photo}
                  onChange={(f) => {
                    setPhoto(f);
                    setFileErrors((prev) => ({ ...prev, photo: "" }));
                  }}
                  error={fileErrors.photo}
                />
                <FileDropField
                  label="Performance video"
                  accept="video/mp4,video/quicktime,video/webm"
                  hint="Optional now — you can add it later from your dashboard. Max 5 minutes."
                  value={video}
                  onChange={setVideo}
                />
                <SelectField
                  label="Government ID type"
                  required
                  placeholder="Select ID type"
                  options={ID_TYPES}
                  error={errors.governmentIdType?.message}
                  {...register("governmentIdType")}
                />
                <FileDropField
                  label="Government ID document"
                  required
                  accept="image/png,image/jpeg,application/pdf"
                  hint="Kept encrypted and only visible to admins"
                  value={governmentId}
                  onChange={(f) => {
                    setGovernmentId(f);
                    setFileErrors((prev) => ({ ...prev, governmentId: "" }));
                  }}
                  error={fileErrors.governmentId}
                />
                <FileDropField
                  label="Parental consent form"
                  required
                  accept="image/png,image/jpeg,application/pdf"
                  hint="Signed by a parent or guardian, kept encrypted"
                  value={parentalConsent}
                  onChange={(f) => {
                    setParentalConsent(f);
                    setFileErrors((prev) => ({ ...prev, parentalConsent: "" }));
                  }}
                  error={fileErrors.parentalConsent}
                />
                <CheckboxField
                  label={
                    <>
                      I've read the{" "}
                      <Link to="/about" className="font-semibold text-coral underline">
                        rules & eligibility requirements
                      </Link>{" "}
                      and confirm this information is accurate.
                    </>
                  }
                  error={errors.agreeToRules?.message}
                  {...register("agreeToRules")}
                />
              </div>
            )}

            {/* ── Step 3: Review ────────────────────────────────────── */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="mb-3 text-sm font-bold tracking-wide text-ink-soft uppercase">Your act</h3>
                  <dl className="grid grid-cols-2 gap-y-3 border-2 border-ink/15 p-4 text-sm">
                    <dt className="text-ink-soft">Name</dt>
                    <dd className="text-right font-semibold text-ink">{values.fullName}</dd>
                    <dt className="text-ink-soft">School</dt>
                    <dd className="text-right font-semibold text-ink">
                      {values.school} ({values.studentClass})
                    </dd>
                    <dt className="text-ink-soft">Category</dt>
                    <dd className="text-right font-semibold text-ink">
                      {event.categories.find((c) => c.id === values.categoryId)?.name ?? "—"}
                    </dd>
                    <dt className="text-ink-soft">Photo</dt>
                    <dd className="text-right font-semibold text-ink">{photo?.name ?? "—"}</dd>
                    <dt className="text-ink-soft">Video</dt>
                    <dd className="text-right font-semibold text-ink">{video?.name ?? "Not added yet"}</dd>
                  </dl>
                </div>

                <Turnstile onVerify={setCaptchaToken} />

                <p className="text-xs text-ink-soft">
                  By submitting, your application goes to the admin team for review — approval isn't
                  automatic. You'll be notified either way.
                </p>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between border-t-2 border-dashed border-ink/20 pt-6">
              {step > 0 ? (
                <Button type="button" variant="ghost" onClick={goBack}>
                  <ArrowLeft className="size-4" /> Back
                </Button>
              ) : (
                <span />
              )}

              {step < STEPS.length - 1 ? (
                <Button type="button" variant="primary" onClick={goNext}>
                  Continue <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button type="submit" variant="gold" isLoading={mutation.isPending}>
                  Submit application <ArrowRight className="size-4" />
                </Button>
              )}
            </div>
          </Card>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-ink-soft">
        Already registered?{" "}
        <Link to="/login" className="font-semibold text-coral underline">
          Log in instead
        </Link>
      </p>
    </div>
  );
}
