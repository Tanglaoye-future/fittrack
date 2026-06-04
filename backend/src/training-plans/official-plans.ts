// 官方训练计划预设（哑铃区 · 4 分化 · 高级选手）
// 作为代码常量保留：TrainingPlan.user_id NOT NULL，官方计划不入库，
// 仅在 cloneFromOfficial(slug, userId) 时按当前用户实例化。
//
// 分化（day_of_week 用 1-4，5 休 6 休 7 休循环；用户可在 PlanActivation 时按周历对齐）：
//   D1 = 肩 + 腹
//   D2 = 背 + 二头
//   D3 = 胸 + 三头
//   D4 = 腿 + 小腿
//
// 基线：70–75 kg 中高级，每部位 14–18 组/周
// 动作只引用 Exercise.name_en，由 service 层 resolve 成 exercise_id

export type OfficialPlanSlug =
  | 'dumbbell-4split-offseason'
  | 'dumbbell-4split-prep';

export interface OfficialTemplateExercise {
  exercise_name_en: string;
  target_sets: number;
  target_reps_min: number;
  target_reps_max: number;
  target_rir?: number; // 留 1 位小数
  target_rpe?: number;
  rest_seconds: number;
  tempo?: string;
  notes?: string;
}

export interface OfficialTrainingTemplate {
  name: string;
  day_of_week: number; // 1–4
  estimated_minutes: number;
  rest_seconds_default: number;
  notes?: string;
  exercises: OfficialTemplateExercise[];
}

export interface OfficialTrainingPlan {
  slug: OfficialPlanSlug;
  name: string;
  description: string;
  weeks: number;
  phase_tag: 'OFFSEASON' | 'PREP'; // 给前端做卡片着色与匹配 PhaseConfig
  templates: OfficialTrainingTemplate[];
}

