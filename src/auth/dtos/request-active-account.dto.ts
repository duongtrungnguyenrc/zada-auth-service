import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

export class RequestActiveAccountDto {
  @ApiProperty()
  @IsEmail()
  email: string;
}
