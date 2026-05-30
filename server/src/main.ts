import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    methods: ["GET", "OPTIONS"]
  });

  const port = Number(process.env.PORT ?? 8097);
  await app.listen(port, "0.0.0.0");
}

void bootstrap();
