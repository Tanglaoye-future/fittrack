import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { FoodsService } from './foods.service';

// GET  /foods             — 中文全文搜索（pg_trgm）
// GET  /foods/:id
// POST /foods             — 用户自建食材
// PATCH /foods/:id
// GET  /foods/barcode/:code

@ApiTags('Foods')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('foods')
export class FoodsController {
  constructor(private readonly foodsService: FoodsService) {}
}
