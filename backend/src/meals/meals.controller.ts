import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { MealsService } from './meals.service';

// GET  /meals/planned/today  — Loop B W6
// POST /meals/quick-log
// GET  /meals/today
// POST /meals
// GET  /meals/:id
// PATCH /meals/:id
// DELETE /meals/:id
// POST /meals/items
// PATCH /meals/items/:id
// DELETE /meals/items/:id

@ApiTags('Meals')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('meals')
export class MealsController {
  constructor(private readonly mealsService: MealsService) {}
}
