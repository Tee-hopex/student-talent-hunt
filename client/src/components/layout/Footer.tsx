import { Link } from "react-router";
import { Mail, Phone, Star } from "lucide-react";
import { FacebookIcon, InstagramIcon, XIcon } from "@/components/ui/SocialIcons";

const EXPLORE_LINKS = [
  { to: "/about", label: "About the event" },
  { to: "/blog", label: "News & updates" },
  { to: "/gallery", label: "Gallery" },
  { to: "/results", label: "Results & leaderboard" },
];

const ACCOUNT_LINKS = [
  { to: "/register", label: "Register your act" },
  { to: "/login", label: "Log in" },
  { to: "/contact", label: "Contact us" },
];

export function Footer() {
  return (
    <footer className="border-t-2 border-ink bg-plum text-cream">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-full border-2 border-ink bg-gold text-ink">
                <Star className="size-5" strokeWidth={2.25} fill="currentColor" />
              </span>
              <span className="font-display text-lg">Student Talent Hunt</span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-cream/60">
              The inter-school talent showcase for SS3 and JSS3 students — one stage, one shot,
              one unforgettable night.
            </p>
            <div className="mt-6 flex gap-3">
              {[InstagramIcon, XIcon, FacebookIcon].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex size-9 items-center justify-center rounded-full border-2 border-cream/30 text-cream/80 transition-colors hover:border-ink hover:bg-coral hover:text-cream"
                  aria-label="Social link"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm text-gold">Explore</h4>
            <ul className="mt-4 space-y-3">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-cream/80 transition-colors hover:text-gold">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm text-gold">Account</h4>
            <ul className="mt-4 space-y-3">
              {ACCOUNT_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-cream/80 transition-colors hover:text-gold">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm text-gold">Get in touch</h4>
            <ul className="mt-4 space-y-3">
              <li className="flex items-center gap-2 text-sm text-cream/80">
                <Mail className="size-4 text-coral-light" />
                hello@studentgottalent.demo
              </li>
              <li className="flex items-center gap-2 text-sm text-cream/80">
                <Phone className="size-4 text-coral-light" />
                +234 800 000 0000
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-cream/15 pt-8 sm:flex-row">
          <p className="text-xs text-cream/40">
            © {new Date().getFullYear()} Student Talent Hunt. All rights reserved.
          </p>
          <p className="text-xs text-cream/40">Built for schools, by educators.</p>
        </div>
      </div>
    </footer>
  );
}
