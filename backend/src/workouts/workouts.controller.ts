import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { WorkoutsService } from './workouts.service';

// POST /workouts/sessions/start          — Loop A W4
// GET  /workouts/sessions
// GET  /workouts/sessions/:id
// PATCH /workouts/sessions/:id
// DELETE /workouts/sessions/:id
// POST /workouts/sessions/:id/exercises
// POST /workouts/sessions/:sid/exercises/:eid/sets
// GET  /workouts/personal-records

@ApiTags('Workouts')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('workouts')
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}
}
