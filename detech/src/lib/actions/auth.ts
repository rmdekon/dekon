"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import {
  authenticate,
  createSessionCookie,
  destroySessionCookie,
} from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginState = { error?: string; email?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const next = String(formData.get("next") ?? "/dashboard");

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid details",
      email: raw.email,
    };
  }

  const user = await authenticate(parsed.data.email, parsed.data.password);
  if (!user) {
    return { error: "Incorrect email or password.", email: raw.email };
  }

  await createSessionCookie(user);
  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function logoutAction() {
  await destroySessionCookie();
  redirect("/login");
}
