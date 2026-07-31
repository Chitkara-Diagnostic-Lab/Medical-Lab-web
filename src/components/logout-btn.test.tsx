import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// `@/lib/auth` is the *server* auth module. It only exports `auth` and
// `ROLES` - it does NOT export `signOut` (that lives in `@/lib/auth-client`).
// This mock intentionally mirrors that real shape so the test exercises the
// actual regression introduced by importing `signOut` from the wrong module.
vi.mock("@/lib/auth", () => ({
  auth: {},
  ROLES: { USER: "USER", ADMIN: "ADMIN" },
}));

import { toast } from "sonner";
import { LogoutButton } from "./logout-btn";

describe("LogoutButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the initial 'Logout' state, enabled", () => {
    render(<LogoutButton />);

    const button = screen.getByRole("button", { name: "Logout" });
    expect(button).toBeEnabled();
  });

  it("shows an error toast and recovers when signOut is not a function (regression)", async () => {
    const user = userEvent.setup();
    render(<LogoutButton />);

    const button = screen.getByRole("button", { name: "Logout" });
    await user.click(button);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("An error occurred during logout");
    });

    // The button must return to its normal, enabled state instead of being
    // stuck in the loading state.
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Logout" })).toBeEnabled();
    });

    expect(toast.success).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });
});