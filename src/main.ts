import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Application, Request, Response } from 'express';
import { AppModule } from './app.module';
import { buildSwaggerUiHtml } from './common/swagger/swagger-ui';

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

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Dev tools API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    ui: false,
  });

  const expressApp = app.getHttpAdapter().getInstance() as Application;
  expressApp.get('/docs', (_request: Request, response: Response) => {
    response.type('text/html').send(buildSwaggerUiHtml('/docs-json'));
  });

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
  console.log(`API: http://localhost:${port}/api`);
  console.log(`Swagger: http://localhost:${port}/docs`);
}

void bootstrap();
