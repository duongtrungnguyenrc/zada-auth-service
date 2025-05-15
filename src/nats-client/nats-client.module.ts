import { ClientsModule, Transport } from "@nestjs/microservices";
import { ConfigService } from "@nestjs/config";
import { Global, Module } from "@nestjs/common";

import { NATS_CLIENT } from "./constants";

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: NATS_CLIENT,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.NATS,
          options: {
            servers: [configService.getOrThrow<string>("NATS_URL")],
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  exports: [
    ClientsModule.registerAsync([
      {
        name: NATS_CLIENT,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.NATS,
          options: {
            servers: [configService.getOrThrow<string>("NATS_URL")],
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
})
export class NatsClientModule {}
