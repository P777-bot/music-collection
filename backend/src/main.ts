import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { loadProjectEnvironment } from './config/load-env';
import { createOriginCheck } from './auth/origin-check';

async function bootstrap() {
  loadProjectEnvironment();
  const app = await NestFactory.create(AppModule);
  const frontendOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:4200';

  app.use(createOriginCheck(frontendOrigin));

  app.enableCors({
    origin: frontendOrigin,
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
