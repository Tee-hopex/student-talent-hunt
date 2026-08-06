import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Star, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/blog", label: "News" },
  { to: "/gallery", label: "Gallery" },
  { to: "/vote", label: "Vote" },
  { to: "/contact", label: "Contact" },
];

function dashboardPath(role?: string) {
  if (role === "ADMIN") return "/admin";
  if (role === "JUDGE") return "/judge";
  return "/dashboard";
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [navigate]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b-2 border-ink bg-plum transition-shadow duration-200",
        scrolled && "shadow-[0_4px_0_0_var(--color-ink)]",
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-cream">
          <span className="flex size-9 items-center justify-center rounded-full border-2 border-ink bg-gold text-ink">
            <Star className="size-5" strokeWidth={2.25} fill="currentColor" />
          </span>
          <span className="font-display text-xl tracking-tight">
            Student Talent <span className="text-gradient-marquee">Hunt</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                cn(
                  "rounded-full px-4 py-2 text-sm font-bold tracking-wide uppercase transition-colors",
                  isActive ? "bg-gold text-ink" : "text-cream/75 hover:text-cream",
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <>
              <Button variant="outline-light" size="sm" onClick={() => navigate(dashboardPath(user.role))}>
                Dashboard
              </Button>
              <Button variant="ghost-light" size="sm" onClick={() => logout()}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost-light" size="sm" onClick={() => navigate("/login")}>
                Log in
              </Button>
              <Button variant="gold" size="sm" onClick={() => navigate("/register")}>
                Register your act
              </Button>
            </>
          )}
        </div>

        <button
          className="flex size-10 items-center justify-center rounded-full border-2 border-ink bg-cream text-ink lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t-2 border-ink bg-plum lg:hidden"
          >
            <div className="flex flex-col gap-1 px-4 pb-6 pt-3">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/"}
                  className={({ isActive }) =>
                    cn(
                      "rounded-sm px-4 py-3 text-sm font-bold tracking-wide uppercase",
                      isActive ? "bg-gold text-ink" : "text-cream/75",
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <div className="mt-3 flex flex-col gap-2">
                {user ? (
                  <>
                    <Button variant="outline-light" onClick={() => navigate(dashboardPath(user.role))}>
                      Dashboard
                    </Button>
                    <Button variant="ghost-light" onClick={() => logout()}>
                      Log out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline-light" onClick={() => navigate("/login")}>
                      Log in
                    </Button>
                    <Button variant="gold" onClick={() => navigate("/register")}>
                      Register your act
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
