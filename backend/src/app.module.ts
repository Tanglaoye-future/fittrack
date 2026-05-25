import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MealsModule } from './meals/meals.module';
import { WorkoutsModule } from './workouts/workouts.module';
import { ExpensesModule } from './expenses/expenses.module';
import { BodyRecordsModule } from './body-records/body-records.module';
import { AnalyticsModule } from './analytics/analytics.module';

/**
 * 应用主模块
 * 负责模块的注册和依赖注入
 */
@Module({
  imports: [
    // 全局配置模块，加载环境变量
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // 数据库模块
    DatabaseModule,
    // 认证模块
    AuthModule,
    // 业务模块
    UsersModule,
    MealsModule,
    WorkoutsModule,
    ExpensesModule,
    BodyRecordsModule,
    AnalyticsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
