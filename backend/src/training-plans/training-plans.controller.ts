import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { TrainingPlansService } from './training-plans.service';

// POST /training-plans
// GET  /training-plans
// GET  /training-plans/:id
// PATCH /training-plans/:id
// DELETE /training-plans/:id
// POST /training-plans/:id/templates
// GET  /training-plans/:id/templates/:tid
// PATCH /training-plans/:id/templates/:tid
// POST /training-plans/:id/clone

@ApiTags('TrainingPlans')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('training-plans')
export class TrainingPlansController {
  constructor(private readonly trainingPlansService: TrainingPlansService) {}
}
