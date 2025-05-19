import { AcceptLanguageResolver, I18nModule } from "nestjs-i18n";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { CacheModule } from "@nestjs/cache-manager";
import { TypeOrmModule } from "@nestjs/typeorm";
import { createKeyv } from "@keyv/redis";
import { Module } from "@nestjs/common";
import * as path from "path";

import { NatsClientModule } from "~nats-client";
import { AuthModule } from "~auth";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        stores: [createKeyv(configService.getOrThrow<string>("REDIS_URL"))],
        ttl: configService.getOrThrow<number>("CACHE_TTL"),
      }),
      inject: [ConfigService],
      isGlobal: true,
    }),
    I18nModule.forRoot({
      fallbackLanguage: "en",
      loaderOptions: {
        path: path.join(__dirname, "i18n"),
        watch: true,
      },
      resolvers: [AcceptLanguageResolver],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        host: configService.get<string>("POSTGRES_HOST"),
        port: configService.get<number>("POSTGRES_PORT"),
        username: configService.get<string>("POSTGRES_USER"),
        password: configService.get<string>("POSTGRES_PASSWORD"),
        database: configService.get<string>("POSTGRES_DB"),
        entities: [path.join(__dirname, "**", "*.entity{.ts,.js}")],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    NatsClientModule,
    AuthModule,
  ],
})
export class AppModule {}
