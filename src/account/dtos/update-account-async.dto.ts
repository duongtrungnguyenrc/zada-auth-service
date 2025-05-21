import { IsInstance, IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

import { UpdateAccountDto } from "./update-account.dto";

export class UpdateAccountAsyncDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ type: UpdateAccountDto })
  @IsInstance(UpdateAccountDto)
  updates: UpdateAccountDto;
}
