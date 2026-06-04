import { PrismaClient } from '@prisma/client';

type OfficialFood = {
  name_zh: string;
  name_en: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sodium_mg?: number;
  default_serving_g?: number;
  serving_name?: string;
  category:
    | 'MEAT_PROTEIN'
    | 'SEAFOOD'
    | 'DAIRY'
    | 'EGGS'
    | 'GRAIN'
    | 'VEGETABLE'
    | 'FRUIT'
    | 'NUTS_SEEDS'
    | 'OIL_FAT'
    | 'SAUCE_CONDIMENT'
    | 'BEVERAGE'
    | 'PROTEIN_POWDER'
    | 'MEAL_REPLACEMENT'
    | 'PROCESSED_FOOD'
    | 'FAST_FOOD'
    | 'RESTAURANT'
    | 'OTHER';
};

// 全部数值为「可食用部分 per 100g」，生重/干重以备注区分
// 数据来源：USDA FoodData Central + 中国食物成分表（第六版），取常用近似值
export const OFFICIAL_FOODS: OfficialFood[] = [
  // ── 蛋白：禽畜 ──
  { name_zh: '鸡胸肉（生）', name_en: 'Chicken Breast (raw)', kcal: 120, protein: 23, carbs: 0, fat: 2.6, default_serving_g: 150, serving_name: '一份', category: 'MEAT_PROTEIN' },
  { name_zh: '鸡腿肉去皮（生）', name_en: 'Chicken Thigh Skinless (raw)', kcal: 119, protein: 19, carbs: 0, fat: 4.3, default_serving_g: 150, serving_name: '一份', category: 'MEAT_PROTEIN' },
  { name_zh: '牛眼肉（生）', name_en: 'Beef Ribeye (raw)', kcal: 271, protein: 17, carbs: 0, fat: 22, default_serving_g: 200, serving_name: '一块', category: 'MEAT_PROTEIN' },
  { name_zh: '瘦牛绞肉 90/10（生）', name_en: 'Lean Ground Beef 90/10 (raw)', kcal: 176, protein: 20, carbs: 0, fat: 10, default_serving_g: 150, serving_name: '一份', category: 'MEAT_PROTEIN' },
  { name_zh: '西冷牛排（生）', name_en: 'Sirloin Steak (raw)', kcal: 158, protein: 21, carbs: 0, fat: 8, default_serving_g: 200, serving_name: '一块', category: 'MEAT_PROTEIN' },
  { name_zh: '猪里脊（生）', name_en: 'Pork Tenderloin (raw)', kcal: 143, protein: 21, carbs: 0, fat: 6, default_serving_g: 150, serving_name: '一份', category: 'MEAT_PROTEIN' },
  { name_zh: '火鸡胸肉（生）', name_en: 'Turkey Breast (raw)', kcal: 114, protein: 24, carbs: 0, fat: 1.5, default_serving_g: 150, serving_name: '一份', category: 'MEAT_PROTEIN' },

  // ── 蛋白：海产 ──
  { name_zh: '三文鱼（生）', name_en: 'Salmon (raw)', kcal: 208, protein: 20, carbs: 0, fat: 13, default_serving_g: 150, serving_name: '一份', category: 'SEAFOOD' },
  { name_zh: '金枪鱼罐头（水浸）', name_en: 'Tuna in Water (canned)', kcal: 116, protein: 25, carbs: 0, fat: 1, sodium_mg: 247, default_serving_g: 80, serving_name: '一罐净肉', category: 'SEAFOOD' },
  { name_zh: '巴沙鱼柳（生）', name_en: 'Basa Fillet (raw)', kcal: 96, protein: 21, carbs: 0, fat: 1, default_serving_g: 150, serving_name: '一片', category: 'SEAFOOD' },
  { name_zh: '鳕鱼（生）', name_en: 'Cod (raw)', kcal: 82, protein: 18, carbs: 0, fat: 0.7, default_serving_g: 150, serving_name: '一份', category: 'SEAFOOD' },
  { name_zh: '大虾仁（生）', name_en: 'Shrimp (raw)', kcal: 99, protein: 24, carbs: 0.2, fat: 0.3, default_serving_g: 120, serving_name: '一份', category: 'SEAFOOD' },

  // ── 蛋类 ──
  { name_zh: '全蛋', name_en: 'Whole Egg', kcal: 155, protein: 13, carbs: 1.1, fat: 11, default_serving_g: 50, serving_name: '一个鸡蛋', category: 'EGGS' },
  { name_zh: '蛋白', name_en: 'Egg White', kcal: 52, protein: 11, carbs: 0.7, fat: 0.2, default_serving_g: 33, serving_name: '一个蛋白', category: 'EGGS' },

  // ── 乳制品 ──
  { name_zh: '脱脂牛奶', name_en: 'Skim Milk', kcal: 35, protein: 3.4, carbs: 5, fat: 0.1, default_serving_g: 250, serving_name: '一杯 250ml', category: 'DAIRY' },
  { name_zh: '全脂牛奶', name_en: 'Whole Milk', kcal: 62, protein: 3.2, carbs: 4.8, fat: 3.6, default_serving_g: 250, serving_name: '一杯 250ml', category: 'DAIRY' },
  { name_zh: '希腊酸奶 0%', name_en: 'Greek Yogurt 0%', kcal: 59, protein: 10, carbs: 3.6, fat: 0.4, default_serving_g: 170, serving_name: '一盒', category: 'DAIRY' },
  { name_zh: '低脂农家奶酪', name_en: 'Cottage Cheese Low-Fat', kcal: 81, protein: 11, carbs: 3.4, fat: 2.3, default_serving_g: 100, serving_name: '一份', category: 'DAIRY' },

  // ── 谷物 / 主食（生重/干重） ──
  { name_zh: '燕麦片（干）', name_en: 'Rolled Oats (dry)', kcal: 389, protein: 17, carbs: 66, fat: 7, fiber: 10, default_serving_g: 60, serving_name: '一份 60g 干', category: 'GRAIN' },
  { name_zh: '糙米（干）', name_en: 'Brown Rice (dry)', kcal: 370, protein: 7.5, carbs: 77, fat: 2.7, fiber: 3.5, default_serving_g: 80, serving_name: '一份 80g 干', category: 'GRAIN' },
  { name_zh: '白米（干）', name_en: 'White Rice (dry)', kcal: 365, protein: 7, carbs: 80, fat: 0.7, default_serving_g: 80, serving_name: '一份 80g 干', category: 'GRAIN' },
  { name_zh: '全麦面包', name_en: 'Whole Wheat Bread', kcal: 247, protein: 13, carbs: 41, fat: 4, fiber: 7, default_serving_g: 30, serving_name: '一片', category: 'GRAIN' },
  { name_zh: '全麦意面（干）', name_en: 'Whole Wheat Pasta (dry)', kcal: 348, protein: 14, carbs: 71, fat: 2.5, default_serving_g: 80, serving_name: '一份 80g 干', category: 'GRAIN' },
  { name_zh: '藜麦（干）', name_en: 'Quinoa (dry)', kcal: 368, protein: 14, carbs: 64, fat: 6, fiber: 7, default_serving_g: 60, serving_name: '一份 60g 干', category: 'GRAIN' },
  { name_zh: '红薯', name_en: 'Sweet Potato', kcal: 86, protein: 1.6, carbs: 20, fat: 0.1, fiber: 3, default_serving_g: 200, serving_name: '一根中等', category: 'VEGETABLE' },
  { name_zh: '土豆', name_en: 'Potato', kcal: 77, protein: 2, carbs: 17, fat: 0.1, default_serving_g: 200, serving_name: '一个中等', category: 'VEGETABLE' },
  { name_zh: '玉米粒', name_en: 'Sweet Corn Kernels', kcal: 86, protein: 3.2, carbs: 19, fat: 1.2, default_serving_g: 150, serving_name: '一份', category: 'VEGETABLE' },

  // ── 蔬菜 ──
  { name_zh: '西兰花', name_en: 'Broccoli', kcal: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, default_serving_g: 150, serving_name: '一份', category: 'VEGETABLE' },
  { name_zh: '菠菜', name_en: 'Spinach', kcal: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, default_serving_g: 150, serving_name: '一份', category: 'VEGETABLE' },
  { name_zh: '芦笋', name_en: 'Asparagus', kcal: 20, protein: 2.2, carbs: 3.9, fat: 0.1, fiber: 2.1, default_serving_g: 150, serving_name: '一份', category: 'VEGETABLE' },
  { name_zh: '黄瓜', name_en: 'Cucumber', kcal: 16, protein: 0.7, carbs: 3.6, fat: 0.1, default_serving_g: 200, serving_name: '一根', category: 'VEGETABLE' },
  { name_zh: '番茄', name_en: 'Tomato', kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2, default_serving_g: 150, serving_name: '一个', category: 'VEGETABLE' },
  { name_zh: '生菜', name_en: 'Lettuce', kcal: 15, protein: 1.4, carbs: 2.9, fat: 0.2, default_serving_g: 100, serving_name: '一份', category: 'VEGETABLE' },
  { name_zh: '胡萝卜', name_en: 'Carrot', kcal: 41, protein: 0.9, carbs: 9.6, fat: 0.2, fiber: 2.8, default_serving_g: 100, serving_name: '一根', category: 'VEGETABLE' },

  // ── 水果 ──
  { name_zh: '香蕉', name_en: 'Banana', kcal: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, default_serving_g: 120, serving_name: '一根', category: 'FRUIT' },
  { name_zh: '苹果', name_en: 'Apple', kcal: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, default_serving_g: 180, serving_name: '一个', category: 'FRUIT' },
  { name_zh: '蓝莓', name_en: 'Blueberry', kcal: 57, protein: 0.7, carbs: 14, fat: 0.3, fiber: 2.4, default_serving_g: 100, serving_name: '一份', category: 'FRUIT' },
  { name_zh: '橙子', name_en: 'Orange', kcal: 47, protein: 0.9, carbs: 12, fat: 0.1, fiber: 2.4, default_serving_g: 180, serving_name: '一个', category: 'FRUIT' },

  // ── 坚果 / 油脂 ──
  { name_zh: '牛油果', name_en: 'Avocado', kcal: 160, protein: 2, carbs: 9, fat: 15, fiber: 7, default_serving_g: 100, serving_name: '半个', category: 'FRUIT' },
  { name_zh: '杏仁', name_en: 'Almond', kcal: 579, protein: 21, carbs: 22, fat: 50, fiber: 12, default_serving_g: 28, serving_name: '一把 ~28g', category: 'NUTS_SEEDS' },
  { name_zh: '核桃', name_en: 'Walnut', kcal: 654, protein: 15, carbs: 14, fat: 65, fiber: 7, default_serving_g: 28, serving_name: '一把 ~28g', category: 'NUTS_SEEDS' },
  { name_zh: '天然花生酱', name_en: 'Natural Peanut Butter', kcal: 588, protein: 25, carbs: 20, fat: 50, fiber: 6, default_serving_g: 16, serving_name: '一勺 ~16g', category: 'NUTS_SEEDS' },
  { name_zh: '初榨橄榄油', name_en: 'Extra Virgin Olive Oil', kcal: 884, protein: 0, carbs: 0, fat: 100, default_serving_g: 10, serving_name: '一勺 ~10g', category: 'OIL_FAT' },
  { name_zh: 'MCT 油', name_en: 'MCT Oil', kcal: 850, protein: 0, carbs: 0, fat: 100, default_serving_g: 15, serving_name: '一勺 ~15g', category: 'OIL_FAT' },

  // ── 补剂 / 加工 ──
  { name_zh: '乳清分离蛋白粉', name_en: 'Whey Protein Isolate', kcal: 380, protein: 85, carbs: 5, fat: 2, default_serving_g: 30, serving_name: '一勺 ~30g', category: 'PROTEIN_POWDER' },
  { name_zh: '酪蛋白粉', name_en: 'Casein Protein', kcal: 360, protein: 80, carbs: 7, fat: 1.5, default_serving_g: 30, serving_name: '一勺 ~30g', category: 'PROTEIN_POWDER' },
  { name_zh: '葡萄糖粉', name_en: 'Dextrose Powder', kcal: 380, protein: 0, carbs: 95, fat: 0, default_serving_g: 30, serving_name: '一勺 ~30g', category: 'PROTEIN_POWDER' },
  { name_zh: '麦芽糊精', name_en: 'Maltodextrin', kcal: 380, protein: 0, carbs: 95, fat: 0, default_serving_g: 30, serving_name: '一勺 ~30g', category: 'PROTEIN_POWDER' },

  // ── 调味/饮料 ──
  { name_zh: '黑咖啡（美式）', name_en: 'Black Coffee', kcal: 2, protein: 0.3, carbs: 0, fat: 0, default_serving_g: 250, serving_name: '一杯', category: 'BEVERAGE' },
  { name_zh: '蜂蜜', name_en: 'Honey', kcal: 304, protein: 0.3, carbs: 82, fat: 0, default_serving_g: 20, serving_name: '一勺 ~20g', category: 'SAUCE_CONDIMENT' },
];

