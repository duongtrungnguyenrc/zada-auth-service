export type ForgotPasswordSession = {
  otp: string;
  userId: string;
  ip: string;
};

export type VerifyAccountSession = {
  otp: string;
  userId: string;
  ip: string;
};
