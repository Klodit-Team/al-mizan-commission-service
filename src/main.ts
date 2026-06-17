import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Health check
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/health', (_req: any, res: any) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Swagger (no Bearer auth - handled by API Gateway via session cookies)
  const config = new DocumentBuilder()
    .setTitle('Commission Service API')
    .setDescription(
      "API de gestion des Commissions d'Évaluation et de Marché - Al-Mizan",
    )
    .setVersion('1.0')
    .addServer('http://localhost:8007', 'Local (dev direct)')
    .addServer('/api/commission', 'Via API Gateway')
    .addTag('commission-evaluation', "Gestion des commissions d'évaluation")
    .addTag('commission-marche', 'Gestion des commissions de marché')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT ?? 8007;
  await app.listen(port);
  console.log(`Commission Service lancé sur http://localhost:${port}`);
  console.log(`Swagger UI disponible sur http://localhost:${port}/api/docs`);
}
bootstrap();
