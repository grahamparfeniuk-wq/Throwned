import { useEffect, useRef } from "react";

/**
 * Square cropped preview: stills for images, first-frame seek for video (muted, no playback).
 */
export function LeaderboardThumb({ item, styles }) {
  const ref = useRef(null);

  useEffect(() => {
    if (item.type !== "video") return;
    const v = ref.current;
    if (!v) return;
    const t = Number(item.trimStart || 0);
    const park = () => {
      try {
        v.currentTime = t;
        v.pause();
      } catch {
        /* ignore */
      }
    };
    v.addEventListener("loadeddata", park);
    v.addEventListener("loadedmetadata", park);
    return () => {
      v.removeEventListener("loadeddata", park);
      v.removeEventListener("loadedmetadata", park);
    };
  }, [item.id, item.type, item.src, item.trimStart]);

  if (item.type === "image") {
    return (
      <div style={styles.lbThumb}>
        <img src={item.src} alt="" draggable={false} style={styles.lbThumbMedia} />
      </div>
    );
  }

  return (
    <div style={styles.lbThumb}>
      <video
        ref={ref}
        src={item.src}
        muted
        playsInline
        preload="metadata"
        style={{ ...styles.lbThumbMedia, pointerEvents: "none" }}
        aria-hidden
      />
    </div>
  );
}
