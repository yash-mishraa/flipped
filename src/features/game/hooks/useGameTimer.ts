"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  calculateElapsedSeconds,
  calculateRemainingSeconds,
  DEFAULT_ROUND_DURATION_SECONDS,
  formatTime,
  getTimerUrgency,
  type TimerUrgency,
} from "../domain/timer-utils";

export interface UseGameTimerOptions {
  readonly durationSeconds?: number;
  readonly tickIntervalMs?: number;
  readonly onTick?: (elapsedSeconds: number, remainingSeconds: number) => void;
  readonly onExpire?: () => void;
}

export interface UseGameTimerReturn {
  readonly remainingSeconds: number;
  readonly elapsedSeconds: number;
  readonly formattedTime: string;
  readonly urgency: TimerUrgency;
  readonly isRunning: boolean;
  readonly isExpired: boolean;
  readonly start: () => void;
  readonly stop: () => void;
  readonly reset: (newDurationSeconds?: number) => void;
  readonly getAuthoritativeRemainingMs: () => number;
}

/**
 * High-precision countdown timer hook for Flipped.
 * Recalculates remaining time directly from a deadline timestamp to eliminate
 * cumulative tick drift and handle browser background-tab throttling correctly.
 */
export function useGameTimer({
  durationSeconds = DEFAULT_ROUND_DURATION_SECONDS,
  tickIntervalMs = 100,
  onTick,
  onExpire,
}: UseGameTimerOptions = {}): UseGameTimerReturn {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(durationSeconds);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  const durationRef = useRef<number>(durationSeconds);
  durationRef.current = durationSeconds;

  const startedAtRef = useRef<number | null>(null);
  const deadlineRef = useRef<number | null>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const isRunningRef = useRef<boolean>(false);
  const isExpiredRef = useRef<boolean>(false);

  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const clearTimerInterval = useCallback(() => {
    if (intervalIdRef.current !== null) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    clearTimerInterval();
    isRunningRef.current = false;
    setIsRunning(false);
  }, [clearTimerInterval]);

  const getAuthoritativeRemainingMs = useCallback((): number => {
    if (!deadlineRef.current || !isRunningRef.current) {
      if (isExpiredRef.current) return 0;
      return durationRef.current * 1000;
    }
    return Math.max(0, deadlineRef.current - Date.now());
  }, []);

  const handleExpiration = useCallback(() => {
    stop();
    isExpiredRef.current = true;
    setIsExpired(true);
    setRemainingSeconds(0);
    setElapsedSeconds(durationRef.current);

    if (onExpireRef.current) {
      onExpireRef.current();
    }
  }, [stop]);

  const updateTick = useCallback(() => {
    if (!isRunningRef.current || deadlineRef.current === null || startedAtRef.current === null) {
      return;
    }

    const now = Date.now();
    const remainingMs = Math.max(0, deadlineRef.current - now);
    const remainingSec = calculateRemainingSeconds(deadlineRef.current, now);
    const elapsedSec = calculateElapsedSeconds(startedAtRef.current, now, durationRef.current);

    setRemainingSeconds(remainingSec);
    setElapsedSeconds(elapsedSec);

    if (onTickRef.current) {
      onTickRef.current(elapsedSec, remainingSec);
    }

    if (remainingMs <= 0) {
      handleExpiration();
    }
  }, [handleExpiration]);

  const start = useCallback(() => {
    // Idempotent: prevent starting multiple concurrent timers
    if (isRunningRef.current || isExpiredRef.current) {
      return;
    }

    const now = Date.now();
    startedAtRef.current = now;
    deadlineRef.current = now + durationRef.current * 1000;
    isRunningRef.current = true;
    isExpiredRef.current = false;

    setIsRunning(true);
    setIsExpired(false);
    setRemainingSeconds(durationRef.current);
    setElapsedSeconds(0);

    clearTimerInterval();
    intervalIdRef.current = setInterval(updateTick, tickIntervalMs);
  }, [clearTimerInterval, tickIntervalMs, updateTick]);

  const reset = useCallback(
    (newDurationSeconds: number = DEFAULT_ROUND_DURATION_SECONDS) => {
      clearTimerInterval();
      durationRef.current = newDurationSeconds;
      startedAtRef.current = null;
      deadlineRef.current = null;
      isRunningRef.current = false;
      isExpiredRef.current = false;

      setIsRunning(false);
      setIsExpired(false);
      setRemainingSeconds(newDurationSeconds);
      setElapsedSeconds(0);
    },
    [clearTimerInterval]
  );

  // Background tab policy: recalculate immediately upon tab focus / visibilitychange
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isRunningRef.current) {
        updateTick();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [updateTick]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      clearTimerInterval();
    };
  }, [clearTimerInterval]);

  const urgency = getTimerUrgency(remainingSeconds);
  const formattedTime = formatTime(remainingSeconds);

  return {
    remainingSeconds,
    elapsedSeconds,
    formattedTime,
    urgency,
    isRunning,
    isExpired,
    start,
    stop,
    reset,
    getAuthoritativeRemainingMs,
  };
}
