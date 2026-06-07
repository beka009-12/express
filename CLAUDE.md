# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # nodemon + ts-node, watches src/

# Build & Start
npm run build        # prisma generate + tsc
npm start            # node dist/index.js

# Database
npx prisma migrate dev --name <name>   # create and apply a migration
npx prisma generate                    # regenerate Prisma client after schema changes
npx prisma studio                      # visual DB browser

# Code style
npm run format       # prettier --write src/**/*.ts
```

No test suite is configured yet (`npm test` exits with error).

## Architecture

Express 4 backend for **Nest Shop** — a multi-tenant e-commerce marketplace (Kyrgyzstan). Base URL: `/nest-shop/*`. Swagger UI at `/docs`.

**Entry**: `src/index.ts` → `src/app.ts` (`buildServer()`) → `src/router/index.ts`

**Module layout** — each feature under `src/modules/<name>/`:
- `*.routes.ts` — Express Router, Swagger JSDoc annotations
- `*.controller.ts` — request parsing, calls service, sends response
- `*.service.ts` — business logic, Prisma queries
- `*.validation.ts` / `*.types.ts` — Zod schemas and TypeScript types

**Modules**: `auth`, `product`, `category`, `order`, `favorite`, `search`, `upload`, `banner`, `user`

**Database**: PostgreSQL via Prisma ORM (`prisma/schema.prisma`). Singleton client at `src/prisma.ts`. Key models:
- `User` (roles: USER / OWNER / ADMIN) → owns `Store` → has `Product`s
- `Product` has `ProductImage[]` (isMain + sortOrder), soft-delete via `deletedAt`/`isActive`
- `Order` is per-store (one cart checkout → multiple Orders). `OrderItem` stores price at purchase time
- `Banner` → `BannerSlot` (paid slot system) + `BannerProduct[]`
- `Category` is self-referential tree (parentId)

**Auth**: JWT Bearer token (`Authorization: Bearer <token>`), 7d expiry. Middleware at `src/middleware/auth.middleware.ts` attaches `req.user = { id, role }`. Use `AuthRequest` type in controllers.

**File storage**: Supabase Storage (`product-image` bucket). Client at `src/plugin/supabase.ts`. Multer handles multipart uploads (`src/plugin/multer.ts`).

**Search**: `src/modules/search/search.service.ts` — DB filter first, then in-memory fuzzy search with Fuse.js (threshold 0.35). Products use cursor-based pagination in `getProductsInfinite`; search/category endpoints use offset pagination.

## Key conventions

- Products are soft-deleted: always filter `isActive: true, archivedAt: null` in public queries
- Price filtering must check `newPrice` (discounted price) when present, falling back to `price`
- Category queries recurse into children — use `getAllCategoryIds` / BFS to include subcategories
- Transactions (`prisma.$transaction`) are required for operations that touch multiple tables
- `saller` module (routes/controller) is deleted on this branch — use `store` logic via `auth` and `product` modules