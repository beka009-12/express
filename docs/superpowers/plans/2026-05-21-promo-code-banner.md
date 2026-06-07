# Promo Code for Banners — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a promo code system where admins create codes that store owners apply when purchasing banner slots, with full per-store usage history tracked in a new `PromoCodeUsage` table.

**Architecture:** New `promo-code` module handles all promo code CRUD and validation. Two transaction-aware helpers (`validateInTx`, `recordUsageInTx`) are called from inside `banner.service.ts`'s `$transaction`. The existing bug in `banner.service.ts` (`tx.promoCode.fields.usageLimit`) is fixed as part of this work.

**Tech Stack:** Express 4, Prisma ORM, PostgreSQL, Zod, TypeScript strict mode.

---

## File Map

**Create:**
- `src/modules/promo-code/promo-code.validation.ts` — Zod DTOs
- `src/modules/promo-code/promo-code.service.ts` — business logic + tx helpers
- `src/modules/promo-code/promo-code.controller.ts` — request handling, role guards
- `src/modules/promo-code/promo-code.routes.ts` — Express router

**Modify:**
- `prisma/schema.prisma` — add `PromoCodeUsage` model + back-relations on `PromoCode`, `Banner`, `Store`
- `src/modules/banner/banner.service.ts` — fix promo bug, delegate to `promoCodeService`
- `src/modules/banner/banner.controller.ts` — handle new promo error codes
- `src/router/index.ts` — register `/promo-code` routes

---

## Task 1: Schema — PromoCodeUsage Model + Migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add back-relation to PromoCode model**

In `prisma/schema.prisma`, inside the `PromoCode` model, add `usages` before `@@map`:

```prisma
model PromoCode {
  id         Int      @id @default(autoincrement())
  code       String   @unique
  discount   Int
  usageLimit Int      @default(1)
  usedCount  Int      @default(0)
  isActive   Boolean  @default(true)
  expiresAt  DateTime

  usages PromoCodeUsage[]

  @@map("promo_codes")
}
```

- [ ] **Step 2: Add back-relation to Banner model**

Inside the `Banner` model, add after `products BannerProduct[]`:

```prisma
  promoCodeUsage PromoCodeUsage?
```

- [ ] **Step 3: Add back-relation to Store model**

Inside the `Store` model, add after `banners   Banner[]`:

```prisma
  promoCodeUsages PromoCodeUsage[]
```

- [ ] **Step 4: Add PromoCodeUsage model**

After the `BannerProduct` model block, add:

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

  @@unique([promoCodeId, storeId])
  @@unique([bannerId])
  @@index([promoCodeId])
  @@index([storeId])
  @@map("promo_code_usages")
}
```

- [ ] **Step 5: Run migration**

```bash
npx prisma migrate dev --name add_promo_code_usage
```

Expected output:
```
Applying migration `..._add_promo_code_usage`
Your database is now in sync with your schema.
Generated Prisma Client
```

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(schema): add PromoCodeUsage model with per-store uniqueness constraint"
```

---

## Task 2: Validation Schemas

**Files:**
- Create: `src/modules/promo-code/promo-code.validation.ts`

- [ ] **Step 1: Create the file**

```typescript
import { z } from "zod";

export const CreatePromoCodeDto = z
  .object({
    code: z.string().min(1).max(50),
    discount: z
      .number()
      .int()
      .min(1, "Скидка должна быть от 1 до 100%")
      .max(100, "Скидка должна быть от 1 до 100%"),
    usageLimit: z.number().int().min(1),
    expiresAt: z.string().datetime(),
  })
  .refine((data) => new Date(data.expiresAt) > new Date(), {
    message: "Дата истечения должна быть в будущем",
    path: ["expiresAt"],
  });

export type CreatePromoCodeDto = z.infer<typeof CreatePromoCodeDto>;
```

- [ ] **Step 2: Build to check TypeScript**

```bash
npm run build
```

Expected: exits with code 0, no errors.

- [ ] **Step 3: Commit**

```bash
git add src/modules/promo-code/promo-code.validation.ts
git commit -m "feat(promo-code): add Zod validation schemas"
```

---

## Task 3: PromoCode Service

**Files:**
- Create: `src/modules/promo-code/promo-code.service.ts`

- [ ] **Step 1: Create the file**

