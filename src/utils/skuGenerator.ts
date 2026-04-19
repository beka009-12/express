// utils/skuGenerator.ts

const colorMap: Record<string, string> = {
  // Русские варианты
  черн: "CHER",
  чёрн: "CHER",
  черный: "CHER",
  чёрный: "CHER",
  бел: "BEL",
  белый: "BEL",
  white: "WHT",
  красн: "KRAS",
  красный: "KRAS",
  red: "RED",
  синий: "SIN",
  blue: "BLU",
  сер: "SER",
  серый: "SER",
  grey: "GRY",
  gray: "GRY",
  silver: "SIL",
  зел: "ZEL",
  зелен: "ZEL",
  зелёный: "ZEL",
  green: "GRN",
  желт: "YEL",
  жёлт: "YEL",
  желтый: "YEL",
  yellow: "YEL",
  золот: "GOL",
  gold: "GOL",
  фиолет: "FIO",
  фиол: "FIO",
  violet: "FIO",
  purple: "PUR",
  розов: "ROZ",
  розовый: "ROZ",
  pink: "PNK",
  коричн: "KOR",
  коричнев: "KOR",
  brown: "BRN",
  оранж: "ORA",
  orange: "ORA",
  бежев: "BEJ",
  beige: "BEI",
  // Добавляй новые цвета сюда ↓
};

// Вспомогательная функция нормализации цвета
function getColorCode(colorInput: string): string {
  if (!colorInput) return "XXX";

  // Приводим к нижнему регистру и убираем всё кроме букв и цифр
  const normalized = colorInput
    .toLowerCase()
    .trim()
    .replace(/[^а-яa-z0-9]/g, "");

  // Ищем в мапе
  if (colorMap[normalized]) {
    return colorMap[normalized];
  }

  // Если не нашли — делаем короткий код из введённого значения
  return (
    colorInput
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 4) || "XXX"
  );
}

function clean(str: string): string {
  return str.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export async function generateUniqueSKU(
  prisma: any,
  brandName: string | null | undefined,
  title: string,
  colors: string[] | any[],
  categoryName: string,
): Promise<string> {
  // 1. Бренд
  const brandPart = clean(brandName || "NO").slice(0, 5) || "NO";

  // 2. Категория
  let categoryPart = clean(categoryName).slice(0, 6);
  if (categoryPart.length < 3) categoryPart = "XXX";

  // 3. Цвет — используем улучшенную функцию getColorCode()
  let colorStr = "";
  if (Array.isArray(colors) && colors.length > 0) {
    const firstColor = colors[0];
    colorStr =
      typeof firstColor === "string"
        ? firstColor
        : firstColor?.name || firstColor?.hex || firstColor?.value || "";
  }

  const colorPart = getColorCode(colorStr);

  // 4. Базовая часть SKU
  const baseSKU = `${brandPart}-${categoryPart}-${colorPart}`;

  // 5. Последовательный номер
  const existingCount = await prisma.product.count({
    where: {
      sku: { startsWith: baseSKU },
    },
  });

  const sequence = String(existingCount + 1).padStart(4, "0");

  return `${baseSKU}-${sequence}`;
}
