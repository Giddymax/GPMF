# Grainy Palace Financial Service

A production-ready web app for a community microfinance company: a public marketing/application
site plus a full staff operations portal (double-entry ledger, susu/savings/FD/loan management,
and a SEEP/CGAP-standard financial performance dashboard).

Built with Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Radix UI, Supabase (Postgres +
Auth), React Hook Form + Zod, Resend + React Email, and Vitest.

## What's here vs. what needs your Supabase project

This repo ships fully coded against a real schema, but **no Supabase project is connected**. Until
you create one and point `.env.local` at it:

- The **public site** renders using built-in fallback content (`lib/data/fallback.ts`) that
  mirrors the seed data, so `npm run dev` works immediately with no setup.
- The **admin portal** renders in a read-only "preview mode" (a banner says so on every page) with
  empty states instead of real numbers, and sign-in is disabled.
- `lib/finance/` (the calculation engine) is fully implemented and unit-tested — it has no
  database dependency at all.

Once you connect a project and run the migration + seed (below), both the public site and admin
portal switch to live data automatically — no code changes needed.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create a Supabase project** at [supabase.com](https://supabase.com), then copy `.env.example`
   to `.env.local` and fill in the values from Project Settings → API:

   ```bash
   cp .env.example .env.local
   ```

   You'll also need a [Resend](https://resend.com) API key for transactional email (application
   confirmations, staff notifications) — optional for local dev; emails are skipped with a console
   log if `RESEND_API_KEY` is unset.

