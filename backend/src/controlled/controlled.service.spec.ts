import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ControlledService } from './controlled.service';
import { PrismaService } from '@/database/prisma.service';

const CYCLE = {
  id: 'cycle-1',
  user_id: 'user-1',
  name: 'Test Blast',
  start_date: new Date('2026-01-01'),
  deleted_at: null,
  client_op_id: 'op-cycle-1',
  protocol_items: [],
};

const DOSE = {
  id: 'dose-1',
  user_id: 'user-1',
  cycle_id: 'cycle-1',
  compound: 'Testosterone Enanthate',
  dose_mg: 250,
  client_op_id: 'op-dose-1',
};

const BLOODWORK = {
  id: 'bw-1',
  user_id: 'user-1',
  cycle_id: 'cycle-1',
  test_date: new Date('2026-02-01'),
  total_test_ng_dl: 900,
};

const buildPrismaMock = () => ({
  controlledCycle: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  controlledDoseLog: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  bloodworkResult: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
});

describe('ControlledService', () => {
  let service: ControlledService;
  let prismaMock: ReturnType<typeof buildPrismaMock>;

  beforeEach(async () => {
    prismaMock = buildPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [ControlledService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = module.get<ControlledService>(ControlledService);
    jest.clearAllMocks();
  });

  describe('listCycles', () => {
    it('returns cycles for user', async () => {
      prismaMock.controlledCycle.findMany.mockResolvedValue([CYCLE]);
      const result = await service.listCycles('user-1');
      expect(result).toEqual([CYCLE]);
    });
  });

  describe('createCycle', () => {
    const dto = {
      name: 'Test Blast',
      start_date: '2026-01-01',
      client_op_id: 'op-cycle-1',
      client_ts: new Date().toISOString(),
    };

    it('returns existing if idempotent', async () => {
      prismaMock.controlledCycle.findUnique.mockResolvedValue(CYCLE);
      const result = await service.createCycle('user-1', dto as any);
      expect(result).toBe(CYCLE);
      expect(prismaMock.controlledCycle.create).not.toHaveBeenCalled();
    });

    it('creates new cycle', async () => {
      prismaMock.controlledCycle.findUnique.mockResolvedValue(null);
      prismaMock.controlledCycle.create.mockResolvedValue(CYCLE);
      const result = await service.createCycle('user-1', dto as any);
      expect(result).toBe(CYCLE);
    });
  });

  describe('getCycle', () => {
    it('returns cycle with details', async () => {
      const fullCycle = { ...CYCLE, doses: [], bloodwork: [] };
      prismaMock.controlledCycle.findFirst.mockResolvedValue(fullCycle);
      const result = await service.getCycle('cycle-1', 'user-1');
      expect(result).toBe(fullCycle);
    });

    it('throws NotFoundException if not found', async () => {
      prismaMock.controlledCycle.findFirst.mockResolvedValue(null);
      await expect(service.getCycle('bad-id', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('logDose', () => {
    const dto = {
      cycle_id: 'cycle-1',
      compound: 'Testosterone Enanthate',
      dose_mg: 250,
      taken_at: new Date().toISOString(),
      client_op_id: 'op-dose-1',
      client_ts: new Date().toISOString(),
    };

    it('returns existing dose if idempotent', async () => {
      prismaMock.controlledDoseLog.findUnique.mockResolvedValue(DOSE);
      const result = await service.logDose('user-1', dto as any);
      expect(result).toBe(DOSE);
      expect(prismaMock.controlledDoseLog.create).not.toHaveBeenCalled();
    });

    it('creates dose and sets log_date', async () => {
      prismaMock.controlledDoseLog.findUnique.mockResolvedValue(null);
      prismaMock.controlledDoseLog.create.mockResolvedValue(DOSE);
      await service.logDose('user-1', dto as any);
      const data = prismaMock.controlledDoseLog.create.mock.calls[0][0].data;
      expect(data.log_date).toBeInstanceOf(Date);
    });
  });

  describe('listBloodwork', () => {
    it('returns bloodwork for cycle', async () => {
      prismaMock.bloodworkResult.findMany.mockResolvedValue([BLOODWORK]);
      const result = await service.listBloodwork('cycle-1', 'user-1');
      expect(result).toEqual([BLOODWORK]);
    });
  });

  describe('addBloodwork', () => {
    const dto = {
      test_date: '2026-02-01',
      total_test_ng_dl: 900,
      client_op_id: 'op-bw-1',
      client_ts: new Date().toISOString(),
    };

    it('creates bloodwork result', async () => {
      prismaMock.bloodworkResult.create.mockResolvedValue(BLOODWORK);
      const result = await service.addBloodwork('cycle-1', 'user-1', dto as any);
      expect(result).toBe(BLOODWORK);
      expect(prismaMock.bloodworkResult.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            client_op_id: 'op-bw-1',
            client_ts: expect.any(Date),
          }),
        }),
      );
    });
  });
});
