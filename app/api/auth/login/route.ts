import bcrypt from "bcryptjs";
import { validateAuthInput, type AuthInput } from "@/lib/auth-input";
import { connectDB } from "@/lib/mongodb";
import { createSession } from "@/lib/session";
import { UserModel } from "@/models/User";

// 不透露是 Email 不存在還是密碼錯，避免被拿來試探哪些 Email 有註冊
const LOGIN_FAILED = "Email 或密碼錯誤";

// Email 不存在時也跑一次 bcrypt 比對，讓回應時間差不多，不會從速度看出帳號是否存在
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", 10);

export async function POST(request: Request) {
  const input = (await request.json().catch(() => null)) as Partial<AuthInput> | null;
  if (!input) {
    return Response.json({ error: "資料格式錯誤" }, { status: 400 });
  }

  const invalid = validateAuthInput(input, "login");
  if (invalid) return Response.json({ error: invalid }, { status: 400 });

  await connectDB();
  const user = await UserModel.findOne({ email: input.email!.trim().toLowerCase() });
  const ok = await bcrypt.compare(input.password!, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) {
    return Response.json({ error: LOGIN_FAILED }, { status: 401 });
  }

  await createSession(String(user._id));
  return Response.json({
    user: { id: String(user._id), email: user.email, name: user.name ?? null },
  });
}
