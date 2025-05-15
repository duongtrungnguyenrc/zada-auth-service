import { UserAgent } from "@duongtrungnguyen/micro-commerce";
import { IsObject, IsString, IsUUID } from "class-validator";

export class CreateSessionDto {
  @IsUUID()
  jit: string;

  @IsUUID()
  userId: string;

  @IsObject()
  userAgent: UserAgent;

  @IsString()
  ip: string;
}
