import { DiscoveryService } from "@duongtrungnguyen/nestro";
import * as protoLoader from "@grpc/proto-loader";
import * as grpc from "@grpc/grpc-js";
import * as path from "path";

import { USER_PACKAGE_NAME, USER_SERVICE_NAME, UserServiceClient } from "./tsprotos";
import { Inject, Type } from "@nestjs/common";

export class UserClientService {
  constructor(@Inject(DiscoveryService) private readonly discoveryService: DiscoveryService) {}

  call<T = any, K = any>(methodName: keyof UserServiceClient, payload: T): Promise<K> {
    return this.discoveryService.executeWithRetry("user", (service) => {
      const { grpcUrl } = service.metadata!;

      const packageName = USER_PACKAGE_NAME;
      const serviceName = USER_SERVICE_NAME;
      const protoPath = path.join(__dirname, "protos", "user.proto");

      const packageDefinition = protoLoader.loadSync(protoPath, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      });

      const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;

      const GrpcPackage: Type<UserServiceClient> = packageName
        .split(".")
        .reduce((obj, key) => obj?.[key], protoDescriptor);

      if (!GrpcPackage) throw new Error(`Cannot find package ${packageName} in proto`);

      const client = new GrpcPackage[serviceName](grpcUrl, grpc.credentials.createInsecure());

      return new Promise((resolve, reject) => {
        client[methodName](payload, (err: Error, response: K) => {
          if (err) reject(err);
          else resolve(response);
        });
      });
    });
  }
}