// ────────────────────────────────────────────────────────────────────
// OFFSEASON · 增肌期：复合 6–10 RM、孤立 10–15、RIR 1–2、组间 90–180s
// ────────────────────────────────────────────────────────────────────
const OFFSEASON: OfficialTrainingPlan = {
  slug: 'dumbbell-4split-offseason',
  name: '哑铃 4 分化 · 增肌期（OFFSEASON）',
  description:
    '面向 70–75 kg 中高级备赛选手的增肌期模板：纯哑铃区自由动作，4 分化，每部位 14–18 组/周，RIR 1–2、组间 90–180s，以累计有效张力为目标。',
  weeks: 12,
  phase_tag: 'OFFSEASON',
  templates: [
    {
      name: 'D1 · 肩 + 腹',
      day_of_week: 1,
      estimated_minutes: 75,
      rest_seconds_default: 120,
      notes: '重点：侧束体量 + 后束充分发力；腹部置于训练末段。',
      exercises: [
        { exercise_name_en: 'Seated Dumbbell Shoulder Press', target_sets: 4, target_reps_min: 6, target_reps_max: 10, target_rir: 1, rest_seconds: 150, tempo: '3-1-1-0' },
        { exercise_name_en: 'Arnold Press', target_sets: 3, target_reps_min: 8, target_reps_max: 12, target_rir: 1, rest_seconds: 120 },
        { exercise_name_en: 'Dumbbell Lateral Raise', target_sets: 4, target_reps_min: 10, target_reps_max: 15, target_rir: 1, rest_seconds: 75 },
        { exercise_name_en: 'Leaning Single-Arm Lateral Raise', target_sets: 3, target_reps_min: 10, target_reps_max: 15, target_rir: 1, rest_seconds: 75, notes: '左右算一组' },
        { exercise_name_en: 'Bent-Over Dumbbell Rear Delt Fly', target_sets: 4, target_reps_min: 12, target_reps_max: 15, target_rir: 1, rest_seconds: 75 },
        { exercise_name_en: 'Incline Prone Dumbbell Face Pull', target_sets: 3, target_reps_min: 12, target_reps_max: 15, target_rir: 1, rest_seconds: 75 },
        { exercise_name_en: 'Dumbbell Front Raise', target_sets: 2, target_reps_min: 12, target_reps_max: 15, target_rir: 1, rest_seconds: 60, notes: '前束孤立收尾，控制不借力' },
        { exercise_name_en: 'Dumbbell Shrug', target_sets: 3, target_reps_min: 10, target_reps_max: 15, target_rir: 1, rest_seconds: 90, notes: '顶端挤压 2s' },
        { exercise_name_en: 'Hanging Leg Raise', target_sets: 3, target_reps_min: 10, target_reps_max: 15, target_rir: 1, rest_seconds: 60 },
        { exercise_name_en: 'Weighted Dumbbell Crunch', target_sets: 3, target_reps_min: 12, target_reps_max: 15, target_rir: 1, rest_seconds: 60 },
        { exercise_name_en: 'Dumbbell Russian Twist', target_sets: 3, target_reps_min: 14, target_reps_max: 20, target_rir: 1, rest_seconds: 60, notes: '左右算一组' },
      ],
    },
    {
      name: 'D2 · 背 + 二头',
      day_of_week: 2,
      estimated_minutes: 80,
      rest_seconds_default: 120,
      notes: '硬拉放最前段（神经状态最好时）。',
      exercises: [
        { exercise_name_en: 'Dumbbell Romanian Deadlift', target_sets: 4, target_reps_min: 6, target_reps_max: 10, target_rir: 2, rest_seconds: 180 },
        { exercise_name_en: 'Pull-Up', target_sets: 4, target_reps_min: 6, target_reps_max: 10, target_rir: 1, rest_seconds: 150, notes: '可挂哑铃负重' },
        { exercise_name_en: 'Single-Arm Dumbbell Row', target_sets: 4, target_reps_min: 8, target_reps_max: 12, target_rir: 1, rest_seconds: 120, notes: '左右算一组' },
        { exercise_name_en: 'Chest-Supported Incline Dumbbell Row', target_sets: 3, target_reps_min: 10, target_reps_max: 12, target_rir: 1, rest_seconds: 90 },
        { exercise_name_en: 'Dumbbell Pullover', target_sets: 3, target_reps_min: 10, target_reps_max: 15, target_rir: 1, rest_seconds: 90 },
        { exercise_name_en: 'Dumbbell Curl', target_sets: 4, target_reps_min: 8, target_reps_max: 12, target_rir: 1, rest_seconds: 75 },
        { exercise_name_en: 'Dumbbell Hammer Curl', target_sets: 3, target_reps_min: 10, target_reps_max: 12, target_rir: 1, rest_seconds: 75 },
      ],
    },
    {
      name: 'D3 · 胸 + 三头',
      day_of_week: 3,
      estimated_minutes: 75,
      rest_seconds_default: 120,
      notes: '上胸优先（多数选手薄弱）。',
      exercises: [
        { exercise_name_en: 'Incline Dumbbell Bench Press', target_sets: 4, target_reps_min: 6, target_reps_max: 10, target_rir: 1, rest_seconds: 150, tempo: '3-1-1-0' },
        { exercise_name_en: 'Flat Dumbbell Bench Press', target_sets: 4, target_reps_min: 8, target_reps_max: 10, target_rir: 1, rest_seconds: 120 },
        { exercise_name_en: 'Decline Dumbbell Bench Press', target_sets: 3, target_reps_min: 10, target_reps_max: 12, target_rir: 1, rest_seconds: 90 },
        { exercise_name_en: 'Incline Dumbbell Fly', target_sets: 3, target_reps_min: 12, target_reps_max: 15, target_rir: 1, rest_seconds: 75 },
        { exercise_name_en: 'Dumbbell Squeeze Press', target_sets: 3, target_reps_min: 10, target_reps_max: 12, target_rir: 1, rest_seconds: 75 },
        { exercise_name_en: 'Dumbbell Overhead Tricep Extension', target_sets: 4, target_reps_min: 8, target_reps_max: 12, target_rir: 1, rest_seconds: 90 },
        { exercise_name_en: 'Dumbbell Skull Crusher', target_sets: 3, target_reps_min: 10, target_reps_max: 12, target_rir: 1, rest_seconds: 75 },
      ],
    },
    {
      name: 'D4 · 腿 + 小腿',
      day_of_week: 4,
      estimated_minutes: 85,
      rest_seconds_default: 150,
      notes: '股四头与后链交替，避免单次能量崩塌。',
      exercises: [
        { exercise_name_en: 'Goblet Squat', target_sets: 3, target_reps_min: 8, target_reps_max: 12, target_rir: 2, rest_seconds: 90, notes: '作为热身 + 第一轮动作' },
        { exercise_name_en: 'Dumbbell Front Squat', target_sets: 4, target_reps_min: 6, target_reps_max: 10, target_rir: 1, rest_seconds: 180, tempo: '3-1-1-0' },
        { exercise_name_en: 'Bulgarian Split Squat', target_sets: 4, target_reps_min: 8, target_reps_max: 12, target_rir: 1, rest_seconds: 120, notes: '左右算一组' },
        { exercise_name_en: 'Dumbbell Walking Lunge', target_sets: 3, target_reps_min: 10, target_reps_max: 12, target_rir: 1, rest_seconds: 120, notes: '每侧步数计组' },
        { exercise_name_en: 'Single-Leg Dumbbell RDL', target_sets: 3, target_reps_min: 8, target_reps_max: 12, target_rir: 1, rest_seconds: 120 },
        { exercise_name_en: 'Dumbbell Hip Thrust', target_sets: 4, target_reps_min: 10, target_reps_max: 15, target_rir: 1, rest_seconds: 90 },
        { exercise_name_en: 'Standing Dumbbell Calf Raise', target_sets: 4, target_reps_min: 10, target_reps_max: 15, target_rir: 1, rest_seconds: 75, tempo: '3-2-1-0' },
        { exercise_name_en: 'Single-Leg Dumbbell Calf Raise', target_sets: 3, target_reps_min: 12, target_reps_max: 15, target_rir: 1, rest_seconds: 60 },
      ],
    },
  ],
};

