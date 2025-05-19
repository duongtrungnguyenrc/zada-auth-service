import { Injectable } from "@nestjs/common";
import { UserAgent } from "@duongtrungnguyen/micro-commerce";
import { ConfigService } from "@nestjs/config";

import { OAuthFactory } from "./factories";
import { OAuthStrategy } from "./interfaces";
import { EOauthProvider } from "./enums";

@Injectable()
export class OauthService {
  constructor(
    private readonly oauthFactory: OAuthFactory,
    private readonly configService: ConfigService,
  ) {}

  getOauthUrl(provider: EOauthProvider): string {
    const oauthStrategy: OAuthStrategy = this.oauthFactory.getStrategy(provider);

    return oauthStrategy.getAuthUrl();
  }

  async handleOAuthCallback(provider: EOauthProvider, code: string, ip: string, userAgent: UserAgent): Promise<string> {
    const strategy: OAuthStrategy = this.oauthFactory.getStrategy(provider);

    const token: string = await strategy.handleCallback(code, ip, userAgent);
    const clientBaseUrl: string = this.configService.getOrThrow<string>("CLIENT_BASE_URL");
    const oauthWebhooksPath: string = this.configService.getOrThrow<string>("OAUTH_WEBHOOKS_PATH");

    return `${clientBaseUrl}/${oauthWebhooksPath}?token=${token}`;
  }
}
