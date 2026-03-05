import { useEffect, useMemo, useState } from "react";
import "./App.css";

const MODES = {
  pomodoro: { label: "pomodoro" },
  short: { label: "breve descanso" },
  long: { label: "descanso largo" },
};

const BACKGROUNDS = [
  {
    name: "alpes amanecer",
    url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2400&q=80",
  },
  {
    name: "lago glaciar",
    url: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=2400&q=80",
  },
  {
    name: "bosque neblina",
    url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=2400&q=80",
  },
  {
    name: "costa serena",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2400&q=80",
  },
  {
    name: "desierto dorado",
    url: "https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?auto=format&fit=crop&w=2400&q=80",
  },
  {
    name: "valle verde",
    url: "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=2400&q=80",
  },
];

const TRACKS = [
  { name: "Focus Flow", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { name: "Deep Work", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { name: "Lo-Fi Breeze", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
];

const COMMUNITY_STORAGE_KEY = "focus-atelier-community-backgrounds";
const TIMER_SETTINGS_STORAGE_KEY = "focus-atelier-timer-settings";
const MUSIC_PROVIDER_STORAGE_KEY = "focus-atelier-music-provider";

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export default function App() {
  const [backgroundUrl, setBackgroundUrl] = useState(BACKGROUNDS[0].url);
  const [customBackground, setCustomBackground] = useState("");
  const [bgTab, setBgTab] = useState("popular");
  const [communityBackgrounds, setCommunityBackgrounds] = useState([]);
  const [durations, setDurations] = useState({ pomodoro: 25, short: 5, long: 15 });
  const [longBreakEvery, setLongBreakEvery] = useState(4);
  const [autoStartBreaks, setAutoStartBreaks] = useState(true);
  const [autoStartPomodoros, setAutoStartPomodoros] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [musicOn, setMusicOn] = useState(false);
  const [musicProvider, setMusicProvider] = useState("");
  const [currentTrack, setCurrentTrack] = useState(0);
  const [volume, setVolume] = useState(35);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [pomodoroStreak, setPomodoroStreak] = useState(0);
  const [pendingAutoStart, setPendingAutoStart] = useState(false);
  const [audio] = useState(() => new Audio(TRACKS[0].url));

  const [mode, setMode] = useState("pomodoro");
  const initialSeconds = useMemo(() => durations[mode] * 60, [durations, mode]);

  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [running, setRunning] = useState(false);
  const progress = useMemo(() => ((initialSeconds - secondsLeft) / initialSeconds) * 100, [initialSeconds, secondsLeft]);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
    setRunning(pendingAutoStart);
    if (pendingAutoStart) {
      setPendingAutoStart(false);
    }
  }, [initialSeconds, pendingAutoStart]);

  useEffect(() => {
    if (!running) return;

    const id = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);

    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (secondsLeft === 0 && running) {
      let nextMode = "pomodoro";
      let shouldAutoStart = false;

      if (mode === "pomodoro") {
        setCompletedPomodoros((n) => n + 1);
        setPomodoroStreak((s) => {
          const nextStreak = s + 1;
          nextMode = nextStreak % longBreakEvery === 0 ? "long" : "short";
          shouldAutoStart = nextMode === "pomodoro" ? autoStartPomodoros : autoStartBreaks;
          return nextStreak;
        });
      } else {
        nextMode = "pomodoro";
        shouldAutoStart = autoStartPomodoros;
        if (mode === "long") {
          setPomodoroStreak(0);
        }
      }

      setPendingAutoStart(shouldAutoStart);
      setMode(nextMode);

      if (notificationsEnabled && "Notification" in window && Notification.permission === "granted") {
        new Notification("Study Sanctuary", {
          body: `Termino ${MODES[mode].label}. Siguiente: ${MODES[nextMode].label}.`,
        });
      } else {
        alert(`Termino ${MODES[mode].label}. Siguiente: ${MODES[nextMode].label}.`);
      }
    }
  }, [secondsLeft, running, mode, longBreakEvery, autoStartBreaks, autoStartPomodoros, notificationsEnabled]);

  useEffect(() => {
    audio.loop = false;
    audio.volume = volume / 100;
    const onEnded = () => {
      setCurrentTrack((i) => (i + 1) % TRACKS.length);
    };
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("ended", onEnded);
      audio.pause();
      audio.currentTime = 0;
    };
  }, [audio, volume]);

  useEffect(() => {
    const isPlaying = musicOn;
    audio.pause();
    audio.src = TRACKS[currentTrack].url;
    audio.currentTime = 0;
    if (isPlaying) {
      audio.play().catch(() => setMusicOn(false));
    }
  }, [audio, currentTrack, musicOn]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.target?.tagName === "INPUT") return;
      if (e.code === "Space") {
        e.preventDefault();
        setRunning((r) => !r);
      }
      if (e.key.toLowerCase() === "r") {
        setRunning(false);
        setSecondsLeft(initialSeconds);
      }
      if (e.key.toLowerCase() === "m") {
        toggleMusic();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [initialSeconds, musicOn, audio]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COMMUNITY_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setCommunityBackgrounds(parsed.filter((v) => typeof v === "string"));
      }
    } catch {
      setCommunityBackgrounds([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(COMMUNITY_STORAGE_KEY, JSON.stringify(communityBackgrounds));
  }, [communityBackgrounds]);

  useEffect(() => {
    const savedProvider = localStorage.getItem(MUSIC_PROVIDER_STORAGE_KEY);
    if (savedProvider) {
      setMusicProvider(savedProvider);
    }

    const params = new URLSearchParams(window.location.search);
    const providerFromCallback = params.get("music_provider");
    if (providerFromCallback === "spotify" || providerFromCallback === "youtube") {
      setMusicProvider(providerFromCallback);
      localStorage.setItem(MUSIC_PROVIDER_STORAGE_KEY, providerFromCallback);
      params.delete("music_provider");
      const nextSearch = params.toString();
      const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`;
      window.history.replaceState({}, "", nextUrl);
    }
  }, []);

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
      })
    );
  }, [durations, longBreakEvery, autoStartBreaks, autoStartPomodoros, notificationsEnabled]);

  async function toggleMusic() {
    if (musicOn) {
      audio.pause();
      setMusicOn(false);
      return;
    }

    try {
      await audio.play();
      setMusicOn(true);
    } catch {
      alert("No se pudo iniciar el audio. Intenta de nuevo.");
    }
  }

  function changeTrack(delta) {
    setCurrentTrack((i) => {
      const next = (i + delta + TRACKS.length) % TRACKS.length;
      return next;
    });
  }

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

  function applyCustomBackground() {
    if (!customBackground.trim()) return;
    setBackgroundUrl(customBackground.trim());
    setCommunityBackgrounds((items) => {
      const next = [customBackground.trim(), ...items.filter((v) => v !== customBackground.trim())];
      return next.slice(0, 12);
    });
    setCustomBackground("");
  }

  function addCommunityBackground(url) {
    if (!url) return;
    setCommunityBackgrounds((items) => {
      const next = [url, ...items.filter((v) => v !== url)];
      return next.slice(0, 12);
    });
  }

  async function handleCommunityUpload(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) return;
      addCommunityBackground(result);
      setBackgroundUrl(result);
    };
    reader.readAsDataURL(file);
  }

  function updateDuration(modeKey, minutes) {
    const safe = Math.max(1, Math.min(90, minutes));
    setDurations((d) => ({ ...d, [modeKey]: safe }));
  }

  function connectMusicProvider(provider) {
    const envKey = provider === "spotify" ? "VITE_SPOTIFY_AUTH_URL" : "VITE_YTM_AUTH_URL";
    const authUrl = import.meta.env[envKey];
    if (!authUrl) {
      alert(`Falta configurar ${envKey} en tu .env para conectar ${provider}.`);
      return;
    }
    window.location.href = authUrl;
  }

  function disconnectMusicProvider() {
    setMusicProvider("");
    localStorage.removeItem(MUSIC_PROVIDER_STORAGE_KEY);
  }

  return (
    <div
      className="app"
      style={{
        backgroundImage: `url(${backgroundUrl})`,
      }}
    >
      <div className="overlay" />

      <main className="layout">
        <button type="button" className="settings-fab" onClick={() => setSettingsOpen((v) => !v)}>
          settings
        </button>

        <header className="brand">
          <h1>Study Sanctuary</h1>
          <p>{MODES[mode].label} | pomodoros completados: {completedPomodoros}</p>
        </header>

        <section className="timer-main">
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
          <p className="hotkeys">atajos: espacio iniciar/pausar, R reset, M musica</p>
        </section>

        <div className="player-dock">
          <button type="button" className={`btn-play ${running ? "pause" : ""}`} onClick={() => setRunning((r) => !r)} title="start/stop">
            {running ? "❚❚" : "▶"}
          </button>
          <div className="dock-meta">
            <strong>{formatTime(secondsLeft)}</strong>
            <span>{running ? "en curso" : "pausado"} | {TRACKS[currentTrack].name}</span>
          </div>
          <button type="button" className="dock-small" onClick={toggleMusic} title="play/pausa musica">
            {musicOn ? "♫ on" : "♫ off"}
          </button>
        </div>

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
            </div>

            {bgTab === "popular" && (
              <div className="thumb-grid">
                {BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.name}
                    type="button"
                    className={`thumb-btn ${backgroundUrl === bg.url ? "selected" : ""}`}
                    onClick={() => setBackgroundUrl(bg.url)}
                    title={bg.name}
                  >
                    <img src={bg.url} alt={bg.name} />
                    <span>{bg.name}</span>
                  </button>
                ))}
              </div>
            )}

            {bgTab === "community" && (
              <>
                {communityBackgrounds.length > 0 ? (
                  <div className="thumb-grid">
                    {communityBackgrounds.map((url, index) => (
                      <button
                        key={`${index}-${url.slice(0, 16)}`}
                        type="button"
                        className={`thumb-btn ${backgroundUrl === url ? "selected" : ""}`}
                        onClick={() => setBackgroundUrl(url)}
                        title={`comunidad ${index + 1}`}
                      >
                        <img src={url} alt={`fondo comunidad ${index + 1}`} />
                        <span>comunidad {index + 1}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="hint-text">Todavia no hay fondos de comunidad. Sube uno o pega una URL.</p>
                )}
              </>
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
            <div className="background-list music-connect-row">
              <button type="button" className="bg-option" onClick={() => connectMusicProvider("spotify")}>
                conectar spotify
              </button>
              <button type="button" className="bg-option" onClick={() => connectMusicProvider("youtube")}>
                conectar youtube music
              </button>
              {musicProvider && (
                <button type="button" className="bg-option" onClick={disconnectMusicProvider}>
                  desconectar
                </button>
              )}
            </div>
            <p className="hint-text">
              estado: {musicProvider ? `conectado con ${musicProvider === "youtube" ? "youtube music" : musicProvider}` : "sin conectar"}
            </p>
            <div className="track-row">
              <button type="button" className="bg-option" onClick={() => changeTrack(-1)}>
                prev
              </button>
              <span className="track-name">{TRACKS[currentTrack].name}</span>
              <button type="button" className="bg-option" onClick={() => changeTrack(1)}>
                next
              </button>
            </div>
            <div className="background-list">
              {TRACKS.map((track, index) => (
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
              />
              <span>{volume}%</span>
            </div>
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
          </div>
        </aside>

      </main>
    </div>
  );
}
