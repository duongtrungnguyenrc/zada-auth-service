import { GlobalExceptionsFilter } from "@duongtrungnguyen/micro-commerce";
import { createNestroApplication } from "@duongtrungnguyen/nestro";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { I18nService } from "nestjs-i18n";

import { AppModule } from "./app.module";

async function bootstrap() {
  const configService: ConfigService = new ConfigService();

  const app = await createNestroApplication(AppModule, {
    server: {
      host: configService.getOrThrow<string>("NESTRO_HOST"),
      port: configService.getOrThrow<number>("NESTRO_PORT"),
    },
    client: {
      name: configService.getOrThrow<string>("SERVICE_NAME"),
    },
  });

  const i18nService = app.get<I18nService>(I18nService);

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new GlobalExceptionsFilter(i18nService));

  await app.listen();
}
bootstrap();
