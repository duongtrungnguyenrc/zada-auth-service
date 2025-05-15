import { IsString, IsUUID, Length } from "class-validator";

export class VerifyAccountDto {
  @IsUUID()
  sessionId: string;

  @IsString()
  @Length(6)
  otp: string;
}
