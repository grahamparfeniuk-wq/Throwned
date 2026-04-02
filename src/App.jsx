import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const THROW_DISTANCE = 92;
const THROW_VELOCITY = 640;
const CATEGORY_DISTANCE = 118;
const CATEGORY_VELOCITY = 760;
const HOLD_MS = 320;
const LABEL_VISIBLE_MS = 1600;
const STORAGE_KEY_ONBOARDING = 'throwned-gesture-walkthrough-seen-v12';

const ARENAS = [
  { id: 'skateboard-tricks', label: 'Skateboard Tricks', mediaType: 'video', accent: '#7c3aed' },
  { id: 'epic-fails', label: 'Epic Fails', mediaType: 'video', accent: '#ef4444' },
  { id: 'original-songs', label: 'Original Songs', mediaType: 'video', accent: '#f59e0b' },
  { id: 'comedy', label: 'Comedy', mediaType: 'video', accent: '#22c55e' },
  { id: 'sports', label: 'Sports', mediaType: 'video', accent: '#06b6d4' },
  { id: 'best-sunset', label: 'Best Sunset', mediaType: 'image', accent: '#fb7185' },
  { id: 'cute-kittens', label: 'Cute Kittens', mediaType: 'image', accent: '#a78bfa' },
  { id: 'wildcard', label: 'Wildcard', mediaType: 'video', accent: '#8b5cf6' },
];

