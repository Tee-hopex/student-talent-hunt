# Student Talent Hunt

A full-stack platform for a school talent hunt event: public marketing site,
student registration + dashboard, admin dashboard, judges' portal, and public
voting/leaderboard.

## Stack & structure

Monorepo (npm workspaces) rather than separate repos — the client and server
ship together, share a single deploy cadence at this stage, and a monorepo
means one `npm install`, one place to look for the whole feature (e.g.
"applications") across front and back end. If the project later needs
independent deploy pipelines or separate access control per repo, splitting
is a straightforward extraction.

```
/client   React + TypeScript + Vite, Tailwind v4, React Router, TanStack Query
/server   Node + Express + TypeScript, Prisma (Postgres/Supabase), JWT auth
```

Server is organized by feature module (`src/modules/<feature>/*.routes.ts`)
rather than by technical layer — each module owns its routes, validation, and
Prisma calls in one file, which keeps related logic together as the app grows.

## Design identity — "Marquee & Playbill"

Real theatrical materials, not abstract UI color: velvet curtain, marquee
bulbs, stage-gel light, playbill paper stock.

- **Palette**: Curtain Plum `#3B0F3F` (hero/footer), Playbill Cream `#F7EEDA`
  (base), Marquee Gold `#FFB627` and Spotlight Coral `#FF5A36` (accents),
  Ink `#1C1017` (text), Marquee Green `#1F7A5C` (status only). Tailwind v4
  theme tokens in `client/src/index.css`.
- **Type pairing**: [Big Shoulders
  Display](https://fonts.google.com/specimen/Big+Shoulders+Display) (bold
  condensed, marquee-signage inspired) for headings, [Plus Jakarta
  Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) for UI/body.
- **Signature element**: the hero countdown is a split-flap marquee board
  (`client/src/components/ui/MarqueeCountdown.tsx`) — each digit mechanically
  flips on tick, framed by bulb lights.
- Sharp corners + ink borders + hard offset "sticker" shadows instead of
  soft rounded corners/blurred shadows — cards, buttons, and category tiles
  read as printed tickets/playbills, not a generic rounded-card template.
- Motion via `framer-motion`, deliberately scoped to a few moments that
  matter: the marquee flip, a rubber-stamp confirmation on registration
  submit (`StampReveal.tsx`), scroll-reveals. Respects
  `prefers-reduced-motion`. Loading states use skeletons, not spinners.

## Prerequisites

- Node.js 22+
- A Supabase Postgres project (or any Postgres instance)

## Setup

```bash
npm install                          # installs both workspaces

# Server
cp server/.env.example server/.env   # already pre-filled with dev secrets;
                                      # you only need to set DATABASE_URL
# Edit server/.env: paste your Supabase "Session pooler" connection string
# into DATABASE_URL (Project Settings → Database → Connection string →
# "Session pooler" — NOT "Direct connection", see note below).

npm run prisma:migrate               # creates tables from prisma/schema.prisma
npm run seed                         # demo event, students, judges, admin

# Client
cp client/.env.example client/.env   # defaults point at localhost:4000

npm run dev                          # runs client (5173) + server (4000) together
```

Visit `http://localhost:5173`.

> **Use the Session pooler connection string, not the direct connection.**
> Supabase's direct-connection host (`db.[ref].supabase.co`) resolves
> IPv6-only, which is unreachable from a lot of networks (mobile hotspots,
> some ISPs). The Session pooler is IPv4-reachable and works the same way
> for our purposes. If requests hang indefinitely rather than erroring,
> that's usually this — see the comment in `server/.env.example`.

### Demo accounts (all use password `Password123!`)

| Role   | Email                                  | Notes                     |
|--------|-----------------------------------------|----------------------------|
| Admin  | admin@studentgottalent.demo            |                            |
| Judge  | chidi.judge@studentgottalent.demo      | assigned Singing, Dancing |
| Judge  | funmi.judge@studentgottalent.demo      | assigned Spoken Word, Instrumental |
| Student| tolu.student@studentgottalent.demo     | application approved      |
| Student| ngozi.student@studentgottalent.demo    | application approved      |
| Student| ibrahim.student@studentgottalent.demo  | application pending       |
| Student| blessing.student@studentgottalent.demo | application rejected      |

## Security notes

- Passwords hashed with **argon2**.
- Government ID and parental consent files are encrypted on disk
  (AES-256-GCM, `server/src/lib/crypto.ts`) and only ever served through the
  authenticated, access-logged `/api/documents/*` routes — never mounted as
  static files. Every view/download is recorded in the `AccessLog` table.
- Voting is deduplicated via a hash of (device id + IP + category), rate
  limited, and gated behind Cloudflare Turnstile in production.
  **This is a first line of defense, not fraud-proof** — a motivated actor
  with multiple devices/IPs can still vote more than once. Hardening this
  (e.g. school-issued voting codes, anomaly detection on vote velocity) is
  flagged as follow-up work, not solved here.
- File uploads go through a `StorageAdapter` interface
  (`server/src/storage/`) with a local-disk implementation — swap in an
  S3-compatible adapter later without touching route code.

## What's built so far

All core features from the original brief are implemented and have been
verified end-to-end against a live Supabase database (not just rendered —
actually logged in as each role and confirmed writes persist).

1. ✅ Project scaffold + full Prisma schema (Event, Student, Application,
   Category, Judge, JudgeCategory, Score, Vote, BlogPost, GalleryItem,
   ContactMessage, AccessLog, Notification, User) + seed script
2. ✅ Full backend API (auth, applications, judging, voting, blog, gallery,
   contact, reports, secure documents)
3. ✅ Public Home, About, Vote, and Results/Leaderboard pages
4. ✅ Student registration (multi-step wizard, file uploads, CAPTCHA,
   stamp-confirmation success state) + student dashboard (application
   status, profile editing, media updates, notifications)
5. ✅ Admin dashboard: overview/reports, event management, participant
   review (approve/reject with secure document viewing + access logging),
   judge management, blog/announcements, results publishing
6. ✅ Judges' portal: category-scoped contestant list, scoring + feedback
7. ✅ Public voting (device-based dedup, live counts) and published
   results/leaderboard (judge scores + votes combined, medal styling)

### Known gaps / follow-up work

- **Gallery and Contact pages** are still "coming soon" stubs — the backend
  routes exist (`/api/gallery`, `/api/contact`), just no frontend UI yet.
- **Vote fraud prevention** is device+IP hash based only — see Security
  notes above.
- **Email delivery** is a console-log stub (`server/src/lib/mailer.ts`) —
  swap in a real provider (Resend, SMTP) for judge invite emails.
