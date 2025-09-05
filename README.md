
# Creator Marketplace — Fullstack MVP

A "3D Printing Amazon for India" starter with:
- **Frontend**: React + Vite + TypeScript + Tailwind + Swiper
- **Backend**: Express + Prisma + SQLite (dev) / Postgres-ready (prod)

## Quick Start

### 1) Backend
```bash
cd server
cp .env.example .env
npm i
npm run prisma:gen
npm run prisma:migrate
npm run seed
npm run dev
```
API: **http://localhost:4000/api**

### 2) Frontend
```bash
cd web
cp .env.example .env.local
npm i
npm run dev
```
App: **http://localhost:5173**
