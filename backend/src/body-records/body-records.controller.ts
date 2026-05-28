import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CurrentUser, RequestUser } from '@/common/decorators/current-user.decorator';
import { BodyRecordsService } from './body-records.service';
import {
  CreateBodyRecordDto,
  CreateProgressPhotoDto,
  ListBodyRecordsDto,
  TrendQueryDto,
  UpdateBodyRecordDto,
} from './dto/body-records.dto';

@ApiTags('BodyRecords')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('body-records')
export class BodyRecordsController {
  constructor(private readonly bodyRecordsService: BodyRecordsService) {}

  @Get()
  @ApiOperation({ summary: '体测记录列表（分页，?start_date=&end_date=）' })
  list(@Query() dto: Record<string, string>, @CurrentUser() user: RequestUser) {
    return this.bodyRecordsService.list(user.userId, dto as never);
  }

  @Get('today')
  @ApiOperation({ summary: '今日体测（如有）' })
  getToday(@CurrentUser() user: RequestUser) {
    return this.bodyRecordsService.getToday(user.userId);
  }

  @Get('trends')
  @ApiOperation({ summary: '趋势数据（?metric=weight&period=30d）' })
  getTrends(@Query() dto: TrendQueryDto, @CurrentUser() user: RequestUser) {
    return this.bodyRecordsService.getTrends(user.userId, dto);
  }

  @Post()
  @ApiOperation({ summary: '新增 / Upsert 体测（支持 v1 字段名，按日期幂等）' })
  create(@Body() dto: Record<string, unknown>, @CurrentUser() user: RequestUser) {
    return this.bodyRecordsService.create(user.userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: '体测详情（含照片）' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.bodyRecordsService.findOne(id, user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新体测' })
  @ApiParam({ name: 'id' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBodyRecordDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.bodyRecordsService.update(id, user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '软删体测记录' })
  @ApiParam({ name: 'id' })
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.bodyRecordsService.remove(id, user.userId);
  }
}

// Photos controller at /photos prefix
import { Controller as Ctrl } from '@nestjs/common';

@ApiTags('Photos')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Ctrl('photos')
export class PhotosController {
  constructor(private readonly bodyRecordsService: BodyRecordsService) {}

  @Post('upload-url')
  @ApiOperation({ summary: '申请照片预签名上传 URL' })
  getUploadUrl(@CurrentUser() user: RequestUser) {
    return this.bodyRecordsService.getUploadUrl(user.userId);
  }

  @Post()
  @ApiOperation({ summary: '写照片元数据（上传完成后调用）' })
  create(@Body() dto: CreateProgressPhotoDto, @CurrentUser() user: RequestUser) {
    return this.bodyRecordsService.createPhoto(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: '照片列表（?date_from=&angle=&pose=）' })
  list(
    @Query() query: { date_from?: string; angle?: string; pose?: string },
    @CurrentUser() user: RequestUser,
  ) {
    return this.bodyRecordsService.listPhotos(user.userId, query);
  }
}
