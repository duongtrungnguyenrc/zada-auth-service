import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsPhoneNumber, IsString } from "class-validator";

export class CreateAccountDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsPhoneNumber()
  phoneNumber: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  passwordHash: string;
}
