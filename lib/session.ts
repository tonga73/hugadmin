import { cookies } from "next/headers";

export interface SessionUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

const SESSION_MAX_AGE = 60 * 60 * 24 * 5 * 1000; // 5 days in ms

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    if (!sessionCookie?.value) return null;
    const data = JSON.parse(sessionCookie.value);
    if (!data.user || !data.createdAt) return null;
    if (Date.now() - data.createdAt > SESSION_MAX_AGE) return null;
    return data.user as SessionUser;
  } catch {
    return null;
  }
}
