import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { ExercisesService } from './exercises.service';
import { PrismaService } from '@/database/prisma.service';

const OFFICIAL_EX = {
  id: 'ex-1',
  name_zh: '杠铃卧推',
  name_en: 'Barbell Bench Press',
  description: null,
  primary_muscle: 'CHEST',
  secondary_muscles: ['TRICEPS', 'SHOULDERS_FRONT'],
  equipment: 'BARBELL',
  movement_pattern: 'PUSH',
  video_url: null,
  thumbnail_url: null,
  is_official: true,
  created_by: null,
  created_at: new Date(),
  deleted_at: null,
};

const USER_EX = {
  ...OFFICIAL_EX,
  id: 'ex-2',
  name_en: 'Custom Row',
  name_zh: '自定义划船',
  is_official: false,
  created_by: 'user-1',
};

const prismaMock = {
  exercise: {
    findMany: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  sessionExercise: {
    groupBy: jest.fn(),
  },
};

describe('ExercisesService', () => {
  let service: ExercisesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExercisesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ExercisesService>(ExercisesService);
    jest.clearAllMocks();
  });

  // ── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns paginated list', async () => {
      prismaMock.exercise.findMany.mockResolvedValue([OFFICIAL_EX]);
      prismaMock.exercise.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.has_next).toBe(false);
    });

    it('applies muscle filter', async () => {
      prismaMock.exercise.findMany.mockResolvedValue([]);
      prismaMock.exercise.count.mockResolvedValue(0);

      await service.findAll({ muscle: 'CHEST' as any });

      const [callArgs] = prismaMock.exercise.findMany.mock.calls;
      expect(callArgs[0].where.primary_muscle).toBe('CHEST');
    });

    it('applies keyword search', async () => {
      prismaMock.exercise.findMany.mockResolvedValue([]);
      prismaMock.exercise.count.mockResolvedValue(0);

      await service.findAll({ q: '卧推' });

      const [callArgs] = prismaMock.exercise.findMany.mock.calls;
      expect(callArgs[0].where.OR).toBeDefined();
    });
  });

  // ── findOne ──────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns exercise by id', async () => {
      prismaMock.exercise.findFirst.mockResolvedValue(OFFICIAL_EX);
      const result = await service.findOne('ex-1');
      expect(result.id).toBe('ex-1');
    });

    it('throws NotFoundException when not found', async () => {
      prismaMock.exercise.findFirst.mockResolvedValue(null);
      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ── findPopular ──────────────────────────────────────────────────────────

  describe('findPopular', () => {
    it('returns exercises sorted by usage', async () => {
      prismaMock.sessionExercise.groupBy.mockResolvedValue([
        { exercise_id: 'ex-1', _count: { exercise_id: 5 } },
      ]);
      prismaMock.exercise.findMany.mockResolvedValue([OFFICIAL_EX]);

      const result = await service.findPopular(10);
      expect(result).toHaveLength(1);
    });

    it('falls back to official exercises when no sessions', async () => {
      prismaMock.sessionExercise.groupBy.mockResolvedValue([]);
      prismaMock.exercise.findMany.mockResolvedValue([OFFICIAL_EX]);

      const result = await service.findPopular(10);
      expect(result).toHaveLength(1);
    });
  });

  // ── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto = {
      name_zh: '自定义动作',
      name_en: 'Custom Move',
      primary_muscle: 'CHEST' as any,
      equipment: 'DUMBBELL' as any,
      movement_pattern: 'PUSH' as any,
    };

    it('creates exercise for user', async () => {
      prismaMock.exercise.findFirst.mockResolvedValue(null); // no conflict
      prismaMock.exercise.create.mockResolvedValue({ ...USER_EX, ...dto });

      const result = await service.create(dto, 'user-1');
      expect(prismaMock.exercise.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ is_official: false, created_by: 'user-1' }),
        }),
      );
      expect(result).toBeDefined();
    });

    it('throws ConflictException when english name exists', async () => {
      prismaMock.exercise.findFirst.mockResolvedValue(OFFICIAL_EX);
      await expect(service.create(dto, 'user-1')).rejects.toThrow(ConflictException);
    });
  });

  // ── update ────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('allows owner to update user-created exercise', async () => {
      prismaMock.exercise.findFirst.mockResolvedValue(USER_EX);
      prismaMock.exercise.update.mockResolvedValue({ ...USER_EX, name_zh: '新名称' });

      const result = await service.update('ex-2', { name_zh: '新名称' }, 'user-1');
      expect(result.name_zh).toBe('新名称');
    });

    it('throws ForbiddenException when not owner', async () => {
      prismaMock.exercise.findFirst.mockResolvedValue(USER_EX);
      await expect(
        service.update('ex-2', { name_zh: 'X' }, 'other-user'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when exercise not found', async () => {
      prismaMock.exercise.findFirst.mockResolvedValue(null);
      await expect(service.update('bad', {}, 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ── remove ────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('deletes user-created exercise', async () => {
      prismaMock.exercise.findFirst.mockResolvedValue(USER_EX);
      prismaMock.exercise.delete.mockResolvedValue(USER_EX);

      const result = await service.remove('ex-2', 'user-1');
      expect(result.deleted).toBe(true);
      expect(prismaMock.exercise.delete).toHaveBeenCalledWith({ where: { id: 'ex-2' } });
    });

    it('throws ForbiddenException for official exercise', async () => {
      prismaMock.exercise.findFirst.mockResolvedValue(OFFICIAL_EX);
      await expect(service.remove('ex-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when not owner', async () => {
      prismaMock.exercise.findFirst.mockResolvedValue(USER_EX);
      await expect(service.remove('ex-2', 'other-user')).rejects.toThrow(ForbiddenException);
    });
  });
});
