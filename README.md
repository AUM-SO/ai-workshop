# DormDee (workshop_project)

แพลตฟอร์มหอพัก: เจ้าของหอลงข้อมูลหอและห้องพัก ผู้เช่าค้นหา ดูห้องว่างจริง และจองผ่านแชท

- Product plan: [docs/PRODUCT_PLAN.md](docs/PRODUCT_PLAN.md)
- Roadmap: [docs/ROADMAP.md](docs/ROADMAP.md)
- User stories (accounts and onboarding): [docs/USER_STORIES.md](docs/USER_STORIES.md)
- Branching: [docs/DEVELOP_FLOW.md](docs/DEVELOP_FLOW.md)

## Tech stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4 + [BoardUI](https://www.boardui.com) components (source in `components/`, tokens in `styles/`)
- Supabase (Postgres, Auth, Storage, Realtime)

## Getting started

Requires Node 22 and Docker (for the local Supabase stack).

```bash
npm install
npx supabase start            # local Postgres + Auth + Storage, applies supabase/migrations
npx supabase status -o env    # copy API_URL and PUBLISHABLE_KEY into .env.local
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

## Database

- Migrations live in `supabase/migrations/`. Create one with `npx supabase migration new <name>`.
- Apply new migrations to a running stack: `npx supabase migration up`. Reset everything (migrations + seed): `npx supabase db reset`.
- After a schema change, regenerate the TypeScript types: `npm run db:types`.
- `supabase/seed.sql` creates two local accounts for testing (an owner and a tenant); the passwords are in that file.
- Every table has Row Level Security. Published dorms are public; owners manage only their own data.

## CI and deploy

- GitHub Actions (`.github/workflows/ci.yml`) runs lint, typecheck and build on every PR to `develop` and `main`.
- Preview deploys: import the repo in Vercel and set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `NEXT_PUBLIC_SITE_URL`. Every PR then gets a preview URL.

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run db:types` | Regenerate `lib/supabase/database.types.ts` from the local database |

## Adding UI components

Use BoardUI components first (see `AGENTS.md` for the design rules):

```bash
npx boardui@latest add <component-name>
```

## Branching

Start new work from `develop`:

```bash
git checkout develop
git pull
git checkout -b feature/<short-name>
```
