import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/headers before importing the module under test
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/session";

const mockCookies = vi.mocked(cookies);

function makeCookieStore(value: string | undefined) {
  return {
    get: (name: string) =>
      name === "session" && value !== undefined
        ? { name: "session", value }
        : undefined,
  } as any;
}

function makeSessionCookie(
  user: object,
  createdAt = Date.now()
): string {
  return JSON.stringify({ user, createdAt });
}

describe("getSessionUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no session cookie exists", async () => {
    mockCookies.mockResolvedValue(makeCookieStore(undefined));
    const result = await getSessionUser();
    expect(result).toBeNull();
  });

  it("returns null when session cookie is malformed JSON", async () => {
    mockCookies.mockResolvedValue(makeCookieStore("not-valid-json"));
    const result = await getSessionUser();
    expect(result).toBeNull();
  });

  it("returns null when session is missing user field", async () => {
    const value = JSON.stringify({ createdAt: Date.now() });
    mockCookies.mockResolvedValue(makeCookieStore(value));
    const result = await getSessionUser();
    expect(result).toBeNull();
  });

  it("returns null when session is expired (> 5 days)", async () => {
    const sixDaysAgo = Date.now() - 6 * 24 * 60 * 60 * 1000;
    const value = makeSessionCookie(
      { uid: "abc", email: "a@b.com", displayName: null, photoURL: null },
      sixDaysAgo
    );
    mockCookies.mockResolvedValue(makeCookieStore(value));
    const result = await getSessionUser();
    expect(result).toBeNull();
  });

  it("returns the user when session is valid", async () => {
    const user = {
      uid: "uid-123",
      email: "test@example.com",
      displayName: "Test User",
      photoURL: null,
    };
    const value = makeSessionCookie(user);
    mockCookies.mockResolvedValue(makeCookieStore(value));
    const result = await getSessionUser();
    expect(result).toEqual(user);
  });

  it("returns user for a fresh session (just created)", async () => {
    const user = {
      uid: "uid-456",
      email: "new@example.com",
      displayName: null,
      photoURL: "http://example.com/photo.jpg",
    };
    const value = makeSessionCookie(user, Date.now());
    mockCookies.mockResolvedValue(makeCookieStore(value));
    const result = await getSessionUser();
    expect(result).toEqual(user);
    expect(result?.email).toBe("new@example.com");
  });
});
