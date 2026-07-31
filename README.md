# Enredex

> [warning] This is still an proof-of-concept. And definitely a work in progress.

> A modern, self-hosted Pokémon collection management platform — built for collectors, not battlers.

Enredex complements Pokémon HOME with tools HOME currently lacks: powerful search, living-dex tracking, custom tags, box management with sprite grids, OT library, and collection statistics.

---

## Architecture

```
enredex/
├── apps/
│   ├── api/          Fastify 5 API (Node.js + TypeScript)
│   └── web/          React 19 SPA (Vite + Tailwind v4 + shadcn/ui)
│
├── packages/
│   ├── database/     Drizzle ORM schema, migrations, DB client
│   ├── shared/       SpriteService (Showdown + PokeAPI providers)
│   └── pokemon-data/ Reference data import pipeline (PokeAPI → PostgreSQL)
│
├── scripts/
│   └── seed.ts       Dev seed script (25 sample Pokémon, boxes, OTs)
│
├── docker-compose.yml      Dev environment (PostgreSQL only)
├── docker-compose.prod.yml Production stack (Traefik + API + Web + Postgres)
└── .env / .env.example     Environment configuration
```

### Stack

| Layer | Technology |
|-------|-----------|
| **API** | Fastify 5, Drizzle ORM, Zod 4, argon2, Pino |
| **Database** | PostgreSQL 17, Drizzle Kit migrations |
| **Frontend** | React 19, Tailwind CSS v4, shadcn/ui, TanStack Router + Query, Zustand |
| **Import** | PokeAPI v2 REST, idempotent upserts, audit trail |
| **Infra** | Docker Compose, Traefik v3 (SSL via Let's Encrypt) |
| **Monorepo** | pnpm workspaces, TypeScript 5.9 |

---

## Getting started (dev)

### Prerequisites

- **Node.js** ≥ 24
- **pnpm** ≥ 11 (`corepack enable && corepack prepare pnpm@11 --activate`)
- **Docker** + Docker Compose (for PostgreSQL)

### Quick start

```bash
# 1. Install dependencies
pnpm install

# 2. Start PostgreSQL
pnpm db:up

# 3. Run database migrations
pnpm db:migrate

# 4. Import reference data from PokeAPI (~6 minutes)
pnpm sync

# 5. Seed sample data (25 Pokémon, boxes, OTs)
pnpm seed

# 6. Start both servers
pnpm dev
```

Then open:
- **Frontend** → http://localhost:5173
- **API docs** → http://localhost:3001/health
- **Login** → `ash@enredex.dev` / `pikachu123`

### Step-by-step commands

| Command | Purpose |
|---------|---------|
| `pnpm install` | Install all workspace dependencies |
| `pnpm db:up` | Start PostgreSQL container |
| `pnpm db:down` | Stop PostgreSQL container |
| `pnpm db:generate` | Generate a new Drizzle migration from schema changes |
| `pnpm db:migrate` | Apply pending migrations to the database |
| `pnpm db:studio` | Launch Drizzle Studio (GUI database browser) |
| `pnpm sync` | Import all reference data from PokeAPI (generations, species, forms, moves, items, abilities, natures, balls, games, regions) |
| `pnpm seed` | Populate the database with 25 sample Pokémon (idempotent — skips if already seeded) |
| `pnpm seed --reset` | Delete existing seed data and re-create |
| `pnpm dev` | Start both API (:3001) and Web (:5173) dev servers concurrently |
| `pnpm dev:api` | Start only the API dev server |
| `pnpm dev:web` | Start only the Web dev server |
| `pnpm build` | Production build of the web frontend |
| `pnpm typecheck` | TypeScript check on all 5 workspace packages |

---

## API overview

All endpoints are prefixed with `/api`. The web dev server proxies `/api` to the API backend.

### Auth (public)

| Method | Path | Notes |
|--------|------|-------|
| `POST` | `/api/auth/register` | Creates user + default box, sends verification email |
| `POST` | `/api/auth/login` | Returns access token + sets httpOnly refresh cookie |
| `POST` | `/api/auth/refresh` | Rotates refresh token (cookie-based) |
| `POST` | `/api/auth/logout` | Revokes refresh token |
| `POST` | `/api/auth/forgot-password` | Sends reset email (always 204) |
| `POST` | `/api/auth/reset-password` | Consumes reset token, sets new password |
| `POST` | `/api/auth/verify-email` | Marks email as verified |

### Authenticated endpoints (Bearer token required)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/users/me` | Current user profile |
| `PATCH` | `/api/users/me` | Update name, avatar, plan |
| `GET` | `/api/reference/bootstrap` | Small lookup tables (types, natures, balls, games) |
| `GET` | `/api/reference/species?search=&limit=` | Species search |
| `GET` | `/api/reference/species/:id` | Species detail with forms |
| `GET` | `/api/reference/abilities?search=` | Abilities search |
| `GET` | `/api/reference/items?search=` | Items search |
| `GET` | `/api/reference/moves?search=&typeId=` | Moves search |
| `GET` | `/api/ots` | List personal OTs |
| `POST` | `/api/ots` | Create OT |
| `PATCH` | `/api/ots/:id` | Update OT |
| `DELETE` | `/api/ots/:id` | Delete OT |
| `GET` | `/api/boxes` | List boxes with occupancy counts |
| `POST` | `/api/boxes` | Create box (within plan limit) |
| `GET` | `/api/boxes/:id` | Box detail with 30-slot occupants + sprite URLs |
| `PATCH` | `/api/boxes/:id` | Rename box |
| `DELETE` | `/api/boxes/:id` | Delete box (must be empty) |
| `GET` | `/api/pokemon?q=&tags=&speciesId=&...` | Search/filter collection (25+ filter params) |
| `POST` | `/api/pokemon` | Add Pokémon (OT auto-fill, HOME placement rules) |
| `GET` | `/api/pokemon/:id` | Pokémon detail with moves, species, sprites |
| `PATCH` | `/api/pokemon/:id` | Update Pokémon (records history) |
| `DELETE` | `/api/pokemon/:id` | Delete Pokémon (records history) |
| `GET` | `/api/history?pokemonId=&limit=` | Collection audit log |

### Pokémon response enrichment

Every Pokémon response includes two computed sprite URLs:

| Field | Source | Example |
|-------|--------|---------|
| `iconUrl` | Showdown gen-5 sprites | `https://play.pokemonshowdown.com/sprites/gen5/pikachu.png` |
| `artworkUrl` | PokeAPI official artwork | `https://raw.githubusercontent.com/PokeAPI/sprites/…/official-artwork/25.png` |

---

## Database

### Reference tables (versioned)

Every reference entity tracks **generation**, **introduced game**, **introduced version**, and **last updated** — so future generations can be imported without breaking existing collections.

```
generations   regions   games   types   abilities   moves
items         balls     natures species   forms
```

All reference data is populated by `packages/pokemon-data` via the PokeAPI import pipeline (`pnpm sync`). The import is repeatable and idempotent — each stage uses UPSERT by natural key and writes an audit trail to `import_runs`.

### User/collection tables

```
users   refresh_tokens   auth_tokens   boxes   original_trainers
pokemon   pokemon_moves   notes   goals   saved_searches   history
```

Key constraints enforced at the database level:
- One Pokémon per box slot (partial unique index)
- No held item while located in Pokémon HOME
- Box and slot must be set (or unset) together
- Level 1–100, dynamax level 0–10, slot 1–30

---

## Sprite system

The `SpriteService` (in `packages/shared`) resolves sprite URLs based on species attributes — **never** storing URLs directly on Pokémon records.

**Provider priority chain:**
1. **Showdown** (gen-5 pixel sprites, best form/shiny/female support)
2. **PokeAPI** (official artwork fallback)

**Resolution priority per scope:**
1. Female + Shiny
2. Female
3. Shiny
4. Regular

The service is replaceable — add new providers without database changes.

---

## Production deployment

Target: VPS with Docker Compose + Traefik.

```bash
# 1. Copy and edit the production environment
cp .env.prod.example .env.prod
# Set POSTGRES_PASSWORD, JWT_SECRET, API_HOST, WEB_HOST, LETSENCRYPT_EMAIL

# 2. Start the full stack
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

The compose file includes:

| Service | Role |
|---------|------|
| **traefik** | Reverse proxy — SSL termination via Let's Encrypt, HTTP→HTTPS redirect |
| **postgres** | PostgreSQL 17 with persistent volume |
| **db-migrate** | One-shot container — runs `drizzle-kit migrate` on startup |
| **api** | Fastify API, exposed at `api.<domain>` |
| **web** | nginx serving the Vite-built SPA at `<domain>` |

### Building images

Both Dockerfiles expect the monorepo root as build context:

```bash
docker build -f apps/api/Dockerfile -t enredex-api .
docker build -f apps/web/Dockerfile -t enredex-web .
```

---

## Contributing

### Code conventions

- TypeScript strict mode across all packages
- No default exports — use named exports everywhere
- Zod for runtime validation (API schemas, query parsing)
- pino for structured logging
- Drizzle relational queries for complex joins, SQL builder for filters

### Making schema changes

```bash
# 1. Edit the schema in packages/database/src/schema/
# 2. Generate migration
pnpm db:generate
# 3. Review the generated SQL in packages/database/drizzle/
# 4. Apply
pnpm db:migrate
# 5. Run typecheck to catch downstream issues
pnpm typecheck
```

### Adding a new API route

1. Define Zod schemas in `apps/api/src/modules/<name>/schemas.ts`
2. Implement service logic in `apps/api/src/modules/<name>/service.ts`
3. Register routes in `apps/api/src/modules/<name>/routes.ts`
4. Wire into `apps/api/src/app.ts`

### Adding a new frontend page

1. Create the route file in `apps/web/src/routes/` (follow existing naming)
2. If it's a new directory, add the entry to `apps/web/src/routeTree.gen.ts`
3. Re-run `pnpm typecheck` to validate the route tree

---

## License

This project is a personal, non-commercial tool. Pokémon and Pokémon HOME are trademarks of Nintendo / The Pokémon Company.
