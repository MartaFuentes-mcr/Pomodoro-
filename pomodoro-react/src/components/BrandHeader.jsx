export default function BrandHeader({ screen, modeLabel, completedPomodoros, pendingTodos, completedTodos }) {
  return (
    <header className={`brand ${screen === "metrics" ? "metrics-brand" : ""}`}>
      <h1>Study Sanctuary</h1>
      {screen === "todo" ? (
        <p>to-do list | pendientes: {pendingTodos} | completadas: {completedTodos}</p>
      ) : screen === "fondos" ? (
        <p>libreria de fondos | selecciona y aplica estilo visual</p>
      ) : (
        <p>{modeLabel} | pomodoros completados: {completedPomodoros}</p>
      )}
    </header>
  );
}
