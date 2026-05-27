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
import { FoodsService } from './foods.service';
import { CreateFoodDto, SearchFoodsDto, ScanBarcodeDto, UpdateFoodDto } from './dto/foods.dto';

@ApiTags('Foods')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('foods')
export class FoodsController {
  constructor(private readonly foodsService: FoodsService) {}

  @Get()
  @ApiOperation({ summary: '食材搜索（中文全文 / 分类 / 条码）' })
  findAll(@Query() dto: SearchFoodsDto) {
    return this.foodsService.findAll(dto);
  }

  @Get('recent')
  @ApiOperation({ summary: '最近使用的食材' })
  findRecent(@CurrentUser() user: RequestUser) {
    return this.foodsService.findRecent(user.userId);
  }

  @Get('favorites')
  @ApiOperation({ summary: '我收藏的食材' })
  findFavorites(@CurrentUser() user: RequestUser) {
    return this.foodsService.findFavorites(user.userId);
  }

  @Get('barcode/:code')
  @ApiOperation({ summary: '通过条码查食材' })
  @ApiParam({ name: 'code' })
  findByBarcode(@Param('code') code: string) {
    return this.foodsService.findByBarcode(code);
  }

  @Get(':id')
  @ApiOperation({ summary: '食材详情' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string) {
    return this.foodsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '用户提议新增食材' })
  create(@Body() dto: CreateFoodDto, @CurrentUser() user: RequestUser) {
    return this.foodsService.create(dto, user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: '修改食材（仅自建）' })
  @ApiParam({ name: 'id' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFoodDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.foodsService.update(id, dto, user.userId);
  }

  @Post(':id/favorite')
  @ApiOperation({ summary: '收藏食材' })
  @ApiParam({ name: 'id' })
  addFavorite(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.foodsService.addFavorite(id, user.userId);
  }

  @Delete(':id/favorite')
  @ApiOperation({ summary: '取消收藏' })
  @ApiParam({ name: 'id' })
  @HttpCode(HttpStatus.OK)
  removeFavorite(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.foodsService.removeFavorite(id, user.userId);
  }

  @Post('scan-barcode')
  @ApiOperation({ summary: '条码扫描识别' })
  scanBarcode(@Body() dto: ScanBarcodeDto) {
    return this.foodsService.scanBarcode(dto.barcode);
  }
}
