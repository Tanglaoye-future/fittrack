// 官方计划餐预设（哑铃区 · 4 分化高级选手配套）
// 同样保留为代码常量：MealPlanTemplate.user_id NOT NULL，
// cloneFromOfficial(slug, userId) 时按当前用户实例化。
//
// 基线：70–75 kg 中高级
//   Bulk (OFFSEASON)：≈ 3050 kcal · 220 P · 380 C · 75 F
//   Cut  (PREP)：≈ 2010 kcal · 210 P · 180 C ·  55 F
//
// 食材引用 OFFICIAL_FOODS 的 name_zh，service 层 resolve 为 food_id。

export type OfficialMealPlanSlug = 'dumbbell-meals-bulk' | 'dumbbell-meals-cut';

export interface OfficialScheduledMealIngredient {
  food_name_zh: string;
  grams: number;
}

export interface OfficialScheduledMeal {
  order_index: number; // 1-indexed
  meal_slot:
    | 'PRE_WORKOUT'
    | 'INTRA_WORKOUT'
    | 'POST_WORKOUT'
    | 'BREAKFAST'
    | 'MORNING_SNACK'
    | 'LUNCH'
    | 'AFTERNOON_SNACK'
    | 'PRE_DINNER'
    | 'DINNER'
    | 'LATE_NIGHT';
  target_time: string; // "HH:mm"
  target_kcal: number;
  target_protein_g: number;
  target_carbs_g: number;
  target_fat_g: number;
  notes?: string;
  ingredients: OfficialScheduledMealIngredient[];
}

export interface OfficialMealPlan {
  slug: OfficialMealPlanSlug;
  name: string;
  phase_tag: 'OFFSEASON' | 'PREP';
  description: string;
  total_kcal: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  meals: OfficialScheduledMeal[];
}

// ────────────────────────────────────────────────────────────────────
// BULK · 增肌期：5 餐结构 · ~3050 kcal
// ────────────────────────────────────────────────────────────────────
const BULK: OfficialMealPlan = {
  slug: 'dumbbell-meals-bulk',
  name: '增肌期餐单 · 5 餐结构（OFFSEASON）',
  phase_tag: 'OFFSEASON',
  description:
    '面向 70–75 kg 中高级选手的增肌期模板：5 餐分布，训练前/后碳水重点投放，夜宵慢消化蛋白。',
  // 与下方 meals[].target_* 加总严格一致
  total_kcal: 3030,
  total_protein_g: 238,
  total_carbs_g: 378,
  total_fat_g: 74,
  meals: [
    {
      order_index: 1,
      meal_slot: 'BREAKFAST',
      target_time: '07:00',
      target_kcal: 620,
      target_protein_g: 45,
      target_carbs_g: 85,
      target_fat_g: 14,
      notes: '燕麦碗 + 乳清 + 香蕉 + 花生酱',
      ingredients: [
        { food_name_zh: '燕麦片（干）', grams: 80 },
        { food_name_zh: '乳清分离蛋白粉', grams: 30 },
        { food_name_zh: '香蕉', grams: 120 },
        { food_name_zh: '天然花生酱', grams: 15 },
      ],
    },
    {
      order_index: 2,
      meal_slot: 'PRE_WORKOUT',
      target_time: '11:00',
      target_kcal: 580,
      target_protein_g: 48,
      target_carbs_g: 78,
      target_fat_g: 10,
      notes: '鸡胸 + 糙米 + 西兰花，训前 90–120 min 摄入',
      ingredients: [
        { food_name_zh: '鸡胸肉（生）', grams: 180 },
        { food_name_zh: '糙米（干）', grams: 80 },
        { food_name_zh: '西兰花', grams: 200 },
        { food_name_zh: '初榨橄榄油', grams: 4 },
      ],
    },
    {
      order_index: 3,
      meal_slot: 'POST_WORKOUT',
      target_time: '15:00',
      target_kcal: 520,
      target_protein_g: 50,
      target_carbs_g: 75,
      target_fat_g: 2,
      notes: '训后 30 min 内：乳清 + 葡萄糖 + 米饭 + 蛋白',
      ingredients: [
        { food_name_zh: '乳清分离蛋白粉', grams: 40 },
        { food_name_zh: '葡萄糖粉', grams: 30 },
        { food_name_zh: '白米（干）', grams: 50 },
        { food_name_zh: '蛋白', grams: 100 },
        { food_name_zh: '蓝莓', grams: 30 },
      ],
    },
    {
      order_index: 4,
      meal_slot: 'DINNER',
      target_time: '19:00',
      target_kcal: 710,
      target_protein_g: 45,
      target_carbs_g: 85,
      target_fat_g: 22,
      notes: '三文鱼 + 红薯 + 藜麦 + 芦笋',
      ingredients: [
        { food_name_zh: '三文鱼（生）', grams: 150 },
        { food_name_zh: '红薯', grams: 250 },
        { food_name_zh: '藜麦（干）', grams: 40 },
        { food_name_zh: '芦笋', grams: 200 },
      ],
    },
    {
      order_index: 5,
      meal_slot: 'LATE_NIGHT',
      target_time: '22:00',
      target_kcal: 600,
      target_protein_g: 50,
      target_carbs_g: 55,
      target_fat_g: 26,
      notes: '酪蛋白慢消化 + 农家奶酪 + 苹果 + 核桃，控制夜间分解',
      ingredients: [
        { food_name_zh: '酪蛋白粉', grams: 30 },
        { food_name_zh: '低脂农家奶酪', grams: 200 },
        { food_name_zh: '苹果', grams: 180 },
        { food_name_zh: '核桃', grams: 20 },
        { food_name_zh: '杏仁', grams: 10 },
      ],
    },
  ],
};

