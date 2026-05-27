import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CompetitionsService } from './competitions.service';

// POST /competitions
// GET  /competitions
// GET  /competitions/:id
// POST /competitions/:id/prep-cycles
// GET  /competitions/:id/prep-cycles/:pid
// POST /competitions/:id/prep-cycles/:pid/phases
// GET  /prep-cycles/active

@ApiTags('Competitions')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('competitions')
export class CompetitionsController {
  constructor(private readonly competitionsService: CompetitionsService) {}
}
