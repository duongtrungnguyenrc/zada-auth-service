import { AuthToken, AuthTokenPayload, IpAddress, RequestAgent, UserAgent } from "@duongtrungnguyen/micro-commerce";
import { Body, Controller, Get, HttpCode, Post, Query, Res } from "@nestjs/common";
import { Response } from "express";

import { EOauthProvider } from "~auth/oauth";
import { CreateUserDto } from "~user-client";

import { ForgotPasswordDto, LoginDto, ResetPasswordDto, VerifyAccountDto } from "./dtos";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async register(@Body() data: CreateUserDto, @IpAddress() ip: string, @Res() response: Response) {
    return await this.authService.register(data, ip, response);
  }

  @Post("login")
  @HttpCode(200)
  async login(@Body() data: LoginDto, @IpAddress() ip: string, @RequestAgent() userAgent: UserAgent) {
    return await this.authService.login(data, ip, userAgent);
  }

  @Post("logout")
  async logOut(@AuthToken() token: string) {
    return await this.authService.logOut(token);
  }

  @Post("refresh-token")
  async refreshToken(@AuthToken() oldToken: string, @IpAddress() ip: string, @RequestAgent() userAgent: UserAgent) {
    return this.authService.refreshToken(oldToken, ip, userAgent);
  }

  @Post("forgot-password")
  async forgotPassword(@Body() data: ForgotPasswordDto, @IpAddress() ip: string) {
    return this.authService.forgotPassword(data, ip);
  }

  @Post("reset-password")
  async resetPassword(@Body() data: ResetPasswordDto, @IpAddress() ip: string) {
    return this.authService.resetPassword(data, ip);
  }

  @Post("request-verify-account")
  async requestVerifyAccount(@AuthTokenPayload("sub") userId: string, @IpAddress() ip: string) {
    return await this.authService.requestVerifyAccount(userId, ip);
  }

  @Post("verify-account")
  async verifyAccount(@Body() data: VerifyAccountDto, @IpAddress() ip: string) {
    return await this.authService.verifyAccount(data, ip);
  }

  @Get("oauth")
  getOauthUrl(@Query("provider") provider: EOauthProvider) {
    return this.authService.getOauthUrl(provider);
  }

  @Post("oauth")
  async oauthCallback(
    @Query("provider") provider: EOauthProvider,
    @Query("code") code: string,
    @IpAddress() ip: string,
    @RequestAgent() userAgent: UserAgent,
    @Res() response: Response,
  ) {
    return this.authService.handleOAuthCallback(provider, code, ip, userAgent, response);
  }
}
