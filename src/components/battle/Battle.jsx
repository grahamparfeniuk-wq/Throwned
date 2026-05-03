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
import { attachBattleMediaPreloads } from "../../utils/mediaPreload";
import { vibrateThrow } from "../../utils/haptics";
import { VSBadge } from "./VSBadge";
import { Seam } from "./Seam";
import { ArenaLabel } from "../overlays/ArenaLabel";
import { BattleSlot } from "./BattleSlot";
import { DetailsPeek } from "../overlays/DetailsPeek";

const PEEK_HOLD_MS = 450;
const PEEK_HOLD_MOVE_PX = 18;
/** Slower deliberate swipe: full travel still commits without needing flick speed */
const THROW_DISTANCE_HARD = 88;
/** Blend scale for distance term (slightly less travel than first-pass 92px) */
const THROW_DISTANCE_SOFT = 76;
const CATEGORY_DISTANCE = 116;
/** Release velocity scale for blend + lone extreme-flick gate */
const THROW_VELOCITY_REF = 540;
const THROW_VELOCITY_LONE = 620;
/** Velocity weighted higher than distance for the blend gate */
const THROW_BLEND_W_D = 0.37;
const THROW_BLEND_W_V = 0.63;
const CATEGORY_VELOCITY_PX_S = 820;
const LABEL_MS = 1600;
/** Battle beat: impact → land pause → swap pair / challenger enter → unlock */
const BEAT_IMPACT_MS = 118;
const BEAT_LAND_PAUSE_MS = 82;
const BEAT_SWAP_AT_MS = BEAT_IMPACT_MS + BEAT_LAND_PAUSE_MS;
const THROW_UNLOCK_MS = 228;

function throwBlendPasses(distMag, velMag) {
  const d = Math.min(Math.abs(distMag) / THROW_DISTANCE_SOFT, 1.35);
  const v = Math.min(Math.abs(velMag) / THROW_VELOCITY_REF, 1.35);
  return THROW_BLEND_W_D * d + THROW_BLEND_W_V * v >= 1;
}

