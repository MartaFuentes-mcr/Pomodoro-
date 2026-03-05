export function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export function formatMinutes(totalSeconds) {
  return Math.floor(totalSeconds / 60);
}
