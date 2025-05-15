import { FactoryProvider, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Auth, google } from "googleapis";

import { UserClientModule } from "~user-client";
import { SessionModule } from "~auth/session";
import { JwtModule } from "~auth/jwt";

import { GoogleOAuthStrategy } from "./strategies";
import { OAuthStrategyFactory } from "./factories";
import { OAUTH_CLIENT } from "./constants";

@Module({
  imports: [UserClientModule, JwtModule, SessionModule],
  providers: [
    {
      provide: OAUTH_CLIENT,
      useFactory: (configService: ConfigService) =>
        new google.auth.OAuth2(
          configService.get<string>("OAUTH_CLIENT_ID"),
          configService.get<string>("OAUTH_CLIENT_SECRET"),
          configService.get<string>("OAUTH_CALLBACK_URL"),
        ),
      inject: [ConfigService],
    } as FactoryProvider<Auth.OAuth2Client>,
    GoogleOAuthStrategy,
    OAuthStrategyFactory,
  ],
  exports: [GoogleOAuthStrategy, OAuthStrategyFactory],
})
export class OauthModule {}
