import { InjectRepository } from "@nestjs/typeorm";
import { Injectable, NotFoundException } from "@nestjs/common";
import { FindOptionsWhere, Repository } from "typeorm";
import { I18nService } from "nestjs-i18n";

import { CreateAccountDto, UpdateAccountDto } from "./dtos";
import { AccountEntity } from "./entities";
import { AccountVM } from "./vms";

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(AccountEntity) private readonly accountRepository: Repository<AccountEntity>,
    private readonly i18nService: I18nService,
  ) {}

  async create(data: CreateAccountDto): Promise<AccountVM> {
    const account = this.accountRepository.create(data);

    return await this.accountRepository.save(account);
  }

  async get(where: FindOptionsWhere<AccountEntity> | FindOptionsWhere<AccountEntity>[], select?: (keyof AccountEntity)[]): Promise<AccountVM | null> {
    return await this.accountRepository.findOne({ where, select });
  }

  async update(where: FindOptionsWhere<AccountEntity> | FindOptionsWhere<AccountEntity>[], updates: UpdateAccountDto): Promise<AccountVM> {
    const accountCount = await this.accountRepository.count({ where });

    if (accountCount === 0) throw new NotFoundException(this.i18nService.t("account.not-found"));

    return await this.accountRepository.save(updates);
  }

  async delete(where: FindOptionsWhere<AccountEntity> | FindOptionsWhere<AccountEntity>[]): Promise<boolean> {
    const result = await this.accountRepository.delete(where);

    if (result?.affected === 0) throw new NotFoundException(this.i18nService.t("account.not-found"));

    return true;
  }
}
