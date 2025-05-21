import { FindOptionsWhere } from "typeorm";

import { AccountEntity } from "../entities";

export class GetAccountDto {
  filter: FindOptionsWhere<AccountEntity> | FindOptionsWhere<AccountEntity>[];
  select?: (keyof AccountEntity)[];
}
