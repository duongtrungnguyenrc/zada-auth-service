import { Controller } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";
import { UpdateAccountAsyncDto } from "./dtos";
import { AccountService } from "./account.service";

@Controller()
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @MessagePattern("auth.account.update")
  async updateAccountAsync(data: UpdateAccountAsyncDto) {
    return await this.accountService.update({ id: data.id }, data.updates);
  }
}
