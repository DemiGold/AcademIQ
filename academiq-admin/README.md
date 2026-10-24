# AcademIQ Admin

Super-admin web panel for the AcademIQ platform. Desktop-first, light
mode, gated behind server-side role checks. Deployed to Vercel.

This is **not for students.** Students use the web app (`academiq-web/`).

## Stack

- Vite + React + TypeScript
- React Router 7
- TanStack Query
- Tailwind CSS
- Lucide icons, Recharts, Papa Parse
- Supabase (Postgres + Auth + RPCs)
- Zustand for client state

## Setup

### 1. Install

```bash
npm install