import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ── User (OWNER) ──────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Nestshop123', 10);

  const owner = await prisma.user.upsert({
    where: { email: 'owner@nestshop.kg' },
    update: {},
    create: {
      email: 'owner@nestshop.kg',
      password: passwordHash,
      name: 'Nest Owner',
      phone: '+996700000001',
      role: UserRole.OWNER,
    },
  });

  console.log(`Owner user: id=${owner.id}`);

  // ── Store ─────────────────────────────────────────────────────
  let store = await prisma.store.findFirst({ where: { ownerId: owner.id } });

  if (!store) {
    store = await prisma.store.create({
      data: {
        name: 'Nest Store',
        description: 'Официальный магазин Nest Shop — одежда и аксессуары',
        address: 'ул. Чуй 123, Бишкек',
        region: 'Бишкек',
        isVerified: true,
        isActive: true,
        ownerId: owner.id,
      },
    });
  }

  console.log(`Store: id=${store.id}`);

  await seedCategories();
  const categoryMap = await getCategoryMap();
  await seedProducts(store.id, categoryMap);
  await seedBanners(store.id);

  console.log('Done!');
}

// ── Categories ────────────────────────────────────────────────────────────────

async function findOrCreateCategory(name: string, parentId: number | null): Promise<number> {
  const existing = await prisma.category.findFirst({ where: { name, parentId } });
  if (existing) return existing.id;
  const created = await prisma.category.create({ data: { name, parentId } });
  return created.id;
}

async function seedCategories() {
  const parentNames = [
    'Мужская одежда',
    'Женская одежда',
    'Детская одежда',
    'Обувь',
    'Аксессуары',
  ];

  const parentIds: Record<string, number> = {};
  for (const name of parentNames) {
    parentIds[name] = await findOrCreateCategory(name, null);
  }

  const children: Array<{ name: string; parent: string }> = [
    { name: 'Футболки', parent: 'Мужская одежда' },
    { name: 'Брюки', parent: 'Мужская одежда' },
    { name: 'Куртки', parent: 'Мужская одежда' },
    { name: 'Платья', parent: 'Женская одежда' },
    { name: 'Блузки', parent: 'Женская одежда' },
    { name: 'Джинсы', parent: 'Женская одежда' },
    { name: 'Мальчикам', parent: 'Детская одежда' },
    { name: 'Девочкам', parent: 'Детская одежда' },
    { name: 'Мужская обувь', parent: 'Обувь' },
    { name: 'Женская обувь', parent: 'Обувь' },
    { name: 'Сумки', parent: 'Аксессуары' },
    { name: 'Ремни', parent: 'Аксессуары' },
  ];

  for (const { name, parent } of children) {
    await findOrCreateCategory(name, parentIds[parent]);
  }

  console.log('Categories seeded');
}

async function getCategoryMap(): Promise<Record<string, number>> {
  const all = await prisma.category.findMany();
  return Object.fromEntries(all.map((c) => [c.name, c.id]));
}

// ── Products ──────────────────────────────────────────────────────────────────

