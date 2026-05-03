import React, { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ARENAS } from "./data/arenas";
import { START_MEDIA } from "./data/startMedia";
import { arenaById, confidenceLabel, sortRank } from "./utils/ranking";
import { normalizeUpload } from "./utils/media";
import { Battle } from "./components/battle/Battle";
import { Leaderboard } from "./components/leaderboard/Leaderboard";
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

  function jumpToArena(arenaId) {
    const index = ARENAS.findIndex((a) => a.id === arenaId);
    if (index >= 0) setArenaIndex(index);
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
        jumpToArena={jumpToArena}
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
