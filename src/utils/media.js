export function throwVector(side, portrait) {
  if (portrait) {
    return side === "first"
      ? { x: 0, y: -window.innerHeight * 0.98 }
      : { x: 0, y: window.innerHeight * 0.98 };
  }

  return side === "first"
    ? { x: -window.innerWidth * 0.98, y: 0 }
    : { x: window.innerWidth * 0.98, y: 0 };
}

export function enterVector(side, portrait) {
  const v = throwVector(side, portrait);
  /** Directional offset from outside frame; challenger steps into contention */
  const enterScale = 0.38;
  return {
    x: v.x * enterScale,
    y: v.y * enterScale,
    opacity: 0.1,
    scale: 0.905,
    rotate: portrait ? v.y / 298 : v.x / 312,
  };
}

export function normalizeUpload(data, id) {
  return {
    id,
    arenaId: data.arenaId,
    title: data.title || "Untitled",
    creator: data.creator || "@me",
    type: data.type,
    src: data.src,
    trimStart: data.type === "video" ? Number(data.trimStart || 0) : 0,
    trimEnd: data.type === "video" ? Number(data.trimEnd || 7) : 0,
    rating: 3000,
    confidence: 0.55,
    wins: 0,
    losses: 0,
    uploaded: true,
    fit: "cover",
    position: "center center",
  };
}

export function safeDuration(item) {
  if (!item) return 2200;
  if (item.type !== "video") return 2600;
  return Math.max(1200, ((item.trimEnd || 7) - (item.trimStart || 0)) * 1000);
}
