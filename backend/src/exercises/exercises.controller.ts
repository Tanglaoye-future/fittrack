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
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CurrentUser, RequestUser } from '@/common/decorators/current-user.decorator';
import { ExercisesService } from './exercises.service';
import {
  SearchExercisesDto,
  CreateExerciseDto,
  UpdateExerciseDto,
  PopularExercisesDto,
} from './dto/exercises.dto';

@ApiTags('Exercises')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Get()
  @ApiOperation({ summary: '动作库列表（支持搜索/过滤）' })
  findAll(@Query() dto: SearchExercisesDto) {
    return this.exercisesService.findAll(dto);
  }

  @Get('popular')
  @ApiOperation({ summary: '热门动作（按使用频次）' })
  findPopular(@Query() dto: PopularExercisesDto) {
    return this.exercisesService.findPopular(dto.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: '动作详情' })
  @ApiParam({ name: 'id', description: '动作 UUID' })
  findOne(@Param('id') id: string) {
    return this.exercisesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '新建自定义动作' })
  create(
    @Body() dto: CreateExerciseDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.exercisesService.create(dto, user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新动作（仅限自建）' })
  @ApiParam({ name: 'id', description: '动作 UUID' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateExerciseDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.exercisesService.update(id, dto, user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除自建动作（软删除）' })
  @ApiParam({ name: 'id', description: '动作 UUID' })
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.exercisesService.remove(id, user.userId);
  }
}
