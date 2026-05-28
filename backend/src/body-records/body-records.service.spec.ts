import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BodyRecordsService } from './body-records.service';
import { PrismaService } from '@/database/prisma.service';

const RECORD = {
  id: 'rec-1',
  user_id: 'user-1',
  measurement_date: new Date('2026-01-15'),
  morning_weight_kg: 80,
  body_fat_percentage: 15,
  deleted_at: null,
  photos: [],
};

const PHOTO = {
  id: 'photo-1',
  user_id: 'user-1',
  client_op_id: 'op-photo-1',
  url: 'https://example.com/photo.jpg',
};

const buildPrismaMock = () => ({
  bodyRecord: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
  },
  progressPhoto: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  },
});

describe('BodyRecordsService', () => {
  let service: BodyRecordsService;
  let prismaMock: ReturnType<typeof buildPrismaMock>;

  beforeEach(async () => {
    prismaMock = buildPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [BodyRecordsService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = module.get<BodyRecordsService>(BodyRecordsService);
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('returns all records without date filter', async () => {
      prismaMock.bodyRecord.findMany.mockResolvedValue([RECORD]);
      const result = await service.list('user-1', {});
      expect(result).toEqual([RECORD]);
    });

    it('applies date_from filter', async () => {
      prismaMock.bodyRecord.findMany.mockResolvedValue([]);
      await service.list('user-1', { date_from: '2026-01-01' });
      expect(prismaMock.bodyRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ measurement_date: expect.objectContaining({ gte: expect.any(Date) }) }),
        }),
      );
    });
  });

  describe('create', () => {
    const dto = {
      measurement_date: '2026-01-15',
      morning_weight_kg: 80,
      client_op_id: 'op-1',
      client_ts: '2026-01-15T08:00:00Z',
    };

    it('upserts record by measurement_date', async () => {
      prismaMock.bodyRecord.upsert.mockResolvedValue(RECORD);
      const result = await service.create('user-1', dto as any);
      expect(result).toBe(RECORD);
      expect(prismaMock.bodyRecord.upsert).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('returns record if found', async () => {
      prismaMock.bodyRecord.findFirst.mockResolvedValue(RECORD);
      const result = await service.findOne('rec-1', 'user-1');
      expect(result).toBe(RECORD);
    });

    it('throws NotFoundException if not found', async () => {
      prismaMock.bodyRecord.findFirst.mockResolvedValue(null);
      await expect(service.findOne('bad-id', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('soft-deletes the record', async () => {
      prismaMock.bodyRecord.findFirst.mockResolvedValue(RECORD);
      prismaMock.bodyRecord.update.mockResolvedValue({ ...RECORD, deleted_at: new Date() });
      const result = await service.remove('rec-1', 'user-1');
      expect(result).toEqual({ deleted: true });
      expect(prismaMock.bodyRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ deleted_at: expect.any(Date) }) }),
      );
    });
  });

  describe('getTrends', () => {
    it('returns weight trend by default', async () => {
      prismaMock.bodyRecord.findMany.mockResolvedValue([RECORD]);
      const result = await service.getTrends('user-1', { period: '30d' });
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('value');
    });

    it('returns body_fat trend', async () => {
      prismaMock.bodyRecord.findMany.mockResolvedValue([RECORD]);
      const result = await service.getTrends('user-1', { metric: 'body_fat' });
      expect(result[0].value).toBe(RECORD.body_fat_percentage);
    });
  });

  describe('createPhoto', () => {
    const dto = {
      photo_date: '2026-01-15',
      url: 'https://example.com/photo.jpg',
      angle: 'FRONT',
      pose: 'RELAXED',
      client_op_id: 'op-photo-1',
      client_ts: new Date().toISOString(),
    };

    it('returns existing photo if idempotent', async () => {
      prismaMock.progressPhoto.findUnique.mockResolvedValue(PHOTO);
      const result = await service.createPhoto('user-1', dto as any);
      expect(result).toBe(PHOTO);
      expect(prismaMock.progressPhoto.create).not.toHaveBeenCalled();
    });

    it('creates new photo', async () => {
      prismaMock.progressPhoto.findUnique.mockResolvedValue(null);
      prismaMock.progressPhoto.create.mockResolvedValue(PHOTO);
      const result = await service.createPhoto('user-1', dto as any);
      expect(result).toBe(PHOTO);
    });
  });

  describe('getUploadUrl', () => {
    it('returns upload url stub', async () => {
      const result = await service.getUploadUrl('user-1');
      expect(result).toHaveProperty('upload_url');
      expect(result).toHaveProperty('expires_in');
    });
  });
});
