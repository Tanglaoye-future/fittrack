import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

export interface CreateControlledCycleDto {
  name: string;
  start_date: string;
  end_date?: string;
  notes_encrypted?: string;
  client_op_id: string;
  client_ts: string;
}

export interface CreateDoseLogDto {
  cycle_id?: string;
  compound: string;
  dose_mg: number;
  route?: string;
  injection_site?: string;
  taken_at: string;
  client_op_id: string;
  client_ts: string;
}

export interface CreateBloodworkDto {
  test_date: string;
  lab_name?: string;
  total_test_ng_dl?: number;
  free_test_pg_ml?: number;
  estradiol_pg_ml?: number;
  hematocrit_pct?: number;
  hdl_mg_dl?: number;
  ldl_mg_dl?: number;
  alt_u_l?: number;
  ast_u_l?: number;
  blood_pressure_sys?: number;
  blood_pressure_dia?: number;
  client_op_id: string;
  client_ts: string;
}

@Injectable()
export class ControlledService {
  constructor(private readonly prisma: PrismaService) {}

  async listCycles(userId: string) {
    return this.prisma.controlledCycle.findMany({
      where: { user_id: userId, deleted_at: null },
      include: { protocol_items: true },
      orderBy: { start_date: 'desc' },
    });
  }

  async createCycle(userId: string, dto: CreateControlledCycleDto) {
    const existing = await this.prisma.controlledCycle.findUnique({
      where: { client_op_id: dto.client_op_id },
    });
    if (existing) return existing;

    return this.prisma.controlledCycle.create({
      data: {
        user_id: userId,
        name: dto.name,
        start_date: new Date(dto.start_date),
        end_date: dto.end_date ? new Date(dto.end_date) : undefined,
        notes_encrypted: dto.notes_encrypted,
        client_op_id: dto.client_op_id,
        client_ts: new Date(dto.client_ts),
      },
    });
  }

  async getCycle(id: string, userId: string) {
    const cycle = await this.prisma.controlledCycle.findFirst({
      where: { id, user_id: userId, deleted_at: null },
      include: { protocol_items: true, doses: true, bloodwork: true },
    });
    if (!cycle) throw new NotFoundException('周期不存在');
    return cycle;
  }

  async logDose(userId: string, dto: CreateDoseLogDto) {
    const existing = await this.prisma.controlledDoseLog.findUnique({
      where: { client_op_id: dto.client_op_id },
    });
    if (existing) return existing;

    const logDate = new Date(dto.taken_at);
    logDate.setHours(0, 0, 0, 0);

    return this.prisma.controlledDoseLog.create({
      data: {
        user_id: userId,
        cycle_id: dto.cycle_id,
        compound: dto.compound,
        dose_mg: dto.dose_mg,
        route: dto.route,
        injection_site: dto.injection_site,
        taken_at: new Date(dto.taken_at),
        log_date: logDate,
        client_op_id: dto.client_op_id,
        client_ts: new Date(dto.client_ts),
      },
    });
  }

  async listBloodwork(cycleId: string, userId: string) {
    return this.prisma.bloodworkResult.findMany({
      where: { cycle_id: cycleId, user_id: userId },
      orderBy: { test_date: 'desc' },
    });
  }

  async addBloodwork(cycleId: string, userId: string, dto: CreateBloodworkDto) {
    return this.prisma.bloodworkResult.create({
      data: {
        user_id: userId,
        cycle_id: cycleId,
        test_date: new Date(dto.test_date),
        lab_name: dto.lab_name,
        total_test_ng_dl: dto.total_test_ng_dl,
        free_test_pg_ml: dto.free_test_pg_ml,
        estradiol_pg_ml: dto.estradiol_pg_ml,
        hematocrit_pct: dto.hematocrit_pct,
        hdl_mg_dl: dto.hdl_mg_dl,
        ldl_mg_dl: dto.ldl_mg_dl,
        alt_u_l: dto.alt_u_l,
        ast_u_l: dto.ast_u_l,
        blood_pressure_sys: dto.blood_pressure_sys,
        blood_pressure_dia: dto.blood_pressure_dia,
        client_op_id: dto.client_op_id,
        client_ts: new Date(dto.client_ts),
      },
    });
  }
}
