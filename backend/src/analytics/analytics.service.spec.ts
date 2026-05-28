import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '@/database/prisma.service';

const SET_ENTRY = { session_date: new Date('2026-01-10'), weight_kg: 100, reps: 5 };
const BODY_RECORD = { measurement_date: new Date('2026-01-10'), morning_weight_kg: 80, body_fat_percentage: 15 };
const MEAL_LOG = { meal_date: new Date('2026-01-10'), total_kcal: 2500, total_protein: 200, total_carbs: 250, total_fat: 70 };
const DAILY_SUMMARY = { summary_date: new Date('2026-01-10'), total_kcal: 2500 };

const buildPrismaMock = () => ({
  personalRecord: { findMany: jest.fn() },
  setEntry: { findMany: jest.fn() },
  bodyRecord: { findMany: jest.fn() },
  mealLog: { findMany: jest.fn() },
  dailySummary: { findMany: jest.fn() },
  prepCycle: { findFirst: jest.fn() },
});

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prismaMock: ReturnType<typeof buildPrismaMock>;

  beforeEach(async () => {
    prismaMock = buildPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalyticsService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = module.get<AnalyticsService>(AnalyticsService);
    jest.clearAllMocks();
  });

  describe('getStrengthTrends', () => {
    it('returns PRs and session history', async () => {
      prismaMock.personalRecord.findMany.mockResolvedValue([]);
      prismaMock.setEntry.findMany.mockResolvedValue([SET_ENTRY]);
      const result = await service.getStrengthTrends('user-1', 'ex-1', { period: '30d' });
      expect(result).toHaveProperty('prs');
      expect(result).toHaveProperty('sessions');
      expect(result.sessions).toHaveLength(1);
    });

    it('uses date_from/date_to when provided', async () => {
      prismaMock.personalRecord.findMany.mockResolvedValue([]);
      prismaMock.setEntry.findMany.mockResolvedValue([]);
      await service.getStrengthTrends('user-1', 'ex-1', {
        date_from: '2026-01-01',
        date_to: '2026-01-31',
      });
      expect(prismaMock.setEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            session_date: expect.objectContaining({
              gte: new Date('2026-01-01'),
              lte: new Date('2026-01-31'),
            }),
          }),
        }),
      );
    });
  });

  describe('getBodyWeightTrends', () => {
    it('returns body records in date range', async () => {
      prismaMock.bodyRecord.findMany.mockResolvedValue([BODY_RECORD]);
      const result = await service.getBodyWeightTrends('user-1', { period: '30d' });
      expect(result).toEqual([BODY_RECORD]);
    });
  });

  describe('getMacroTrends', () => {
    it('aggregates meal logs by date', async () => {
      prismaMock.mealLog.findMany.mockResolvedValue([MEAL_LOG, { ...MEAL_LOG, total_kcal: 500, total_protein: 50, total_carbs: 50, total_fat: 20 }]);
      const result = await service.getMacroTrends('user-1', {});
      expect(result).toHaveLength(1);
      expect(result[0].kcal).toBe(3000);
      expect(result[0].protein).toBe(250);
    });

    it('handles multiple dates', async () => {
      const day2 = { ...MEAL_LOG, meal_date: new Date('2026-01-11') };
      prismaMock.mealLog.findMany.mockResolvedValue([MEAL_LOG, day2]);
      const result = await service.getMacroTrends('user-1', {});
      expect(result).toHaveLength(2);
    });
  });

  describe('getDailySummaries', () => {
    it('returns summaries in range', async () => {
      prismaMock.dailySummary.findMany.mockResolvedValue([DAILY_SUMMARY]);
      const result = await service.getDailySummaries('user-1', { period: '30d' });
      expect(result).toEqual([DAILY_SUMMARY]);
    });
  });

  describe('getPrepProgress', () => {
    it('returns null if no cycle found', async () => {
      prismaMock.prepCycle.findFirst.mockResolvedValue(null);
      const result = await service.getPrepProgress('user-1', 'cycle-bad');
      expect(result).toBeNull();
    });

    it('returns progress with pct and body records', async () => {
      const cycle = {
        id: 'cycle-1',
        start_date: new Date(Date.now() - 30 * 86400000),
        end_date: new Date(Date.now() + 60 * 86400000),
        phases: [],
      };
      prismaMock.prepCycle.findFirst.mockResolvedValue(cycle);
      prismaMock.bodyRecord.findMany.mockResolvedValue([BODY_RECORD]);
      const result = await service.getPrepProgress('user-1', 'cycle-1');
      expect(result).toHaveProperty('progress_pct');
      expect(result).toHaveProperty('days_elapsed');
      expect(result).toHaveProperty('days_remaining');
      expect(result!.body_records).toHaveLength(1);
    });
  });
});
