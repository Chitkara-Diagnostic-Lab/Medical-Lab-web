import { describe, expect, it } from "vitest";
import {
  getNavigationForRole,
  userNavigation,
  adminNavigation,
  labNavigation,
} from "./navigation";

describe("getNavigationForRole", () => {
  it("returns adminNavigation for the 'admin' role", () => {
    expect(getNavigationForRole("admin")).toBe(adminNavigation);
  });

  it("returns userNavigation for the 'user' role", () => {
    expect(getNavigationForRole("user")).toBe(userNavigation);
  });

  it("returns userNavigation as the default for unknown roles", () => {
    expect(getNavigationForRole("some_unknown_role")).toBe(userNavigation);
    expect(getNavigationForRole("")).toBe(userNavigation);
  });

  it("no longer routes 'lab_staff' to labNavigation (regression)", () => {
    // The lab_staff case was removed from the switch statement; it must now
    // fall through to the default (userNavigation), not labNavigation.
    const result = getNavigationForRole("lab_staff");
    expect(result).toBe(userNavigation);
    expect(result).not.toBe(labNavigation);
  });

  it("is case sensitive and does not match 'Admin'", () => {
    expect(getNavigationForRole("Admin")).toBe(userNavigation);
  });
});

describe("navigation data shape", () => {
  it("userNavigation sections all contain items with title, href and icon", () => {
    for (const section of userNavigation) {
      for (const item of section.items) {
        expect(item.title).toEqual(expect.any(String));
        expect(item.href).toEqual(expect.any(String));
        expect(item.icon).toBeDefined();
      }
    }
  });

  it("adminNavigation sections all contain items with title, href and icon", () => {
    for (const section of adminNavigation) {
      for (const item of section.items) {
        expect(item.title).toEqual(expect.any(String));
        expect(item.href).toEqual(expect.any(String));
        expect(item.icon).toBeDefined();
      }
    }
  });
});