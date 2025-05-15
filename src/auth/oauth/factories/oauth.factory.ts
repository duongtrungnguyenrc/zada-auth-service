import { Injectable } from "@nestjs/common";

import { GoogleOAuthStrategy } from "../strategies";
import { OAuthStrategy } from "../interfaces";
import { EOauthProvider } from "../enums";

@Injectable()
export class OAuthStrategyFactory {
  constructor(private readonly googleOAuthStrategy: GoogleOAuthStrategy) {}

  getStrategy(provider: EOauthProvider): OAuthStrategy {
    switch (provider) {
      case EOauthProvider.google:
        return this.googleOAuthStrategy;
      default:
        throw new Error("Unsupported OAuth provider");
    }
  }
}
