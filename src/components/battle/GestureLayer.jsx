import { useRef } from "react";

const VELOCITY_WINDOW_MS = 72;
const MAX_SAMPLES = 10;

export function GestureLayer({ side, disabled, onMove, onDone, styles }) {
  const start = useRef({ x: 0, y: 0 });
  const samples = useRef([]);

  function pushSample(x, y) {
    const t = typeof performance !== "undefined" ? performance.now() : Date.now();
    samples.current.push({ x, y, t });
    const cutoff = t - VELOCITY_WINDOW_MS;
    while (samples.current.length && samples.current[0].t < cutoff) {
      samples.current.shift();
    }
    while (samples.current.length > MAX_SAMPLES) {
      samples.current.shift();
    }
  }

  function releaseVelocity() {
    const pts = samples.current;
    if (pts.length < 2) return { vx: 0, vy: 0 };
    const first = pts[0];
    const last = pts[pts.length - 1];
    const dtSec = (last.t - first.t) / 1000;
    if (dtSec < 0.008) return { vx: 0, vy: 0 };
    return {
      vx: (last.x - first.x) / dtSec,
      vy: (last.y - first.y) / dtSec,
    };
  }

  function move(x, y) {
    pushSample(x, y);
    onMove(side, x - start.current.x, y - start.current.y);
  }

  function done(x, y) {
    pushSample(x, y);
    const dx = x - start.current.x;
    const dy = y - start.current.y;
    const { vx, vy } = releaseVelocity();
    onMove(side, 0, 0);
    samples.current = [];
    onDone(side, dx, dy, vx, vy);
  }

  return (
    <div
      style={styles.gestureLayer}
      onTouchStart={(e) => {
        if (disabled) return;
        const t = e.touches?.[0];
        if (t) {
          start.current = { x: t.clientX, y: t.clientY };
          samples.current = [{ x: t.clientX, y: t.clientY, t: typeof performance !== "undefined" ? performance.now() : Date.now() }];
        }
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
        samples.current = [{ x: e.clientX, y: e.clientY, t: typeof performance !== "undefined" ? performance.now() : Date.now() }];
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
