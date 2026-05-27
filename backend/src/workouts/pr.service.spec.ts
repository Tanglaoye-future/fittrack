import { Test, TestingModule } from '@nestjs/testing';
import { PrService, SetForPR } from './pr.service';
import { PrismaService } from '@/database/prisma.service';

const makeSet = (overrides: Partial<SetForPR> = {}): SetForPR => ({
  id: 'set-1',
  user_id: 'user-1',
  exercise_id: 'ex-1',
  session_date: new Date('2026-05-27'),
  session_exercise_id: 'se-1',
  set_type: 'WORKING',
  weight_kg: 100,
  reps: 8,
  ...overrides,
});

const buildPrismaMock = () => ({
  personalRecord: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
  setEntry: {
    findMany: jest.fn(),
  },
});

describe('PrService', () => {
  let service: PrService;
  let prismaMock: ReturnType<typeof buildPrismaMock>;

  beforeEach(async () => {
    prismaMock = buildPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<PrService>(PrService);
    jest.clearAllMocks();
  });

  // ── Epley formula ─────────────────────────────────────────────────────────

  describe('calcEpley (static)', () => {
    it('100kg × 8 reps → 126.67kg 1RM', () => {
      expect(PrService.calcEpley(100, 8)).toBeCloseTo(126.67, 1);
    });

    it('80kg × 5 reps → 93.33kg 1RM', () => {
      expect(PrService.calcEpley(80, 5)).toBeCloseTo(93.33, 1);
    });

    it('formula: weight × (1 + reps/30)', () => {
      expect(PrService.calcEpley(120, 1)).toBeCloseTo(124, 0);
    });
  });

  // ── Skip non-PR set types ─────────────────────────────────────────────────

  describe('detectAndUpdate — skips non-working sets', () => {
    it.each(['WARMUP', 'DROP'])(
      'returns [] for set_type=%s',
      async (set_type) => {
        const result = await service.detectAndUpdate(makeSet({ set_type }));
        expect(result).toEqual([]);
        expect(prismaMock.personalRecord.findUnique).not.toHaveBeenCalled();
      },
    );
  });

  // ── ONE_RM ────────────────────────────────────────────────────────────────

  describe('checkOneRm', () => {
    it('creates new 1RM PR when none exists', async () => {
      prismaMock.personalRecord.findUnique
        .mockResolvedValueOnce(null)  // ONE_RM lookup
        .mockResolvedValueOnce(null)  // REP_BEST: oneRm lookup
        .mockResolvedValueOnce(null)  // REP_BEST current
        .mockResolvedValueOnce(null); // VOLUME_BEST current
      prismaMock.setEntry.findMany.mockResolvedValue([{ weight_kg: 100, reps: 8 }]);
      prismaMock.personalRecord.upsert.mockResolvedValue({});

      const result = await service.detectAndUpdate(makeSet());
      const oneRm = result.find((r) => r.record_type === 'ONE_RM');
      expect(oneRm).toBeDefined();
      expect(oneRm!.prev_value).toBeNull();
      expect(oneRm!.value).toBeCloseTo(PrService.calcEpley(100, 8), 2);
    });

    it('updates 1RM when new estimate is higher', async () => {
      prismaMock.personalRecord.findUnique
        .mockResolvedValueOnce({ value: '120.00', record_type: 'ONE_RM' })
        .mockResolvedValueOnce({ value: '120.00', record_type: 'ONE_RM' }) // for REP_BEST threshold
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      prismaMock.setEntry.findMany.mockResolvedValue([{ weight_kg: 105, reps: 8 }]);
      prismaMock.personalRecord.upsert.mockResolvedValue({});

      // 105 × (1 + 8/30) = 133
      const result = await service.detectAndUpdate(makeSet({ weight_kg: 105, reps: 8 }));
      const oneRm = result.find((r) => r.record_type === 'ONE_RM');
      expect(oneRm).toBeDefined();
      expect(oneRm!.prev_value).toBe(120);
    });

    it('does NOT update when new estimate is lower', async () => {
      // Existing 1RM = 130kg
      prismaMock.personalRecord.findUnique
        .mockResolvedValueOnce({ value: '130.00' })
        .mockResolvedValueOnce({ value: '130.00' })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      prismaMock.setEntry.findMany.mockResolvedValue([{ weight_kg: 100, reps: 8 }]);
      prismaMock.personalRecord.upsert.mockResolvedValue({});

      const result = await service.detectAndUpdate(makeSet({ weight_kg: 100, reps: 8 }));
      const oneRm = result.find((r) => r.record_type === 'ONE_RM');
      expect(oneRm).toBeUndefined();
    });

    it('skips ONE_RM when reps > 10 (Epley unreliable)', async () => {
      prismaMock.personalRecord.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      prismaMock.setEntry.findMany.mockResolvedValue([{ weight_kg: 60, reps: 15 }]);
      prismaMock.personalRecord.upsert.mockResolvedValue({});

      const result = await service.detectAndUpdate(makeSet({ weight_kg: 60, reps: 15 }));
      const oneRm = result.find((r) => r.record_type === 'ONE_RM');
      expect(oneRm).toBeUndefined();
    });

    it('skips when weight or reps is null', async () => {
      prismaMock.personalRecord.findUnique.mockResolvedValue(null);
      prismaMock.setEntry.findMany.mockResolvedValue([]);
      prismaMock.personalRecord.upsert.mockResolvedValue({});

      const result = await service.detectAndUpdate(makeSet({ weight_kg: null }));
      const oneRm = result.find((r) => r.record_type === 'ONE_RM');
      expect(oneRm).toBeUndefined();
    });
  });

  // ── REP_BEST ──────────────────────────────────────────────────────────────

  describe('checkRepBest', () => {
    it('creates REP_BEST when none exists', async () => {
      prismaMock.personalRecord.findUnique
        .mockResolvedValueOnce(null)  // ONE_RM (for Epley, reps=8 ≤10 → tries)
        .mockResolvedValueOnce(null)  // REP_BEST: oneRm for threshold
        .mockResolvedValueOnce(null)  // REP_BEST current
        .mockResolvedValueOnce(null); // VOLUME_BEST
      prismaMock.setEntry.findMany.mockResolvedValue([{ weight_kg: 100, reps: 8 }]);
      prismaMock.personalRecord.upsert.mockResolvedValue({});

      const result = await service.detectAndUpdate(makeSet({ weight_kg: 100, reps: 8 }));
      const repBest = result.find((r) => r.record_type === 'REP_BEST');
      expect(repBest).toBeDefined();
      expect(repBest!.value).toBe(8);
    });

    it('updates REP_BEST when more reps', async () => {
      prismaMock.personalRecord.findUnique
        .mockResolvedValueOnce({ value: '120' }) // ONE_RM exists (for Epley gate)
        .mockResolvedValueOnce({ value: '120' }) // REP_BEST threshold
        .mockResolvedValueOnce({ value: '7', weight_kg: '100' }) // current REP_BEST
        .mockResolvedValueOnce(null); // VOLUME_BEST
      prismaMock.setEntry.findMany.mockResolvedValue([{ weight_kg: 100, reps: 8 }]);
      prismaMock.personalRecord.upsert.mockResolvedValue({});

      const result = await service.detectAndUpdate(makeSet({ weight_kg: 100, reps: 8 }));
      const repBest = result.find((r) => r.record_type === 'REP_BEST');
      expect(repBest).toBeDefined();
      expect(repBest!.value).toBe(8);
      expect(repBest!.prev_value).toBe(7);
    });

    it('skips REP_BEST when weight < 70% of 1RM', async () => {
      // 1RM = 150, weight = 100 → 100/150 = 66.7% < 70% → skip
      prismaMock.personalRecord.findUnique
        .mockResolvedValueOnce(null) // ONE_RM
        .mockResolvedValueOnce({ value: '150.00' }) // REP_BEST: 1RM threshold check
        .mockResolvedValueOnce(null); // VOLUME_BEST
      prismaMock.setEntry.findMany.mockResolvedValue([{ weight_kg: 100, reps: 8 }]);
      prismaMock.personalRecord.upsert.mockResolvedValue({});

      const result = await service.detectAndUpdate(makeSet({ weight_kg: 100, reps: 11 }));
      const repBest = result.find((r) => r.record_type === 'REP_BEST');
      // 100 < 150*0.7=105 → skip
      expect(repBest).toBeUndefined();
    });
  });

  // ── VOLUME_BEST ───────────────────────────────────────────────────────────

  describe('checkVolumeBest', () => {
    it('creates VOLUME_BEST from day total', async () => {
      prismaMock.personalRecord.findUnique
        .mockResolvedValueOnce(null)  // ONE_RM
        .mockResolvedValueOnce(null)  // REP_BEST oneRm
        .mockResolvedValueOnce(null)  // REP_BEST current
        .mockResolvedValueOnce(null); // VOLUME_BEST current
      prismaMock.setEntry.findMany.mockResolvedValue([
        { weight_kg: '100', reps: 8 },
        { weight_kg: '100', reps: 8 },
        { weight_kg: '100', reps: 6 },
      ]);
      prismaMock.personalRecord.upsert.mockResolvedValue({});

      const result = await service.detectAndUpdate(makeSet());
      const vol = result.find((r) => r.record_type === 'VOLUME_BEST');
      expect(vol).toBeDefined();
      // (100×8) + (100×8) + (100×6) = 2200
      expect(vol!.value).toBe(2200);
    });

    it('updates VOLUME_BEST when day total exceeds historical', async () => {
      prismaMock.personalRecord.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ value: '1800.00' }); // existing VOLUME_BEST
      prismaMock.setEntry.findMany.mockResolvedValue([
        { weight_kg: '100', reps: 8 },
        { weight_kg: '100', reps: 8 },
        { weight_kg: '100', reps: 6 },
      ]);
      prismaMock.personalRecord.upsert.mockResolvedValue({});

      const result = await service.detectAndUpdate(makeSet());
      const vol = result.find((r) => r.record_type === 'VOLUME_BEST');
      expect(vol).toBeDefined();
      expect(vol!.value).toBe(2200);
      expect(vol!.prev_value).toBe(1800);
    });

    it('does NOT update VOLUME_BEST when day total is lower', async () => {
      prismaMock.personalRecord.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ value: '5000.00' }); // existing is higher
      prismaMock.setEntry.findMany.mockResolvedValue([
        { weight_kg: '100', reps: 8 },
      ]);
      prismaMock.personalRecord.upsert.mockResolvedValue({});

      const result = await service.detectAndUpdate(makeSet());
      const vol = result.find((r) => r.record_type === 'VOLUME_BEST');
      expect(vol).toBeUndefined();
    });
  });

  // ── AMRAP / CLUSTER counted as PR-eligible ────────────────────────────────

  describe('PR-eligible set types', () => {
    it.each(['WORKING', 'CLUSTER', 'AMRAP'])('%s triggers PR detection', async (set_type) => {
      prismaMock.personalRecord.findUnique.mockResolvedValue(null);
      prismaMock.setEntry.findMany.mockResolvedValue([{ weight_kg: 100, reps: 8 }]);
      prismaMock.personalRecord.upsert.mockResolvedValue({});

      const result = await service.detectAndUpdate(makeSet({ set_type, reps: 8 }));
      // Should have attempted PR detection (not returned empty early)
      expect(prismaMock.personalRecord.findUnique).toHaveBeenCalled();
    });
  });
});
