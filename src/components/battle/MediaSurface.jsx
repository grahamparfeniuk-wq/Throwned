import { useEffect, useRef, useState } from "react";
import { arenaById } from "../../utils/ranking";
import { BattleMedia } from "./BattleMedia";

export function MediaSurface({ item, active, paused, dimmed, winner, accent, entranceEmphasis, onHoldStart, onHoldEnd, styles }) {
  const ref = useRef(null);
  const [failed, setFailed] = useState(false);
  const prevItemId = useRef(null);
  const prevActive = useRef(false);

  useEffect(() => {
    setFailed(false);
  }, [item?.src]);

  useEffect(() => {
    if (!item || item.type !== "video") return;
    const video = ref.current;
    if (!video) return;

    const start = Number(item.trimStart || 0);
    const itemChanged = prevItemId.current !== item.id;
    const becameActive = !prevActive.current && active;
    const becameInactive = prevActive.current && !active;

    if (itemChanged || becameActive) {
      try {
        video.currentTime = start;
      } catch {}
    }

    // Park defender at trimStart when not the active slot so the next turn starts clean
    if (becameInactive) {
      try {
        video.currentTime = start;
      } catch {}
    }

    prevItemId.current = item.id;
    prevActive.current = active;
  }, [item?.id, item?.type, item?.trimStart, active]);

  useEffect(() => {
    if (!item || item.type !== "video") return;
    const video = ref.current;
    if (!video) return;

    if (active && !paused) {
      video.muted = false;
      video.playsInline = true;
      const p = video.play();
      if (p?.catch) p.catch(() => {});
      return;
    }

    video.pause();
    video.muted = true;
  }, [item?.id, item?.src, item?.type, active, paused]);

  useEffect(() => {
    if (!item || item.type !== "video") return;

    const video = ref.current;
    if (!video) return;

    const start = Number(item.trimStart || 0);
    const end = Number(item.trimEnd || 7);

    const onTimeUpdate = () => {
      if (!active || paused) return;
      if (video.currentTime >= end - 0.04) {
        try {
          video.currentTime = start;
        } catch {}
        const p = video.play();
        if (p?.catch) p.catch(() => {});
      }
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    return () => video.removeEventListener("timeupdate", onTimeUpdate);
  }, [item?.id, item?.src, item?.type, item?.trimStart, item?.trimEnd, active, paused]);

  if (!item) return null;

  const isImage = item.type === "image";

  const baseFilter = isImage
    ? "brightness(1.03)"
    : winner
      ? "brightness(1.13)"
      : active && !paused
        ? "brightness(1.06)"
        : "brightness(0.92)";
  const filter =
    entranceEmphasis && isImage
      ? "brightness(1.09)"
      : entranceEmphasis && !isImage
        ? winner
          ? "brightness(1.16)"
          : active && !paused
            ? "brightness(1.1)"
            : "brightness(0.96)"
        : baseFilter;

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
          filter,
          transition: entranceEmphasis ? "filter 0.22s ease-out" : undefined,
        }}
      >
        {!failed ? (
          <BattleMedia
            item={item}
            refProp={ref}
            priority={active}
            onError={() => setFailed(true)}
            styles={styles}
          />
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