3. **Run the database migration.** Using the [Supabase CLI](https://supabase.com/docs/guides/cli):

   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push        # applies everything in supabase/migrations/
   ```

   Or paste the contents of each file in `supabase/migrations/` (in filename order) into the SQL
   Editor in the Supabase dashboard.

4. **Seed demo data** (optional but recommended — populates ~30 clients, 2 lending groups, 3
   agents and 6 months of ledger history so every dashboard and ratio renders meaningfully):

   ```bash
   supabase db reset       # applies migrations + supabase/seed.sql against a local Supabase
   # — or, against your live project —
   psql "<connection-string>" -f supabase/seed.sql
   ```

5. **Create staff logins** for the seeded agents plus a manager and admin (the seed script creates
   `agents` rows but not Supabase Auth users — auth users can't be created via plain SQL safely):

   ```bash
   npm run seed:staff
   ```

   This prints each login's email and a temporary password. **Change every password** before
   sharing the environment.

6. **Enable `pg_cron`** (Database → Extensions in the Supabase dashboard) so the automated jobs in
   `supabase/migrations/20260101000300_functions_and_cron.sql` (EOD cash-session autolock, nightly
   PAR re-bucketing / provisioning, end-of-month interest posting + ratio snapshot) actually run.
   If the extension isn't enabled when the migration runs, it logs a notice and skips scheduling —
   re-run the `cron.schedule(...)` calls at the bottom of that file afterward.

7. **Run the dev server**

   ```bash
   npm run dev
   ```

   Public site: [http://localhost:3000](http://localhost:3000)
   Staff portal: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

## Testing

```bash
npm run test        # runs the full lib/finance/ Vitest suite once
npm run test:watch  # watch mode
```

Every function in `lib/finance/` — susu cycles, savings/FD interest, loan pricing, PAR
bucketing/provisioning, Grameen group-gate disbursement, eligibility, guardrails, and every
SEEP/CGAP institutional ratio — has unit tests covering the edge cases called out in the build
spec (missed susu days, early FD termination, partial repayments, group-gate blocking, leap-year
accrual, division-by-zero guards).

## Project structure

```
app/(site)/            Public marketing site (home, about, products, apply, news, contact, legal)
app/admin/login/        Staff sign-in
app/admin/(dashboard)/  Operations portal: dashboard, clients, susu, deposits, loans, treasury,
                         reports, content & settings, inbox — each with its own actions.ts
lib/finance/             Pure, unit-tested calculation engine (no I/O)
lib/supabase/            Browser / server / admin (service-role) Supabase clients + hand-authored types
lib/data/                Server-side data-fetch helpers (public.ts has static fallbacks; admin.ts doesn't)
lib/email/               React Email templates + a Resend wrapper that no-ops without an API key
supabase/migrations/     Schema, ledger views/triggers, RLS, functions & cron, chart of accounts + config
supabase/seed.sql        ~30 demo clients, 2 lending groups, 3 agents, 6 months of ledger history
scripts/                 One-off Node scripts (npm run seed:staff)
public/brand/            Logo kit assets (see Brand below)
```

### The ledger is the source of truth

Every money-moving action — susu collection, savings deposit/withdrawal, FD booking, loan
disbursement/repayment, treasury placement — posts a balanced double-entry transaction via the
`post_ledger_transaction()` Postgres function (called through `supabase.rpc(...)` from server
actions using the service-role client). No table stores a `balance` column; every balance and every
SEEP/CGAP ratio in the admin dashboard is a SQL view over `ledger_entries`
(`account_balances`, `loan_balances`, `gl_trial_balance`, `institution_totals`, `loan_par_buckets`,
`monthly_flows`, `ratio_history`...). The ledger tables are append-only — corrections are new
reversal transactions (`reverse_ledger_transaction()`), never edits — and a deferred constraint
trigger rejects any transaction whose debits and credits don't sum to zero.

### Maker-checker

Savings withdrawals above `WITHDRAWAL_APPROVAL_THRESHOLD` (see
`lib/validation/deposit.ts`) are written to the `approvals` table instead of posting immediately;
a manager/admin approves or rejects from Deposits → Approvals before the ledger transaction is
posted. Loans have a built-in maker-checker step in their status pipeline: an agent/officer creates
the application, a manager approves it, and disbursement is additionally blocked if it would breach
the liquidity or loan-to-deposit guardrails (`lib/finance/guardrails.ts`).

## Deploying to Vercel

1. Push this repo to GitHub/GitLab/Bitbucket and import it in [Vercel](https://vercel.com/new).
2. Add the environment variables from `.env.local` (Project Settings → Environment Variables).
3. Deploy. Vercel builds with `npm run build` automatically.
4. Point your Supabase project's Auth → URL Configuration at your production domain, and update
   `NEXT_PUBLIC_SITE_URL`.

## Brand

Official assets live in `public/brand/` (copied from the source `Grainy_Palace_Logo_Kit/`) and the
favicon at `app/favicon.ico`.

| File | Usage |
|---|---|
| `logo.svg`, `logo-{900,1800,3600}.png`, `logo.webp` | Full lockup on **light** backgrounds only |
| `logo-white-bg.png` | Email templates (clients that reject transparent PNGs) |
| `icon-{192,512,1024}.png` | PWA manifest icons, dark-surface lockups, social avatars |

**Rules** (enforced in `components/site/logo.tsx`):

- Never place the navy-text lockup on a dark background — on navy/dark surfaces (footer, admin
  portal, login) use the icon mark plus a white Cinzel wordmark set in HTML instead.
- Minimum full-lockup width: 180px; below that, use the icon alone.
- Keep clear space around the logo of at least the height of one gold pillar. Never stretch,
  recolor, or drop-shadow it.
- Colors: navy `#051429`–`#112239`, gold `#D4AF37` (satin gradient `#8A6623`→`#F9E8B2`), emerald
  `#0F766E`–`#10B981`, grey `#4B5563` — defined as CSS custom properties in `app/globals.css` and
  exposed as Tailwind utilities (`bg-navy-900`, `text-gold-500`, `bg-gradient-gold`, etc.).
- Fonts: Cinzel for headings/display (`font-heading`), Montserrat for body/UI — loaded via
  `next/font/google` in `app/layout.tsx`.

## What's intentionally simplified for this pass

- **PWA offline queue** (`lib/offline/susu-queue.ts`) covers the susu collection sheet specifically
  (IndexedDB queue + service worker app-shell caching for that route). Extending it to every
  money-moving form is straightforward but out of scope here.
- **Client statements** are CSV download only (`/admin/operations/clients/[id]/statement.csv`) —
  there's no client email on file in the schema (matches the target market: passbook, not inbox),
  so "email statement" was left out rather than faking it.
- **Storage-backed image uploads** (news cover images, testimonial/team photos) use plain URL
  fields in the admin content editor rather than a Supabase Storage upload widget.
- Automated jobs (`run_nightly_accruals`, `run_eom_close`, cron scheduling) are written and
  reviewed for correctness but have not been executed against a live database — test them against
  seeded data (`select run_eom_close(current_date);` etc. in the SQL editor) before trusting them
  with real money.
