import { Link } from "react-router";
import { ArrowLeft, Construction } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-24 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-full border-2 border-ink bg-gold text-ink">
        <Construction className="size-8" strokeWidth={1.75} />
      </div>
      <h1 className="text-3xl text-ink">{title}</h1>
      <p className="mt-3 text-ink-soft">
        This part of the show is still backstage. We're building it next — check back soon.
      </p>
      <Button variant="outline" className="mt-8" asChild>
        <Link to="/">
          <ArrowLeft className="size-4" /> Back to home
        </Link>
      </Button>
    </div>
  );
}
