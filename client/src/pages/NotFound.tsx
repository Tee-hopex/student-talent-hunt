import { Link } from "react-router";
import { ArrowLeft, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 py-24 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-full border-2 border-ink bg-coral text-cream">
        <Star className="size-8" fill="currentColor" />
      </div>
      <h1 className="text-6xl text-ink">404</h1>
      <p className="mt-3 text-ink-soft">This page missed its cue and never made it on stage.</p>
      <Button variant="primary" className="mt-8" asChild>
        <Link to="/">
          <ArrowLeft className="size-4" /> Back to home
        </Link>
      </Button>
    </div>
  );
}
