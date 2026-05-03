import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { sortRank } from "../../utils/ranking";
import { useIsPortrait } from "../../hooks/useIsPortrait";
import { LeaderboardRow } from "./LeaderboardRow";

export function Leaderboard({ items, arena, open, setOpen, onUpload, styles }) {
  const portrait = useIsPortrait();
  const ranked = useMemo(() => sortRank(items), [items]);
  const sheetRef = useRef(null);
  const landRef = useRef(null);
  const [closedY, setClosedY] = useState(400);
  const [closedX, setClosedX] = useState(420);

  useLayoutEffect(() => {
    if (!portrait) return;
    const el = sheetRef.current;
    if (!el) return;
    const hideFully = () => {
      const h = el.offsetHeight;
      setClosedY(h > 0 ? h + 16 : 520);
    };
    const ro = new ResizeObserver(hideFully);
    ro.observe(el);
    hideFully();
    return () => ro.disconnect();
  }, [portrait, ranked.length, open, arena.id]);

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
        ref={sheetRef}
        drag="y"
        dragElastic={0.07}
        dragConstraints={{ top: -120, bottom: open ? 80 : 0 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 56) setOpen(false);
          if (info.offset.y < -56) setOpen(true);
        }}
        initial={false}
        animate={{ y: open ? 0 : closedY }}
        transition={{ type: "spring", stiffness: 290, damping: 34 }}
        style={styles.lbSheetPortrait}
      >
        {header}
        {list}
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={landRef}
      drag="x"
      dragElastic={0.06}
      dragConstraints={{ left: -80, right: 0 }}
      onDragEnd={(_, info) => {
        if (info.offset.x > 72) setOpen(false);
        if (info.offset.x < -72) setOpen(true);
      }}
      initial={false}
      animate={{ x: open ? 0 : closedX }}
      transition={{ type: "spring", stiffness: 300, damping: 34 }}
      style={{ ...styles.lbSheetLandscape, pointerEvents: open ? "auto" : "none" }}
    >
      {header}
      {list}
    </motion.div>
  );
}
