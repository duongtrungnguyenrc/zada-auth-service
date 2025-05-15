import { IsUUID } from "class-validator";

export class ForgotPasswordDto {
  @IsUUID()
  userId: string;
}
