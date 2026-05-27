import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RecipesService } from './recipes.service';

// POST /recipes
// GET  /recipes
// GET  /recipes/:id
// PATCH /recipes/:id
// DELETE /recipes/:id

@ApiTags('Recipes')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}
}
