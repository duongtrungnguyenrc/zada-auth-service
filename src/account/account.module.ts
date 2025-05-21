import { TypeOrmModule } from "@nestjs/typeorm";
import { Global, Module } from "@nestjs/common";

import { AccountAsyncController } from "./account-async.controller";
import { AccountService } from "./account.service";
import { AccountEntity } from "./entities";

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AccountEntity])],
  controllers: [AccountAsyncController],
  providers: [AccountService],
  exports: [AccountService],
})
export class AccountModule {}
