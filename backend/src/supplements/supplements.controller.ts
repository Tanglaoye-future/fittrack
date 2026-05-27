import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { SupplementsService } from './supplements.service';

// POST /supplements/schedules
// GET  /supplements/schedules
// PATCH /supplements/schedules/:id
// DELETE /supplements/schedules/:id
// POST /supplements/logs
// GET  /supplements/logs

@ApiTags('Supplements')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('supplements')
export class SupplementsController {
  constructor(private readonly supplementsService: SupplementsService) {}
}
