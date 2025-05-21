import { TypeOrmModule } from "@nestjs/typeorm";
import { Global, Module } from "@nestjs/common";

import { AccountController } from "./account.controller";
import { AccountService } from "./account.service";
import { AccountEntity } from "./entities";

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AccountEntity])],
  providers: [AccountService],
  exports: [AccountService],
  controllers: [AccountController],
})
export class AccountModule {}
