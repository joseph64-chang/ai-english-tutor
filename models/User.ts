import { Schema, type Types } from "mongoose";
import { defineModel } from "@/lib/define-model";

export interface User {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string; // bcrypt 雜湊，絕不存明碼
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<User>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    name: { type: String, trim: true, maxlength: 50 },
  },
  { timestamps: true },
);

export const UserModel = defineModel<User>("User", userSchema);
