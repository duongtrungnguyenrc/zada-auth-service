import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class ForgotPasswordDto {
  @ApiProperty()
  @IsUUID("4", { message: "validation.invalid-id" })
  userId: string;
}
