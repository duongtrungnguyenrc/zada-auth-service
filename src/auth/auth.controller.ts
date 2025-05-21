import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse, ApiBadRequestResponse } from "@nestjs/swagger";
import {
  AuthToken,
  AuthTokenPayload,
  BadRequestExceptionVM,
  HttpExceptionsFilter,
  HttpResponse,
  IpAddress,
  RequestAgent,
  ResponseVM,
  UnauthorizedExceptionVM,
  UserAgent,
} from "@duongtrungnguyen/micro-commerce";
import { Body, Controller, HttpCode, HttpStatus, Post, Put, UseFilters } from "@nestjs/common";
import { I18nService } from "nestjs-i18n";

import { ForgotPasswordDto, LoginDto, RegisterAccountDto, ResetPasswordDto, VerifyAccountDto, UpdatePasswordDto } from "./dtos";
import { LoginResponseVM, LoginVM } from "./vms";
import { AccountResponseVM } from "~account";
import { AuthService } from "./auth.service";

@ApiTags("Auth")
@Controller()
@UseFilters(HttpExceptionsFilter)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private i18nService: I18nService,
  ) {}

  @Post("register")
  @ApiOperation({ summary: "Register new user account" })
  @ApiBody({ type: RegisterAccountDto })
  @ApiCreatedResponse({ description: "Account registered successfully. Return accountInfo", type: AccountResponseVM })
  @ApiBadRequestResponse({ description: "Validation failed", type: BadRequestExceptionVM })
  async register(@Body() data: RegisterAccountDto): Promise<AccountResponseVM> {
    const { passwordHash: _, ...account } = await this.authService.register(data);

    return HttpResponse.created(this.i18nService.t("auth.register-success"), account);
  }

  @Post("login")
  @HttpCode(200)
  @ApiOperation({ summary: "Login with email and password" })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ description: "Login successful", type: LoginVM })
  @ApiUnauthorizedResponse({ description: "Invalid credentials", type: UnauthorizedExceptionVM })
  async login(@Body() data: LoginDto, @IpAddress() ip: string, @RequestAgent() userAgent: UserAgent): Promise<ResponseVM<LoginVM>> {
    const responseData = await this.authService.login(data, ip, userAgent);

    return HttpResponse.ok(this.i18nService.t("auth.login-success"), responseData);
  }

  @Post("logout")
  @ApiOperation({ summary: "Logout current user" })
  @ApiBearerAuth()
  @ApiOkResponse({ description: "Logout success", type: ResponseVM })
  @ApiUnauthorizedResponse({ description: "Missing auth token", type: UnauthorizedExceptionVM })
  async logOut(@AuthToken() token: string): Promise<ResponseVM> {
    await this.authService.logOut(token);

    return HttpResponse.ok(this.i18nService.t("auth.logout-success"));
  }

  @Post("refresh-token")
  @ApiOperation({ summary: "Refresh access token using old token" })
  @ApiBearerAuth()
  @ApiCreatedResponse({ description: "Token refreshed successfully", type: LoginResponseVM })
  @ApiUnauthorizedResponse({ description: "Missing old token", type: UnauthorizedExceptionVM })
  async refreshToken(@AuthToken() oldToken: string, @IpAddress() ip: string, @RequestAgent() userAgent: UserAgent): Promise<LoginResponseVM> {
    const responseData = await this.authService.refreshToken(oldToken, ip, userAgent);

    return HttpResponse.created(this.i18nService.t("auth.refresh-success"), responseData);
  }

  @Post("forgot-password")
  @ApiOperation({ summary: "Request password reset email" })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiCreatedResponse({ description: "Reset email sent", type: ResponseVM })
  @ApiBadRequestResponse({ description: "Invalid email", type: BadRequestExceptionVM })
  async forgotPassword(@Body() data: ForgotPasswordDto, @IpAddress() ip: string): Promise<ResponseVM> {
    await this.authService.forgotPassword(data, ip);

    return HttpResponse.created(this.i18nService.t("auth.forgot-password-success"));
  }

  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reset password" })
  @ApiBody({ type: ResetPasswordDto })
  @ApiOkResponse({ description: "Password reset successfully", type: ResponseVM })
  @ApiBadRequestResponse({ description: "Invalid token or password", type: BadRequestExceptionVM })
  async resetPassword(@Body() data: ResetPasswordDto, @IpAddress() ip: string): Promise<ResponseVM> {
    await this.authService.resetPassword(data, ip);

    return HttpResponse.ok(this.i18nService.t("auth.reset-password-success"));
  }

  @Put("password")
  @ApiOperation({ summary: "Update password" })
  @ApiBearerAuth()
  @ApiBody({ type: UpdatePasswordDto })
  @ApiOkResponse({ description: "Updated password success", type: ResponseVM })
  @ApiUnauthorizedResponse({ description: "Missing auth token", type: UnauthorizedExceptionVM })
  @ApiBadRequestResponse({ description: "Validation failed", type: BadRequestExceptionVM })
  async updatePassword(@AuthTokenPayload("sub") userId: string, @Body() data: UpdatePasswordDto): Promise<ResponseVM> {
    await this.authService.updatePassword(userId, data);

    return HttpResponse.ok(this.i18nService.t("auth.update-password-success"));
  }

  @Post("request-verify-account")
  @ApiOperation({ summary: "Send email to verify account" })
  @ApiBearerAuth()
  @ApiCreatedResponse({ description: "Verification email sent", type: ResponseVM })
  @ApiUnauthorizedResponse({ description: "Missing auth token", type: UnauthorizedExceptionVM })
  async requestVerifyAccount(@AuthTokenPayload("sub") userId: string, @IpAddress() ip: string): Promise<ResponseVM> {
    const result = await this.authService.requestVerifyAccount(userId, ip);

    return HttpResponse.created(this.i18nService.t(`auth.${result}`));
  }

  @Post("verify-account")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify account using verification code" })
  @ApiBearerAuth()
  @ApiBody({ type: VerifyAccountDto })
  @ApiOkResponse({ description: "Account verified successfully", type: ResponseVM })
  @ApiBadRequestResponse({ description: "Invalid or expired code", type: BadRequestExceptionVM })
  async verifyAccount(@Body() data: VerifyAccountDto, @IpAddress() ip: string): Promise<ResponseVM> {
    await this.authService.verifyAccount(data, ip);

    return HttpResponse.ok(this.i18nService.t("auth.verify-account-success"));
  }

  async requestActiveAccount() {}
}