```typescript
import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma";
import { CreatePromoCodeDto } from "./promo-code.validation";

const BASE_BANNER_PRICE = 500;

export type ValidateResult =
  | {
      valid: true;
      discount: number;
      originalPrice: number;
      finalPrice: number;
      expiresAt: Date;
    }
  | { valid: false; reason: string };

class PromoCodeService {
  async create(dto: CreatePromoCodeDto) {
    const code = dto.code.toUpperCase();
    const existing = await prisma.promoCode.findUnique({ where: { code } });
    if (existing) throw new Error("PROMO_CODE_EXISTS");

    return prisma.promoCode.create({
      data: {
        code,
        discount: dto.discount,
        usageLimit: dto.usageLimit,
        expiresAt: new Date(dto.expiresAt),
      },
    });
  }

  async findAll() {
    return prisma.promoCode.findMany({
      orderBy: { id: "desc" },
      include: {
        usages: {
          orderBy: { usedAt: "desc" },
          include: {
            store: { select: { id: true, name: true } },
            banner: { select: { id: true, title: true } },
          },
        },
      },
    });
  }

  async deactivate(id: number) {
    const promo = await prisma.promoCode.findUnique({ where: { id } });
    if (!promo) throw new Error("PROMO_NOT_FOUND");

    return prisma.promoCode.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // For OWNER validate endpoint — non-transactional read
  async validate(code: string, ownerId: number): Promise<ValidateResult> {
    const store = await prisma.store.findFirst({
      where: { ownerId, isActive: true },
      select: { id: true },
    });
    if (!store) return { valid: false, reason: "Магазин не найден" };

    const promo = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promo || !promo.isActive || promo.expiresAt <= new Date()) {
      return { valid: false, reason: "Промокод недействителен или истёк" };
    }
    if (promo.usedCount >= promo.usageLimit) {
      return { valid: false, reason: "Промокод больше недоступен" };
    }

    const alreadyUsed = await prisma.promoCodeUsage.findUnique({
      where: {
        promoCodeId_storeId: { promoCodeId: promo.id, storeId: store.id },
      },
    });
    if (alreadyUsed) {
      return {
        valid: false,
        reason: "Ваш магазин уже использовал этот промокод",
      };
    }

    const finalPrice =
      BASE_BANNER_PRICE - (BASE_BANNER_PRICE * promo.discount) / 100;
    return {
      valid: true,
      discount: promo.discount,
      originalPrice: BASE_BANNER_PRICE,
      finalPrice,
      expiresAt: promo.expiresAt,
    };
  }

  // Called inside banner.$transaction — validates and returns price
  async validateInTx(
    tx: Prisma.TransactionClient,
    code: string,
    storeId: number,
  ): Promise<{ promoId: number; finalPrice: number }> {
    const promo = await tx.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promo || !promo.isActive || promo.expiresAt <= new Date()) {
      throw new Error("PROMO_INVALID");
    }
    if (promo.usedCount >= promo.usageLimit) {
      throw new Error("PROMO_EXHAUSTED");
    }

    const alreadyUsed = await tx.promoCodeUsage.findUnique({
      where: {
        promoCodeId_storeId: { promoCodeId: promo.id, storeId },
      },
    });
    if (alreadyUsed) throw new Error("PROMO_STORE_ALREADY_USED");

    const finalPrice =
      BASE_BANNER_PRICE - (BASE_BANNER_PRICE * promo.discount) / 100;
    return { promoId: promo.id, finalPrice };
  }

  // Called inside banner.$transaction — records usage after banner is created
  async recordUsageInTx(
    tx: Prisma.TransactionClient,
    promoId: number,
    bannerId: number,
    storeId: number,
  ): Promise<void> {
    await Promise.all([
      tx.promoCode.update({
        where: { id: promoId },
        data: { usedCount: { increment: 1 } },
      }),
      tx.promoCodeUsage.create({
        data: { promoCodeId: promoId, bannerId, storeId },
      }),
    ]);
  }
}

export const promoCodeService = new PromoCodeService();
```

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/modules/promo-code/promo-code.service.ts
git commit -m "feat(promo-code): add PromoCodeService with CRUD, validate, and tx helpers"
```

---

## Task 4: PromoCode Controller

**Files:**
- Create: `src/modules/promo-code/promo-code.controller.ts`

- [ ] **Step 1: Create the file**

```typescript
import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { promoCodeService } from "./promo-code.service";
import { CreatePromoCodeDto } from "./promo-code.validation";

function requireAdmin(req: AuthRequest, res: Response): boolean {
  if (!req.user?.id) {
    res.status(401).json({ message: "Не авторизован" });
    return false;
  }
  if (req.user.role !== "ADMIN") {
    res.status(403).json({ message: "Недостаточно прав" });
    return false;
  }
  return true;
}

function requireOwner(req: AuthRequest, res: Response): boolean {
  if (!req.user?.id) {
    res.status(401).json({ message: "Не авторизован" });
    return false;
  }
  if (req.user.role !== "OWNER") {
    res.status(403).json({ message: "Доступ только для владельцев магазинов" });
    return false;
  }
  return true;
}

