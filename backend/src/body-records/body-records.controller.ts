import {
  Controller, Get, Post, Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BodyRecordsService } from './body-records.service';
import { CreateBodyRecordDto, QueryBodyRecordDto } from './dto/body-records.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@ApiTags('BodyRecords')
@Controller('body-records')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class BodyRecordsController {
  constructor(private bodyRecordsService: BodyRecordsService) {}

  @Post()
  @ApiOperation({ summary: '新增身体测量记录' })
  create(@Request() req, @Body() dto: CreateBodyRecordDto) {
    return this.bodyRecordsService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: '获取身体数据列表', description: '支持按日期范围筛选和分页' })
  findAll(@Request() req, @Query() query: QueryBodyRecordDto) {
    return this.bodyRecordsService.findAll(req.user.userId, query);
  }
}
