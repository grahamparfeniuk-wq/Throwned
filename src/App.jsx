
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MAX_TRIM_SECONDS = 7;
const HOLD_MS = 340;
const SWIPE_THRESHOLD = 90;
const SWIPE_VELOCITY = 700;
const UPLOADS_KEY = 'throwned-uploads-v1';
const ONBOARDING_KEY = 'throwned-gesture-walkthrough-seen';

const CATEGORY_META = [
  { label: 'Epic Fails', mediaType: 'video', accent: '#ef4444', icon: '🎥' },
  { label: 'Sports', mediaType: 'video', accent: '#06b6d4', icon: '🎥' },
  { label: 'Original Songs', mediaType: 'video', accent: '#f59e0b', icon: '🎥' },
  { label: 'Best Sunset', mediaType: 'image', accent: '#fb7185', icon: '🖼️' },
  { label: 'Cute Kittens', mediaType: 'image', accent: '#a78bfa', icon: '🖼️' },
];

const CATEGORIES = CATEGORY_META.map((item) => item.label);

const DEMO_CLIPS = {
  'Epic Fails': [
    { title: 'Slip Jacket', creator: '@fail_1', src: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { title: 'Cat Bed Fail', creator: '@fail_2', src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' },
    { title: 'Race Crash', creator: '@fail_3', src: 'https://media.w3.org/2010/05/sintel/trailer.mp4' },
    { title: 'Highway Miss', creator: '@fail_4', src: 'https://www.w3schools.com/html/movie.mp4' },
  ],
  Sports: [
    { title: 'Track Burst', creator: '@sport_1', src: 'https://media.w3.org/2010/05/sintel/trailer.mp4' },
    { title: 'Court Handle', creator: '@sport_2', src: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { title: 'Rope Rhythm', creator: '@sport_3', src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm' },
    { title: 'Boxing Pace', creator: '@sport_4', src: 'https://www.w3schools.com/html/movie.mp4' },
  ],
  'Original Songs': [
    { title: 'Neon Vocal', creator: '@song_1', src: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { title: 'Mic Room Hook', creator: '@song_2', src: 'https://www.w3schools.com/html/movie.mp4' },
    { title: 'Jazz Night Verse', creator: '@song_3', src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' },
    { title: 'Studio Chorus', creator: '@song_4', src: 'https://media.w3.org/2010/05/sintel/trailer.mp4' },
  ],
  'Best Sunset': [
    { title: 'Burning Horizon', creator: '@sunset_1', src: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80' },
    { title: 'Pink Fade', creator: '@sunset_2', src: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=80' },
    { title: 'Last Light', creator: '@sunset_3', src: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1400&q=80' },
    { title: 'Sea Gold', creator: '@sunset_4', src: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1400&q=80' },
  ],
  'Cute Kittens': [
    { title: 'Tiny Stare', creator: '@kitten_1', src: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=1400&q=80' },
    { title: 'Paw Lean', creator: '@kitten_2', src: 'https://images.unsplash.com/photo-1511044568932-338cba0ad803?auto=format&fit=crop&w=1400&q=80' },
    { title: 'Window Face', creator: '@kitten_3', src: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=1400&q=80' },
    { title: 'Pocket Cat', creator: '@kitten_4', src: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=1400&q=80' },
  ],
};

function buildCategoryMedia(category, startId) {
  const meta = getCategoryMeta(category);
  return DEMO_CLIPS[category].map((item, index) => ({
    id: startId + index,
    title: item.title,
    creator: item.creator,
    category,
    mediaType: meta.mediaType,
    rank: index + 1,
    rating: 3200 - index * 35,
    confidence: Math.max(0.55, +(0.92 - index * 0.03).toFixed(2)),
    src: item.src,
    trimStart: 0,
    trimEnd: meta.mediaType === 'video' ? 7 : 0,
    uploaded: false,
  }));
}

const initialSeed = [
  ...buildCategoryMedia('Epic Fails', 1),
  ...buildCategoryMedia('Sports', 101),
  ...buildCategoryMedia('Original Songs', 201),
  ...buildCategoryMedia('Best Sunset', 301),
  ...buildCategoryMedia('Cute Kittens', 401),
];

function getCategoryMeta(category) {
  return CATEGORY_META.find((item) => item.label === category) || CATEGORY_META[0];
}

function saveUploads(items) {
  try {
    const uploaded = items.filter((item) => item.uploaded);
    localStorage.setItem(UPLOADS_KEY, JSON.stringify(uploaded));
  } catch {}
}

function loadUploads() {
  try {
    const raw = localStorage.getItem(UPLOADS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

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
    winnerDelta: Math.max(2, Math.round(baseK * (1 - expectedWinner) * finalVoteWeight * winnerVolatility)),
    loserDelta: Math.max(2, Math.round(baseK * (1 - expectedWinner) * finalVoteWeight * loserVolatility)),
  };
}

function confidenceLabel(confidence) {
  if (confidence >= 0.85) return 'Royalty';
  if (confidence >= 0.7) return 'Elite';
  if (confidence >= 0.55) return 'Rising';
  return 'Wildcard';
}

function formatSeconds(value) {
  return `${Number(value || 0).toFixed(1)}s`;
}

function magnitude(x, y) {
  return Math.sqrt(x * x + y * y);
}

function normalizeVector(x, y, length = 300) {
  const mag = magnitude(x, y);
  if (!mag || mag < 1) return { x: length, y: 0 };
  return { x: (x / mag) * length, y: (y / mag) * length };
}

function useIsPortrait() {
  const getValue = () => typeof window !== 'undefined' ? window.innerHeight >= window.innerWidth : true;
  const [isPortrait, setIsPortrait] = useState(getValue());

  useEffect(() => {
    const onResize = () => setIsPortrait(getValue());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return isPortrait;
}

function ArenaLabel({ category, visible }) {
  const meta = getCategoryMeta(category);

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
            <div style={{ ...styles.arenaLabelText, color: meta.accent }}>
              {meta.icon} {category}
            </div>
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
                scale: [1, 1.03, 1],
                filter: [
                  'drop-shadow(0 0 8px rgba(255,255,255,0.05))',
                  `drop-shadow(0 0 12px ${accent})`,
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

function PauseSeamChip({ paused }) {
  return (
    <AnimatePresence>
      {paused && (
        <motion.div
          style={styles.pauseChipWrap}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
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

function OnboardingOverlay({ onClose }) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: 'Watch both clips',
      body: 'Only one contender plays at a time, so each one gets a clean shot.',
      helper: 'Listen. Compare. Decide.',
    },
    {
      title: 'Hold for details',
      body: 'Press and hold any contender to reveal creator and clip info.',
      helper: 'No clutter unless you ask for it.',
    },
    {
      title: 'Throw away the loser',
      body: 'Swipe outward to eliminate a loser. Swipe the background to move arenas.',
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
    <motion.div style={styles.onboardingOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
          <button style={styles.onboardingGhostButton} onClick={onClose}>Skip</button>
          <button style={styles.onboardingPrimaryButton} onClick={next}>
            {step === steps.length - 1 ? 'Enter Arena' : 'Next'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function MediaDetailsOverlay({ item }) {
  const meta = getCategoryMeta(item.category);

  return (
    <motion.div style={styles.detailsOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        style={{ ...styles.detailsCard, borderColor: `${meta.accent}66` }}
        initial={{ scale: 0.96, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.97, y: 8 }}
      >
        <div style={styles.detailsTitle}>{item.title}</div>
        <div style={styles.detailsCreator}>{item.creator}</div>

        <div style={styles.detailsMetaRow}>
          <div style={styles.detailsPill}>Rating {item.rating}</div>
          <div style={styles.detailsPill}>{confidenceLabel(item.confidence)}</div>
          <div style={styles.detailsPill}>{item.mediaType === 'video' ? 'Video' : 'Image'}</div>
        </div>

        {item.mediaType === 'video' && (
          <div style={styles.detailsSubText}>
            {formatSeconds(item.trimStart || 0)} – {formatSeconds(item.trimEnd || 0)}
          </div>
        )}

        <div style={{ ...styles.detailsCategory, color: meta.accent }}>
          {meta.icon} {item.category}
        </div>
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

  const currentMeta = getCategoryMeta(selectedCategory);

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

  useEffect(() => {
    return () => {
      if (objectUrl && objectUrl.startsWith('blob:')) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  function loadSelectedFile(selected) {
    if (!selected) return;

    const fileType = selected.type?.startsWith('image/')
      ? 'image'
      : selected.type?.startsWith('video/')
        ? 'video'
        : null;

    if (!fileType || fileType !== currentMeta.mediaType) {
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

    if (nextEnd - nextStart > MAX_TRIM_SECONDS) nextEnd = nextStart + MAX_TRIM_SECONDS;
    if (nextEnd <= nextStart) nextEnd = Math.min(duration, nextStart + 0.1);

    setTrimStart(nextStart);
    setTrimEnd(nextEnd);
  }

  function handleEndChange(value) {
    let nextEnd = clamp(Number(value), 0.1, duration || MAX_TRIM_SECONDS);
    if (nextEnd <= trimStart) nextEnd = trimStart + 0.1;
    if (nextEnd - trimStart > MAX_TRIM_SECONDS) nextEnd = trimStart + MAX_TRIM_SECONDS;
    setTrimEnd(Math.min(duration || nextEnd, nextEnd));
  }

  useEffect(() => {
    const video = previewRef.current;
    if (!video || !objectUrl || currentMeta.mediaType !== 'video') return;

    const onTimeUpdate = () => {
      if (video.currentTime >= trimEnd) {
        video.currentTime = trimStart;
        video.play().catch(() => {});
      }
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    return () => video.removeEventListener('timeupdate', onTimeUpdate);
  }, [objectUrl, trimStart, trimEnd, currentMeta.mediaType]);

  useEffect(() => {
    const video = previewRef.current;
    if (!video || !objectUrl || currentMeta.mediaType !== 'video') return;
    video.currentTime = trimStart;
    video.muted = false;
  }, [trimStart, trimEnd, objectUrl, currentMeta.mediaType]);

  function handleSave() {
    if (!objectUrl || !file) return;
    const savedUrl = objectUrl;
    setObjectUrl('');
    setFile(null);

    onSave({
      title: title.trim() || file.name.replace(/\.[^/.]+$/, ''),
      creator: creator.trim() || '@me',
      category: selectedCategory,
      mediaType: currentMeta.mediaType,
      src: savedUrl,
      trimStart: currentMeta.mediaType === 'video' ? trimStart : 0,
      trimEnd: currentMeta.mediaType === 'video' ? trimEnd : 0,
      uploaded: true,
    });
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div style={styles.uploadOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
              <button style={styles.uploadClose} onClick={onClose}>✕</button>
            </div>

            <div style={styles.captureButtons}>
              <button style={styles.uploadActionButton} onClick={() => uploadInputRef.current?.click()}>
                From library
              </button>
              <button style={styles.uploadActionButton} onClick={() => captureInputRef.current?.click()}>
                {currentMeta.mediaType === 'video' ? 'Record now' : 'Take photo'}
              </button>

              <input
                ref={uploadInputRef}
                type="file"
                accept={currentMeta.mediaType === 'video' ? 'video/*' : 'image/*'}
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              <input
                ref={captureInputRef}
                type="file"
                accept={currentMeta.mediaType === 'video' ? 'video/*' : 'image/*'}
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
                  onChange={(e) => {
                    const nextCategory = e.target.value;
                    setSelectedCategory(nextCategory);
                    setFile(null);
                    setObjectUrl('');
                    setDuration(0);
                    setTrimStart(0);
                    setTrimEnd(MAX_TRIM_SECONDS);
                  }}
                  style={styles.uploadInput}
                >
                  {CATEGORY_META.map((item) => (
                    <option key={item.label} value={item.label}>
                      {item.icon} {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label style={styles.uploadField}>
                <span style={styles.uploadLabel}>Type</span>
                <input
                  value={`${currentMeta.icon} ${currentMeta.mediaType === 'video' ? 'Video' : 'Image'}`}
                  style={styles.uploadInput}
                  readOnly
                />
              </label>

              <label style={styles.uploadField}>
                <span style={styles.uploadLabel}>Title</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={currentMeta.mediaType === 'video' ? 'Clip title' : 'Image title'}
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
                  Choose a {currentMeta.mediaType === 'video' ? 'video' : 'photo'} that belongs in this arena.
                </div>
              ) : currentMeta.mediaType === 'video' ? (
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
                    <div style={styles.trimStatPill}>Full length: {duration ? formatSeconds(duration) : '...'}</div>
                    <div style={styles.trimStatPill}>Selected: {formatSeconds(Math.max(0, trimEnd - trimStart))}</div>
                    <div style={styles.trimStatPill}>Max: 7.0s</div>
                  </div>

                  <div style={styles.sliderGroup}>
                    <label style={styles.sliderLabel}>Start: {formatSeconds(trimStart)}</label>
                    <input type="range" min={0} max={Math.max(0, duration - 0.1)} step={0.1} value={trimStart} onChange={(e) => handleStartChange(e.target.value)} style={styles.slider} />
                  </div>

                  <div style={styles.sliderGroup}>
                    <label style={styles.sliderLabel}>End: {formatSeconds(trimEnd)}</label>
                    <input type="range" min={0.1} max={duration || MAX_TRIM_SECONDS} step={0.1} value={trimEnd} onChange={(e) => handleEndChange(e.target.value)} style={styles.slider} />
                  </div>
                </>
              ) : (
                <div style={styles.trimPreviewWrap}>
                  <img ref={previewRef} src={objectUrl} alt="preview" style={styles.trimPreview} />
                </div>
              )}
            </div>

            <div style={styles.uploadActions}>
              <button style={styles.uploadSecondary} onClick={onClose}>Cancel</button>
              <button
                style={{ ...styles.uploadPrimary, opacity: objectUrl ? 1 : 0.45, cursor: objectUrl ? 'pointer' : 'not-allowed' }}
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

function MediaSurface({ item, onPressStart, onPressEnd, accent, isWinner, isActivePlayback, paused }) {
  const mediaRef = useRef(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    setLoadFailed(false);
  }, [item.src]);

  useEffect(() => {
    if (item.mediaType !== 'video') return;

    const el = mediaRef.current;
    if (!el) return;

    const startTime = item.trimStart || 0;
    const endTime = item.trimEnd || MAX_TRIM_SECONDS;

    const handleTimeUpdate = () => {
      if (el.currentTime >= endTime) {
        el.pause();
      }
    };

    el.addEventListener('timeupdate', handleTimeUpdate);

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
      const promise = el.play();
      if (promise?.catch) promise.catch(() => {});
    }

    return () => el.removeEventListener('timeupdate', handleTimeUpdate);
  }, [item, isActivePlayback, paused]);

  return (
    <motion.div
      style={{ ...styles.card, boxShadow: isWinner ? `0 0 42px ${accent}22 inset` : 'none' }}
      whileTap={{ scale: 0.996 }}
      onMouseDown={onPressStart}
      onMouseUp={onPressEnd}
      onMouseLeave={onPressEnd}
      onTouchStart={onPressStart}
      onTouchEnd={onPressEnd}
      onTouchCancel={onPressEnd}
    >
      {!loadFailed ? (
        item.mediaType === 'video' ? (
          <video
            ref={mediaRef}
            src={item.src}
            playsInline
            preload="auto"
            style={styles.video}
            onError={() => setLoadFailed(true)}
          />
        ) : (
          <img
            ref={mediaRef}
            src={item.src}
            alt={item.title}
            style={styles.video}
            onError={() => setLoadFailed(true)}
          />
        )
      ) : (
        <div style={{ ...styles.videoFallback, background: `${accent}22` }}>
          <div style={styles.videoFallbackInner}>
            <div style={styles.videoFallbackEyebrow}>{item.category}</div>
            <div style={styles.videoFallbackTitle}>{item.title}</div>
            <div style={styles.videoFallbackCreator}>{item.creator}</div>
          </div>
        </div>
      )}

      <div style={styles.scrim} />
      <div style={styles.edgeVignette} />
      {!isActivePlayback && <div style={styles.inactivePlaybackShade} />}
      {isWinner && <motion.div style={styles.winnerFlash} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />}
    </motion.div>
  );
}

function LeaderboardSheet({ items, category, isOpen, setIsOpen }) {
  const meta = getCategoryMeta(category);
  const ranked = useMemo(
    () => items.filter((v) => v.category === category).slice().sort((a, b) => a.rank - b.rank),
    [items, category]
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
          <div style={{ ...styles.sheetTitle, color: meta.accent }}>{meta.icon} {category}</div>
        </div>
        <div style={styles.sheetSub}>{ranked.length} contenders</div>
      </div>

      <div style={styles.sheetList}>
        {ranked.map((item) => (
          <div key={item.id} style={styles.sheetRow}>
            <div style={styles.sheetRank}>#{item.rank}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={styles.sheetVideoTitle}>{item.title}</div>
              <div style={styles.sheetCreator}>{item.creator}</div>
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

function BattleArena({ items, setItems, category, onSwipeCategory, onOpenUpload }) {
  const isPortrait = useIsPortrait();
  const meta = getCategoryMeta(category);

  const categoryItems = useMemo(() => items.filter((item) => item.category === category), [items, category]);
  const battleHistoryRef = useRef([]);
  const holdTimerRef = useRef(null);
  const holdTriggeredRef = useRef(false);
  const pressStartRef = useRef(0);
  const arenaTimerRef = useRef(null);

  const [pair, setPair] = useState(() => pickTwo(categoryItems));
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
  const [detailsId, setDetailsId] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [playbackSide, setPlaybackSide] = useState('second');
  const [showArenaLabel, setShowArenaLabel] = useState(true);
  const [paused, setPaused] = useState(false);

  function pickRandom(pool, excludeIds = [], excludeSrcs = []) {
    const choices = pool.filter((v) => !excludeIds.includes(v.id) && !excludeSrcs.includes(v.src));
    if (!choices.length) return null;
    return choices[Math.floor(Math.random() * choices.length)];
  }

  function pickTwo(pool) {
    const first = pickRandom(pool);
    const second = pickRandom(pool, [first?.id], [first?.src]);
    if (!first || !second) {
      const fallbackFirst = pool[0];
      const fallbackSecond = pool.find((v) => v.id !== fallbackFirst?.id && v.src !== fallbackFirst?.src) || pool[1] || pool[0];
      return { first: fallbackFirst, second: fallbackSecond };
    }
    return { first, second };
  }

  function startArenaTimer(duration = 2200) {
    setShowArenaLabel(true);
    if (arenaTimerRef.current) clearTimeout(arenaTimerRef.current);
    arenaTimerRef.current = setTimeout(() => setShowArenaLabel(false), duration);
  }

  useEffect(() => {
    if (categoryItems.length < 2) return;
    setPair(pickTwo(categoryItems));
    setThrowSide(null);
    setEnterSide(null);
    setThrowVector({ x: 0, y: 0 });
    setEnterVector({ x: 0, y: 0 });
    setIsLocked(false);
    setWinnerId(null);
    setStreak(0);
    setShowChampion(false);
    setDecisionUnlockedAt(Date.now());
    setDetailsId(null);
    setSheetOpen(false);
    setPlaybackSide('second');
    setPaused(false);
    holdTriggeredRef.current = false;
    startArenaTimer();
  }, [category, categoryItems.length]);

  useEffect(() => {
    if (isLocked || showChampion || detailsId || paused) return;
    const activeItem = playbackSide === 'first' ? pair.first : pair.second;
    if (!activeItem) return;

    const clipLength = activeItem.mediaType === 'video'
      ? Math.max(900, ((activeItem.trimEnd || MAX_TRIM_SECONDS) - (activeItem.trimStart || 0)) * 1000)
      : 2400;

    const timer = setTimeout(() => {
      setPlaybackSide((prev) => (prev === 'first' ? 'second' : 'first'));
    }, clipLength);

    return () => clearTimeout(timer);
  }, [isLocked, showChampion, detailsId, pair.first, pair.second, playbackSide, paused]);

  useEffect(() => {
    return () => {
      if (arenaTimerRef.current) clearTimeout(arenaTimerRef.current);
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    };
  }, []);

  const canPick = !isLocked && !showChampion;
  const detailsItem = detailsId === pair.first?.id ? pair.first : pair.second;

  function applyItemUpdate(updatedWinner, updatedLoser) {
    setItems((prev) =>
      prev.map((v) => {
        if (v.id === updatedWinner.id) return updatedWinner;
        if (v.id === updatedLoser.id) return updatedLoser;
        return v;
      })
    );
  }

  function startHold(itemId) {
    pressStartRef.current = Date.now();
    holdTriggeredRef.current = false;
    clearTimeout(holdTimerRef.current);
    holdTimerRef.current = setTimeout(() => {
      holdTriggeredRef.current = true;
      setDetailsId(itemId);
    }, HOLD_MS);
  }

  function endHold() {
    clearTimeout(holdTimerRef.current);
    if (holdTriggeredRef.current) {
      setDetailsId(null);
      return;
    }
    const pressDuration = Date.now() - pressStartRef.current;
    if (pressDuration > 280) return;
  }

  function isOutwardSwipe(side, x, y, vx, vy) {
    if (isPortrait) {
      if (side === 'first') return y < -SWIPE_THRESHOLD || vy < -SWIPE_VELOCITY;
      return y > SWIPE_THRESHOLD || vy > SWIPE_VELOCITY;
    }
    if (side === 'first') return x < -SWIPE_THRESHOLD || vx < -SWIPE_VELOCITY;
    return x > SWIPE_THRESHOLD || vx > SWIPE_VELOCITY;
  }

  function throwLoser(side, vector) {
    if (!canPick || detailsId) return;

    setIsLocked(true);
    setPaused(false);

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

    const { winnerDelta, loserDelta } = computeConfidenceAdjustedDelta(winner, loser, finalVoteWeight);

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

    applyItemUpdate(updatedWinner, updatedLoser);

    const nextStreak = winnerId === winner.id ? streak + 1 : 1;
    setWinnerId(winner.id);
    setStreak(nextStreak);

    const normalized = normalizeVector(vector.x, vector.y, 360);
    setThrowVector(normalized);
    setThrowSide(side);

    battleHistoryRef.current.push(updatedWinner.id, updatedLoser.id);

    setTimeout(() => {
      const updatedPool = categoryItems.map((v) => {
        if (v.id === updatedWinner.id) return updatedWinner;
        if (v.id === updatedLoser.id) return updatedLoser;
        return v;
      });

      if (nextStreak >= 3) {
        setThrowSide(null);
        setShowChampion(true);

        setTimeout(() => {
          const freshPool = updatedPool.filter((v) => ![updatedWinner.id, updatedLoser.id].includes(v.id));
          setPair(pickTwo(freshPool.length >= 2 ? freshPool : updatedPool));
          setWinnerId(null);
          setStreak(0);
          setShowChampion(false);
          setDecisionUnlockedAt(Date.now());
          setEnterSide(null);
          setEnterVector({ x: 0, y: 0 });
          setThrowVector({ x: 0, y: 0 });
          setIsLocked(false);
          setPlaybackSide('second');
        }, 1200);

        return;
      }

      const recentIds = battleHistoryRef.current.slice(-4);
      const challengerPool = updatedPool.filter((v) => ![updatedWinner.id, updatedLoser.id].includes(v.id));
      const challenger = pickRandom(challengerPool, recentIds, [updatedWinner.src, updatedLoser.src]) ||
        pickRandom(updatedPool, [updatedWinner.id], [updatedWinner.src, updatedLoser.src]);

      const safeChallenger =
        challenger ||
        updatedPool.find((v) => v.id !== updatedWinner.id && v.id !== updatedLoser.id && v.src !== updatedWinner.src) ||
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
  }

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
      if (!canPick || detailsId) return;
      const { x, y } = info.offset;
      const vx = info.velocity.x;
      const vy = info.velocity.y;
      if (!isOutwardSwipe(side, x, y, vx, vy)) return;
      throwLoser(side, { x, y });
    };
  }

  function handleArenaBackgroundDragEnd(_, info) {
    if (isPortrait) {
      if (info.offset.x < -70) onSwipeCategory(1);
      if (info.offset.x > 70) onSwipeCategory(-1);
      return;
    }
    if (info.offset.y < -70) onSwipeCategory(1);
    if (info.offset.y > 70) onSwipeCategory(-1);
  }

  function handleArenaTap() {
    if (detailsId || showChampion || isLocked) return;
    setPaused((prev) => !prev);
  }

  const plusLabel = meta.mediaType === 'video' ? '+' : '+';

  return (
    <div style={styles.battleShell}>
      <ArenaLabel category={category} visible={showArenaLabel} />

      <motion.div
        drag={isPortrait ? 'x' : 'y'}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.05}
        onDragEnd={handleArenaBackgroundDragEnd}
        style={styles.arena}
        onClick={handleArenaTap}
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
                  background: `linear-gradient(90deg, transparent, ${meta.accent}aa, transparent)`,
                }
              : {
                  ...styles.seamGlow,
                  top: 0,
                  bottom: 0,
                  left: '50%',
                  width: 2,
                  transform: 'translateX(-50%)',
                  background: `linear-gradient(180deg, transparent, ${meta.accent}aa, transparent)`,
                }
          }
        />

        <div style={isPortrait ? styles.splitPortrait : styles.splitLandscape}>
          <motion.div
            style={styles.halfWrap}
            animate={firstMotion}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            drag={canPick && !detailsId ? true : false}
            dragElastic={0.08}
            dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
            onDragEnd={buildSwipeHandler('first')}
          >
            {pair.first && (
              <MediaSurface
                item={pair.first}
                onPressStart={() => startHold(pair.first.id)}
                onPressEnd={endHold}
                accent={meta.accent}
                isWinner={winnerId === pair.first.id}
                isActivePlayback={playbackSide === 'first'}
                paused={paused}
              />
            )}
          </motion.div>

          <motion.div
            style={styles.halfWrap}
            animate={secondMotion}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            drag={canPick && !detailsId ? true : false}
            dragElastic={0.08}
            dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
            onDragEnd={buildSwipeHandler('second')}
          >
            {pair.second && (
              <MediaSurface
                item={pair.second}
                onPressStart={() => startHold(pair.second.id)}
                onPressEnd={endHold}
                accent={meta.accent}
                isWinner={winnerId === pair.second.id}
                isActivePlayback={playbackSide === 'second'}
                paused={paused}
              />
            )}
          </motion.div>
        </div>

        <DiamondVS accent={meta.accent} canPulse={canPick && !paused} />
        <PauseSeamChip paused={paused} />

        <div style={styles.bottomAddWrap}>
          <button
            style={styles.midlineAddButton}
            onClick={(e) => {
              e.stopPropagation();
              onOpenUpload();
            }}
            aria-label="Add contender"
          >
            {plusLabel}
          </button>
        </div>

        <AnimatePresence>
          {detailsId && detailsItem && <MediaDetailsOverlay item={detailsItem} />}
        </AnimatePresence>

        <AnimatePresence>
          {showChampion && (
            <motion.div style={styles.championOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div
                style={{ ...styles.championCard, borderColor: `${meta.accent}55` }}
                initial={{ scale: 0.88, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.92, y: 8 }}
              >
                <div style={styles.championMicro}>3X DEFENDER</div>
                <div style={styles.championTitle}>Arena cleared</div>
                <div style={styles.championText}>Fresh contenders entering now.</div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <LeaderboardSheet items={items} category={category} isOpen={sheetOpen} setIsOpen={setSheetOpen} />
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
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    transform: 'scale(1.02)',
  },
  videoFallback: {
    position: 'absolute',
    inset: 0,
  },
  videoFallbackInner: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 22,
  },
  videoFallbackEyebrow: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.16em',
    opacity: 0.68,
    marginBottom: 8,
  },
  videoFallbackTitle: {
    fontSize: 28,
    fontWeight: 900,
    lineHeight: 1,
    marginBottom: 6,
  },
  videoFallbackCreator: {
    fontSize: 14,
    opacity: 0.76,
  },
  scrim: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, rgba(0,0,0,.05) 0%, rgba(0,0,0,.18) 100%)',
    pointerEvents: 'none',
  },
  edgeVignette: {
    position: 'absolute',
    inset: 0,
    boxShadow: 'inset 0 0 80px rgba(0,0,0,.26)',
    pointerEvents: 'none',
  },
  inactivePlaybackShade: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,.18)',
    pointerEvents: 'none',
  },
  winnerFlash: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,0))',
    pointerEvents: 'none',
  },
  seamGlow: {
    position: 'absolute',
    zIndex: 4,
    pointerEvents: 'none',
  },
  vsCenterLayer: {
    position: 'absolute',
    inset: 0,
    zIndex: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  vsMotionWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsDiamond: {
    width: 42,
    height: 42,
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,.16)',
    background: 'rgba(5,10,20,.4)',
    backdropFilter: 'blur(10px)',
    transform: 'rotate(45deg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsDiamondInner: {
    transform: 'rotate(-45deg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: '0.22em',
    marginLeft: 2,
  },
  pauseChipWrap: {
    position: 'absolute',
    top: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 12,
    pointerEvents: 'none',
  },
  pauseChip: {
    width: 34,
    height: 34,
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,.06)',
    background: 'rgba(255,255,255,.07)',
    backdropFilter: 'blur(10px)',
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
    background: 'rgba(255,255,255,.75)',
  },
  bottomAddWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 12,
    zIndex: 12,
    display: 'flex',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  midlineAddButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,.08)',
    background: 'rgba(255,255,255,.06)',
    backdropFilter: 'blur(10px)',
    color: 'rgba(255,255,255,.9)',
    fontSize: 22,
    fontWeight: 500,
    lineHeight: 1,
    cursor: 'pointer',
    pointerEvents: 'auto',
  },
  detailsOverlay: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 104,
    zIndex: 18,
    display: 'flex',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  detailsCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 22,
    border: '1px solid rgba(255,255,255,.08)',
    background: 'rgba(8,10,16,.8)',
    backdropFilter: 'blur(16px)',
    padding: 16,
  },
  detailsTitle: {
    fontSize: 22,
    fontWeight: 900,
    marginBottom: 4,
  },
  detailsCreator: {
    fontSize: 14,
    opacity: 0.76,
    marginBottom: 10,
  },
  detailsMetaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  detailsPill: {
    borderRadius: 999,
    background: 'rgba(255,255,255,.06)',
    padding: '7px 10px',
    fontSize: 12,
    fontWeight: 700,
  },
  detailsSubText: {
    fontSize: 13,
    opacity: 0.7,
    marginBottom: 8,
  },
  detailsCategory: {
    fontSize: 13,
    fontWeight: 800,
  },
  championOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 17,
    background: 'rgba(0,0,0,.22)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  championCard: {
    borderRadius: 24,
    border: '1px solid rgba(255,255,255,.08)',
    background: 'rgba(8,10,16,.88)',
    padding: '22px 24px',
    textAlign: 'center',
    minWidth: 250,
  },
  championMicro: {
    fontSize: 11,
    letterSpacing: '0.2em',
    opacity: 0.54,
    marginBottom: 8,
    fontWeight: 800,
  },
  championTitle: {
    fontSize: 24,
    fontWeight: 900,
    marginBottom: 6,
  },
  championText: {
    fontSize: 14,
    opacity: 0.76,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 420,
    zIndex: 14,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    background: 'rgba(7,10,18,.94)',
    borderTop: '1px solid rgba(255,255,255,.06)',
    backdropFilter: 'blur(18px)',
    boxShadow: '0 -18px 48px rgba(0,0,0,.36)',
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
    width: 40,
    height: 4,
    borderRadius: 999,
    background: 'rgba(255,255,255,.18)',
  },
  sheetHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: '0 16px 14px',
  },
  sheetLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.2em',
    opacity: 0.46,
    marginBottom: 5,
    fontWeight: 800,
  },
  sheetTitle: {
    fontSize: 21,
    fontWeight: 900,
    lineHeight: 1,
  },
  sheetSub: {
    fontSize: 12,
    opacity: 0.56,
    fontWeight: 700,
  },
  sheetList: {
    padding: '0 10px 14px',
    overflowY: 'auto',
    height: 340,
  },
  sheetRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 10px',
    borderRadius: 16,
    background: 'rgba(255,255,255,.02)',
    border: '1px solid rgba(255,255,255,.04)',
    marginBottom: 8,
  },
  sheetRank: {
    width: 42,
    fontSize: 13,
    fontWeight: 900,
    opacity: 0.84,
  },
  sheetVideoTitle: {
    fontSize: 14,
    fontWeight: 800,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  sheetCreator: {
    fontSize: 12,
    opacity: 0.56,
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
    opacity: 0.56,
    marginTop: 2,
  },
  onboardingOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 30,
    background: 'rgba(0,0,0,.45)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  onboardingCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    background: 'rgba(10,14,22,.94)',
    border: '1px solid rgba(255,255,255,.08)',
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
    fontSize: 28,
    fontWeight: 900,
    marginBottom: 8,
    lineHeight: 1.02,
  },
  onboardingBody: {
    fontSize: 15,
    lineHeight: 1.5,
    opacity: 0.86,
  },
  onboardingHelper: {
    fontSize: 13,
    marginTop: 10,
    opacity: 0.62,
  },
  onboardingDots: {
    display: 'flex',
    gap: 8,
    marginTop: 18,
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
    zIndex: 26,
    background: 'rgba(0,0,0,.46)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    padding: 10,
  },
  uploadCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '88vh',
    overflowY: 'auto',
    borderRadius: 28,
    background: 'rgba(10,14,22,.98)',
    border: '1px solid rgba(255,255,255,.08)',
    padding: 18,
    boxSizing: 'border-box',
  },
  uploadHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  uploadEyebrow: {
    fontSize: 11,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    opacity: 0.52,
    fontWeight: 800,
    marginBottom: 6,
  },
  uploadTitle: {
    fontSize: 26,
    fontWeight: 900,
    lineHeight: 1,
  },
  uploadClose: {
    width: 34,
    height: 34,
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,.08)',
    background: 'rgba(255,255,255,.04)',
    color: 'white',
    cursor: 'pointer',
  },
  captureButtons: {
    display: 'flex',
    gap: 10,
    marginBottom: 14,
  },
  uploadActionButton: {
    flex: 1,
    border: '1px solid rgba(255,255,255,.08)',
    background: 'rgba(255,255,255,.04)',
    color: 'white',
    borderRadius: 14,
    padding: '12px 14px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  uploadGrid: {
    display: 'grid',
    gap: 12,
    marginBottom: 14,
  },
  uploadField: {
    display: 'grid',
    gap: 6,
  },
  uploadLabel: {
    fontSize: 12,
    fontWeight: 700,
    opacity: 0.82,
  },
  uploadInput: {
    border: '1px solid rgba(255,255,255,.08)',
    background: 'rgba(255,255,255,.04)',
    color: 'white',
    borderRadius: 14,
    padding: '12px 14px',
    outline: 'none',
  },
  trimBox: {
    border: '1px solid rgba(255,255,255,.06)',
    borderRadius: 20,
    background: 'rgba(255,255,255,.02)',
    padding: 12,
  },
  trimEmpty: {
    minHeight: 160,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 1.5,
    opacity: 0.66,
    padding: 10,
  },
  trimPreviewWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    background: '#000',
  },
  trimPreview: {
    width: '100%',
    display: 'block',
    maxHeight: 260,
    objectFit: 'cover',
  },
  trimStats: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 10,
    marginBottom: 10,
  },
  trimStatPill: {
    borderRadius: 999,
    background: 'rgba(255,255,255,.04)',
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
  const [items, setItems] = useState(() => [...initialSeed, ...loadUploads()]);
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const nextIdRef = useRef(10000);

  const currentCategory = CATEGORIES[categoryIndex];

  useEffect(() => {
    const seen = localStorage.getItem(ONBOARDING_KEY);
    if (!seen) setShowOnboarding(true);
  }, []);

  useEffect(() => {
    saveUploads(items);
  }, [items]);

  function closeOnboarding() {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  }

  function saveUploadedItem(data) {
    const categoryItems = items.filter((v) => v.category === data.category);
    const nextRank = categoryItems.length + 1;

    const newItem = {
      id: nextIdRef.current++,
      title: data.title,
      creator: data.creator,
      category: data.category,
      mediaType: data.mediaType,
      rank: nextRank,
      rating: 3000,
      confidence: 0.55,
      src: data.src,
      trimStart: data.trimStart,
      trimEnd: data.trimEnd,
      uploaded: true,
    };

    setItems((prev) => [...prev, newItem]);
    setCategoryIndex(CATEGORIES.indexOf(data.category));
    setShowUpload(false);
  }

  function changeCategory(direction) {
    setCategoryIndex((prev) => {
      if (direction > 0) return prev === CATEGORIES.length - 1 ? 0 : prev + 1;
      return prev === 0 ? CATEGORIES.length - 1 : prev - 1;
    });
  }

  return (
    <div style={styles.app}>
      <div style={styles.phone}>
        <BattleArena
          items={items}
          setItems={setItems}
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
          onSave={saveUploadedItem}
        />
      </div>
    </div>
  );
}
