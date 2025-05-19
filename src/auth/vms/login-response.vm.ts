import { withBaseResponse } from "@duongtrungnguyen/micro-commerce";

import { LoginVM } from "./login.vm";

export class LoginResponseVM extends withBaseResponse(LoginVM) {}
