import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new Logger(),
  });

  const configService = app.get(ConfigService);
  const port = configService.get('PORT') || 3001;
  const apiVersion = configService.get('API_VERSION') || 'v1';
  const apiPrefix = configService.get('API_PREFIX') || 'api';

  // 全局前缀
  app.setGlobalPrefix(`${apiPrefix}/${apiVersion}`);

  // CORS 配置
  const corsOrigin = configService.get('CORS_ORIGIN', 'http://localhost:3000').split(',');
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  // 全局响应拦截器
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Swagger 文档配置
  const config = new DocumentBuilder()
    .setTitle('FitFlow API')
    .setDescription('FitFlow - 健身饮食消费管理系统 API 文档')
    .setVersion('1.0.0')
    .addTag('Auth', '认证相关接口')
    .addTag('Users', '用户相关接口')
    .addTag('Meals', '饮食相关接口')
    .addTag('Workouts', '训练相关接口')
    .addTag('Expenses', '消费相关接口')
    .addTag('BodyRecords', '身体数据接口')
    .addTag('Analytics', '数据分析接口')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'JWT',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  Logger.log(
    `🚀 应用已启动 http://localhost:${port}/${apiPrefix}/${apiVersion}`,
    'Bootstrap',
  );
  Logger.log(`📚 Swagger 文档: http://localhost:${port}/api/docs`, 'Bootstrap');
}

bootstrap().catch((err) => {
  console.error('应用启动失败:', err);
  process.exit(1);
});
