# Romantic Birthday Surprise Website

A full-stack, mobile-first romantic birthday surprise website with an animated bear-guarded memory gate, live relationship counter, timeline, promises, masonry photo gallery with swipe/keyboard lightbox, typewriter birthday wishes, confetti love-letter reveal, and a password-protected Admin Studio.

## Quick Start

1. Copy `.env.example` to `.env` (or `.env.local`) and configure:
   - `ADMIN_PASSWORD` — password for `/admin` (defaults to `love2026` if unset in development)
   - `JWT_SECRET` — long random secret for signing `httpOnly` admin cookies
2. Install dependencies and start the server:

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

## Default Seeded Entrance Answer
- **First Meeting Date**: `October 12, 2021` (`2021-10-12`)
- **Admin Studio**: `/admin`

## Supabase SQL Reference
A PostgreSQL schema reference (`settings`, `wishes`, `gallery`, `promises`, `timeline`) is included at `docs/supabase_schema.sql`.
