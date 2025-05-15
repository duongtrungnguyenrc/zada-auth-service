import { UserAgent } from "@duongtrungnguyen/micro-commerce";

export interface OAuthStrategy {
  getAuthUrl(state?: string): string;
  handleCallback(code: string, ip: string, userAgent: UserAgent): Promise<string>;
}
