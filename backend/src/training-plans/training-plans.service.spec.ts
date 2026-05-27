import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TrainingPlansService } from './training-plans.service';
import { PrismaService } from '@/database/prisma.service';

const PLAN = {
  id: 'plan-1',
  user_id: 'user-1',
  name: 'Prep W1-8 推拉腿',
  description: null,
  weeks: 8,
  is_active: false,
  start_date: null,
  end_date: null,
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null,
  templates: [],
};

const PLAN_WITH_TEMPLATES = {
  ...PLAN,
  templates: [
    {
      id: 'tmpl-1',
      plan_id: 'plan-1',
      name: 'Day A - 胸+三头',
      day_of_week: 1,
      estimated_minutes: 60,
      rest_seconds_default: 90,
      notes: null,
      exercises: [
        {
          id: 'te-1',
          template_id: 'tmpl-1',
          exercise_id: 'ex-1',
          order_index: 0,
          target_sets: 4,
          target_reps_min: 6,
          target_reps_max: 10,
          target_rir: 1,
          target_rpe: null,
          rest_seconds: null,
          tempo: null,
          notes: null,
          exercise: { id: 'ex-1', name_zh: '杠铃卧推', name_en: 'Barbell Bench Press' },
        },
      ],
    },
  ],
};

const prismaMock = {
  trainingPlan: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  trainingTemplate: {
    count: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  templateExercise: {
    count: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
    delete: jest.fn(),
  },
};

describe('TrainingPlansService', () => {
  let service: TrainingPlansService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrainingPlansService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<TrainingPlansService>(TrainingPlansService);
    jest.clearAllMocks();
  });

  // ── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns user plans ordered by active first', async () => {
      prismaMock.trainingPlan.findMany.mockResolvedValue([PLAN]);
      const result = await service.findAll('user-1');
      expect(result).toHaveLength(1);
      expect(prismaMock.trainingPlan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { user_id: 'user-1', deleted_at: null },
          orderBy: [{ is_active: 'desc' }, { created_at: 'desc' }],
        }),
      );
    });
  });

  // ── findActive ────────────────────────────────────────────────────────────

  describe('findActive', () => {
    it('returns active plan', async () => {
      prismaMock.trainingPlan.findFirst.mockResolvedValue({ ...PLAN, is_active: true });
      const result = await service.findActive('user-1');
      expect(result.is_active).toBe(true);
    });

    it('throws NotFoundException when no active plan', async () => {
      prismaMock.trainingPlan.findFirst.mockResolvedValue(null);
      await expect(service.findActive('user-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ── findOne ──────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns plan with nested templates', async () => {
      prismaMock.trainingPlan.findFirst.mockResolvedValue(PLAN_WITH_TEMPLATES);
      const result = await service.findOne('plan-1', 'user-1');
      expect(result.templates).toHaveLength(1);
      expect(result.templates[0].exercises).toHaveLength(1);
    });

    it('throws NotFoundException for non-existent plan', async () => {
      prismaMock.trainingPlan.findFirst.mockResolvedValue(null);
      await expect(service.findOne('bad-id', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates plan with nested templates and exercises', async () => {
      prismaMock.trainingPlan.create.mockResolvedValue(PLAN_WITH_TEMPLATES);

      const dto = {
        name: 'Prep W1-8 推拉腿',
        weeks: 8,
        templates: [
          {
            name: 'Day A - 胸+三头',
            day_of_week: 1,
            exercises: [
              {
                exercise_id: 'ex-1',
                target_sets: 4,
                target_reps_min: 6,
                target_reps_max: 10,
                target_rir: 1,
              },
            ],
          },
        ],
      };

      const result = await service.create(dto, 'user-1');
      expect(result.templates).toHaveLength(1);
      expect(prismaMock.trainingPlan.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ user_id: 'user-1', name: 'Prep W1-8 推拉腿' }),
        }),
      );
    });

    it('creates plan without templates', async () => {
      prismaMock.trainingPlan.create.mockResolvedValue(PLAN);
      const result = await service.create({ name: '空计划', weeks: 4 }, 'user-1');
      expect(result).toBeDefined();
    });
  });

  // ── activate ─────────────────────────────────────────────────────────────

  describe('activate', () => {
    it('deactivates all other plans and activates target', async () => {
      prismaMock.trainingPlan.findFirst.mockResolvedValue(PLAN);
      prismaMock.trainingPlan.updateMany.mockResolvedValue({ count: 0 });
      prismaMock.trainingPlan.update.mockResolvedValue({ ...PLAN, is_active: true });

      const result = await service.activate('plan-1', 'user-1');
      expect(result.is_active).toBe(true);
      expect(prismaMock.trainingPlan.updateMany).toHaveBeenCalledWith({
        where: { user_id: 'user-1', is_active: true },
        data: { is_active: false },
      });
    });

    it('throws NotFoundException for non-existent plan', async () => {
      prismaMock.trainingPlan.findFirst.mockResolvedValue(null);
      await expect(service.activate('bad-id', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ── clone ─────────────────────────────────────────────────────────────────

  describe('clone', () => {
    it('clones plan with default name suffix', async () => {
      prismaMock.trainingPlan.findFirst.mockResolvedValue(PLAN_WITH_TEMPLATES);
      prismaMock.trainingPlan.create.mockResolvedValue({
        ...PLAN,
        id: 'plan-2',
        name: 'Prep W1-8 推拉腿（副本）',
      });

      const result = await service.clone('plan-1', {}, 'user-1');
      expect(prismaMock.trainingPlan.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'Prep W1-8 推拉腿（副本）' }),
        }),
      );
      expect(result.id).toBe('plan-2');
    });

    it('clones plan with custom name', async () => {
      prismaMock.trainingPlan.findFirst.mockResolvedValue(PLAN_WITH_TEMPLATES);
      prismaMock.trainingPlan.create.mockResolvedValue({
        ...PLAN,
        id: 'plan-3',
        name: '我的自定义计划',
      });

      await service.clone('plan-1', { name: '我的自定义计划' }, 'user-1');
      expect(prismaMock.trainingPlan.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: '我的自定义计划' }),
        }),
      );
    });

    it('throws NotFoundException for non-existent plan', async () => {
      prismaMock.trainingPlan.findFirst.mockResolvedValue(null);
      await expect(service.clone('bad', {}, 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ── remove ────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('soft-deletes plan and deactivates it', async () => {
      prismaMock.trainingPlan.findFirst.mockResolvedValue(PLAN);
      prismaMock.trainingPlan.update.mockResolvedValue({
        ...PLAN,
        deleted_at: new Date(),
        is_active: false,
      });

      const result = await service.remove('plan-1', 'user-1');
      expect(result.deleted).toBe(true);
    });
  });

  // ── addTemplate ───────────────────────────────────────────────────────────

  describe('addTemplate', () => {
    it('adds template to plan', async () => {
      prismaMock.trainingPlan.findFirst.mockResolvedValue(PLAN);
      prismaMock.trainingTemplate.count.mockResolvedValue(1);
      prismaMock.trainingTemplate.create.mockResolvedValue(
        PLAN_WITH_TEMPLATES.templates[0],
      );

      const result = await service.addTemplate(
        'plan-1',
        { name: 'Day B - 背+二头', rest_seconds_default: 120 },
        'user-1',
      );
      expect(result.name).toBe('Day A - 胸+三头');
    });

    it('throws NotFoundException for non-existent plan', async () => {
      prismaMock.trainingPlan.findFirst.mockResolvedValue(null);
      await expect(
        service.addTemplate('bad', { name: 'X' }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
