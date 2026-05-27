import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CurrentUser, RequestUser } from '@/common/decorators/current-user.decorator';
import { RecipesService } from './recipes.service';
import { CloneRecipeDto, CreateRecipeDto, UpdateRecipeDto } from './dto/recipes.dto';

@ApiTags('Recipes')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get()
  @ApiOperation({ summary: '我的所有配方' })
  findAll(@CurrentUser() user: RequestUser) {
    return this.recipesService.findAll(user.userId);
  }

  @Post()
  @ApiOperation({ summary: '新建配方（嵌套 ingredients，自动计算 macros）' })
  create(@Body() dto: CreateRecipeDto, @CurrentUser() user: RequestUser) {
    return this.recipesService.create(dto, user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '配方详情 + macros' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.recipesService.findOne(id, user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新配方' })
  @ApiParam({ name: 'id' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRecipeDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.recipesService.update(id, dto, user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: '软删配方' })
  @ApiParam({ name: 'id' })
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.recipesService.remove(id, user.userId);
  }

  @Post(':id/clone')
  @ApiOperation({ summary: '复制配方' })
  @ApiParam({ name: 'id' })
  clone(
    @Param('id') id: string,
    @Body() dto: CloneRecipeDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.recipesService.clone(id, dto, user.userId);
  }

  @Get(':id/macros')
  @ApiOperation({ summary: '实时 macros（总量 + 每份）' })
  @ApiParam({ name: 'id' })
  getMacros(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.recipesService.getMacros(id, user.userId);
  }
}
