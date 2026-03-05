import { useEffect, useState } from "react";
import "./App.css";
import BrandHeader from "./components/BrandHeader";
import BackgroundLibraryScreen from "./components/BackgroundLibraryScreen";
import MetricsScreen from "./components/MetricsScreen";
import PlayerDock from "./components/PlayerDock";
import ScreenTabs from "./components/ScreenTabs";
import SettingsPanel from "./components/SettingsPanel";
import TimerScreen from "./components/TimerScreen";
import TodoScreen from "./components/TodoScreen";
import { BACKGROUNDS } from "./constants/appData";
import { formatMinutes, formatTime } from "./utils/time";
import useBackgrounds from "./hooks/useBackgrounds";
import useMusic from "./hooks/useMusic";
import usePomodoro from "./hooks/usePomodoro";
import useTodos from "./hooks/useTodos";
import useWeather from "./hooks/useWeather";
import useDailyGoal from "./hooks/useDailyGoal";
import { METRICS_UI_STORAGE_KEY } from "./constants/storageKeys";

const DEFAULT_METRICS_PREFS = {
  showWeather: true,
  visibleSections: {
    kpi: true,
    progress: true,
    goals: true,
    weekly: true,
    insights: true,
    trend: true,
  },
  sectionOrder: ["kpi", "progress", "goals", "weekly", "insights", "trend"],
};
const METRICS_PRESETS = {
  minimal: {
    showWeather: false,
    visibleSections: { kpi: true, progress: true, goals: false, weekly: true, insights: false, trend: false },
    sectionOrder: ["kpi", "progress", "weekly", "goals", "insights", "trend"],
  },
  analitico: {
    showWeather: true,
    visibleSections: { kpi: true, progress: true, goals: true, weekly: true, insights: true, trend: true },
    sectionOrder: ["kpi", "goals", "progress", "trend", "weekly", "insights"],
  },
  clima: {
    showWeather: true,
    visibleSections: { kpi: true, progress: true, goals: false, weekly: false, insights: true, trend: false },
    sectionOrder: ["kpi", "progress", "insights", "goals", "weekly", "trend"],
  },
};

