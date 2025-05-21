import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

import { IAccount } from "../interfaces";

@Entity("accounts")
export class AccountEntity implements IAccount {
  @PrimaryGeneratedColumn("identity")
  id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ unique: true, length: 20 })
  phoneNumber: string;

  @Column({ name: "password_hash", select: false })
  passwordHash: string;

  @Column({ name: "is_verified", default: false })
  isVerified: boolean;

  @Column({ name: "will_delete_time", type: "timestamp", nullable: true })
  willDeleteTime?: Date | undefined;
}
