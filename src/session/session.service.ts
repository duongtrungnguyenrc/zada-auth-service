import { RepositoryService } from "@duongtrungnguyen/micro-commerce";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { FindOptionsWhere, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { I18nService } from "nestjs-i18n";

import { CreateSessionDto } from "./dtos";
import { SessionEntity } from "./entities";
import { ISession } from "./interfaces";

@Injectable()
export class SessionService extends RepositoryService<SessionEntity> {
  constructor(
    @InjectRepository(SessionEntity) sessionRepository: Repository<SessionEntity>,
    private readonly i18nService: I18nService,
  ) {
    super(sessionRepository);
  }

  async createSession(data: CreateSessionDto): Promise<ISession> {
    const expiresAt = new Date();

    expiresAt.setDate(expiresAt.getDate() + 14);

    return await this.create({
      ...data,
      expiresAt,
    });
  }

  async updateSession(filter: FindOptionsWhere<SessionEntity>, updates: Partial<ISession>) {
    const session = await this.getOrThrow(filter, { notFoundMessage: this.i18nService.t("auth.session-not-found") });

    const now = new Date();

    if (!session.expiresAt || session.expiresAt < now) {
      throw new UnauthorizedException(this.i18nService.t("auth.session-expired"));
    }

    return await this.repository.save({
      ...session,
      ...updates,
    });
  }
}
