import mongoose, { type Model, type Schema } from "mongoose";

// 註冊 mongoose model。
// 開發模式下 hot reload 會重新執行 model 檔，但 mongoose 還留著舊的 model；
// 如果直接沿用，改過的 schema（例如新加的欄位）不會生效，新欄位會被默默丟掉。
// 所以開發模式先刪掉舊的再重新註冊；正式環境只會載入一次，直接沿用即可。
export function defineModel<T>(name: string, schema: Schema<T>): Model<T> {
  if (process.env.NODE_ENV !== "production" && mongoose.models[name]) {
    mongoose.deleteModel(name);
  }
  // 型別交給呼叫端指定：讓 TypeScript 自己推導 mongoose 的泛型會吃光記憶體
  const existing = mongoose.models[name] as unknown as Model<T> | undefined;
  return existing ?? (mongoose.model(name, schema) as unknown as Model<T>);
}
