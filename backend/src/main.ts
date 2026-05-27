import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);
  const apiVersion = configService.get<string>('API_VERSION', 'v2');
  const apiPrefix = configService.get<string>('API_PREFIX', 'api');

  app.setGlobalPrefix(`${apiPrefix}/${apiVersion}`);

  const corsOrigin = configService
    .get<string>('CORS_ORIGIN', 'http://localhost:3000')
    .split(',');
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('FitFlow Pro API v2')
    .setDescription('职业健美运动员备赛操作系统 API 文档')
    .setVersion('2.0.0')
    .addTag('Auth', '认证')
    .addTag('Users', '用户档案')
    .addTag('Exercises', '动作库')
    .addTag('TrainingPlans', '训练计划')
    .addTag('Workouts', '训练记录（Loop A）')
    .addTag('Foods', '食材库')
    .addTag('Recipes', '配方')
    .addTag('Meals', '饮食记录（Loop B）')
    .addTag('Supplements', '补剂')
    .addTag('BodyRecords', '体测')
    .addTag('Competitions', '备赛')
    .addTag('Coach', '教练协同')
    .addTag('CheckIns', '周 Check-in（Loop C）')
    .addTag('Expenses', '消费')
    .addTag('Analytics', '分析')
    .addTag('Controlled', 'PED 私域（§14）')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  Logger.log(
    `🚀 FitFlow Pro v2 — http://localhost:${port}/${apiPrefix}/${apiVersion}`,
    'Bootstrap',
  );
  Logger.log(`📚 Swagger: http://localhost:${port}/api/docs`, 'Bootstrap');
}

bootstrap().catch((err) => {
  console.error('启动失败:', err);
  process.exit(1);
});
