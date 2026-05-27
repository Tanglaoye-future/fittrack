import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CoachService } from './coach.service';

// GET  /coach/dashboard                      — 教练看板 W9
// GET  /coach/athletes
// GET  /coach/athletes/:id
// POST /coach-links/invite
// PATCH /coach-links/:id/accept
// PATCH /coach-links/:id/scopes
// DELETE /coach-links/:id
// POST /coach/athletes/:id/adjustments
// POST /coach/comments

@ApiTags('Coach')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('coach')
export class CoachController {
  constructor(private readonly coachService: CoachService) {}
}
