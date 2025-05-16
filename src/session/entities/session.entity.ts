import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";
import { UserAgent } from "@duongtrungnguyen/micro-commerce";

import { ISession } from "../interfaces";

@Entity("session")
export class SessionEntity implements ISession {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  jit: string;

  @Column()
  userId: string;

  @Column({ type: "jsonb" })
  userAgent: UserAgent;

  @Column()
  ip: string;

  @Column({ type: "date", nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
