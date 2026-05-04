import React, { useEffect, useRef, useState } from "react";
import { ARENAS } from "./data/arenas";
import { START_MEDIA } from "./data/startMedia";
import { sortRank } from "./utils/ranking";
import { normalizeUpload } from "./utils/media";
import { Battle } from "./components/battle/Battle";
import { Leaderboard } from "./components/leaderboard/Leaderboard";
import { UploadSheet } from "./components/upload/UploadSheet";
import { GestureOnboarding } from "./components/overlays/GestureOnboarding";
import { styles } from "./styles/appStyles";
import { createArenaAffinityTracker } from "./utils/arenaAffinity";
import { CHALLENGE_TYPES, createChallengeFoundation } from "./utils/challengeFoundation";
import { createEventHookBus, deriveBattleEvents, EVENT_TYPES } from "./utils/eventHooks";
import { AnimatePresence } from "framer-motion";

const ONBOARDING_STORAGE_KEY = "throwned.onboarding.completed.v1";

export default function App() {
  const [pool, setPool] = useState(() => sortRank([...START_MEDIA]));
  const [arenaIndex, setArenaIndex] = useState(0);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(() => {
    try {
      return localStorage.getItem(ONBOARDING_STORAGE_KEY) !== "1";
    } catch {
      return true;
    }
  });
  const nextId = useRef(100000);
  const affinityRef = useRef(createArenaAffinityTracker());
  const challengeFoundationRef = useRef(createChallengeFoundation());
  const eventHookBusRef = useRef(createEventHookBus());

  const arena = ARENAS[arenaIndex];

  useEffect(() => {
    affinityRef.current.recordArenaViewed(arena.id);
  }, [arena.id]);

  useEffect(() => {
    eventHookBusRef.current.emit({
      type: EVENT_TYPES.ARENA_LAUNCHED,
      arenaId: arena.id,
      title: `Arena launched: ${arena.label}`,
    });
  }, [arena.id, arena.label]);

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
    challengeFoundationRef.current.stageChallengeSeed({
      type: CHALLENGE_TYPES.CREATOR,
      arenaId: data.arenaId,
      contenderIds: [contender.id],
    });
    const index = ARENAS.findIndex((a) => a.id === data.arenaId);
    if (index >= 0) setArenaIndex(index);
    setUploadOpen(false);
  }

  function onBattleResolved({ arenaId, winner, loser, oldWinnerRank, newWinnerRank }) {
    affinityRef.current.recordVote(arenaId, winner?.id);

    const events = deriveBattleEvents({
      arena: { id: arenaId },
      winner,
      loser,
      oldWinnerRank,
      newWinnerRank,
    });
    events.forEach((event) => eventHookBusRef.current.emit(event));
  }

  function completeOnboarding() {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "1");
    } catch {
      // Ignore storage failures; onboarding state remains session-local.
    }
    setOnboardingOpen(false);
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
        onBattleResolved={onBattleResolved}
        interactionLocked={onboardingOpen}
        styles={styles}
        renderLeaderboard={(props) => <Leaderboard {...props} />}
      />

      <AnimatePresence>
        {onboardingOpen ? <GestureOnboarding styles={styles} onBegin={completeOnboarding} /> : null}
      </AnimatePresence>

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
