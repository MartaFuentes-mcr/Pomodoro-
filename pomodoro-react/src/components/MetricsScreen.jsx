function getWeatherVisual(code = 0) {
  if ([95, 96, 99].includes(code)) return "storm";
  if ([71, 73, 75, 77].includes(code)) return "snow";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "rain";
  if ([45, 48].includes(code)) return "fog";
  if ([1, 2, 3].includes(code)) return "clouds";
  return "sun";
}

function getDayPhase(hour = 12) {
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 19) return "day";
  if (hour >= 19 && hour < 22) return "evening";
  return "night";
}

export default function MetricsScreen({
  focusSecondsTotal,
  breakSecondsTotal,
  completedPomodoros,
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
  formatMinutes,
  weather,
  weatherLoading,
  weatherError,
  currentTime,
  weatherText,
  weatherLastUpdated,
  weatherLocationMode,
  weatherLocationOptions,
  setWeatherLocationMode,
  refreshWeather,
  weatherSuggestion,
  weatherCurrentHour,
  weatherNextHours,
  dailyGoal,
  dailyEnergy,
  dailyGoalProgress,
  metricsPrefs,
}) {
  const bestTrendDay = Math.max(...last14Stats.map((d) => d.focusSeconds), 0);
  const activeLast14Days = last14Stats.filter((d) => d.focusSeconds > 0).length;
  const consistency14 = Math.round((activeLast14Days / 14) * 100);
  const weeklyGoal = Math.max(1, dailyGoal * 7);
  const weeklyGoalProgress = Math.min(100, Math.round((weeklyPomodoros / weeklyGoal) * 100));
  const weatherVisual = getWeatherVisual(weather?.code);
  const dayPhase = getDayPhase(weatherCurrentHour);
  const bestDayEntry = last14Stats.reduce(
    (best, day) => (day.focusSeconds > best.focusSeconds ? day : best),
    { label: "--/--", focusSeconds: 0 }
  );
  const visibleSections = metricsPrefs?.visibleSections || {};
  const sectionOrder = metricsPrefs?.sectionOrder || ["kpi", "progress", "goals", "weekly", "insights", "trend"];
  const sections = {
    kpi: (
      <div className="metrics-kpi-grid" key="kpi">
        <article className="metric-card metric-kpi">
          <h3>Foco Total</h3>
          <p>{formatMinutes(focusSecondsTotal)} min</p>
          <small>acumulado</small>
        </article>
        <article className="metric-card metric-kpi">
          <h3>Pomodoros</h3>
          <p>{completedPomodoros}</p>
          <small>completados</small>
        </article>
        <article className="metric-card metric-kpi">
          <h3>Hoy</h3>
          <p>{formatMinutes(todayStats.focusSeconds)} min</p>
          <small>{todayStats.pomodoros} pomodoros</small>
        </article>
        <article className="metric-card metric-kpi">
          <h3>Meta Hoy</h3>
          <p>{dailyGoal}</p>
          <small>energia {dailyEnergy}</small>
        </article>
      </div>
    ),
    progress: (
      <div className="metrics-progress-grid" key="progress">
        <article className="metric-card progress-card">
          <h3>Concentracion</h3>
          <div className="progress-line">
            <div className="progress-line-fill concentration-fill" style={{ width: `${Math.min(100, concentration)}%` }} />
          </div>
          <p>{concentration}%</p>
          <small>foco vs descanso</small>
        </article>
        <article className="metric-card progress-card">
          <h3>Progreso Meta Diario</h3>
          <div className="progress-line">
            <div className="progress-line-fill goal-fill" style={{ width: `${Math.min(100, dailyGoalProgress)}%` }} />
          </div>
          <p>{dailyGoalProgress}%</p>
          <small>meta: {dailyGoal} pomodoros</small>
        </article>
        <article className="metric-card mini-stats">
          <h3>Resumen Semana</h3>
          <ul>
            <li>Descanso total: {formatMinutes(breakSecondsTotal)} min</li>
            <li>Promedio activo: {formatMinutes(avgFocusPerActiveDay)} min/dia</li>
            <li>Dias activos: {activeDays}/7</li>
            <li>Racha: {weeklyStreak} dias</li>
          </ul>
        </article>
      </div>
    ),
    goals: (
      <div className="metrics-goals-grid" key="goals">
        <article className="metric-card progress-card">
          <h3>Objetivo Semanal</h3>
          <div className="progress-line">
            <div className="progress-line-fill goal-fill" style={{ width: `${weeklyGoalProgress}%` }} />
          </div>
          <p>{weeklyGoalProgress}%</p>
          <small>
            {weeklyPomodoros} / {weeklyGoal} pomodoros
          </small>
        </article>
        <article className="metric-card progress-card">
          <h3>Consistencia 14 dias</h3>
          <div className="progress-line">
            <div className="progress-line-fill concentration-fill" style={{ width: `${consistency14}%` }} />
          </div>
          <p>{consistency14}%</p>
          <small>
            {activeLast14Days}/14 dias activos | mejor: {bestDayEntry.label} ({formatMinutes(bestDayEntry.focusSeconds)} min)
          </small>
        </article>
      </div>
    ),
    weekly: (
      <div className="weekly-card" key="weekly">
        <h3>Semana de estudio</h3>
        <div className="weekly-bars">
          {weeklyStats.map((day) => {
            const height = bestFocusDay > 0 ? Math.max(14, (day.focusSeconds / bestFocusDay) * 100) : 14;
            return (
              <div key={day.key} className="bar-col">
                <div className="bar-track">
                  <div className="bar-fill" style={{ height: `${height}%` }} />
                </div>
                <span className="bar-label">{day.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    ),
    insights: (
      <div className="insights-card" key="insights">
        <h3>Insights</h3>
        <ul>
          <li>Foco semanal: {formatMinutes(weeklyFocusTotal)} min</li>
          <li>Pomodoros semanales: {weeklyPomodoros}</li>
          <li>Balance foco/descanso: {concentration}% de foco</li>
          <li>Meta sugerida: {Math.max(4, Math.ceil(weeklyPomodoros / 7))} pomodoros al dia</li>
          <li>Meta diaria dinamica: {dailyGoal} pomodoros</li>
          <li>Energia estimada: {dailyEnergy}</li>
          <li>Progreso de meta hoy: {dailyGoalProgress}%</li>
        </ul>
      </div>
    ),
    trend: (
      <div className="trend-card" key="trend">
        <div className="trend-head">
          <h3>Tendencia 14 dias</h3>
          <span className={`trend-delta ${weekOverWeekFocusDelta >= 0 ? "up" : "down"}`}>
            {weekOverWeekFocusDelta >= 0 ? "+" : ""}
            {weekOverWeekFocusDelta}% vs semana anterior
          </span>
        </div>
        <p className="trend-meta">
          actual: {formatMinutes(weeklyFocusTotal)} min | anterior: {formatMinutes(previousWeekFocusTotal)} min
        </p>
        <div className="trend-bars">
          {last14Stats.map((day) => {
            const height = bestTrendDay > 0 ? Math.max(8, (day.focusSeconds / bestTrendDay) * 100) : 8;
            return (
              <div key={day.key} className="trend-col" title={`${day.label} - ${formatMinutes(day.focusSeconds)} min`}>
                <div className="trend-track">
                  <div className="trend-fill" style={{ height: `${height}%` }} />
                </div>
                <span>{day.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    ),
  };
  const orderedVisibleSections = sectionOrder.filter((sectionKey) => visibleSections[sectionKey] && sections[sectionKey]).map((k) => sections[k]);

  return (
    <section className="metrics-main">
      <div className={`metrics-shell ${metricsPrefs?.showWeather ? "" : "no-aside"}`}>
        <div className="metrics-content">
          {orderedVisibleSections}
        </div>

        {metricsPrefs?.showWeather && (
          <aside className={`weather-widget weather-phase-${dayPhase}`}>
          <div className="weather-head">
            <h3>Hora y Clima</h3>
            <button type="button" onClick={refreshWeather}>
              refrescar
            </button>
          </div>
          <div className={`weather-hero weather-hero-${weatherVisual}`}>
            <div className="weather-icon" aria-hidden="true">
              <div className="icon-sun-core" />
              <div className="icon-sun-ring" />
              <div className="icon-cloud c1" />
              <div className="icon-cloud c2" />
              <div className="icon-rain">
                <span />
                <span />
                <span />
              </div>
              <div className="icon-snow">
                <span />
                <span />
              </div>
              <div className="icon-lightning" />
              <div className="icon-fog">
                <span />
                <span />
                <span />
              </div>
            </div>
            <div className="weather-hero-copy">
              <p className="weather-time">{currentTime}</p>
              <small>{weatherText || "Sin datos de clima"}</small>
            </div>
          </div>
          <select value={weatherLocationMode} onChange={(e) => setWeatherLocationMode(e.target.value)}>
            {weatherLocationOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {weatherLoading && <small>cargando clima...</small>}
          {!weatherLoading && weatherError && <small>{weatherError}</small>}
          {!weatherLoading && !weatherError && weather && (
            <>
              <small>{weather.location}</small>
              <small>{weatherText}</small>
              <p className="weather-temp">{Math.round(weather.temperature)}°C</p>
              <small>
                min {Math.round(weather.min)}° / max {Math.round(weather.max)}°
              </small>
              <small>viento {Math.round(weather.wind)} km/h</small>
              {weatherLastUpdated && <small>actualizado {weatherLastUpdated}</small>}
              {weatherSuggestion && <p className="weather-suggestion">{weatherSuggestion}</p>}
              {weatherNextHours?.length > 0 && (
                <div className="weather-forecast">
                  <strong>Proximas 3 horas</strong>
                  <div className="weather-forecast-list">
                    {weatherNextHours.map((hour) => (
                      <div key={hour.key} className="weather-forecast-item" title={hour.label}>
                        <span>{hour.time}</span>
                        <strong>{Math.round(hour.temp)}°</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="weather-goal-chip">
                Meta hoy: {dailyGoal} | avance {dailyGoalProgress}%
              </div>
            </>
          )}
          </aside>
        )}
      </div>
    </section>
  );
}
