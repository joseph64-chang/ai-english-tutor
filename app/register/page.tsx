import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";
import { safeNextPath } from "@/lib/safe-next";

export const metadata: Metadata = { title: "註冊｜AI 英文家教" };

export default async function RegisterPage(props: PageProps<"/register">) {
  const { next } = await props.searchParams;
  return <AuthForm mode="register" next={safeNextPath(next)} />;
}
