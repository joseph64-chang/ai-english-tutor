import { Schema, type Types } from "mongoose";
import { defineModel } from "@/lib/define-model";

// 使用者某一句話得到的一則回饋，用 sessionId + messageId 指回 PracticeSession 裡的那句話。
// 每句話每種回饋最多一筆（messageId + kind 唯一），再按一次按鈕會直接回傳存好的結果。
//   kind = "correction"：按「糾正文法」→ 改正後的句子 + 逐項錯誤（issues）
//   kind = "suggestion"：按「更好的回答」→ 更自然完整的說法 + 其他講法（alternatives）
// status / appliedText 記錄使用者之後有沒有採用這則建議。

export const CORRECTION_KINDS = ["correction", "suggestion"] as const;
export const CORRECTION_CATEGORIES = [
  "grammar",
  "vocabulary",
  "spelling",
  "punctuation",
  "word-choice",
  "naturalness",
  "pronunciation",
  "other",
] as const;
export const SEVERITIES = ["minor", "moderate", "major"] as const;
export const CORRECTION_STATUSES = ["pending", "applied", "dismissed"] as const;

export type CorrectionKind = (typeof CORRECTION_KINDS)[number];
export type CorrectionCategory = (typeof CORRECTION_CATEGORIES)[number];
export type Severity = (typeof SEVERITIES)[number];
export type CorrectionStatus = (typeof CORRECTION_STATUSES)[number];

// 一句話裡的一個錯誤
export interface CorrectionIssue {
  original: string; // 錯的片段
  corrected: string; // 改成
  category: CorrectionCategory;
  explanation: string; // 為什麼錯（繁體中文）
}

export interface Correction {
  _id: Types.ObjectId;
  sessionId: Types.ObjectId;
  messageId: Types.ObjectId; // PracticeSession.messages 裡被糾正的那一句
  userId: string; // 哪個使用者的（和所屬練習相同）
  kind: CorrectionKind;
  category: CorrectionCategory; // 這則回饋的主要類型，統計用
  severity: Severity;
  originalText: string; // 使用者原本說的整句
  correctedText: string; // 改正後的整句（correction）或更好的說法（suggestion）
  explanation: string; // 整體說明（繁體中文）
  issues: CorrectionIssue[]; // correction 才有；空陣列代表文法沒問題
  alternatives: string[]; // 其他也可以的講法
  status: CorrectionStatus;
  appliedText?: string; // 使用者採用後實際送出的句子（可能跟 correctedText 不完全一樣）
  appliedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const issueSchema = new Schema<CorrectionIssue>(
  {
    original: { type: String, required: true },
    corrected: { type: String, required: true },
    category: { type: String, enum: CORRECTION_CATEGORIES, default: "other" },
    explanation: { type: String, default: "" },
  },
  { _id: false },
);

const correctionSchema = new Schema<Correction>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "PracticeSession",
      required: true,
    },
    messageId: { type: Schema.Types.ObjectId, required: true },
    userId: { type: String, required: true, index: true },
    kind: { type: String, enum: CORRECTION_KINDS, default: "correction" },
    category: { type: String, enum: CORRECTION_CATEGORIES, default: "other" },
    severity: { type: String, enum: SEVERITIES, default: "minor" },
    originalText: { type: String, required: true },
    correctedText: { type: String, required: true },
    explanation: { type: String, default: "" },
    issues: { type: [issueSchema], default: [] },
    alternatives: { type: [String], default: [] },
    status: { type: String, enum: CORRECTION_STATUSES, default: "pending" },
    appliedText: String,
    appliedAt: Date,
  },
  { timestamps: true },
);

// 讀取一場練習的所有回饋（依時間排序）
correctionSchema.index({ sessionId: 1, createdAt: 1 });
// 同一句話的同一種回饋只存一筆，連按兩次也不會重複
correctionSchema.index({ messageId: 1, kind: 1 }, { unique: true });
// 之後做「常犯錯誤統計」用
correctionSchema.index({ userId: 1, category: 1 });

export const CorrectionModel = defineModel<Correction>(
  "Correction",
  correctionSchema,
);
