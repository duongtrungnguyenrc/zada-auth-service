import { IsString, Matches } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdatePasswordDto {
  @ApiProperty()
  @IsString({ message: "validation.invalid-string" })
  @Matches(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{6,}$"), { message: "validation.invalid-password" })
  password: string;

  @ApiProperty()
  @IsString({ message: "validation.invalid-string" })
  @Matches(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{6,}$"), { message: "validation.invalid-password" })
  newPassword: string;
}
