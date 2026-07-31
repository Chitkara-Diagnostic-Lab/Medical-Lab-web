import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SidebarProvider, SidebarMenuAction } from "./sidebar";

describe("SidebarProvider", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // React logs the error to console in addition to re-throwing it; silence
    // that noise for this expected-failure test.
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("throws when rendered, because `isMobile` shadows itself (regression)", () => {
    // `const isMobile = isMobile()` inside SidebarProvider references its own
    // (not yet initialized) binding instead of calling the `useIsMobile`
    // hook. This is a real bug introduced by removing the `useIsMobile`
    // import without updating the call site.
    expect(() =>
      render(
        <SidebarProvider>
          <div>content</div>
        </SidebarProvider>
      )
    ).toThrow(/isMobile/);
  });
});

describe("SidebarMenuAction", () => {
  it("does not depend on SidebarProvider/context to render", () => {
    render(<SidebarMenuAction aria-label="action" />);
    expect(screen.getByRole("button", { name: "action" })).toBeInTheDocument();
  });

  it("includes the hover-reveal opacity classes when showOnHover is true", () => {
    render(<SidebarMenuAction aria-label="hover-action" showOnHover />);
    const button = screen.getByRole("button", { name: "hover-action" });
    expect(button.className).toContain("md:opacity-0");
  });

  it("omits the hover-reveal opacity classes when showOnHover is false", () => {
    render(<SidebarMenuAction aria-label="static-action" />);
    const button = screen.getByRole("button", { name: "static-action" });
    expect(button.className).not.toContain("md:opacity-0");
  });
});