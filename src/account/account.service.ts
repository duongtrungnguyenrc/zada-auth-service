import { RepositoryService } from "@duongtrungnguyen/micro-commerce";
import { InjectRepository } from "@nestjs/typeorm";
import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";

import { AccountEntity } from "./entities";

@Injectable()
export class AccountService extends RepositoryService<AccountEntity> {
  constructor(@InjectRepository(AccountEntity) accountRepository: Repository<AccountEntity>) {
    super(accountRepository);
  }
}
