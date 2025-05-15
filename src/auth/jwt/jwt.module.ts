import { JwtModule as NestJwtModule } from "@nestjs/jwt";
import { Module } from "@nestjs/common";

import { JwtService } from "./jwt.service";
import { ConfigService } from "@nestjs/config";

@Module({
  imports: [
    NestJwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: configService.getOrThrow<string>("JWT_EXPIRES_TIME"),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [JwtService],
  exports: [JwtService],
})
export class JwtModule {}
