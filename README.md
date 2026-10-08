<div align="center">

<img src="src/assets/caras-logo.png" alt="CARAS Logo" width="120" />

# CARAS Website

**Official website and management dashboard of the Confraternity of Augustinian Recollect Altar Servers (CARAS).**

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?logo=vercel&logoColor=white)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Backend & Configuration](#backend--configuration)
- [Role-Based Access](#role-based-access)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Acknowledgements](#acknowledgements)

---

## Overview

The CARAS Website serves two purposes:

1. **Public site** — presents the organization, its parish, ministries, events, and gallery, and lets prospective members submit an application online.
2. **Admin & Treasurer dashboard** — a secured back office for managing applications, members, events, documents, and the organization's finances (contributions, penalties, donations, and expenses), with printable and exportable reports.

## Features

### Public Website
- Responsive single-page layout: Hero, About, Parish, Ministries, Events, Gallery, Join Us, and Contact sections
- Online membership application form
- Dedicated event narrative pages (`/event/:id`)
- Integrated chatbot widget for visitor inquiries
- Terms & Privacy modal

### Dashboard
- **Applications** — review and process incoming membership applications
- **Members** — maintain the member masterlist with a print-ready preview
- **Events & Gallery** — create and manage events and photo galleries
- **Documents** — centralized document management
- **Contributions, Penalties & Finance** — record and track payments, outstanding balances, donations, and expenses
- **Analytics** — contribution, penalty, and cash-flow trend charts plus a fund-sources breakdown
- **Report exports** — preview and export reports (Masterlist, Contributions, Penalties, Donations, Expenses, Treasurer's Report) as PDF
- **AI-assisted Treasurer's Report** — drafts the narrative section from precomputed figures via a Supabase Edge Function (the treasurer reviews and edits before finalizing)
- **Security** — role-based navigation and automatic logout after 30 minutes of inactivity

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | React 18 + TypeScript |
| Build Tool | Vite 5 (SWC) |
| Styling | Tailwind CSS, shadcn/ui, Radix UI |
| Routing | React Router v6 |
| Data Fetching | TanStack Query |
| Forms & Validation | React Hook Form + Zod |
| Charts | Recharts |
| Animation | Framer Motion |
| PDF / Export | jsPDF, html2canvas |
| Backend | Supabase (PostgreSQL, Auth, Row Level Security, Edge Functions) |
| Hosting | Vercel |

## Project Structure

```text
caras-website/
├── public/                     # Static assets (robots.txt)
├── src/
│   ├── assets/                 # Images, logos, icons, gallery
│   ├── components/
│   │   ├── dashboard/          # Dashboard views, charts, print layouts
│   │   ├── site/               # Public site sections
│   │   └── ui/                 # shadcn/ui primitives
│   ├── hooks/                  # Auth, stats, trends, inactivity logout
│   ├── integrations/supabase/  # Supabase client & generated types
│   ├── lib/                    # Utilities and helpers
│   ├── pages/                  # Route-level pages (Index, Login, Dashboard, NotFound)
│   ├── App.tsx                 # Providers and routes
│   └── main.tsx                # Application entry point
├── supabase/
│   ├── functions/              # Edge Functions (generate-treasurer-narrative)
│   ├── migrations/             # SQL migrations
│   └── config.toml
├── vercel.json                 # SPA rewrite rules
└── vite.config.ts
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm (bundled with Node.js)
- A [Supabase](https://supabase.com/) project (for backend features)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/caras-website.git

# 2. Move into the project directory
cd caras-website

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev
```

The app will be available at **http://localhost:8080**.

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server with hot reload |
| `npm run build` | Create an optimized production build in `dist/` |
| `npm run build:dev` | Create a development-mode build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint across the project |

## Backend & Configuration

The frontend connects to Supabase through `src/integrations/supabase/client.ts`, which uses the project's public (anon) key. Data security is enforced by **Row Level Security (RLS)** policies on the database, not by hiding the key.

### Database migrations

SQL migrations live in `supabase/migrations/`. Apply them with the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

### Edge Function: `generate-treasurer-narrative`

Generates a draft narrative for the Treasurer's Report. The AI provider key is stored **server-side only** as a Supabase secret and is never exposed to the browser.

```bash
supabase secrets set TOKENROUTER_API_KEY=<your-api-key>
supabase functions deploy generate-treasurer-narrative
```

> **Note:** Never commit `.env` files or API keys. Environment files are already listed in `.gitignore`.

## Role-Based Access

Access is determined by the `user_roles` table in Supabase.

| Role | Access |
| --- | --- |
| `admin` | Full dashboard: Applications, Members, Events, Gallery, Documents, Contributions, Penalties, Finance, Profile |
| `treasurer` | Dashboard overview, Contributions, Penalties, Finance, Profile |

Sidebar and route guards provide the user experience layer; **RLS policies on each table are the actual security boundary.**

## Deployment

The project is configured for [Vercel](https://vercel.com/). `vercel.json` rewrites all routes to `index.html` so client-side routing works on refresh.

1. Import the repository in Vercel.
2. Use the default Vite settings (build command `npm run build`, output directory `dist`).
3. Deploy.

## Contributing

1. Create a feature branch: `git checkout -b feat/your-feature`
2. Commit using [Conventional Commits](https://www.conventionalcommits.org/) (e.g. `feat: add donations export`)
3. Run `npm run lint` and `npm run build` before pushing
4. Open a pull request describing your changes

## Acknowledgements

- [shadcn/ui](https://ui.shadcn.com/) for the component primitives
- [Supabase](https://supabase.com/) for the backend platform
- [Lucide](https://lucide.dev/) for icons

---

<div align="center">

Built for the Confraternity of Augustinian Recollect Altar Servers (CARAS)

</div>
