import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import {
  CreateSupplementScheduleDto,
  UpdateSupplementScheduleDto,
  CreateSupplementLogDto,
  ListSupplementLogsDto,
} from './dto/supplements.dto';

@Injectable()
export class SupplementsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Schedules ──────────────────────────────────────────────────────────────

  async listSchedules(userId: string) {
    return this.prisma.supplementSchedule.findMany({
      where: { user_id: userId, deleted_at: null },
      include: { items: true },
      orderBy: { created_at: 'asc' },
    });
  }

  async createSchedule(userId: string, dto: CreateSupplementScheduleDto) {
    const existing = await this.prisma.supplementSchedule.findUnique({
      where: { client_op_id: dto.client_op_id },
    });
    if (existing) return existing;

    return this.prisma.supplementSchedule.create({
      data: {
        user_id: userId,
        name: dto.name,
        time_slot: dto.time_slot,
        client_op_id: dto.client_op_id,
        client_ts: new Date(dto.client_ts),
        items: {
          create: (dto.items ?? []).map((item) => ({
            name: item.name,
            brand: item.brand,
            dose: item.dose,
            unit: item.unit,
            notes: item.notes,
            is_controlled: item.is_controlled ?? false,
          })),
        },
      },
      include: { items: true },
    });
  }

  async updateSchedule(id: string, userId: string, dto: UpdateSupplementScheduleDto) {
    await this.assertOwner(id, userId);
    const { items: _, client_op_id: __, client_ts: ___, ...rest } = dto;
    return this.prisma.supplementSchedule.update({ where: { id }, data: rest });
  }

  async deleteSchedule(id: string, userId: string) {
    await this.assertOwner(id, userId);
    await this.prisma.supplementSchedule.update({ where: { id }, data: { deleted_at: new Date() } });
    return { deleted: true };
  }

  async logAll(scheduleId: string, userId: string, takenAt: string, clientOpIdBase: string) {
    const schedule = await this.prisma.supplementSchedule.findFirst({
      where: { id: scheduleId, user_id: userId, deleted_at: null },
      include: { items: true },
    });
    if (!schedule) throw new NotFoundException('补剂套餐不存在');

    const takenDate = new Date(takenAt);
    takenDate.setHours(0, 0, 0, 0);

    const logs = await Promise.all(
      schedule.items.map(async (item, idx) => {
        const opId = `${clientOpIdBase}:${idx}`;
        const existing = await this.prisma.supplementLog.findUnique({ where: { client_op_id: opId } });
        if (existing) return existing;

        return this.prisma.supplementLog.create({
          data: {
            user_id: userId,
            schedule_id: scheduleId,
            item_id: item.id,
            name: item.name,
            dose: item.dose,
            unit: item.unit,
            taken_at: new Date(takenAt),
            log_date: takenDate,
            is_controlled: item.is_controlled,
            client_op_id: opId,
            client_ts: new Date(),
          },
        });
      }),
    );

    return { logged: logs.length, logs };
  }

  // ── Logs ───────────────────────────────────────────────────────────────────

  async createLog(userId: string, dto: CreateSupplementLogDto) {
    const existing = await this.prisma.supplementLog.findUnique({
      where: { client_op_id: dto.client_op_id },
    });
    if (existing) return existing;

    const takenDate = new Date(dto.taken_at);
    takenDate.setHours(0, 0, 0, 0);

    return this.prisma.supplementLog.create({
      data: {
        user_id: userId,
        schedule_id: dto.schedule_id,
        item_id: dto.item_id,
        name: dto.name,
        dose: dto.dose,
        unit: dto.unit,
        taken_at: new Date(dto.taken_at),
        log_date: takenDate,
        is_controlled: dto.is_controlled ?? false,
        client_op_id: dto.client_op_id,
        client_ts: new Date(dto.client_ts),
      },
    });
  }

  async listLogs(userId: string, dto: ListSupplementLogsDto) {
    const where: Record<string, unknown> = { user_id: userId, deleted_at: null };
    if (dto.date) where.log_date = new Date(dto.date);

    return this.prisma.supplementLog.findMany({
      where,
      orderBy: { taken_at: 'asc' },
    });
  }

  private async assertOwner(id: string, userId: string) {
    const schedule = await this.prisma.supplementSchedule.findFirst({
      where: { id, deleted_at: null },
    });
    if (!schedule || schedule.user_id !== userId) throw new NotFoundException('补剂套餐不存在');
    return schedule;
  }
}
