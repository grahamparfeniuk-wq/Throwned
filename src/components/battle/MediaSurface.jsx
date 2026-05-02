import { useEffect, useRef, useState } from "react";
import { arenaById } from "../../utils/ranking";
import { BattleMedia } from "./BattleMedia";

export function MediaSurface({ item, active, paused, dimmed, winner, accent, onHoldStart, onHoldEnd, styles }) {
  const ref = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [item?.src]);

  useEffect(() => {
    if (!item || item.type !== "video") return;

    const video = ref.current;
    if (!video) return;

    const start = Number(item.trimStart || 0);
    const end = Number(item.trimEnd || 7);

    const resetToStart = () => {
      try {
        video.currentTime = start;
      } catch {}
    };

    const playFromStart = () => {
      resetToStart();
      video.muted = false;
      video.playsInline = true;
      const p = video.play();
      if (p?.catch) p.catch(() => {});
    };

    const stop = () => {
      video.pause();
      video.muted = true;
    };

    const onTimeUpdate = () => {
      if (!active || paused) return;
      if (video.currentTime >= end - 0.04) {
        resetToStart();
        const p = video.play();
        if (p?.catch) p.catch(() => {});
      }
    };

    video.addEventListener("timeupdate", onTimeUpdate);

    if (active && !paused) playFromStart();
    else stop();

    return () => video.removeEventListener("timeupdate", onTimeUpdate);
  }, [item?.id, item?.src, item?.trimStart, item?.trimEnd, active, paused]);

  if (!item) return null;

  const isImage = item.type === "image";

  return (
    <div
      style={{ ...styles.surface, boxShadow: winner ? `inset 0 0 58px ${accent}2a` : "none" }}
      onMouseDown={() => onHoldStart(item.id)}
      onMouseUp={onHoldEnd}
      onMouseLeave={onHoldEnd}
      onTouchStart={() => onHoldStart(item.id)}
      onTouchEnd={onHoldEnd}
      onTouchCancel={onHoldEnd}
    >
      <div
        style={{
          ...styles.mediaWrap,
          filter: isImage ? "brightness(1.03)" : winner ? "brightness(1.13)" : active && !paused ? "brightness(1.06)" : "brightness(0.92)",
        }}
      >
        {!failed ? (
          <BattleMedia item={item} refProp={ref} onError={() => setFailed(true)} styles={styles} />
        ) : (
          <div style={{ ...styles.fallback, background: `linear-gradient(180deg, ${accent}22, rgba(0,0,0,.86))` }}>
            <div style={styles.fallbackArena}>{arenaById(item.arenaId).label}</div>
            <div style={styles.fallbackTitle}>{item.title}</div>
            <div style={styles.fallbackCreator}>{item.creator}</div>
          </div>
        )}
      </div>

      <div style={styles.scrim} />
      <div style={styles.vignette} />
      {!isImage && dimmed && <div style={styles.inactive} />}
    </div>
  );
}
