# Seed Data Design — Nest Shop

**Date:** 2026-05-20  
**Scope:** Populate DB with owner user, store, fashion categories, products, and banners for development/testing.

---

## Approach

Prisma seed script at `prisma/seed.ts`, registered in `package.json` under `prisma.seed`. Uses `upsert` throughout — safe to re-run.

---

## Data Structure

### User + Store
- 1 OWNER user: `owner@nestshop.kg` / password: `hashed("Nestshop123")`
- 1 Store: "Nest Store", Bishkek, `isActive: true`, `isVerified: true`

### Categories (self-referential tree)

| Parent | Children |
|--------|----------|
| Мужская одежда | Футболки, Брюки, Куртки |
| Женская одежда | Платья, Блузки, Джинсы |
| Детская одежда | Мальчикам, Девочкам |
| Обувь | Мужская обувь, Женская обувь |
| Аксессуары | Сумки, Ремни |

Total: 5 parent + 12 child = 17 categories

### Products (~12 items)

Spread across subcategories. Each product has:
- `title`, `description`, `price`, optional `newPrice`
- `sizes`, `colors`, `gender`, `season`
- `stockCount`, `isActive: true`
- Placeholder image URL (picsum.photos)

| # | Title | Category | Price | newPrice |
|---|-------|----------|-------|----------|
| 1 | Футболка Nike Basic | Футболки | 1200 | 990 |
| 2 | Футболка Adidas Sport | Футболки | 1400 | — |
| 3 | Брюки классические | Брюки | 3200 | 2500 |
| 4 | Куртка зимняя мужская | Куртки | 8500 | 7000 |
| 5 | Платье летнее | Платья | 2800 | 2200 |
| 6 | Блузка офисная | Блузки | 1900 | — |
| 7 | Джинсы skinny | Джинсы | 3500 | 2800 |
| 8 | Кроссовки мужские Nike | Мужская обувь | 6500 | 4990 |
| 9 | Туфли женские | Женская обувь | 4200 | 3500 |
| 10 | Футболка детская | Мальчикам | 800 | — |
| 11 | Платье детское | Девочкам | 1100 | 900 |
| 12 | Сумка женская кожаная | Сумки | 5500 | 4500 |

### Banners (2 штуки, linked to Store)

**Banner 1 — PERCENT**
- title: "Скидка", accent: "−50% на всю обувь Nike"
- decoNum: "−50%", promoTag: "Горячая акция"
- description: "Только до конца месяца"
- promoType: PERCENT, discount: 50
- color: "#ef4444", status: APPROVED, isActive: true
- deadline: +30 дней
- BannerProduct: кроссовки Nike (#8)
- BannerSlot: isPaid: true, endAt: +30 дней

**Banner 2 — SEASONAL**
- title: "Распродажа", accent: "Летняя коллекция −30%"
- decoNum: "−30%", promoTag: "Сезонная распродажа"
- description: "Обновляем гардероб вместе"
- promoType: SEASONAL, discount: 30
- color: "#f97316", status: APPROVED, isActive: true
- deadline: +60 дней
- BannerProducts: платье летнее (#5), джинсы (#7)
- BannerSlot: isPaid: true, endAt: +60 дней

---

## Implementation

- File: `prisma/seed.ts`
- Register in `package.json`: `"prisma": { "seed": "ts-node prisma/seed.ts" }`
- Run: `npx prisma db seed`
- All creates via `upsert` on unique fields (email, category name+parentId, etc.)
