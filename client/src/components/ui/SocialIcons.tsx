import type { SVGProps } from "react";

// lucide-react intentionally ships no brand/logo marks, so these three are
// small hand-rolled SVGs to keep the footer's social row dependency-free.

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.9 3H21.7L15.4 10.1L22.8 21H17L12.4 14.7L7.1 21H4.3L11.1 13.4L4 3H9.9L14.1 8.8L18.9 3ZM17.9 19.2H19.5L9 4.7H7.3L17.9 19.2Z" />
    </svg>
  );
}

export function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13.5 21V13.2H16.1L16.5 10.1H13.5V8.1C13.5 7.2 13.7 6.6 15 6.6H16.6V3.8C16 3.7 15.1 3.6 14.1 3.6C11.9 3.6 10.4 5 10.4 7.5V10.1H8V13.2H10.4V21H13.5Z" />
    </svg>
  );
}
