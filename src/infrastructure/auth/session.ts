import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";

import { prisma } from "@/infrastructure/database/prisma/client";

const SESSION_COOKIE_NAME = "pet-session-owner";
const SESSION_COOKIE_MAX_AGE_IN_SECONDS = 60 * 60 * 24 * 365;

export async function getSessionOwnerId(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!cookie?.value) {
    return null;
  }

  return cookie.value;
}

export async function getOrCreateSessionOwnerId(): Promise<string> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (cookie?.value) {
    const existingUser = await prisma.user.findUnique({
      where: { id: cookie.value },
      select: { id: true },
    });

    if (existingUser) {
      return existingUser.id;
    }
  }

  const createdUser = await prisma.user.create({
    data: {
      name: "Sessão anônima",
      email: `session-${randomUUID()}@anonymous.local`,
      passwordHash: "session-anonymous",
      perfil: "ENFERMEIRO",
    },
    select: { id: true },
  });

  cookieStore.set(SESSION_COOKIE_NAME, createdUser.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE_IN_SECONDS,
  });

  return createdUser.id;
}
