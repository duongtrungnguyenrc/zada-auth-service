import { ConflictException, Inject, Injectable, InternalServerErrorException, NotAcceptableException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { JwtPayload, UserAgent } from "@duongtrungnguyen/micro-commerce";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { ClientProxy } from "@nestjs/microservices";
import { compare, genSalt, hash } from "bcrypt";
import { ConfigService } from "@nestjs/config";
import { I18nService } from "nestjs-i18n";
import { Cache } from "cache-manager";
import { v4 as uuid } from "uuid";

import { UserVM, UserClientService, GetUserRequest, UpdateUserRequest, CreateUserRequest, UserResponse } from "~user-client";
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
    private readonly sessionService: SessionService,
    private readonly configService: ConfigService,
    private readonly i18nService: I18nService,
    private readonly jwtService: JwtService,
  ) {}

  async register(data: RegisterAccountDto, ip: string): Promise<string> {
    const { data: existingUser } = await this.userClientService.call<GetUserRequest, UserResponse>("get", {
      filter: { email: data.email },
      select: ["id"],
    });

    if (existingUser) {
      throw new ConflictException(this.i18nService.t("auth.user-existed"));
    }

    const { password, ...restUser } = data;

    const { data: createdUser } = await this.userClientService.call<CreateUserRequest, UserResponse>("create", {
      data: { ...restUser, passwordHash: await this._hashPassword(password) },
    });

    if (!createdUser) {
      throw new InternalServerErrorException(this.i18nService.t("auth.register-failed"));
    }

    await this.requestVerifyAccount(createdUser.id, ip);

    const clientBaseUrl: string = this.configService.getOrThrow<string>("CLIENT_BASE_URL");
    const accountVerifyPath: string = this.configService.getOrThrow<string>("ACCOUNT_VERIFY_PATH");

    return `${clientBaseUrl}/${accountVerifyPath}?userId=${createdUser.id}`;
  }

  async login(data: LoginDto, ip: string, userAgent: UserAgent): Promise<LoginVM> {
    const { data: user } = await this.userClientService.call<GetUserRequest, UserResponse>("get", {
      filter: { email: data.email },
      select: ["id", "passwordHash", "isActive"],
    });

    if (!user) {
      throw new UnauthorizedException(this.i18nService.t("auth.user-not-found"));
    }

    if (!user.isActive) {
      throw new UnauthorizedException(this.i18nService.t("auth.user-inactive"));
    }

    const matchPassword: boolean = await compare(data.password, user.passwordHash);

    if (!matchPassword) {
      throw new UnauthorizedException(this.i18nService.t("auth.invalid-login"));
    }

    const jit: string = uuid();

    const token: string = this.jwtService.generateToken({
      sub: user.id,
      jit,
    });

    await this.sessionService.createSession({
      userId: user.id,
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

    const { sub: userId, jit } = payload;

    await Promise.all([
      this.sessionService.updateSession(
        {
          jit,
          userId,
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

    const { sub: userId, jit } = payload;

    const newJit: string = uuid();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    await this.sessionService.updateSession(
      { jit, userId },
      {
        jit: newJit,
        expiresAt: expiresAt,
        ip: ip,
        userAgent: userAgent,
      },
    );

    const newToken: string = this.jwtService.generateToken({ sub: userId, jit: newJit });
    await this.jwtService.revokeToken(payload);

    return {
      token: newToken,
    };
  }

  async requestVerifyAccount(userId: string, ip: string): Promise<boolean> {
    const { data: user } = await this.userClientService.call<GetUserRequest, UserResponse>("get", {
      filter: { id: userId },
      select: ["id", "email", "fullName"],
    });

    if (!user) {
      throw new NotFoundException(this.i18nService.t("user.not-found"));
    }

    const otp: string = this._generateOtp();
    const sessionId: string = uuid();

    await this.cacheManager.set<VerifyAccountSession>(`otp:verify-user:${sessionId}`, { otp, userId: userId, ip }, 15 * 60 * 1000);

    this.natsClient.emit("noti.email.verify-account", {
      otp,
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

    await this.userClientService.call<UpdateUserRequest, UserResponse>("update", {
      filter: { id: cachedSession.userId },
      updates: {
        isVerified: true,
      },
    });

    if (newUser) {
      this.natsClient.emit("noti.email.new-user", {
        userName: newUser.fullName,
        email: newUser.email,
      });

      return "register-success";
    }

    return "verify-account-success";
  }

  async forgotPassword(data: ForgotPasswordDto, ip: string): Promise<boolean> {
    const { data: user } = await this.userClientService.call<GetUserRequest, UserResponse>("get", {
      filter: { id: data.userId },
      select: ["id", "email", "fullName"],
    });

    if (!user) {
      throw new NotFoundException(this.i18nService.t("user.not-found"));
    }

    const otp: string = this._generateOtp();
    const sessionId: string = uuid();

    await this.cacheManager.set<ForgotPasswordSession>(`otp:reset-password:${sessionId}`, { otp, userId: user.id, ip }, 15 * 60 * 1000);

    this.natsClient.emit("noti.email.reset-password", {
      otp,
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

    await this.userClientService.call<UpdateUserRequest, UserResponse>("update", {
      filter: { id: cachedSession.userId },
      updates: {
        passwordHash: await this._hashPassword(data.newPassword),
      },
    });

    return true;
  }

  async updatePassword(userId: string, data: UpdatePasswordDto): Promise<boolean> {
    const { data: user } = await this.userClientService.call<GetUserRequest, UserResponse>("get", { filter: { id: userId }, select: ["passwordHash"] });

    if (!user) {
      throw new NotAcceptableException(this.i18nService.t("auth.user-not-found"));
    }

    const isPasswordMatch = await compare(user.passwordHash, data.password);

    if (isPasswordMatch) {
      throw new NotAcceptableException(this.i18nService.t("auth.wrong-password"));
    }

    await this.userClientService.call<UpdateUserRequest, UserResponse>("update", {
      filter: { id: userId },
      updates: {
        passwordHash: await this._hashPassword(data.newPassword),
      },
    });

    return true;
  }

  /* Internal support methods */

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
