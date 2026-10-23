# 宿舍和谐助手 (Dorm Harmony Assistant)

Fullstack app (React + Vite + Tailwind v4 + shadcn/ui, Express + Drizzle/Postgres) that matches freshman roommates by habit compatibility.

## Tech stack
- Frontend: React 18, HashRouter, Tailwind CSS v4, shadcn/ui, recharts, sonner
- Backend: Express (flat `backend/` layout, shares root package.json), Drizzle ORM (postgres-js), JWT auth
- Shared contracts: `shared/` (imported in frontend via `@shared/...`)

## Features (Version 1)
- Student register/login by student ID + name, questionnaire with draft saving, AI/rule-based profile generation
- Profile confirmation: editable radar (±20), tags (max 8), 3 priority dimensions
- MatchPage: 5 candidates sorted by compatibility, score ring/colour tiers, conflict warnings (red/yellow with text labels), detail bottom sheet with me-vs-candidate radar, sub-scores, summary, confirm / swap (3 rematches), waiting state, icebreaker cards (copy, refresh up to 3)
- Demo mode (default on, `VITE_DEMO_MODE=false` disables): MatchPage uses hardcoded fictional candidates, makes no network requests, shows "演示数据" badge, and is reachable without login; demo has a "模拟对方已确认" button

## Status
Code re-verified end to end (imports, shared types, alias config, routes, hash routing with `*` recovery route, demo-mode MatchPage with no network requests). `Index.tsx` has no TODOs and opens directly on the MatchPage demo.

## Deferred (PRD)
Friend teams, chat, real match API (`GET /api/match/results`, icebreaker endpoints), admin dashboard, question bank / rule engine, dorm assignment export.

## Structure
- `backend/server.ts` – Express entry; mounts `/api/auth`, `/api/questionnaire`, `/api/profile`
- `backend/routes|repositories|services|db` – auth, questionnaire, profile (AI via `services/aiService.ts`, do not modify)
- `shared/types/dorm.ts` – user/profile DTOs; `shared/types/match.ts` – match candidate / results / icebreaker types (same shape for demo data and real API); `shared/questionnaire.ts` – question bank
- `frontend/src/pages/Index.tsx` – shell, header, tab navigation (profile / match / auth)
- `frontend/src/pages/MatchPage.tsx` – match list + state machine (loading/ready/error/empty)
- `frontend/src/components/custom/MatchDetailSheet.tsx` – candidate detail, radar, confirm/swap, icebreakers
- `frontend/src/config/match.ts` – demo candidates, score tiers, template icebreakers; `frontend/src/config/constants.ts` – `DEMO_MODE`
- `frontend/src/pages/{AuthView,QuestionnaireView,ProfilePage}.tsx`, `components/custom/Profile*Card.tsx`, `PriorityDimensionsCard.tsx`
- `frontend/src/lib/api.ts` – API client (`getMatchResults` used only when demo mode is off)

## Guidelines
- Types live in `shared/types/*`; hash routing only; never edit `components/ui/`.
