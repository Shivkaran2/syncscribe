"use server";

import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";
import type { ActionResult } from "@/lib/actions/types";
import type { RegisterInput } from "@/lib/validators";

// Register a new user account. Sign-in is handled separately on the client
// via next-auth's signIn().
export async function registerUser(
  input: RegisterInput
): Promise<ActionResult<{ id: string; name: string; email: string }>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const { name, email, password } = parsed.data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existingUser) {
    return { ok: false, error: "An account with this email already exists" };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    select: { id: true, name: true, email: true },
  });

  return { ok: true, data: user };
}
