import { createNestroApplication } from "@duongtrungnguyen/nestro";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { I18nMiddleware } from "nestjs-i18n";

import { AppModule } from "~app.module";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";

async function bootstrap() {
  const configService: ConfigService = new ConfigService();

  const app = await createNestroApplication(AppModule, {
    server: {
      host: configService.getOrThrow<string>("NESTRO_HOST"),
      port: configService.getOrThrow<number>("NESTRO_PORT"),
    },
    client: {
      name: configService.getOrThrow<string>("SERVICE_NAME"),
      host: configService.getOrThrow<string>("SERVICE_HOST"),
    },
  });

  app.use(I18nMiddleware);
  app.useGlobalPipes(new ValidationPipe({}));
  app.setGlobalPrefix("auth");

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options: {
      servers: [configService.getOrThrow<string>("NATS_URL")],
    },
  });

  const documentConfig = new DocumentBuilder().build();
  const swaggerDocument = SwaggerModule.createDocument(app, documentConfig);

  SwaggerModule.setup("api", app, swaggerDocument, {
    jsonDocumentUrl: "api-docs-json",
  });

  app.startAllMicroservices();
  await app.listen();
}
bootstrap();
