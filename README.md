# DormDee (workshop_project)

แพลตฟอร์มหอพัก: เจ้าของหอลงข้อมูลหอและห้องพัก ผู้เช่าค้นหา ดูห้องว่างจริง และจองผ่านแชท

- Product plan: [docs/PRODUCT_PLAN.md](docs/PRODUCT_PLAN.md)
- Roadmap: [docs/ROADMAP.md](docs/ROADMAP.md)
- Branching: [docs/DEVELOP_FLOW.md](docs/DEVELOP_FLOW.md)

## Tech stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4 + [BoardUI](https://www.boardui.com) components (source in `components/`, tokens in `styles/`)
- Supabase (Postgres, Auth, Storage, Realtime)

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the Supabase values
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |

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
