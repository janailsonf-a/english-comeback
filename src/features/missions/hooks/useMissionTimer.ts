import { useEffect, useRef, useState } from "react";
import type { MissionRun } from "../../game/missions/types";

interface TimerValue {
  attemptId: string | null;
  seconds: number;
}

export function useMissionTimer(run: MissionRun | null) {
  const attemptId = run?.attemptId ?? null;
  const base = run?.elapsedSeconds ?? 0;
  const status = run?.status ?? null;
  const [timer, setTimer] = useState<TimerValue>({
    attemptId,
    seconds: base,
  });
  const elapsedSeconds =
    timer.attemptId === attemptId ? Math.max(base, timer.seconds) : base;
  const elapsedRef = useRef(elapsedSeconds);

  useEffect(() => {
    elapsedRef.current = elapsedSeconds;
  }, [elapsedSeconds]);

  useEffect(() => {
    if (!attemptId || status !== "IN_PROGRESS") return;
    const startedAt = Date.now();
    const timerId = setInterval(() => {
      setTimer({
        attemptId,
        seconds: base + Math.floor((Date.now() - startedAt) / 1000),
      });
    }, 1000);
    return () => clearInterval(timerId);
  }, [attemptId, base, status]);

  return { elapsedSeconds, elapsedRef };
}