// ────────────────────────────────────────────────────────────────────
// CUT · 减脂期：5 餐结构 · ~2010 kcal
// ────────────────────────────────────────────────────────────────────
const CUT: OfficialMealPlan = {
  slug: 'dumbbell-meals-cut',
  name: '减脂期餐单 · 5 餐结构（PREP）',
  phase_tag: 'PREP',
  description:
    '面向 70–75 kg 中高级选手的减脂期模板：高蛋白维持肌量、训练日碳水靠拢训练时段、其它时间偏低糖。',
  // 与下方 meals[].target_* 加总严格一致
  total_kcal: 2090,
  total_protein_g: 224,
  total_carbs_g: 192,
  total_fat_g: 49,
  meals: [
    {
      order_index: 1,
      meal_slot: 'BREAKFAST',
      target_time: '07:30',
      target_kcal: 380,
      target_protein_g: 37,
      target_carbs_g: 35,
      target_fat_g: 10,
      notes: '蛋白 + 全蛋 + 燕麦，控制空腹胰岛素波动',
      ingredients: [
        { food_name_zh: '蛋白', grams: 200 },
        { food_name_zh: '全蛋', grams: 50 },
        { food_name_zh: '燕麦片（干）', grams: 50 },
      ],
    },
    {
      order_index: 2,
      meal_slot: 'LUNCH',
      target_time: '12:00',
      target_kcal: 405,
      target_protein_g: 43,
      target_carbs_g: 45,
      target_fat_g: 7,
      notes: '鸡胸 + 糙米 + 西兰花，主餐结构',
      ingredients: [
        { food_name_zh: '鸡胸肉（生）', grams: 150 },
        { food_name_zh: '糙米（干）', grams: 40 },
        { food_name_zh: '西兰花', grams: 200 },
        { food_name_zh: '初榨橄榄油', grams: 1 },
      ],
    },
    {
      order_index: 3,
      meal_slot: 'PRE_WORKOUT',
      target_time: '15:30',
      target_kcal: 385,
      target_protein_g: 42,
      target_carbs_g: 50,
      target_fat_g: 4,
      notes: '希腊酸奶 + 燕麦 + 苹果 + 乳清，训前 60–90 min',
      ingredients: [
        { food_name_zh: '希腊酸奶 0%', grams: 200 },
        { food_name_zh: '乳清分离蛋白粉', grams: 20 },
        { food_name_zh: '苹果', grams: 180 },
        { food_name_zh: '燕麦片（干）', grams: 25 },
      ],
    },
    {
      order_index: 4,
      meal_slot: 'POST_WORKOUT',
      target_time: '18:00',
      target_kcal: 445,
      target_protein_g: 54,
      target_carbs_g: 50,
      target_fat_g: 2,
      notes: '快碳 + 乳清 + 蛋白快速补给',
      ingredients: [
        { food_name_zh: '乳清分离蛋白粉', grams: 35 },
        { food_name_zh: '葡萄糖粉', grams: 25 },
        { food_name_zh: '蛋白', grams: 200 },
        { food_name_zh: '白米（干）', grams: 30 },
      ],
    },
    {
      order_index: 5,
      meal_slot: 'DINNER',
      target_time: '21:00',
      target_kcal: 475,
      target_protein_g: 48,
      target_carbs_g: 12,
      target_fat_g: 26,
      notes: '三文鱼 + 芦笋 + 菠菜 + 蛋白；高蛋白低糖收尾',
      ingredients: [
        { food_name_zh: '三文鱼（生）', grams: 150 },
        { food_name_zh: '芦笋', grams: 200 },
        { food_name_zh: '菠菜', grams: 100 },
        { food_name_zh: '初榨橄榄油', grams: 5 },
        { food_name_zh: '蛋白', grams: 100 },
      ],
    },
  ],
};

export const OFFICIAL_MEAL_PLANS: OfficialMealPlan[] = [BULK, CUT];

export function findOfficialMealPlanBySlug(slug: string): OfficialMealPlan | null {
  return OFFICIAL_MEAL_PLANS.find((p) => p.slug === slug) ?? null;
}
