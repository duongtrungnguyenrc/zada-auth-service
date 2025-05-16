import { Injectable, UnauthorizedException } from "@nestjs/common";
import { FindOptionsWhere, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { I18nService } from "nestjs-i18n";

import { CreateSessionDto } from "./dtos";
import { SessionEntity } from "./entities";
import { ISession } from "./interfaces";

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(SessionEntity) private readonly sessionRepository: Repository<SessionEntity>,
    private readonly i18nService: I18nService,
  ) {}

  async createSession(data: CreateSessionDto): Promise<ISession> {
    const expiresAt = new Date();

    expiresAt.setDate(expiresAt.getDate() + 14);

    const session = this.sessionRepository.create({
      ...data,
      expiresAt,
    });

    return await this.sessionRepository.save(session);
  }

  async updateSession(filter: FindOptionsWhere<SessionEntity>, updates: Partial<ISession>) {
    const session = await this.sessionRepository.findOneBy(filter);

    if (!session) {
      throw new UnauthorizedException(this.i18nService.t("auth.session-not-found"));
    }

    const now = new Date();

    if (!session.expiresAt || session.expiresAt < now) {
      throw new UnauthorizedException(this.i18nService.t("auth.session-expired"));
    }

    return await this.sessionRepository.save({
      ...session,
      ...updates,
    });
  }
}
