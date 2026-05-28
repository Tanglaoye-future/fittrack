import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CompetitionsService } from './competitions.service';
import { PrismaService } from '@/database/prisma.service';

const GOAL = {
  id: 'goal-1',
  user_id: 'user-1',
  name: '2026省赛',
  stage_date: new Date('2026-09-01'),
  is_active: true,
  deleted_at: null,
  client_op_id: 'op-goal-1',
  prep_cycles: [],
};

const CYCLE = {
  id: 'cycle-1',
  user_id: 'user-1',
  goal_id: 'goal-1',
  start_date: new Date('2026-05-01'),
  end_date: new Date('2026-09-01'),
  weeks_total: 18,
  deleted_at: null,
  client_op_id: 'op-cycle-1',
  phases: [],
};

const PHASE = {
  id: 'phase-1',
  prep_cycle_id: 'cycle-1',
  phase: 'PREP',
  week_start: 1,
  week_end: 17,
  kcal: 2500,
  protein_g: 240,
  carbs_g: 200,
  fat_g: 60,
  client_op_id: 'op-phase-1',
};

const buildPrismaMock = () => ({
  competitionGoal: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  prepCycle: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  phaseConfig: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
});

describe('CompetitionsService', () => {
  let service: CompetitionsService;
  let prismaMock: ReturnType<typeof buildPrismaMock>;

  beforeEach(async () => {
    prismaMock = buildPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [CompetitionsService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = module.get<CompetitionsService>(CompetitionsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const dto = {
      name: '2026省赛',
      stage_date: '2026-09-01',
      client_op_id: 'op-goal-1',
      client_ts: new Date().toISOString(),
    };

    it('returns existing if idempotent', async () => {
      prismaMock.competitionGoal.findUnique.mockResolvedValue(GOAL);
      const result = await service.create('user-1', dto as any);
      expect(result).toBe(GOAL);
      expect(prismaMock.competitionGoal.create).not.toHaveBeenCalled();
    });

    it('creates new goal', async () => {
      prismaMock.competitionGoal.findUnique.mockResolvedValue(null);
      prismaMock.competitionGoal.create.mockResolvedValue(GOAL);
      const result = await service.create('user-1', dto as any);
      expect(result).toBe(GOAL);
    });
  });

  describe('findOne', () => {
    it('returns goal if found', async () => {
      prismaMock.competitionGoal.findFirst.mockResolvedValue(GOAL);
      const result = await service.findOne('goal-1', 'user-1');
      expect(result).toBe(GOAL);
    });

    it('throws NotFoundException if not found', async () => {
      prismaMock.competitionGoal.findFirst.mockResolvedValue(null);
      await expect(service.findOne('bad-id', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getActiveCountdown', () => {
    it('returns null if no active goal', async () => {
      prismaMock.competitionGoal.findFirst.mockResolvedValue(null);
      const result = await service.getActiveCountdown('user-1');
      expect(result).toBeNull();
    });

    it('returns countdown for active goal', async () => {
      const futureGoal = { ...GOAL, prep_cycles: [] };
      prismaMock.competitionGoal.findFirst.mockResolvedValue(futureGoal);
      const result = await service.getActiveCountdown('user-1');
      expect(result).toHaveProperty('days_remaining');
      expect(result).toHaveProperty('competition');
    });
  });

  describe('createPrepCycle', () => {
    const dto = {
      start_date: '2026-05-01',
      start_weight_kg: 85,
      client_op_id: 'op-cycle-1',
      client_ts: new Date().toISOString(),
    };

    it('creates prep cycle and computes weeks_total', async () => {
      prismaMock.competitionGoal.findFirst.mockResolvedValue(GOAL);
      prismaMock.prepCycle.findUnique.mockResolvedValue(null);
      prismaMock.prepCycle.create.mockResolvedValue(CYCLE);
      const result = await service.createPrepCycle('goal-1', 'user-1', dto as any);
      expect(result).toBe(CYCLE);
      expect(prismaMock.prepCycle.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ weeks_total: expect.any(Number) }) }),
      );
    });
  });

  describe('autoGeneratePhases', () => {
    it('generates PREP+PEAK phases for short cycles (<16 weeks)', async () => {
      prismaMock.prepCycle.findFirst.mockResolvedValue({ ...CYCLE, weeks_total: 12 });
      prismaMock.phaseConfig.deleteMany.mockResolvedValue({});
      prismaMock.phaseConfig.createMany.mockResolvedValue({});
      prismaMock.phaseConfig.findMany.mockResolvedValue([PHASE]);
      await service.autoGeneratePhases('cycle-1', 'user-1');
      expect(prismaMock.phaseConfig.createMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.arrayContaining([expect.objectContaining({ phase: 'PREP' })]) }),
      );
    });

    it('generates OFFSEASON+PREP+PEAK for long cycles (>=16 weeks)', async () => {
      prismaMock.prepCycle.findFirst.mockResolvedValue({ ...CYCLE, weeks_total: 18 });
      prismaMock.phaseConfig.deleteMany.mockResolvedValue({});
      prismaMock.phaseConfig.createMany.mockResolvedValue({});
      prismaMock.phaseConfig.findMany.mockResolvedValue([PHASE]);
      await service.autoGeneratePhases('cycle-1', 'user-1');
      const createData = prismaMock.phaseConfig.createMany.mock.calls[0][0].data;
      const phases = createData.map((p: any) => p.phase);
      expect(phases).toContain('OFFSEASON');
      expect(phases).toContain('PREP');
      expect(phases).toContain('PEAK_WEEK');
    });
  });

  describe('getTodayTargets', () => {
    it('returns null phase if no match', async () => {
      prismaMock.prepCycle.findFirst.mockResolvedValue({
        ...CYCLE,
        phases: [{ ...PHASE, week_start: 5, week_end: 17 }],
        start_date: new Date(),
      });
      const result = await service.getTodayTargets('cycle-1', 'user-1');
      expect(result).toHaveProperty('current_week');
    });
  });
});
