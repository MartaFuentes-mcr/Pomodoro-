export default function PlayerDock({ running, setRunning, secondsLeft, formatTime, currentTrackData, toggleMusic, musicOn }) {
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
    </div>
  );
}
