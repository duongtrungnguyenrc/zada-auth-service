import { Injectable, BadRequestException } from "@nestjs/common";

import { GoogleOAuthStrategy } from "../strategies";
import { OAuthStrategy } from "../interfaces";
import { EOauthProvider } from "../enums";

@Injectable()
export class OAuthFactory {
  constructor(private readonly googleOAuthStrategy: GoogleOAuthStrategy) {}

  getStrategy(provider: EOauthProvider): OAuthStrategy {
    switch (provider) {
      case EOauthProvider.google:
        return this.googleOAuthStrategy;
      default:
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        throw new BadRequestException(`Unsupported ${provider} provider`);
    }
  }
}
