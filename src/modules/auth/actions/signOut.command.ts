"use server";

import { signOut } from "@/auth";

export async function signOutCommand() {
  await signOut({ redirectTo: "/login" });
}
