import { PrismaClient } from '@prisma/client';

type OfficialExercise = {
  name_zh: string;
  name_en: string;
  description: string;
  primary_muscle:
    | 'CHEST'
    | 'BACK_LATS'
    | 'BACK_TRAPS'
    | 'SHOULDERS_FRONT'
    | 'SHOULDERS_SIDE'
    | 'SHOULDERS_REAR'
    | 'BICEPS'
    | 'TRICEPS'
    | 'FOREARMS'
    | 'CORE_ABS'
    | 'CORE_OBLIQUES'
    | 'GLUTES'
    | 'QUADS'
    | 'HAMSTRINGS'
    | 'CALVES'
    | 'NECK';
  secondary_muscles: OfficialExercise['primary_muscle'][];
  equipment: 'DUMBBELL' | 'BODYWEIGHT';
  movement_pattern: 'PUSH' | 'PULL' | 'SQUAT' | 'HINGE' | 'CARRY' | 'ROTATION' | 'ISOLATION';
};

// 哑铃区 4 分化 · 高级选手专用动作库
// D1 肩+腹 / D2 背 / D3 胸 / D4 腿，全部 DUMBBELL 或 BODYWEIGHT
// name_en 作为自然键（schema 已有 @@unique([name_en])）
export const OFFICIAL_EXERCISES: OfficialExercise[] = [
  // ── D1 肩 ────────────────────────────────────────────────
  {
    name_zh: '哑铃坐姿肩上推',
    name_en: 'Seated Dumbbell Shoulder Press',
    description: '坐姿背靠 70-90°，两哑铃自耳侧推至顶端肘微弯，三角肌前束主导。',
    primary_muscle: 'SHOULDERS_FRONT',
    secondary_muscles: ['SHOULDERS_SIDE', 'TRICEPS'],
    equipment: 'DUMBBELL',
    movement_pattern: 'PUSH',
  },
  {
    name_zh: '哑铃阿诺德推举',
    name_en: 'Arnold Press',
    description: '起始掌心朝己，推举过程旋转至掌心朝前，三角肌前束 + 侧束兼顾。',
    primary_muscle: 'SHOULDERS_FRONT',
    secondary_muscles: ['SHOULDERS_SIDE'],
    equipment: 'DUMBBELL',
    movement_pattern: 'PUSH',
  },
  {
    name_zh: '哑铃站姿侧平举',
    name_en: 'Dumbbell Lateral Raise',
    description: '小臂略前倾、肘微弯，肩外展至与地面平行，停顿 1 秒。',
    primary_muscle: 'SHOULDERS_SIDE',
    secondary_muscles: [],
    equipment: 'DUMBBELL',
    movement_pattern: 'ISOLATION',
  },
  {
    name_zh: '单臂倚立侧平举',
    name_en: 'Leaning Single-Arm Lateral Raise',
    description: '抓器械单手倚身，工作侧手哑铃从体侧外展至肩高，扩大行程顶端张力。',
    primary_muscle: 'SHOULDERS_SIDE',
    secondary_muscles: [],
    equipment: 'DUMBBELL',
    movement_pattern: 'ISOLATION',
  },
  {
    name_zh: '俯身哑铃反向飞鸟',
    name_en: 'Bent-Over Dumbbell Rear Delt Fly',
    description: '俯身躯干平行地面，肩外旋打开至与地面平行，后束孤立。',
    primary_muscle: 'SHOULDERS_REAR',
    secondary_muscles: ['BACK_TRAPS'],
    equipment: 'DUMBBELL',
    movement_pattern: 'ISOLATION',
  },
  {
    name_zh: '哑铃面拉（俯卧上斜板）',
    name_en: 'Incline Prone Dumbbell Face Pull',
    description: '俯卧上斜板，哑铃从下方向脸侧上方拉至肘高于肩，后束 + 中下斜方。',
    primary_muscle: 'SHOULDERS_REAR',
    secondary_muscles: ['BACK_TRAPS'],
    equipment: 'DUMBBELL',
    movement_pattern: 'PULL',
  },
  {
    name_zh: '哑铃前平举',
    name_en: 'Dumbbell Front Raise',
    description: '正手或锤式握，前臂前抬至肩高，控制下放，前束孤立。',
    primary_muscle: 'SHOULDERS_FRONT',
    secondary_muscles: [],
    equipment: 'DUMBBELL',
    movement_pattern: 'ISOLATION',
  },
  {
    name_zh: '哑铃耸肩',
    name_en: 'Dumbbell Shrug',
    description: '哑铃自然垂于体侧，肩部向耳侧上提至顶峰挤压 2 秒。',
    primary_muscle: 'BACK_TRAPS',
    secondary_muscles: ['FOREARMS'],
    equipment: 'DUMBBELL',
    movement_pattern: 'ISOLATION',
  },

  // ── D1 腹 ────────────────────────────────────────────────
  {
    name_zh: '悬垂举腿',
    name_en: 'Hanging Leg Raise',
    description: '悬挂引体杠，腿直或屈膝抬至髋以上，避免摆荡。',
    primary_muscle: 'CORE_ABS',
    secondary_muscles: ['CORE_OBLIQUES'],
    equipment: 'BODYWEIGHT',
    movement_pattern: 'ISOLATION',
  },
  {
    name_zh: '哑铃负重卷腹',
    name_en: 'Weighted Dumbbell Crunch',
    description: '仰卧屈膝，哑铃抱胸前或置头顶，肩胛抬离地面卷起。',
    primary_muscle: 'CORE_ABS',
    secondary_muscles: [],
    equipment: 'DUMBBELL',
    movement_pattern: 'ISOLATION',
  },
  {
    name_zh: '哑铃俄罗斯转体',
    name_en: 'Dumbbell Russian Twist',
    description: '坐姿屈膝抬腿 V 形，单哑铃在体前左右触地，腹斜肌主导。',
    primary_muscle: 'CORE_OBLIQUES',
    secondary_muscles: ['CORE_ABS'],
    equipment: 'DUMBBELL',
    movement_pattern: 'ROTATION',
  },
  {
    name_zh: '平板支撑',
    name_en: 'Plank',
    description: '前臂支撑，从头到脚跟成一条直线，臀部下沉到位。',
    primary_muscle: 'CORE_ABS',
    secondary_muscles: [],
    equipment: 'BODYWEIGHT',
    movement_pattern: 'ISOLATION',
  },

  // ── D2 背 ────────────────────────────────────────────────
  {
    name_zh: '单臂哑铃划船',
    name_en: 'Single-Arm Dumbbell Row',
    description: '单膝单手撑长凳，哑铃自然下垂，肘部沿体侧上拉至髋。',
    primary_muscle: 'BACK_LATS',
    secondary_muscles: ['BICEPS', 'BACK_TRAPS'],
    equipment: 'DUMBBELL',
    movement_pattern: 'PULL',
  },
  {
    name_zh: '双臂哑铃俯身划船',
    name_en: 'Bent-Over Two-Arm Dumbbell Row',
    description: '髋屈躯干约 30°，两哑铃同步沿体侧上拉，挤压肩胛。',
    primary_muscle: 'BACK_LATS',
    secondary_muscles: ['BICEPS', 'BACK_TRAPS'],
    equipment: 'DUMBBELL',
    movement_pattern: 'PULL',
  },
  {
    name_zh: '上斜胸支撑哑铃划船',
    name_en: 'Chest-Supported Incline Dumbbell Row',
    description: '俯卧 30° 上斜板，双手哑铃沿体侧上拉，去除腰部代偿。',
    primary_muscle: 'BACK_LATS',
    secondary_muscles: ['BACK_TRAPS', 'BICEPS'],
    equipment: 'DUMBBELL',
    movement_pattern: 'PULL',
  },
  {
    name_zh: '哑铃罗马尼亚硬拉',
    name_en: 'Dumbbell Romanian Deadlift',
    description: '髋绞链，膝微屈，哑铃沿大腿前下放至胫骨中段，竖脊肌持续紧张。',
    primary_muscle: 'HAMSTRINGS',
    secondary_muscles: ['GLUTES', 'BACK_LATS'],
    equipment: 'DUMBBELL',
    movement_pattern: 'HINGE',
  },
  {
    name_zh: '哑铃过头屈臂上拉',
    name_en: 'Dumbbell Pullover',
    description: '横躺凳，单哑铃从胸前沿弧线下放过头，背阔肌拉伸。',
    primary_muscle: 'BACK_LATS',
    secondary_muscles: ['CHEST', 'TRICEPS'],
    equipment: 'DUMBBELL',
    movement_pattern: 'PULL',
  },
  {
    name_zh: '引体向上',
    name_en: 'Pull-Up',
    description: '正手宽于肩握杠，胸部触杠为优。',
    primary_muscle: 'BACK_LATS',
    secondary_muscles: ['BICEPS', 'BACK_TRAPS'],
    equipment: 'BODYWEIGHT',
    movement_pattern: 'PULL',
  },
  {
    name_zh: '哑铃反握弯举',
    name_en: 'Dumbbell Curl',
    description: '站姿掌心朝前，肘贴体侧屈臂上举，顶端旋后挤压。',
    primary_muscle: 'BICEPS',
    secondary_muscles: ['FOREARMS'],
    equipment: 'DUMBBELL',
    movement_pattern: 'ISOLATION',
  },
  {
    name_zh: '哑铃锤式弯举',
    name_en: 'Dumbbell Hammer Curl',
    description: '中立握屈臂上举，肱肌 + 肱桡肌 + 二头长头。',
    primary_muscle: 'BICEPS',
    secondary_muscles: ['FOREARMS'],
    equipment: 'DUMBBELL',
    movement_pattern: 'ISOLATION',
  },

  // ── D3 胸 ────────────────────────────────────────────────
  {
    name_zh: '哑铃平板卧推',
    name_en: 'Flat Dumbbell Bench Press',
    description: '平凳，哑铃下放至胸缘略下方，肘约 60° 内收。',
    primary_muscle: 'CHEST',
    secondary_muscles: ['SHOULDERS_FRONT', 'TRICEPS'],
    equipment: 'DUMBBELL',
    movement_pattern: 'PUSH',
  },
  {
    name_zh: '哑铃上斜卧推',
    name_en: 'Incline Dumbbell Bench Press',
    description: '上斜 30°，针对上胸纤维，避免角度过陡造成前束代偿。',
    primary_muscle: 'CHEST',
    secondary_muscles: ['SHOULDERS_FRONT', 'TRICEPS'],
    equipment: 'DUMBBELL',
    movement_pattern: 'PUSH',
  },
  {
    name_zh: '哑铃下斜卧推',
    name_en: 'Decline Dumbbell Bench Press',
    description: '下斜 15°，强调下胸下沿，肩关节友好。',
    primary_muscle: 'CHEST',
    secondary_muscles: ['TRICEPS'],
    equipment: 'DUMBBELL',
    movement_pattern: 'PUSH',
  },
  {
    name_zh: '哑铃平板飞鸟',
    name_en: 'Flat Dumbbell Fly',
    description: '弧线运动，肘部固定微弯，拉伸至胸大肌完全打开。',
    primary_muscle: 'CHEST',
    secondary_muscles: ['SHOULDERS_FRONT'],
    equipment: 'DUMBBELL',
    movement_pattern: 'ISOLATION',
  },
  {
    name_zh: '哑铃上斜飞鸟',
    name_en: 'Incline Dumbbell Fly',
    description: '上斜 30° 飞鸟，强调上胸内沿。',
    primary_muscle: 'CHEST',
    secondary_muscles: ['SHOULDERS_FRONT'],
    equipment: 'DUMBBELL',
    movement_pattern: 'ISOLATION',
  },
  {
    name_zh: '哑铃挤压卧推',
    name_en: 'Dumbbell Squeeze Press',
    description: '两哑铃在胸前对挤推举，全程胸内沿持续挤压。',
    primary_muscle: 'CHEST',
    secondary_muscles: ['TRICEPS', 'SHOULDERS_FRONT'],
    equipment: 'DUMBBELL',
    movement_pattern: 'PUSH',
  },
  {
    name_zh: '哑铃过头臂屈伸',
    name_en: 'Dumbbell Overhead Tricep Extension',
    description: '坐姿双手持单哑铃过头，下放至枕骨后再上推，三头长头强拉伸。',
    primary_muscle: 'TRICEPS',
    secondary_muscles: [],
    equipment: 'DUMBBELL',
    movement_pattern: 'ISOLATION',
  },
  {
    name_zh: '仰卧哑铃臂屈伸',
    name_en: 'Dumbbell Skull Crusher',
    description: '仰卧平凳，哑铃自肩前下放至额头侧上方，肘部位置固定。',
    primary_muscle: 'TRICEPS',
    secondary_muscles: [],
    equipment: 'DUMBBELL',
    movement_pattern: 'ISOLATION',
  },

  // ── D4 腿 ────────────────────────────────────────────────
  {
    name_zh: '哑铃高脚杯深蹲',
    name_en: 'Goblet Squat',
    description: '双手抱单哑铃置胸前，髋低于膝，躯干直立，股四头 + 臀大肌主导。',
    primary_muscle: 'QUADS',
    secondary_muscles: ['GLUTES', 'CORE_ABS'],
    equipment: 'DUMBBELL',
    movement_pattern: 'SQUAT',
  },
  {
    name_zh: '哑铃保加利亚分腿蹲',
    name_en: 'Bulgarian Split Squat',
    description: '后腿置长凳上，前腿独立下蹲至大腿平行地面。',
    primary_muscle: 'QUADS',
    secondary_muscles: ['GLUTES', 'HAMSTRINGS'],
    equipment: 'DUMBBELL',
    movement_pattern: 'SQUAT',
  },
  {
    name_zh: '哑铃行走箭步蹲',
    name_en: 'Dumbbell Walking Lunge',
    description: '两手哑铃自然下垂，前迈一步下蹲至后膝近地。',
    primary_muscle: 'QUADS',
    secondary_muscles: ['GLUTES', 'HAMSTRINGS'],
    equipment: 'DUMBBELL',
    movement_pattern: 'SQUAT',
  },
  {
    name_zh: '哑铃单腿罗马尼亚硬拉',
    name_en: 'Single-Leg Dumbbell RDL',
    description: '单腿支撑，对侧腿后伸维持髋稳定，强调腘绳肌与臀中肌。',
    primary_muscle: 'HAMSTRINGS',
    secondary_muscles: ['GLUTES'],
    equipment: 'DUMBBELL',
    movement_pattern: 'HINGE',
  },
  {
    name_zh: '哑铃登台',
    name_en: 'Dumbbell Step-Up',
    description: '哑铃在体侧，单腿上台、髋发力上推，避免后腿借力。',
    primary_muscle: 'QUADS',
    secondary_muscles: ['GLUTES'],
    equipment: 'DUMBBELL',
    movement_pattern: 'SQUAT',
  },
  {
    name_zh: '哑铃臀桥',
    name_en: 'Dumbbell Hip Thrust',
    description: '上背靠凳，单哑铃置髋上，髋部下放再上推至顶端挤压臀部 1-2 秒。',
    primary_muscle: 'GLUTES',
    secondary_muscles: ['HAMSTRINGS'],
    equipment: 'DUMBBELL',
    movement_pattern: 'HINGE',
  },
  {
    name_zh: '哑铃站姿提踵',
    name_en: 'Standing Dumbbell Calf Raise',
    description: '前掌踩台阶/杠铃片，足跟低至最深处再上提至顶端。',
    primary_muscle: 'CALVES',
    secondary_muscles: [],
    equipment: 'DUMBBELL',
    movement_pattern: 'ISOLATION',
  },
  {
    name_zh: '单腿哑铃提踵',
    name_en: 'Single-Leg Dumbbell Calf Raise',
    description: '单脚站立，单手哑铃在同侧，强调离心控制。',
    primary_muscle: 'CALVES',
    secondary_muscles: [],
    equipment: 'DUMBBELL',
    movement_pattern: 'ISOLATION',
  },
  {
    name_zh: '哑铃前蹲',
    name_en: 'Dumbbell Front Squat',
    description: '两哑铃置双肩前侧（架式），躯干直立下蹲，股四头深度刺激。',
    primary_muscle: 'QUADS',
    secondary_muscles: ['GLUTES', 'CORE_ABS'],
    equipment: 'DUMBBELL',
    movement_pattern: 'SQUAT',
  },
];

