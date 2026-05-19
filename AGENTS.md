# Repository Guidelines

## Project Structure & Module Organization

This repository is a Next.js 16 App Router application for quantitative chronic-care dashboards. Main UI routes live in `src/app/`, reusable UI in `src/components/`, and presentation adapters in `src/presentation/`. Business logic follows layered boundaries inside `src/domain/`, `src/application/`, and `src/infrastructure/`. Prisma schema and database repositories are in `src/infrastructure/database/`. Unit tests live under `tests/unit/`. Demo datasets and import fixtures are stored in `datasets/`, and design/spec notes live in `docs/`.

## Build, Test, and Development Commands

- `npm run dev`: start the local Next.js development server.
- `npm run build`: create a production build and validate route generation.
- `npm run start`: run the built app locally.
- `npm run lint`: run ESLint across the repository.
- `npm run test`: execute the Vitest unit suite.
- `npm run db:up`: start local PostgreSQL with Docker Compose.
- `npm run db:push`: sync the Prisma schema to the local database.
- `npm run prisma:generate`: regenerate Prisma Client after schema changes.

## Coding Style & Naming Conventions

Use TypeScript everywhere with strict, explicit types. Prefer English names for variables, functions, classes, and files. Keep React components in `PascalCase`, utility files in `kebab-case` or domain-oriented names already used in `src/`. Follow existing clean-architecture boundaries: `domain` must not depend on `infrastructure` or `presentation`. Use ESLint as the source of truth; run `npm run lint` before opening a PR.

## Testing Guidelines

Tests use Vitest and are organized by layer, for example `tests/unit/application/` or `tests/unit/presentation/`. Name files as `*.test.ts`. Add or update tests whenever changing parsers, use cases, aggregations, filters, or view models. Prefer focused unit coverage for domain rules and dashboard transformations.

## Commit & Pull Request Guidelines

Recent history follows short imperative messages, often Conventional Commit style, such as `feat: add hover tooltip to sex pie chart`, `fix: prevent clipping on neighborhood values`, and `docs: refresh dashboard progress and setup notes`. Keep commits scoped and descriptive. PRs should include: purpose, affected areas, validation performed (`lint`, `test`, `build`), and screenshots when UI changes affect dashboards or charts.

## Security & Configuration Tips

Do not commit real patient data, secrets, or `.env` values. Use local demo files from `datasets/` for development. After Prisma schema changes, run `npm run prisma:generate` and `npm run db:push` against the local PostgreSQL instance before shipping.
