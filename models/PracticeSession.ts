import { Schema, type Types } from "mongoose";
import { defineModel } from "@/lib/define-model";

// 一場英文對話練習。整場對話（messages）直接內嵌在這筆文件裡，
// 一次讀取就能拿到完整對話；糾錯與建議另外存在 Correction collection。

export const MESSAGE_ROLES = ["user", "assistant"] as const;
export const INPUT_TYPES = ["text", "voice"] as const;
export const SESSION_STATUSES = ["active", "completed", "abandoned"] as const;
export const LEVELS = ["beginner", "intermediate", "advanced"] as const;

export type MessageRole = (typeof MESSAGE_ROLES)[number];
export type InputType = (typeof INPUT_TYPES)[number];
export type SessionStatus = (typeof SESSION_STATUSES)[number];
export type Level = (typeof LEVELS)[number];

export interface Message {
  _id: Types.ObjectId;
  role: MessageRole;
  content: string;
  inputType: InputType; // 使用者是打字還是講話（語音轉文字）
  audioUrl?: string; // 語音輸入時的錄音檔位置（之後做語音再用）
  createdAt: Date;
}

export interface PracticeSession {
  _id: Types.ObjectId;
  userId: string; // 這場練習是哪個使用者的（User._id 字串）
  title: string;
  topic: string; // 練習場景 id，對應 lib/scenarios.ts，例如 "ordering"、"interview"
  level: Level;
  status: SessionStatus;
  messages: Message[];
  correctionCount: number; // 這場產生了幾則糾錯/建議，列表頁不用另外 count
  summary?: string; // 練習結束後的整體回饋
  startedAt: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<Message>(
  {
    role: { type: String, enum: MESSAGE_ROLES, required: true },
    content: { type: String, required: true },
    inputType: { type: String, enum: INPUT_TYPES, default: "text" },
    audioUrl: String,
    createdAt: { type: Date, default: Date.now },
  },
  // 保留每則訊息的 _id，讓 Correction 可以指到是哪一句
  { _id: true },
);

const practiceSessionSchema = new Schema<PracticeSession>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, default: "Untitled practice", trim: true },
    topic: { type: String, default: "Free talk", trim: true },
    level: { type: String, enum: LEVELS, default: "intermediate" },
    status: { type: String, enum: SESSION_STATUSES, default: "active" },
    messages: { type: [messageSchema], default: [] },
    correctionCount: { type: Number, default: 0 },
    summary: String,
    startedAt: { type: Date, default: Date.now },
    endedAt: Date,
  },
  { timestamps: true },
);

// 歷史紀錄列表：依使用者、最新的在前面
practiceSessionSchema.index({ userId: 1, startedAt: -1 });

export const PracticeSessionModel = defineModel<PracticeSession>(
  "PracticeSession",
  practiceSessionSchema,
);
