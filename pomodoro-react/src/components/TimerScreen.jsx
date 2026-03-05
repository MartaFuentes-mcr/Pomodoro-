export default function TimerScreen({
  secondsLeft,
  progress,
  running,
  mode,
  setMode,
  durations,
  completedPomodoros,
  pomodoroStreak,
  longBreakEvery,
  onReset,
  onAddMinute,
  onSubMinute,
  onSkip,
  formatTime,
}) {
  const cycleIndex = pomodoroStreak % longBreakEvery;

  return (
    <section className="timer-main">
      <div className="timer-modes">
        <button type="button" className={mode === "pomodoro" ? "active" : ""} onClick={() => setMode("pomodoro")}>
          foco {durations.pomodoro}m
        </button>
        <button type="button" className={mode === "short" ? "active" : ""} onClick={() => setMode("short")}>
          break {durations.short}m
        </button>
        <button type="button" className={mode === "long" ? "active" : ""} onClick={() => setMode("long")}>
          long {durations.long}m
        </button>
      </div>
      <div className="clock">{formatTime(secondsLeft)}</div>
      <div className="progress-wrap" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-bar" style={{ width: `${progress}%` }}>
          <span className="progress-glow" />
        </div>
      </div>
      <div className="progress-meta">
        <span>{Math.round(progress)}%</span>
        <span>{running ? "en progreso" : "en pausa"}</span>
      </div>
      <div className="timer-controls">
        <button type="button" onClick={onSubMinute}>
          -1m
        </button>
        <button type="button" onClick={onAddMinute}>
          +1m
        </button>
        <button type="button" onClick={onSkip}>
          saltar
        </button>
        <button type="button" onClick={onReset}>
          reset
        </button>
      </div>
      <div className="timer-cycle">
        <span>ciclo</span>
        <div className="cycle-dots">
          {Array.from({ length: longBreakEvery }).map((_, idx) => (
            <i key={`dot-${idx}`} className={idx < cycleIndex ? "done" : idx === cycleIndex ? "current" : ""} />
          ))}
        </div>
        <small>{completedPomodoros} pomodoros completados</small>
      </div>
      <p className="hotkeys">atajos: espacio iniciar/pausar, R reset, N saltar, M musica</p>
    </section>
  );
}
