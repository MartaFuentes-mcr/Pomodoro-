import { useEffect, useMemo, useState } from "react";
import { DAILY_GOAL_STORAGE_KEY } from "../constants/storageKeys";

function computeEnergyAndGoal(weather, currentHour) {
  let score = 60;

  if (currentHour >= 10 && currentHour <= 13) score += 15;
  else if (currentHour >= 14 && currentHour <= 18) score += 8;
  else if (currentHour >= 22 || currentHour <= 6) score -= 22;

  if (weather) {
    const temp = Number(weather.temperature);
    const code = Number(weather.code);

    if (!Number.isNaN(temp)) {
      if (temp >= 31) score -= 18;
      else if (temp >= 27) score -= 8;
      else if (temp <= 5) score -= 10;
      else if (temp >= 16 && temp <= 24) score += 5;
    }

    if ([95, 96, 99].includes(code)) score -= 20;
    else if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) score -= 8;
    else if ([1, 2].includes(code)) score += 3;
    else if (code === 0) score += 5;
  }

  const safeScore = Math.max(15, Math.min(95, score));
  const energyLabel = safeScore >= 75 ? "alta" : safeScore >= 50 ? "media" : "baja";
  const suggestedGoal = safeScore >= 80 ? 7 : safeScore >= 65 ? 6 : safeScore >= 50 ? 5 : safeScore >= 35 ? 4 : 3;

  return { energyLabel, suggestedGoal };
}

export default function useDailyGoal({ weather, currentHour, todayPomodoros }) {
  const [savedGoal, setSavedGoal] = useState(null);
  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const computed = useMemo(() => computeEnergyAndGoal(weather, currentHour), [weather, currentHour]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DAILY_GOAL_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const dayData = parsed?.[todayKey];
      if (dayData && typeof dayData.goal === "number") {
        setSavedGoal(dayData);
      }
    } catch {
      setSavedGoal(null);
    }
  }, [todayKey]);

  useEffect(() => {
    const dayData = {
      goal: computed.suggestedGoal,
      energy: computed.energyLabel,
      updatedAt: new Date().toISOString(),
    };

    setSavedGoal(dayData);

    try {
      const raw = localStorage.getItem(DAILY_GOAL_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      localStorage.setItem(
        DAILY_GOAL_STORAGE_KEY,
        JSON.stringify({
          ...parsed,
          [todayKey]: dayData,
        })
      );
    } catch {
      // ignore storage failures
    }
  }, [todayKey, computed.suggestedGoal, computed.energyLabel]);

  const goal = savedGoal?.goal ?? computed.suggestedGoal;
  const energy = savedGoal?.energy ?? computed.energyLabel;
  const progress = Math.round((Math.min(todayPomodoros, goal) / Math.max(goal, 1)) * 100);

  return {
    goal,
    energy,
    progress,
  };
}
