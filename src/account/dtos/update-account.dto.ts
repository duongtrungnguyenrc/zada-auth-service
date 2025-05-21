import { IsBoolean, IsEmail, IsOptional, IsPhoneNumber, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateAccountDto {
  @ApiProperty({ required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false })
  @IsPhoneNumber()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  passwordHash?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;
}