export const createPromoCode = async (req: AuthRequest, res: Response) => {
  if (!requireAdmin(req, res)) return;

  try {
    const dto = CreatePromoCodeDto.parse(req.body);
    const promoCode = await promoCodeService.create(dto);
    return res.status(201).json({ promoCode });
  } catch (err: any) {
    console.error("Create promo code error:", err);
    if (err.name === "ZodError") {
      return res
        .status(400)
        .json({ message: err.errors[0]?.message ?? "Ошибка валидации" });
    }
    if (err.message === "PROMO_CODE_EXISTS") {
      return res
        .status(409)
        .json({ message: "Промокод с таким кодом уже существует" });
    }
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

export const getAllPromoCodes = async (req: AuthRequest, res: Response) => {
  if (!requireAdmin(req, res)) return;

  try {
    const promoCodes = await promoCodeService.findAll();
    return res.status(200).json({ promoCodes });
  } catch (err) {
    console.error("Get promo codes error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

export const deactivatePromoCode = async (req: AuthRequest, res: Response) => {
  if (!requireAdmin(req, res)) return;

  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "Неверный ID промокода" });
    }
    const promoCode = await promoCodeService.deactivate(id);
    return res.status(200).json({ promoCode });
  } catch (err: any) {
    console.error("Deactivate promo code error:", err);
    if (err.message === "PROMO_NOT_FOUND") {
      return res.status(404).json({ message: "Промокод не найден" });
    }
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

export const validatePromoCode = async (req: AuthRequest, res: Response) => {
  if (!requireOwner(req, res)) return;

  try {
    const { code } = req.params;
    const result = await promoCodeService.validate(code, req.user!.id);
    return res.status(200).json(result);
  } catch (err) {
    console.error("Validate promo code error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};
```

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/modules/promo-code/promo-code.controller.ts
git commit -m "feat(promo-code): add controller with ADMIN/OWNER role guards"
```

---

## Task 5: Routes + Register in Main Router

**Files:**
- Create: `src/modules/promo-code/promo-code.routes.ts`
- Modify: `src/router/index.ts` (lines 14–30)

- [ ] **Step 1: Create routes file**

```typescript
import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import {
  createPromoCode,
  getAllPromoCodes,
  deactivatePromoCode,
  validatePromoCode,
} from "./promo-code.controller";

const promoCodeRouter = Router();

// validate must be before /:id routes to avoid route collision
promoCodeRouter.get("/validate/:code", authMiddleware, validatePromoCode);
promoCodeRouter.post("/", authMiddleware, createPromoCode);
promoCodeRouter.get("/", authMiddleware, getAllPromoCodes);
promoCodeRouter.patch("/:id/deactivate", authMiddleware, deactivatePromoCode);

export default promoCodeRouter;
```

- [ ] **Step 2: Register in `src/router/index.ts`**

Add import after the last import line:
```typescript
import promoCodeRoutes from "../modules/promo-code/promo-code.routes";
```

Add route registration after `router.use("/banner", bannerRoutes);`:
```typescript
router.use("/promo-code", promoCodeRoutes);
```

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/modules/promo-code/promo-code.routes.ts src/router/index.ts
git commit -m "feat(promo-code): add routes and register in main router"
```

---

## Task 6: Fix banner.service.ts + banner.controller.ts

**Files:**
- Modify: `src/modules/banner/banner.service.ts`
- Modify: `src/modules/banner/banner.controller.ts`

- [ ] **Step 1: Update `banner.service.ts`**

Add import at the top of the file (after existing imports):
```typescript
import { promoCodeService } from "../promo-code/promo-code.service";
```

Replace the entire `create` method (lines 23–136) with:

```typescript
async create(storeId: number, data: CreateBannerData) {
  return prisma.$transaction(async (tx) => {
    const existingBanner = await tx.banner.findFirst({
      where: {
        storeId,
        isActive: true,
        status: { in: ["PENDING", "APPROVED"] },
        deadline: { gt: new Date() },
      },
    });

    if (existingBanner) {
      throw new Error("У вашего магазина уже есть активный баннер.");
    }

    const products = await tx.product.findMany({
      where: {
        id: { in: data.productIds },
        storeId,
      },
      select: { id: true, price: true },
    });

    if (products.length !== data.productIds.length) {
      throw new Error(
        "Некоторые товары не найдены или не принадлежат вашему магазину.",
      );
    }

    const calculateNewPrice = (originalPrice: number) => {
      const price = Number(originalPrice);
      switch (data.promoType) {
        case "PERCENT":
          return price - (price * (data.discount ?? 0)) / 100;
        case "FIXED_PRICE":
          return Number(data.fixedPrice) ?? price;
        default:
          return price;
      }
    };

    let finalPrice = BASE_BANNER_PRICE;
    let appliedPromoId: number | null = null;

    if (data.promoCode) {
      const result = await promoCodeService.validateInTx(
        tx,
        data.promoCode,
        storeId,
      );
      finalPrice = result.finalPrice;
      appliedPromoId = result.promoId;
    }

    const banner = await tx.banner.create({
      data: {
        storeId,
        title: data.title,
        accent: data.accent,
        description: data.description,
        decoNum: data.decoNum,
        promoTag: data.promoTag,
        color: data.color,
        promoType: data.promoType,
        discount: data.discount ?? null,
        fixedPrice: data.fixedPrice ?? null,
        deadline: new Date(data.deadline),
        products: {
          create: products.map((p) => ({
            productId: p.id,
            originalPrice: p.price,
          })),
        },
        slot: {
          create: {
            price: finalPrice,
            isPaid: finalPrice === 0,
            startAt: new Date(),
            endAt: new Date(data.deadline),
          },
        },
      },
      include: { slot: true, products: true },
    });

    await Promise.all(
      products.map((p) =>
        tx.product.update({
          where: { id: p.id },
          data: { newPrice: calculateNewPrice(Number(p.price)) },
        }),
      ),
    );

    if (appliedPromoId !== null) {
      await promoCodeService.recordUsageInTx(
        tx,
        appliedPromoId,
        banner.id,
        storeId,
      );
    }

    return banner;
  });
}
```

- [ ] **Step 2: Update `banner.controller.ts` — add promo error handling**

Replace the `createBanner` function with:

```typescript
const createBanner = async (req: Request, res: Response) => {
  try {
    const storeId = Number(req.params.storeId);
    const banner = await bannerService.create(storeId, req.body);
    res.status(201).json({ banner });
  } catch (error: any) {
    console.error("Ошибка при создании баннера:", error);

    if (error.message.includes("уже есть активный баннер")) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message === "PROMO_INVALID") {
      return res
        .status(400)
        .json({ message: "Промокод недействителен или истёк" });
    }
    if (error.message === "PROMO_EXHAUSTED") {
      return res.status(400).json({ message: "Промокод больше недоступен" });
    }
    if (error.message === "PROMO_STORE_ALREADY_USED") {
      return res
        .status(400)
        .json({ message: "Ваш магазин уже использовал этот промокод" });
    }

    res.status(500).json({ message: "Ошибка сервера при создании баннера" });
  }
};
```

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/modules/banner/banner.service.ts src/modules/banner/banner.controller.ts
git commit -m "fix(banner): fix promo code bug, delegate to promoCodeService, track PromoCodeUsage"
```

---

## Manual Testing (no test suite configured)

Start dev server: `npm run dev`

**1. Create promo code as ADMIN:**
```bash
curl -X POST http://localhost:3000/nest-shop/promo-code \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"code":"TEST50","discount":50,"usageLimit":5,"expiresAt":"2027-01-01T00:00:00.000Z"}'
```
Expected: `201 { "promoCode": { "id": 1, "code": "TEST50", "discount": 50, ... } }`

**2. Validate as OWNER:**
```bash
curl http://localhost:3000/nest-shop/promo-code/validate/TEST50 \
  -H "Authorization: Bearer <owner_token>"
```
Expected: `200 { "valid": true, "discount": 50, "originalPrice": 500, "finalPrice": 250, ... }`

**3. Create banner with promo code:**
```bash
curl -X POST http://localhost:3000/nest-shop/banner/<storeId> \
  -H "Authorization: Bearer <owner_token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Sale","accent":"-50%","description":"test","decoNum":"50","promoTag":"SALE","color":"#ff0000","promoType":"PERCENT","discount":30,"deadline":"2027-01-01T00:00:00.000Z","productIds":[1],"promoCode":"TEST50"}'
```
Expected: `201` with `slot.price = 250`, `slot.isPaid = false`

**4. Validate same code again (same store):**
Expected: `200 { "valid": false, "reason": "Ваш магазин уже использовал этот промокод" }`

**5. List as ADMIN (check history):**
```bash
curl http://localhost:3000/nest-shop/promo-code \
  -H "Authorization: Bearer <admin_token>"
```
Expected: `200` with `usages` showing the store + banner.

**6. Deactivate:**
```bash
curl -X PATCH http://localhost:3000/nest-shop/promo-code/1/deactivate \
  -H "Authorization: Bearer <admin_token>"
```
Expected: `200 { "promoCode": { ..., "isActive": false } }`

**7. Try to use deactivated code:**
Expected: `400 { "message": "Промокод недействителен или истёк" }`
