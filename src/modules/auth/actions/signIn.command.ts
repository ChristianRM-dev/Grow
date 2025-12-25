"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { signInSchema } from "@/modules/auth/domain/signIn.schema";

export type SignInState = {
  ok: boolean;
  message?: string;
};

export async function signInCommand(
  _prevState: SignInState,
  formData: FormData
): Promise<SignInState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });

    // On success, NextAuth will redirect.
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, message: "Credenciales inválidas." };
    }
    throw err;
  }
}
