export type ForgotPasswordSession = {
  otp: string;
  accountId: string;
  ip: string;
};

export type VerifyAccountSession = {
  otp: string;
  accountId: string;
  ip: string;
};

export type VerifyAccountStatus = "verify-account-success" | "register-success";
