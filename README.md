# CryptoTrade OS

Production-ready monorepo foundation for a modern crypto trading platform.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui |
| State | React Query, Zustand |
| i18n | next-intl (English / Russian) |
| Backend | NestJS 11 |
| Database | PostgreSQL + Prisma |
| Tooling | pnpm workspaces, Turborepo, ESLint, Prettier, Husky |
| CI | GitHub Actions |
| Containers | Docker Compose |

## Project Structure

```text
cryptotrade-os/
├── apps/
│   ├── api/                 # NestJS REST API
│   └── web/                 # Next.js frontend
├── packages/
│   ├── database/            # Prisma schema & client
│   ├── eslint-config/       # Shared ESLint configs
│   └── typescript-config/   # Shared TS configs
├── docker/                  # Dockerfiles & DB init
├── .github/workflows/       # CI pipelines
└── docker-compose.yml
```

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (optional, for PostgreSQL)

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp packages/database/.env.example packages/database/.env
```

### 3. Start PostgreSQL

```bash
docker compose -f docker-compose.dev.yml up -d
```

### 4. Initialize database

```bash
pnpm db:generate
pnpm db:push
```

### 5. Run development servers

```bash
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:4000/api/v1
- Health: http://localhost:4000/api/v1/health

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all packages |
| `pnpm lint` | Run ESLint across the monorepo |
| `pnpm typecheck` | Run TypeScript checks |
| `pnpm test` | Run tests |
| `pnpm format` | Format code with Prettier |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:migrate` | Run Prisma migrations |
| `pnpm db:push` | Push schema to database |
| `pnpm db:studio` | Open Prisma Studio |

## Architecture Notes

- **Monorepo**: pnpm workspaces + Turborepo for scalable multi-app development.
- **Frontend**: Locale-based routing (`/en`, `/ru`), dark theme by default, responsive layout.
- **Backend**: Modular NestJS structure with shared Prisma database package.
- **No business logic yet**: Foundation only — extend `apps/api/src/modules/` and web features as needed.

## Docker (full stack)

```bash
docker compose up --build
```

## License

Private — CryptoTrade OS
