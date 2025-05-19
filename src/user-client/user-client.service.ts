import { DiscoveryService, Service } from "@duongtrungnguyen/nestro";
import { GrpcClient } from "@duongtrungnguyen/micro-commerce";
import { Inject } from "@nestjs/common";
import * as path from "path";

import { USER_PACKAGE_NAME, USER_SERVICE_NAME, UserServiceClient } from "./tsprotos";

export class UserClientService {
  constructor(@Inject(DiscoveryService) private readonly discoveryService: DiscoveryService) {}

  call<T = any, K = any>(methodName: keyof UserServiceClient, payload: T): Promise<K> {
    return this.discoveryService.discover("user", (service: Service) => {
      const { grpcUrl } = service.metadata!;

      const packageName = USER_PACKAGE_NAME;
      const serviceName = USER_SERVICE_NAME;
      const protoPath = path.join(__dirname, "protos", "user.proto");

      const client: GrpcClient = GrpcClient.getInstance(protoPath, packageName, serviceName, grpcUrl);

      return client.callMethod<T, K>(methodName, payload);
    });
  }
}
