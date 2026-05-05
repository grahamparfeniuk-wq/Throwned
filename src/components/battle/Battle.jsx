import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useIsPortrait } from "../../hooks/useIsPortrait";
import { ARENAS } from "../../data/arenas";
import { getArenaBattleProfile } from "../../constants/arenaBattleProfile";
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
import { vibrateEntranceArrival, vibrateThrow } from "../../utils/haptics";
import { selectNarrativeLines } from "../../utils/contenderNarratives";
import {
  BATTLE_ROTATION_STREAK,
  pickRotationRitual,
  pickThrowPunctuation,
} from "../../utils/battleEmotionalPunctuation";
import { computeEntrantSignificance } from "../../utils/entrantSignificance";
import { VSBadge } from "./VSBadge";
import { BattleAftermathCenterLine } from "./BattleAftermathLine";
import { BattleSeamAura } from "./BattleSeamAura";
import { ArenaIntroSeamGlow } from "./ArenaIntroSeamGlow";
import { Seam } from "./Seam";
import { ArenaLabel } from "../overlays/ArenaLabel";
import { BattleSlot } from "./BattleSlot";
import { DetailsPeek } from "../overlays/DetailsPeek";

/** Deliberate beat before contender narrative opens — broadcast-style commitment */
const PEEK_HOLD_MS = 510;
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
/** Impact flash — judgment lands */
const BEAT_IMPACT_MS = 124;
/** Breathing room before pair swap (broadcast beat — lets elimination land emotionally) */
const BEAT_VICTORY_PAUSE_MS = 236;
/** Extra pause when lower-rated side wins (upset — restrained, no carnival) */
const BEAT_UPSET_EXTRA_MS = 96;
const THROW_UNLOCK_MS = 276;
/** Set `true` only for emotional-systems diagnostics — keep `false` for ship builds. */
const DEV_EMOTIONAL_DEBUG = false;

function throwBlendPasses(distMag, velMag) {
  const d = Math.min(Math.abs(distMag) / THROW_DISTANCE_SOFT, 1.35);
  const v = Math.min(Math.abs(velMag) / THROW_VELOCITY_REF, 1.35);
  return THROW_BLEND_W_D * d + THROW_BLEND_W_V * v >= 1;
}

