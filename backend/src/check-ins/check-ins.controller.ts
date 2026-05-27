import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CheckInsService } from './check-ins.service';

// POST /check-ins              — 运动员提交 W9
// GET  /check-ins
// GET  /check-ins/:id
// PATCH /check-ins/:id         — 运动员草稿更新
// PATCH /check-ins/:id/coach-response  — 教练回复

@ApiTags('CheckIns')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('check-ins')
export class CheckInsController {
  constructor(private readonly checkInsService: CheckInsService) {}
}
