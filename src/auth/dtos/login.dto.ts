import { IsEmail, IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
  @ApiProperty()
  @IsEmail({}, { message: "validation.invalid-email" })
  email: string;

  @ApiProperty()
  @IsString({ message: "validation.invalid-string" })
  @IsNotEmpty({ message: "validation.invalid-password" })
  password: string;
}
