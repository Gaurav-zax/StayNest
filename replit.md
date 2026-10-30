# StayNest

A Greater Noida rental marketplace for finding homes, comparing rental terms, and contacting owners directly.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/staynest run dev` — run the StayNest web app
- `npm start` — run both StayNest services locally
- `npm run seed` — add 32 preview properties to an empty database
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/staynest` — responsive renter-facing React/Vite app
- `artifacts/api-server` — property and enquiry API, request validation, seed command
- `lib/db/src/schema` — PostgreSQL tables for properties and contacts
- `lib/api-spec/openapi.yaml` — API contract; regenerate clients after changes

## Architecture decisions

- PostgreSQL is the relational source of truth; listing seed data only inserts when the properties table is empty.
- Seed images and listing details are illustrative preview data, not verified owner submissions.

## Product

Browse and filter Greater Noida rentals, inspect listing details, and send direct owner enquiries without an account.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
