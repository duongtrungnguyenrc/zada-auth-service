import { ApiProperty } from "@nestjs/swagger";

export class AccountVM {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phoneNumber: string;

  @ApiProperty()
  passwordHash: string;

  @ApiProperty()
  isVerified: boolean;

  @ApiProperty({ required: false })
  willDeleteTime?: Date;
}
