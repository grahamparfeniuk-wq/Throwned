import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useIsPortrait } from "../../hooks/useIsPortrait";
import { ARENAS } from "../../data/arenas";
import {
  arenaItems,
  clamp,
  pickPair,
  pickRandom,
  scoreDelta,
  sortRank,
  updateConfidence,
  voteTrust,
} from "../../utils/ranking";
import { safeDuration, throwVector } from "../../utils/media";
import { VSBadge } from "./VSBadge";
import { Seam } from "./Seam";
import { ArenaLabel } from "../overlays/ArenaLabel";
import { ChampionBanner } from "../overlays/ChampionBanner";
import { BattleSlot } from "./BattleSlot";

const HOLD_MS = 260;
const THROW_DISTANCE = 92;
const CATEGORY_DISTANCE = 116;
const LABEL_MS = 1600;

export function Battle({ pool, setPool, arena, changeArena, jumpToArena, openUpload, styles, renderDetails, renderLeaderboard }) {
  const portrait = useIsPortrait();
  const items = useMemo(() => sortRank(arenaItems(pool, arena)), [pool, arena]);
  const poolRef = useRef(pool);
  const labelTimer = useRef(null);
  const holdTimer = useRef(null);
  const holdTriggered = useRef(false);
  const history = useRef([]);

  const [pair, setPair] = useState(() => pickPair(items));
  const [activeSide, setActiveSide] = useState("second");
  const [paused, setPaused] = useState(false);
  const [detailsId, setDetailsId] = useState(null);
  const [labelVisible, setLabelVisible] = useState(true);
  const [arenaPickerOpen, setArenaPickerOpen] = useState(false);
  const [arenaQuery, setArenaQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [locked, setLocked] = useState(false);
  const [winnerId, setWinnerId] = useState(null);
  const [streak, setStreak] = useState(0);
  const [champion, setChampion] = useState(null);
  const [throwState, setThrowState] = useState(null);
  const [enterState, setEnterState] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [unlockedAt, setUnlockedAt] = useState(Date.now());
  const [userTrust, setUserTrust] = useState(1);
  const [drag, setDrag] = useState({
    first: { x: 0, y: 0, rotate: 0 },
    second: { x: 0, y: 0, rotate: 0 },
  });

  const detailsItem = useMemo(() => items.find((x) => x.id === detailsId), [items, detailsId]);
  const filteredArenas = useMemo(() => {
    const q = arenaQuery.trim().toLowerCase();
    if (!q) return ARENAS;
    return ARENAS.filter((a) => a.label.toLowerCase().includes(q) || a.id.toLowerCase().includes(q));
  }, [arenaQuery]);
  const dragging = Math.abs(drag.first.x) + Math.abs(drag.first.y) + Math.abs(drag.second.x) + Math.abs(drag.second.y) > 1;

  useEffect(() => {
    poolRef.current = pool;
  }, [pool]);

  function showLabel() {
    setLabelVisible(true);
    clearTimeout(labelTimer.current);
    labelTimer.current = setTimeout(() => setLabelVisible(false), LABEL_MS);
  }

  useEffect(() => {
    showLabel();
    setSheetOpen(false);
    setDetailsId(null);
    setPaused(false);
    setWinnerId(null);
    setStreak(0);
    setChampion(null);
    setArenaPickerOpen(false);
    setArenaQuery("");
    setThrowState(null);
    setEnterState(null);
    setLocked(false);
    setPulse(false);
    setUnlockedAt(Date.now());
    setDrag({ first: { x: 0, y: 0, rotate: 0 }, second: { x: 0, y: 0, rotate: 0 } });

    const next = pickPair(items, history.current.slice(-4));
    setPair(next);
    setActiveSide(arena.type === "image" ? "both" : next?.second ? "second" : "first");
    setTransitioning(true);
    const t = setTimeout(() => setTransitioning(false), 210);
    return () => clearTimeout(t);
  }, [arena.id, items.length]);

  useEffect(() => {
    return () => {
      clearTimeout(labelTimer.current);
      clearTimeout(holdTimer.current);
    };
  }, []);

  useEffect(() => {
    if (arena.type === "image") return;
    if (!pair?.first || !pair?.second || paused || detailsId || locked || champion || transitioning) return;

    const active = activeSide === "first" ? pair.first : pair.second;
    const t = setTimeout(() => {
      setActiveSide((s) => (s === "first" ? "second" : "first"));
    }, safeDuration(active));

    return () => clearTimeout(t);
  }, [arena.type, pair, activeSide, paused, detailsId, locked, champion, transitioning]);

  function startHold(id) {
    holdTriggered.current = false;
    clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => {
      holdTriggered.current = true;
      setDetailsId(id);
      setPaused(true);
    }, HOLD_MS);
  }

  function endHold() {
    clearTimeout(holdTimer.current);
    if (holdTriggered.current) {
      holdTriggered.current = false;
      setDetailsId(null);
      setPaused(false);
    }
  }

  function onMove(side, dx, dy) {
    if (locked || detailsId || champion || transitioning) return;

    const raw = portrait ? dy : dx;
    const outwardDirection = side === "first" ? -1 : 1;
    const inwardDirection = side === "first" ? 1 : -1;
    const outward = raw * outwardDirection;
    const inward = raw * inwardDirection;

    let x = 0;
    let y = 0;

    if (outward > 0) {
      const resisted = outward * 0.2;
      if (portrait) y = raw < 0 ? -resisted : resisted;
      else x = raw < 0 ? -resisted : resisted;
    } else if (inward > 0) {
      const resisted = inward * 0.11;
      if (portrait) y = raw > 0 ? resisted : -resisted;
      else x = raw > 0 ? resisted : -resisted;
    }

    setDrag((prev) => ({
      ...prev,
      [side]: { x, y, rotate: portrait ? y / 42 : x / 50 },
    }));
  }

  function outcome(side, dx, dy, vx, vy) {
    if (portrait) {
      if (side === "first") {
        if (dy < -THROW_DISTANCE || vy < -720) return "throw";
        if (dy > CATEGORY_DISTANCE || vy > 820) return "prev";
      } else {
        if (dy > THROW_DISTANCE || vy > 720) return "throw";
        if (dy < -CATEGORY_DISTANCE || vy < -820) return "next";
      }
      return "none";
    }

    if (side === "first") {
      if (dx < -THROW_DISTANCE || vx < -720) return "throw";
      if (dx > CATEGORY_DISTANCE || vx > 820) return "prev";
    } else {
      if (dx > THROW_DISTANCE || vx > 720) return "throw";
      if (dx < -CATEGORY_DISTANCE || vx < -820) return "next";
    }

    return "none";
  }

  function resolve(side, dx, dy, vx, vy) {
    if (locked || !pair?.first || !pair?.second || detailsId || champion || transitioning) return;

    const result = outcome(side, dx, dy, vx, vy);
    setDrag({ first: { x: 0, y: 0, rotate: 0 }, second: { x: 0, y: 0, rotate: 0 } });

    if (result === "prev" || result === "next") {
      setTransitioning(true);
      showLabel();
      setTimeout(() => changeArena(result === "next" ? 1 : -1), 35);
      return;
    }

    if (result !== "throw") return;

    setLocked(true);
    setPulse(true);
    setTimeout(() => setPulse(false), 190);

    const vector = throwVector(side, portrait);
    setThrowState({ side, vector });

    const loser = side === "first" ? pair.first : pair.second;
    const winner = side === "first" ? pair.second : pair.first;

    const ms = Date.now() - unlockedAt;
    const rushed = ms < 850;
    const nextTrust = clamp(userTrust + (rushed ? -0.08 : 0.02), 0.35, 1);
    setUserTrust(nextTrust);

    const weight = voteTrust(ms) * nextTrust;
    const { winnerDelta, loserDelta } = scoreDelta(winner, loser, weight);

    const updatedWinner = {
      ...winner,
      rating: winner.rating + winnerDelta,
      confidence: updateConfidence(winner.confidence, weight > 0.7),
      wins: (winner.wins || 0) + 1,
    };

    const updatedLoser = {
      ...loser,
      rating: Math.max(1000, loser.rating - loserDelta),
      confidence: updateConfidence(loser.confidence, weight > 0.7),
      losses: (loser.losses || 0) + 1,
    };

    setPool((prev) =>
      sortRank(
        prev.map((x) => {
          if (x.id === updatedWinner.id) return updatedWinner;
          if (x.id === updatedLoser.id) return updatedLoser;
          return x;
        })
      )
    );

    const nextStreak = winnerId === updatedWinner.id ? streak + 1 : 1;
    setWinnerId(updatedWinner.id);
    setStreak(nextStreak);
    history.current.push(updatedWinner.id, updatedLoser.id);

    setTimeout(() => {
      const fresh = sortRank(
        arenaItems(
          poolRef.current.map((x) => {
            if (x.id === updatedWinner.id) return updatedWinner;
            if (x.id === updatedLoser.id) return updatedLoser;
            return x;
          }),
          arena
        )
      );

      if (nextStreak >= 3) {
        setChampion(updatedWinner);

        setTimeout(() => {
          const cleared = fresh.filter((x) => x.id !== updatedWinner.id && x.id !== updatedLoser.id);
          const next = pickPair(cleared.length >= 2 ? cleared : fresh, history.current.slice(-4));
          setPair(next);
          setActiveSide(arena.type === "image" ? "both" : next?.second ? "second" : "first");
          setWinnerId(null);
          setStreak(0);
          setChampion(null);
          setThrowState(null);
          setEnterState(null);
          setLocked(false);
          setPaused(false);
          setUnlockedAt(Date.now());
        }, 1050);

        return;
      }

      const challengerPool = fresh.filter((x) => x.id !== updatedWinner.id && x.id !== updatedLoser.id);
      const challenger =
        pickRandom(challengerPool, history.current.slice(-4)) ||
        pickRandom(fresh, [updatedWinner.id]) ||
        fresh.find((x) => x.id !== updatedWinner.id) ||
        updatedWinner;

      const next =
        side === "first"
          ? { first: challenger, second: updatedWinner }
          : { first: updatedWinner, second: challenger };

      setPair(next);
      setEnterState({ side, id: challenger.id });
      setActiveSide(arena.type === "image" ? "both" : side === "first" ? "second" : "first");
      setThrowState(null);
      setPaused(false);
      setUnlockedAt(Date.now());

      setTimeout(() => {
        setEnterState(null);
        setLocked(false);
      }, 290);
    }, 220);
  }

  function thrownStyle(side) {
    if (!throwState || throwState.side !== side) return null;
    return {
      x: throwState.vector.x,
      y: throwState.vector.y,
      opacity: 0,
      scale: 0.96,
      rotate: portrait ? throwState.vector.y / 76 : throwState.vector.x / 86,
    };
  }

  if (!pair?.first || !pair?.second) {
    return (
      <div style={styles.empty}>
        <div style={styles.emptyTitle}>Not enough contenders yet</div>
        <div style={styles.emptyText}>Upload a few more so this arena can run.</div>
        <button style={styles.emptyButton} onClick={openUpload}>Add contender</button>
      </div>
    );
  }

  const isImageArena = arena.type === "image";

  return (
    <div
      style={{ ...styles.battle, background: `radial-gradient(circle at 50% 50%, ${arena.accent}10, transparent 32%), #050608` }}
      onClick={() => {
        if (arena.type === "video" && !detailsId && !champion && !sheetOpen) setPaused((p) => !p);
      }}
    >
      <ArenaLabel arena={arena} visible={labelVisible} styles={styles} onClick={() => setArenaPickerOpen(true)} />

      <AnimatePresence>
        {arenaPickerOpen && (
          <motion.div
            style={styles.arenaPickerOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              setArenaPickerOpen(false);
            }}
          >
            <motion.div
              style={styles.arenaPickerCard}
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              onClick={(e) => e.stopPropagation()}
            >
              <input
                value={arenaQuery}
                onChange={(e) => setArenaQuery(e.target.value)}
                placeholder="Search arenas"
                style={styles.arenaPickerInput}
                autoFocus
              />
              <div style={styles.arenaPickerList}>
                {filteredArenas.map((a) => (
                  <button
                    key={a.id}
                    style={{ ...styles.arenaPickerItem, ...(a.id === arena.id ? styles.arenaPickerItemActive : null) }}
                    onClick={() => {
                      jumpToArena(a.id);
                      setArenaPickerOpen(false);
                      setArenaQuery("");
                    }}
                  >
                    <span style={{ ...styles.arenaPickerDot, background: a.accent }} />
                    <span style={styles.arenaPickerText}>{a.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        style={{ ...styles.layout, ...(portrait ? styles.layoutPortrait : styles.layoutLandscape) }}
        animate={{ opacity: transitioning ? 0.86 : 1, scale: transitioning ? 0.985 : 1 }}
        transition={{ duration: 0.16 }}
      >
        <BattleSlot
          side="first"
          item={pair.first}
          portrait={portrait}
          accent={arena.accent}
          active={isImageArena || activeSide === "first"}
          paused={paused}
          dimmed={false}
          winner={winnerId === pair.first.id}
          locked={locked || transitioning}
          entering={enterState?.side === "first" && enterState?.id === pair.first.id}
          thrown={thrownStyle("first")}
          drag={drag.first}
          onMove={onMove}
          onDone={resolve}
          onHoldStart={startHold}
          onHoldEnd={endHold}
          styles={styles}
        />

        <BattleSlot
          side="second"
          item={pair.second}
          portrait={portrait}
          accent={arena.accent}
          active={isImageArena || activeSide === "second"}
          paused={paused}
          dimmed={false}
          winner={winnerId === pair.second.id}
          locked={locked || transitioning}
          entering={enterState?.side === "second" && enterState?.id === pair.second.id}
          thrown={thrownStyle("second")}
          drag={drag.second}
          onMove={onMove}
          onDone={resolve}
          onHoldStart={startHold}
          onHoldEnd={endHold}
          styles={styles}
        />
      </motion.div>

      <Seam portrait={portrait} accent={arena.accent} pulse={pulse} dragging={dragging} styles={styles} />
      <VSBadge accent={arena.accent} styles={styles} />
      {renderDetails({ item: detailsItem, accent: arena.accent })}
      <ChampionBanner item={champion} accent={arena.accent} styles={styles} />

      <div
        style={styles.swipeZone}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          const t = e.touches?.[0];
          if (!t) return;
          e.currentTarget.dataset.startY = String(t.clientY);
        }}
        onTouchEnd={(e) => {
          const t = e.changedTouches?.[0];
          const startY = Number(e.currentTarget.dataset.startY || 0);
          if (!t || !startY) return;
          if (startY - t.clientY > 70) setSheetOpen(true);
          if (t.clientY - startY > 70) setSheetOpen(false);
        }}
      />

      {renderLeaderboard({
        items,
        arena,
        open: sheetOpen,
        setOpen: setSheetOpen,
        onUpload: (e) => {
          e?.stopPropagation?.();
          openUpload();
        },
      })}
    </div>
  );
}
