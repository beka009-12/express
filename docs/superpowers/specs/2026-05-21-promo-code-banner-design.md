# Promo Code Business Logic for Banners

**Date:** 2026-05-21  
**Status:** Approved  
**Scope:** Backend only (Express + Prisma + PostgreSQL)

---

## Overview

Admin creates promo codes that store owners (OWNER role) can apply when purchasing a banner slot. A promo code reduces the slot price (base: 500 som). Each store can use a given promo code only once. Full usage history is tracked per store.

---

## Schema Changes

### New model: `PromoCodeUsage`

Tracks every application of a promo code — which store used which code for which banner.

```prisma
model PromoCodeUsage {
  id          Int @id @default(autoincrement())
  promoCodeId Int
  bannerId    Int
  storeId     Int

  promoCode PromoCode @relation(fields: [promoCodeId], references: [id])
  banner    Banner    @relation(fields: [bannerId], references: [id], onDelete: Cascade)
  store     Store     @relation(fields: [storeId], references: [id])

  usedAt DateTime @default(now())

  @@unique([promoCodeId, storeId]) // one store can use a code only once
  @@unique([bannerId])             // one banner can have at most one promo code
  @@index([promoCodeId])
  @@index([storeId])
  @@map("promo_code_usages")
}
```

### Updated model: `PromoCode`

Add back-relation:
```prisma
usages PromoCodeUsage[]
```

### Updated model: `Banner`

Add back-relation:
```prisma
promoCodeUsage PromoCodeUsage?
```

### Updated model: `Store`

Add back-relation:
```prisma
promoCodeUsages PromoCodeUsage[]
```

`PromoCode.usedCount` is kept as a fast counter — no need to COUNT usages on every validation.

---

## Module: `src/modules/promo-code/`

New module with four files: `promo-code.routes.ts`, `promo-code.controller.ts`, `promo-code.service.ts`, `promo-code.validation.ts`.

---

## API Endpoints

### `POST /promo-code` — ADMIN only

Create a new promo code.

**Request body:**
```json
{
  "code": "SUMMER50",
  "discount": 50,
  "usageLimit": 10,
  "expiresAt": "2026-08-01T00:00:00.000Z"
}
```

**Validation:**
- `code` — required, non-empty string; stored as uppercase; unique
- `discount` — integer, 1–100
- `usageLimit` — integer, min 1
- `expiresAt` — ISO date string, must be in the future

**Response `201`:**
```json
{ "promoCode": { "id": 1, "code": "SUMMER50", "discount": 50, "usageLimit": 10, "usedCount": 0, "isActive": true, "expiresAt": "..." } }
```

**Errors:**
- `400` — validation failure
- `409` — code already exists
- `403` — not ADMIN

---

### `GET /promo-code` — ADMIN only

List all promo codes with per-store usage history.

**Response `200`:**
```json
{
  "promoCodes": [
    {
      "id": 1,
      "code": "SUMMER50",
      "discount": 50,
      "usageLimit": 10,
      "usedCount": 3,
      "isActive": true,
      "expiresAt": "2026-08-01T00:00:00.000Z",
      "usages": [
        {
          "usedAt": "2026-05-21T10:00:00.000Z",
          "store": { "id": 7, "name": "TopShop KG" },
          "banner": { "id": 12, "title": "Летняя распродажа" }
        }
      ]
    }
  ]
}
```

---

### `PATCH /promo-code/:id/deactivate` — ADMIN only

Soft-deactivate a promo code (`isActive = false`). Already-applied discounts on existing banners are not affected.

**Response `200`:**
```json
{ "promoCode": { "id": 1, "isActive": false, ... } }
```

**Errors:**
- `404` — promo code not found

---

### `GET /promo-code/validate/:code` — OWNER only

Check if a promo code is valid for the requesting store. Returns preview of slot pricing.

**Auth:** Bearer JWT, role must be OWNER. Store is derived from `req.user.id` → user's store.

**Response `200` (valid):**
```json
{
  "valid": true,
  "discount": 50,
  "originalPrice": 500,
  "finalPrice": 250,
  "expiresAt": "2026-08-01T00:00:00.000Z"
}
```

**Response `200` (invalid):**
```json
{
  "valid": false,
  "reason": "Ваш магазин уже использовал этот промокод"
}
```

Possible `reason` values:
- `"Промокод недействителен или истёк"`
- `"Промокод больше недоступен"`
- `"Ваш магазин уже использовал этот промокод"`

Always returns `200` — the `valid` flag is the signal, not the HTTP status.

---

## Fix: `banner.service.ts`

### Bug

```ts
// BROKEN — tx.promoCode.fields.usageLimit is Prisma metadata, not a value
usedCount: { lt: tx.promoCode.fields.usageLimit },
```

### Fix

Remove the broken `where` clause and validate after fetch:

```ts
const promo = await tx.promoCode.findFirst({
  where: {
    code: data.promoCode,
    isActive: true,
    expiresAt: { gt: new Date() },
  },
});

if (!promo || promo.usedCount >= promo.usageLimit) {
  // promo code invalid or exhausted — proceed without discount
} else {
  // check per-store uniqueness, apply discount, create PromoCodeUsage
}
```

### Updated banner creation flow (inside `$transaction`)

1. Validate products belong to store
2. If `promoCode` provided:
   a. Fetch promo — check `isActive`, `expiresAt > now`, `usedCount < usageLimit`
   b. Check `PromoCodeUsage` for `(promoCodeId, storeId)` — reject if exists
   c. Calculate `finalPrice = 500 - (500 * promo.discount / 100)`
3. Create banner + slot + BannerProduct entries
4. Update `newPrice` on products
5. If promo applied:
   - `PromoCode.usedCount += 1`
   - Create `PromoCodeUsage` record (promoCodeId, bannerId, storeId)

---

## Error Handling

| Situation | HTTP | Message |
|---|---|---|
| Code not found / expired / inactive | 400 | "Промокод недействителен или истёк" |
| Usage limit exhausted | 400 | "Промокод больше недоступен" |
| Store already used this code | 400 | "Ваш магазин уже использовал этот промокод" |
| `discount` outside 1–100 | 400 | "Скидка должна быть от 1 до 100%" |
| `expiresAt` in the past | 400 | "Дата истечения должна быть в будущем" |
| Duplicate `code` | 409 | "Промокод с таким кодом уже существует" |
| Non-ADMIN tries to create/list | 403 | "Недостаточно прав" |
| Promo code not found by id | 404 | "Промокод не найден" |

---

## Auth Guards Summary

| Endpoint | Role |
|---|---|
| `POST /promo-code` | ADMIN |
| `GET /promo-code` | ADMIN |
| `PATCH /promo-code/:id/deactivate` | ADMIN |
| `GET /promo-code/validate/:code` | OWNER |
| `POST /banner/:storeId` | OWNER (existing) |
