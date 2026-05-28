import { randomUUID } from 'crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import {
  CreateBodyRecordDto,
  UpdateBodyRecordDto,
  ListBodyRecordsDto,
  CreateProgressPhotoDto,
  TrendQueryDto,
} from './dto/body-records.dto';

function mapToV1(r: Record<string, unknown>) {
  return {
    id: r.id,
    user_id: r.user_id,
    weight: r.morning_weight_kg,
    body_fat_percentage: r.body_fat_percentage,
    muscle_mass: r.muscle_mass_kg,
    chest: r.chest_cm,
    waist: r.waist_cm,
    hip: r.hip_cm,
    arm: r.arm_left_cm,
    thigh: r.thigh_left_cm,
    measurement_date: r.measurement_date,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

@Injectable()
export class BodyRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    userId: string,
    dto: ListBodyRecordsDto & { page?: number; limit?: number; start_date?: string; end_date?: string },
  ) {
    const page = Number(dto.page) || 1;
    const limit = Number(dto.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { user_id: userId, deleted_at: null };
    const dateFrom = dto.date_from ?? dto.start_date;
    const dateTo = dto.date_to ?? dto.end_date;
    if (dateFrom || dateTo) {
      const range: Record<string, Date> = {};
      if (dateFrom) range.gte = new Date(dateFrom);
      if (dateTo) range.lte = new Date(dateTo);
      where.measurement_date = range;
    }

    const [items, total] = await Promise.all([
      this.prisma.bodyRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { measurement_date: 'desc' },
      }),
      this.prisma.bodyRecord.count({ where }),
    ]);

    return { data: items.map((r) => mapToV1(r as unknown as Record<string, unknown>)), total, page, limit };
  }

  async getToday(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.bodyRecord.findFirst({
      where: { user_id: userId, measurement_date: today, deleted_at: null },
      include: { photos: { where: { deleted_at: null } } },
    });
  }

  async create(userId: string, dto: Partial<CreateBodyRecordDto> & Record<string, unknown>) {
    const measurementDate = new Date((dto.measurement_date as string) ?? new Date().toISOString().split('T')[0]);
    const clientOpId = (dto.client_op_id as string) || randomUUID();
    const clientTs = new Date((dto.client_ts as string) || new Date().toISOString());

    // Support v1 field name aliases
    const morning_weight_kg = (dto.morning_weight_kg ?? dto.weight) as number | undefined;
    const muscle_mass_kg = (dto.muscle_mass_kg ?? dto.muscle_mass) as number | undefined;
    const chest_cm = (dto.chest_cm ?? dto.chest) as number | undefined;
    const waist_cm = (dto.waist_cm ?? dto.waist) as number | undefined;
    const hip_cm = (dto.hip_cm ?? dto.hip) as number | undefined;
    const arm_left_cm = (dto.arm_left_cm ?? dto.arm) as number | undefined;
    const thigh_left_cm = (dto.thigh_left_cm ?? dto.thigh) as number | undefined;

    const sharedData = {
      morning_weight_kg,
      body_fat_percentage: dto.body_fat_percentage as number | undefined,
      muscle_mass_kg,
      chest_cm,
      waist_cm,
      hip_cm,
      arm_left_cm,
      thigh_left_cm,
      notes: dto.notes as string | undefined,
    };

    const record = await this.prisma.bodyRecord.upsert({
      where: { user_id_measurement_date: { user_id: userId, measurement_date: measurementDate } },
      create: {
        user_id: userId,
        measurement_date: measurementDate,
        ...sharedData,
        client_op_id: clientOpId,
        client_ts: clientTs,
      },
      update: sharedData,
    });

    return mapToV1(record as unknown as Record<string, unknown>);
  }

  async findOne(id: string, userId: string) {
    const record = await this.prisma.bodyRecord.findFirst({
      where: { id, user_id: userId, deleted_at: null },
      include: { photos: { where: { deleted_at: null } } },
    });
    if (!record) throw new NotFoundException('体测记录不存在');
    return record;
  }

  async update(id: string, userId: string, dto: UpdateBodyRecordDto) {
    await this.findOne(id, userId);
    const { client_op_id: _, client_ts: __, measurement_date: ___, ...rest } = dto;
    return this.prisma.bodyRecord.update({ where: { id }, data: rest });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    await this.prisma.bodyRecord.update({ where: { id }, data: { deleted_at: new Date() } });
    return { deleted: true };
  }

  async getTrends(userId: string, dto: TrendQueryDto) {
    const metric = dto.metric ?? 'weight';
    const days = dto.period?.includes('d') ? parseInt(dto.period) : 30;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const records = await this.prisma.bodyRecord.findMany({
      where: {
        user_id: userId,
        measurement_date: { gte: fromDate },
        deleted_at: null,
      },
      orderBy: { measurement_date: 'asc' },
      select: {
        measurement_date: true,
        morning_weight_kg: true,
        body_fat_percentage: true,
        waist_cm: true,
        arm_left_cm: true,
        arm_right_cm: true,
      },
    });

    return records.map((r) => ({
      date: r.measurement_date,
      value:
        metric === 'body_fat'
          ? r.body_fat_percentage
          : metric === 'waist'
          ? r.waist_cm
          : r.morning_weight_kg,
    }));
  }

  // ── Photos ─────────────────────────────────────────────────────────────────

  async createPhoto(userId: string, dto: CreateProgressPhotoDto) {
    const existing = await this.prisma.progressPhoto.findUnique({
      where: { client_op_id: dto.client_op_id },
    });
    if (existing) return existing;

    return this.prisma.progressPhoto.create({
      data: {
        user_id: userId,
        body_record_id: dto.body_record_id,
        photo_date: new Date(dto.photo_date),
        url: dto.url,
        thumbnail_url: dto.thumbnail_url,
        angle: dto.angle as never,
        pose: dto.pose as never,
        visibility: (dto.visibility ?? 'SELF_ONLY') as never,
        client_op_id: dto.client_op_id,
        client_ts: new Date(dto.client_ts),
      },
    });
  }

  async listPhotos(userId: string, query: { date_from?: string; angle?: string; pose?: string }) {
    const where: Record<string, unknown> = { user_id: userId, deleted_at: null };
    if (query.date_from) where.photo_date = { gte: new Date(query.date_from) };
    if (query.angle) where.angle = query.angle;
    if (query.pose) where.pose = query.pose;

    return this.prisma.progressPhoto.findMany({
      where,
      orderBy: { photo_date: 'desc' },
    });
  }

  async getUploadUrl(userId: string) {
    return {
      upload_url: `https://storage.example.com/photos/${userId}/${Date.now()}?signed=stub`,
      expires_in: 86400,
    };
  }
}
