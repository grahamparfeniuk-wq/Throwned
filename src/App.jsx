import React, { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ARENAS } from "./data/arenas";
import { START_MEDIA } from "./data/startMedia";
import {
  arenaById,
  confidenceLabel,
  sortRank,
} from "./utils/ranking";
import { normalizeUpload } from "./utils/media";
import { Battle } from "./components/battle/Battle";
import { UploadSheet } from "./components/upload/UploadSheet";
import { styles } from "./styles/appStyles";

function Details({ item, accent }) {
  if (!item) return null;

  return (
    <AnimatePresence>
      <motion.div style={styles.detailsWrap} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div
          style={{ ...styles.detailsCard, borderColor: `${accent}55` }}
          initial={{ opacity: 0, y: 12, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.985 }}
        >
          <div style={styles.detailsTitle}>{item.title}</div>
          <div style={styles.detailsCreator}>{item.creator}</div>
          <div style={styles.pillRow}>
            <div style={styles.pill}>Rating {item.rating}</div>
            <div style={styles.pill}>{confidenceLabel(item.confidence)}</div>
            <div style={styles.pill}>{item.type === "video" ? "Video" : "Photo"}</div>
          </div>
          <div style={{ ...styles.detailsArena, color: accent }}>{arenaById(item.arenaId).label}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Leaderboard({ items, arena, open, setOpen, onUpload }) {
  const ranked = useMemo(() => sortRank(items), [items]);

  return (
    <motion.div
      drag="y"
      dragElastic={0.05}
      dragConstraints={{ top: 0, bottom: 520 }}
      onDragEnd={(_, info) => {
        if (info.offset.y > 80) setOpen(false);
        if (info.offset.y < -80) setOpen(true);
      }}
      animate={{ y: open ? 0 : 514 }}
      transition={{ type: "spring", stiffness: 280, damping: 34 }}
      style={styles.sheet}
    >
      <div style={styles.sheetHandleTap} onClick={() => setOpen((v) => !v)}>
        <div style={styles.sheetHandle} />
      </div>

      <div style={styles.sheetHeader}>
        <div>
          <div style={styles.sheetEyebrow}>Live Ranking</div>
          <div style={{ ...styles.sheetTitle, color: arena.accent }}>{arena.label}</div>
        </div>
        <button style={styles.sheetUpload} onClick={onUpload}>+</button>
      </div>

      <div style={styles.sheetList}>
        {ranked.map((item, i) => (
          <div key={item.id} style={styles.sheetRow}>
            <div style={{ ...styles.sheetRank, color: i === 0 ? arena.accent : "rgba(255,255,255,.78)" }}>#{i + 1}</div>
            <div style={styles.sheetText}>
              <div style={styles.sheetItemTitle}>{item.title}</div>
              <div style={styles.sheetItemCreator}>{item.creator}</div>
            </div>
            <div style={styles.sheetRight}>
              <div style={styles.sheetRating}>{item.rating}</div>
              <div style={styles.sheetConfidence}>{confidenceLabel(item.confidence)}</div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function App() {
  const [pool, setPool] = useState(() => sortRank([...START_MEDIA]));
  const [arenaIndex, setArenaIndex] = useState(0);
  const [uploadOpen, setUploadOpen] = useState(false);
  const nextId = useRef(100000);

  const arena = ARENAS[arenaIndex];

  function changeArena(direction) {
    setArenaIndex((prev) => {
      if (direction > 0) return prev === ARENAS.length - 1 ? 0 : prev + 1;
      return prev === 0 ? ARENAS.length - 1 : prev - 1;
    });
  }

  function saveUpload(data) {
    const contender = normalizeUpload(data, nextId.current++);
    setPool((prev) => sortRank([...prev, contender]));
    const index = ARENAS.findIndex((a) => a.id === data.arenaId);
    if (index >= 0) setArenaIndex(index);
    setUploadOpen(false);
  }

  return (
    <div style={styles.app}>
      <Battle
        pool={pool}
        setPool={setPool}
        arena={arena}
        changeArena={changeArena}
        openUpload={() => setUploadOpen(true)}
        styles={styles}
        renderDetails={(props) => <Details {...props} />}
        renderLeaderboard={(props) => <Leaderboard {...props} />}
      />

      <UploadSheet
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSave={saveUpload}
        arenaId={arena.id}
        styles={styles}
      />
    </div>
  );
}
