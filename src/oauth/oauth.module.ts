import { FactoryProvider, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Auth, google } from "googleapis";

import { SessionModule } from "~session";
import { AuthModule } from "~auth";
import { JwtModule } from "~jwt";

import { OauthController } from "./oauth.controller";
import { GoogleOAuthStrategy } from "./strategies";
import { OauthService } from "./oauth.service";
import { OAuthFactory } from "./factories";
import { OAUTH_CLIENT } from "./constants";

@Module({
  imports: [AuthModule, JwtModule, SessionModule],
  providers: [
    {
      provide: OAUTH_CLIENT,
      useFactory: (configService: ConfigService) =>
        new google.auth.OAuth2(configService.get<string>("OAUTH_CLIENT_ID"), configService.get<string>("OAUTH_CLIENT_SECRET"), configService.get<string>("OAUTH_CALLBACK_URL")),
      inject: [ConfigService],
    } as FactoryProvider<Auth.OAuth2Client>,
    GoogleOAuthStrategy,
    OAuthFactory,
    OauthService,
  ],
  exports: [GoogleOAuthStrategy, OAuthFactory],
  controllers: [OauthController],
})
export class OauthModule {}
