import { describe, expect, it } from "vitest";

import { signToken, verifyToken, SESSION_COOKIE } from "@/lib/jwt";

const user = {
  id: "stu_123",
  email: "ama@detech.school",
  name: "Ama Mensah",
  role: "STUDENT" as const,
  avatarUrl: null,
};

describe("JWT session tokens", () => {
  it("round-trips a user through sign and verify", async () => {
    const token = await signToken(user);
    expect(token.split(".")).toHaveLength(3);

    const payload = await verifyToken(token);
    expect(payload).not.toBeNull();
    expect(payload!.id).toBe(user.id);
    expect(payload!.email).toBe(user.email);
    expect(payload!.role).toBe("STUDENT");
  });

  it("sets issued-at and expiry claims", async () => {
    const payload = await verifyToken(await signToken(user));
    expect(payload!.iat).toBeTypeOf("number");
    expect(payload!.exp).toBeTypeOf("number");
    expect(payload!.exp!).toBeGreaterThan(payload!.iat!);
  });

  it("rejects a tampered token", async () => {
    const token = await signToken(user);
    const [header, body, signature] = token.split(".");
    const forged = Buffer.from(
      JSON.stringify({ ...JSON.parse(Buffer.from(body, "base64url").toString()), role: "ADMIN" }),
    ).toString("base64url");

    expect(await verifyToken(`${header}.${forged}.${signature}`)).toBeNull();
  });

  it("rejects garbage input", async () => {
    expect(await verifyToken("not-a-token")).toBeNull();
    expect(await verifyToken("")).toBeNull();
  });

  it("uses a namespaced cookie name", () => {
    expect(SESSION_COOKIE).toBe("detech_session");
  });
});