export function Battle({ pool, setPool, arena, changeArena, jumpToArena, openUpload, styles, renderLeaderboard }) {
  const portrait = useIsPortrait();
  const items = useMemo(() => sortRank(arenaItems(pool, arena)), [pool, arena]);
  const poolRef = useRef(pool);
  const labelTimer = useRef(null);
  const holdTimer = useRef(null);
  const holdPointerStart = useRef({ x: 0, y: 0 });
  const history = useRef([]);

  const [pair, setPair] = useState(() => pickPair(items));
  const [activeSide, setActiveSide] = useState("second");
  const [paused, setPaused] = useState(false);
  const [activeDetailsClipId, setActiveDetailsClipId] = useState(null);
  const [labelVisible, setLabelVisible] = useState(true);
  const [arenaPickerOpen, setArenaPickerOpen] = useState(false);
  const [arenaQuery, setArenaQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [locked, setLocked] = useState(false);
  const [winnerId, setWinnerId] = useState(null);
  const [streak, setStreak] = useState(0);
  /** 3-streak rotation holds interaction until fresh pair loads (no banner UI) */
  const [streakHoldActive, setStreakHoldActive] = useState(false);
  const [throwState, setThrowState] = useState(null);
  const [enterState, setEnterState] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [impactPhase, setImpactPhase] = useState(false);
  const [unlockedAt, setUnlockedAt] = useState(Date.now());
  const [userTrust, setUserTrust] = useState(1);
  const [drag, setDrag] = useState({
    first: { x: 0, y: 0, rotate: 0 },
    second: { x: 0, y: 0, rotate: 0 },
  });

  const activeDetailsItem = useMemo(
    () => (activeDetailsClipId ? items.find((x) => x.id === activeDetailsClipId) : null),
    [items, activeDetailsClipId]
  );
  const filteredArenas = useMemo(() => {
    const q = arenaQuery.trim().toLowerCase();
    if (!q) return ARENAS;
    return ARENAS.filter((a) => a.label.toLowerCase().includes(q) || a.id.toLowerCase().includes(q));
  }, [arenaQuery]);
  const dragging = Math.abs(drag.first.x) + Math.abs(drag.first.y) + Math.abs(drag.second.x) + Math.abs(drag.second.y) > 1;

  useEffect(() => {
    poolRef.current = pool;
  }, [pool]);

  useEffect(() => {
    return attachBattleMediaPreloads(items, pair);
  }, [items, pair.first?.id, pair.second?.id]);

  function showLabel() {
    setLabelVisible(true);
    clearTimeout(labelTimer.current);
    labelTimer.current = setTimeout(() => setLabelVisible(false), LABEL_MS);
  }

  useEffect(() => {
    showLabel();
    setSheetOpen(false);
    clearTimeout(holdTimer.current);
    setActiveDetailsClipId(null);
    setPaused(false);
    setWinnerId(null);
    setStreak(0);
    setStreakHoldActive(false);
    setArenaPickerOpen(false);
    setArenaQuery("");
    setThrowState(null);
    setEnterState(null);
    setLocked(false);
    setPulse(false);
    setImpactPhase(false);
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
    if (!pair?.first || !pair?.second || paused || activeDetailsClipId || locked || streakHoldActive || transitioning) return;

    const active = activeSide === "first" ? pair.first : pair.second;
    const t = setTimeout(() => {
      setActiveSide((s) => (s === "first" ? "second" : "first"));
    }, safeDuration(active));

    return () => clearTimeout(t);
  }, [arena.type, pair, activeSide, paused, activeDetailsClipId, locked, streakHoldActive, transitioning]);

  useEffect(() => {
    if (!activeDetailsClipId || !pair?.first || !pair?.second) return;
    const inPair = pair.first.id === activeDetailsClipId || pair.second.id === activeDetailsClipId;
    if (!inPair) setActiveDetailsClipId(null);
  }, [pair?.first?.id, pair?.second?.id, activeDetailsClipId]);

  function holdPointerDown(id, x, y) {
    if (streakHoldActive || locked) return;
    clearTimeout(holdTimer.current);
    holdPointerStart.current = { x, y };
    holdTimer.current = setTimeout(() => {
      holdTimer.current = null;
      setActiveDetailsClipId(id);
    }, PEEK_HOLD_MS);
  }

  function holdPointerMove(x, y) {
    if (!holdTimer.current) return;
    const { x: sx, y: sy } = holdPointerStart.current;
    const dist = Math.hypot(x - sx, y - sy);
    if (dist > PEEK_HOLD_MOVE_PX) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  }

  function holdPointerUp() {
    clearTimeout(holdTimer.current);
    holdTimer.current = null;
  }

  function onMove(side, dx, dy) {
    if (locked || streakHoldActive || transitioning || activeDetailsClipId) return;

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
        if (dy > CATEGORY_DISTANCE || vy > CATEGORY_VELOCITY_PX_S) return "prev";
        if (dy < -THROW_DISTANCE_HARD) return "throw";
        if (dy < 0 && vy < 0 && throwBlendPasses(-dy, -vy)) return "throw";
        if (vy < -THROW_VELOCITY_LONE && dy < -42) return "throw";
      } else {
        if (dy < -CATEGORY_DISTANCE || vy < -CATEGORY_VELOCITY_PX_S) return "next";
        if (dy > THROW_DISTANCE_HARD) return "throw";
        if (dy > 0 && vy > 0 && throwBlendPasses(dy, vy)) return "throw";
        if (vy > THROW_VELOCITY_LONE && dy > 42) return "throw";
      }
      return "none";
    }

    if (side === "first") {
      if (dx > CATEGORY_DISTANCE || vx > CATEGORY_VELOCITY_PX_S) return "prev";
      if (dx < -THROW_DISTANCE_HARD) return "throw";
      if (dx < 0 && vx < 0 && throwBlendPasses(-dx, -vx)) return "throw";
      if (vx < -THROW_VELOCITY_LONE && dx < -42) return "throw";
    } else {
      if (dx < -CATEGORY_DISTANCE || vx < -CATEGORY_VELOCITY_PX_S) return "next";
      if (dx > THROW_DISTANCE_HARD) return "throw";
      if (dx > 0 && vx > 0 && throwBlendPasses(dx, vx)) return "throw";
      if (vx > THROW_VELOCITY_LONE && dx > 42) return "throw";
    }

    return "none";
  }

  function resolve(side, dx, dy, vx, vy) {
    if (locked || !pair?.first || !pair?.second || streakHoldActive || transitioning) return;
    if (activeDetailsClipId) {
      setDrag({ first: { x: 0, y: 0, rotate: 0 }, second: { x: 0, y: 0, rotate: 0 } });
      return;
    }

    const result = outcome(side, dx, dy, vx, vy);
    setDrag({ first: { x: 0, y: 0, rotate: 0 }, second: { x: 0, y: 0, rotate: 0 } });

    if (result === "prev" || result === "next") {
      setTransitioning(true);
      showLabel();
      setTimeout(() => changeArena(result === "next" ? 1 : -1), 35);
      return;
    }

    if (result !== "throw") return;

    vibrateThrow();
    setLocked(true);
    setImpactPhase(true);
    setPulse(true);
    setTimeout(() => setImpactPhase(false), BEAT_IMPACT_MS);
    setTimeout(() => setPulse(false), BEAT_IMPACT_MS);

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
        setStreakHoldActive(true);
        setPulse(true);
        setTimeout(() => setPulse(false), 280);

        setTimeout(() => {
          const cleared = fresh.filter((x) => x.id !== updatedWinner.id && x.id !== updatedLoser.id);
          const next = pickPair(cleared.length >= 2 ? cleared : fresh, history.current.slice(-4));
          setPair(next);
          setActiveSide(arena.type === "image" ? "both" : next?.second ? "second" : "first");
          setWinnerId(null);
          setStreak(0);
          setStreakHoldActive(false);
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
      /* Incoming challenger occupies loser's slot (`side`) — they become the active video */
      setActiveSide(arena.type === "image" ? "both" : side);
      setThrowState(null);
      setPaused(false);
      setUnlockedAt(Date.now());

      setTimeout(() => {
        setEnterState(null);
        setLocked(false);
      }, THROW_UNLOCK_MS);
    }, BEAT_SWAP_AT_MS);
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
  const contenderAttachmentOpen = !!activeDetailsClipId;

  return (
    <div
      style={{ ...styles.battle, background: `radial-gradient(circle at 50% 50%, ${arena.accent}10, transparent 32%), #050608` }}
      onClick={() => {
        if (arena.type === "video" && !activeDetailsClipId && !streakHoldActive && !sheetOpen) setPaused((p) => !p);
      }}
    >
      <motion.div
        aria-hidden
        animate={{ opacity: impactPhase ? 0.34 : 0 }}
        transition={{ duration: 0.11 }}
        style={{
          pointerEvents: "none",
          position: "absolute",
          inset: 0,
          zIndex: 1,
          background: `radial-gradient(ellipse 92% 58% at 50% 46%, ${arena.accent}18, transparent 56%)`,
        }}
      />

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
        style={{
          ...styles.layout,
          ...(portrait ? styles.layoutPortrait : styles.layoutLandscape),
          zIndex: contenderAttachmentOpen ? 11 : 2,
        }}
        animate={{ opacity: transitioning ? 0.86 : 1, scale: transitioning ? 0.985 : 1 }}
        transition={{ duration: 0.16 }}
      >
        {contenderAttachmentOpen ? <div style={styles.attachmentDim} aria-hidden /> : null}

        <BattleSlot
          side="first"
          clipId={pair.first.id}
          item={pair.first}
          portrait={portrait}
          accent={arena.accent}
          active={isImageArena || activeSide === "first"}
          paused={paused || contenderAttachmentOpen}
          dimmed={contenderAttachmentOpen}
          winner={winnerId === pair.first.id}
          locked={locked || transitioning || streakHoldActive}
          entering={enterState?.side === "first" && enterState?.id === pair.first.id}
          incumbentDuringEntry={!!enterState && enterState.side !== "first"}
          thrown={thrownStyle("first")}
          drag={drag.first}
          onMove={onMove}
          onDone={resolve}
          onHoldPointerDown={holdPointerDown}
          onHoldPointerMove={holdPointerMove}
          onHoldPointerUp={holdPointerUp}
          freezeBattleGestures={contenderAttachmentOpen}
          styles={styles}
        />

        <BattleSlot
          side="second"
          clipId={pair.second.id}
          item={pair.second}
          portrait={portrait}
          accent={arena.accent}
          active={isImageArena || activeSide === "second"}
          paused={paused || contenderAttachmentOpen}
          dimmed={contenderAttachmentOpen}
          winner={winnerId === pair.second.id}
          locked={locked || transitioning || streakHoldActive}
          entering={enterState?.side === "second" && enterState?.id === pair.second.id}
          incumbentDuringEntry={!!enterState && enterState.side !== "second"}
          thrown={thrownStyle("second")}
          drag={drag.second}
          onMove={onMove}
          onDone={resolve}
          onHoldPointerDown={holdPointerDown}
          onHoldPointerMove={holdPointerMove}
          onHoldPointerUp={holdPointerUp}
          freezeBattleGestures={contenderAttachmentOpen}
          styles={styles}
        />

        {activeDetailsItem && (
          <DetailsPeek
            item={activeDetailsItem}
            pool={pool}
            arena={arena}
            accent={arena.accent}
            side={pair.first.id === activeDetailsClipId ? "first" : "second"}
            portrait={portrait}
            styles={styles}
            onClose={() => setActiveDetailsClipId(null)}
          />
        )}
      </motion.div>

      <Seam portrait={portrait} accent={arena.accent} pulse={pulse} impactHit={impactPhase} entranceHint={!!enterState} dragging={dragging} styles={styles} />
      <VSBadge accent={arena.accent} styles={styles} impactHit={impactPhase} />

      {/* Always-on bottom capture strip: portrait + landscape; must stay above closed leaderboard layers */}
      <div
        style={{
          ...styles.swipeZone,
          zIndex: sheetOpen ? 8 : 26,
        }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse" && e.button !== 0) return;
          e.currentTarget.dataset.lbSwipeY = String(e.clientY);
        }}
        onPointerUp={(e) => {
          const startY = Number(e.currentTarget.dataset.lbSwipeY || 0);
          if (!startY) return;
          const dy = startY - e.clientY;
          if (dy > 70) setSheetOpen(true);
          if (dy < -70) setSheetOpen(false);
        }}
      />

      {renderLeaderboard({
        items,
        arena,
        styles,
        portrait,
        battlePairIds:
          pair?.first?.id != null && pair?.second?.id != null
            ? { first: pair.first.id, second: pair.second.id }
            : null,
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
