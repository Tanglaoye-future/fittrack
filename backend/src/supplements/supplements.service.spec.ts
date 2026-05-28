import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SupplementsService } from './supplements.service';
import { PrismaService } from '@/database/prisma.service';

const SCHEDULE = {
  id: 'sched-1',
  user_id: 'user-1',
  name: '早晨补剂',
  time_slot: 'MORNING',
  deleted_at: null,
  created_at: new Date(),
  items: [
    { id: 'item-1', name: '维生素D', dose: '2000', unit: 'IU', is_controlled: false },
  ],
};

const LOG = {
  id: 'log-1',
  user_id: 'user-1',
  client_op_id: 'op-log-1',
  name: '维生素D',
  dose: '2000',
  unit: 'IU',
  taken_at: new Date(),
  log_date: new Date(),
  is_controlled: false,
};

const buildPrismaMock = () => ({
  supplementSchedule: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  supplementLog: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
  },
});

describe('SupplementsService', () => {
  let service: SupplementsService;
  let prismaMock: ReturnType<typeof buildPrismaMock>;

  beforeEach(async () => {
    prismaMock = buildPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupplementsService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = module.get<SupplementsService>(SupplementsService);
    jest.clearAllMocks();
  });

  describe('listSchedules', () => {
    it('returns all schedules for user', async () => {
      prismaMock.supplementSchedule.findMany.mockResolvedValue([SCHEDULE]);
      const result = await service.listSchedules('user-1');
      expect(result).toEqual([SCHEDULE]);
      expect(prismaMock.supplementSchedule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { user_id: 'user-1', deleted_at: null } }),
      );
    });
  });

  describe('createSchedule', () => {
    const dto = {
      name: '早晨补剂',
      time_slot: 'MORNING',
      client_op_id: 'op-1',
      client_ts: '2026-01-01T00:00:00Z',
      items: [{ name: '维生素D', dose: '2000', unit: 'IU' }],
    };

    it('returns existing if client_op_id found', async () => {
      prismaMock.supplementSchedule.findUnique.mockResolvedValue(SCHEDULE);
      const result = await service.createSchedule('user-1', dto as any);
      expect(result).toBe(SCHEDULE);
      expect(prismaMock.supplementSchedule.create).not.toHaveBeenCalled();
    });

    it('creates new schedule', async () => {
      prismaMock.supplementSchedule.findUnique.mockResolvedValue(null);
      prismaMock.supplementSchedule.create.mockResolvedValue(SCHEDULE);
      const result = await service.createSchedule('user-1', dto as any);
      expect(result).toBe(SCHEDULE);
      expect(prismaMock.supplementSchedule.create).toHaveBeenCalled();
    });
  });

  describe('deleteSchedule', () => {
    it('soft-deletes schedule', async () => {
      prismaMock.supplementSchedule.findFirst.mockResolvedValue(SCHEDULE);
      prismaMock.supplementSchedule.update.mockResolvedValue({ ...SCHEDULE, deleted_at: new Date() });
      const result = await service.deleteSchedule('sched-1', 'user-1');
      expect(result).toEqual({ deleted: true });
    });

    it('throws NotFoundException if not found', async () => {
      prismaMock.supplementSchedule.findFirst.mockResolvedValue(null);
      await expect(service.deleteSchedule('bad-id', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('logAll', () => {
    it('fans out one log per item', async () => {
      prismaMock.supplementSchedule.findFirst.mockResolvedValue(SCHEDULE);
      prismaMock.supplementLog.findUnique.mockResolvedValue(null);
      prismaMock.supplementLog.create.mockResolvedValue(LOG);

      const result = await service.logAll('sched-1', 'user-1', new Date().toISOString(), 'base-op');
      expect(result.logged).toBe(1);
      expect(prismaMock.supplementLog.create).toHaveBeenCalledTimes(1);
    });

    it('returns existing log if already present', async () => {
      prismaMock.supplementSchedule.findFirst.mockResolvedValue(SCHEDULE);
      prismaMock.supplementLog.findUnique.mockResolvedValue(LOG);

      const result = await service.logAll('sched-1', 'user-1', new Date().toISOString(), 'base-op');
      expect(result.logged).toBe(1);
      expect(prismaMock.supplementLog.create).not.toHaveBeenCalled();
    });
  });

  describe('createLog', () => {
    const dto = {
      name: '维生素D',
      dose: '2000',
      unit: 'IU',
      taken_at: new Date().toISOString(),
      is_controlled: false,
      client_op_id: 'op-log-1',
      client_ts: new Date().toISOString(),
    };

    it('returns existing log if idempotent', async () => {
      prismaMock.supplementLog.findUnique.mockResolvedValue(LOG);
      const result = await service.createLog('user-1', dto as any);
      expect(result).toBe(LOG);
      expect(prismaMock.supplementLog.create).not.toHaveBeenCalled();
    });

    it('creates new log', async () => {
      prismaMock.supplementLog.findUnique.mockResolvedValue(null);
      prismaMock.supplementLog.create.mockResolvedValue(LOG);
      const result = await service.createLog('user-1', dto as any);
      expect(result).toBe(LOG);
    });
  });

  describe('listLogs', () => {
    it('filters by date when provided', async () => {
      prismaMock.supplementLog.findMany.mockResolvedValue([LOG]);
      await service.listLogs('user-1', { date: '2026-01-01' });
      expect(prismaMock.supplementLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ log_date: expect.any(Date) }) }),
      );
    });
  });
});
