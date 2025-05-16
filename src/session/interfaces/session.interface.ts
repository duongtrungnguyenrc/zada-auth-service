import { UserAgent } from "@duongtrungnguyen/micro-commerce";

export class ISession {
  id: string;
  jit: string;
  userId: string;
  userAgent: UserAgent;
  ip: string;
  expiresAt: Date | null;
  createdAt: Date;
}
