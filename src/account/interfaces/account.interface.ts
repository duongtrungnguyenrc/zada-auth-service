export interface IAccount {
  id: string;
  email: string;
  phoneNumber: string;
  passwordHash: string;
  isVerified: boolean;
  willDeleteTime?: Date;
}
