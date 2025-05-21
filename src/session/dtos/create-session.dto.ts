import { UserAgent } from "@duongtrungnguyen/micro-commerce";
import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsObject, IsString, IsUUID } from "class-validator";

export class CreateSessionDto {
  @ApiProperty()
  @IsUUID()
  jit: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  accountId: string;

  @ApiProperty()
  @IsObject()
  userAgent: UserAgent;

  @ApiProperty()
  @IsString()
  ip: string;
}
