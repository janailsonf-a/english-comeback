import { DEVELOPMENT_PACE } from "../journey/narrative/config";
import type { RecordingDraft } from "../journey/narrative/types";
import type { MissionAction } from "../missions/types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { AppState } from "react-native";
import { createGameSession, type GameSession } from "../domain/gameSession";
import type { CompletionResult } from "../domain/game";
import {
  clockFromDate,
  addCalendarDays,
  inactivityDays,
} from "../journey/calendar";
import type { Clock } from "../journey/types";
import type { DeveloperAction } from "../journey/developerActions";
import type { ProgressStorage } from "../persistence/progressStorage";
import { mockGameService, type GameService } from "../services/gameService";
import { localProgressStorage } from "../services/localProgressStorage";
import { gameReducer, initialGameState, type GameState } from "./gameReducer";
interface GameContextValue extends GameState {
  isSaving: boolean;
  saveError: string | null;
  today: string;
  activateQuest: (id: string) => Promise<boolean>;
  completeQuest: (id: string) => Promise<boolean>;
  startJourney: () => Promise<boolean>;
  resetJourney: (confirmed: boolean) => Promise<boolean>;
  completeBossStep: (id: string) => Promise<boolean>;
  developerAction: (action: DeveloperAction) => Promise<boolean>;
  skipPrologue: () => Promise<boolean>;
  saveTimeCapsule: (recording: RecordingDraft) => Promise<boolean>;
  equipTitle: (titleId: string | null) => Promise<boolean>;
  missionAction: (action: MissionAction) => Promise<boolean>;
  dismissFeedback: (id: string) => void;
}
const GameContext = createContext<GameContextValue | null>(null);
const systemClock = () => clockFromDate(new Date());
export function GameProvider({
  children,
  service = mockGameService,
  persistence = localProgressStorage,
  clock = systemClock,
}: PropsWithChildren<{
  service?: GameService;
  persistence?: ProgressStorage;
  clock?: () => Clock;
}>) {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const [pendingSaves, setPendingSaves] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [today, setToday] = useState(clock().day);
  const sessionRef = useRef<GameSession | null>(null);
  const simulatedDay = useRef<string | null>(null);
  const now = useCallback(() => {
    const real = clock();
    // Development simulations keep their forward reference after reloading.
    // Reset exits simulation. Ordinary journeys always use the local clock.
    if (__DEV__ && simulatedDay.current && simulatedDay.current > real.day) {
      const date = new Date(real.instant);
      date.setDate(
        date.getDate() + inactivityDays(real.day, simulatedDay.current),
      );
      return { instant: date.toISOString(), day: simulatedDay.current };
    }
    return real;
  }, [clock]);
  useEffect(() => {
    let cancelled = false;
    service
      .loadGame()
      .then((initial) => persistence.load(initial))
      .then(async (snapshot) => {
        if (cancelled) return;
        simulatedDay.current = snapshot.journey?.developmentData
          ? snapshot.journey.lastObservedDay
          : null;
        const session = createGameSession(snapshot, persistence);
        const time = now();
        const restored = snapshot.journey?.startedAt
          ? (await session.journey({ type: "refresh" }, time)).snapshot
          : snapshot;
        if (cancelled) return;
        sessionRef.current = session;
        setToday(time.day);
        dispatch({ type: "loaded", snapshot: restored });
      })
      .catch(() => {
        if (!cancelled)
          dispatch({
            type: "loadFailed",
            error:
              "Your saved journey could not be loaded. Please reopen the app. Your data has been preserved.",
          });
      });
    return () => {
      cancelled = true;
      sessionRef.current = null;
    };
  }, [service, persistence, now]);
  const run = useCallback(
    async (
      action: (session: GameSession, time: Clock) => Promise<CompletionResult>,
    ) => {
      const session = sessionRef.current;
      if (!session) return false;
      setPendingSaves((count) => count + 1);
      setSaveError(null);
      try {
        const time = now();
        const result = await action(session, time);
        if (sessionRef.current !== session) return false;
        simulatedDay.current = result.snapshot.journey?.developmentData
          ? result.snapshot.journey.lastObservedDay
          : null;
        setToday(result.snapshot.journey?.lastObservedDay ?? time.day);
        dispatch({ type: "committed", ...result });
        return true;
      } catch {
        if (sessionRef.current === session)
          setSaveError("We couldn't save your progress. Please try again.");
        return false;
      } finally {
        if (sessionRef.current === session)
          setPendingSaves((count) => count - 1);
      }
    },
    [now],
  );
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (status) => {
      if (status === "active")
        void run((session, time) => session.journey({ type: "refresh" }, time));
    });
    return () => subscription.remove();
  }, [run]);
  const activateQuest = useCallback(
    (questId: string) =>
      run((session, time) => session.activateQuest(questId, time)),
    [run],
  );
  const completeQuest = useCallback(
    (questId: string) =>
      run((session, time) => session.completeQuest(questId, time)),
    [run],
  );
  const startJourney = useCallback(
    () => run((session, time) => session.journey({ type: "start" }, time)),
    [run],
  );
  const resetJourney = useCallback(
    (confirmed: boolean) => {
      if (!__DEV__) return Promise.resolve(false);
      return run((session, time) =>
        session.journey({ type: "reset", confirmed }, time),
      );
    },
    [run],
  );
  const completeBossStep = useCallback(
    (stepId: string) =>
      run((session, time) =>
        session.journey({ type: "bossStep", stepId }, time),
      ),
    [run],
  );
  const developerAction = useCallback(
    (action: DeveloperAction) => {
      if (!__DEV__) return Promise.resolve(false);
      return run((session, time) => {
        if (action === "inactivity" || action === "simulatePace") {
          const days =
            action === "simulatePace"
              ? DEVELOPMENT_PACE.advanceCalendarDays
              : 7;
          const day = addCalendarDays(time.day, days);
          const date = new Date(time.instant);
          date.setDate(date.getDate() + days);
          return session.developer(
            action,
            { day, instant: date.toISOString() },
            true,
          );
        }
        return session.developer(action, time, true);
      });
    },
    [run],
  );
  const skipPrologue = useCallback(
    () =>
      run((session, time) => session.narrative({ type: "skipPrologue" }, time)),
    [run],
  );
  const saveTimeCapsule = useCallback(
    (recording: RecordingDraft) =>
      run((session, time) =>
        session.narrative({ type: "saveCapsule", recording }, time),
      ),
    [run],
  );
  const equipTitle = useCallback(
    (titleId: string | null) =>
      run((session, time) =>
        session.narrative({ type: "equipTitle", titleId }, time),
      ),
    [run],
  );
  const missionAction = useCallback(
    (action: MissionAction) =>
      run((session, time) => session.mission(action, time)),
    [run],
  );
  const dismissFeedback = useCallback(
    (questId: string) => dispatch({ type: "dismissFeedback", questId }),
    [],
  );
  return (
    <GameContext.Provider
      value={{
        ...state,
        today,
        isSaving: pendingSaves > 0,
        saveError,
        activateQuest,
        completeQuest,
        startJourney,
        resetJourney,
        completeBossStep,
        developerAction,
        dismissFeedback,
        skipPrologue,
        saveTimeCapsule,
        equipTitle,
        missionAction,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within GameProvider.");
  return context;
}
