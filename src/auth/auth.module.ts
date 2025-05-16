import { Module } from "@nestjs/common";

import { UserClientModule } from "~user-client";
import { SessionModule } from "~/session";
import { OauthModule } from "~/oauth";
import { JwtModule } from "~/jwt";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
  imports: [JwtModule, SessionModule, UserClientModule, OauthModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
