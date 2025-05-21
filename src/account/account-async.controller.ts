import { MessagePattern } from "@nestjs/microservices";
import { Controller } from "@nestjs/common";

import { AccountService } from "./account.service";
import { UpdateAccountAsyncDto } from "./dtos";

@Controller()
export class AccountAsyncController {
  constructor(private readonly accountService: AccountService) {}

  @MessagePattern("auth.account.update")
  async updateAccountAsync(data: UpdateAccountAsyncDto) {
    return await this.accountService.update({ id: data.id }, data.updates);
  }
}