async function seedProducts(storeId: number, categoryMap: Record<string, number>) {
  const products = [
    {
      sku: 'SEED-M-TSHIRT-001',
      title: 'Футболка Nike Basic',
      description: 'Классическая хлопковая футболка Nike. Удобная посадка, дышащий материал.',
      categoryId: categoryMap['Футболки'],
      price: 1200,
      newPrice: 990,
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['белый', 'чёрный', 'серый'],
      gender: 'MALE' as const,
      season: 'ALL_SEASON' as const,
      brandName: 'Nike',
      stockCount: 50,
    },
    {
      sku: 'SEED-M-TSHIRT-002',
      title: 'Футболка Adidas Sport',
      description: 'Спортивная футболка Adidas с технологией Climalite.',
      categoryId: categoryMap['Футболки'],
      price: 1400,
      newPrice: null,
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['синий', 'чёрный'],
      gender: 'MALE' as const,
      season: 'SPRING_SUMMER' as const,
      brandName: 'Adidas',
      stockCount: 35,
    },
    {
      sku: 'SEED-M-PANTS-001',
      title: 'Брюки классические',
      description: 'Классические мужские брюки из смесовой ткани. Подходят для офиса.',
      categoryId: categoryMap['Брюки'],
      price: 3200,
      newPrice: 2500,
      sizes: ['46', '48', '50', '52', '54'],
      colors: ['чёрный', 'тёмно-синий', 'серый'],
      gender: 'MALE' as const,
      season: 'ALL_SEASON' as const,
      brandName: null,
      stockCount: 20,
    },
    {
      sku: 'SEED-M-JACKET-001',
      title: 'Куртка зимняя мужская',
      description: 'Тёплая зимняя куртка с утеплителем. Водоотталкивающее покрытие.',
      categoryId: categoryMap['Куртки'],
      price: 8500,
      newPrice: 7000,
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: ['чёрный', 'хаки'],
      gender: 'MALE' as const,
      season: 'AUTUMN_WINTER' as const,
      brandName: null,
      stockCount: 15,
    },
    {
      sku: 'SEED-F-DRESS-001',
      title: 'Платье летнее',
      description: 'Лёгкое летнее платье из вискозы. Яркий цветочный принт.',
      categoryId: categoryMap['Платья'],
      price: 2800,
      newPrice: 2200,
      sizes: ['XS', 'S', 'M', 'L'],
      colors: ['цветочный', 'белый'],
      gender: 'FEMALE' as const,
      season: 'SPRING_SUMMER' as const,
      brandName: null,
      stockCount: 25,
    },
    {
      sku: 'SEED-F-BLOUSE-001',
      title: 'Блузка офисная',
      description: 'Элегантная офисная блузка из шёлковой ткани. Строгий крой.',
      categoryId: categoryMap['Блузки'],
      price: 1900,
      newPrice: null,
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['белый', 'голубой', 'розовый'],
      gender: 'FEMALE' as const,
      season: 'ALL_SEASON' as const,
      brandName: null,
      stockCount: 30,
    },
    {
      sku: 'SEED-F-JEANS-001',
      title: 'Джинсы skinny',
      description: 'Облегающие джинсы skinny fit из стрейч-денима. Высокая посадка.',
      categoryId: categoryMap['Джинсы'],
      price: 3500,
      newPrice: 2800,
      sizes: ['25', '26', '27', '28', '29', '30'],
      colors: ['синий', 'чёрный'],
      gender: 'FEMALE' as const,
      season: 'ALL_SEASON' as const,
      brandName: null,
      stockCount: 40,
    },
    {
      sku: 'SEED-M-SHOES-001',
      title: 'Кроссовки мужские Nike Air',
      description: 'Кроссовки Nike Air Max с амортизацией. Удобны для спорта и прогулок.',
      categoryId: categoryMap['Мужская обувь'],
      price: 6500,
      newPrice: 4990,
      sizes: ['40', '41', '42', '43', '44', '45'],
      colors: ['белый', 'чёрный', 'красный'],
      gender: 'MALE' as const,
      season: 'ALL_SEASON' as const,
      brandName: 'Nike',
      stockCount: 22,
    },
    {
      sku: 'SEED-F-SHOES-001',
      title: 'Туфли женские классические',
      description: 'Элегантные туфли на каблуке из натуральной кожи.',
      categoryId: categoryMap['Женская обувь'],
      price: 4200,
      newPrice: 3500,
      sizes: ['35', '36', '37', '38', '39', '40'],
      colors: ['чёрный', 'бежевый'],
      gender: 'FEMALE' as const,
      season: 'ALL_SEASON' as const,
      brandName: null,
      stockCount: 18,
    },
    {
      sku: 'SEED-K-TSHIRT-001',
      title: 'Футболка детская',
      description: 'Мягкая хлопковая футболка для мальчиков. Яркие принты.',
      categoryId: categoryMap['Мальчикам'],
      price: 800,
      newPrice: null,
      sizes: ['86', '92', '98', '104', '110', '116'],
      colors: ['синий', 'зелёный', 'красный'],
      gender: 'MALE' as const,
      season: 'SPRING_SUMMER' as const,
      brandName: null,
      stockCount: 60,
    },
    {
      sku: 'SEED-K-DRESS-001',
      title: 'Платье детское',
      description: 'Нежное платье для девочек с оборками. Хлопок 100%.',
      categoryId: categoryMap['Девочкам'],
      price: 1100,
      newPrice: 900,
      sizes: ['86', '92', '98', '104', '110'],
      colors: ['розовый', 'белый', 'сиреневый'],
      gender: 'FEMALE' as const,
      season: 'SPRING_SUMMER' as const,
      brandName: null,
      stockCount: 45,
    },
    {
      sku: 'SEED-ACC-BAG-001',
      title: 'Сумка женская кожаная',
      description: 'Вместительная сумка из натуральной кожи. Классический дизайн.',
      categoryId: categoryMap['Сумки'],
      price: 5500,
      newPrice: 4500,
      sizes: [],
      colors: ['чёрный', 'коричневый', 'бежевый'],
      gender: 'FEMALE' as const,
      season: 'ALL_SEASON' as const,
      brandName: null,
      stockCount: 12,
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        storeId,
        categoryId: p.categoryId,
        title: p.title,
        description: p.description,
        images: [`https://picsum.photos/seed/${p.sku}/600/600`],
        brandName: p.brandName,
        sku: p.sku,
        sizes: p.sizes,
        colors: p.colors,
        gender: p.gender,
        season: p.season,
        price: p.price,
        newPrice: p.newPrice ?? undefined,
        stockCount: p.stockCount,
        isActive: true,
      },
    });
  }

  console.log(`Products seeded: ${products.length}`);
}

