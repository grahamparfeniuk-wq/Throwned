import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { sortRank } from "../../utils/ranking";
import { useIsPortrait } from "../../hooks/useIsPortrait";
import { LeaderboardRow } from "./LeaderboardRow";

/** When closed: lower z-index than swipe zone so bottom-edge gestures always hit Battle swipe strip */
const LB_Z_OPEN = 22;
const LB_Z_CLOSED = 12;

export function Leaderboard({ items, arena, open, setOpen, onUpload, styles }) {
  const portrait = useIsPortrait();
  const ranked = useMemo(() => sortRank(items), [items]);
  const landRef = useRef(null);
  const [closedX, setClosedX] = useState(420);

  useLayoutEffect(() => {
    if (portrait) return;
    const el = landRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setClosedX(el.offsetWidth + 32);
    });
    ro.observe(el);
    setClosedX(el.offsetWidth + 32);
    return () => ro.disconnect();
  }, [portrait, ranked.length, open, arena.id]);

  const sheetSurface = {
    pointerEvents: open ? "auto" : "none",
    zIndex: open ? LB_Z_OPEN : LB_Z_CLOSED,
  };

  const header = (
    <>
      <button type="button" style={styles.lbHandleTap} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span style={styles.lbHandle} />
      </button>
      <div style={styles.lbHeader}>
        <div>
          <div style={styles.lbEyebrow}>Standings</div>
          <div style={{ ...styles.lbArenaTitle, color: arena.accent }}>{arena.label}</div>
        </div>
        <button type="button" style={styles.lbUpload} onClick={onUpload} aria-label="Add contender">
          +
        </button>
      </div>
    </>
  );

  const list = (
    <div style={portrait ? styles.lbListPortrait : styles.lbListLandscape}>
      {ranked.map((item, i) => (
        <LeaderboardRow key={item.id} item={item} index={i} accent={arena.accent} styles={styles} />
      ))}
    </div>
  );

  if (portrait) {
    return (
      <motion.div
        drag={open ? "y" : false}
        dragElastic={0.07}
        dragConstraints={{ top: -120, bottom: open ? 80 : 0 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 56) setOpen(false);
          if (info.offset.y < -56) setOpen(true);
        }}
        initial={{ y: "100%" }}
        animate={{ y: open ? 0 : "100%" }}
        transition={{ type: "spring", stiffness: 290, damping: 34 }}
        style={{ ...styles.lbSheetPortrait, ...sheetSurface }}
      >
        {header}
        {list}
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={landRef}
      drag={open ? "x" : false}
      dragElastic={0.06}
      dragConstraints={{ left: -80, right: 0 }}
      onDragEnd={(_, info) => {
        if (info.offset.x > 72) setOpen(false);
        if (info.offset.x < -72) setOpen(true);
      }}
      initial={false}
      animate={{ x: open ? 0 : closedX }}
      transition={{ type: "spring", stiffness: 300, damping: 34 }}
      style={{ ...styles.lbSheetLandscape, ...sheetSurface }}
    >
      {header}
      {list}
    </motion.div>
  );
}
