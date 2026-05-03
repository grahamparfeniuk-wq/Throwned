import { useMemo } from "react";
import { motion } from "framer-motion";
import { sortRank } from "../../utils/ranking";
import { useIsPortrait } from "../../hooks/useIsPortrait";
import { LeaderboardRow } from "./LeaderboardRow";

/** When closed: lower z-index than swipe zone so bottom-edge gestures hit Battle swipe strip */
const LB_Z_OPEN = 22;
const LB_Z_CLOSED = 12;

export function Leaderboard({ items, arena, open, setOpen, onUpload, styles }) {
  const portrait = useIsPortrait();
  const ranked = useMemo(() => sortRank(items), [items]);

  const sheetSurface = {
    pointerEvents: open ? "auto" : "none",
    zIndex: open ? LB_Z_OPEN : LB_Z_CLOSED,
  };

  const rows = ranked.map((item, i) => (
    <LeaderboardRow key={item.id} item={item} index={i} accent={arena.accent} styles={styles} />
  ));

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
        <div style={styles.lbListPortrait}>{rows}</div>
      </motion.div>
    );
  }

  /** Landscape: gesture-only reveal from bottom (same `open` as portrait); centered overlay, no side rail */
  return (
    <motion.div
      style={{ ...styles.lbLandOverlay, ...sheetSurface }}
      initial={false}
      animate={{ opacity: open ? 1 : 0 }}
      transition={{ duration: 0.22 }}
    >
      <div style={styles.lbLandBackdrop} onClick={() => setOpen(false)} aria-hidden={!open} />
      <div
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        style={styles.lbCardLandscape}
        onClick={(e) => e.stopPropagation()}
      >
        {header}
        <div style={styles.lbListModal}>{rows}</div>
      </div>
    </motion.div>
  );
}
