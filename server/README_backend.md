# Printing Muse – Backend

Express + TypeScript + Prisma + JWT + Zod, hardened with helmet, rate limits, compression, pino logging, Swagger docs, and Docker.

## Quickstart (dev, SQLite)

```bash
cd server
cp .env.example .env
npm i
npm run prisma:gen
npm run prisma:migrate
npm run seed
npm run dev
# API:   http://localhost:4000
# Docs:  http://localhost:4000/api/docs
# Health http://localhost:4000/api/health
