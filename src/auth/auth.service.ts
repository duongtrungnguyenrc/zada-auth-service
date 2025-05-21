import { ConflictException, Inject, Injectable, NotAcceptableException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { JwtPayload, UserAgent } from "@duongtrungnguyen/micro-commerce";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { ClientProxy } from "@nestjs/microservices";
import { compare, genSalt, hash } from "bcrypt";
import { ConfigService } from "@nestjs/config";
import { I18nService } from "nestjs-i18n";
import { Cache } from "cache-manager";
import { v4 as uuid } from "uuid";

import { UserVM, UserClientService, GetUserRequest, UserResponse } from "~user-client";
import { AccountService, AccountVM } from "~account";
import { SessionService } from "~/session";
import { NATS_CLIENT } from "~nats-client";
import { JwtService } from "~/jwt";

import { ForgotPasswordDto, UpdatePasswordDto, LoginDto, RegisterAccountDto, ResetPasswordDto, VerifyAccountDto } from "./dtos";
import { ForgotPasswordSession, VerifyAccountStatus, VerifyAccountSession } from "./types";
import { LoginVM } from "./vms";

@Injectable()
export class AuthService {
  constructor(
    @Inject(NATS_CLIENT) private readonly natsClient: ClientProxy,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly userClientService: UserClientService,
    private readonly accountService: AccountService,
    private readonly sessionService: SessionService,
    private readonly configService: ConfigService,
    private readonly i18nService: I18nService,
    private readonly jwtService: JwtService,
  ) {}

  async register(data: RegisterAccountDto): Promise<AccountVM> {
    /* Check user collision */
    const existingUser = await this.accountService.get([{ email: data.email }, { phoneNumber: data.phoneNumber }], { select: ["id", "email", "phoneNumber"] });

    if (existingUser?.email === data.email) {
      throw new ConflictException(this.i18nService.t("auth.email-used"));
    }

    if (existingUser?.phoneNumber === data.phoneNumber) {
      throw new ConflictException(this.i18nService.t("auth.phone-used"));
    }

    return await this._firstTimeRegister(data);
  }

  async login(data: LoginDto, ip: string, userAgent: UserAgent): Promise<LoginVM> {
    const account = await this.accountService.getOrThrow([{ email: data.email }], {
      select: ["id", "passwordHash", "willDeleteTime"],
      notFoundMessage: this.i18nService.t("auth.user-not-found"),
    });

    if (!account.willDeleteTime) {
      throw new UnauthorizedException(this.i18nService.t("auth.user-inactive"));
    }

    const matchPassword: boolean = await compare(data.password, account.passwordHash);

    if (!matchPassword) {
      throw new UnauthorizedException(this.i18nService.t("auth.invalid-login"));
    }

    const jit: string = uuid();

    const token: string = this.jwtService.generateToken({
      sub: account.id,
      jit,
    });

    await this.sessionService.createSession({
      accountId: account.id,
      jit,
      ip,
      userAgent,
    });

    return {
      token,
    };
  }

  async logOut(oldToken: string): Promise<void> {
    const payload: JwtPayload | null = await this.jwtService.verifyToken(oldToken);

    if (!payload) {
      throw new UnauthorizedException(this.i18nService.t("auth.no-auth"));
    }

    const { sub: accountId, jit } = payload;

    await Promise.all([
      this.sessionService.updateSession(
        {
          jit,
          accountId,
        },
        {
          expiresAt: null,
        },
      ),
      this.jwtService.revokeToken(payload),
    ]);
  }

  async refreshToken(oldToken: string, ip: string, userAgent: UserAgent): Promise<LoginVM> {
    if (!oldToken) {
      throw new UnauthorizedException(this.i18nService.t("auth.no-auth"));
    }

    const payload: JwtPayload | null = await this.jwtService.verifyToken(oldToken);

    if (!payload) {
      throw new UnauthorizedException(this.i18nService.t("auth.no-auth"));
    }

    const { sub: accountId, jit } = payload;

    const newJit: string = uuid();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    await this.sessionService.updateSession(
      { jit, accountId },
      {
        jit: newJit,
        expiresAt: expiresAt,
        ip: ip,
        userAgent: userAgent,
      },
    );

    const newToken: string = this.jwtService.generateToken({ sub: accountId, jit: newJit });
    await this.jwtService.revokeToken(payload);

    return {
      token: newToken,
    };
  }

  async requestVerifyAccount(accountId: string, ip: string): Promise<boolean> {
    const { data: user } = await this.userClientService.call<GetUserRequest, UserResponse>("get", {
      filters: [{ id: accountId }],
      select: ["id", "email", "fullName"],
    });

    if (!user) {
      throw new NotFoundException(this.i18nService.t("user.not-found"));
    }

    const otp: string = this._generateOtp();
    const sessionId: string = uuid();

    await this.cacheManager.set<VerifyAccountSession>(`otp:verify-user:${sessionId}`, { otp, accountId: accountId, ip }, 15 * 60 * 1000);

    this.natsClient.emit("noti.email.verify-account", {
      otp,
      sessionId,
      email: user.email,
      fullName: user.fullName,
    });

    return true;
  }

  async verifyAccount(data: VerifyAccountDto, ip: string, newUser?: UserVM): Promise<VerifyAccountStatus> {
    const cachedSession: ForgotPasswordSession | null = await this.cacheManager.get<ForgotPasswordSession>(`otp:verify-account:${data.sessionId}`);

    if (!cachedSession) {
      throw new NotAcceptableException(this.i18nService.t("auth.no-verify-account-found"));
    }

    if (!(ip === cachedSession.ip)) {
      throw new NotAcceptableException(this.i18nService.t("auth.invalid-ip"));
    }

    if (!(data.otp === cachedSession.otp)) {
      throw new NotAcceptableException(this.i18nService.t("auth.otp-incorrect"));
    }

    await this.accountService.update({ id: cachedSession.accountId }, { isVerified: true });

    if (newUser) {
      this.natsClient.emit("noti.email.new-account", {
        userName: newUser.fullName,
        email: newUser.email,
      });

      return "register-success";
    }

    return "verify-account-success";
  }

  async forgotPassword(data: ForgotPasswordDto, ip: string): Promise<boolean> {
    const { data: user } = await this.userClientService.call<GetUserRequest, UserResponse>("get", {
      filters: [{ id: data.accountId }],
      select: ["id", "email", "fullName"],
    });

    if (!user) {
      throw new NotFoundException(this.i18nService.t("user.not-found"));
    }

    const otp: string = this._generateOtp();
    const sessionId: string = uuid();

    await this.cacheManager.set<ForgotPasswordSession>(`otp:reset-password:${sessionId}`, { otp, accountId: user.id, ip }, 15 * 60 * 1000);

    this.natsClient.emit("noti.email.reset-password", {
      otp,
      sessionId,
      email: user.email,
      fullName: user.fullName,
    });

    return true;
  }

  async resetPassword(data: ResetPasswordDto, ip: string): Promise<boolean> {
    const cachedSession: ForgotPasswordSession | null = await this.cacheManager.get<ForgotPasswordSession>(`otp:reset-password:${data.sessionId}`);

    if (!cachedSession) {
      throw new NotAcceptableException(this.i18nService.t("auth.no-reset-password-found"));
    }

    if (!(ip === cachedSession.ip)) {
      throw new NotAcceptableException(this.i18nService.t("auth.invalid-ip"));
    }

    if (!(data.otp === cachedSession.otp)) {
      throw new NotAcceptableException(this.i18nService.t("auth.otp-incorrect"));
    }

    await this.accountService.update({ id: cachedSession.accountId }, { passwordHash: await this._hashPassword(data.newPassword) });

    return true;
  }

  async updatePassword(accountId: string, data: UpdatePasswordDto): Promise<boolean> {
    const account = await this.accountService.getOrThrow([{ id: accountId }], { select: ["passwordHash"], notFoundMessage: this.i18nService.t("auth.user-not-found") });

    const isPasswordMatch = await compare(account.passwordHash, data.password);

    if (isPasswordMatch) {
      throw new NotAcceptableException(this.i18nService.t("auth.wrong-password"));
    }

    await this.accountService.update({ id: accountId }, { passwordHash: await this._hashPassword(data.newPassword) });

    return true;
  }

  /* Internal support methods */

  async _firstTimeRegister(data: RegisterAccountDto): Promise<AccountVM> {
    const { password, ...user } = data;

    const createdAccount = await this.accountService.create({
      email: user.email,
      phoneNumber: user.phoneNumber,
      passwordHash: await this._hashPassword(password),
    });

    /* Sync data with user service */
    this.natsClient.emit("user.create", user);

    return createdAccount;
  }

  private _generateOtp(): string {
    return Array(6)
      .fill(0)
      .map(() => Math.floor(Math.random() * 10))
      .join("");
  }

  private async _hashPassword(originalPassword: string): Promise<string> {
    const salt = await genSalt(5);

    return await hash(originalPassword, salt);
  }
}