function normalizeCustomPresetItem(item) {
  if (!item || typeof item !== "object") return null;
  if (typeof item.name !== "string" || !item.name.trim()) return null;
  const prefs = item.prefs && typeof item.prefs === "object" ? item.prefs : null;
  if (!prefs) return null;
  return {
    id: typeof item.id === "string" && item.id ? item.id : `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: item.name.trim(),
    prefs: {
      showWeather: !!prefs.showWeather,
      visibleSections: { ...DEFAULT_METRICS_PREFS.visibleSections, ...(prefs.visibleSections || {}) },
      sectionOrder:
        Array.isArray(prefs.sectionOrder) && prefs.sectionOrder.length > 0
          ? [...prefs.sectionOrder]
          : [...DEFAULT_METRICS_PREFS.sectionOrder],
    },
  };
}

export default function App() {
  const [screen, setScreen] = useState("timer");
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [metricsPrefs, setMetricsPrefs] = useState(DEFAULT_METRICS_PREFS);
  const [customMetricsPresets, setCustomMetricsPresets] = useState([]);

  const backgrounds = useBackgrounds();
  const music = useMusic();
  const pomodoro = usePomodoro();
  const todos = useTodos();
  const weather = useWeather();
  const dailyGoal = useDailyGoal({
    weather: weather.weather,
    currentHour: weather.currentHour,
    todayPomodoros: pomodoro.todayStats.pomodoros,
  });
  const hasAnimatedBackground = !!backgrounds.animatedBackground;

  function resetTimer() {
    pomodoro.setRunning(false);
    pomodoro.setSecondsLeft(pomodoro.initialSeconds);
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(METRICS_UI_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return;
      const persistedPrefs = parsed.prefs && typeof parsed.prefs === "object" ? parsed.prefs : parsed;
      setMetricsPrefs((prev) => ({
        showWeather: typeof persistedPrefs.showWeather === "boolean" ? persistedPrefs.showWeather : prev.showWeather,
        visibleSections: { ...prev.visibleSections, ...(persistedPrefs.visibleSections || {}) },
        sectionOrder:
          Array.isArray(persistedPrefs.sectionOrder) && persistedPrefs.sectionOrder.length > 0
            ? persistedPrefs.sectionOrder
            : prev.sectionOrder,
      }));
      if (Array.isArray(parsed.customPresets)) {
        setCustomMetricsPresets(parsed.customPresets.map(normalizeCustomPresetItem).filter(Boolean));
      }
    } catch {
      // ignore invalid persisted prefs
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      METRICS_UI_STORAGE_KEY,
      JSON.stringify({
        prefs: metricsPrefs,
        customPresets: customMetricsPresets,
      })
    );
  }, [metricsPrefs, customMetricsPresets]);

  function toggleMetricSection(sectionKey) {
    setMetricsPrefs((prev) => ({
      ...prev,
      visibleSections: {
        ...prev.visibleSections,
        [sectionKey]: !prev.visibleSections[sectionKey],
      },
    }));
  }

  function moveMetricSection(sectionKey, direction) {
    setMetricsPrefs((prev) => {
      const list = [...prev.sectionOrder];
      const currentIndex = list.indexOf(sectionKey);
      if (currentIndex < 0) return prev;
      const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (swapIndex < 0 || swapIndex >= list.length) return prev;
      [list[currentIndex], list[swapIndex]] = [list[swapIndex], list[currentIndex]];
      return { ...prev, sectionOrder: list };
    });
  }

  function resetMetricsLayout() {
    setMetricsPrefs(DEFAULT_METRICS_PREFS);
  }

  function applyMetricsPreset(presetKey) {
    const preset = METRICS_PRESETS[presetKey];
    if (!preset) return;
    setMetricsPrefs({
      showWeather: preset.showWeather,
      visibleSections: { ...preset.visibleSections },
      sectionOrder: [...preset.sectionOrder],
    });
  }

  function saveCustomMetricsPreset(name) {
    const safeName = name.trim();
    if (!safeName) return false;
    const presetData = {
      showWeather: metricsPrefs.showWeather,
      visibleSections: { ...metricsPrefs.visibleSections },
      sectionOrder: [...metricsPrefs.sectionOrder],
    };
    setCustomMetricsPresets((prev) => {
      const existing = prev.find((item) => item.name.toLowerCase() === safeName.toLowerCase());
      if (existing) {
        return prev.map((item) => (item.id === existing.id ? { ...item, prefs: presetData } : item));
      }
      return [...prev, { id: `custom-${Date.now()}`, name: safeName, prefs: presetData }];
    });
    return true;
  }

  function applyCustomMetricsPreset(presetId) {
    const preset = customMetricsPresets.find((item) => item.id === presetId);
    if (!preset) return;
    setMetricsPrefs({
      showWeather: !!preset.prefs.showWeather,
      visibleSections: { ...DEFAULT_METRICS_PREFS.visibleSections, ...(preset.prefs.visibleSections || {}) },
      sectionOrder:
        Array.isArray(preset.prefs.sectionOrder) && preset.prefs.sectionOrder.length > 0
          ? [...preset.prefs.sectionOrder]
          : [...DEFAULT_METRICS_PREFS.sectionOrder],
    });
  }

  function deleteCustomMetricsPreset(presetId) {
    setCustomMetricsPresets((prev) => prev.filter((item) => item.id !== presetId));
  }

  function exportCustomMetricsPresets() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      customPresets: customMetricsPresets,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "study-sanctuary-metrics-presets.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function importCustomMetricsPresets(file) {
    if (!file) return { ok: false, message: "Archivo no valido" };
    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw);
      const incomingList = Array.isArray(parsed) ? parsed : parsed?.customPresets;
      if (!Array.isArray(incomingList)) {
        return { ok: false, message: "Formato JSON invalido" };
      }
      const normalized = incomingList.map(normalizeCustomPresetItem).filter(Boolean);
      if (normalized.length === 0) {
        return { ok: false, message: "No se encontraron presets validos" };
      }
      setCustomMetricsPresets((prev) => {
        const merged = [...prev];
        normalized.forEach((incoming) => {
          const existingIndex = merged.findIndex((item) => item.name.toLowerCase() === incoming.name.toLowerCase());
          if (existingIndex >= 0) merged[existingIndex] = { ...merged[existingIndex], prefs: incoming.prefs };
          else merged.push(incoming);
        });
        return merged;
      });
      return { ok: true, message: `Importados ${normalized.length} presets` };
    } catch {
      return { ok: false, message: "No se pudo leer el JSON" };
    }
  }

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.target?.tagName === "INPUT" || e.target?.tagName === "TEXTAREA") return;
      if (e.code === "Space") {
        e.preventDefault();
        pomodoro.setRunning((r) => !r);
      }
      if (e.key.toLowerCase() === "r") {
        resetTimer();
      }
      if (e.key.toLowerCase() === "m") {
        music.toggleMusic();
      }
      if (e.key.toLowerCase() === "n") {
        pomodoro.skipSession();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pomodoro, music]);

  return (
    <div
      className="app"
      style={{
        backgroundImage: hasAnimatedBackground
          ? "linear-gradient(120deg, #0f2238 0%, #173149 52%, #0b1d31 100%)"
          : backgrounds.backgroundUrl
            ? `linear-gradient(120deg, rgba(18, 36, 60, 0.45) 0%, rgba(22, 42, 64, 0.35) 55%, rgba(10, 20, 34, 0.45) 100%), url(${backgrounds.backgroundUrl})`
            : "linear-gradient(120deg, #274867 0%, #385f7f 48%, #1e334a 100%)",
      }}
    >
      {backgrounds.animatedBackground && (
        <video
          key={backgrounds.animatedBackground.id}
          className="animated-bg-video"
          src={backgrounds.animatedBackground.url}
          autoPlay
          muted
          loop
          playsInline
        />
      )}
      <div className="overlay" />
      <main className={`layout ${screen === "todo" ? "layout-todo" : ""}`}>
        <button type="button" className="settings-fab" onClick={() => setSettingsOpen((v) => !v)}>
          settings
        </button>

        <ScreenTabs screen={screen} setScreen={setScreen} />
        <BrandHeader
          screen={screen}
          modeLabel={pomodoro.modeLabel}
          completedPomodoros={pomodoro.completedPomodoros}
          pendingTodos={todos.pendingTodos}
          completedTodos={todos.completedTodos}
        />

        {screen === "timer" && (
          <TimerScreen
            secondsLeft={pomodoro.secondsLeft}
            progress={pomodoro.progress}
            running={pomodoro.running}
            mode={pomodoro.mode}
            setMode={pomodoro.setMode}
            durations={pomodoro.durations}
            completedPomodoros={pomodoro.completedPomodoros}
            pomodoroStreak={pomodoro.pomodoroStreak}
            longBreakEvery={pomodoro.longBreakEvery}
            onReset={resetTimer}
            onAddMinute={() => pomodoro.adjustSeconds(60)}
            onSubMinute={() => pomodoro.adjustSeconds(-60)}
            onSkip={pomodoro.skipSession}
            formatTime={formatTime}
          />
        )}
        {screen === "metrics" && (
          <MetricsScreen
            focusSecondsTotal={pomodoro.focusSecondsTotal}
            breakSecondsTotal={pomodoro.breakSecondsTotal}
            completedPomodoros={pomodoro.completedPomodoros}
            concentration={pomodoro.concentration}
            todayStats={pomodoro.todayStats}
            avgFocusPerActiveDay={pomodoro.avgFocusPerActiveDay}
            activeDays={pomodoro.activeDays}
            weeklyStreak={pomodoro.weeklyStreak}
            weeklyStats={pomodoro.weeklyStats}
            last14Stats={pomodoro.last14Stats}
            bestFocusDay={pomodoro.bestFocusDay}
            weeklyFocusTotal={pomodoro.weeklyFocusTotal}
            weeklyPomodoros={pomodoro.weeklyPomodoros}
            previousWeekFocusTotal={pomodoro.previousWeekFocusTotal}
            weekOverWeekFocusDelta={pomodoro.weekOverWeekFocusDelta}
            formatMinutes={formatMinutes}
            weather={weather.weather}
            weatherLoading={weather.loading}
            weatherError={weather.error}
            currentTime={weather.currentTime}
            weatherText={weather.weatherText}
            weatherLastUpdated={weather.lastUpdated}
            weatherLocationMode={weather.locationMode}
            weatherLocationOptions={weather.locationOptions}
            setWeatherLocationMode={weather.setLocationMode}
            refreshWeather={weather.refreshWeather}
            weatherSuggestion={weather.studySuggestion}
            weatherCurrentHour={weather.currentHour}
            weatherNextHours={weather.nextHours}
            dailyGoal={dailyGoal.goal}
            dailyEnergy={dailyGoal.energy}
            dailyGoalProgress={dailyGoal.progress}
            metricsPrefs={metricsPrefs}
          />
        )}
        {screen === "todo" && (
          <TodoScreen
            todoInput={todos.todoInput}
            setTodoInput={todos.setTodoInput}
            addTodo={todos.addTodo}
            pendingTodos={todos.pendingTodos}
            todayTodos={todos.todayTodos}
            nextTodos={todos.nextTodos}
            completedTodos={todos.completedTodos}
            clearCompletedTodos={todos.clearCompletedTodos}
            todos={todos.todos}
            toggleTodo={todos.toggleTodo}
            updateTodoDetails={todos.updateTodoDetails}
            updateTodoTitle={todos.updateTodoTitle}
            setTodoPriority={todos.setTodoPriority}
            addSubtask={todos.addSubtask}
            toggleSubtask={todos.toggleSubtask}
            deleteSubtask={todos.deleteSubtask}
            reorderTodos={todos.reorderTodos}
            addComment={todos.addComment}
            moveTodoToBucket={todos.moveTodoToBucket}
            deleteTodo={todos.deleteTodo}
          />
        )}
        {screen === "fondos" && (
          <BackgroundLibraryScreen
            popularBackgrounds={BACKGROUNDS}
            animatedBackgrounds={backgrounds.animatedBackgrounds}
            animatedBackgroundId={backgrounds.animatedBackgroundId}
            setAnimatedBackgroundId={backgrounds.setAnimatedBackgroundId}
            clearAnimatedBackground={backgrounds.clearAnimatedBackground}
            allCommunityBackgrounds={backgrounds.allCommunityBackgrounds}
            favoriteCommunityBackgrounds={backgrounds.favoriteCommunityBackgrounds}
            backgroundUrl={backgrounds.backgroundUrl}
            setBackgroundUrl={backgrounds.setBackgroundUrl}
            toggleCommunityFavorite={backgrounds.toggleCommunityFavorite}
            likeCommunityBackground={backgrounds.likeCommunityBackground}
          />
        )}

        {screen === "timer" && (
          <PlayerDock
            running={pomodoro.running}
            setRunning={pomodoro.setRunning}
            secondsLeft={pomodoro.secondsLeft}
            formatTime={formatTime}
            currentTrackData={music.currentTrackData}
            toggleMusic={music.toggleMusic}
            musicOn={music.musicOn}
          />
        )}

        <SettingsPanel
          settingsOpen={settingsOpen}
          setSettingsOpen={setSettingsOpen}
          mode={pomodoro.mode}
          setMode={pomodoro.setMode}
          durations={pomodoro.durations}
          updateDuration={pomodoro.updateDuration}
          longBreakEvery={pomodoro.longBreakEvery}
          setLongBreakEvery={pomodoro.setLongBreakEvery}
          bgTab={backgrounds.bgTab}
          setBgTab={backgrounds.setBgTab}
          animatedBackgrounds={backgrounds.animatedBackgrounds}
          animatedBackgroundId={backgrounds.animatedBackgroundId}
          setAnimatedBackgroundId={backgrounds.setAnimatedBackgroundId}
          clearAnimatedBackground={backgrounds.clearAnimatedBackground}
          backgroundUrl={backgrounds.backgroundUrl}
          setBackgroundUrl={backgrounds.setBackgroundUrl}
          communityBackgrounds={backgrounds.communityBackgrounds}
          communityCount={backgrounds.communityCount}
          communityFilter={backgrounds.communityFilter}
          setCommunityFilter={backgrounds.setCommunityFilter}
          communityOwner={backgrounds.communityOwner}
          setCommunityOwner={backgrounds.setCommunityOwner}
          communityMessage={backgrounds.communityMessage}
          setCommunityMessage={backgrounds.setCommunityMessage}
          importInputRef={backgrounds.importInputRef}
          customBackground={backgrounds.customBackground}
          setCustomBackground={backgrounds.setCustomBackground}
          applyCustomBackground={backgrounds.applyCustomBackground}
          handleCommunityUpload={backgrounds.handleCommunityUpload}
          toggleCommunityFavorite={backgrounds.toggleCommunityFavorite}
          likeCommunityBackground={backgrounds.likeCommunityBackground}
          removeCommunityBackground={backgrounds.removeCommunityBackground}
          exportCommunityGallery={backgrounds.exportCommunityGallery}
          importCommunityGallery={backgrounds.importCommunityGallery}
          musicCategory={music.musicCategory}
          setMusicCategory={music.setMusicCategory}
          connectMusicProvider={music.connectMusicProvider}
          musicProvider={music.musicProvider}
          disconnectMusicProvider={music.disconnectMusicProvider}
          changeTrack={music.changeTrack}
          currentTrackData={music.currentTrackData}
          availableTracks={music.availableTracks}
          currentTrack={music.currentTrack}
          setCurrentTrack={music.setCurrentTrack}
          volume={music.volume}
          setVolume={music.setVolume}
          running={pomodoro.running}
          setRunning={pomodoro.setRunning}
          setSecondsLeft={pomodoro.setSecondsLeft}
          initialSeconds={pomodoro.initialSeconds}
          toggleMusic={music.toggleMusic}
          musicOn={music.musicOn}
          toggleNotifications={pomodoro.toggleNotifications}
          notificationsEnabled={pomodoro.notificationsEnabled}
          soundsEnabled={pomodoro.soundsEnabled}
          setSoundsEnabled={pomodoro.setSoundsEnabled}
          soundLevel={pomodoro.soundLevel}
          setSoundLevel={pomodoro.setSoundLevel}
          autoStartBreaks={pomodoro.autoStartBreaks}
          setAutoStartBreaks={pomodoro.setAutoStartBreaks}
          autoStartPomodoros={pomodoro.autoStartPomodoros}
          setAutoStartPomodoros={pomodoro.setAutoStartPomodoros}
          screen={screen}
          metricsPrefs={metricsPrefs}
          toggleMetricSection={toggleMetricSection}
          moveMetricSection={moveMetricSection}
          setShowWeather={(value) => setMetricsPrefs((prev) => ({ ...prev, showWeather: value }))}
          resetMetricsLayout={resetMetricsLayout}
          applyMetricsPreset={applyMetricsPreset}
          customMetricsPresets={customMetricsPresets}
          saveCustomMetricsPreset={saveCustomMetricsPreset}
          applyCustomMetricsPreset={applyCustomMetricsPreset}
          deleteCustomMetricsPreset={deleteCustomMetricsPreset}
          exportCustomMetricsPresets={exportCustomMetricsPresets}
          importCustomMetricsPresets={importCustomMetricsPresets}
        />

        {music.externalPlayerUrl && (
          <iframe
            title="external-audio-player"
            src={music.externalPlayerUrl}
            allow="autoplay; encrypted-media"
            className="hidden-player"
          />
        )}
      </main>
    </div>
  );
}
