import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("請在 .env.local 設定 MONGODB_URI");
}

// 開發模式下 hot reload 會重新執行模組，把連線快取在 global 上，避免每次存檔就多開一條連線
type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache;
};

const cache: MongooseCache = (globalForMongoose.mongooseCache ??= {
  conn: null,
  promise: null,
});

export async function connectDB() {
  if (cache.conn) return cache.conn;

  cache.promise ??= mongoose.connect(MONGODB_URI!, { bufferCommands: false });

  try {
    cache.conn = await cache.promise;
  } catch (err) {
    // 連線失敗就清掉 promise，下次呼叫才會重試
    cache.promise = null;
    throw err;
  }

  return cache.conn;
}
