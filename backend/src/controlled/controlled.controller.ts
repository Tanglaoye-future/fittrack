import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { ControlledService } from './controlled.service';

// POST /controlled/pin/verify            — 下发 ControlledPinSession
// GET  /controlled/cycles
// POST /controlled/cycles
// GET  /controlled/cycles/:id
// POST /controlled/cycles/:id/doses
// GET  /controlled/cycles/:id/bloodwork
// POST /controlled/cycles/:id/bloodwork
// POST /controlled/expenses
// POST /controlled/export/request        — 加密 ZIP 导出
// POST /controlled/view-tokens           — 向教练签发 ControlledViewToken

@ApiTags('Controlled')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('controlled')
export class ControlledController {
  constructor(private readonly controlledService: ControlledService) {}
}
