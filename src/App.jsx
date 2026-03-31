import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const allVideos = [
  {
    id: 1,
    title: 'Skate Trick',
    creator: '@skater',
    rank: 1,
    rating: 3214,
    confidence: 0.92,
    src: 'https://www.w3schools.com/html/mov_bbb.mp4',
  },
  {
    id: 2,
    title: 'Ocean Waves',
    creator: '@nature',
    rank: 502,
    rating: 1102,
    confidence: 0.42,
    src: 'https://www.w3schools.com/html/movie.mp4',
  },
  {
    id: 3,
    title: 'Mountain Ride',
    creator: '@outdoor',
    rank: 18,
    rating: 2987,
    confidence: 0.85,
    src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 4,
    title: 'City Motion',
    creator: '@urbaneye',
    rank: 77,
    rating: 2548,
    confidence: 0.66,
    src: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
  },
  {
    id: 5,
    title: 'Fast Water',
    creator: '@rivercut',
    rank: 132,
    rating: 2260,
    confidence: 0.58,
    src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm',
  },
  {
    id: 6,
    title: 'Golden Light',
    creator: '@sunframe',
    rank: 241,
    rating: 1984,
    confidence: 0.49,
    src: 'https://media.w3.org/2010/05/bunny/trailer.mp4',
  },
];

function pickRandomVideo(excludeIds = []) {
  const pool = allVideos.filter((video) => !excludeIds.includes(video.id));
  return pool[Math.floor(Math.random() * pool.length)];
}

function pickTwoUniqueVideos(excludeIds = []) {
  const first = pickRandomVideo(excludeIds);
  const second = pickRandomVideo([...excludeIds, first.id]);
  return [first, second];
}

