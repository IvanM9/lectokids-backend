import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import compression from 'compression';
import { LoggerFactory } from './libs/LoggerFactory';
import { ENVIRONMENT } from './shared/constants/environment';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: LoggerFactory('LectoKids'),
  });
  const config = new DocumentBuilder()
    .setTitle('Lectokids API')
    .setDescription('Documentación de la API de Lectokids')
    .setContact(
      'Iván Manzaba',
      'https://ivan-manzaba.vercel.app',
      'mauricio.9.inm@gmail.com',
    )
    .addServer('/api')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  app.enableCors({
    origin: ENVIRONMENT.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.use(compression());

  app.use('/api', helmet());

  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
  await app.listen(ENVIRONMENT.PORT);
}
bootstrap();
