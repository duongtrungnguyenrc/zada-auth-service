import { IsString, IsUUID, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ResetPasswordDto {
  @ApiProperty()
  @IsUUID("4", { message: "validation.invalid-id" })
  sessionId: string;

  @ApiProperty()
  @IsString({ message: "validation.invalid-string" })
  @Length(6, 6, { message: "validation.invalid-otp" })
  otp: string;

  @ApiProperty()
  @IsString({ message: "validation.invalid-string" })
  newPassword: string;
}
