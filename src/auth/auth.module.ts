import { Module } from "@nestjs/common";

import { UserClientModule } from "~user-client";
import { SessionModule } from "~/session";
import { JwtModule } from "~/jwt";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
  imports: [JwtModule, SessionModule, UserClientModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
