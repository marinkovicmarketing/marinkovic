"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const VIP_COOKIE = "vip_access";

export async function unlockVip(formData: FormData): Promise<{ error?: string }> {
  const code = String(formData.get("code") ?? "").trim();
  const expected = process.env.VIP_ACCESS_CODE?.trim();

  if (!expected) {
    return { error: "Der VIP-Zugang ist derzeit nicht konfiguriert. Versuch es später erneut." };
  }
  if (code !== expected) {
    return { error: "Falscher Code. Überprüfe den Code, den du erhalten hast, oder kontaktiere uns." };
  }

  const store = await cookies();
  store.set(VIP_COOKIE, code, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  revalidatePath("/vip");
  return {};
}

export async function hasVipAccess(): Promise<boolean> {
  const expected = process.env.VIP_ACCESS_CODE?.trim();
  if (!expected) return false;
  const store = await cookies();
  return store.get(VIP_COOKIE)?.value === expected;
}