const DEMO_MEDIA = [
  { id: 1, arenaId: 'epic-fails', title: 'Slip Jacket', creator: '@fail_1', mediaType: 'video', src: 'https://www.w3schools.com/html/mov_bbb.mp4', trimStart: 0, trimEnd: 7, uploaded: false, rating: 3200, confidence: 0.78, wins: 0, losses: 0 },
  { id: 2, arenaId: 'epic-fails', title: 'Box Miss', creator: '@fail_2', mediaType: 'video', src: 'https://www.w3schools.com/html/movie.mp4', trimStart: 0, trimEnd: 7, uploaded: false, rating: 3168, confidence: 0.72, wins: 0, losses: 0 },
  { id: 3, arenaId: 'epic-fails', title: 'Flower Chaos', creator: '@fail_3', mediaType: 'video', src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', trimStart: 0, trimEnd: 7, uploaded: false, rating: 3144, confidence: 0.69, wins: 0, losses: 0 },

  { id: 4, arenaId: 'sports', title: 'Track Burst', creator: '@sport_1', mediaType: 'video', src: 'https://media.w3.org/2010/05/sintel/trailer.mp4', trimStart: 0, trimEnd: 7, uploaded: false, rating: 3215, confidence: 0.8, wins: 0, losses: 0 },
  { id: 5, arenaId: 'sports', title: 'Court Handle', creator: '@sport_2', mediaType: 'video', src: 'https://www.w3schools.com/html/mov_bbb.mp4', trimStart: 0, trimEnd: 7, uploaded: false, rating: 3177, confidence: 0.74, wins: 0, losses: 0 },
  { id: 6, arenaId: 'sports', title: 'Rope Rhythm', creator: '@sport_3', mediaType: 'video', src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm', trimStart: 0, trimEnd: 7, uploaded: false, rating: 3138, confidence: 0.67, wins: 0, losses: 0 },

  { id: 7, arenaId: 'original-songs', title: 'Neon Vocal', creator: '@song_1', mediaType: 'video', src: 'https://www.w3schools.com/html/movie.mp4', trimStart: 0, trimEnd: 7, uploaded: false, rating: 3194, confidence: 0.78, wins: 0, losses: 0 },
  { id: 8, arenaId: 'original-songs', title: 'Studio Chorus', creator: '@song_2', mediaType: 'video', src: 'https://media.w3.org/2010/05/sintel/trailer.mp4', trimStart: 0, trimEnd: 7, uploaded: false, rating: 3155, confidence: 0.72, wins: 0, losses: 0 },
  { id: 9, arenaId: 'original-songs', title: 'Mic Room Hook', creator: '@song_3', mediaType: 'video', src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', trimStart: 0, trimEnd: 7, uploaded: false, rating: 3115, confidence: 0.66, wins: 0, losses: 0 },

  { id: 10, arenaId: 'comedy', title: 'Dry Delivery', creator: '@comedy_1', mediaType: 'video', src: 'https://www.w3schools.com/html/mov_bbb.mp4', trimStart: 0, trimEnd: 7, uploaded: false, rating: 3188, confidence: 0.77, wins: 0, losses: 0 },
  { id: 11, arenaId: 'comedy', title: 'Timing Break', creator: '@comedy_2', mediaType: 'video', src: 'https://www.w3schools.com/html/movie.mp4', trimStart: 0, trimEnd: 7, uploaded: false, rating: 3160, confidence: 0.72, wins: 0, losses: 0 },
  { id: 12, arenaId: 'comedy', title: 'Silent Look', creator: '@comedy_3', mediaType: 'video', src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm', trimStart: 0, trimEnd: 7, uploaded: false, rating: 3128, confidence: 0.68, wins: 0, losses: 0 },

  { id: 13, arenaId: 'skateboard-tricks', title: 'Rail Attempt', creator: '@skate_1', mediaType: 'video', src: 'https://media.w3.org/2010/05/sintel/trailer.mp4', trimStart: 0, trimEnd: 7, uploaded: false, rating: 3208, confidence: 0.79, wins: 0, losses: 0 },
  { id: 14, arenaId: 'skateboard-tricks', title: 'Kickflip Gap', creator: '@skate_2', mediaType: 'video', src: 'https://www.w3schools.com/html/mov_bbb.mp4', trimStart: 0, trimEnd: 7, uploaded: false, rating: 3170, confidence: 0.73, wins: 0, losses: 0 },
  { id: 15, arenaId: 'skateboard-tricks', title: 'Late Shuv', creator: '@skate_3', mediaType: 'video', src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', trimStart: 0, trimEnd: 7, uploaded: false, rating: 3130, confidence: 0.68, wins: 0, losses: 0 },

  { id: 16, arenaId: 'wildcard', title: 'Anything Goes', creator: '@wild_1', mediaType: 'video', src: 'https://www.w3schools.com/html/movie.mp4', trimStart: 0, trimEnd: 7, uploaded: false, rating: 3175, confidence: 0.75, wins: 0, losses: 0 },
  { id: 17, arenaId: 'wildcard', title: 'Odd Moment', creator: '@wild_2', mediaType: 'video', src: 'https://media.w3.org/2010/05/sintel/trailer.mp4', trimStart: 0, trimEnd: 7, uploaded: false, rating: 3140, confidence: 0.69, wins: 0, losses: 0 },
  { id: 18, arenaId: 'wildcard', title: 'Short Burst', creator: '@wild_3', mediaType: 'video', src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm', trimStart: 0, trimEnd: 7, uploaded: false, rating: 3110, confidence: 0.65, wins: 0, losses: 0 },

  { id: 101, arenaId: 'best-sunset', title: 'Burning Horizon', creator: '@sunset_1', mediaType: 'image', src: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80', uploaded: false, rating: 3205, confidence: 0.8, wins: 0, losses: 0 },
  { id: 102, arenaId: 'best-sunset', title: 'Pink Fade', creator: '@sunset_2', mediaType: 'image', src: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=80', uploaded: false, rating: 3176, confidence: 0.75, wins: 0, losses: 0 },
  { id: 103, arenaId: 'best-sunset', title: 'Last Light', creator: '@sunset_3', mediaType: 'image', src: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1400&q=80', uploaded: false, rating: 3138, confidence: 0.69, wins: 0, losses: 0 },

  { id: 111, arenaId: 'cute-kittens', title: 'Tiny Stare', creator: '@kitten_1', mediaType: 'image', src: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=1400&q=80', uploaded: false, rating: 3210, confidence: 0.81, wins: 0, losses: 0 },
  { id: 112, arenaId: 'cute-kittens', title: 'Paw Lean', creator: '@kitten_2', mediaType: 'image', src: 'https://images.unsplash.com/photo-1511044568932-338cba0ad803?auto=format&fit=crop&w=1400&q=80', uploaded: false, rating: 3174, confidence: 0.75, wins: 0, losses: 0 },
  { id: 113, arenaId: 'cute-kittens', title: 'Window Face', creator: '@kitten_3', mediaType: 'image', src: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=1400&q=80', uploaded: false, rating: 3142, confidence: 0.7, wins: 0, losses: 0 },
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function expectedScore(a, b) {
  return 1 / (1 + 10 ** ((b - a) / 400));
}

function getVoteTrust(msSinceUnlock) {
  if (msSinceUnlock < 350) return 0.2;
  if (msSinceUnlock < 850) return 0.45;
  if (msSinceUnlock < 1500) return 0.7;
  return 1;
}

function updateConfidence(current, strongVote) {
  return clamp(current + (strongVote ? 0.04 : 0.022), 0.35, 0.98);
}

function computeConfidenceAdjustedDelta(winner, loser, finalVoteWeight) {
  const baseK = 32;
  const expectedWinner = expectedScore(winner.rating, loser.rating);
  const winnerVolatility = 1.15 + (1 - winner.confidence) * 0.85;
  const loserVolatility = 1.15 + (1 - loser.confidence) * 0.85;

  return {
    winnerDelta: Math.max(2, Math.round(baseK * (1 - expectedWinner) * finalVoteWeight * winnerVolatility)),
    loserDelta: Math.max(2, Math.round(baseK * (1 - expectedWinner) * finalVoteWeight * loserVolatility)),
  };
}

function confidenceLabel(confidence) {
  if (confidence >= 0.86) return 'Royalty';
  if (confidence >= 0.73) return 'Elite';
  if (confidence >= 0.58) return 'Rising';
  return 'Wildcard';
}

function safeDuration(item) {
  if (!item) return 2000;
  if (item.mediaType !== 'video') return 2600;
  return Math.max(1000, ((item.trimEnd || 7) - (item.trimStart || 0)) * 1000);
}

function useIsPortrait() {
  const getValue = () =>
    typeof window !== 'undefined' ? window.innerHeight >= window.innerWidth : true;

  const [isPortrait, setIsPortrait] = useState(getValue());

  useEffect(() => {
    const onResize = () => setIsPortrait(getValue());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return isPortrait;
}

function formatSeconds(value) {
  return `${Number(value || 0).toFixed(1)}s`;
}

function getArena(arenaId) {
  return ARENAS.find((a) => a.id === arenaId) || ARENAS[0];
}

function getArenaItems(pool, arenaId) {
  const arena = getArena(arenaId);
  return pool.filter((item) => item.arenaId === arenaId && item.mediaType === arena.mediaType);
}

function sortLeaderboard(items) {
  return items
    .slice()
    .sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return b.confidence - a.confidence;
    })
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

function pickRandom(pool, excludeIds = []) {
  const choices = pool.filter((item) => !excludeIds.includes(item.id));
  if (!choices.length) return null;
  return choices[Math.floor(Math.random() * choices.length)];
}

function pickTwo(pool, avoidIds = []) {
  const first = pickRandom(pool, avoidIds);
  const second = pickRandom(pool, [...avoidIds, first?.id]);

  if (first && second && first.id !== second.id) return { first, second };

  const fallbackFirst = pool[0] || null;
  const fallbackSecond = pool.find((item) => item.id !== fallbackFirst?.id) || pool[1] || null;

  return { first: fallbackFirst, second: fallbackSecond };
}

function getThrowVector(side, isPortrait) {
  if (isPortrait) {
    return side === 'first' ? { x: 0, y: -window.innerHeight * 0.72 } : { x: 0, y: window.innerHeight * 0.72 };
  }
  return side === 'first' ? { x: -window.innerWidth * 0.72, y: 0 } : { x: window.innerWidth * 0.72, y: 0 };
}

function getEnterInitial(side, isPortrait) {
  const base = getThrowVector(side, isPortrait);
  return {
    x: base.x * 0.38,
    y: base.y * 0.38,
    opacity: 0.12,
    scale: 0.99,
    rotate: isPortrait ? base.y / 200 : base.x / 260,
  };
}

function getClipName(item) {
  return item?.title || 'Untitled';
}

function normalizeUploadContender(data, id) {
  return {
    id,
    arenaId: data.arenaId,
    title: String(data.title || 'Untitled'),
    creator: String(data.creator || '@me'),
    mediaType: data.mediaType === 'image' ? 'image' : 'video',
    src: String(data.src),
    trimStart: data.mediaType === 'video' ? Number(data.trimStart || 0) : 0,
    trimEnd: data.mediaType === 'video' ? Number(data.trimEnd || 7) : 0,
    uploaded: true,
    rating: 3000,
    confidence: 0.55,
    wins: 0,
    losses: 0,
  };
}

function AppShell({ children, accent }) {
  return (
    <div style={styles.app}>
      <div
        style={{
          ...styles.phone,
          background: `radial-gradient(circle at 50% 0%, ${accent}16, transparent 22%), radial-gradient(circle at 50% 52%, ${accent}10, transparent 34%), #050608`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function ArenaLabel({ arena, visible, isPortrait, direction }) {
  const initialX = !isPortrait ? direction * 34 : 0;
  const initialY = isPortrait ? direction * 16 : 0;

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, x: initialX, y: initialY, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: initialX * 0.3, y: initialY * 0.3, scale: 0.98 }}
            transition={{ duration: 0.35 }}
            style={isPortrait ? styles.arenaHeroWrapPortrait : styles.arenaHeroWrapLandscape}
          >
            <div style={styles.arenaHeroSmall}>Arena</div>
            <div
              style={{
                ...styles.arenaHeroText,
                color: arena.accent,
                textShadow: `0 0 24px ${arena.accent}55`,
              }}
            >
              {arena.label}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={isPortrait ? styles.arenaWhisperPortrait : styles.arenaWhisperLandscapeTop}>
        <div style={{ ...styles.arenaWhisperText, color: arena.accent }}>{arena.label}</div>
      </div>
    </>
  );
}

function DiamondVS({ accent }) {
  return (
    <div style={styles.vsCenterLayer}>
      <div style={{ ...styles.vsDiamond, borderColor: `${accent}` }}>
        <div style={styles.vsDiamondInner}>
          <span style={styles.vsText}>VS</span>
        </div>
      </div>
    </div>
  );
}

function PauseChip({ paused, isPortrait, show }) {
  return (
    <AnimatePresence>
      {paused && show && (
        <motion.div
          style={isPortrait ? styles.pausePortraitLayer : styles.pauseLandscapeLayer}
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.18 }}
        >
          <div style={styles.pauseChip}>
            <div style={styles.pauseBars}>
              <span style={styles.pauseBar} />
              <span style={styles.pauseBar} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SeamLine({ isPortrait, accent }) {
  return (
    <div
      style={
        isPortrait
          ? { ...styles.seamLinePortrait, background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }
          : { ...styles.seamLineLandscape, background: `linear-gradient(180deg, transparent, ${accent}, transparent)` }
      }
    />
  );
}

function ChampionMoment({ item, accent }) {
  if (!item) return null;

  return (
    <AnimatePresence>
      <motion.div
        style={styles.championOverlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          style={{ ...styles.championCard, borderColor: `${accent}66` }}
          initial={{ opacity: 0, scale: 0.96, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 6 }}
          transition={{ duration: 0.26 }}
        >
          <div style={styles.championGlow} />
          <div style={styles.championMicro}>3X DEFENDER</div>
          <div style={styles.championTitle}>{getClipName(item)}</div>
          <div style={styles.championCreator}>{item.creator}</div>
          <div style={styles.championRule} />
          <div style={styles.championSub}>Crowned, then cleared for fresh contenders.</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function DetailsOverlay({ item, accent }) {
  if (!item) return null;

  return (
    <AnimatePresence>
      <motion.div
        style={styles.detailsOverlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          style={{ ...styles.detailsCard, borderColor: `${accent}66` }}
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          <div style={styles.detailsTitle}>{item.title}</div>
          <div style={styles.detailsCreator}>{item.creator}</div>

          <div style={styles.detailsMetaRow}>
            <div style={styles.detailsPill}>Rating {item.rating}</div>
            <div style={styles.detailsPill}>{confidenceLabel(item.confidence)}</div>
            <div style={styles.detailsPill}>{item.mediaType === 'video' ? 'Video' : 'Photo'}</div>
          </div>

          {item.mediaType === 'video' && (
            <div style={styles.detailsSubText}>
              {formatSeconds(item.trimStart || 0)} – {formatSeconds(item.trimEnd || 0)}
            </div>
          )}

          <div style={{ ...styles.detailsArena, color: accent }}>{getArena(item.arenaId).label}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function VoteFlash({ accent, visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          style={{
            ...styles.voteFlash,
            background: `radial-gradient(circle at center, ${accent}22, transparent 58%)`,
          }}
        />
      )}
    </AnimatePresence>
  );
}

function MediaSurface({ item, accent, onHoldStart, onHoldEnd, isActivePlayback, paused, dimmed, showWinnerGlow, isPortrait }) {
  const mediaRef = useRef(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    setLoadFailed(false);
  }, [item?.src]);

  useEffect(() => {
    if (!item || item.mediaType !== 'video') return;

    const el = mediaRef.current;
    if (!el) return;

    const startTime = item.trimStart || 0;
    const endTime = item.trimEnd || 7;

    const onTimeUpdate = () => {
      if (el.currentTime >= endTime) {
        el.pause();
      }
    };

    el.addEventListener('timeupdate', onTimeUpdate);

    if (paused || !isActivePlayback) {
      el.pause();
      el.muted = true;
    } else {
      try {
        if (el.currentTime < startTime || el.currentTime > endTime) {
          el.currentTime = startTime;
        }
      } catch {}
      el.muted = false;
      const p = el.play();
      if (p?.catch) p.catch(() => {});
    }

    return () => {
      el.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, [item, isActivePlayback, paused]);

  if (!item) return null;

  const mediaStyle =
    item.mediaType === 'video'
      ? isPortrait
        ? styles.videoMediaPortrait
        : styles.videoMediaLandscape
      : isPortrait
        ? styles.imageMediaPortrait
        : styles.imageMediaLandscape;

  return (
    <div
      style={{
        ...styles.surface,
        boxShadow: showWinnerGlow ? `0 0 44px ${accent}2b inset` : 'none',
      }}
      onMouseDown={() => onHoldStart(item.id)}
      onMouseUp={onHoldEnd}
      onMouseLeave={onHoldEnd}
      onTouchStart={() => onHoldStart(item.id)}
      onTouchEnd={onHoldEnd}
      onTouchCancel={onHoldEnd}
    >
      {!loadFailed ? (
        item.mediaType === 'video' ? (
          <video
            ref={mediaRef}
            src={item.src}
            playsInline
            preload="auto"
            style={mediaStyle}
            onError={() => setLoadFailed(true)}
          />
        ) : (
          <img
            ref={mediaRef}
            src={item.src}
            alt={item.title}
            style={mediaStyle}
            onError={() => setLoadFailed(true)}
          />
        )
      ) : (
        <div
          style={{
            ...styles.fallback,
            background: `linear-gradient(180deg, ${accent}22, rgba(0,0,0,0.82))`,
          }}
        >
          <div style={styles.fallbackEyebrow}>{getArena(item.arenaId).label}</div>
          <div style={styles.fallbackTitle}>{item.title}</div>
          <div style={styles.fallbackCreator}>{item.creator}</div>
        </div>
      )}

      <div style={styles.surfaceScrim} />
      <div style={styles.surfaceEdgeVignette} />
      {dimmed && <div style={styles.inactiveShade} />}
    </div>
  );
}

function GestureLayer({ side, onGestureComplete, disabled }) {
  const startRef = useRef({ x: 0, y: 0 });

  return (
    <div
      style={styles.gestureLayer}
      onTouchStart={(e) => {
        if (disabled) return;
        const t = e.touches?.[0];
        if (!t) return;
        startRef.current = { x: t.clientX, y: t.clientY };
      }}
      onTouchEnd={(e) => {
        if (disabled) return;
        const t = e.changedTouches?.[0];
        if (!t) return;
        const dx = t.clientX - startRef.current.x;
        const dy = t.clientY - startRef.current.y;
        const vx = dx * 8;
        const vy = dy * 8;
        onGestureComplete(side, dx, dy, vx, vy);
      }}
      onMouseDown={(e) => {
        if (disabled) return;
        startRef.current = { x: e.clientX, y: e.clientY };
      }}
      onMouseUp={(e) => {
        if (disabled) return;
        const dx = e.clientX - startRef.current.x;
        const dy = e.clientY - startRef.current.y;
        const vx = dx * 8;
        const vy = dy * 8;
        onGestureComplete(side, dx, dy, vx, vy);
      }}
    />
  );
}

function BattleSlot({
  side,
  item,
  isPortrait,
  isEntering,
  accent,
  onGestureComplete,
  onHoldStart,
  onHoldEnd,
  isActivePlayback,
  paused,
  isLocked,
  dimmed,
  showWinnerGlow,
  throwAnimate,
}) {
  const initial = isEntering ? getEnterInitial(side, isPortrait) : false;

  return (
    <motion.div
      key={`${side}-${item?.id}`}
      initial={initial}
      animate={throwAnimate || { x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
      transition={{
        type: 'spring',
        stiffness: 220,
        damping: 24,
        opacity: { duration: 0.18 },
      }}
      style={{
        ...styles.slot,
        ...(isPortrait ? styles.slotPortrait : styles.slotLandscape),
      }}
    >
      <MediaSurface
        item={item}
        accent={accent}
        onHoldStart={onHoldStart}
        onHoldEnd={onHoldEnd}
        isActivePlayback={isActivePlayback}
        paused={paused}
        dimmed={dimmed}
        showWinnerGlow={showWinnerGlow}
        isPortrait={isPortrait}
      />
      <GestureLayer side={side} onGestureComplete={onGestureComplete} disabled={isLocked} />
    </motion.div>
  );
}

function LeaderboardSheet({ items, arena, isOpen, setIsOpen }) {
  const ranked = useMemo(() => sortLeaderboard(items), [items]);

  return (
    <motion.div
      drag="y"
      dragElastic={0.08}
      dragConstraints={{ top: 0, bottom: 460 }}
      onDragEnd={(_, info) => {
        if (info.offset.y > 80) setIsOpen(false);
        if (info.offset.y < -80) setIsOpen(true);
      }}
      animate={{ y: isOpen ? 0 : 446 }}
      transition={{ type: 'spring', stiffness: 280, damping: 30 }}
      style={styles.sheet}
    >
      <div style={styles.sheetHandleTap} onClick={() => setIsOpen((prev) => !prev)}>
        <div style={styles.sheetHandle} />
      </div>

      <div style={styles.sheetHeader}>
        <div>
          <div style={styles.sheetEyebrow}>Leaderboard</div>
          <div style={{ ...styles.sheetTitle, color: arena.accent }}>{arena.label}</div>
        </div>
        <div style={styles.sheetCount}>{ranked.length} contenders</div>
      </div>

      <div style={styles.sheetList}>
        {ranked.map((item, index) => (
          <div key={item.id} style={styles.sheetRow}>
            <div style={styles.sheetRank}>#{index + 1}</div>
            <div style={styles.sheetTextWrap}>
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

function OnboardingOverlay({ onClose }) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: 'Watch the contest',
      body: 'Only one contender plays at a time. The arena gives each one a clean shot.',
    },
    {
      title: 'Hold for details',
      body: 'Press and hold any contender to reveal its identity, rank state, and arena.',
    },
    {
      title: 'Throw or switch',
      body: 'Swipe outward to throw away a loser. Swipe inward to switch arenas.',
    },
  ];

  const current = steps[step];

  function next() {
    if (step === steps.length - 1) {
      onClose();
      return;
    }
    setStep((prev) => prev + 1);
  }

  return (
    <motion.div
      style={styles.onboardingOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        key={step}
        style={styles.onboardingCard}
        initial={{ opacity: 0, y: 14, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.985 }}
        transition={{ duration: 0.24 }}
      >
        <div style={styles.onboardingStep}>0{step + 1}</div>
        <div style={styles.onboardingTitle}>{current.title}</div>
        <div style={styles.onboardingBody}>{current.body}</div>

        <div style={styles.onboardingDots}>
          {steps.map((_, idx) => (
            <div
              key={idx}
              style={{
                ...styles.onboardingDot,
                opacity: idx === step ? 1 : 0.22,
                transform: idx === step ? 'scale(1.05)' : 'scale(1)',
              }}
            />
          ))}
        </div>

        <div style={styles.onboardingActions}>
          <button style={styles.onboardingGhost} onClick={onClose}>
            Skip
          </button>
          <button style={styles.onboardingPrimary} onClick={next}>
            {step === steps.length - 1 ? 'Enter Arena' : 'Next'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function UploadSheet({ isOpen, onClose, onSave, initialArenaId }) {
  const [arenaId, setArenaId] = useState(initialArenaId || ARENAS[0].id);
  const [title, setTitle] = useState('');
  const [creator, setCreator] = useState('@me');
  const [mediaType, setMediaType] = useState(getArena(initialArenaId || ARENAS[0].id).mediaType);
  const [file, setFile] = useState(null);
  const [objectUrl, setObjectUrl] = useState('');
  const [duration, setDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(7);

  const inputLibraryRef = useRef(null);
  const inputCaptureRef = useRef(null);
  const previewVideoRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setArenaId(initialArenaId || ARENAS[0].id);
    setMediaType(getArena(initialArenaId || ARENAS[0].id).mediaType);
  }, [isOpen, initialArenaId]);

  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setCreator('@me');
      setFile(null);
      setObjectUrl('');
      setDuration(0);
      setTrimStart(0);
      setTrimEnd(7);
    }
  }, [isOpen]);

  useEffect(() => {
    setMediaType(getArena(arenaId).mediaType);
  }, [arenaId]);

  function handleArenaChange(nextArenaId) {
    setArenaId(nextArenaId);
    const nextType = getArena(nextArenaId).mediaType;
    setMediaType(nextType);
    setFile(null);
    setObjectUrl('');
    setDuration(0);
    setTrimStart(0);
    setTrimEnd(7);
  }

  function acceptString(type) {
    return type === 'image' ? 'image/*' : 'video/*';
  }

  function loadFile(selected) {
    if (!selected) return;

    const fileType = selected.type?.startsWith('image/')
      ? 'image'
      : selected.type?.startsWith('video/')
        ? 'video'
        : null;

    if (!fileType || fileType !== mediaType) {
      alert(`This arena only accepts ${mediaType === 'video' ? 'video' : 'image'} uploads.`);
      return;
    }

    const nextUrl = URL.createObjectURL(selected);
    setFile(selected);
    setObjectUrl(nextUrl);

    if (!title.trim()) {
      setTitle(selected.name.replace(/\.[^/.]+$/, ''));
    }
  }

  function handleFileChange(e) {
    loadFile(e.target.files?.[0]);
  }

  function handleLoadedMetadata() {
    const el = previewVideoRef.current;
    if (!el) return;
    const d = Number(el.duration || 0);
    const safeEnd = Math.min(d, 7);
    setDuration(d);
    setTrimStart(0);
    setTrimEnd(safeEnd || 7);
  }

  function handleSave() {
    if (!file || !objectUrl) return;

    onSave({
      title: title.trim() || file.name.replace(/\.[^/.]+$/, ''),
      creator: creator.trim() || '@me',
      arenaId,
      mediaType,
      src: objectUrl,
      trimStart: mediaType === 'video' ? trimStart : 0,
      trimEnd: mediaType === 'video' ? trimEnd : 0,
    });
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          style={styles.uploadOverlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            style={styles.uploadCard}
            initial={{ opacity: 0, y: 14, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.985 }}
          >
            <div style={styles.uploadHeader}>
              <div>
                <div style={styles.uploadEyebrow}>Add contender</div>
                <div style={styles.uploadTitle}>Upload</div>
              </div>
              <button style={styles.uploadClose} onClick={onClose}>
                ✕
              </button>
            </div>

            <div style={styles.uploadGrid}>
              <label style={styles.uploadField}>
                <span style={styles.uploadLabel}>Arena</span>
                <select
                  value={arenaId}
                  onChange={(e) => handleArenaChange(e.target.value)}
                  style={styles.uploadInput}
                >
                  {ARENAS.map((arena) => (
                    <option key={arena.id} value={arena.id}>
                      {arena.label}
                    </option>
                  ))}
                </select>
              </label>

              <label style={styles.uploadField}>
                <span style={styles.uploadLabel}>Type</span>
                <input value={mediaType === 'video' ? 'Video' : 'Image'} readOnly style={styles.uploadInput} />
              </label>

              <label style={styles.uploadField}>
                <span style={styles.uploadLabel}>Title</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contender title"
                  style={styles.uploadInput}
                />
              </label>

              <label style={styles.uploadField}>
                <span style={styles.uploadLabel}>Creator</span>
                <input
                  value={creator}
                  onChange={(e) => setCreator(e.target.value)}
                  placeholder="@creator"
                  style={styles.uploadInput}
                />
              </label>
            </div>

            <div style={styles.captureButtons}>
              <button style={styles.uploadActionButton} onClick={() => inputLibraryRef.current?.click()}>
                From library
              </button>
              <button style={styles.uploadActionButton} onClick={() => inputCaptureRef.current?.click()}>
                {mediaType === 'video' ? 'Record now' : 'Take photo'}
              </button>

              <input
                ref={inputLibraryRef}
                type="file"
                accept={acceptString(mediaType)}
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              <input
                ref={inputCaptureRef}
                type="file"
                accept={acceptString(mediaType)}
                capture="environment"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>

            <div style={styles.previewBox}>
              {!objectUrl ? (
                <div style={styles.previewEmpty}>
                  Choose a {mediaType === 'video' ? 'video' : 'photo'} that belongs in this arena.
                </div>
              ) : mediaType === 'video' ? (
                <>
                  <video
                    ref={previewVideoRef}
                    src={objectUrl}
                    controls
                    playsInline
                    style={styles.previewMedia}
                    onLoadedMetadata={handleLoadedMetadata}
                  />

                  <div style={styles.trimStats}>
                    <div style={styles.trimStatPill}>Full: {duration ? formatSeconds(duration) : '...'}</div>
                    <div style={styles.trimStatPill}>Selected: {formatSeconds(Math.max(0, trimEnd - trimStart))}</div>
                    <div style={styles.trimStatPill}>Max: 7.0s</div>
                  </div>

                  <div style={styles.sliderGroup}>
                    <label style={styles.sliderLabel}>Start: {formatSeconds(trimStart)}</label>
                    <input
                      type="range"
                      min={0}
                      max={Math.max(0, duration - 0.1)}
                      step={0.1}
                      value={trimStart}
                      onChange={(e) => {
                        const nextStart = Number(e.target.value);
                        setTrimStart(nextStart);
                        if (trimEnd - nextStart > 7) setTrimEnd(nextStart + 7);
                        if (trimEnd <= nextStart) setTrimEnd(nextStart + 0.2);
                      }}
                      style={styles.slider}
                    />
                  </div>

                  <div style={styles.sliderGroup}>
                    <label style={styles.sliderLabel}>End: {formatSeconds(trimEnd)}</label>
                    <input
                      type="range"
                      min={0.1}
                      max={duration || 7}
                      step={0.1}
                      value={trimEnd}
                      onChange={(e) => {
                        let nextEnd = Number(e.target.value);
                        if (nextEnd <= trimStart) nextEnd = trimStart + 0.2;
                        if (nextEnd - trimStart > 7) nextEnd = trimStart + 7;
                        setTrimEnd(nextEnd);
                      }}
                      style={styles.slider}
                    />
                  </div>
                </>
              ) : (
                <img src={objectUrl} alt="Preview" style={styles.previewMedia} />
              )}
            </div>

            <div style={styles.uploadActions}>
              <button style={styles.uploadSecondary} onClick={onClose}>
                Cancel
              </button>
              <button
                style={{
                  ...styles.uploadPrimary,
                  opacity: objectUrl ? 1 : 0.45,
                  cursor: objectUrl ? 'pointer' : 'not-allowed',
                }}
                onClick={handleSave}
                disabled={!objectUrl}
              >
                Save contender
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function BattleArena({ pool, setPool, arena, onSwipeArena, onOpenUpload }) {
  const isPortrait = useIsPortrait();

  const arenaItems = useMemo(() => sortLeaderboard(getArenaItems(pool, arena.id)), [pool, arena.id]);
  const poolRef = useRef(pool);
  const battleHistoryRef = useRef([]);
  const holdTimerRef = useRef(null);
  const holdTriggeredRef = useRef(false);
  const labelTimerRef = useRef(null);
  const bottomSwipeRef = useRef({ x: 0, y: 0, active: false });
  const voteFlashTimerRef = useRef(null);

  const [pair, setPair] = useState(() => pickTwo(arenaItems));
  const [winnerId, setWinnerId] = useState(null);
  const [streak, setStreak] = useState(0);
  const [showChampion, setShowChampion] = useState(false);
  const [championItem, setChampionItem] = useState(null);
  const [detailsId, setDetailsId] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [labelVisible, setLabelVisible] = useState(true);
  const [labelDirection, setLabelDirection] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [paused, setPaused] = useState(false);
  const [activeSide, setActiveSide] = useState('second');
  const [decisionUnlockedAt, setDecisionUnlockedAt] = useState(Date.now());
  const [userTrust, setUserTrust] = useState(1);
  const [rushedVotes, setRushedVotes] = useState(0);
  const [totalVotes, setTotalVotes] = useState(0);
  const [throwState, setThrowState] = useState(null);
  const [enterState, setEnterState] = useState(null);
  const [transitioningArena, setTransitioningArena] = useState(false);
  const [voteFlashVisible, setVoteFlashVisible] = useState(false);

  const detailsItem = useMemo(
    () => arenaItems.find((item) => item.id === detailsId) || null,
    [arenaItems, detailsId]
  );

  useEffect(() => {
    poolRef.current = pool;
  }, [pool]);

  function showArenaLabel(direction = 0) {
    setLabelDirection(direction);
    setLabelVisible(true);
    if (labelTimerRef.current) clearTimeout(labelTimerRef.current);
    labelTimerRef.current = setTimeout(() => setLabelVisible(false), LABEL_VISIBLE_MS);
  }

  function pulseVoteFlash() {
    setVoteFlashVisible(true);
    if (voteFlashTimerRef.current) clearTimeout(voteFlashTimerRef.current);
    voteFlashTimerRef.current = setTimeout(() => setVoteFlashVisible(false), 240);
  }

  function pickNextPair(items, history) {
    if (items.length < 2) return pickTwo(items);

    const recentIds = history.slice(-4);
    let next = pickTwo(items, recentIds);

    if (!next.first || !next.second) return next;
    if (next.first.id === next.second.id) next = pickTwo(items, []);

    return next;
  }

  useEffect(() => {
    showArenaLabel(0);
    setSheetOpen(false);
    setDetailsId(null);
    setPaused(false);
    setWinnerId(null);
    setStreak(0);
    setShowChampion(false);
    setChampionItem(null);
    setIsLocked(false);
    setThrowState(null);
    setEnterState(null);
    setVoteFlashVisible(false);
    setDecisionUnlockedAt(Date.now());

    const nextPair = pickNextPair(arenaItems, battleHistoryRef.current);
    setPair(nextPair);
    setActiveSide(nextPair?.second ? 'second' : 'first');
    setTransitioningArena(true);

    const t = setTimeout(() => setTransitioningArena(false), 230);
    return () => clearTimeout(t);
  }, [arena.id, arenaItems.length]);

  useEffect(() => {
    return () => {
      if (labelTimerRef.current) clearTimeout(labelTimerRef.current);
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (voteFlashTimerRef.current) clearTimeout(voteFlashTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!pair?.first || !pair?.second || paused || showChampion || detailsId || isLocked || transitioningArena) return;
    const activeItem = activeSide === 'first' ? pair.first : pair.second;
    const timer = setTimeout(() => {
      setActiveSide((prev) => (prev === 'first' ? 'second' : 'first'));
    }, safeDuration(activeItem));

    return () => clearTimeout(timer);
  }, [pair, activeSide, paused, showChampion, detailsId, isLocked, transitioningArena]);

  function updatePoolWithResults(updatedWinner, updatedLoser) {
    setPool((prev) =>
      sortLeaderboard(
        prev.map((item) => {
          if (item.id === updatedWinner.id) return updatedWinner;
          if (item.id === updatedLoser.id) return updatedLoser;
          return item;
        })
      )
    );
  }

  function startHold(id) {
    holdTriggeredRef.current = false;
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);

    holdTimerRef.current = setTimeout(() => {
      holdTriggeredRef.current = true;
      setDetailsId(id);
      setPaused(true);
    }, HOLD_MS);
  }

  function endHold() {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);

    if (holdTriggeredRef.current) {
      holdTriggeredRef.current = false;
      setDetailsId(null);
      setPaused(false);
    }
  }

  function handleTogglePause() {
    if (detailsId || showChampion || transitioningArena || sheetOpen) return;
    if (arena.mediaType !== 'video') return;
    setPaused((prev) => !prev);
  }

  function handleBottomSwipeStart(e) {
    const t = e.touches?.[0];
    if (!t) return;
    bottomSwipeRef.current = { x: t.clientX, y: t.clientY, active: true };
  }

  function handleBottomSwipeEnd(e) {
    if (!bottomSwipeRef.current.active) return;
    const t = e.changedTouches?.[0];
    if (!t) return;

    const dx = t.clientX - bottomSwipeRef.current.x;
    const dy = t.clientY - bottomSwipeRef.current.y;

    if (dy < -70 && Math.abs(dy) > Math.abs(dx)) setSheetOpen(true);
    if (dy > 70 && Math.abs(dy) > Math.abs(dx)) setSheetOpen(false);

    bottomSwipeRef.current.active = false;
  }

  function resolveGesture(side, offsetX, offsetY, velocityX, velocityY) {
    if (isPortrait) {
      if (side === 'first') {
        if (offsetY < -THROW_DISTANCE || velocityY < -THROW_VELOCITY) return 'throw';
        if (offsetY > CATEGORY_DISTANCE || velocityY > CATEGORY_VELOCITY) return 'category-prev';
      } else {
        if (offsetY > THROW_DISTANCE || velocityY > THROW_VELOCITY) return 'throw';
        if (offsetY < -CATEGORY_DISTANCE || velocityY < -CATEGORY_VELOCITY) return 'category-next';
      }
      return 'none';
    }

    if (side === 'first') {
      if (offsetX < -THROW_DISTANCE || velocityX < -THROW_VELOCITY) return 'throw';
      if (offsetX > CATEGORY_DISTANCE || velocityX > CATEGORY_VELOCITY) return 'category-prev';
    } else {
      if (offsetX > THROW_DISTANCE || velocityX > THROW_VELOCITY) return 'throw';
      if (offsetX < -CATEGORY_DISTANCE || velocityX < -CATEGORY_VELOCITY) return 'category-next';
    }

    return 'none';
  }

  function handleSurfaceGesture(side, offsetX, offsetY, velocityX, velocityY) {
    if (isLocked || !pair?.first || !pair?.second || showChampion || detailsId || transitioningArena) return;

    const outcome = resolveGesture(side, offsetX, offsetY, velocityX, velocityY);

    if (outcome === 'category-prev') {
      setTransitioningArena(true);
      showArenaLabel(-1);
      setTimeout(() => onSwipeArena(-1), 35);
      return;
    }

    if (outcome === 'category-next') {
      setTransitioningArena(true);
      showArenaLabel(1);
      setTimeout(() => onSwipeArena(1), 35);
      return;
    }

    if (outcome !== 'throw') return;

    setIsLocked(true);
    pulseVoteFlash();
    const throwVector = getThrowVector(side, isPortrait);
    setThrowState({ side, vector: throwVector });

    const loser = side === 'first' ? pair.first : pair.second;
    const winner = side === 'first' ? pair.second : pair.first;

    const now = Date.now();
    const msSinceUnlock = now - decisionUnlockedAt;
    const voteTrust = getVoteTrust(msSinceUnlock);
    const rushed = msSinceUnlock < 850;

    const nextTotalVotes = totalVotes + 1;
    const nextRushedVotes = rushed ? rushedVotes + 1 : rushedVotes;
    const rushedRate = nextRushedVotes / nextTotalVotes;

    let nextUserTrust = userTrust;
    if (rushed) nextUserTrust = clamp(userTrust - 0.08, 0.35, 1);
    else nextUserTrust = clamp(userTrust + 0.02, 0.35, 1);
    if (rushedRate > 0.5) nextUserTrust = clamp(nextUserTrust - 0.05, 0.35, 1);

    setUserTrust(nextUserTrust);
    setTotalVotes(nextTotalVotes);
    setRushedVotes(nextRushedVotes);

    const finalVoteWeight = voteTrust * nextUserTrust;
    const { winnerDelta, loserDelta } = computeConfidenceAdjustedDelta(winner, loser, finalVoteWeight);

    const updatedWinner = {
      ...winner,
      rating: winner.rating + winnerDelta,
      confidence: updateConfidence(winner.confidence, finalVoteWeight > 0.7),
      wins: (winner.wins || 0) + 1,
    };

    const updatedLoser = {
      ...loser,
      rating: Math.max(1000, loser.rating - loserDelta),
      confidence: updateConfidence(loser.confidence, finalVoteWeight > 0.7),
      losses: (loser.losses || 0) + 1,
    };

    updatePoolWithResults(updatedWinner, updatedLoser);

    const nextWinnerStreak = winnerId === updatedWinner.id ? streak + 1 : 1;
    setWinnerId(updatedWinner.id);
    setStreak(nextWinnerStreak);

    battleHistoryRef.current.push(updatedWinner.id, updatedLoser.id);

    window.setTimeout(() => {
      const freshArenaItems = sortLeaderboard(
        getArenaItems(
          poolRef.current.map((item) => {
            if (item.id === updatedWinner.id) return updatedWinner;
            if (item.id === updatedLoser.id) return updatedLoser;
            return item;
          }),
          arena.id
        )
      );

      if (nextWinnerStreak >= 3) {
        setChampionItem(updatedWinner);
        setShowChampion(true);

        window.setTimeout(() => {
          const withoutChampionPair = freshArenaItems.filter(
            (item) => item.id !== updatedWinner.id && item.id !== updatedLoser.id
          );
          const nextPair = pickNextPair(
            withoutChampionPair.length >= 2 ? withoutChampionPair : freshArenaItems,
            battleHistoryRef.current
          );

          setPair(nextPair);
          setActiveSide(nextPair?.second ? 'second' : 'first');
          setWinnerId(null);
          setStreak(0);
          setShowChampion(false);
          setChampionItem(null);
          setThrowState(null);
          setEnterState(null);
          setIsLocked(false);
          setPaused(false);
          setDecisionUnlockedAt(Date.now());
        }, 1280);

        return;
      }

      const challengerPool = freshArenaItems.filter(
        (item) => item.id !== updatedWinner.id && item.id !== updatedLoser.id
      );

      const recentIds = battleHistoryRef.current.slice(-4);
      const challenger = pickRandom(challengerPool, recentIds) || pickRandom(freshArenaItems, [updatedWinner.id]);

      const safeChallenger =
        challenger ||
        freshArenaItems.find((item) => item.id !== updatedWinner.id) ||
        updatedWinner;

      const enteringSide = side;
      const nextPair =
        side === 'first'
          ? { first: safeChallenger, second: updatedWinner }
          : { first: updatedWinner, second: safeChallenger };

      setPair(nextPair);
      setEnterState({
        side: enteringSide,
        itemId: safeChallenger.id,
      });
      setActiveSide(side === 'first' ? 'second' : 'first');
      setThrowState(null);
      setPaused(false);
      setDecisionUnlockedAt(Date.now());

      window.setTimeout(() => {
        setEnterState(null);
        setIsLocked(false);
      }, 340);
    }, 360);
  }

  function getThrownStyle(sideName) {
    if (!throwState || throwState.side !== sideName) return null;
    return {
      x: throwState.vector.x,
      y: throwState.vector.y,
      opacity: 0,
      scale: 0.965,
      rotate: isPortrait ? throwState.vector.y / 120 : throwState.vector.x / 140,
    };
  }

  if (!pair?.first || !pair?.second) {
    return (
      <div style={styles.emptyArena}>
        <div style={styles.emptyArenaTitle}>Not enough contenders yet</div>
        <div style={styles.emptyArenaBody}>Upload a few more so this arena can run a real contest.</div>
        <button style={styles.emptyArenaButton} onClick={onOpenUpload}>
          Add contender
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        ...styles.battleRoot,
        background: `radial-gradient(circle at 50% 50%, ${arena.accent}12, transparent 32%), #050608`,
      }}
      onClick={handleTogglePause}
    >
      <ArenaLabel arena={arena} visible={labelVisible} isPortrait={isPortrait} direction={labelDirection} />

      <motion.div
        animate={{ opacity: transitioningArena ? 0.9 : 1, scale: transitioningArena ? 0.994 : 1 }}
        transition={{ duration: 0.18 }}
        style={{ ...styles.battleLayout, ...(isPortrait ? styles.stackPortrait : styles.stackLandscape) }}
      >
        <BattleSlot
          side="first"
          item={pair.first}
          isPortrait={isPortrait}
          isEntering={enterState?.side === 'first' && enterState?.itemId === pair.first?.id}
          accent={arena.accent}
          onGestureComplete={handleSurfaceGesture}
          onHoldStart={startHold}
          onHoldEnd={endHold}
          isActivePlayback={activeSide === 'first'}
          paused={paused}
          isLocked={isLocked || transitioningArena}
          dimmed={arena.mediaType === 'video' ? activeSide !== 'first' || paused : false}
          showWinnerGlow={winnerId === pair.first.id}
          throwAnimate={getThrownStyle('first')}
        />

        <BattleSlot
          side="second"
          item={pair.second}
          isPortrait={isPortrait}
          isEntering={enterState?.side === 'second' && enterState?.itemId === pair.second?.id}
          accent={arena.accent}
          onGestureComplete={handleSurfaceGesture}
          onHoldStart={startHold}
          onHoldEnd={endHold}
          isActivePlayback={activeSide === 'second'}
          paused={paused}
          isLocked={isLocked || transitioningArena}
          dimmed={arena.mediaType === 'video' ? activeSide !== 'second' || paused : false}
          showWinnerGlow={winnerId === pair.second.id}
          throwAnimate={getThrownStyle('second')}
        />
      </motion.div>

      <SeamLine isPortrait={isPortrait} accent={`${arena.accent}bb`} />

      <div
        style={styles.leaderboardSwipeZone}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleBottomSwipeStart}
        onTouchEnd={handleBottomSwipeEnd}
      />

      <DiamondVS accent={arena.accent} />
      <PauseChip paused={paused} isPortrait={isPortrait} show={arena.mediaType === 'video'} />
      <VoteFlash accent={arena.accent} visible={voteFlashVisible} />
      <DetailsOverlay item={detailsItem} accent={arena.accent} />
      <ChampionMoment item={championItem} accent={arena.accent} />

      <div style={styles.bottomGhostBar}>
        <button
          style={styles.invisibleUploadButton}
          onClick={(e) => {
            e.stopPropagation();
            onOpenUpload();
          }}
        >
          +
        </button>
      </div>

      <LeaderboardSheet items={arenaItems} arena={arena} isOpen={sheetOpen} setIsOpen={setSheetOpen} />
    </div>
  );
}

export default function App() {
  const [pool, setPool] = useState(() => sortLeaderboard([...DEMO_MEDIA]));
  const [arenaIndex, setArenaIndex] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const nextIdRef = useRef(100000);

  const arena = ARENAS[arenaIndex];

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY_ONBOARDING);
      if (!seen) setShowOnboarding(true);
    } catch {
      setShowOnboarding(true);
    }
  }, []);

  function closeOnboarding() {
    try {
      localStorage.setItem(STORAGE_KEY_ONBOARDING, 'true');
    } catch {}
    setShowOnboarding(false);
  }

  function changeArena(direction) {
    setArenaIndex((prev) => {
      if (direction > 0) return prev === ARENAS.length - 1 ? 0 : prev + 1;
      return prev === 0 ? ARENAS.length - 1 : prev - 1;
    });
  }

  function handleSaveUpload(data) {
    const contender = normalizeUploadContender(data, nextIdRef.current++);
    setPool((prev) => sortLeaderboard([...prev, contender]));
    setArenaIndex(ARENAS.findIndex((a) => a.id === data.arenaId));
    setShowUpload(false);
  }

  return (
    <AppShell accent={arena.accent}>
      <BattleArena
        pool={pool}
        setPool={setPool}
        arena={arena}
        onSwipeArena={changeArena}
        onOpenUpload={() => setShowUpload(true)}
      />

      <AnimatePresence>
        {showOnboarding && <OnboardingOverlay onClose={closeOnboarding} />}
      </AnimatePresence>

      <UploadSheet
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onSave={handleSaveUpload}
        initialArenaId={arena.id}
      />
    </AppShell>
  );
}

const styles = {
  app: {
    minHeight: '100vh',
    background:
      'radial-gradient(circle at top, rgba(124,58,237,0.12), transparent 28%), linear-gradient(180deg, #06070a 0%, #090b0f 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  phone: {
    position: 'relative',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
  },
  battleRoot: {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  battleLayout: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    gap: 0,
  },
  stackPortrait: {
    flexDirection: 'column',
  },
  stackLandscape: {
    flexDirection: 'row',
  },
  slot: {
    position: 'relative',
    overflow: 'hidden',
    background: '#040506',
    flex: 1,
    minHeight: 0,
    minWidth: 0,
  },
  slotPortrait: {},
  slotLandscape: {},
  surface: {
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    background: '#07080b',
  },
  gestureLayer: {
    position: 'absolute',
    inset: 0,
    zIndex: 3,
    background: 'transparent',
    touchAction: 'none',
  },
  videoMediaPortrait: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: 'scale(1.06)',
    background: '#0b0b0d',
  },
  videoMediaLandscape: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: 'scale(1.0)',
    background: '#0b0b0d',
  },
  imageMediaPortrait: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: 'scale(1.04)',
    background: '#0b0b0d',
  },
  imageMediaLandscape: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: 'scale(1.01)',
    background: '#0b0b0d',
  },
  fallback: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    padding: 22,
  },
  fallbackEyebrow: {
    fontSize: 11,
    letterSpacing: '0.18em',
    opacity: 0.7,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  fallbackTitle: {
    fontSize: 30,
    fontWeight: 800,
    lineHeight: 1,
    marginBottom: 6,
  },
  fallbackCreator: {
    fontSize: 15,
    opacity: 0.72,
  },
  surfaceScrim: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.08) 35%, rgba(0,0,0,0.22) 100%)',
    pointerEvents: 'none',
  },
  surfaceEdgeVignette: {
    position: 'absolute',
    inset: 0,
    boxShadow: 'inset 0 0 72px rgba(0,0,0,0.24)',
    pointerEvents: 'none',
  },
  inactiveShade: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.2)',
    pointerEvents: 'none',
  },
  seamLinePortrait: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 1,
    zIndex: 6,
    pointerEvents: 'none',
  },
  seamLineLandscape: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 1,
    zIndex: 6,
    pointerEvents: 'none',
  },
  pausePortraitLayer: {
    position: 'absolute',
    top: 18,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 15,
    pointerEvents: 'none',
  },
  pauseLandscapeLayer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 15,
    pointerEvents: 'none',
  },
  pauseChip: {
    width: 34,
    height: 34,
    borderRadius: 999,
    background: 'rgba(8,10,14,0.24)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseBars: {
    display: 'flex',
    gap: 4,
  },
  pauseBar: {
    width: 3,
    height: 10,
    borderRadius: 999,
    background: 'rgba(255,255,255,0.76)',
  },
  vsCenterLayer: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 8,
  },
  vsDiamond: {
    width: 40,
    height: 40,
    transform: 'rotate(45deg)',
    borderRadius: 4,
    border: '1px solid',
    background: '#000000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 0 1px rgba(0,0,0,0.95), 0 0 18px rgba(0,0,0,0.28)',
  },
  vsDiamondInner: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transform: 'rotate(-45deg)',
  },
  vsText: {
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: '0.2em',
    marginLeft: 2,
    color: '#ffffff',
  },
  arenaHeroWrapPortrait: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 30,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    pointerEvents: 'none',
    width: 'min(88vw, 760px)',
    padding: '0 18px',
  },
  arenaHeroWrapLandscape: {
    position: 'absolute',
    top: 38,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 30,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    pointerEvents: 'none',
    width: 'min(88vw, 760px)',
    padding: '0 18px',
  },
  arenaHeroSmall: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.3em',
    opacity: 0.38,
    marginBottom: 10,
  },
  arenaHeroText: {
    fontSize: 'clamp(32px, 6vw, 56px)',
    fontWeight: 900,
    lineHeight: 0.96,
    letterSpacing: '-0.02em',
  },
  arenaWhisperPortrait: {
    position: 'absolute',
    top: 14,
    left: 0,
    right: 0,
    zIndex: 11,
    display: 'flex',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  arenaWhisperLandscapeTop: {
    position: 'absolute',
    top: 14,
    left: 0,
    right: 0,
    zIndex: 11,
    display: 'flex',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  arenaWhisperText: {
    fontSize: 11,
    opacity: 0.1,
    fontWeight: 700,
    letterSpacing: '0.08em',
    whiteSpace: 'nowrap',
    textTransform: 'uppercase',
  },
  championOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 25,
    background: 'rgba(4,6,10,0.36)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  championCard: {
    position: 'relative',
    width: 'min(420px, 92vw)',
    borderRadius: 28,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'linear-gradient(180deg, rgba(14,18,25,0.96), rgba(8,10,14,0.96))',
    overflow: 'hidden',
    padding: '28px 24px 24px',
    textAlign: 'center',
    boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
  },
  championGlow: {
    position: 'absolute',
    top: -90,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 220,
    height: 220,
    borderRadius: 999,
    background: 'radial-gradient(circle, rgba(255,255,255,0.16), transparent 62%)',
    pointerEvents: 'none',
  },
  championMicro: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.26em',
    opacity: 0.52,
    marginBottom: 14,
  },
  championTitle: {
    fontSize: 28,
    fontWeight: 800,
    lineHeight: 1.02,
    marginBottom: 8,
  },
  championCreator: {
    fontSize: 15,
    opacity: 0.72,
    marginBottom: 18,
  },
  championRule: {
    width: 72,
    height: 1,
    background: 'rgba(255,255,255,0.16)',
    margin: '0 auto 16px',
  },
  championSub: {
    fontSize: 14,
    lineHeight: 1.4,
    opacity: 0.7,
  },
  detailsOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 18,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    padding: 22,
    pointerEvents: 'none',
  },
  detailsCard: {
    width: 'min(520px, 92vw)',
    borderRadius: 24,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(8,10,14,0.74)',
    backdropFilter: 'blur(18px)',
    padding: 18,
    boxShadow: '0 18px 60px rgba(0,0,0,0.35)',
  },
  detailsTitle: {
    fontSize: 22,
    fontWeight: 800,
    lineHeight: 1.04,
    marginBottom: 6,
  },
  detailsCreator: {
    fontSize: 14,
    opacity: 0.72,
    marginBottom: 12,
  },
  detailsMetaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  detailsPill: {
    padding: '7px 10px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.06)',
    fontSize: 12,
    fontWeight: 700,
  },
  detailsSubText: {
    fontSize: 13,
    opacity: 0.58,
    marginBottom: 8,
  },
  detailsArena: {
    fontSize: 13,
    fontWeight: 700,
  },
  voteFlash: {
    position: 'absolute',
    inset: 0,
    zIndex: 12,
    pointerEvents: 'none',
  },
  leaderboardSwipeZone: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 84,
    zIndex: 9,
    background: 'transparent',
  },
  bottomGhostBar: {
    position: 'fixed',
    bottom: 18,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    justifyContent: 'center',
    zIndex: 999,
    pointerEvents: 'none',
  },
  invisibleUploadButton: {
    pointerEvents: 'auto',
    width: 36,
    height: 36,
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(8,10,14,0.42)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    color: 'rgba(255,255,255,0.82)',
    fontSize: 22,
    lineHeight: 1,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 24px rgba(0,0,0,0.28)',
  },
  sheet: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: -2,
    height: 470,
    zIndex: 16,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    background: 'rgba(8,10,14,0.86)',
    backdropFilter: 'blur(18px)',
    border: '1px solid rgba(255,255,255,0.06)',
    boxShadow: '0 -24px 60px rgba(0,0,0,0.36)',
    overflow: 'hidden',
  },
  sheetHandleTap: {
    paddingTop: 10,
    paddingBottom: 10,
    display: 'flex',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  sheetHandle: {
    width: 28,
    height: 3,
    borderRadius: 999,
    background: 'rgba(255,255,255,0.1)',
  },
  sheetHeader: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: '0 18px 14px',
  },
  sheetEyebrow: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.22em',
    opacity: 0.46,
    marginBottom: 6,
  },
  sheetTitle: {
    fontSize: 21,
    fontWeight: 800,
    lineHeight: 1.02,
  },
  sheetCount: {
    fontSize: 12,
    opacity: 0.55,
    fontWeight: 700,
  },
  sheetList: {
    padding: '0 10px 18px',
    overflowY: 'auto',
    height: 390,
  },
  sheetRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 10px',
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.04)',
    background: 'rgba(255,255,255,0.02)',
    marginBottom: 8,
  },
  sheetRank: {
    width: 40,
    fontSize: 13,
    fontWeight: 800,
    opacity: 0.82,
  },
  sheetTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  sheetItemTitle: {
    fontSize: 14,
    fontWeight: 800,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  sheetItemCreator: {
    fontSize: 12,
    opacity: 0.58,
    marginTop: 2,
  },
  sheetRight: {
    textAlign: 'right',
  },
  sheetRating: {
    fontSize: 14,
    fontWeight: 800,
  },
  sheetConfidence: {
    fontSize: 11,
    opacity: 0.58,
    marginTop: 2,
  },
  onboardingOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 40,
    background: 'rgba(4,6,10,0.52)',
    backdropFilter: 'blur(14px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  onboardingCard: {
    width: 'min(420px, 92vw)',
    borderRadius: 28,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'linear-gradient(180deg, rgba(13,17,24,0.98), rgba(8,10,14,0.98))',
    boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
    padding: 22,
  },
  onboardingStep: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.22em',
    opacity: 0.48,
    marginBottom: 12,
  },
  onboardingTitle: {
    fontSize: 27,
    fontWeight: 800,
    lineHeight: 1.02,
    marginBottom: 10,
  },
  onboardingBody: {
    fontSize: 15,
    lineHeight: 1.5,
    opacity: 0.78,
    marginBottom: 18,
  },
  onboardingDots: {
    display: 'flex',
    gap: 8,
    marginBottom: 18,
  },
  onboardingDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: 'white',
  },
  onboardingActions: {
    display: 'flex',
    gap: 10,
  },
  onboardingGhost: {
    flex: 1,
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.03)',
    color: 'white',
    padding: '12px 14px',
    fontWeight: 800,
    cursor: 'pointer',
  },
  onboardingPrimary: {
    flex: 1,
    borderRadius: 16,
    border: 'none',
    background: 'linear-gradient(180deg, #7c3aed, #5b21b6)',
    color: 'white',
    padding: '12px 14px',
    fontWeight: 800,
    cursor: 'pointer',
  },
  uploadOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 32,
    background: 'rgba(4,6,10,0.52)',
    backdropFilter: 'blur(16px)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    padding: 12,
  },
  uploadCard: {
    width: 'min(720px, 100%)',
    maxHeight: '88vh',
    overflowY: 'auto',
    borderRadius: 28,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'linear-gradient(180deg, rgba(13,17,24,0.98), rgba(8,10,14,0.98))',
    boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
    padding: 18,
  },
  uploadHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  uploadEyebrow: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.2em',
    opacity: 0.46,
    marginBottom: 5,
  },
  uploadTitle: {
    fontSize: 26,
    fontWeight: 800,
    lineHeight: 1,
  },
  uploadClose: {
    width: 34,
    height: 34,
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: 'white',
    cursor: 'pointer',
  },
  uploadGrid: {
    display: 'grid',
    gap: 12,
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    marginBottom: 14,
  },
  uploadField: {
    display: 'grid',
    gap: 6,
  },
  uploadLabel: {
    fontSize: 12,
    fontWeight: 700,
    opacity: 0.72,
  },
  uploadInput: {
    width: '100%',
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: 'white',
    padding: '12px 12px',
    outline: 'none',
  },
  captureButtons: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  uploadActionButton: {
    flex: 1,
    minWidth: 140,
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: 'white',
    padding: '12px 14px',
    fontWeight: 800,
    cursor: 'pointer',
  },
  previewBox: {
    borderRadius: 20,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.03)',
    padding: 12,
    marginBottom: 14,
  },
  previewEmpty: {
    minHeight: 150,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 1.5,
    opacity: 0.62,
    padding: 20,
  },
  previewMedia: {
    width: '100%',
    maxHeight: 320,
    objectFit: 'cover',
    borderRadius: 16,
    background: '#08090c',
  },
  trimStats: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 10,
    marginBottom: 12,
  },
  trimStatPill: {
    borderRadius: 999,
    padding: '7px 10px',
    fontSize: 12,
    fontWeight: 700,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  sliderGroup: {
    display: 'grid',
    gap: 6,
    marginBottom: 10,
  },
  sliderLabel: {
    fontSize: 12,
    fontWeight: 700,
    opacity: 0.72,
  },
  slider: {
    width: '100%',
  },
  uploadActions: {
    display: 'flex',
    gap: 10,
  },
  uploadSecondary: {
    flex: 1,
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: 'white',
    padding: '12px 14px',
    fontWeight: 800,
    cursor: 'pointer',
  },
  uploadPrimary: {
    flex: 1,
    borderRadius: 16,
    border: 'none',
    background: 'linear-gradient(180deg, #7c3aed, #5b21b6)',
    color: 'white',
    padding: '12px 14px',
    fontWeight: 800,
  },
  emptyArena: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: 24,
    background: '#050608',
  },
  emptyArenaTitle: {
    fontSize: 26,
    fontWeight: 800,
    marginBottom: 8,
  },
  emptyArenaBody: {
    fontSize: 15,
    lineHeight: 1.5,
    opacity: 0.68,
    maxWidth: 360,
    marginBottom: 18,
  },
  emptyArenaButton: {
    borderRadius: 16,
    border: 'none',
    background: 'linear-gradient(180deg, #7c3aed, #5b21b6)',
    color: 'white',
    padding: '12px 16px',
    fontWeight: 800,
    cursor: 'pointer',
  },
};
