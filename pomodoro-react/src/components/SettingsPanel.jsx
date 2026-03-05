import { useMemo, useRef, useState } from "react";
import { BACKGROUNDS } from "../constants/appData";

export default function SettingsPanel({
  settingsOpen,
  setSettingsOpen,
  mode,
  setMode,
  durations,
  updateDuration,
  longBreakEvery,
  setLongBreakEvery,
  bgTab,
  setBgTab,
  animatedBackgrounds,
  animatedBackgroundId,
  setAnimatedBackgroundId,
  clearAnimatedBackground,
  backgroundUrl,
  setBackgroundUrl,
  communityBackgrounds,
  communityCount,
  communityFilter,
  setCommunityFilter,
  communityOwner,
  setCommunityOwner,
  communityMessage,
  setCommunityMessage,
  importInputRef,
  customBackground,
  setCustomBackground,
  applyCustomBackground,
  handleCommunityUpload,
  toggleCommunityFavorite,
  likeCommunityBackground,
  removeCommunityBackground,
  exportCommunityGallery,
  importCommunityGallery,
  musicCategory,
  setMusicCategory,
  setCustomYouTubeTrack,
  musicProvider,
  disconnectMusicProvider,
  changeTrack,
  currentTrackData,
  availableTracks,
  currentTrack,
  setCurrentTrack,
  volume,
  setVolume,
  running,
  setRunning,
  setSecondsLeft,
  initialSeconds,
  toggleMusic,
  musicOn,
  toggleNotifications,
  notificationsEnabled,
  soundsEnabled,
  setSoundsEnabled,
  soundLevel,
  setSoundLevel,
  autoStartBreaks,
  setAutoStartBreaks,
  autoStartPomodoros,
  setAutoStartPomodoros,
  screen,
  metricsPrefs,
  toggleMetricSection,
  moveMetricSection,
  setShowWeather,
  resetMetricsLayout,
  applyMetricsPreset,
  customMetricsPresets,
  saveCustomMetricsPreset,
  applyCustomMetricsPreset,
  deleteCustomMetricsPreset,
  exportCustomMetricsPresets,
  importCustomMetricsPresets,
}) {
  const [customPresetName, setCustomPresetName] = useState("");
  const [importStatus, setImportStatus] = useState("");
  const [popularSearch, setPopularSearch] = useState("");
  const [popularCategory, setPopularCategory] = useState("all");
  const [youtubeUrlInput, setYoutubeUrlInput] = useState("");
  const [youtubeUrlMessage, setYoutubeUrlMessage] = useState("");
  const importFileRef = useRef(null);
  const metricSectionLabels = {
    kpi: "KPIs",
    progress: "Progreso",
    goals: "Objetivos",
    weekly: "Semana",
    insights: "Insights",
    trend: "Tendencia",
  };
  function onSaveCustomPreset() {
    const saved = saveCustomMetricsPreset(customPresetName);
    if (saved) setCustomPresetName("");
  }

  async function onImportPresetFile(event) {
    const file = event.target.files?.[0];
    const result = await importCustomMetricsPresets(file);
    setImportStatus(result.message);
    if (importFileRef.current) importFileRef.current.value = "";
  }

  const popularCategories = useMemo(() => {
    const set = new Set(BACKGROUNDS.map((item) => item.category || "otros"));
    return ["all", ...Array.from(set)];
  }, []);

  const filteredPopularBackgrounds = useMemo(() => {
    const query = popularSearch.trim().toLowerCase();
    return BACKGROUNDS.filter((item) => {
      const category = item.category || "otros";
      if (popularCategory !== "all" && category !== popularCategory) return false;
      if (!query) return true;
      return `${item.name} ${category}`.toLowerCase().includes(query);
    });
  }, [popularSearch, popularCategory]);

  function onApplyYoutubeUrl() {
    const ok = setCustomYouTubeTrack(youtubeUrlInput);
    if (!ok) {
      setYoutubeUrlMessage("Enlace invalido");
      return;
    }
    setYoutubeUrlMessage("Enlace aplicado");
    setYoutubeUrlInput("");
  }

  return (
    <aside className={`settings-panel ${settingsOpen ? "open" : "closed"}`}>
      <div className="settings-head">
        <h2>Settings</h2>
        <button type="button" onClick={() => setSettingsOpen(false)}>
          ×
        </button>
      </div>

      <div className="settings-block">
        <p className="panel-title">modo</p>
        <div className="background-list">
          <button type="button" className={`mode-pill ${mode === "pomodoro" ? "active" : ""}`} onClick={() => setMode("pomodoro")}>
            pomodoro
          </button>
          <button type="button" className={`mode-pill ${mode === "short" ? "active" : ""}`} onClick={() => setMode("short")}>
            break
          </button>
          <button type="button" className={`mode-pill ${mode === "long" ? "active" : ""}`} onClick={() => setMode("long")}>
            long break
          </button>
        </div>
      </div>

      <div className="settings-block">
        <p className="panel-title">duraciones</p>
        <div className="slider-row">
          <label htmlFor="dur-pomodoro">timer</label>
          <input
            id="dur-pomodoro"
            type="range"
            min="10"
            max="60"
            value={durations.pomodoro}
            onChange={(e) => updateDuration("pomodoro", Number(e.target.value))}
          />
          <span>{durations.pomodoro}m</span>
        </div>
        <div className="slider-row">
          <label htmlFor="dur-short">break</label>
          <input
            id="dur-short"
            type="range"
            min="1"
            max="20"
            value={durations.short}
            onChange={(e) => updateDuration("short", Number(e.target.value))}
          />
          <span>{durations.short}m</span>
        </div>
        <div className="slider-row">
          <label htmlFor="dur-long">long break</label>
          <input
            id="dur-long"
            type="range"
            min="5"
            max="40"
            value={durations.long}
            onChange={(e) => updateDuration("long", Number(e.target.value))}
          />
          <span>{durations.long}m</span>
        </div>
        <div className="slider-row">
          <label htmlFor="cycles">cycles</label>
          <input
            id="cycles"
            type="range"
            min="2"
            max="8"
            value={longBreakEvery}
            onChange={(e) => setLongBreakEvery(Number(e.target.value))}
          />
          <span>{longBreakEvery}</span>
        </div>
      </div>

      <div className="settings-block">
        <p className="panel-title">fondo</p>
        <div className="background-tabs">
          <button type="button" className={`mode-pill ${bgTab === "popular" ? "active" : ""}`} onClick={() => setBgTab("popular")}>
            popular
          </button>
          <button type="button" className={`mode-pill ${bgTab === "community" ? "active" : ""}`} onClick={() => setBgTab("community")}>
            comunidad
          </button>
          <button type="button" className={`mode-pill ${bgTab === "animated" ? "active" : ""}`} onClick={() => setBgTab("animated")}>
            animados/3D
          </button>
        </div>

        {bgTab === "popular" && (
          <>
            <div className="settings-bg-filter">
              <input
                type="text"
                value={popularSearch}
                onChange={(e) => setPopularSearch(e.target.value)}
                placeholder="buscar fondo..."
              />
              <div className="settings-bg-categories">
                {popularCategories.map((key) => (
                  <button
                    key={key}
                    type="button"
                    className={`bg-option ${popularCategory === key ? "selected" : ""}`}
                    onClick={() => setPopularCategory(key)}
                  >
                    {key === "all" ? "todas" : key}
                  </button>
                ))}
              </div>
            </div>
            <div className="thumb-grid">
              {filteredPopularBackgrounds.map((bg) => (
              <button
                key={bg.name}
                type="button"
                className={`thumb-btn ${backgroundUrl === bg.url ? "selected" : ""}`}
                onClick={() => setBackgroundUrl(bg.url)}
                title={bg.name}
              >
                <img src={bg.url} alt={bg.name} />
                <span>{bg.name}</span>
                <small>{bg.category || "otros"}</small>
              </button>
            ))}
            </div>
          </>
        )}

        {bgTab === "community" && (
          <>
            <div className="community-head-row">
              <input
                type="text"
                value={communityOwner}
                onChange={(e) => setCommunityOwner(e.target.value)}
                placeholder="tu nombre en comunidad"
              />
              <div className="background-list">
                <button
                  type="button"
                  className={`bg-option ${communityFilter === "all" ? "selected" : ""}`}
                  onClick={() => setCommunityFilter("all")}
                >
                  todos ({communityCount})
                </button>
                <button
                  type="button"
                  className={`bg-option ${communityFilter === "favorites" ? "selected" : ""}`}
                  onClick={() => setCommunityFilter("favorites")}
                >
                  favoritos
                </button>
              </div>
            </div>
            {communityBackgrounds.length > 0 ? (
              <div className="thumb-grid">
                {communityBackgrounds.map((entry, index) => (
                  <div key={entry.id} className={`thumb-card ${backgroundUrl === entry.url ? "selected" : ""}`} title={`${entry.name} - por ${entry.by}`}>
                    <button type="button" className="thumb-btn" onClick={() => setBackgroundUrl(entry.url)}>
                      <img src={entry.url} alt={`fondo comunidad ${index + 1}`} />
                      <span>{entry.name || `comunidad ${index + 1}`}</span>
                      <small>por {entry.by || "anon"}</small>
                    </button>
                    <div className="community-actions">
                      <button
                        type="button"
                        className={`bg-option ${entry.favorite ? "selected" : ""}`}
                        onClick={() => toggleCommunityFavorite(entry.id)}
                      >
                        {entry.favorite ? "fav" : "guardar"}
                      </button>
                      <button type="button" className="bg-option" onClick={() => likeCommunityBackground(entry.id)}>
                        like {entry.likes}
                      </button>
                      <button type="button" className="bg-option" onClick={() => removeCommunityBackground(entry.id)}>
                        quitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="hint-text">Todavia no hay fondos de comunidad. Sube uno o pega una URL.</p>
            )}
            <div className="community-transfer-row">
              <button type="button" className="bg-option" onClick={exportCommunityGallery}>
                exportar galeria
              </button>
              <label className="bg-option metrics-import-label">
                importar galeria
                <input
                  ref={importInputRef}
                  type="file"
                  accept="application/json,.json"
                  onChange={(e) => importCommunityGallery(e.target.files?.[0])}
                />
              </label>
            </div>
            {communityMessage && (
              <p className="hint-text" onClick={() => setCommunityMessage("")}>
                {communityMessage}
              </p>
            )}
          </>
        )}

        {bgTab === "animated" && (
          <div className="motion-presets">
            <button
              type="button"
              className={`bg-option ${animatedBackgroundId === "" ? "selected" : ""}`}
              onClick={clearAnimatedBackground}
            >
              sin animado
            </button>
            {animatedBackgrounds.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`bg-option ${animatedBackgroundId === item.id ? "selected" : ""}`}
                onClick={() => setAnimatedBackgroundId(item.id)}
              >
                {item.name}
              </button>
            ))}
          </div>
        )}

        <div className="custom-bg-row">
          <input
            type="text"
            value={customBackground}
            onChange={(e) => setCustomBackground(e.target.value)}
            placeholder="pega URL de imagen"
          />
          <button type="button" onClick={applyCustomBackground}>
            aplicar
          </button>
        </div>
        <label className="upload-label">
          subir imagen
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              handleCommunityUpload(e.target.files?.[0]);
            }}
          />
        </label>
      </div>

      <div className="settings-block">
        <p className="panel-title">music</p>
        <div className="background-list music-categories">
          <button type="button" className={`mode-pill ${musicCategory === "focus" ? "active" : ""}`} onClick={() => setMusicCategory("focus")}>
            focus
          </button>
          <button type="button" className={`mode-pill ${musicCategory === "piano" ? "active" : ""}`} onClick={() => setMusicCategory("piano")}>
            piano covers
          </button>
        </div>
        <div className="background-list music-connect-row">
          {musicProvider && (
            <button type="button" className="bg-option" onClick={disconnectMusicProvider}>
              desconectar
            </button>
          )}
        </div>
        <div className="music-link-row">
          <input
            type="text"
            value={youtubeUrlInput}
            onChange={(e) => setYoutubeUrlInput(e.target.value)}
            placeholder="pega enlace youtube o youtube music"
          />
          <button type="button" className="bg-option" onClick={onApplyYoutubeUrl}>
            usar en youtube
          </button>
        </div>
        {youtubeUrlMessage && <p className="hint-text">{youtubeUrlMessage}</p>}
        <p className="hint-text">
          estado: {musicProvider ? `conectado con ${musicProvider === "youtube" ? "youtube music" : musicProvider}` : "sin conectar"}
        </p>
        <div className="track-row">
          <button type="button" className="bg-option" onClick={() => changeTrack(-1)}>
            prev
          </button>
          <span className="track-name">{currentTrackData?.name ?? "sin pista"}</span>
          <button type="button" className="bg-option" onClick={() => changeTrack(1)}>
            next
          </button>
        </div>
        <div className="background-list">
          {availableTracks.map((track, index) => (
            <button
              key={track.name}
              type="button"
              className={`bg-option ${index === currentTrack ? "selected" : ""}`}
              onClick={() => setCurrentTrack(index)}
            >
              {track.name}
            </button>
          ))}
        </div>
        <div className="volume-row">
          <label htmlFor="volume">volumen</label>
          <input
            id="volume"
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            disabled={currentTrackData?.type !== "audio"}
          />
          <span>{volume}%</span>
        </div>
        {currentTrackData?.type === "external" && <p className="hint-text">Usa el boton del reproductor para escuchar solo audio del cover.</p>}
      </div>

      <div className="settings-block">
        <p className="panel-title">acciones</p>
        <div className="background-list">
          <button
            type="button"
            className="bg-option"
            onClick={() => {
              setRunning(false);
              setSecondsLeft(initialSeconds);
            }}
          >
            reset
          </button>
          <button type="button" className="bg-option" onClick={toggleMusic}>
            {musicOn ? "pausar musica" : "reproducir musica"}
          </button>
          <button type="button" className="bg-option" onClick={toggleNotifications}>
            {notificationsEnabled ? "notificaciones on" : "notificaciones off"}
          </button>
        </div>
        <label className="switch-row">
          <input type="checkbox" checked={autoStartBreaks} onChange={(e) => setAutoStartBreaks(e.target.checked)} />
          auto-start descansos
        </label>
        <label className="switch-row">
          <input type="checkbox" checked={autoStartPomodoros} onChange={(e) => setAutoStartPomodoros(e.target.checked)} />
          auto-start pomodoros
        </label>
        <label className="switch-row">
          <input type="checkbox" checked={soundsEnabled} onChange={(e) => setSoundsEnabled(e.target.checked)} />
          sonido fin de sesion
        </label>
        <div className="background-list">
          <button
            type="button"
            className={`bg-option ${soundLevel === "suave" ? "selected" : ""}`}
            onClick={() => setSoundLevel("suave")}
          >
            suave
          </button>
          <button
            type="button"
            className={`bg-option ${soundLevel === "medio" ? "selected" : ""}`}
            onClick={() => setSoundLevel("medio")}
          >
            medio
          </button>
          <button
            type="button"
            className={`bg-option ${soundLevel === "alto" ? "selected" : ""}`}
            onClick={() => setSoundLevel("alto")}
          >
            alto
          </button>
        </div>
      </div>

      {screen === "metrics" && (
        <div className="settings-block">
          <p className="panel-title">personalizar metricas</p>
          <label className="switch-row">
            <input type="checkbox" checked={metricsPrefs?.showWeather} onChange={(e) => setShowWeather(e.target.checked)} />
            mostrar widget clima/hora
          </label>
          <div className="metrics-presets-row">
            <button type="button" className="bg-option" onClick={() => applyMetricsPreset("minimal")}>
              Minimal
            </button>
            <button type="button" className="bg-option" onClick={() => applyMetricsPreset("analitico")}>
              Analitico
            </button>
            <button type="button" className="bg-option" onClick={() => applyMetricsPreset("clima")}>
              Clima-first
            </button>
          </div>
          <div className="metrics-custom-save">
            <input
              type="text"
              value={customPresetName}
              onChange={(e) => setCustomPresetName(e.target.value)}
              placeholder="nombre preset (ej. mi dashboard)"
            />
            <button type="button" className="bg-option" onClick={onSaveCustomPreset}>
              guardar
            </button>
          </div>
          {customMetricsPresets.length > 0 && (
            <div className="metrics-custom-list">
              {customMetricsPresets.map((preset) => (
                <div key={preset.id} className="metrics-custom-item">
                  <span>{preset.name}</span>
                  <div>
                    <button type="button" className="bg-option" onClick={() => applyCustomMetricsPreset(preset.id)}>
                      usar
                    </button>
                    <button type="button" className="bg-option" onClick={() => deleteCustomMetricsPreset(preset.id)}>
                      borrar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="metrics-transfer-row">
            <button type="button" className="bg-option" onClick={exportCustomMetricsPresets}>
              exportar
            </button>
            <label className="bg-option metrics-import-label">
              importar
              <input ref={importFileRef} type="file" accept="application/json,.json" onChange={onImportPresetFile} />
            </label>
          </div>
          {importStatus && <p className="hint-text">{importStatus}</p>}
          <div className="metrics-settings-list">
            {metricsPrefs.sectionOrder.map((sectionKey, index) => (
              <div key={sectionKey} className="metrics-settings-item">
                <label>
                  <input
                    type="checkbox"
                    checked={metricsPrefs.visibleSections[sectionKey]}
                    onChange={() => toggleMetricSection(sectionKey)}
                  />
                  {metricSectionLabels[sectionKey] || sectionKey}
                </label>
                <div className="metrics-settings-move">
                  <button type="button" onClick={() => moveMetricSection(sectionKey, "up")} disabled={index === 0}>
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveMetricSection(sectionKey, "down")}
                    disabled={index === metricsPrefs.sectionOrder.length - 1}
                  >
                    ↓
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="bg-option metrics-reset-btn" onClick={resetMetricsLayout}>
            reset metricas
          </button>
        </div>
      )}
    </aside>
  );
}
