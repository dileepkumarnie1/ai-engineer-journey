# AI Engineer Journey

A personal, gamified learning hub for switching from **ETL / DWH testing to AI Engineering in 90–120 days**. It shows a visual roadmap, lets you pick courses by how engaging they are, and tracks your progress.

**Tech:** React 19 · TypeScript · Vite · Tailwind CSS v4 · Motion · Dexie (IndexedDB) · Zod · Recharts · Vitest

## Features

- **Animated dashboard**: today's mission (Learn → Build → Reflect), activity rings, XP & levels, streaks, a pace gauge, the projected finish date, a 120-day journey track, achievements and a concept of the day.
- **Visual roadmap**: 9 phases and 35 modules, from the Launchpad and Python through ML, LLMs, RAG, Agents & Agentic AI and LLMOps/Azure to the Capstone and a Job-Ready sprint.
- **Module pages**: concept flow diagrams, 3-card summaries, an "ETL bridge" linking each module to your data background, a course picker ranked by engagement score, lesson checklists, embedded videos, quizzes, reflection and notes.
- **130 curated resources**: 64 embedded YouTube videos plus free courses (Hugging Face, DeepLearning.AI, LangChain Academy, Microsoft, Kaggle, Google…). Paid items are clearly labelled.
- **Tracker**: a 90-minute focus timer (60 learn + 30 build), manual time logs, a heatmap, weekly hours, a burn-up chart and a skill radar.
- **Projects**: Kanban boards for 3 mini-projects and the capstone **DataSentinel AI** (an agentic data-quality copilot on Azure).
- **Career hub**: a checklist, before/after résumé rewrites, interview flashcards and an application tracker.
- **Schedule engine**: a 6 + 1 weekly rhythm, a pace that updates as you progress, and a projected finish date.
- **Light / Dark / System** themes; accessible (WCAG-minded) and respects your reduced-motion setting.

## Engagement score

Courses are ranked by

```
E = 35·Interactivity + 25·Visual + 20·HandsOn + 20·Popularity   (each 0–5, normalised → 0–100)
```

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit + component tests
npm run build      # production build → dist/
```

## Data & privacy

All progress is stored **only in your browser** (IndexedDB). Use **Settings → Export JSON** to back it up regularly and **Import JSON** to restore it on another device. Imports are validated with Zod before anything is written.

## Project structure

```
src/
  app/          layout, router, timer, theme
  components/   shared UI (cards, rings, charts, video embed)
  content/      phases, modules, courses, projects (typed + Zod-validated)
  db/           Dexie schema, actions, backup/restore
  features/     dashboard, roadmap, modules, courses, tracker, projects, videos, career, settings
  hooks/        useJourney (derived stats)
  lib/          schedule, progress, scoring, gamification engines
```

## Deploy

**Live:** https://dileepkumarnie1.github.io/ai-engineer-journey/

Every push to `main` builds and deploys to **GitHub Pages** (`.github/workflows/deploy.yml`, with `BASE_PATH=/ai-engineer-journey/` and a `404.html` SPA fallback). Also ready for **Azure Static Web Apps** (`public/staticwebapp.config.json` includes SPA fallback and security headers). CI runs lint, type-check, tests and build on every push (`.github/workflows/ci.yml`).
