// @vitest-environment node
import { test, expect, vi, beforeEach } from "vitest";
import { SignJWT } from "jose";

const cookieStore = new Map<string, { value: string }>();

vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => cookieStore.get(name),
    set: (name: string, value: string) => {
      cookieStore.set(name, { value });
    },
    delete: (name: string) => {
      cookieStore.delete(name);
    },
  }),
}));

import {
  createSession,
  getSession,
  deleteSession,
  verifySession,
} from "@/lib/auth";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "development-secret-key"
);

function makeRequest(cookieValue?: string) {
  return {
    cookies: {
      get: (name: string) =>
        name === "auth-token" && cookieValue !== undefined
          ? { value: cookieValue }
          : undefined,
    },
  } as any;
}

beforeEach(() => {
  cookieStore.clear();
});

test("createSession stores a signed JWT cookie with the session payload", async () => {
  await createSession("user-1", "user@example.com");

  const cookie = cookieStore.get("auth-token");
  expect(cookie).toBeDefined();

  const session = await getSession();
  expect(session?.userId).toBe("user-1");
  expect(session?.email).toBe("user@example.com");
  expect(session?.expiresAt).toBeDefined();
});

test("getSession returns null when there is no cookie", async () => {
  const session = await getSession();
  expect(session).toBeNull();
});

test("getSession returns null for a tampered/invalid token", async () => {
  cookieStore.set("auth-token", { value: "not-a-real-token" });

  const session = await getSession();
  expect(session).toBeNull();
});

test("getSession returns null for a token signed with the wrong secret", async () => {
  const wrongSecret = new TextEncoder().encode("some-other-secret");
  const badToken = await new SignJWT({ userId: "user-1", email: "a@b.com" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(wrongSecret);

  cookieStore.set("auth-token", { value: badToken });

  const session = await getSession();
  expect(session).toBeNull();
});

test("getSession returns null for an expired token", async () => {
  const alreadyExpired = Math.floor(Date.now() / 1000) - 60;
  const expiredToken = await new SignJWT({
    userId: "user-1",
    email: "a@b.com",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(alreadyExpired)
    .setIssuedAt()
    .sign(JWT_SECRET);

  cookieStore.set("auth-token", { value: expiredToken });

  const session = await getSession();
  expect(session).toBeNull();
});

test("deleteSession removes the auth cookie", async () => {
  await createSession("user-1", "user@example.com");
  expect(cookieStore.get("auth-token")).toBeDefined();

  await deleteSession();
  expect(cookieStore.get("auth-token")).toBeUndefined();
});

test("verifySession reads and verifies the token from a NextRequest", async () => {
  const token = await new SignJWT({
    userId: "user-2",
    email: "other@example.com",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(JWT_SECRET);

  const session = await verifySession(makeRequest(token));
  expect(session?.userId).toBe("user-2");
  expect(session?.email).toBe("other@example.com");
});

test("verifySession returns null when the request has no auth cookie", async () => {
  const session = await verifySession(makeRequest());
  expect(session).toBeNull();
});

test("verifySession returns null for an invalid token", async () => {
  const session = await verifySession(makeRequest("garbage-token"));
  expect(session).toBeNull();
});
