import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'node:path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const uploadDir = config.get<string>('UPLOAD_DIR', 'uploads');
  app.useStaticAssets(join(process.cwd(), uploadDir), { prefix: '/uploads/' });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('NestJS CRUD API')
    .setDescription(
      'JWT REST API for users, products, categories, blogs and uploads',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
  console.log(`API: http://localhost:${port}/api`);
  console.log(`Swagger: http://localhost:${port}/docs`);
}

void bootstrap();
