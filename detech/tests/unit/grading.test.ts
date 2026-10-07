import { describe, expect, it } from "vitest";

import { ROLES, TERMS, toGrade } from "@/lib/enums";

describe("toGrade", () => {
  it("awards an A for 80 and above", () => {
    expect(toGrade(80).grade).toBe("A");
    expect(toGrade(95).grade).toBe("A");
    expect(toGrade(100)).toEqual({ grade: "A", remark: "Excellent" });
  });

  it("maps each band to the right letter", () => {
    expect(toGrade(79).grade).toBe("B");
    expect(toGrade(70).grade).toBe("B");
    expect(toGrade(69).grade).toBe("C");
    expect(toGrade(60).grade).toBe("C");
    expect(toGrade(59).grade).toBe("D");
    expect(toGrade(50).grade).toBe("D");
    expect(toGrade(49).grade).toBe("E");
    expect(toGrade(40).grade).toBe("E");
    expect(toGrade(39).grade).toBe("F");
    expect(toGrade(0).grade).toBe("F");
  });

  it("always returns a remark", () => {
    for (let score = 0; score <= 100; score += 7) {
      expect(toGrade(score).remark).toBeTruthy();
    }
  });
});

describe("enum catalogues", () => {
  it("exposes the six user roles", () => {
    expect(ROLES).toHaveLength(6);
    expect(ROLES).toContain("ADMIN");
    expect(ROLES).toContain("PARENT");
  });

  it("exposes three academic terms", () => {
    expect(TERMS).toEqual(["TERM_1", "TERM_2", "TERM_3"]);
  });
});
