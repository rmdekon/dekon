import { describe, expect, it } from "vitest";

import { canAccess, canWrite, moduleForPath } from "@/lib/rbac";

describe("canAccess", () => {
  it("lets an administrator into every module", () => {
    expect(canAccess("ADMIN", "students")).toBe(true);
    expect(canAccess("ADMIN", "fees")).toBe(true);
    expect(canAccess("ADMIN", "teachers")).toBe(true);
  });

  it("keeps students out of staff-only modules", () => {
    expect(canAccess("STUDENT", "teachers")).toBe(false);
    expect(canAccess("STUDENT", "students")).toBe(false);
    expect(canAccess("STUDENT", "reports")).toBe(false);
  });

  it("lets students into their own modules", () => {
    expect(canAccess("STUDENT", "attendance")).toBe(true);
    expect(canAccess("STUDENT", "timetable")).toBe(true);
    expect(canAccess("STUDENT", "assignments")).toBe(true);
  });

  it("scopes parents to the parent portal modules", () => {
    expect(canAccess("PARENT", "fees")).toBe(true);
    expect(canAccess("PARENT", "exams")).toBe(true);
    expect(canAccess("PARENT", "teachers")).toBe(false);
  });

  it("denies an undefined role", () => {
    expect(canAccess(undefined, "dashboard")).toBe(false);
  });
});

describe("canWrite", () => {
  it("allows teachers to mark attendance but not edit student records", () => {
    expect(canWrite("TEACHER", "attendance")).toBe(true);
    expect(canWrite("TEACHER", "students")).toBe(false);
  });

  it("allows accountants to manage fees only", () => {
    expect(canWrite("ACCOUNTANT", "fees")).toBe(true);
    expect(canWrite("ACCOUNTANT", "library")).toBe(false);
  });

  it("gives read-only modules no writers", () => {
    expect(canWrite("ADMIN", "dashboard")).toBe(false);
  });
});

describe("moduleForPath", () => {
  it("resolves the dashboard root", () => {
    expect(moduleForPath("/dashboard")).toBe("dashboard");
    expect(moduleForPath("/dashboard/")).toBe("dashboard");
  });

  it("resolves nested module routes", () => {
    expect(moduleForPath("/dashboard/students")).toBe("students");
    expect(moduleForPath("/dashboard/students/abc123")).toBe("students");
    expect(moduleForPath("/dashboard/fees?status=PAID")).not.toBe("students");
  });

  it("returns null for unknown segments", () => {
    expect(moduleForPath("/dashboard/not-a-module")).toBeNull();
  });
});
