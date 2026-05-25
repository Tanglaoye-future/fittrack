import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateBodyRecordDto, QueryBodyRecordDto } from './dto/body-records.dto';

@Injectable()
export class BodyRecordsService {
  private readonly logger = new Logger(BodyRecordsService.name);

  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateBodyRecordDto) {
    const record = await this.prisma.bodyRecord.create({
      data: {
        user_id: userId,
        weight: dto.weight,
        body_fat_percentage: dto.body_fat_percentage,
        muscle_mass: dto.muscle_mass,
        chest: dto.chest,
        waist: dto.waist,
        hip: dto.hip,
        arm: dto.arm,
        thigh: dto.thigh,
        measurement_date: new Date(dto.measurement_date),
      },
    });

    this.logger.log(`用户 ${userId} 创建了身体数据记录: ${record.id}`);
    return record;
  }

  async findAll(userId: string, query: QueryBodyRecordDto) {
    const { start_date, end_date, page = 1, limit = 20 } = query;
    const where: any = { user_id: userId };

    if (start_date || end_date) {
      where.measurement_date = {};
      if (start_date) where.measurement_date.gte = new Date(start_date);
      if (end_date) where.measurement_date.lte = new Date(end_date);
    }

    const [data, total] = await Promise.all([
      this.prisma.bodyRecord.findMany({
        where,
        orderBy: { measurement_date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.bodyRecord.count({ where }),
    ]);

    return { total, page, limit, data };
  }
}
