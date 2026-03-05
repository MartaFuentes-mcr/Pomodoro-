import { useEffect, useState } from "react";

export default function PlayerDock({
  running,
  setRunning,
  secondsLeft,
  formatTime,
  currentTrackData,
  toggleMusic,
  musicOn,
  musicProvider,
  connectMusicProvider,
  externalPlayerUrl,
}) {
  const [popupOpen, setPopupOpen] = useState(false);

  useEffect(() => {
    if (musicProvider !== "spotify" && musicProvider !== "youtube") {
      setPopupOpen(false);
    }
  }, [musicProvider]);

  useEffect(() => {
    if (musicProvider === "spotify" || musicProvider === "youtube") {
      setPopupOpen(true);
    }
  }, [musicProvider]);

  function handleProviderTap(targetProvider) {
    if (targetProvider !== "spotify" && targetProvider !== "youtube") return;
    if (musicProvider !== targetProvider) {
      connectMusicProvider(targetProvider);
      setPopupOpen(true);
      return;
    }
    setPopupOpen((prev) => !prev);
  }

  return (
    <div className="player-dock">
      <button type="button" className={`btn-play ${running ? "pause" : ""}`} onClick={() => setRunning((r) => !r)} title="start/stop">
        {running ? "❚❚" : "▶"}
      </button>
      <div className="dock-meta">
        <strong>{formatTime(secondsLeft)}</strong>
        <span>
          {running ? "en curso" : "pausado"} | {currentTrackData?.name ?? "sin pista"}
        </span>
      </div>
      <button type="button" className="dock-small" onClick={toggleMusic} title="play/pausa musica">
        {currentTrackData?.type === "external" ? (musicOn ? "cover on" : "cover off") : musicOn ? "♫ on" : "♫ off"}
      </button>
      <div className="provider-pops">
        <button
          type="button"
          className={`spotify-pop outside provider-spotify ${musicProvider === "spotify" ? "linked" : ""} ${
            musicProvider === "spotify" && musicOn ? "on" : ""
          }`}
          onClick={() => handleProviderTap("spotify")}
          title="spotify popup"
        >
          <span className="spotify-glyph" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </button>
        <button
          type="button"
          className={`spotify-pop outside provider-youtube ${musicProvider === "youtube" ? "linked" : ""} ${
            musicProvider === "youtube" && musicOn ? "on" : ""
          }`}
          onClick={() => handleProviderTap("youtube")}
          title="youtube popup"
        >
          <span className="youtube-glyph" aria-hidden="true" />
        </button>
      </div>
      {popupOpen && (musicProvider === "spotify" || musicProvider === "youtube") && externalPlayerUrl && (
        <div className="spotify-popup" role="dialog" aria-label="music player">
          <button type="button" className="spotify-popup-close" onClick={() => setPopupOpen(false)} aria-label="cerrar reproductor">
            ×
          </button>
          <iframe
            title="music-popup-player"
            src={externalPlayerUrl}
            allow="autoplay; encrypted-media; clipboard-write; picture-in-picture"
            className="spotify-popup-frame"
          />
        </div>
      )}
    </div>
  );
}
