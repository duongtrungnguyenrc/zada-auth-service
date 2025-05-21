import { IsEmail, IsOptional, IsPhoneNumber, IsString, IsUrl, Matches } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RegisterAccountDto {
  @ApiProperty()
  @IsString({ message: "validation.invalid-string" })
  fullName: string;

  @ApiProperty()
  @IsEmail({}, { message: "validation.invalid-email" })
  email: string;

  @ApiProperty({ required: false })
  @IsUrl({}, { message: "validation.invalid-url" })
  @IsOptional()
  avatarUrl?: string;

  @ApiProperty()
  @Matches(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{6,}$"), { message: "validation.invalid-password" })
  password: string;

  @ApiProperty()
  @IsPhoneNumber(undefined, {
    message: "validation.invalid-phone",
  })
  phoneNumber: string;
}
