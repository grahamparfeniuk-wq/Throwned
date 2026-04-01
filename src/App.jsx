import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = ['Epic Fails', 'Sports', 'Original Songs'];
const MAX_TRIM_SECONDS = 7;
const SWIPE_THRESHOLD = 90;

const DEMO_CLIPS = {
  'Epic Fails': [
    { title: 'Slip Jacket', creator: '@fail_1', src: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { title: 'Cat Bed Fail', creator: '@fail_2', src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' },
    { title: 'Race Crash', creator: '@fail_3', src: 'https://media.w3.org/2010/05/sintel/trailer.mp4' },
    { title: 'Highway Miss', creator: '@fail_4', src: 'https://www.w3schools.com/html/movie.mp4' },
    { title: 'Intersection Wreck', creator: '@fail_5', src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm' },
  ],
  Sports: [
    { title: 'Track Burst', creator: '@sport_1', src: 'https://media.w3.org/2010/05/sintel/trailer.mp4' },
    { title: 'Court Handle', creator: '@sport_2', src: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { title: 'Rope Rhythm', creator: '@sport_3', src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm' },
    { title: 'Boxing Pace', creator: '@sport_4', src: 'https://www.w3schools.com/html/movie.mp4' },
    { title: 'Kettlebell Drive', creator: '@sport_5', src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' },
  ],
  'Original Songs': [
    { title: 'Neon Vocal', creator: '@song_1', src: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { title: 'Mic Room Hook', creator: '@song_2', src: 'https://www.w3schools.com/html/movie.mp4' },
    { title: 'Jazz Night Verse', creator: '@song_3', src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' },
    { title: 'Studio Chorus', creator: '@song_4', src: 'https://media.w3.org/2010/05/sintel/trailer.mp4' },
    { title: 'Street Guitar Song', creator: '@song_5', src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm' },
  ],
};

function buildCategoryVideos(category, startId) {
  return DEMO_CLIPS[category].map((item, index) => ({
    id: startId + index,
    title: item.title,
    creator: item.creator,
    category,
    rank: index + 1,
    rating: 3200 - index * 35,
    confidence: Math.max(0.55, +(0.92 - index * 0.03).toFixed(2)),
    src: item.src,
    trimStart: 0,
    trimEnd: 7,
    uploaded: false,
  }));
}

const initialSeed = [
  ...buildCategoryVideos('Epic Fails', 1),
  ...buildCategoryVideos('Sports', 101),
  ...buildCategoryVideos('Original Songs', 201),
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function expectedScore(a, b) {
  return 1 / (1 + 10 ** ((b - a) / 400));
}

function getVoteTrust(msSinceUnlock) {
  if (msSinceUnlock < 400) return 0.2;
  if (msSinceUnlock < 900) return 0.45;
  if (msSinceUnlock < 1600) return 0.7;
  return 1.0;
}

function updateConfidence(current, strongVote) {
  return clamp(current + (strongVote ? 0.045 : 0.025), 0.35, 0.98);
}

function computeConfidenceAdjustedDelta(winner, loser, finalVoteWeight) {
  const baseK = 32;
  const expectedWinner = expectedScore(winner.rating, loser.rating);
  const winnerVolatility = 1.15 + (1 - winner.confidence) * 0.85;
  const loserVolatility = 1.15 + (1 - loser.confidence) * 0.85;

  return {
    winnerDelta: Math.max(
      2,
      Math.round(baseK * (1 - expectedWinner) * finalVoteWeight * winnerVolatility)
    ),
    loserDelta: Math.max(
      2,
      Math.round(baseK * (1 - expectedWinner) * finalVoteWeight * loserVolatility)
    ),
  };
}

function confidenceLabel(confidence) {
  if (confidence >= 0.85) return 'Royalty';
  if (confidence >= 0.7) return 'Elite';
  if (confidence >= 0.55) return 'Rising';
  return 'Wildcard';
}

function categoryAccent(category) {
  switch (category) {
    case 'Epic Fails':
      return '#ef4444';
    case 'Sports':
      return '#06b6d4';
    case 'Original Songs':
      return '#f59e0b';
    default:
      return '#8b5cf6';
  }
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

function magnitude(x, y) {
  return Math.sqrt(x * x + y * y);
}

function normalizeVector(x, y, length = 260) {
  const mag = magnitude(x, y);
  if (!mag || mag < 1) return { x: length, y: 0 };
  return {
    x: (x / mag) * length,
    y: (y / mag) * length,
  };
}

function ArenaLabel({ category, accent, visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          style={styles.arenaLabelWrap}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28 }}
        >
          <div style={styles.arenaLabel}>
            <div style={styles.arenaLabelSmall}>Arena</div>
            <div style={{ ...styles.arenaLabelText, color: accent }}>{category}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DiamondVS({ accent, canPulse }) {
  return (
    <div style={styles.vsCenterLayer}>
      <motion.div
        animate={
          canPulse
            ? {
                scale: [1, 1.035, 1],
                filter: [
                  'drop-shadow(0 0 8px rgba(255,255,255,0.05))',
                  `drop-shadow(0 0 14px ${accent})`,
                  'drop-shadow(0 0 8px rgba(255,255,255,0.05))',
                ],
              }
            : { scale: 1 }
        }
        transition={canPulse ? { repeat: Infinity, duration: 1.3 } : { duration: 0.2 }}
        style={styles.vsMotionWrap}
      >
        <div style={{ ...styles.vsDiamond, borderColor: `${accent}cc` }}>
          <div style={styles.vsDiamondInner}>
            <span style={styles.vsText}>VS</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function OnboardingOverlay({ onClose }) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: 'Watch both clips',
      body: 'Only one clip plays at a time, so each contender gets a clean shot.',
      helper: 'Listen. Compare. Decide.',
    },
    {
      title: 'Hold for details',
      body: 'Press and hold any clip to reveal creator and clip info.',
      helper: 'No clutter unless you ask for it.',
    },
    {
      title: 'Throw away the loser',
      body: 'Swipe the losing clip away. It leaves in that direction. The challenger enters from there too.',
      helper: 'That swipe is the product.',
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
        initial={{ opacity: 0, y: 16, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.985 }}
        transition={{ duration: 0.24 }}
      >
        <div style={styles.onboardingStep}>0{step + 1}</div>
        <div style={styles.onboardingTitle}>{current.title}</div>
        <div style={styles.onboardingBody}>{current.body}</div>
        <div style={styles.onboardingHelper}>{current.helper}</div>

        <div style={styles.onboardingDots}>
          {steps.map((_, index) => (
            <div
              key={index}
              style={{
                ...styles.onboardingDot,
                opacity: step === index ? 1 : 0.24,
                transform: step === index ? 'scale(1.05)' : 'scale(1)',
              }}
            />
          ))}
        </div>

        <div style={styles.onboardingActions}>
          <button style={styles.onboardingGhostButton} onClick={onClose}>
            Skip
          </button>
          <button style={styles.onboardingPrimaryButton} onClick={next}>
            {step === steps.length - 1 ? 'Enter Arena' : 'Next'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function VideoDetailsOverlay({ video, accent }) {
  return (
    <motion.div
      style={styles.detailsOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        style={{ ...styles.detailsCard, borderColor: `${accent}66` }}
        initial={{ scale: 0.96, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.97, y: 8 }}
      >
        <div style={styles.detailsTitle}>{video.title}</div>
        <div style={styles.detailsCreator}>{video.creator}</div>

        <div style={styles.detailsMetaRow}>
          <div style={styles.detailsPill}>Rating {video.rating}</div>
          <div style={styles.detailsPill}>{confidenceLabel(video.confidence)}</div>
          <div style={styles.detailsPill}>
            {formatSeconds(video.trimStart || 0)} – {formatSeconds(video.trimEnd || 0)}
          </div>
        </div>

        <div style={styles.detailsCategory}>{video.category}</div>
      </motion.div>
    </motion.div>
  );
}

function UploadSheet({ isOpen, onClose, onSave }) {
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [title, setTitle] = useState('');
  const [creator, setCreator] = useState('@me');
  const [file, setFile] = useState(null);
  const [objectUrl, setObjectUrl] = useState('');
  const [duration, setDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(MAX_TRIM_SECONDS);

  const previewRef = useRef(null);
  const uploadInputRef = useRef(null);
  const captureInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedCategory(CATEGORIES[0]);
      setTitle('');
      setCreator('@me');
      setFile(null);
      setObjectUrl('');
      setDuration(0);
      setTrimStart(0);
      setTrimEnd(MAX_TRIM_SECONDS);
    }
  }, [isOpen]);

  function loadSelectedFile(selected) {
    if (!selected) return;
    const nextUrl = URL.createObjectURL(selected);

    setFile(selected);
    setObjectUrl(nextUrl);
    setTitle(selected.name.replace(/\.[^/.]+$/, ''));
  }

  function handleFileChange(e) {
    loadSelectedFile(e.target.files?.[0]);
  }

  function handleLoadedMetadata() {
    const video = previewRef.current;
    if (!video) return;

    const d = video.duration || 0;
    const safeEnd = Math.min(d, MAX_TRIM_SECONDS);
    setDuration(d);
    setTrimStart(0);
    setTrimEnd(safeEnd);
  }

  function handleStartChange(value) {
    const nextStart = clamp(Number(value), 0, Math.max(0, duration - 0.1));
    let nextEnd = trimEnd;

    if (nextEnd - nextStart > MAX_TRIM_SECONDS) {
      nextEnd = nextStart + MAX_TRIM_SECONDS;
    }
    if (nextEnd <= nextStart) {
      nextEnd = Math.min(duration, nextStart + 0.1);
    }

    setTrimStart(nextStart);
    setTrimEnd(nextEnd);
  }

  function handleEndChange(value) {
    let nextEnd = clamp(Number(value), 0.1, duration || MAX_TRIM_SECONDS);

    if (nextEnd <= trimStart) {
      nextEnd = trimStart + 0.1;
    }
    if (nextEnd - trimStart > MAX_TRIM_SECONDS) {
      nextEnd = trimStart + MAX_TRIM_SECONDS;
    }

    setTrimEnd(Math.min(duration || nextEnd, nextEnd));
  }

  useEffect(() => {
    const video = previewRef.current;
    if (!video || !objectUrl) return;

    const onTimeUpdate = () => {
      if (video.currentTime >= trimEnd) {
        video.currentTime = trimStart;
        video.play().catch(() => {});
      }
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    return () => video.removeEventListener('timeupdate', onTimeUpdate);
  }, [objectUrl, trimStart, trimEnd]);

  useEffect(() => {
    const video = previewRef.current;
    if (!video || !objectUrl) return;
    video.currentTime = trimStart;
    video.muted = false;
  }, [trimStart, trimEnd, objectUrl]);

  function handleSave() {
    if (!objectUrl || !file) return;

    const savedUrl = objectUrl;

    setObjectUrl('');
    setFile(null);

    onSave({
      title: title.trim() || file.name.replace(/\.[^/.]+$/, ''),
      creator: creator.trim() || '@me',
      category: selectedCategory,
      src: savedUrl,
      trimStart,
      trimEnd,
      uploaded: true,
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
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
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

            <div style={styles.captureButtons}>
              <button
                style={styles.uploadActionButton}
                onClick={() => uploadInputRef.current?.click()}
              >
                From library
              </button>
              <button
                style={styles.uploadActionButton}
                onClick={() => captureInputRef.current?.click()}
              >
                Record now
              </button>

              <input
                ref={uploadInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              <input
                ref={captureInputRef}
                type="file"
                accept="video/*"
                capture="environment"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>

            <div style={styles.uploadGrid}>
              <label style={styles.uploadField}>
                <span style={styles.uploadLabel}>Category</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={styles.uploadInput}
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label style={styles.uploadField}>
                <span style={styles.uploadLabel}>Title</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Clip title"
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

            <div style={styles.trimBox}>
              {!objectUrl ? (
                <div style={styles.trimEmpty}>
                  Choose a video or record one, then trim the exact moment that deserves to compete.
                </div>
              ) : (
                <>
                  <div style={styles.trimPreviewWrap}>
                    <video
                      ref={previewRef}
                      src={objectUrl}
                      controls
                      playsInline
                      onLoadedMetadata={handleLoadedMetadata}
                      style={styles.trimPreview}
                    />
                  </div>

                  <div style={styles.trimStats}>
                    <div style={styles.trimStatPill}>
                      Full length: {duration ? formatSeconds(duration) : '...'}
                    </div>
                    <div style={styles.trimStatPill}>
                      Selected: {formatSeconds(Math.max(0, trimEnd - trimStart))}
                    </div>
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
                      onChange={(e) => handleStartChange(e.target.value)}
                      style={styles.slider}
                    />
                  </div>

                  <div style={styles.sliderGroup}>
                    <label style={styles.sliderLabel}>End: {formatSeconds(trimEnd)}</label>
                    <input
                      type="range"
                      min={0.1}
                      max={duration || MAX_TRIM_SECONDS}
                      step={0.1}
                      value={trimEnd}
                      onChange={(e) => handleEndChange(e.target.value)}
                      style={styles.slider}
                    />
                  </div>
                </>
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

function VideoSurface({
  video,
  onPressStart,
  onPressEnd,
  accent,
  showCrown,
  isWinner,
  isActivePlayback,
}) {
  const videoRef = useRef(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    setLoadFailed(false);
  }, [video.src]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const startTime = video.trimStart || 0;
    const endTime = video.trimEnd || MAX_TRIM_SECONDS;

    const handleTimeUpdate = () => {
      if (el.currentTime >= endTime) {
        el.pause();
      }
    };

    el.addEventListener('timeupdate', handleTimeUpdate);

    if (isActivePlayback) {
      el.currentTime = startTime;
      el.muted = false;
      const promise = el.play();
      if (promise?.catch) promise.catch(() => {});
    } else {
      el.pause();
      el.muted = true;
    }

    return () => {
      el.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [isActivePlayback, video.src, video.trimStart, video.trimEnd]);

  const accentBg = `${accent}22`;

  return (
    <motion.div
      style={{
        ...styles.card,
        boxShadow: isWinner ? `0 0 42px ${accent}22 inset` : 'none',
      }}
      whileTap={{ scale: 0.996 }}
      onMouseDown={onPressStart}
      onMouseUp={onPressEnd}
      onMouseLeave={onPressEnd}
      onTouchStart={onPressStart}
      onTouchEnd={onPressEnd}
      onTouchCancel={onPressEnd}
    >
      {!loadFailed ? (
        <video
          ref={videoRef}
          src={video.src}
          playsInline
          preload="auto"
          style={styles.video}
          onError={() => setLoadFailed(true)}
        />
      ) : (
        <div style={{ ...styles.videoFallback, background: accentBg }}>
          <div style={styles.videoFallbackInner}>
            <div style={styles.videoFallbackEyebrow}>{video.category}</div>
            <div style={styles.videoFallbackTitle}>{video.title}</div>
            <div style={styles.videoFallbackCreator}>{video.creator}</div>
          </div>
        </div>
      )}

      <div style={styles.scrim} />
      <div style={styles.edgeVignette} />
      {!isActivePlayback && <div style={styles.inactivePlaybackShade} />}

      {isWinner && (
        <motion.div
          style={styles.winnerFlash}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}

      <div style={styles.overlayTopMinimal}>
        {showCrown && <div style={styles.badgeCrown}>👑</div>}
      </div>
    </motion.div>
  );
}

function LeaderboardSheet({ videos, category, isOpen, setIsOpen }) {
  const accent = categoryAccent(category);

  const ranked = useMemo(
    () =>
      videos
        .filter((v) => v.category === category)
        .slice()
        .sort((a, b) => a.rank - b.rank),
    [videos, category]
  );

  return (
    <motion.div
      drag="y"
      dragConstraints={{ top: 0, bottom: 420 }}
      dragElastic={0.1}
      onDragEnd={(_, info) => {
        if (info.offset.y > 70) setIsOpen(false);
        if (info.offset.y < -70) setIsOpen(true);
      }}
      animate={{ y: isOpen ? 0 : 336 }}
      transition={{ type: 'spring', stiffness: 320, damping: 34 }}
      style={styles.sheet}
    >
      <div style={styles.sheetHandleTap} onClick={() => setIsOpen((v) => !v)}>
        <div style={styles.sheetHandle} />
      </div>

      <div style={styles.sheetHeader}>
        <div>
          <div style={styles.sheetLabel}>Leaderboard</div>
          <div style={{ ...styles.sheetTitle, color: accent }}>{category}</div>
        </div>
        <div style={styles.sheetSub}>{ranked.length} contenders</div>
      </div>

      <div style={styles.sheetList}>
        {ranked.map((video) => (
          <div key={video.id} style={styles.sheetRow}>
            <div style={styles.sheetRank}>#{video.rank}</div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={styles.sheetVideoTitle}>{video.title}</div>
              <div style={styles.sheetCreator}>{video.creator}</div>
            </div>

            <div style={styles.sheetRight}>
              <div style={styles.sheetRating}>{video.rating}</div>
              <div style={styles.sheetConfidence}>{confidenceLabel(video.confidence)}</div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function BattleArena({ videos, setVideos, category, onSwipeCategory, onOpenUpload }) {
  const isPortrait = useIsPortrait();
  const accent = categoryAccent(category);

  const getCategoryVideos = (arr) => arr.filter((v) => v.category === category);

  const pickRandom = (pool, excludeIds = [], excludeSrcs = []) => {
    const choices = pool.filter(
      (v) => !excludeIds.includes(v.id) && !excludeSrcs.includes(v.src)
    );

    if (!choices.length) return null;
    return choices[Math.floor(Math.random() * choices.length)];
  };

  const pickTwo = (pool) => {
    const first = pickRandom(pool);
    const second = pickRandom(pool, [first?.id], [first?.src]);

    if (!first || !second) {
      const fallbackFirst = pool[0];
      const fallbackSecond =
        pool.find((v) => v.id !== fallbackFirst?.id && v.src !== fallbackFirst?.src) ||
        pool[1] ||
        pool[0];

      return {
        first: fallbackFirst,
        second: fallbackSecond,
      };
    }

    return { first, second };
  };

  const categoryVideos = useMemo(() => getCategoryVideos(videos), [videos, category]);

  const [pair, setPair] = useState(() => pickTwo(getCategoryVideos(videos)));
  const [throwSide, setThrowSide] = useState(null);
  const [throwVector, setThrowVector] = useState({ x: 0, y: 0 });
  const [enterSide, setEnterSide] = useState(null);
  const [enterVector, setEnterVector] = useState({ x: 0, y: 0 });
  const [isLocked, setIsLocked] = useState(false);
  const [winnerId, setWinnerId] = useState(null);
  const [streak, setStreak] = useState(0);
  const [showChampion, setShowChampion] = useState(false);
  const [decisionUnlockedAt, setDecisionUnlockedAt] = useState(Date.now());
  const [userTrust, setUserTrust] = useState(1.0);
  const [rushedVotes, setRushedVotes] = useState(0);
  const [totalVotes, setTotalVotes] = useState(0);
  const [detailsVideoId, setDetailsVideoId] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [playbackSide, setPlaybackSide] = useState('second');
  const [showArenaLabel, setShowArenaLabel] = useState(true);

  const holdTimerRef = useRef(null);
  const holdTriggeredRef = useRef(false);
  const pressStartRef = useRef(0);
  const arenaTimerRef = useRef(null);

  function startArenaTimer(duration = 20000) {
    setShowArenaLabel(true);
    if (arenaTimerRef.current) clearTimeout(arenaTimerRef.current);
    arenaTimerRef.current = setTimeout(() => {
      setShowArenaLabel(false);
    }, duration);
  }

  useEffect(() => {
    const pool = getCategoryVideos(videos);
    if (pool.length < 2) return;

    setPair(pickTwo(pool));
    setThrowSide(null);
    setEnterSide(null);
    setThrowVector({ x: 0, y: 0 });
    setEnterVector({ x: 0, y: 0 });
    setIsLocked(false);
    setWinnerId(null);
    setStreak(0);
    setShowChampion(false);
    setDecisionUnlockedAt(Date.now());
    setDetailsVideoId(null);
    setSheetOpen(false);
    setPlaybackSide('second');
    holdTriggeredRef.current = false;

    startArenaTimer(20000);
  }, [category, videos.length]);

  useEffect(() => {
    if (isLocked || showChampion || detailsVideoId) return;

    const activeVideo = playbackSide === 'first' ? pair.first : pair.second;
    const clipLength = Math.max(
      900,
      ((activeVideo?.trimEnd || MAX_TRIM_SECONDS) - (activeVideo?.trimStart || 0)) * 1000
    );

    const timer = setTimeout(() => {
      setPlaybackSide((prev) => (prev === 'first' ? 'second' : 'first'));
    }, clipLength);

    return () => clearTimeout(timer);
  }, [isLocked, showChampion, detailsVideoId, pair.first, pair.second, playbackSide]);

  useEffect(() => {
    return () => {
      if (arenaTimerRef.current) clearTimeout(arenaTimerRef.current);
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    };
  }, []);

  const canPick = !isLocked && !showChampion;

  const applyVideoUpdate = (updatedWinner, updatedLoser) => {
    setVideos((prev) =>
      prev.map((v) => {
        if (v.id === updatedWinner.id) return updatedWinner;
        if (v.id === updatedLoser.id) return updatedLoser;
        return v;
      })
    );
  };

  const startHold = (videoId) => {
    pressStartRef.current = Date.now();
    holdTriggeredRef.current = false;

    clearTimeout(holdTimerRef.current);
    holdTimerRef.current = setTimeout(() => {
      holdTriggeredRef.current = true;
      setDetailsVideoId(videoId);
    }, 340);
  };

  const endHold = () => {
    clearTimeout(holdTimerRef.current);

    if (holdTriggeredRef.current) {
      setDetailsVideoId(null);
      return;
    }

    const pressDuration = Date.now() - pressStartRef.current;
    if (pressDuration > 280) return;
  };

  const throwLoser = (side, vector) => {
    if (!canPick || detailsVideoId) return;

    setIsLocked(true);

    const now = Date.now();
    const msSinceUnlock = decisionUnlockedAt ? now - decisionUnlockedAt : 0;
    const voteTrust = getVoteTrust(msSinceUnlock);
    const rushed = msSinceUnlock < 900;

    const nextTotalVotes = totalVotes + 1;
    const nextRushedVotes = rushed ? rushedVotes + 1 : rushedVotes;
    const rushedRate = nextRushedVotes / nextTotalVotes;

    let nextUserTrust = userTrust;
    if (rushed) nextUserTrust = clamp(userTrust - 0.08, 0.35, 1.0);
    else nextUserTrust = clamp(userTrust + 0.02, 0.35, 1.0);
    if (rushedRate > 0.5) nextUserTrust = clamp(nextUserTrust - 0.05, 0.35, 1.0);

    setUserTrust(nextUserTrust);
    setTotalVotes(nextTotalVotes);
    setRushedVotes(nextRushedVotes);

    const finalVoteWeight = voteTrust * nextUserTrust;

    const loser = side === 'first' ? pair.first : pair.second;
    const winner = side === 'first' ? pair.second : pair.first;

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

    applyVideoUpdate(updatedWinner, updatedLoser);

    const nextStreak = winnerId === winner.id ? streak + 1 : 1;
    setWinnerId(winner.id);
    setStreak(nextStreak);

    const normalized = normalizeVector(vector.x, vector.y, 360);
    setThrowVector(normalized);
    setThrowSide(side);

    setTimeout(() => {
      const updatedPool = categoryVideos.map((v) => {
        if (v.id === updatedWinner.id) return updatedWinner;
        if (v.id === updatedLoser.id) return updatedLoser;
        return v;
      });

      if (nextStreak >= 3) {
        setThrowSide(null);
        setShowChampion(true);

        setTimeout(() => {
          const freshPool =
            updatedPool.filter(
              (v) =>
                ![updatedWinner.id, updatedLoser.id].includes(v.id) &&
                v.src !== updatedWinner.src &&
                v.src !== updatedLoser.src
            ).length >= 2
              ? updatedPool.filter(
                  (v) =>
                    ![updatedWinner.id, updatedLoser.id].includes(v.id) &&
                    v.src !== updatedWinner.src &&
                    v.src !== updatedLoser.src
                )
              : updatedPool;

          setPair(pickTwo(freshPool));
          setWinnerId(null);
          setStreak(0);
          setShowChampion(false);
          setDecisionUnlockedAt(Date.now());
          setEnterSide(null);
          setEnterVector({ x: 0, y: 0 });
          setThrowVector({ x: 0, y: 0 });
          setIsLocked(false);
          setPlaybackSide('second');
        }, 1450);

        return;
      }

      const challengerPool = updatedPool.filter(
        (v) =>
          ![updatedWinner.id, updatedLoser.id].includes(v.id) &&
          v.src !== updatedWinner.src &&
          v.src !== updatedLoser.src
      );

      const challenger =
        challengerPool.length
          ? pickRandom(challengerPool, [], [updatedWinner.src, updatedLoser.src])
          : pickRandom(updatedPool, [updatedWinner.id], [updatedWinner.src, updatedLoser.src]);

      const safeChallenger =
        challenger ||
        updatedPool.find(
          (v) => v.id !== updatedWinner.id && v.id !== updatedLoser.id && v.src !== updatedWinner.src
        ) ||
        updatedPool.find((v) => v.id !== updatedWinner.id && v.src !== updatedWinner.src) ||
        updatedPool.find((v) => v.id !== updatedWinner.id) ||
        updatedWinner;

      if (side === 'first') {
        setPair({ first: safeChallenger, second: updatedWinner });
        setEnterSide('first');
      } else {
        setPair({ first: updatedWinner, second: safeChallenger });
        setEnterSide('second');
      }

      setEnterVector(normalized);
      setThrowSide(null);
      setDecisionUnlockedAt(Date.now());
      setPlaybackSide(side === 'first' ? 'second' : 'first');

      setTimeout(() => {
        setEnterSide(null);
        setEnterVector({ x: 0, y: 0 });
        setThrowVector({ x: 0, y: 0 });
        setIsLocked(false);
      }, 280);
    }, 430);
  };

  function getThrowMotion(sideName) {
    if (throwSide === sideName) {
      return {
        x: throwVector.x,
        y: throwVector.y,
        opacity: 0,
        rotate: throwVector.x > 0 ? 7 : -7,
        scale: 0.98,
      };
    }

    if (enterSide === sideName) {
      return {
        x: enterVector.x * -0.32,
        y: enterVector.y * -0.32,
        opacity: 0.14,
        rotate: enterVector.x > 0 ? -4 : 4,
        scale: 0.985,
      };
    }

    return { x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 };
  }

  const firstMotion = getThrowMotion('first');
  const secondMotion = getThrowMotion('second');

  function buildSwipeHandler(side) {
    return (_, info) => {
      if (!canPick || detailsVideoId) return;

      const { x, y } = info.offset;
      if (magnitude(x, y) < SWIPE_THRESHOLD) return;

      throwLoser(side, { x, y });
    };
  }

  return (
    <div style={styles.battleShell}>
      <ArenaLabel category={category} accent={accent} visible={showArenaLabel} />

      <div style={styles.topButtons}>
        <button style={styles.uploadButton} onClick={onOpenUpload}>
          Upload
        </button>
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.05}
        onDragEnd={(_, info) => {
          if (info.offset.x < -70) onSwipeCategory(1);
          if (info.offset.x > 70) onSwipeCategory(-1);
        }}
        style={styles.arena}
      >
        <div
          style={
            isPortrait
              ? {
                  ...styles.seamGlow,
                  left: 0,
                  right: 0,
                  top: '50%',
                  height: 2,
                  transform: 'translateY(-50%)',
                  background: `linear-gradient(90deg, transparent, ${accent}aa, transparent)`,
                }
              : {
                  ...styles.seamGlow,
                  top: 0,
                  bottom: 0,
                  left: '50%',
                  width: 2,
                  transform: 'translateX(-50%)',
                  background: `linear-gradient(180deg, transparent, ${accent}aa, transparent)`,
                }
          }
        />

        <div style={isPortrait ? styles.splitPortrait : styles.splitLandscape}>
          <motion.div
            style={styles.halfWrap}
            animate={firstMotion}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            drag={canPick && !detailsVideoId ? true : false}
            dragElastic={0.08}
            dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
            onDragEnd={buildSwipeHandler('first')}
          >
            <VideoSurface
              video={pair.first}
              onPressStart={() => startHold(pair.first.id)}
              onPressEnd={endHold}
              accent={accent}
              showCrown={showChampion && winnerId === pair.first.id}
              isWinner={winnerId === pair.first.id}
              isActivePlayback={playbackSide === 'first'}
            />
          </motion.div>

          <motion.div
            style={styles.halfWrap}
            animate={secondMotion}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            drag={canPick && !detailsVideoId ? true : false}
            dragElastic={0.08}
            dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
            onDragEnd={buildSwipeHandler('second')}
          >
            <VideoSurface
              video={pair.second}
              onPressStart={() => startHold(pair.second.id)}
              onPressEnd={endHold}
              accent={accent}
              showCrown={showChampion && winnerId === pair.second.id}
              isWinner={winnerId === pair.second.id}
              isActivePlayback={playbackSide === 'second'}
            />
          </motion.div>
        </div>

        <DiamondVS accent={accent} canPulse={canPick} />

        <AnimatePresence>
          {detailsVideoId && (
            <VideoDetailsOverlay
              video={detailsVideoId === pair.first.id ? pair.first : pair.second}
              accent={accent}
            />
          )}
        </AnimatePresence>

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
                initial={{ scale: 0.88, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.92, y: 8 }}
              >
                <div style={{ fontSize: 48, marginBottom: 8 }}>👑</div>
                <div style={styles.championTitle}>3X DEFENDING WINNER</div>
                <div style={styles.championText}>Fresh contenders entering the arena.</div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <LeaderboardSheet
        videos={videos}
        category={category}
        isOpen={sheetOpen}
        setIsOpen={setSheetOpen}
      />
    </div>
  );
}

const styles = {
  app: {
    minHeight: '100vh',
    background:
      'radial-gradient(circle at top, rgba(124,58,237,.18), transparent 24%), radial-gradient(circle at bottom, rgba(236,72,153,.08), transparent 28%), #070b16',
    color: 'white',
    fontFamily: 'Arial, sans-serif',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    boxSizing: 'border-box',
  },
  phone: {
    width: '100%',
    maxWidth: 430,
    height: 'min(94vh, 920px)',
    background: 'linear-gradient(180deg, #020617 0%, #030712 100%)',
    borderRadius: 34,
    padding: 10,
    boxSizing: 'border-box',
    boxShadow: '0 28px 80px rgba(0,0,0,.55)',
    border: '1px solid rgba(255,255,255,.05)',
    overflow: 'hidden',
    position: 'relative',
  },
  battleShell: {
    position: 'relative',
    height: '100%',
  },
  topButtons: {
    position: 'absolute',
    top: 14,
    right: 12,
    zIndex: 16,
    display: 'flex',
    gap: 8,
  },
  uploadButton: {
    border: '1px solid rgba(255,255,255,.08)',
    background: 'rgba(255,255,255,.06)',
    color: 'white',
    borderRadius: 999,
    padding: '9px 14px',
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: '0.04em',
    cursor: 'pointer',
    backdropFilter: 'blur(8px)',
  },
  arenaLabelWrap: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    zIndex: 15,
    display: 'flex',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  arenaLabel: {
    textAlign: 'center',
    padding: '2px 10px',
    background: 'transparent',
  },
  arenaLabelSmall: {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: '0.24em',
    opacity: 0.46,
    fontWeight: 800,
    marginBottom: 2,
  },
  arenaLabelText: {
    fontSize: 15,
    fontWeight: 900,
    letterSpacing: '-0.01em',
    textShadow: '0 1px 12px rgba(0,0,0,.35)',
  },
  arena: {
    position: 'relative',
    height: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    background: '#000',
  },
  splitPortrait: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gridTemplateRows: '1fr 1fr',
    height: '100%',
  },
  splitLandscape: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridTemplateRows: '1fr',
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
    background: '#000',
    touchAction: 'none',
  },
  video: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    background: '#000',
  },
  videoFallback: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,.04)',
  },
  videoFallbackInner: {
    padding: 24,
    textAlign: 'center',
  },
  videoFallbackEyebrow: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.2em',
    opacity: 0.5,
    marginBottom: 10,
    fontWeight: 800,
  },
  videoFallbackTitle: {
    fontSize: 24,
    fontWeight: 900,
    marginBottom: 8,
  },
  videoFallbackCreator: {
    fontSize: 14,
    opacity: 0.7,
  },
  scrim: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,.34), rgba(0,0,0,.04) 45%, rgba(0,0,0,.12))',
    zIndex: 1,
  },
  edgeVignette: {
    position: 'absolute',
    inset: 0,
    zIndex: 1,
    background: 'radial-gradient(circle at center, transparent 42%, rgba(0,0,0,.26) 100%)',
  },
  inactivePlaybackShade: {
    position: 'absolute',
    inset: 0,
    zIndex: 2,
    background: 'rgba(0,0,0,.28)',
    pointerEvents: 'none',
  },
  winnerFlash: {
    position: 'absolute',
    inset: 0,
    zIndex: 3,
    background: 'radial-gradient(circle, rgba(255,255,255,.08), transparent 60%)',
    pointerEvents: 'none',
  },
  overlayTopMinimal: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 4,
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  badgeCrown: {
    background: 'rgba(250,204,21,.94)',
    color: '#111',
    padding: '5px 9px',
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 900,
  },
  seamGlow: {
    position: 'absolute',
    zIndex: 6,
    pointerEvents: 'none',
  },
  vsCenterLayer: {
    position: 'absolute',
    inset: 0,
    zIndex: 8,
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsMotionWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsDiamond: {
    width: 68,
    height: 68,
    transform: 'rotate(45deg)',
    borderRadius: 5,
    border: '1.5px solid rgba(255,255,255,.18)',
    background: 'linear-gradient(180deg, rgba(7,11,24,.97) 0%, rgba(0,0,0,.98) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 0 14px rgba(255,255,255,.06)',
  },
  vsDiamondInner: {
    transform: 'rotate(-45deg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    fontWeight: 900,
    fontSize: 14,
    letterSpacing: '0.18em',
    color: 'white',
    transform: 'translateX(2px)',
  },
  detailsOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,.28)',
    backdropFilter: 'blur(4px)',
    pointerEvents: 'none',
  },
  detailsCard: {
    minWidth: 230,
    maxWidth: '82%',
    background: 'rgba(8,11,22,.92)',
    border: '1px solid rgba(255,255,255,.12)',
    borderRadius: 22,
    padding: 16,
    boxShadow: '0 20px 50px rgba(0,0,0,.35)',
    textAlign: 'center',
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 900,
    marginBottom: 6,
  },
  detailsCreator: {
    opacity: 0.8,
    marginBottom: 10,
  },
  detailsMetaRow: {
    display: 'flex',
    gap: 8,
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  detailsPill: {
    background: 'rgba(255,255,255,.08)',
    padding: '6px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  },
  detailsCategory: {
    fontSize: 12,
    opacity: 0.7,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  championOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,.46)',
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
  championTitle: {
    fontSize: 20,
    fontWeight: 900,
    marginBottom: 6,
    letterSpacing: '0.02em',
  },
  championText: {
    opacity: 0.82,
    fontSize: 14,
  },
  sheet: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    height: 390,
    background: 'rgba(8,12,24,.96)',
    border: '1px solid rgba(255,255,255,.08)',
    borderRadius: 26,
    boxShadow: '0 -10px 30px rgba(0,0,0,.35)',
    zIndex: 12,
    overflow: 'hidden',
  },
  sheetHandleTap: {
    display: 'flex',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 8,
    cursor: 'pointer',
  },
  sheetHandle: {
    width: 48,
    height: 5,
    borderRadius: 999,
    background: 'rgba(255,255,255,.22)',
  },
  sheetHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'end',
    padding: '0 14px 10px',
    borderBottom: '1px solid rgba(255,255,255,.06)',
  },
  sheetLabel: {
    fontSize: 10,
    opacity: 0.58,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    marginBottom: 2,
    fontWeight: 800,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: 900,
  },
  sheetSub: {
    fontSize: 11,
    opacity: 0.65,
  },
  sheetList: {
    padding: 10,
    display: 'grid',
    gap: 8,
    maxHeight: 322,
    overflowY: 'auto',
  },
  sheetRow: {
    display: 'grid',
    gridTemplateColumns: '56px 1fr auto',
    gap: 10,
    alignItems: 'center',
    background: 'rgba(255,255,255,.04)',
    border: '1px solid rgba(255,255,255,.06)',
    borderRadius: 16,
    padding: 10,
  },
  sheetRank: {
    fontSize: 13,
    fontWeight: 900,
    opacity: 0.85,
  },
  sheetVideoTitle: {
    fontSize: 14,
    fontWeight: 800,
    lineHeight: 1.15,
    marginBottom: 2,
  },
  sheetCreator: {
    fontSize: 11,
    opacity: 0.72,
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
    opacity: 0.68,
  },
  onboardingOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(2,6,18,.78)',
    backdropFilter: 'blur(14px)',
    padding: 20,
  },
  onboardingCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 30,
    background: 'linear-gradient(180deg, rgba(12,18,34,.98), rgba(8,12,24,.96))',
    border: '1px solid rgba(255,255,255,.08)',
    boxShadow: '0 28px 70px rgba(0,0,0,.45)',
    padding: '28px 22px 20px',
    textAlign: 'left',
  },
  onboardingStep: {
    fontSize: 11,
    letterSpacing: '0.24em',
    textTransform: 'uppercase',
    opacity: 0.45,
    fontWeight: 800,
    marginBottom: 10,
  },
  onboardingTitle: {
    fontSize: 26,
    fontWeight: 900,
    marginBottom: 10,
    letterSpacing: '-0.02em',
  },
  onboardingBody: {
    fontSize: 15,
    lineHeight: 1.5,
    opacity: 0.84,
    marginBottom: 10,
  },
  onboardingHelper: {
    fontSize: 13,
    lineHeight: 1.4,
    opacity: 0.52,
    minHeight: 32,
  },
  onboardingDots: {
    display: 'flex',
    justifyContent: 'flex-start',
    gap: 8,
    marginTop: 16,
    marginBottom: 20,
  },
  onboardingDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: 'white',
    transition: 'all 0.2s ease',
  },
  onboardingActions: {
    display: 'flex',
    gap: 10,
    justifyContent: 'space-between',
  },
  onboardingGhostButton: {
    flex: 1,
    border: '1px solid rgba(255,255,255,.08)',
    background: 'rgba(255,255,255,.04)',
    color: 'white',
    borderRadius: 14,
    padding: '12px 14px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  onboardingPrimaryButton: {
    flex: 1,
    border: 'none',
    background: 'linear-gradient(180deg, #7c3aed 0%, #5b21b6 100%)',
    color: 'white',
    borderRadius: 14,
    padding: '12px 14px',
    fontWeight: 800,
    cursor: 'pointer',
  },
  uploadOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 35,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(1,5,16,.78)',
    backdropFilter: 'blur(10px)',
    padding: 16,
  },
  uploadCard: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '90%',
    overflowY: 'auto',
    borderRadius: 28,
    background: 'rgba(10,14,28,.98)',
    border: '1px solid rgba(255,255,255,.08)',
    boxShadow: '0 20px 60px rgba(0,0,0,.45)',
    padding: 18,
  },
  uploadHeader: {
    display: 'flex',
    alignItems: 'start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  uploadEyebrow: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.22em',
    opacity: 0.5,
    fontWeight: 800,
    marginBottom: 6,
  },
  uploadTitle: {
    fontSize: 22,
    fontWeight: 900,
  },
  uploadClose: {
    border: '1px solid rgba(255,255,255,.08)',
    background: 'rgba(255,255,255,.04)',
    color: 'white',
    borderRadius: 999,
    width: 34,
    height: 34,
    cursor: 'pointer',
    fontSize: 14,
  },
  captureButtons: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    marginBottom: 14,
  },
  uploadActionButton: {
    border: '1px solid rgba(255,255,255,.08)',
    background: 'rgba(255,255,255,.06)',
    color: 'white',
    borderRadius: 14,
    padding: '12px 14px',
    fontWeight: 800,
    cursor: 'pointer',
  },
  uploadGrid: {
    display: 'grid',
    gap: 10,
    marginBottom: 14,
  },
  uploadField: {
    display: 'grid',
    gap: 6,
  },
  uploadLabel: {
    fontSize: 12,
    fontWeight: 700,
    opacity: 0.78,
  },
  uploadInput: {
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,.08)',
    background: 'rgba(255,255,255,.04)',
    color: 'white',
    padding: '12px 14px',
    fontSize: 14,
  },
  trimBox: {
    borderRadius: 18,
    border: '1px solid rgba(255,255,255,.08)',
    background: 'rgba(255,255,255,.03)',
    padding: 12,
  },
  trimEmpty: {
    minHeight: 140,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    opacity: 0.7,
    fontSize: 14,
  },
  trimPreviewWrap: {
    borderRadius: 18,
    overflow: 'hidden',
    background: '#000',
    marginBottom: 12,
  },
  trimPreview: {
    width: '100%',
    display: 'block',
    maxHeight: 280,
    background: '#000',
  },
  trimStats: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  trimStatPill: {
    borderRadius: 999,
    background: 'rgba(255,255,255,.06)',
    padding: '7px 10px',
    fontSize: 12,
    fontWeight: 700,
  },
  sliderGroup: {
    display: 'grid',
    gap: 6,
    marginBottom: 10,
  },
  sliderLabel: {
    fontSize: 12,
    fontWeight: 700,
    opacity: 0.82,
  },
  slider: {
    width: '100%',
  },
  uploadActions: {
    display: 'flex',
    gap: 10,
    justifyContent: 'space-between',
    marginTop: 14,
  },
  uploadSecondary: {
    flex: 1,
    border: '1px solid rgba(255,255,255,.08)',
    background: 'rgba(255,255,255,.04)',
    color: 'white',
    borderRadius: 14,
    padding: '12px 14px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  uploadPrimary: {
    flex: 1,
    border: 'none',
    background: 'linear-gradient(180deg, #7c3aed 0%, #5b21b6 100%)',
    color: 'white',
    borderRadius: 14,
    padding: '12px 14px',
    fontWeight: 800,
  },
};

export default function App() {
  const [videos, setVideos] = useState(initialSeed);
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const nextIdRef = useRef(10000);

  const currentCategory = CATEGORIES[categoryIndex];

  useEffect(() => {
    const seen = localStorage.getItem('throwned-gesture-walkthrough-seen');
    if (!seen) {
      setShowOnboarding(true);
    }
  }, []);

  function closeOnboarding() {
    localStorage.setItem('throwned-gesture-walkthrough-seen', 'true');
    setShowOnboarding(false);
  }

  function saveUploadedClip(data) {
    const categoryVideos = videos.filter((v) => v.category === data.category);
    const nextRank = categoryVideos.length + 1;

    const newVideo = {
      id: nextIdRef.current++,
      title: data.title,
      creator: data.creator,
      category: data.category,
      rank: nextRank,
      rating: 3000,
      confidence: 0.55,
      src: data.src,
      trimStart: data.trimStart,
      trimEnd: data.trimEnd,
      uploaded: true,
    };

    setVideos((prev) => [...prev, newVideo]);
    setCategoryIndex(CATEGORIES.indexOf(data.category));
    setShowUpload(false);
  }

  const changeCategory = (direction) => {
    setCategoryIndex((prev) => {
      if (direction > 0) return prev === CATEGORIES.length - 1 ? 0 : prev + 1;
      return prev === 0 ? CATEGORIES.length - 1 : prev - 1;
    });
  };

  return (
    <div style={styles.app}>
      <div style={styles.phone}>
        <BattleArena
          videos={videos}
          setVideos={setVideos}
          category={currentCategory}
          onSwipeCategory={changeCategory}
          onOpenUpload={() => setShowUpload(true)}
        />

        <AnimatePresence>
          {showOnboarding && <OnboardingOverlay onClose={closeOnboarding} />}
        </AnimatePresence>

        <UploadSheet
          isOpen={showUpload}
          onClose={() => setShowUpload(false)}
          onSave={saveUploadedClip}
        />
      </div>
    </div>
  );
}