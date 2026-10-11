import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { loadProjectEnvironment } from './config/load-env';

async function bootstrap() {
  loadProjectEnvironment();
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:4200',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
