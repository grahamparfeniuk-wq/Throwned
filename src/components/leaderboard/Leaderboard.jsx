import { useMemo } from "react";
import { motion } from "framer-motion";
import { sortRank } from "../../utils/ranking";
import { LeaderboardRow } from "./LeaderboardRow";

/** Closed: stay under Battle swipe strip; open: above swipe strip for drag/backdrop */
const LB_Z_OPEN = 22;
const LB_Z_CLOSED = 12;

/**
 * Single Leaderboard: `portrait` comes from Battle (same source as layout/orientation).
 * Landscape + closed: render null — no full-screen invisible nodes that intercept bottom gestures.
 */
export function Leaderboard({ items, arena, open, setOpen, onUpload, styles, portrait }) {
  const ranked = useMemo(() => sortRank(items), [items]);

  if (!portrait && !open) {
    return null;
  }

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
