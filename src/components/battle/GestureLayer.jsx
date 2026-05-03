import { useRef } from "react";

const VELOCITY_WINDOW_MS = 72;
const MAX_SAMPLES = 10;

export function GestureLayer({
  side,
  clipId,
  disabled,
  onMove,
  onDone,
  onHoldPointerDown,
  onHoldPointerMove,
  onHoldPointerUp,
  styles,
}) {
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
      onPointerDown={(e) => {
        if (disabled) return;
        if (e.pointerType === "mouse" && e.button !== 0) return;
        start.current = { x: e.clientX, y: e.clientY };
        samples.current = [
          {
            x: e.clientX,
            y: e.clientY,
            t: typeof performance !== "undefined" ? performance.now() : Date.now(),
          },
        ];
        onHoldPointerDown?.(clipId, e.clientX, e.clientY);
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }}
      onPointerMove={(e) => {
        if (disabled) return;
        onHoldPointerMove?.(e.clientX, e.clientY);
        const pressed = e.pointerType === "mouse" ? e.buttons === 1 : true;
        if (!pressed) return;
        move(e.clientX, e.clientY);
      }}
      onPointerUp={(e) => {
        if (disabled) return;
        onHoldPointerUp?.();
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        done(e.clientX, e.clientY);
      }}
      onPointerCancel={(e) => {
        if (disabled) return;
        onHoldPointerUp?.();
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        samples.current = [];
        onMove(side, 0, 0);
        onDone(side, 0, 0, 0, 0);
      }}
    />
  );
}
