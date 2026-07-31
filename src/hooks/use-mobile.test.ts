import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useIsMobile } from "./use-mobile";

function setInnerWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width,
  });
}

function mockMatchMedia() {
  const listeners: Array<() => void> = [];
  const mql = {
    matches: false,
    media: "",
    addEventListener: vi.fn((_event: string, listener: () => void) => {
      listeners.push(listener);
    }),
    removeEventListener: vi.fn((_event: string, listener: () => void) => {
      const idx = listeners.indexOf(listener);
      if (idx !== -1) listeners.splice(idx, 1);
    }),
  };

  window.matchMedia = vi.fn().mockReturnValue(mql);

  return {
    mql,
    fireChange: () => {
      act(() => {
        listeners.forEach((listener) => listener());
      });
    },
  };
}

describe("useIsMobile", () => {
  beforeEach(() => {
    setInnerWidth(1024);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns false when the viewport is wider than the mobile breakpoint", () => {
    setInnerWidth(1024);
    mockMatchMedia();

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });

  it("returns true when the viewport is narrower than the mobile breakpoint", () => {
    setInnerWidth(500);
    mockMatchMedia();

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });

  it("always returns a boolean, never undefined, even before the effect settles", () => {
    setInnerWidth(1024);
    mockMatchMedia();

    const { result } = renderHook(() => useIsMobile());
    expect(typeof result.current).toBe("boolean");
  });

  it("registers a 'change' listener on the media query list", () => {
    setInnerWidth(1024);
    const { mql } = mockMatchMedia();

    renderHook(() => useIsMobile());

    expect(window.matchMedia).toHaveBeenCalledWith("(max-width: 767px)");
    expect(mql.addEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function)
    );
  });

  it("updates the value when the media query change event fires", () => {
    setInnerWidth(1024);
    const { fireChange } = mockMatchMedia();

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    setInnerWidth(400);
    fireChange();

    expect(result.current).toBe(true);
  });

  it("removes the 'change' listener on unmount", () => {
    setInnerWidth(1024);
    const { mql } = mockMatchMedia();

    const { unmount } = renderHook(() => useIsMobile());
    unmount();

    expect(mql.removeEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function)
    );
  });
});