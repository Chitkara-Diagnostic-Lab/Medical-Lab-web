import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

vi.mock("@/lib/server-auth", () => ({
  requireRole: vi.fn(),
  ROLES: { USER: "USER", ADMIN: "ADMIN" },
}));

// The sidebar primitives are covered by their own dedicated tests (including
// a known regression where SidebarProvider throws). We stub them out here so
// this test focuses solely on the dashboard page's own logic.
vi.mock("@/components/ui/sidebar", () => ({
  SidebarProvider: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarInset: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarTrigger: () => <button type="button">Toggle</button>,
}));

vi.mock("@/components/app-sidebar", () => ({
  AppSidebar: () => <nav>sidebar</nav>,
}));

import { requireRole, ROLES } from "@/lib/server-auth";
import Page from "./page";

const mockedRequireRole = vi.mocked(requireRole);

describe("Dashboard Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedRequireRole.mockResolvedValue({
      user: { name: "Jane Doe", role: "USER" },
    } as never);
  });

  it("requires only USER and ADMIN roles (LAB_STAFF removed)", async () => {
    await Page();

    expect(mockedRequireRole).toHaveBeenCalledWith([ROLES.USER, ROLES.ADMIN]);
    expect(mockedRequireRole).toHaveBeenCalledWith(
      expect.not.arrayContaining(["LAB_STAFF"])
    );
  });

  it("renders the authenticated user's name in the breadcrumb", async () => {
    const ui = await Page();
    render(ui);

    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });
});