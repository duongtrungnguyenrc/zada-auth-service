import { ApiBadRequestResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags, ApiTemporaryRedirectResponse } from "@nestjs/swagger";
import { BadRequestExceptionVM, IpAddress, RequestAgent, UserAgent } from "@duongtrungnguyen/micro-commerce";
import { Controller, Get, Post, Query, Res } from "@nestjs/common";
import { I18nService } from "nestjs-i18n";
import { Response } from "express";

import { OauthService } from "./oauth.service";
import { GetOAuthResponseVM } from "./vms";
import { EOauthProvider } from "./enums";

@ApiTags("Oauth")
@Controller("oauth")
export class OauthController {
  constructor(
    private readonly oauthService: OauthService,
    private readonly i18nService: I18nService,
  ) {}

  @Get("oauth")
  @ApiOperation({ summary: "Get OAuth2 login URL" })
  @ApiQuery({ name: "provider", enum: EOauthProvider })
  @ApiOkResponse({ description: "OAuth URL generated", type: GetOAuthResponseVM })
  @ApiBadRequestResponse({ description: "Unsupported provider", type: BadRequestExceptionVM })
  getOauthUrl(@Query("provider") provider: EOauthProvider): GetOAuthResponseVM {
    const url = this.oauthService.getOauthUrl(provider);

    return {
      message: this.i18nService.t("auth.get-oauth-success"),
      data: url,
    };
  }

  @Post("oauth")
  @ApiOperation({ summary: "Handle OAuth2 callback" })
  @ApiQuery({ name: "provider", enum: EOauthProvider })
  @ApiQuery({ name: "code", type: String })
  @ApiTemporaryRedirectResponse({ description: "Oauth success. Redirect to client" })
  async oauthCallback(
    @Query("provider") provider: EOauthProvider,
    @Query("code") code: string,
    @IpAddress() ip: string,
    @RequestAgent() userAgent: UserAgent,
    @Res() response: Response,
  ): Promise<void> {
    const redirectUrl = await this.oauthService.handleOAuthCallback(provider, code, ip, userAgent);

    return response.redirect(redirectUrl);
  }
}