export function Battle({
  pool,
  setPool,
  arena,
  changeArena,
  jumpToArena,
  openUpload,
  onBattleResolved,
  interactionLocked = false,
  styles,
  renderLeaderboard,
}) {
  const portrait = useIsPortrait();
  const battleProfile = useMemo(() => getArenaBattleProfile(arena), [arena.id]);
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
  /** VS + seam battle chrome only after arena title card has fully exited */
  const [vsBattleReady, setVsBattleReady] = useState(false);
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
  /** Seam / pacing: upset weight + which side survived (subtle bias, not celebration) */
  const [throwVerdict, setThrowVerdict] = useState(null);
  const [unlockedAt, setUnlockedAt] = useState(Date.now());
  const [userTrust, setUserTrust] = useState(1);
  const [debugEvents, setDebugEvents] = useState([]);
  /** Bumps when `history` ref gains winners so debug overlay can refresh without subscription hacks */
  const [debugResultTick, setDebugResultTick] = useState(0);
  const [drag, setDrag] = useState({
    first: { x: 0, y: 0, rotate: 0 },
    second: { x: 0, y: 0, rotate: 0 },
  });
  const debugPrev = useRef({
    arenaId: null,
    profileKey: "",
    seamKey: "",
    streakById: {},
  });
  const punctuationClearRef = useRef(null);
  const [battlePunctuation, setBattlePunctuation] = useState(null);
  const debugRecentResults = useMemo(() => {
    const ids = history.current.slice(-6);
    return ids.map((id) => pool.find((x) => x.id === id)?.creator || String(id));
  }, [pool, winnerId, pair.first?.id, pair.second?.id, debugResultTick]);
  const debugFirstNarratives = useMemo(
    () => selectNarrativeLines({ item: pair?.first, pool, arena, opponent: pair?.second }),
    [pair?.first, pair?.second, pool, arena]
  );
  const debugSecondNarratives = useMemo(
    () => selectNarrativeLines({ item: pair?.second, pool, arena, opponent: pair?.first }),
    [pair?.first, pair?.second, pool, arena]
  );
  const auraMul = Math.min(
    1.68,
    battleProfile.persistentAuraMul * battleProfile.seamEnergyMul ** 0.9 * 1.08
  );
  const vsAuraMul = Math.min(1.62, ((battleProfile.persistentAuraMul + battleProfile.seamEnergyMul) / 2) * 1.1);

  const enteringEntrant = useMemo(() => {
    if (!enterState || !pair?.first || !pair?.second) return null;
    return enterState.side === "first" ? pair.first : pair.second;
  }, [enterState, pair?.first, pair?.second]);

  const entrantSig = useMemo(
    () => computeEntrantSignificance({ entrant: enteringEntrant, pool, arena }),
    [enteringEntrant, pool, arena]
  );

  const hierarchyEntranceLive = !!enterState && vsBattleReady;
  const seamEntranceMul = hierarchyEntranceLive ? entrantSig.seamMul : 1;
  const auraEntranceCombined = Math.min(
    1.95,
    auraMul * (hierarchyEntranceLive ? entrantSig.auraMul : 1)
  );
  const vsEntranceCombined = Math.min(
    1.92,
    vsAuraMul * (hierarchyEntranceLive ? entrantSig.vsMul : 1)
  );

  useEffect(() => {
    if (!import.meta.env.DEV || !enterState || !enteringEntrant) return;
    console.info("[Throned entrance]", {
      tier: entrantSig.tier,
      entranceIntensity: entrantSig.tier / 4,
      seamResponseMul: seamEntranceMul,
      auraMultiplier: auraEntranceCombined,
      vsMultiplier: vsEntranceCombined,
      seamIntrinsicMul: entrantSig.seamMul,
      auraIntrinsicMul: entrantSig.auraMul,
      vsIntrinsicMul: entrantSig.vsMul,
      settleMsApprox: entrantSig.settleMsApprox,
      arrivalSpring: entrantSig.entrance,
    });
  }, [enterState?.id, enterState?.side, enteringEntrant?.id, entrantSig.tier, entrantSig.score]);

  useEffect(() => {
    if (!enterState || !vsBattleReady) return;
    const delay = Math.min(520, Math.max(170, Math.round(120 + entrantSig.settleMsApprox * 0.42)));
    const id = setTimeout(() => vibrateEntranceArrival(entrantSig.tier), delay);
    return () => clearTimeout(id);
  }, [enterState?.id, enterState?.side, vsBattleReady, entrantSig.tier, entrantSig.settleMsApprox]);

  function pushDebugEvent(eventName, payload = null) {
    if (!DEV_EMOTIONAL_DEBUG) return;
    const stamp = new Date().toLocaleTimeString();
    if (payload) console.info(`[EMO DEBUG] ${eventName}`, payload);
    else console.info(`[EMO DEBUG] ${eventName}`);
    setDebugEvents((prev) => [`${stamp} ${eventName}`, ...prev].slice(0, 12));
  }

  function flashBattlePunctuation(text, options = {}) {
    if (!text?.trim()) return;
    const token = Date.now();
    const anchorSide = options.anchorSide ?? "center";
    const durationMs =
      typeof options.durationMs === "number" && options.durationMs > 0 ? options.durationMs : 2200;
    setBattlePunctuation({ text: text.trim(), token, anchorSide });
    clearTimeout(punctuationClearRef.current);
    punctuationClearRef.current = setTimeout(() => setBattlePunctuation(null), durationMs);
  }

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
    if (labelVisible) {
      setVsBattleReady(false);
      return;
    }
    const revealVsMs = Math.round(680 * battleProfile.pacingMultiplier);
    const id = setTimeout(() => setVsBattleReady(true), revealVsMs);
    return () => clearTimeout(id);
  }, [labelVisible, battleProfile.pacingMultiplier]);

  useEffect(() => {
    return attachBattleMediaPreloads(items, pair);
  }, [items, pair.first?.id, pair.second?.id]);

  useEffect(() => {
    if (!DEV_EMOTIONAL_DEBUG) return;
    const profileKey = JSON.stringify(battleProfile);
    const arenaChanged = debugPrev.current.arenaId !== arena.id;
    if (arenaChanged) {
      pushDebugEvent("arena profile changes", { from: debugPrev.current.arenaId, to: arena.id, battleProfile });
      debugPrev.current.arenaId = arena.id;
      debugPrev.current.profileKey = profileKey;
    } else if (debugPrev.current.profileKey !== profileKey) {
      pushDebugEvent("arena profile changes", { arenaId: arena.id, battleProfile });
      debugPrev.current.profileKey = profileKey;
    }
  }, [arena.id, battleProfile]);

  useEffect(() => {
    if (!DEV_EMOTIONAL_DEBUG) return;
    const seamKey = `${battleProfile.seamEnergyMul}:${battleProfile.persistentAuraMul}:${auraMul}:${vsAuraMul}`;
    if (debugPrev.current.seamKey !== seamKey) {
      pushDebugEvent("aura/seam multiplier changes", {
        seamEnergyMul: battleProfile.seamEnergyMul,
        persistentAuraMul: battleProfile.persistentAuraMul,
        auraMul,
        vsAuraMul,
      });
      debugPrev.current.seamKey = seamKey;
    }
  }, [battleProfile.seamEnergyMul, battleProfile.persistentAuraMul, auraMul, vsAuraMul]);

  useEffect(() => {
    if (!DEV_EMOTIONAL_DEBUG || !pair?.first || !pair?.second) return;
    pushDebugEvent("narrative generated", {
      first: { id: pair.first.id, lines: debugFirstNarratives },
      second: { id: pair.second.id, lines: debugSecondNarratives },
    });
    // Intentionally pair ids only — lines refresh in overlay via useMemo when pool changes.
  }, [pair?.first?.id, pair?.second?.id]);

  useEffect(() => {
    if (!DEV_EMOTIONAL_DEBUG || !activeDetailsItem) return;
    const selected =
      pair?.first?.id === activeDetailsClipId ? debugFirstNarratives?.[0] || null : debugSecondNarratives?.[0] || null;
    pushDebugEvent("narrative displayed", {
      clipId: activeDetailsClipId,
      selected,
    });
  }, [activeDetailsClipId, activeDetailsItem, debugFirstNarratives, debugSecondNarratives, pair?.first?.id]);

  useEffect(() => {
    if (!DEV_EMOTIONAL_DEBUG) return;
    const nextMap = {};
    for (const x of pool) {
      nextMap[x.id] = x.arenaWinStreak ?? 0;
      const prev = debugPrev.current.streakById[x.id] ?? 0;
      if (nextMap[x.id] > prev) {
        pushDebugEvent("streak increases", { id: x.id, from: prev, to: nextMap[x.id] });
      } else if (prev >= 2 && nextMap[x.id] === 0) {
        pushDebugEvent("streak breaks", { id: x.id, from: prev, to: 0 });
      }
    }
    debugPrev.current.streakById = nextMap;
  }, [pool]);

  function showLabel() {
    setLabelVisible(true);
    clearTimeout(labelTimer.current);
    const labelHold = Math.round(LABEL_MS * battleProfile.pacingMultiplier);
    labelTimer.current = setTimeout(() => setLabelVisible(false), labelHold);
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
    const t = setTimeout(() => setTransitioning(false), battleProfile.transitionMs);
    return () => clearTimeout(t);
  }, [arena.id, items.length, battleProfile.transitionMs]);

  useEffect(() => {
    return () => {
      clearTimeout(labelTimer.current);
      clearTimeout(holdTimer.current);
      clearTimeout(punctuationClearRef.current);
    };
  }, []);

  useEffect(() => {
    if (arena.type === "image") return;
    if (!pair?.first || !pair?.second || paused || activeDetailsClipId || locked || streakHoldActive || transitioning || interactionLocked) return;

    const active = activeSide === "first" ? pair.first : pair.second;
    const t = setTimeout(() => {
      setActiveSide((s) => (s === "first" ? "second" : "first"));
    }, safeDuration(active, battleProfile.pacingMultiplier));

    return () => clearTimeout(t);
  }, [
    arena.type,
    pair,
    activeSide,
    paused,
    activeDetailsClipId,
    locked,
    streakHoldActive,
    transitioning,
    interactionLocked,
    battleProfile.pacingMultiplier,
  ]);

  useEffect(() => {
    if (!activeDetailsClipId || !pair?.first || !pair?.second) return;
    const inPair = pair.first.id === activeDetailsClipId || pair.second.id === activeDetailsClipId;
    if (!inPair) setActiveDetailsClipId(null);
  }, [pair?.first?.id, pair?.second?.id, activeDetailsClipId]);

  function holdPointerDown(id, x, y) {
    if (streakHoldActive || locked || interactionLocked) return;
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
    if (locked || streakHoldActive || transitioning || activeDetailsClipId || interactionLocked) return;

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
    if (locked || !pair?.first || !pair?.second || streakHoldActive || transitioning || interactionLocked) return;
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

    const loser = side === "first" ? pair.first : pair.second;
    const winner = side === "first" ? pair.second : pair.first;
    const oldWinnerRank = winner.rank ?? Number.MAX_SAFE_INTEGER;

    const upset = winner.rating < loser.rating;
    const upsetIntensity = upset ? clamp((loser.rating - winner.rating) / 420, 0.12, 1) : 0;
    const survivorSide = side === "first" ? "second" : "first";
    let hierarchyTier = 0;
    if (upset && loser.rank != null) {
      if (loser.rank <= 3) hierarchyTier = 2;
      else if (loser.rank <= 10) hierarchyTier = 1;
    }
    const loserStreak = loser.arenaWinStreak ?? 0;
    const streakBreak = loserStreak >= 2;
    const majorStreakBreak = loserStreak >= 5;

    if (DEV_EMOTIONAL_DEBUG && upset) {
      pushDebugEvent("upset detected", {
        winner: winner.id,
        loser: loser.id,
        winnerRating: winner.rating,
        loserRating: loser.rating,
      });
      if (hierarchyTier === 1) pushDebugEvent("Top 10 upset detected", { loserRank: loser.rank });
      if (hierarchyTier === 2) pushDebugEvent("Top 3 upset detected", { loserRank: loser.rank });
    }

    setThrowVerdict({ upset, intensity: upsetIntensity, survivorSide, hierarchyTier, streakBreak, majorStreakBreak });
    const verdictClearMs =
      688 +
      (hierarchyTier === 2 ? 392 : hierarchyTier === 1 ? 242 : 0) +
      (majorStreakBreak ? 168 : streakBreak ? 108 : 0);
    setTimeout(() => setThrowVerdict(null), verdictClearMs);

    const impactOutMs =
      BEAT_IMPACT_MS +
      (upset
        ? Math.round(62 + 58 * upsetIntensity) +
          (hierarchyTier === 2 ? 102 : hierarchyTier === 1 ? 56 : 0) +
          (majorStreakBreak ? 42 : streakBreak ? 22 : 0)
        : 0);
    const pulseOutMs = upset
      ? BEAT_IMPACT_MS +
        152 +
        Math.round(48 * upsetIntensity) +
        (hierarchyTier === 2 ? 84 : hierarchyTier === 1 ? 50 : 0) +
        (majorStreakBreak ? 38 : streakBreak ? 20 : 0)
      : BEAT_IMPACT_MS + 22;

    setImpactPhase(true);
    setPulse(true);
    setTimeout(() => setImpactPhase(false), impactOutMs);
    setTimeout(() => setPulse(false), pulseOutMs);

    const vector = throwVector(side, portrait);
    setThrowState({ side, vector });

    const ms = Date.now() - unlockedAt;
    const rushed = ms < 850;
    const nextTrust = clamp(userTrust + (rushed ? -0.08 : 0.02), 0.35, 1);
    setUserTrust(nextTrust);

    const weight = voteTrust(ms) * nextTrust;
    const { winnerDelta, loserDelta } = scoreDelta(winner, loser, weight);

    const nextStreak = winnerId === winner.id ? streak + 1 : 1;
    const nextArenaWinStreak = winnerId === winner.id ? (winner.arenaWinStreak ?? 0) + 1 : 1;

    const updatedWinner = {
      ...winner,
      rating: winner.rating + winnerDelta,
      confidence: updateConfidence(winner.confidence, weight > 0.7),
      wins: (winner.wins || 0) + 1,
      arenaWinStreak: nextArenaWinStreak,
    };

    const updatedLoser = {
      ...loser,
      rating: Math.max(1000, loser.rating - loserDelta),
      confidence: updateConfidence(loser.confidence, weight > 0.7),
      losses: (loser.losses || 0) + 1,
      arenaWinStreak: 0,
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

    setWinnerId(updatedWinner.id);
    setStreak(nextStreak);
    history.current.push(updatedWinner.id, updatedLoser.id);
    if (DEV_EMOTIONAL_DEBUG) setDebugResultTick((t) => t + 1);

    const victoryPauseMs =
      BEAT_VICTORY_PAUSE_MS +
      battleProfile.victoryPauseDeltaMs +
      (upset ? BEAT_UPSET_EXTRA_MS + Math.round(68 * upsetIntensity) + battleProfile.upsetExtraDeltaMs : 0) +
      (hierarchyTier === 2 ? 148 : hierarchyTier === 1 ? 88 : 0) +
      (majorStreakBreak ? 108 : streakBreak ? 68 : 0) +
      (upset && upsetIntensity > 0.55 ? Math.round(44 * (upsetIntensity - 0.55)) : 0);
    const swapDelayMs = BEAT_IMPACT_MS + victoryPauseMs;

    const punctLine =
      nextStreak >= BATTLE_ROTATION_STREAK
        ? pickRotationRitual(arena)
        : pickThrowPunctuation({
            pool: poolRef.current,
            arena,
            upset,
            upsetIntensity,
            hierarchyTier,
            streakBreak,
            majorStreakBreak,
            updatedWinner,
            updatedLoser,
            pairFirstConfidence: pair.first.confidence,
            pairSecondConfidence: pair.second.confidence,
          });
    if (punctLine) {
      const isRotation = nextStreak >= BATTLE_ROTATION_STREAK;
      const anchorSide = isRotation ? "center" : side;
      const durationMs = Math.min(2300, Math.max(1280, swapDelayMs + 300));
      flashBattlePunctuation(punctLine, { anchorSide, durationMs });
    }

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
      const freshWinner = fresh.find((x) => x.id === updatedWinner.id);
      const newWinnerRank = freshWinner?.rank ?? oldWinnerRank;
      onBattleResolved?.({
        arenaId: arena.id,
        winner: updatedWinner,
        loser: updatedLoser,
        oldWinnerRank,
        newWinnerRank,
      });

      if (nextStreak >= BATTLE_ROTATION_STREAK) {
        setStreakHoldActive(true);
        if (DEV_EMOTIONAL_DEBUG) {
          pushDebugEvent("forced rotation triggers", {
            winner: updatedWinner.id,
            nextStreak,
            streakHoldActive: true,
          });
        }
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
          const sigA = computeEntrantSignificance({ entrant: next.first, pool: fresh, arena });
          const sigB = computeEntrantSignificance({ entrant: next.second, pool: fresh, arena });
          setTimeout(() => vibrateEntranceArrival(Math.max(sigA.tier, sigB.tier)), 440);
        }, Math.round((1050 + battleProfile.victoryPauseDeltaMs) * Math.max(0.94, battleProfile.pacingMultiplier)));

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

      if (!punctLine) {
        const totalGames = (challenger.wins ?? 0) + (challenger.losses ?? 0);
        const enteringHot =
          challenger.uploaded && totalGames <= 2 && (challenger.wins ?? 0) >= 1;
        if (enteringHot) {
          const deferMs = Math.max(380, 2680 - swapDelayMs);
          setTimeout(
            () =>
              flashBattlePunctuation("NEW CHALLENGER — ENTERING HOT", {
                anchorSide: side,
                durationMs: 1680,
              }),
            deferMs
          );
        }
      }

      setTimeout(() => {
        setEnterState(null);
        setLocked(false);
      }, Math.round(
        THROW_UNLOCK_MS * battleProfile.pacingMultiplier +
          (hierarchyTier === 2 ? 76 : hierarchyTier === 1 ? 46 : 0) +
          (majorStreakBreak ? 60 : streakBreak ? 36 : 0)
      ));
    }, swapDelayMs);
  }

  function thrownStyle(side) {
    if (!throwState || throwState.side !== side) return null;
    const rotDiv = portrait ? 94 : 104;
    return {
      x: throwState.vector.x,
      y: throwState.vector.y,
      opacity: 0,
      scale: 0.931,
      rotate: portrait ? throwState.vector.y / rotDiv : throwState.vector.x / rotDiv,
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
  const firstTop10 = typeof pair.first.rank === "number" && pair.first.rank <= 10;
  const firstTop3 = typeof pair.first.rank === "number" && pair.first.rank <= 3;
  const secondTop10 = typeof pair.second.rank === "number" && pair.second.rank <= 10;
  const secondTop3 = typeof pair.second.rank === "number" && pair.second.rank <= 3;
  const upsetOpportunity =
    typeof pair.first.rating === "number" &&
    typeof pair.second.rating === "number" &&
    Math.abs(pair.first.rating - pair.second.rating) >= 35;

  return (
    <div
      style={{
        ...styles.battle,
        background: `radial-gradient(circle at 50% 50%, ${arena.accent}1e, transparent 40%), #050608`,
      }}
      onClick={() => {
        if (interactionLocked) return;
        if (arena.type === "video" && !activeDetailsClipId && !streakHoldActive && !sheetOpen) setPaused((p) => !p);
      }}
    >
      <motion.div
        aria-hidden
        animate={{ opacity: impactPhase ? battleProfile.impactFlashOpacity : 0 }}
        transition={{ duration: 0.11 }}
        style={{
          pointerEvents: "none",
          position: "absolute",
          inset: 0,
          zIndex: 1,
          background: `radial-gradient(ellipse 88% 56% at 50% 46%, ${arena.accent}20, transparent 60%)`,
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
        transition={{ duration: Math.min(0.2, 0.12 + 0.05 * battleProfile.pacingMultiplier) }}
      >
        {contenderAttachmentOpen ? <div style={styles.attachmentDim} aria-hidden /> : null}

        <BattleSlot
          side="first"
          clipId={pair.first.id}
          item={pair.first}
          portrait={portrait}
          accent={arena.accent}
          active={isImageArena || activeSide === "first"}
          paused={paused || contenderAttachmentOpen || interactionLocked}
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
          entranceSpring={
            enterState?.side === "first" && enterState?.id === pair.first.id ? entrantSig.entrance : undefined
          }
          aftermath={
            battlePunctuation?.anchorSide === "first"
              ? { text: battlePunctuation.text, token: battlePunctuation.token }
              : null
          }
          aftermathSeamSide={portrait ? "towardSeamBottom" : "towardSeamRight"}
          styles={styles}
        />

        <BattleSlot
          side="second"
          clipId={pair.second.id}
          item={pair.second}
          portrait={portrait}
          accent={arena.accent}
          active={isImageArena || activeSide === "second"}
          paused={paused || contenderAttachmentOpen || interactionLocked}
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
          entranceSpring={
            enterState?.side === "second" && enterState?.id === pair.second.id ? entrantSig.entrance : undefined
          }
          aftermath={
            battlePunctuation?.anchorSide === "second"
              ? { text: battlePunctuation.text, token: battlePunctuation.token }
              : null
          }
          aftermathSeamSide={portrait ? "towardSeamTop" : "towardSeamLeft"}
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
            opponent={pair.first.id === activeDetailsClipId ? pair.second : pair.first}
          />
        )}
      </motion.div>

      {vsBattleReady && battlePunctuation?.anchorSide === "center" ? (
        <BattleAftermathCenterLine
          text={battlePunctuation.text}
          token={battlePunctuation.token}
          accent={arena.accent}
          portrait={portrait}
          styles={styles}
        />
      ) : null}

      <AnimatePresence>
        {labelVisible ? (
          <ArenaIntroSeamGlow
            key="arena-intro-seam-glow"
            portrait={portrait}
            accent={arena.accent}
            styles={styles}
            glowStrength={battleProfile.introGlowMul}
          />
        ) : null}
      </AnimatePresence>

      <Seam
        portrait={portrait}
        accent={arena.accent}
        pulse={pulse}
        impactHit={impactPhase}
        entranceHint={!!enterState}
        dragging={dragging}
        verdict={throwVerdict}
        introSuppressed={!vsBattleReady}
        arenaEnergyMul={battleProfile.seamEnergyMul}
        hierarchyEntranceMul={seamEntranceMul}
        styles={styles}
      />
      {vsBattleReady ? (
        <BattleSeamAura
          portrait={portrait}
          accent={arena.accent}
          auraMul={auraEntranceCombined}
          styles={styles}
        />
      ) : null}
      {vsBattleReady ? (
        <VSBadge
          accent={arena.accent}
          styles={styles}
          impactHit={impactPhase}
          auraMul={vsEntranceCombined}
        />
      ) : null}
      {DEV_EMOTIONAL_DEBUG ? (
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            width: "min(460px, 86vw)",
            maxHeight: "52vh",
            overflow: "auto",
            zIndex: 60,
            pointerEvents: "none",
            background: "rgba(0,0,0,0.72)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 10,
            padding: 10,
            color: "#d9f0ff",
            fontSize: 11,
            lineHeight: 1.35,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6 }}>EMOTIONAL DEBUG MODE</div>
          <div>arena: {arena.id} ({arena.label})</div>
          <div>pair: {pair.first.id} / {pair.second.id}</div>
          <div>names: {pair.first.creator} vs {pair.second.creator}</div>
          <div>ranks: #{pair.first.rank ?? "-"} vs #{pair.second.rank ?? "-"}</div>
          <div>records: {pair.first.wins ?? 0}-{pair.first.losses ?? 0} vs {pair.second.wins ?? 0}-{pair.second.losses ?? 0}</div>
          <div>streaks(arena): {pair.first.arenaWinStreak ?? 0} vs {pair.second.arenaWinStreak ?? 0}</div>
          <div>local streak state: streak={streak}, holdActive={String(streakHoldActive)}</div>
          <div>recent results: {debugRecentResults.join(" -> ") || "none"}</div>
          <div>top10/top3: {String(firstTop10)}/{String(firstTop3)} vs {String(secondTop10)}/{String(secondTop3)}</div>
          <div>upset opportunity: {String(upsetOpportunity)}</div>
          <div>hierarchyTier: {throwVerdict?.hierarchyTier ?? 0}</div>
          <div>verdict flags: upset={String(!!throwVerdict?.upset)} streakBreak={String(!!throwVerdict?.streakBreak)}</div>
          <div>battleProfile: {JSON.stringify(battleProfile)}</div>
          <div>seam/aura active: seam={String(battleProfile.seamEnergyMul !== 1)} aura={String(battleProfile.persistentAuraMul !== 1)}</div>
          <div>seam/aura mul: seam={battleProfile.seamEnergyMul} aura={battleProfile.persistentAuraMul} seamAura={auraMul.toFixed(3)} vsAura={vsAuraMul.toFixed(3)}</div>
          <div>narrative first selected: {debugFirstNarratives?.[0] || "(none)"}</div>
          <div>narrative second selected: {debugSecondNarratives?.[0] || "(none)"}</div>
          <div>narrative first all: {debugFirstNarratives?.join(" | ") || "(none)"}</div>
          <div>narrative second all: {debugSecondNarratives?.join(" | ") || "(none)"}</div>
          <div style={{ marginTop: 6, fontWeight: 700 }}>emotional event hooks fired</div>
          <div>{debugEvents.join(" || ") || "none yet"}</div>
        </div>
      ) : null}

      {/* Always-on bottom capture strip: portrait + landscape; must stay above closed leaderboard layers */}
      <div
        style={{
          ...styles.swipeZone,
          zIndex: sheetOpen ? 8 : 26,
        }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => {
          if (interactionLocked) return;
          if (e.pointerType === "mouse" && e.button !== 0) return;
          e.currentTarget.dataset.lbSwipeY = String(e.clientY);
        }}
        onPointerUp={(e) => {
          if (interactionLocked) return;
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
