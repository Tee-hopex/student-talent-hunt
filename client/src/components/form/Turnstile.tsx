import { useEffect, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: { sitekey: string; callback: (token: string) => void }) => string;
      remove: (id: string) => void;
    };
  }
}

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

interface TurnstileProps {
  onVerify: (token: string) => void;
}

/**
 * Cloudflare Turnstile widget. Without a site key configured (local dev),
 * this renders a clearly-labeled dev placeholder and auto-verifies so the
 * registration/voting/contact flows can be exercised end-to-end without a
 * Cloudflare account — matching the server's dev-mode bypass.
 */
export function Turnstile({ onVerify }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!SITE_KEY) {
      onVerify("dev-mode-skip");
      return;
    }

    let widgetId: string | undefined;

    function render() {
      if (!containerRef.current || !window.turnstile) return;
      widgetId = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY!,
        callback: onVerify,
      });
      setReady(true);
    }

    if (window.turnstile) {
      render();
    } else {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.onload = render;
      document.body.appendChild(script);
    }

    return () => {
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!SITE_KEY) {
    return (
      <div className="flex items-center gap-2 border-2 border-dashed border-ink/30 bg-ink/[0.02] px-4 py-3 text-xs font-semibold text-ink-soft">
        <ShieldCheck className="size-4 text-green" />
        CAPTCHA verification (skipped in local dev — no Turnstile key configured)
      </div>
    );
  }

  return <div ref={containerRef} className={ready ? "" : "h-[65px] animate-pulse bg-ink/5"} />;
}
