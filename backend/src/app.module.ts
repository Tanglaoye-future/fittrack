import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';

// 账户域
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

// 训练域（Loop A）
import { ExercisesModule } from './exercises/exercises.module';
import { TrainingPlansModule } from './training-plans/training-plans.module';
import { WorkoutsModule } from './workouts/workouts.module';

// 营养域（Loop B）
import { FoodsModule } from './foods/foods.module';
import { RecipesModule } from './recipes/recipes.module';
import { MealsModule } from './meals/meals.module';
import { SupplementsModule } from './supplements/supplements.module';

// 体测域
import { BodyRecordsModule } from './body-records/body-records.module';

// 备赛域
import { CompetitionsModule } from './competitions/competitions.module';

// 消费域
import { ExpensesModule } from './expenses/expenses.module';

// 教练协同域（Loop C）
import { CoachModule } from './coach/coach.module';
import { CheckInsModule } from './check-ins/check-ins.module';

// 分析域
import { AnalyticsModule } from './analytics/analytics.module';

// 受控物质私域（§14，BUILD_FLAG_DISABLE_CONTROLLED 时移除）
import { ControlledModule } from './controlled/controlled.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    DatabaseModule,
    // 账户域
    AuthModule,
    UsersModule,
    // 训练域
    ExercisesModule,
    TrainingPlansModule,
    WorkoutsModule,
    // 营养域
    FoodsModule,
    RecipesModule,
    MealsModule,
    SupplementsModule,
    // 体测域
    BodyRecordsModule,
    // 备赛域
    CompetitionsModule,
    // 消费域
    ExpensesModule,
    // 教练域
    CoachModule,
    CheckInsModule,
    // 分析域
    AnalyticsModule,
    // PED 私域
    ControlledModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
