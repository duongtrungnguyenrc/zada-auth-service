import { IsString, IsUUID, Length } from "class-validator";

export class ResetPasswordDto {
  @IsUUID()
  sessionId: string;

  @IsString()
  @Length(6)
  otp: string;

  @IsString()
  newPassword: string;
}
