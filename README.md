# ParkSight — AI-Driven Parking Intelligence

Landing page + dashboard for an AI model that detects illegal parking hotspots
and quantifies their congestion impact, for targeted traffic enforcement.

> Problem statement: How can AI-driven parking intelligence detect illegal
> parking hotspots and quantify their impact on traffic flow to enable
> targeted enforcement?

## Stack
- Vite + React (JavaScript, not TS)
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- react-router-dom v7
- lucide-react for icons
- Font: Inter (body/UI), Impact (a few short display headings only)
- Accent color: red, TomTom-style

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Project structure

```
src/
  components/   NavBar, Hero, StatsSection, FeatureCards, DevSection,
                EnterpriseSection, CTASection, Footer
  pages/
    Home.jsx        landing page (alternating white/grey sections, Apple-style cards)
    Dashboard.jsx    fixed-input dashboard, ready to fetch from your FastAPI model
```

## Input dataset (fixed)

The model's input is fixed to an anonymized police violation dataset.
The dataset URL is configured in `.env` as `VITE_INPUT_DATA`.

This is shown directly on the Dashboard as an "Input dataset" card with a
link to the CSV — no upload/input UI is needed since the source never changes.

## Connecting your FastAPI backend

`src/pages/Dashboard.jsx` already calls:

```
GET {VITE_API_BASE_URL}/predict
```

By default `VITE_API_BASE_URL` is `http://127.0.0.1:8000`. To change it, copy
`.env.example` to `.env` and edit the value:

```
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Until your backend is running, the dashboard shows a "Not connected" empty
state — no dummy data is hardcoded. Once `/predict` responds with JSON
(suggested shape below), it renders in the "Raw response" card automatically.
Wire the stat cards / chart to specific fields once your model's real output
shape is final.

```json
{
  "source": "jan_to_may_police_violation.csv",
  "hotspots": [
    {
      "zone": "Sector 18 Market",
      "lat": 28.4711,
      "lng": 77.0429,
      "violationCount": 214,
      "congestionImpact": 0.81
    }
  ],
  "updatedAt": "2026-06-20T09:15:00Z"
}
```

## Notes
- "ParkSight" and all copy are original — this is a stylistic clone (layout,
  type, motion, alternating white/grey card sections, red accent) in the
  spirit of tomtom.com, not a literal copy of its trademarks or content.
- Build for production: `npm run build` → outputs to `dist/`.