// ────────────────────────────────────────────────────────────────────
// PREP · 减脂期：复合 8–12 RM、孤立 12–15、RIR 0–1、组间 60–90s
// 总组数略低（疲劳管理），密度提升以增加心率与代谢
// ────────────────────────────────────────────────────────────────────
const PREP: OfficialTrainingPlan = {
  slug: 'dumbbell-4split-prep',
  name: '哑铃 4 分化 · 减脂期（PREP）',
  description:
    '面向 70–75 kg 中高级备赛选手的减脂期模板：复合动作 8–12 RM、孤立 12–15，RIR 0–1，组间 60–90s。每部位 12–16 组，重在维持机能与肌量。',
  weeks: 16,
  phase_tag: 'PREP',
  templates: [
    {
      name: 'D1 · 肩 + 腹',
      day_of_week: 1,
      estimated_minutes: 65,
      rest_seconds_default: 75,
      notes: '低糖期，控制总量，强调收缩感。',
      exercises: [
        { exercise_name_en: 'Seated Dumbbell Shoulder Press', target_sets: 4, target_reps_min: 8, target_reps_max: 12, target_rir: 0.5, rest_seconds: 90 },
        { exercise_name_en: 'Dumbbell Lateral Raise', target_sets: 4, target_reps_min: 12, target_reps_max: 15, target_rir: 0, rest_seconds: 60 },
        { exercise_name_en: 'Leaning Single-Arm Lateral Raise', target_sets: 3, target_reps_min: 12, target_reps_max: 15, target_rir: 0, rest_seconds: 60 },
        { exercise_name_en: 'Bent-Over Dumbbell Rear Delt Fly', target_sets: 4, target_reps_min: 12, target_reps_max: 15, target_rir: 0, rest_seconds: 60 },
        { exercise_name_en: 'Incline Prone Dumbbell Face Pull', target_sets: 3, target_reps_min: 12, target_reps_max: 15, target_rir: 0.5, rest_seconds: 60 },
        { exercise_name_en: 'Dumbbell Front Raise', target_sets: 2, target_reps_min: 12, target_reps_max: 15, target_rir: 0, rest_seconds: 60 },
        { exercise_name_en: 'Hanging Leg Raise', target_sets: 4, target_reps_min: 10, target_reps_max: 15, target_rir: 0.5, rest_seconds: 60 },
        { exercise_name_en: 'Weighted Dumbbell Crunch', target_sets: 3, target_reps_min: 12, target_reps_max: 15, target_rir: 0.5, rest_seconds: 45 },
        { exercise_name_en: 'Dumbbell Russian Twist', target_sets: 3, target_reps_min: 15, target_reps_max: 20, target_rir: 0.5, rest_seconds: 45 },
        { exercise_name_en: 'Plank', target_sets: 3, target_reps_min: 1, target_reps_max: 1, rest_seconds: 45, notes: '每组维持 45–60s' },
      ],
    },
    {
      name: 'D2 · 背 + 二头',
      day_of_week: 2,
      estimated_minutes: 70,
      rest_seconds_default: 75,
      notes: '背阔深拉、维持厚度。',
      exercises: [
        { exercise_name_en: 'Pull-Up', target_sets: 4, target_reps_min: 6, target_reps_max: 10, target_rir: 0.5, rest_seconds: 120 },
        { exercise_name_en: 'Single-Arm Dumbbell Row', target_sets: 4, target_reps_min: 10, target_reps_max: 12, target_rir: 0.5, rest_seconds: 75 },
        { exercise_name_en: 'Chest-Supported Incline Dumbbell Row', target_sets: 3, target_reps_min: 10, target_reps_max: 12, target_rir: 0.5, rest_seconds: 75 },
        { exercise_name_en: 'Dumbbell Romanian Deadlift', target_sets: 3, target_reps_min: 10, target_reps_max: 12, target_rir: 1, rest_seconds: 90, notes: '减脂期降负重，强调离心' },
        { exercise_name_en: 'Dumbbell Pullover', target_sets: 3, target_reps_min: 12, target_reps_max: 15, target_rir: 0, rest_seconds: 60 },
        { exercise_name_en: 'Dumbbell Curl', target_sets: 3, target_reps_min: 10, target_reps_max: 12, target_rir: 0.5, rest_seconds: 60 },
        { exercise_name_en: 'Dumbbell Hammer Curl', target_sets: 3, target_reps_min: 10, target_reps_max: 12, target_rir: 0.5, rest_seconds: 60 },
      ],
    },
    {
      name: 'D3 · 胸 + 三头',
      day_of_week: 3,
      estimated_minutes: 65,
      rest_seconds_default: 75,
      notes: '上胸维持优先；末段加孤立挤压。',
      exercises: [
        { exercise_name_en: 'Incline Dumbbell Bench Press', target_sets: 4, target_reps_min: 8, target_reps_max: 12, target_rir: 0.5, rest_seconds: 90 },
        { exercise_name_en: 'Flat Dumbbell Bench Press', target_sets: 3, target_reps_min: 10, target_reps_max: 12, target_rir: 0.5, rest_seconds: 75 },
        { exercise_name_en: 'Incline Dumbbell Fly', target_sets: 3, target_reps_min: 12, target_reps_max: 15, target_rir: 0, rest_seconds: 60 },
        { exercise_name_en: 'Flat Dumbbell Fly', target_sets: 3, target_reps_min: 12, target_reps_max: 15, target_rir: 0, rest_seconds: 60 },
        { exercise_name_en: 'Dumbbell Squeeze Press', target_sets: 3, target_reps_min: 10, target_reps_max: 15, target_rir: 0, rest_seconds: 60, notes: '末段力竭' },
        { exercise_name_en: 'Dumbbell Overhead Tricep Extension', target_sets: 3, target_reps_min: 10, target_reps_max: 12, target_rir: 0.5, rest_seconds: 60 },
        { exercise_name_en: 'Dumbbell Skull Crusher', target_sets: 3, target_reps_min: 10, target_reps_max: 12, target_rir: 0.5, rest_seconds: 60 },
      ],
    },
    {
      name: 'D4 · 腿 + 小腿',
      day_of_week: 4,
      estimated_minutes: 75,
      rest_seconds_default: 90,
      notes: '负重适度下调，单侧动作维持平衡与稳定。',
      exercises: [
        { exercise_name_en: 'Goblet Squat', target_sets: 4, target_reps_min: 10, target_reps_max: 12, target_rir: 0.5, rest_seconds: 90 },
        { exercise_name_en: 'Bulgarian Split Squat', target_sets: 4, target_reps_min: 10, target_reps_max: 12, target_rir: 0.5, rest_seconds: 90 },
        { exercise_name_en: 'Dumbbell Walking Lunge', target_sets: 3, target_reps_min: 12, target_reps_max: 15, target_rir: 0.5, rest_seconds: 90 },
        { exercise_name_en: 'Single-Leg Dumbbell RDL', target_sets: 3, target_reps_min: 10, target_reps_max: 12, target_rir: 0.5, rest_seconds: 75 },
        { exercise_name_en: 'Dumbbell Hip Thrust', target_sets: 3, target_reps_min: 12, target_reps_max: 15, target_rir: 0, rest_seconds: 75 },
        { exercise_name_en: 'Standing Dumbbell Calf Raise', target_sets: 4, target_reps_min: 12, target_reps_max: 15, target_rir: 0, rest_seconds: 60, tempo: '3-2-1-0' },
        { exercise_name_en: 'Single-Leg Dumbbell Calf Raise', target_sets: 3, target_reps_min: 12, target_reps_max: 15, target_rir: 0, rest_seconds: 60 },
      ],
    },
  ],
};

export const OFFICIAL_TRAINING_PLANS: OfficialTrainingPlan[] = [OFFSEASON, PREP];

export function findOfficialPlanBySlug(slug: string): OfficialTrainingPlan | null {
  return OFFICIAL_TRAINING_PLANS.find((p) => p.slug === slug) ?? null;
}
