import bcrypt from "bcryptjs";
import { validateAuthInput, type AuthInput } from "@/lib/auth-input";
import { connectDB } from "@/lib/mongodb";
import { createSession } from "@/lib/session";
import { UserModel } from "@/models/User";

export async function POST(request: Request) {
  const input = (await request.json().catch(() => null)) as Partial<AuthInput> | null;
  if (!input) {
    return Response.json({ error: "資料格式錯誤" }, { status: 400 });
  }

  const invalid = validateAuthInput(input, "register");
  if (invalid) return Response.json({ error: invalid }, { status: 400 });

  const email = input.email!.trim().toLowerCase();
  const name = typeof input.name === "string" ? input.name.trim() : "";
  await connectDB();

  if (await UserModel.exists({ email })) {
    return Response.json({ error: "這個 Email 已經註冊過了" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(input.password!, 10);
  let user;
  try {
    user = await UserModel.create({ email, passwordHash, name: name || undefined });
  } catch (err) {
    // 兩個請求同時註冊同一個 Email 時，由 unique index 擋下
    if ((err as { code?: number }).code === 11000) {
      return Response.json({ error: "這個 Email 已經註冊過了" }, { status: 409 });
    }
    throw err;
  }

  await createSession(String(user._id));
  return Response.json(
    { user: { id: String(user._id), email: user.email, name: user.name ?? null } },
    { status: 201 },
  );
}
