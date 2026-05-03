import React, { useRef, useState } from "react";
import { ARENAS } from "./data/arenas";
import { START_MEDIA } from "./data/startMedia";
import { sortRank } from "./utils/ranking";
import { normalizeUpload } from "./utils/media";
import { Battle } from "./components/battle/Battle";
import { Leaderboard } from "./components/leaderboard/Leaderboard";
import { UploadSheet } from "./components/upload/UploadSheet";
import { styles } from "./styles/appStyles";

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
