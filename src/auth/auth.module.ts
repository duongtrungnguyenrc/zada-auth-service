import { Module } from "@nestjs/common";

import { UserClientModule } from "~user-client";
import { SessionModule } from "~auth/session";
import { OauthModule } from "~auth/oauth";
import { JwtModule } from "~auth/jwt";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
  imports: [JwtModule, SessionModule, UserClientModule, OauthModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
