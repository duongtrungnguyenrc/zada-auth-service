import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";
import { UserAgent } from "@duongtrungnguyen/micro-commerce";

import { ISession } from "../interfaces";

@Entity("sessions")
export class SessionEntity implements ISession {
  @PrimaryGeneratedColumn("identity")
  id: string;

  @Column({ unique: true })
  jit: string;

  @Column({ name: "account_id" })
  accountId: string;

  @Column({ name: "user_agent", type: "jsonb" })
  userAgent: UserAgent;

  @Column({ length: 30 })
  ip: string;

  @Column({ name: "expires_at", type: "timestamp", nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
