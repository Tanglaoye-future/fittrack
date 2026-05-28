import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CheckInsService } from './check-ins.service';
import { PrismaService } from '@/database/prisma.service';

const CHECK_IN = {
  id: 'ci-1',
  user_id: 'user-1',
  week_index: 10,
  check_in_date: new Date('2026-01-13'),
  status: 'SUBMITTED',
  deleted_at: null,
  client_op_id: 'op-ci-1',
  photos: [],
};

const buildPrismaMock = () => ({
  weeklyCheckIn: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  workoutSession: { findMany: jest.fn() },
  mealLog: { findMany: jest.fn() },
  bodyRecord: { findFirst: jest.fn() },
});

describe('CheckInsService', () => {
  let service: CheckInsService;
  let prismaMock: ReturnType<typeof buildPrismaMock>;

  beforeEach(async () => {
    prismaMock = buildPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [CheckInsService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = module.get<CheckInsService>(CheckInsService);
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('returns check-ins for user', async () => {
      prismaMock.weeklyCheckIn.findMany.mockResolvedValue([CHECK_IN]);
      const result = await service.list('user-1');
      expect(result).toEqual([CHECK_IN]);
    });
  });

  describe('getDraft', () => {
    it('aggregates recent sessions/meals/body', async () => {
      prismaMock.workoutSession.findMany.mockResolvedValue([{ session_date: new Date(), overall_rpe: 7 }]);
      prismaMock.mealLog.findMany.mockResolvedValue([{ total_kcal: 2500 }, { total_kcal: 2300 }]);
      prismaMock.bodyRecord.findFirst.mockResolvedValue({ morning_weight_kg: 80, measurement_date: new Date() });

      const result = await service.getDraft('user-1');
      expect(result.trainings_completed).toBe(1);
      expect(result.avg_kcal_actual).toBe(2400);
      expect(result.avg_morning_weight).toBe(80);
      expect(result.prefilled).toBe(true);
    });

    it('handles no meal logs', async () => {
      prismaMock.workoutSession.findMany.mockResolvedValue([]);
      prismaMock.mealLog.findMany.mockResolvedValue([]);
      prismaMock.bodyRecord.findFirst.mockResolvedValue(null);
      const result = await service.getDraft('user-1');
      expect(result.avg_kcal_actual).toBeNull();
      expect(result.avg_morning_weight).toBeNull();
    });
  });

  describe('create', () => {
    const dto = {
      week_index: 10,
      check_in_date: '2026-01-13',
      client_op_id: 'op-ci-1',
      client_ts: new Date().toISOString(),
    };

    it('returns existing if idempotent', async () => {
      prismaMock.weeklyCheckIn.findUnique.mockResolvedValue(CHECK_IN);
      const result = await service.create('user-1', dto as any);
      expect(result).toBe(CHECK_IN);
      expect(prismaMock.weeklyCheckIn.create).not.toHaveBeenCalled();
    });

    it('creates new check-in with SUBMITTED status', async () => {
      prismaMock.weeklyCheckIn.findUnique.mockResolvedValue(null);
      prismaMock.weeklyCheckIn.create.mockResolvedValue(CHECK_IN);
      const result = await service.create('user-1', dto as any);
      expect(result).toBe(CHECK_IN);
      expect(prismaMock.weeklyCheckIn.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'SUBMITTED' }) }),
      );
    });
  });

  describe('findOne', () => {
    it('returns check-in if found', async () => {
      prismaMock.weeklyCheckIn.findFirst.mockResolvedValue(CHECK_IN);
      const result = await service.findOne('ci-1', 'user-1');
      expect(result).toBe(CHECK_IN);
    });

    it('throws NotFoundException if not found', async () => {
      prismaMock.weeklyCheckIn.findFirst.mockResolvedValue(null);
      await expect(service.findOne('bad-id', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('coachReview', () => {
    it('updates check-in to COACH_REVIEWED', async () => {
      prismaMock.weeklyCheckIn.findFirst.mockResolvedValue(CHECK_IN);
      prismaMock.weeklyCheckIn.update.mockResolvedValue({ ...CHECK_IN, status: 'COACH_REVIEWED' });
      const result = await service.coachReview('ci-1', 'coach-1', { coach_notes: '做得好' });
      expect(prismaMock.weeklyCheckIn.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'COACH_REVIEWED' }) }),
      );
    });

    it('throws NotFoundException if check-in not found', async () => {
      prismaMock.weeklyCheckIn.findFirst.mockResolvedValue(null);
      await expect(service.coachReview('bad-id', 'coach-1', {})).rejects.toThrow(NotFoundException);
    });
  });
});
