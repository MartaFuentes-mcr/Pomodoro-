import { useCallback, useEffect, useMemo, useState } from "react";
import { MODES } from "../constants/appData";
import { STUDY_STATS_STORAGE_KEY, TIMER_SETTINGS_STORAGE_KEY } from "../constants/storageKeys";

function playCompletionTone(type, level = "medio") {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = type === "focus-end" ? [784, 988, 1175] : [523, 659, 784];
    const now = ctx.currentTime + 0.02;
    const levelMap = { suave: 0.65, medio: 1, alto: 1.45 };
    const levelBoost = levelMap[level] || 1;
    const master = ctx.createGain();
    master.gain.setValueAtTime(Math.min(1.3, 0.75 * levelBoost), now);
    master.connect(ctx.destination);

    notes.forEach((freq, idx) => {
      const start = now + idx * 0.2;
      const end = start + 0.17;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx === notes.length - 1 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(freq, start);
      osc.connect(gain);
      gain.connect(master);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(Math.min(0.25, 0.12 * levelBoost), start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      osc.start(start);
      osc.stop(end + 0.02);
    });

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    setTimeout(() => {
      ctx.close();
    }, 1200);
  } catch {
    // ignore audio errors
  }
}

export default function usePomodoro() {
  const [durations, setDurations] = useState({ pomodoro: 25, short: 5, long: 15 });
  const [longBreakEvery, setLongBreakEvery] = useState(4);
  const [autoStartBreaks, setAutoStartBreaks] = useState(true);
  const [autoStartPomodoros, setAutoStartPomodoros] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [soundLevel, setSoundLevel] = useState("medio");

  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [pomodoroStreak, setPomodoroStreak] = useState(0);
  const [pendingAutoStart, setPendingAutoStart] = useState(false);
  const [focusSecondsTotal, setFocusSecondsTotal] = useState(0);
  const [breakSecondsTotal, setBreakSecondsTotal] = useState(0);
  const [studyStats, setStudyStats] = useState({});

  const [mode, setMode] = useState("pomodoro");
  const initialSeconds = useMemo(() => durations[mode] * 60, [durations, mode]);
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [running, setRunning] = useState(false);

  const progress = useMemo(() => ((initialSeconds - secondsLeft) / initialSeconds) * 100, [initialSeconds, secondsLeft]);
  const concentration = useMemo(() => {
    const total = focusSecondsTotal + breakSecondsTotal;
    if (total === 0) return 0;
    return Math.round((focusSecondsTotal / total) * 100);
  }, [focusSecondsTotal, breakSecondsTotal]);

  const weeklyStats = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().slice(0, 10);
      const label = date.toLocaleDateString("es-ES", { weekday: "short" });
      const item = studyStats[key] || { focusSeconds: 0, breakSeconds: 0, pomodoros: 0 };
      days.push({ key, label, ...item });
    }
    return days;
  }, [studyStats]);

  const bestFocusDay = useMemo(() => {
    if (weeklyStats.length === 0) return 0;
    return Math.max(...weeklyStats.map((d) => d.focusSeconds));
  }, [weeklyStats]);

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const todayStats = useMemo(
    () => studyStats[todayKey] || { focusSeconds: 0, breakSeconds: 0, pomodoros: 0 },
    [studyStats, todayKey]
  );
  const weeklyFocusTotal = useMemo(() => weeklyStats.reduce((acc, d) => acc + d.focusSeconds, 0), [weeklyStats]);
  const weeklyPomodoros = useMemo(() => weeklyStats.reduce((acc, d) => acc + d.pomodoros, 0), [weeklyStats]);
  const activeDays = useMemo(() => weeklyStats.filter((d) => d.focusSeconds > 0).length, [weeklyStats]);
  const avgFocusPerActiveDay = useMemo(() => {
    if (activeDays === 0) return 0;
    return Math.floor(weeklyFocusTotal / activeDays);
  }, [weeklyFocusTotal, activeDays]);
  const weeklyStreak = useMemo(() => {
    let streak = 0;
    for (let i = weeklyStats.length - 1; i >= 0; i -= 1) {
      if (weeklyStats[i].focusSeconds > 0) streak += 1;
      else break;
    }
    return streak;
  }, [weeklyStats]);
  const last14Stats = useMemo(() => {
    const days = [];
    for (let i = 13; i >= 0; i -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().slice(0, 10);
      const item = studyStats[key] || { focusSeconds: 0, breakSeconds: 0, pomodoros: 0 };
      days.push({
        key,
        label: date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" }),
        ...item,
      });
    }
    return days;
  }, [studyStats]);
  const previousWeekFocusTotal = useMemo(() => {
    let total = 0;
    for (let i = 14; i >= 8; i -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().slice(0, 10);
      total += studyStats[key]?.focusSeconds || 0;
    }
    return total;
  }, [studyStats]);
  const weekOverWeekFocusDelta = useMemo(() => {
    if (previousWeekFocusTotal === 0) {
      return weeklyFocusTotal > 0 ? 100 : 0;
    }
    return Math.round(((weeklyFocusTotal - previousWeekFocusTotal) / previousWeekFocusTotal) * 100);
  }, [weeklyFocusTotal, previousWeekFocusTotal]);

  const advanceSession = useCallback(
    (autoStartOverride = null, notify = true) => {
      let nextMode = "pomodoro";
      let shouldAutoStart = false;

      if (mode === "pomodoro") {
        setCompletedPomodoros((n) => n + 1);
        const dayKey = new Date().toISOString().slice(0, 10);
        setStudyStats((prev) => {
          const current = prev[dayKey] || { focusSeconds: 0, breakSeconds: 0, pomodoros: 0 };
          return {
            ...prev,
            [dayKey]: {
              ...current,
              focusSeconds: current.focusSeconds + durations.pomodoro * 60,
              pomodoros: current.pomodoros + 1,
            },
          };
        });
        setPomodoroStreak((s) => {
          const nextStreak = s + 1;
          nextMode = nextStreak % longBreakEvery === 0 ? "long" : "short";
          shouldAutoStart = nextMode === "pomodoro" ? autoStartPomodoros : autoStartBreaks;
          return nextStreak;
        });
      } else {
        const dayKey = new Date().toISOString().slice(0, 10);
        setStudyStats((prev) => {
          const current = prev[dayKey] || { focusSeconds: 0, breakSeconds: 0, pomodoros: 0 };
          return {
            ...prev,
            [dayKey]: {
              ...current,
              breakSeconds: current.breakSeconds + durations[mode] * 60,
            },
          };
        });
        nextMode = "pomodoro";
        shouldAutoStart = autoStartPomodoros;
        if (mode === "long") setPomodoroStreak(0);
      }

      if (autoStartOverride !== null) shouldAutoStart = autoStartOverride;
      setPendingAutoStart(shouldAutoStart);
      setMode(nextMode);

      if (soundsEnabled) {
        playCompletionTone(mode === "pomodoro" ? "focus-end" : "break-end", soundLevel);
      }
      if (!notify) return;
      if (notificationsEnabled && "Notification" in window && Notification.permission === "granted") {
        new Notification("Study Sanctuary", {
          body: `Termino ${MODES[mode].label}. Siguiente: ${MODES[nextMode].label}.`,
        });
      } else {
        alert(`Termino ${MODES[mode].label}. Siguiente: ${MODES[nextMode].label}.`);
      }
    },
    [mode, longBreakEvery, autoStartBreaks, autoStartPomodoros, notificationsEnabled, soundsEnabled, soundLevel, durations]
  );

  useEffect(() => {
    setSecondsLeft(initialSeconds);
    setRunning(pendingAutoStart);
    if (pendingAutoStart) setPendingAutoStart(false);
  }, [initialSeconds, pendingAutoStart]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
      if (mode === "pomodoro") setFocusSecondsTotal((v) => v + 1);
      else setBreakSecondsTotal((v) => v + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [running, mode]);

  useEffect(() => {
    if (secondsLeft !== 0 || !running) return;
    advanceSession();
  }, [secondsLeft, running, advanceSession]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STUDY_STATS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") setStudyStats(parsed);
    } catch {
      setStudyStats({});
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STUDY_STATS_STORAGE_KEY, JSON.stringify(studyStats));
  }, [studyStats]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TIMER_SETTINGS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.durations) setDurations((prev) => ({ ...prev, ...parsed.durations }));
      if (typeof parsed?.longBreakEvery === "number") setLongBreakEvery(parsed.longBreakEvery);
      if (typeof parsed?.autoStartBreaks === "boolean") setAutoStartBreaks(parsed.autoStartBreaks);
      if (typeof parsed?.autoStartPomodoros === "boolean") setAutoStartPomodoros(parsed.autoStartPomodoros);
      if (typeof parsed?.notificationsEnabled === "boolean") setNotificationsEnabled(parsed.notificationsEnabled);
      if (typeof parsed?.soundsEnabled === "boolean") setSoundsEnabled(parsed.soundsEnabled);
      if (typeof parsed?.soundLevel === "string") setSoundLevel(parsed.soundLevel);
    } catch {
      // ignore invalid persisted data
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      TIMER_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        durations,
        longBreakEvery,
        autoStartBreaks,
        autoStartPomodoros,
        notificationsEnabled,
        soundsEnabled,
        soundLevel,
      })
    );
  }, [durations, longBreakEvery, autoStartBreaks, autoStartPomodoros, notificationsEnabled, soundsEnabled, soundLevel]);

  async function toggleNotifications() {
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      return;
    }
    if (!("Notification" in window)) {
      alert("Este navegador no soporta notificaciones.");
      return;
    }
    if (Notification.permission === "granted") {
      setNotificationsEnabled(true);
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === "granted");
  }

  function updateDuration(modeKey, minutes) {
    const safe = Math.max(1, Math.min(90, minutes));
    setDurations((d) => ({ ...d, [modeKey]: safe }));
  }

  function adjustSeconds(deltaSeconds) {
    setSecondsLeft((current) => Math.max(0, Math.min(initialSeconds, current + deltaSeconds)));
  }

  function skipSession() {
    setRunning(false);
    advanceSession(false, false);
  }

  return {
    mode,
    modeLabel: MODES[mode].label,
    setMode,
    durations,
    updateDuration,
    longBreakEvery,
    setLongBreakEvery,
    autoStartBreaks,
    setAutoStartBreaks,
    autoStartPomodoros,
    setAutoStartPomodoros,
    notificationsEnabled,
    toggleNotifications,
    soundsEnabled,
    setSoundsEnabled,
    soundLevel,
    setSoundLevel,
    initialSeconds,
    secondsLeft,
    setSecondsLeft,
    running,
    setRunning,
    progress,
    completedPomodoros,
    focusSecondsTotal,
    breakSecondsTotal,
    concentration,
    todayStats,
    avgFocusPerActiveDay,
    activeDays,
    weeklyStreak,
    weeklyStats,
    last14Stats,
    bestFocusDay,
    weeklyFocusTotal,
    weeklyPomodoros,
    previousWeekFocusTotal,
    weekOverWeekFocusDelta,
    pomodoroStreak,
    adjustSeconds,
    skipSession,
  };
}
