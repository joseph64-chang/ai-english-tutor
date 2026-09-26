import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";
import { safeNextPath } from "@/lib/safe-next";

export const metadata: Metadata = { title: "登入｜AI 英文家教" };

export default async function LoginPage(props: PageProps<"/login">) {
  const { next } = await props.searchParams;
  return <AuthForm mode="login" next={safeNextPath(next)} />;
}
