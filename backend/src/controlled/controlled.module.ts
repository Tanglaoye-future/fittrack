import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { ControlledController } from './controlled.controller';
import { ControlledService } from './controlled.service';

// PED 私域模块（§14）— 仅 pro.fitflow.pro host 可访问
// 商店分发版 BUILD_FLAG_DISABLE_CONTROLLED=true 时完全 tree-shake

@Module({
  imports: [DatabaseModule],
  controllers: [ControlledController],
  providers: [ControlledService],
  exports: [ControlledService],
})
export class ControlledModule {}
