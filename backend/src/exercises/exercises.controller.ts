import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { ExercisesService } from './exercises.service';

// GET  /exercises         — search + filter
// GET  /exercises/:id
// POST /exercises         — user custom
// PATCH /exercises/:id
// DELETE /exercises/:id

@ApiTags('Exercises')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}
}
