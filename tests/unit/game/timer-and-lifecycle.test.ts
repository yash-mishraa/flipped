import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useGameTimer } from "@/features/game/hooks/useGameTimer";
import {
  formatTime,
  getTimerUrgency,
  calculateRemainingSeconds,
  calculateElapsedSeconds,
} from "@/features/game/domain/timer-utils";

describe("Timer Domain Utilities", () => {
  it("formats duration in seconds to MM:SS notation", () => {
    expect(formatTime(60)).toBe("01:00");
    expect(formatTime(59)).toBe("00:59");
    expect(formatTime(10)).toBe("00:10");
    expect(formatTime(1)).toBe("00:01");
    expect(formatTime(0)).toBe("00:00");
    // Clamps negative seconds
    expect(formatTime(-5)).toBe("00:00");
  });

  it("categorizes timer urgency states accurately", () => {
    expect(getTimerUrgency(60)).toBe("normal");
    expect(getTimerUrgency(25)).toBe("normal");
    expect(getTimerUrgency(21)).toBe("normal");
    expect(getTimerUrgency(20)).toBe("urgent");
    expect(getTimerUrgency(11)).toBe("urgent");
    expect(getTimerUrgency(10)).toBe("critical");
    expect(getTimerUrgency(1)).toBe("critical");
    expect(getTimerUrgency(0)).toBe("expired");
    expect(getTimerUrgency(-1)).toBe("expired");
  });

  it("calculates remaining seconds until deadline accurately without going negative", () => {
    const now = 1000000;
    const deadline = now + 60000;

    expect(calculateRemainingSeconds(deadline, now)).toBe(60);
    expect(calculateRemainingSeconds(deadline, now + 1000)).toBe(59);
    expect(calculateRemainingSeconds(deadline, now + 59500)).toBe(1);
    expect(calculateRemainingSeconds(deadline, now + 60000)).toBe(0);
    expect(calculateRemainingSeconds(deadline, now + 70000)).toBe(0);
  });

  it("calculates elapsed seconds from start timestamp accurately", () => {
    const startedAt = 1000000;

    expect(calculateElapsedSeconds(startedAt, startedAt, 60)).toBe(0);
    expect(calculateElapsedSeconds(startedAt, startedAt + 4200, 60)).toBe(4);
    expect(calculateElapsedSeconds(startedAt, startedAt + 10900, 60)).toBe(10);
    expect(calculateElapsedSeconds(startedAt, startedAt + 65000, 60)).toBe(60); // clamped to max
    expect(calculateElapsedSeconds(startedAt, startedAt - 500, 60)).toBe(0);
  });
});

describe("useGameTimer Hook", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initializes with 60 seconds and does not run automatically", () => {
    const { result } = renderHook(() => useGameTimer({ durationSeconds: 60 }));

    expect(result.current.remainingSeconds).toBe(60);
    expect(result.current.elapsedSeconds).toBe(0);
    expect(result.current.formattedTime).toBe("01:00");
    expect(result.current.urgency).toBe("normal");
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isExpired).toBe(false);

    // Advancing time does nothing while stopped
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.remainingSeconds).toBe(60);
    expect(result.current.elapsedSeconds).toBe(0);
  });

  it("starts counting down on explicit start() call", () => {
    const onTick = vi.fn();
    const { result } = renderHook(() => useGameTimer({ durationSeconds: 60, onTick }));

    act(() => {
      result.current.start();
    });

    expect(result.current.isRunning).toBe(true);

    // Advance by 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.remainingSeconds).toBe(59);
    expect(result.current.elapsedSeconds).toBe(1);
    expect(result.current.formattedTime).toBe("00:59");
    expect(onTick).toHaveBeenCalled();
  });

  it("is idempotent: repeated start() calls do not duplicate timers or reset deadline", () => {
    const { result } = renderHook(() => useGameTimer({ durationSeconds: 60 }));

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.remainingSeconds).toBe(55);

    // Call start again
    act(() => {
      result.current.start();
    });

    // Should continue from 55, not reset to 60
    expect(result.current.remainingSeconds).toBe(55);
  });

  it("triggers onExpire callback and stops when deadline expires", () => {
    const onExpire = vi.fn();
    const { result } = renderHook(() => useGameTimer({ durationSeconds: 60, onExpire }));

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(60000);
    });

    expect(result.current.remainingSeconds).toBe(0);
    expect(result.current.elapsedSeconds).toBe(60);
    expect(result.current.formattedTime).toBe("00:00");
    expect(result.current.urgency).toBe("expired");
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isExpired).toBe(true);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it("handles browser background-tab throttling via visibilitychange", () => {
    const onExpire = vi.fn();
    const { result } = renderHook(() => useGameTimer({ durationSeconds: 60, onExpire }));

    act(() => {
      result.current.start();
    });

    // Simulate tab backgrounding: time jumps ahead 65 seconds without interval execution
    const originalDateNow = Date.now;
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now + 65000);

    // Simulate returning to tab
    act(() => {
      Object.defineProperty(document, "visibilityState", {
        value: "visible",
        writable: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(result.current.remainingSeconds).toBe(0);
    expect(result.current.isExpired).toBe(true);
    expect(onExpire).toHaveBeenCalledTimes(1);

    Date.now = originalDateNow;
  });

  it("stop() pauses the timer and prevents further decrements", () => {
    const { result } = renderHook(() => useGameTimer({ durationSeconds: 60 }));

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(result.current.remainingSeconds).toBe(50);

    act(() => {
      result.current.stop();
    });

    expect(result.current.isRunning).toBe(false);

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    // Remained at 50
    expect(result.current.remainingSeconds).toBe(50);
  });

  it("reset() returns timer to initial state cleanly", () => {
    const { result } = renderHook(() => useGameTimer({ durationSeconds: 60 }));

    act(() => {
      result.current.start();
      vi.advanceTimersByTime(20000);
    });

    expect(result.current.remainingSeconds).toBe(40);

    act(() => {
      result.current.reset(60);
    });

    expect(result.current.remainingSeconds).toBe(60);
    expect(result.current.elapsedSeconds).toBe(0);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.formattedTime).toBe("01:00");
  });
});
