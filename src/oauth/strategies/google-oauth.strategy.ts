import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { UserAgent } from "@duongtrungnguyen/micro-commerce";
import { Auth, google } from "googleapis";
import { I18nService } from "nestjs-i18n";
import { v4 as uuid } from "uuid";

import { SessionService } from "~session";
import { AccountService } from "~account";
import { AuthService } from "~auth";
import { JwtService } from "~jwt";

import { OAuthStrategy } from "../interfaces";
import { OAUTH_CLIENT } from "../constants";
import { EOAuthScopes } from "../enums";

@Injectable()
export class GoogleOAuthStrategy implements OAuthStrategy {
  constructor(
    @Inject(OAUTH_CLIENT) private readonly googleClient: Auth.OAuth2Client,
    private readonly accountService: AccountService,
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
    private readonly jwtService: JwtService,
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

    const email: string | undefined | null = userInfo.data.email;
    if (!email) {
      throw new UnauthorizedException(this.i18nService.t("auth.no-google-email"));
    }

    const account = await this.accountService.get([{ email }], { select: ["id"] });

    let accountId: string = account?.id || "";

    if (!account) {
      const newUser = await this.authService._firstTimeRegister({
        fullName: userInfo.data.name ?? "Unknown",
        email,
        password: "-",
        phoneNumber: me.data.phoneNumbers?.[0]?.value ?? "",
      });

      accountId = newUser.id;
    }

    const jit: string = uuid();
    const token: string = this.jwtService.generateToken({ sub: accountId, jit });

    await this.sessionService.createSession({
      accountId,
      jit,
      ip,
      userAgent,
    });

    return token;
  }
}
