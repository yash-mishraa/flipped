import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn utility", () => {
  it("combines class strings cleanly", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("filters out falsy values like false, null, and undefined", () => {
    expect(cn("foo", false, "bar", null, undefined)).toBe("foo bar");
  });

  it("returns empty string when no valid arguments are passed", () => {
    expect(cn(false, null, undefined)).toBe("");
  });
});