export async function seedOfficialExercises(prisma: PrismaClient) {
  let created = 0;
  let updated = 0;
  let skipped = 0;
  for (const ex of OFFICIAL_EXERCISES) {
    const existing = await prisma.exercise.findFirst({
      where: { name_en: ex.name_en },
    });
    if (existing) {
      // 仅当现有条目是官方时才覆盖；用户自建的同名动作绝不动
      if (!existing.is_official) {
        skipped += 1;
        continue;
      }
      await prisma.exercise.update({
        where: { id: existing.id },
        data: {
          name_zh: ex.name_zh,
          description: ex.description,
          primary_muscle: ex.primary_muscle,
          secondary_muscles: ex.secondary_muscles,
          equipment: ex.equipment,
          movement_pattern: ex.movement_pattern,
          is_official: true,
        },
      });
      updated += 1;
    } else {
      await prisma.exercise.create({
        data: {
          name_zh: ex.name_zh,
          name_en: ex.name_en,
          description: ex.description,
          primary_muscle: ex.primary_muscle,
          secondary_muscles: ex.secondary_muscles,
          equipment: ex.equipment,
          movement_pattern: ex.movement_pattern,
          is_official: true,
        },
      });
      created += 1;
    }
  }
  return { created, updated, skipped, total: OFFICIAL_EXERCISES.length };
}