function usePortraitMode() {
  const getMode = () =>
    typeof window !== 'undefined' ? window.innerHeight >= window.innerWidth : true;

  const [isPortrait, setIsPortrait] = useState(getMode());

  useEffect(() => {
    const onResize = () => setIsPortrait(getMode());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return isPortrait;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function expectedScore(ratingA, ratingB) {
  return 1 / (1 + 10 ** ((ratingB - ratingA) / 400));
}

function getVoteTrust(msSinceUnlock) {
  if (msSinceUnlock < 400) return 0.2;
  if (msSinceUnlock < 900) return 0.45;
  if (msSinceUnlock < 1600) return 0.7;
  return 1.0;
}

function computeConfidenceAdjustedDelta(winner, loser, finalVoteWeight) {
  const baseK = 32;
  const expectedWinner = expectedScore(winner.rating, loser.rating);

  const winnerVolatility = 1.15 + (1 - winner.confidence) * 0.85;
  const loserVolatility = 1.15 + (1 - loser.confidence) * 0.85;

  const winnerDelta = Math.max(
    2,
    Math.round(baseK * (1 - expectedWinner) * finalVoteWeight * winnerVolatility)
  );

  const loserDelta = Math.max(
    2,
    Math.round(baseK * (1 - expectedWinner) * finalVoteWeight * loserVolatility)
  );

  return { winnerDelta, loserDelta };
}

function updateConfidence(current, strongVote) {
  const bump = strongVote ? 0.045 : 0.025;
  return clamp(current + bump, 0.35, 0.98);
}

function confidenceLabel(confidence) {
  if (confidence >= 0.85) return 'Royalty';
  if (confidence >= 0.7) return 'Elite';
  if (confidence >= 0.55) return 'Rising';
  return 'Wildcard';
}

const styles = {
  app: {
    minHeight: '100vh',
    background:
      'radial-gradient(circle at top, rgba(124,58,237,.22), transparent 22%), radial-gradient(circle at bottom, rgba(236,72,153,.12), transparent 26%), #0b1020',
    color: 'white',
    fontFamily: 'Arial, sans-serif',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    boxSizing: 'border-box',
  },
  phone: {
    width: '100%',
    maxWidth: 430,
    height: 'min(92vh, 880px)',
    background: 'linear-gradient(180deg, #040816 0%, #020617 100%)',
    borderRadius: 34,
    padding: 12,
    boxSizing: 'border-box',
    boxShadow: '0 28px 80px rgba(0,0,0,.5)',
    border: '1px solid rgba(255,255,255,.08)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 900,
    margin: 0,
    letterSpacing: '-0.03em',
  },
  sub: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  status: {
    fontSize: 11,
    padding: '7px 11px',
    borderRadius: 999,
    background: 'rgba(124,58,237,.16)',
    border: '1px solid rgba(124,58,237,.42)',
    whiteSpace: 'nowrap',
    fontWeight: 700,
  },
  progressTrack: {
    height: 5,
    background: 'rgba(255,255,255,.08)',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #8b5cf6, #ec4899)',
    borderRadius: 999,
    transition: 'width 280ms ease',
  },
  arena: {
    position: 'relative',
    height: 'calc(100% - 132px)',
    borderRadius: 26,
    overflow: 'hidden',
    background: '#000',
  },
  splitPortrait: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gridTemplateRows: '1fr 1fr',
    gap: 0,
    height: '100%',
  },
  splitLandscape: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridTemplateRows: '1fr',
    gap: 0,
    height: '100%',
  },
  halfWrap: {
    position: 'relative',
    minHeight: 0,
    minWidth: 0,
    overflow: 'hidden',
  },
  card: {
    position: 'relative',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
    cursor: 'pointer',
    background: '#000',
    border: '1px solid rgba(167,139,250,.42)',
    boxSizing: 'border-box',
  },
  active: {
    opacity: 1,
    boxShadow: 'inset 0 0 0 1px rgba(167,139,250,.22), 0 0 22px rgba(124,58,237,.18)',
  },
  dimmed: {
    opacity: 0.48,
  },
  ready: {
    opacity: 1,
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.18), 0 0 30px rgba(124,58,237,.24)',
  },
  winnerGlow: {
    boxShadow: 'inset 0 0 0 1px rgba(250,204,21,.72), 0 0 28px rgba(250,204,21,.24)',
  },
  video: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    background: '#000',
  },
  scrim: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(to top, rgba(0,0,0,.66), rgba(0,0,0,.1) 38%, rgba(0,0,0,.16))',
    zIndex: 1,
  },
  overlayTop: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 2,
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  rank: {
    background: 'rgba(0,0,0,.62)',
    padding: '6px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    border: '1px solid rgba(255,255,255,.08)',
  },
  badge: {
    background: 'rgba(124,58,237,.88)',
    padding: '6px 10px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
  },
  crownBadge: {
    background: 'rgba(250,204,21,.94)',
    color: '#111',
    padding: '6px 10px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 900,
  },
  tapHint: {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    bottom: 92,
    zIndex: 2,
    background: 'rgba(255,255,255,.14)',
    padding: '8px 12px',
    borderRadius: 999,
    fontSize: 11,
    whiteSpace: 'nowrap',
    fontWeight: 800,
    letterSpacing: '0.02em',
    border: '1px solid rgba(255,255,255,.08)',
  },
  overlayBottom: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    zIndex: 2,
    background: 'rgba(7,10,20,.52)',
    backdropFilter: 'blur(8px)',
    borderRadius: 18,
    padding: 12,
    border: '1px solid rgba(255,255,255,.08)',
  },
  videoTitle: {
    fontWeight: 900,
    fontSize: 16,
    marginBottom: 4,
    letterSpacing: '-0.01em',
  },
  creator: {
    fontSize: 12,
    opacity: 0.84,
  },
  subMeta: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 6,
  },
  subPill: {
    fontSize: 11,
    opacity: 0.78,
    background: 'rgba(255,255,255,.06)',
    padding: '5px 8px',
    borderRadius: 999,
  },
  vs: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: 72,
    height: 72,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(180deg, #0b1020 0%, #000 100%)',
    border: '2px solid rgba(139,92,246,.78)',
    fontWeight: 900,
    fontSize: 18,
    zIndex: 6,
    boxShadow: '0 0 24px rgba(124,58,237,.42)',
    letterSpacing: '0.08em',
  },
  championOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,.45)',
    backdropFilter: 'blur(5px)',
    pointerEvents: 'none',
  },
  championCard: {
    background: 'rgba(12,18,34,.96)',
    border: '2px solid rgba(250,204,21,.82)',
    borderRadius: 26,
    padding: '22px 26px',
    textAlign: 'center',
    boxShadow: '0 0 36px rgba(250,204,21,.24)',
  },
  footerCard: {
    marginTop: 10,
    background: 'rgba(255,255,255,.04)',
    border: '1px solid rgba(255,255,255,.08)',
    borderRadius: 18,
    padding: 12,
  },
  footerText: {
    fontSize: 12,
    opacity: 0.78,
    lineHeight: 1.45,
  },
  liveTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.04em',
    color: '#c4b5fd',
    textTransform: 'uppercase',
  },
};

