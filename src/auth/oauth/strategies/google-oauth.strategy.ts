import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { UserAgent } from "@duongtrungnguyen/micro-commerce";
import { Auth, google } from "googleapis";
import { I18nService } from "nestjs-i18n";
import { v4 as uuid } from "uuid";

import { UserClientService } from "~user-client";
import { SessionService } from "~auth/session";
import { JwtService } from "~auth/jwt";

import { OAuthStrategy } from "../interfaces";
import { OAUTH_CLIENT } from "../constants";
import { EOAuthScopes } from "../enums";

@Injectable()
export class GoogleOAuthStrategy implements OAuthStrategy {
  constructor(
    @Inject(OAUTH_CLIENT) private readonly googleClient: Auth.OAuth2Client,
    private readonly userClientService: UserClientService,
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
    private readonly i18nService: I18nService,
  ) {}

  getAuthUrl(state?: string): string {
    return this.googleClient.generateAuthUrl({
      scope: [EOAuthScopes.USER_INFO_PROFILE, EOAuthScopes.USER_INFO_EMAIL],
      state: state ? Buffer.from(state).toString("base64") : undefined,
    });
  }

  async handleCallback(code: string, ip: string, userAgent: UserAgent): Promise<string> {
    const { tokens } = await this.googleClient.getToken(code);
    this.googleClient.setCredentials(tokens);

    const oauth2 = google.oauth2("v2");
    const userInfo = await oauth2.userinfo.get({ auth: this.googleClient });

    const people = google.people({ version: "v1", auth: this.googleClient });
    const me = await people.people.get({
      resourceName: "people/me",
      personFields: "phoneNumbers",
    });

    const email = userInfo.data.email;
    if (!email) {
      throw new UnauthorizedException(this.i18nService.t("auth.no-google-email"));
    }

    const user = await this.userClientService.call("getCredential", { email });

    let userId = user?.id;

    if (!user) {
      const newUser = await this.userClientService.call("create", {
        fullName: userInfo.data.name ?? "Unknown",
        email,
        password: "-",
        phoneNumber: me.data.phoneNumbers?.[0]?.value ?? "",
      });

      userId = newUser.id;
    }

    const jit = uuid();
    const token = this.jwtService.generateToken({ sub: userId, jit });

    await this.sessionService.createSession({
      userId,
      jit,
      ip,
      userAgent,
    });

    return token;
  }
}
