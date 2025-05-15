import { TypeOrmModule } from "@nestjs/typeorm";
import { Module } from "@nestjs/common";

import { SessionService } from "./session.service";
import { SessionEntity } from "./entities";

@Module({
  imports: [TypeOrmModule.forFeature([SessionEntity])],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
