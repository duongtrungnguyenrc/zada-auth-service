import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class ForgotPasswordDto {
  @ApiProperty()
  @IsString({ message: "validation.invalid-id" })
  accountId: string;
}