function VideoCard({
  video,
  active,
  canPick,
  onClick,
  isWinner,
  streak,
  showCrown,
}) {
  const videoRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (active) {
      const playPromise = el.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {});
      }
    } else {
      el.pause();
    }
  }, [active, video.src]);

  return (
    <motion.div
      onClick={canPick ? onClick : undefined}
      style={{
        ...styles.card,
        ...(canPick ? styles.ready : active ? styles.active : styles.dimmed),
        ...(isWinner ? styles.winnerGlow : {}),
        cursor: canPick ? 'pointer' : 'default',
      }}
      whileTap={canPick ? { scale: 0.986 } : {}}
    >
      <video
        ref={videoRef}
        src={video.src}
        muted
        loop
        playsInline
        preload="auto"
        style={styles.video}
      />

      <div style={styles.scrim} />

      <div style={styles.overlayTop}>
        <div style={styles.rank}>#{video.rank}</div>
        {video.rank === 1 && <div style={styles.badge}>TOP</div>}
        {streak > 0 && isWinner && <div style={styles.badge}>{streak}X WIN</div>}
        {showCrown && <div style={styles.crownBadge}>👑 CROWNED</div>}
      </div>

      {canPick && <div style={styles.tapHint}>Tap once to keep this one</div>}

      <div style={styles.overlayBottom}>
        <div style={styles.videoTitle}>{video.title}</div>
        <div style={styles.creator}>{video.creator}</div>
        <div style={styles.subMeta}>
          <div style={styles.subPill}>Rating {video.rating}</div>
          <div style={styles.subPill}>{confidenceLabel(video.confidence)}</div>
        </div>
      </div>
    </motion.div>
  );
}

