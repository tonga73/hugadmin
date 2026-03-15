import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SAVE_CONFIG, useDebounce } from "@/lib/save-config";
import { renderHook, act } from "@testing-library/react";

describe("SAVE_CONFIG", () => {
  it("tiene modo 'manual' por defecto", () => {
    expect(SAVE_CONFIG.mode).toBe("manual");
  });

  it("tiene debounceMs definido", () => {
    expect(typeof SAVE_CONFIG.debounceMs).toBe("number");
  });
});

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("retrasa la ejecución del callback", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounce(callback, 500));

    act(() => result.current());

    expect(callback).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(500));

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("cancela llamadas anteriores si se llama de nuevo antes del delay", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounce(callback, 500));

    act(() => {
      result.current();
      result.current();
      result.current();
    });

    act(() => vi.advanceTimersByTime(500));

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("pasa argumentos al callback", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounce(callback, 100));

    act(() => result.current("arg1", "arg2"));
    act(() => vi.advanceTimersByTime(100));

    expect(callback).toHaveBeenCalledWith("arg1", "arg2");
  });
});