// ── Banners ───────────────────────────────────────────────────────────────────

async function seedBanners(storeId: number) {
  const existingCount = await prisma.banner.count({ where: { storeId } });
  if (existingCount >= 2) {
    console.log('Banners already seeded, skipping');
    return;
  }

  const nikeShoes = await prisma.product.findFirst({ where: { sku: 'SEED-M-SHOES-001' } });
  const summerDress = await prisma.product.findFirst({ where: { sku: 'SEED-F-DRESS-001' } });
  const jeans = await prisma.product.findFirst({ where: { sku: 'SEED-F-JEANS-001' } });

  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  // Banner 1: PERCENT — Nike shoes -50%
  const banner1 = await prisma.banner.create({
    data: {
      storeId,
      title: 'Скидка',
      accent: '−50% на всю обувь Nike',
      description: 'Только до конца месяца — обновляй гардероб выгодно',
      decoNum: '−50%',
      promoTag: 'Горячая акция',
      color: '#ef4444',
      promoType: 'PERCENT',
      discount: 50,
      deadline: in30Days,
      isActive: true,
      status: 'APPROVED',
      products: nikeShoes
        ? { create: { productId: nikeShoes.id, originalPrice: nikeShoes.price } }
        : undefined,
      slot: {
        create: { isPaid: true, startAt: now, endAt: in30Days, price: 500 },
      },
    },
  });

  // Banner 2: SEASONAL — summer sale -30%
  const banner2 = await prisma.banner.create({
    data: {
      storeId,
      title: 'Распродажа',
      accent: 'Летняя коллекция −30%',
      description: 'Обновляем гардероб вместе — лучшие цены сезона',
      decoNum: '−30%',
      promoTag: 'Сезонная распродажа',
      color: '#f97316',
      promoType: 'SEASONAL',
      discount: 30,
      deadline: in60Days,
      isActive: true,
      status: 'APPROVED',
      slot: {
        create: { isPaid: true, startAt: now, endAt: in60Days, price: 500 },
      },
    },
  });

  if (summerDress) {
    await prisma.bannerProduct.create({
      data: { bannerId: banner2.id, productId: summerDress.id, originalPrice: summerDress.price },
    });
  }
  if (jeans) {
    await prisma.bannerProduct.create({
      data: { bannerId: banner2.id, productId: jeans.id, originalPrice: jeans.price },
    });
  }

  console.log(`Banners seeded: banner1.id=${banner1.id}, banner2.id=${banner2.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