function Battle() {
  const isPortrait = usePortraitMode();

  const [pair, setPair] = useState(() => {
    const [first, second] = pickTwoUniqueVideos();
    return { first, second };
  });

  const [phase, setPhase] = useState('first');
  const [throwSide, setThrowSide] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [winnerId, setWinnerId] = useState(null);
  const [streak, setStreak] = useState(0);
  const [showChampion, setShowChampion] = useState(false);
  const [decisionUnlockedAt, setDecisionUnlockedAt] = useState(null);
  const [userTrust, setUserTrust] = useState(1.0);
  const [rushedVotes, setRushedVotes] = useState(0);
  const [totalVotes, setTotalVotes] = useState(0);
  const [lastEventText, setLastEventText] = useState('Fresh battle loading.');

  useEffect(() => {
    if (throwSide || isLocked || showChampion) return;

    let timer;

    if (phase === 'first') {
      timer = setTimeout(() => setPhase('second'), 2800);
    } else if (phase === 'second') {
      timer = setTimeout(() => {
        setPhase('decision');
        setDecisionUnlockedAt(Date.now());
        setLastEventText('Both clips are ready. Pick the winner.');
      }, 1200);
    }

    return () => clearTimeout(timer);
  }, [phase, throwSide, isLocked, showChampion]);

  const canPick = phase === 'decision' && !isLocked && !showChampion;

  const firstActive = phase === 'first';
  const secondActive = phase === 'second';

  let phaseLabel = isPortrait ? 'Top clip playing' : 'Left clip playing';
  if (phase === 'second') phaseLabel = isPortrait ? 'Bottom clip playing' : 'Right clip playing';
  if (phase === 'decision') phaseLabel = 'Choose the winner';

  const progress =
    phase === 'first' ? 35 :
    phase === 'second' ? 72 :
    100;

  const pick = (side) => {
    if (!canPick) return;

    setIsLocked(true);

    const now = Date.now();
    const msSinceUnlock = decisionUnlockedAt ? now - decisionUnlockedAt : 0;

    const voteTrust = getVoteTrust(msSinceUnlock);

    let rushed = false;
    if (msSinceUnlock < 900) rushed = true;

    const nextTotalVotes = totalVotes + 1;
    const nextRushedVotes = rushed ? rushedVotes + 1 : rushedVotes;
    const rushedRate = nextRushedVotes / nextTotalVotes;

    let nextUserTrust = userTrust;
    if (rushed) {
      nextUserTrust = clamp(userTrust - 0.08, 0.35, 1.0);
    } else {
      nextUserTrust = clamp(userTrust + 0.02, 0.35, 1.0);
    }
    if (rushedRate > 0.5) {
      nextUserTrust = clamp(nextUserTrust - 0.05, 0.35, 1.0);
    }

    setUserTrust(nextUserTrust);
    setTotalVotes(nextTotalVotes);
    setRushedVotes(nextRushedVotes);

    const finalVoteWeight = voteTrust * nextUserTrust;

    const winner = side === 'first' ? pair.first : pair.second;
    const loser = side === 'first' ? pair.second : pair.first;
    const loserSide = side === 'first' ? 'second' : 'first';

    const { winnerDelta, loserDelta } = computeConfidenceAdjustedDelta(
      winner,
      loser,
      finalVoteWeight
    );

    const updatedWinner = {
      ...winner,
      rating: winner.rating + winnerDelta,
      rank: Math.max(1, winner.rank - Math.max(1, Math.round(winnerDelta / 2))),
      confidence: updateConfidence(winner.confidence, finalVoteWeight > 0.7),
    };

    const updatedLoser = {
      ...loser,
      rating: Math.max(1000, loser.rating - loserDelta),
      rank: loser.rank + Math.max(1, Math.round(loserDelta / 2)),
      confidence: updateConfidence(loser.confidence, finalVoteWeight > 0.7),
    };

    const nextStreak = winnerId === winner.id ? streak + 1 : 1;

    setWinnerId(winner.id);
    setStreak(nextStreak);
    setThrowSide(loserSide);

    if (finalVoteWeight < 0.4) {
      setLastEventText(`${winner.title} won, but the vote counted lightly.`);
    } else if (finalVoteWeight < 0.75) {
      setLastEventText(`${winner.title} won. Moderate ranking impact applied.`);
    } else {
      setLastEventText(`${winner.title} won with a strong confidence-weighted vote.`);
    }

    setTimeout(() => {
      if (nextStreak >= 3) {
        setThrowSide(null);
        setShowChampion(true);
        setLastEventText(`${updatedWinner.title} earned the crown and the arena resets.`);

        setTimeout(() => {
          const [freshA, freshB] = pickTwoUniqueVideos([winner.id, loser.id]);
          setPair({ first: freshA, second: freshB });
          setWinnerId(null);
          setStreak(0);
          setShowChampion(false);
          setPhase('first');
          setDecisionUnlockedAt(null);
          setIsLocked(false);
          setLastEventText('Fresh battle loading.');
        }, 1600);
        return;
      }

      const challenger = pickRandomVideo([updatedWinner.id, updatedLoser.id]);

      if (side === 'first') {
        setPair({ first: updatedWinner, second: challenger });
      } else {
        setPair({ first: challenger, second: updatedWinner });
      }

      setThrowSide(null);
      setPhase('first');
      setDecisionUnlockedAt(null);

      setTimeout(() => {
        setIsLocked(false);
      }, 250);
    }, 550);
  };

  const firstMotion =
    throwSide === 'first'
      ? isPortrait
        ? { y: -220, opacity: 0, rotate: -6 }
        : { x: -220, opacity: 0, rotate: -6 }
      : { x: 0, y: 0, opacity: 1, rotate: 0 };

  const secondMotion =
    throwSide === 'second'
      ? isPortrait
        ? { y: 220, opacity: 0, rotate: 6 }
        : { x: 220, opacity: 0, rotate: 6 }
      : { x: 0, y: 0, opacity: 1, rotate: 0 };

  const winnerFirst = winnerId === pair.first.id;
  const winnerSecond = winnerId === pair.second.id;

  return (
    <div style={styles.phone}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Throwned</h1>
          <div style={styles.sub}>Battle. Rank. Throw away.</div>
        </div>
        <div style={styles.status}>{phaseLabel}</div>
      </div>

      <div style={styles.progressTrack}>
        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
      </div>

      <div style={styles.arena}>
        <div style={isPortrait ? styles.splitPortrait : styles.splitLandscape}>
          <motion.div
            style={styles.halfWrap}
            animate={firstMotion}
            transition={{ duration: 0.45 }}
          >
            <VideoCard
              video={pair.first}
              active={firstActive}
              canPick={canPick}
              onClick={() => pick('first')}
              isWinner={winnerFirst}
              streak={winnerFirst ? streak : 0}
              showCrown={showChampion && winnerFirst}
            />
          </motion.div>

          <motion.div
            style={styles.halfWrap}
            animate={secondMotion}
            transition={{ duration: 0.45 }}
          >
            <VideoCard
              video={pair.second}
              active={secondActive}
              canPick={canPick}
              onClick={() => pick('second')}
              isWinner={winnerSecond}
              streak={winnerSecond ? streak : 0}
              showCrown={showChampion && winnerSecond}
            />
          </motion.div>
        </div>

        <div style={styles.vs}>VS</div>

        <AnimatePresence>
          {showChampion && (
            <motion.div
              style={styles.championOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                style={styles.championCard}
                initial={{ scale: 0.85, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 8 }}
              >
                <div style={{ fontSize: 50, marginBottom: 8 }}>👑</div>
                <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>
                  3X DEFENDING WINNER
                </div>
                <div style={{ opacity: 0.82 }}>
                  Royalty crowned. Fresh matchup loading…
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={styles.footerCard}>
        <div style={styles.liveTag}>Live Arena</div>
        <div style={styles.footerText}>{lastEventText}</div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div style={styles.app}>
      <Battle />
    </div>
  );
}