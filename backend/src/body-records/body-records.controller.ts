import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { BodyRecordsService } from './body-records.service';

// POST /body-records
// GET  /body-records
// GET  /body-records/:id
// PATCH /body-records/:id
// GET  /body-records/trend
// POST /photos/upload-url   — W7
// GET  /photos

@ApiTags('BodyRecords')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('body-records')
export class BodyRecordsController {
  constructor(private readonly bodyRecordsService: BodyRecordsService) {}
}
