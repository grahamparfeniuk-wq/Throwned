import { useRef } from "react";

export function GestureLayer({ side, disabled, onMove, onDone, styles }) {
  const start = useRef({ x: 0, y: 0 });

  function move(x, y) {
    onMove(side, x - start.current.x, y - start.current.y);
  }

  function done(x, y) {
    const dx = x - start.current.x;
    const dy = y - start.current.y;
    onMove(side, 0, 0);
    onDone(side, dx, dy, dx * 8, dy * 8);
  }

  return (
    <div
      style={styles.gestureLayer}
      onTouchStart={(e) => {
        if (disabled) return;
        const t = e.touches?.[0];
        if (t) start.current = { x: t.clientX, y: t.clientY };
      }}
      onTouchMove={(e) => {
        if (disabled) return;
        const t = e.touches?.[0];
        if (t) move(t.clientX, t.clientY);
      }}
      onTouchEnd={(e) => {
        if (disabled) return;
        const t = e.changedTouches?.[0];
        if (t) done(t.clientX, t.clientY);
      }}
      onMouseDown={(e) => {
        if (disabled) return;
        start.current = { x: e.clientX, y: e.clientY };
      }}
      onMouseMove={(e) => {
        if (disabled || e.buttons !== 1) return;
        move(e.clientX, e.clientY);
      }}
      onMouseUp={(e) => {
        if (disabled) return;
        done(e.clientX, e.clientY);
      }}
    />
  );
}