export async function seedOfficialFoods(prisma: PrismaClient) {
  let created = 0;
  let updated = 0;
  let skipped = 0;
  for (const f of OFFICIAL_FOODS) {
    const existing = await prisma.food.findFirst({
      where: { name_zh: f.name_zh, is_official: true },
    });
    const data = {
      name_zh: f.name_zh,
      name_en: f.name_en,
      kcal_per_100g: f.kcal,
      protein_per_100g: f.protein,
      carbs_per_100g: f.carbs,
      fat_per_100g: f.fat,
      fiber_per_100g: f.fiber ?? null,
      sodium_mg_per_100g: f.sodium_mg ?? null,
      default_serving_g: f.default_serving_g ?? null,
      serving_name: f.serving_name ?? null,
      category: f.category,
      is_official: true,
      verified: true,
    };
    if (existing) {
      await prisma.food.update({ where: { id: existing.id }, data });
      updated += 1;
    } else {
      // 若同 name_zh 已存在但非官方，绕开避免覆盖用户数据
      const userOwned = await prisma.food.findFirst({
        where: { name_zh: f.name_zh, is_official: false },
      });
      if (userOwned) {
        skipped += 1;
        continue;
      }
      await prisma.food.create({ data });
      created += 1;
    }
  }
  return { created, updated, skipped, total: OFFICIAL_FOODS.length };
}
