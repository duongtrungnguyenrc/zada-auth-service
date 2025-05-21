import { withBaseResponse } from "@duongtrungnguyen/micro-commerce";
import { OmitType } from "@nestjs/swagger";

import { AccountVM } from "./account.vm";

export class AccountResponseVM extends withBaseResponse(OmitType(AccountVM, ["passwordHash"] as const)) {}
