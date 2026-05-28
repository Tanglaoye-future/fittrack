import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import {
  CreateBodyRecordDto,
  UpdateBodyRecordDto,
  ListBodyRecordsDto,
  CreateProgressPhotoDto,
  TrendQueryDto,
} from './dto/body-records.dto';

@Injectable()
export class BodyRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, dto: ListBodyRecordsDto) {
    const where: Record<string, unknown> = { user_id: userId, deleted_at: null };
    if (dto.date_from || dto.date_to) {
      const range: Record<string, Date> = {};
      if (dto.date_from) range.gte = new Date(dto.date_from);
      if (dto.date_to) range.lte = new Date(dto.date_to);
      where.measurement_date = range;
    }

    return this.prisma.bodyRecord.findMany({
      where,
      include: { photos: { where: { deleted_at: null } } },
      orderBy: { measurement_date: 'desc' },
    });
  }

  async getToday(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.bodyRecord.findFirst({
      where: { user_id: userId, measurement_date: today, deleted_at: null },
      include: { photos: { where: { deleted_at: null } } },
    });
  }

  async create(userId: string, dto: CreateBodyRecordDto) {
    const measurementDate = new Date(dto.measurement_date);

    return this.prisma.bodyRecord.upsert({
      where: { user_id_measurement_date: { user_id: userId, measurement_date: measurementDate } },
      create: {
        user_id: userId,
        measurement_date: measurementDate,
        morning_weight_kg: dto.morning_weight_kg,
        evening_weight_kg: dto.evening_weight_kg,
        body_fat_percentage: dto.body_fat_percentage,
        muscle_mass_kg: dto.muscle_mass_kg,
        visceral_fat_index: dto.visceral_fat_index,
        chest_cm: dto.chest_cm,
        waist_cm: dto.waist_cm,
        hip_cm: dto.hip_cm,
        arm_left_cm: dto.arm_left_cm,
        arm_right_cm: dto.arm_right_cm,
        thigh_left_cm: dto.thigh_left_cm,
        thigh_right_cm: dto.thigh_right_cm,
        calf_left_cm: dto.calf_left_cm,
        calf_right_cm: dto.calf_right_cm,
        subjective_condition: dto.subjective_condition,
        water_retention_score: dto.water_retention_score,
        sleep_hours: dto.sleep_hours,
        energy_score: dto.energy_score,
        notes: dto.notes,
        client_op_id: dto.client_op_id,
        client_ts: new Date(dto.client_ts),
      },
      update: {
        morning_weight_kg: dto.morning_weight_kg,
        evening_weight_kg: dto.evening_weight_kg,
        body_fat_percentage: dto.body_fat_percentage,
        muscle_mass_kg: dto.muscle_mass_kg,
        visceral_fat_index: dto.visceral_fat_index,
        chest_cm: dto.chest_cm,
        waist_cm: dto.waist_cm,
        hip_cm: dto.hip_cm,
        arm_left_cm: dto.arm_left_cm,
        arm_right_cm: dto.arm_right_cm,
        thigh_left_cm: dto.thigh_left_cm,
        thigh_right_cm: dto.thigh_right_cm,
        calf_left_cm: dto.calf_left_cm,
        calf_right_cm: dto.calf_right_cm,
        subjective_condition: dto.subjective_condition,
        water_retention_score: dto.water_retention_score,
        sleep_hours: dto.sleep_hours,
        energy_score: dto.energy_score,
        notes: dto.notes,
      },
      include: { photos: { where: { deleted_at: null } } },
    });
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
