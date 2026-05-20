# Shops Module Design

**Date:** 2026-05-20  
**Project:** Nest Shop — Express backend  
**Status:** Approved

## Context

The project has two separate frontends: one for sellers (OWNER role) and one for buyers (USER role). Sellers register on the seller frontend and receive the `OWNER` role at registration time. The `Store` model already exists in the Prisma schema with all required fields.

There is no `shops` module yet — store-related logic is currently scattered (product service checks for a store on product creation, review service recalculates store rating).

## Approach

Separate module at `src/modules/shops/` following the existing pattern: `routes`, `controller`, `service`, `validation`. All store mutation logic uses `prisma.$transaction` for operations that touch multiple tables.

## Routes and Access Control

```
POST   /shops/create       authMiddleware (OWNER)  — create shop
GET    /shops              public                  — list all active shops
GET    /shops/my           authMiddleware (OWNER)  — get own shop
GET    /shops/:id          public                  — shop detail + paginated products
PATCH  /shops/update       authMiddleware (OWNER)  — update shop info
PATCH  /shops/deactivate   authMiddleware (OWNER)  — deactivate (cascade)
PATCH  /shops/reactivate   authMiddleware (OWNER)  — reactivate (cascade)
```

**Access rules:**
- OWNER operates only on their own shop — `storeId` is resolved from `req.user.id`, never from URL params
- No role middleware needed beyond `authMiddleware` — ownership check happens inside the service

## Business Logic

### Create
- Check if a store already exists for `ownerId` (active or inactive) → 409 if found
- Create store with `isActive: true`

### Deactivate (single transaction)
1. `store.isActive = false`
2. All `products` of this store → `isActive = false`
3. Orders with status `PENDING | PAID | PROCESSING | SHIPPED` → `CANCELED`

### Reactivate (single transaction)
1. `store.isActive = true`
2. All `products` of this store → `isActive = true`
3. Orders are NOT restored (seller manages them manually)

### Update
- Partial update: `name`, `description`, `address`, `region`, `logo`
- Logo URL comes from the existing upload module (Supabase), passed as a string

## Data Shapes

### `GET /shops` — paginated list
```json
{
  "shops": [
    {
      "id": 1,
      "name": "Nike Store",
      "logo": "https://...",
      "region": "Bishkek",
      "isVerified": false,
      "rating": "4.80",
      "_count": { "products": 42 }
    }
  ],
  "pagination": { "total": 100, "page": 1, "limit": 20, "totalPages": 5 }
}
```

### `GET /shops/:id` — detail + cursor-paginated products
```json
{
  "shop": {
    "id": 1,
    "name": "Nike Store",
    "description": "...",
    "logo": "...",
    "address": "...",
    "region": "Bishkek",
    "isVerified": false,
    "rating": "4.80",
    "owner": { "id": 5, "name": "Askar" },
    "createdAt": "2025-01-01T00:00:00.000Z"
  },
  "products": [...],
  "nextCursor": 38,
  "hasMore": true
}
```

**Product filters on `GET /shops/:id`:** `cursor`, `limit`, `minPrice`, `maxPrice`, `categoryId`, `sort` (`newest` | `price_asc` | `price_desc` | `popular`) — same set as `/commodity/products/infinite`.

### `GET /shops/my` — full own shop data
Returns full shop object including `isActive`, `createdAt`, `updatedAt`, product count, and review count.

## Validation (Zod)

```ts
CreateShopDto  // name: string(min 2), description?: string, address?: string, region?: string
UpdateShopDto  // Partial<CreateShopDto> + logo?: string(url)
```

## Error Handling

| Situation | Status |
|---|---|
| Shop already exists for this owner | 409 |
| Shop not found | 404 |
| Accessing another owner's shop | 403 |
| Deactivating an already-inactive shop | 400 |
| Reactivating an already-active shop | 400 |

## File Structure

```
src/modules/shops/
  shops.routes.ts
  shops.controller.ts
  shops.service.ts
  shops.validation.ts
```

`src/router/index.ts` — add `router.use("/shops", shopsRoutes)`
