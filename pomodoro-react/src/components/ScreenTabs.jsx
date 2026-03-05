export default function ScreenTabs({ screen, setScreen }) {
  return (
    <div className="screen-tabs">
      <button type="button" className={`mode-pill ${screen === "timer" ? "active" : ""}`} onClick={() => setScreen("timer")}>
        timer
      </button>
      <button type="button" className={`mode-pill ${screen === "metrics" ? "active" : ""}`} onClick={() => setScreen("metrics")}>
        metricas
      </button>
      <button type="button" className={`mode-pill ${screen === "todo" ? "active" : ""}`} onClick={() => setScreen("todo")}>
        to-do
      </button>
      <button type="button" className={`mode-pill ${screen === "fondos" ? "active" : ""}`} onClick={() => setScreen("fondos")}>
        fondos
      </button>
    </div>
  );
}
