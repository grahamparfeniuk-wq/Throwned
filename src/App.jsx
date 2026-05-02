import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ARENAS } from "./data/arenas";
import { START_MEDIA } from "./data/startMedia";
import {
  arenaById,
  arenaItems,
  clamp,
  confidenceLabel,
  pickPair,
  pickRandom,
  scoreDelta,
  sortRank,
  updateConfidence,
  voteTrust,
} from "./utils/ranking";
import { enterVector, normalizeUpload, safeDuration, throwVector } from "./utils/media";
import { useIsPortrait } from "./hooks/useIsPortrait";
import { Seam } from "./components/battle/Seam";
import { VSBadge } from "./components/battle/VSBadge";
import { ArenaLabel } from "./components/overlays/ArenaLabel";
import { ChampionBanner } from "./components/overlays/ChampionBanner";

const HOLD_MS = 260;
const THROW_DISTANCE = 92;
const CATEGORY_DISTANCE = 116;
const LABEL_MS = 1600;

function BattleMedia({ item, refProp, onError }) {
  const mediaStyle = {
    ...styles.mediaFill,
    objectFit: "cover",
    objectPosition: item?.position || "center center",
  };

  if (item.type === "video") {
    return (
      <video
        ref={refProp}
        src={item.src}
        playsInline
        preload="auto"
        style={mediaStyle}
        onError={onError}
      />
    );
  }

  return (
    <img
      src={item.src}
      alt={item.title}
      draggable={false}
      style={mediaStyle}
      onError={onError}
    />
  );
}

function MediaSurface({ item, active, paused, dimmed, winner, accent, onHoldStart, onHoldEnd }) {
  const ref = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [item?.src]);

  useEffect(() => {
    if (!item || item.type !== "video") return;

    const video = ref.current;
    if (!video) return;

    const start = Number(item.trimStart || 0);
    const end = Number(item.trimEnd || 7);

    const resetToStart = () => {
      try {
        video.currentTime = start;
      } catch {}
    };

    const playFromStart = () => {
      resetToStart();
      video.muted = false;
      video.playsInline = true;
      const p = video.play();
      if (p?.catch) p.catch(() => {});
    };

    const stop = () => {
      video.pause();
      video.muted = true;
    };

    const onTimeUpdate = () => {
      if (!active || paused) return;
      if (video.currentTime >= end - 0.04) {
        resetToStart();
        const p = video.play();
        if (p?.catch) p.catch(() => {});
      }
    };

    video.addEventListener("timeupdate", onTimeUpdate);

    if (active && !paused) playFromStart();
    else stop();

    return () => video.removeEventListener("timeupdate", onTimeUpdate);
  }, [item?.id, item?.src, item?.trimStart, item?.trimEnd, active, paused]);

  if (!item) return null;

  const isImage = item.type === "image";

  return (
    <div
      style={{ ...styles.surface, boxShadow: winner ? `inset 0 0 58px ${accent}2a` : "none" }}
      onMouseDown={() => onHoldStart(item.id)}
      onMouseUp={onHoldEnd}
      onMouseLeave={onHoldEnd}
      onTouchStart={() => onHoldStart(item.id)}
      onTouchEnd={onHoldEnd}
      onTouchCancel={onHoldEnd}
    >
      <div
        style={{
          ...styles.mediaWrap,
          filter: isImage ? "brightness(1.03)" : winner ? "brightness(1.13)" : active && !paused ? "brightness(1.06)" : "brightness(0.92)",
        }}
      >
        {!failed ? (
          <BattleMedia item={item} refProp={ref} onError={() => setFailed(true)} />
        ) : (
          <div style={{ ...styles.fallback, background: `linear-gradient(180deg, ${accent}22, rgba(0,0,0,.86))` }}>
            <div style={styles.fallbackArena}>{arenaById(item.arenaId).label}</div>
            <div style={styles.fallbackTitle}>{item.title}</div>
            <div style={styles.fallbackCreator}>{item.creator}</div>
          </div>
        )}
      </div>

      <div style={styles.scrim} />
      <div style={styles.vignette} />
      {!isImage && dimmed && <div style={styles.inactive} />}
    </div>
  );
}

function GestureLayer({ side, disabled, onMove, onDone }) {
  const start = useRef({ x: 0, y: 0 });

  function move(x, y) {
    onMove(side, x - start.current.x, y - start.current.y);
  }

  function done(x, y) {
    const dx = x - start.current.x;
    const dy = y - start.current.y;
    onMove(side, 0, 0);
    onDone(side, dx, dy, dx * 8, dy * 8);
  }

  return (
    <div
      style={styles.gestureLayer}
      onTouchStart={(e) => {
        if (disabled) return;
        const t = e.touches?.[0];
        if (t) start.current = { x: t.clientX, y: t.clientY };
      }}
      onTouchMove={(e) => {
        if (disabled) return;
        const t = e.touches?.[0];
        if (t) move(t.clientX, t.clientY);
      }}
      onTouchEnd={(e) => {
        if (disabled) return;
        const t = e.changedTouches?.[0];
        if (t) done(t.clientX, t.clientY);
      }}
      onMouseDown={(e) => {
        if (disabled) return;
        start.current = { x: e.clientX, y: e.clientY };
      }}
      onMouseMove={(e) => {
        if (disabled || e.buttons !== 1) return;
        move(e.clientX, e.clientY);
      }}
      onMouseUp={(e) => {
        if (disabled) return;
        done(e.clientX, e.clientY);
      }}
    />
  );
}

function BattleSlot({ side, item, portrait, accent, active, paused, dimmed, winner, locked, entering, thrown, drag, onMove, onDone, onHoldStart, onHoldEnd }) {
  return (
    <motion.div
      key={`${side}-${item?.id}`}
      initial={entering ? enterVector(side, portrait) : false}
      animate={
        thrown || {
          x: drag?.x || 0,
          y: drag?.y || 0,
          rotate: drag?.rotate || 0,
          opacity: 1,
          scale: 1,
        }
      }
      transition={{
        type: "spring",
        stiffness: thrown ? 330 : 245,
        damping: thrown ? 17 : 26,
        mass: 0.78,
        opacity: { duration: 0.12 },
      }}
      style={{ ...styles.slot, ...(portrait ? styles.slotPortrait : styles.slotLandscape) }}
    >
      <MediaSurface
        item={item}
        active={active}
        paused={paused}
        dimmed={dimmed}
        winner={winner}
        accent={accent}
        onHoldStart={onHoldStart}
        onHoldEnd={onHoldEnd}
      />
      <GestureLayer side={side} disabled={locked} onMove={onMove} onDone={onDone} />
    </motion.div>
  );
}

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

function Leaderboard({ items, arena, open, setOpen, onUpload }) {
  const ranked = useMemo(() => sortRank(items), [items]);

  return (
    <motion.div
      drag="y"
      dragElastic={0.05}
      dragConstraints={{ top: 0, bottom: 520 }}
      onDragEnd={(_, info) => {
        if (info.offset.y > 80) setOpen(false);
        if (info.offset.y < -80) setOpen(true);
      }}
      animate={{ y: open ? 0 : 514 }}
      transition={{ type: "spring", stiffness: 280, damping: 34 }}
      style={styles.sheet}
    >
      <div style={styles.sheetHandleTap} onClick={() => setOpen((v) => !v)}>
        <div style={styles.sheetHandle} />
      </div>

      <div style={styles.sheetHeader}>
        <div>
          <div style={styles.sheetEyebrow}>Live Ranking</div>
          <div style={{ ...styles.sheetTitle, color: arena.accent }}>{arena.label}</div>
        </div>
        <button style={styles.sheetUpload} onClick={onUpload}>+</button>
      </div>

      <div style={styles.sheetList}>
        {ranked.map((item, i) => (
          <div key={item.id} style={styles.sheetRow}>
            <div style={{ ...styles.sheetRank, color: i === 0 ? arena.accent : "rgba(255,255,255,.78)" }}>#{i + 1}</div>
            <div style={styles.sheetText}>
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

function UploadSheet({ open, onClose, onSave, arenaId }) {
  const [selectedArena, setSelectedArena] = useState(arenaId);
  const arena = arenaById(selectedArena);
  const [title, setTitle] = useState("");
  const [creator, setCreator] = useState("@me");
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");
  const [duration, setDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(7);
  const inputRef = useRef(null);
  const captureRef = useRef(null);
  const previewRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setSelectedArena(arenaId);
  }, [open, arenaId]);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setCreator("@me");
      setFile(null);
      setUrl("");
      setDuration(0);
      setTrimStart(0);
      setTrimEnd(7);
    }
  }, [open]);

  function loadFile(f) {
    if (!f) return;

    const actualType = f.type?.startsWith("image/") ? "image" : f.type?.startsWith("video/") ? "video" : null;

    if (actualType !== arena.type) {
      alert(`This arena only accepts ${arena.type === "video" ? "videos" : "images"}.`);
      return;
    }

    const objectUrl = URL.createObjectURL(f);
    setFile(f);
    setUrl(objectUrl);
    if (!title.trim()) setTitle(f.name.replace(/\.[^/.]+$/, ""));
  }

  function save() {
    if (!file || !url) return;
    onSave({
      arenaId: selectedArena,
      title: title.trim() || "Untitled",
      creator: creator.trim() || "@me",
      type: arena.type,
      src: url,
      trimStart,
      trimEnd,
    });
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div style={styles.uploadOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div style={styles.uploadCard} initial={{ opacity: 0, y: 16, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.985 }}>
            <div style={styles.uploadHeader}>
              <div>
                <div style={styles.uploadEyebrow}>Add contender</div>
                <div style={styles.uploadTitle}>Upload</div>
              </div>
              <button style={styles.closeButton} onClick={onClose}>×</button>
            </div>

            <div style={styles.uploadGrid}>
              <label style={styles.field}>
                <span>Arena</span>
                <select
                  value={selectedArena}
                  onChange={(e) => {
                    setSelectedArena(e.target.value);
                    setFile(null);
                    setUrl("");
                  }}
                  style={styles.input}
                >
                  {ARENAS.map((a) => (
                    <option key={a.id} value={a.id}>{a.label}</option>
                  ))}
                </select>
              </label>

              <label style={styles.field}>
                <span>Type</span>
                <input value={arena.type === "video" ? "Video" : "Image"} readOnly style={styles.input} />
              </label>

              <label style={styles.field}>
                <span>Title</span>
                <input value={title} onChange={(e) => setTitle(e.target.value)} style={styles.input} />
              </label>

              <label style={styles.field}>
                <span>Creator</span>
                <input value={creator} onChange={(e) => setCreator(e.target.value)} style={styles.input} />
              </label>
            </div>

            <div style={styles.uploadButtons}>
              <button style={styles.uploadButton} onClick={() => inputRef.current?.click()}>From library</button>
              <button style={styles.uploadButton} onClick={() => captureRef.current?.click()}>
                {arena.type === "video" ? "Record now" : "Take photo"}
              </button>
              <input ref={inputRef} type="file" accept={arena.type === "video" ? "video/*" : "image/*"} onChange={(e) => loadFile(e.target.files?.[0])} style={{ display: "none" }} />
              <input ref={captureRef} type="file" accept={arena.type === "video" ? "video/*" : "image/*"} capture="environment" onChange={(e) => loadFile(e.target.files?.[0])} style={{ display: "none" }} />
            </div>

            <div style={styles.previewBox}>
              {!url ? (
                <div style={styles.previewEmpty}>
                  Record or choose a {arena.type === "video" ? "video" : "photo"}. After selection, you’ll see the exact center crop used in battle.
                </div>
              ) : (
                <>
                  <div style={styles.cropHeader}>
                    <span>Battle Crop Preview</span>
                    <small>What voters will see</small>
                  </div>

                  <div style={styles.battlePreviewFrame}>
                    <div style={styles.cropGuideVertical} />
                    <div style={styles.cropGuideHorizontal} />

                    {arena.type === "video" ? (
                      <video
                        ref={previewRef}
                        src={url}
                        controls
                        playsInline
                        style={styles.previewBattleMedia}
                        onLoadedMetadata={() => {
                          const d = Number(previewRef.current?.duration || 0);
                          setDuration(d);
                          setTrimStart(0);
                          setTrimEnd(Math.min(7, d || 7));
                        }}
                      />
                    ) : (
                      <img src={url} alt="Preview" style={styles.previewBattleMedia} />
                    )}

                    <div style={styles.cropFrameLabel}>CENTER CROP</div>
                  </div>

                  <div style={styles.cropNote}>The app will fill the arena and crop edges automatically. Future version: drag to reposition crop.</div>

                  {arena.type === "video" && (
                    <>
                      <div style={styles.trimRow}>
                        <span>Full: {duration ? duration.toFixed(1) : "..."}s</span>
                        <span>Selected: {Math.max(0, trimEnd - trimStart).toFixed(1)}s</span>
                        <span>Max: 7.0s</span>
                      </div>

                      <label style={styles.sliderLabel}>
                        Start: {trimStart.toFixed(1)}s
                        <input
                          type="range"
                          min={0}
                          max={Math.max(0, duration - 0.1)}
                          step={0.1}
                          value={trimStart}
                          onChange={(e) => {
                            const next = Number(e.target.value);
                            setTrimStart(next);
                            if (trimEnd - next > 7) setTrimEnd(next + 7);
                            if (trimEnd <= next) setTrimEnd(next + 0.2);
                          }}
                          style={styles.slider}
                        />
                      </label>

                      <label style={styles.sliderLabel}>
                        End: {trimEnd.toFixed(1)}s
                        <input
                          type="range"
                          min={0.1}
                          max={duration || 7}
                          step={0.1}
                          value={trimEnd}
                          onChange={(e) => {
                            let next = Number(e.target.value);
                            if (next <= trimStart) next = trimStart + 0.2;
                            if (next - trimStart > 7) next = trimStart + 7;
                            setTrimEnd(next);
                          }}
                          style={styles.slider}
                        />
                      </label>
                    </>
                  )}
                </>
              )}
            </div>

            <div style={styles.uploadActions}>
              <button style={styles.cancelButton} onClick={onClose}>Cancel</button>
              <button style={{ ...styles.saveButton, opacity: url ? 1 : 0.45 }} onClick={save} disabled={!url}>Save contender</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Battle({ pool, setPool, arena, changeArena, openUpload }) {
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
      <ArenaLabel arena={arena} visible={labelVisible} styles={styles} />

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
        />
      </motion.div>

      <Seam portrait={portrait} accent={arena.accent} pulse={pulse} dragging={dragging} styles={styles} />
      <VSBadge accent={arena.accent} styles={styles} />
      <Details item={detailsItem} accent={arena.accent} />
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

      <Leaderboard
        items={items}
        arena={arena}
        open={sheetOpen}
        setOpen={setSheetOpen}
        onUpload={(e) => {
          e?.stopPropagation?.();
          openUpload();
        }}
      />
    </div>
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
        openUpload={() => setUploadOpen(true)}
      />

      <UploadSheet
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSave={saveUpload}
        arenaId={arena.id}
      />
    </div>
  );
}

const styles = {
  app: {
    position: "fixed",
    inset: 0,
    overflow: "hidden",
    background: "#050608",
    color: "#fff",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  battle: {
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "hidden",
  },
  layout: {
    position: "absolute",
    inset: 0,
    display: "flex",
  },
  layoutPortrait: {
    flexDirection: "column",
  },
  layoutLandscape: {
    flexDirection: "row",
  },
  slot: {
    position: "relative",
    overflow: "hidden",
    minWidth: 0,
    minHeight: 0,
    background: "#050608",
  },
  slotPortrait: {
    flex: "0 0 50%",
    height: "50%",
  },
  slotLandscape: {
    flex: "0 0 50%",
    width: "50%",
  },
  surface: {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    background: "#07080b",
  },
  mediaWrap: {
    position: "absolute",
    inset: 0,
    transition: "filter 180ms ease",
    overflow: "hidden",
  },
  mediaFill: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "center center",
    userSelect: "none",
    WebkitUserDrag: "none",
    background: "#0b0b0d",
    display: "block",
  },
  gestureLayer: {
    position: "absolute",
    inset: 0,
    zIndex: 3,
    background: "transparent",
    touchAction: "none",
  },
  scrim: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    background:
      "linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.07) 36%, rgba(0,0,0,0.22) 100%)",
  },
  vignette: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    boxShadow: "inset 0 0 68px rgba(0,0,0,0.22)",
  },
  inactive: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.24)",
    pointerEvents: "none",
  },
  seamPortrait: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "50%",
    height: 2,
    zIndex: 6,
    pointerEvents: "none",
    transform: "translateY(-1px)",
  },
  seamLandscape: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "50%",
    width: 2,
    zIndex: 6,
    pointerEvents: "none",
    transform: "translateX(-1px)",
  },
  vsLayer: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
    zIndex: 8,
  },
  vsDiamond: {
    width: 40,
    height: 40,
    transform: "rotate(45deg)",
    borderRadius: 5,
    border: "1px solid",
    background: "rgba(0,0,0,0.88)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  vsInner: {
    transform: "rotate(-45deg)",
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: "0.2em",
    marginLeft: 2,
  },
  arenaLabelWrap: {
    position: "absolute",
    top: 14,
    left: 0,
    right: 0,
    zIndex: 30,
    display: "flex",
    justifyContent: "center",
    pointerEvents: "none",
  },
  arenaLabel: {
    padding: "7px 12px",
    borderRadius: 999,
    background: "rgba(8,10,14,.34)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,.06)",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
  },
  detailsWrap: {
    position: "absolute",
    inset: 0,
    zIndex: 18,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    padding: 16,
    pointerEvents: "none",
  },
  detailsCard: {
    width: "min(480px, 92vw)",
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,.08)",
    background: "rgba(8,10,14,.72)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    padding: 14,
    boxShadow: "0 18px 60px rgba(0,0,0,.35)",
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 800,
    lineHeight: 1.08,
    marginBottom: 6,
  },
  detailsCreator: {
    fontSize: 13,
    opacity: 0.72,
    marginBottom: 10,
  },
  pillRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  pill: {
    padding: "7px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,.06)",
    border: "1px solid rgba(255,255,255,.06)",
    fontSize: 12,
    fontWeight: 700,
  },
  detailsArena: {
    fontSize: 12,
    fontWeight: 700,
  },
  championWrap: {
    position: "absolute",
    inset: 0,
    zIndex: 25,
    background: "rgba(4,6,10,.34)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  championCard: {
    width: "min(400px, 90vw)",
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,.08)",
    background: "linear-gradient(180deg, rgba(14,18,25,.96), rgba(8,10,14,.96))",
    padding: "24px 22px 22px",
    textAlign: "center",
    boxShadow: "0 24px 80px rgba(0,0,0,.42)",
  },
  championMicro: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.24em",
    opacity: 0.5,
    marginBottom: 12,
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
    background: "rgba(255,255,255,.16)",
    margin: "0 auto 16px",
  },
  championSub: {
    fontSize: 14,
    lineHeight: 1.4,
    opacity: 0.7,
  },
  swipeZone: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 84,
    zIndex: 9,
    background: "transparent",
  },
  sheet: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: -2,
    height: 452,
    zIndex: 16,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    background: "rgba(8,10,14,.82)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    border: "1px solid rgba(255,255,255,.06)",
    boxShadow: "0 -20px 54px rgba(0,0,0,.32)",
    overflow: "hidden",
  },
  sheetHandleTap: {
    paddingTop: 10,
    paddingBottom: 10,
    display: "flex",
    justifyContent: "center",
    cursor: "pointer",
  },
  sheetHandle: {
    width: 30,
    height: 4,
    borderRadius: 999,
    background: "rgba(255,255,255,.12)",
  },
  sheetHeader: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    padding: "0 18px 14px",
  },
  sheetEyebrow: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: "0.22em",
    opacity: 0.46,
    marginBottom: 6,
  },
  sheetTitle: {
    fontSize: 21,
    fontWeight: 800,
    lineHeight: 1.02,
  },
  sheetUpload: {
    width: 34,
    height: 34,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,.08)",
    background: "rgba(255,255,255,.04)",
    color: "#fff",
    fontSize: 22,
    cursor: "pointer",
  },
  sheetList: {
    padding: "0 10px 18px",
    overflowY: "auto",
    height: 365,
  },
  sheetRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 10px",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,.04)",
    background: "rgba(255,255,255,.02)",
    marginBottom: 8,
  },
  sheetRank: {
    width: 40,
    fontSize: 13,
    fontWeight: 800,
  },
  sheetText: {
    flex: 1,
    minWidth: 0,
  },
  sheetItemTitle: {
    fontSize: 14,
    fontWeight: 800,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  sheetItemCreator: {
    fontSize: 12,
    opacity: 0.58,
    marginTop: 2,
  },
  sheetRight: {
    textAlign: "right",
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
  uploadOverlay: {
    position: "absolute",
    inset: 0,
    zIndex: 32,
    background: "rgba(4,6,10,.52)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    padding: 12,
  },
  uploadCard: {
    width: "min(720px, 100%)",
    maxHeight: "88vh",
    overflowY: "auto",
    borderRadius: 28,
    border: "1px solid rgba(255,255,255,.08)",
    background: "linear-gradient(180deg, rgba(13,17,24,.98), rgba(8,10,14,.98))",
    boxShadow: "0 24px 80px rgba(0,0,0,.45)",
    padding: 18,
  },
  uploadHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  uploadEyebrow: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.2em",
    opacity: 0.46,
    marginBottom: 5,
  },
  uploadTitle: {
    fontSize: 26,
    fontWeight: 800,
    lineHeight: 1,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,.08)",
    background: "rgba(255,255,255,.04)",
    color: "#fff",
    fontSize: 22,
    cursor: "pointer",
  },
  uploadGrid: {
    display: "grid",
    gap: 12,
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    marginBottom: 14,
  },
  field: {
    display: "grid",
    gap: 6,
    fontSize: 12,
    fontWeight: 700,
    opacity: 0.84,
  },
  input: {
    width: "100%",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,.08)",
    background: "rgba(255,255,255,.04)",
    color: "#fff",
    padding: "12px 12px",
    outline: "none",
  },
  uploadButtons: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 14,
  },
  uploadButton: {
    flex: 1,
    minWidth: 140,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,.08)",
    background: "rgba(255,255,255,.04)",
    color: "#fff",
    padding: "12px 14px",
    fontWeight: 800,
    cursor: "pointer",
  },
  previewBox: {
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,.08)",
    background: "rgba(255,255,255,.03)",
    padding: 12,
    marginBottom: 14,
  },
  previewEmpty: {
    minHeight: 150,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    fontSize: 14,
    lineHeight: 1.5,
    opacity: 0.62,
    padding: 20,
  },
  cropHeader: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
    fontWeight: 800,
    fontSize: 13,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  battlePreviewFrame: {
    width: "100%",
    aspectRatio: "9 / 8",
    borderRadius: 18,
    overflow: "hidden",
    background: "#050608",
    border: "1px solid rgba(255,255,255,.12)",
    position: "relative",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,.04)",
  },
  previewBattleMedia: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "center center",
    display: "block",
    background: "#08090c",
  },
  cropGuideVertical: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "50%",
    width: 1,
    background: "rgba(255,255,255,.18)",
    zIndex: 4,
    pointerEvents: "none",
  },
  cropGuideHorizontal: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "50%",
    height: 1,
    background: "rgba(255,255,255,.18)",
    zIndex: 4,
    pointerEvents: "none",
  },
  cropFrameLabel: {
    position: "absolute",
    right: 10,
    bottom: 10,
    zIndex: 5,
    padding: "5px 8px",
    borderRadius: 999,
    background: "rgba(0,0,0,.46)",
    border: "1px solid rgba(255,255,255,.12)",
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "0.12em",
  },
  cropNote: {
    marginTop: 8,
    marginBottom: 10,
    fontSize: 12,
    opacity: 0.56,
  },
  trimRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 10,
    marginBottom: 12,
    fontSize: 12,
    opacity: 0.75,
  },
  sliderLabel: {
    display: "grid",
    gap: 6,
    fontSize: 12,
    fontWeight: 700,
    opacity: 0.72,
    marginBottom: 10,
  },
  slider: {
    width: "100%",
  },
  uploadActions: {
    display: "flex",
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,.08)",
    background: "rgba(255,255,255,.04)",
    color: "#fff",
    padding: "12px 14px",
    fontWeight: 800,
    cursor: "pointer",
  },
  saveButton: {
    flex: 1,
    borderRadius: 16,
    border: "none",
    background: "linear-gradient(180deg, #7c3aed, #5b21b6)",
    color: "#fff",
    padding: "12px 14px",
    fontWeight: 800,
    cursor: "pointer",
  },
  fallback: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    padding: 22,
  },
  fallbackArena: {
    fontSize: 11,
    letterSpacing: "0.18em",
    opacity: 0.7,
    textTransform: "uppercase",
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
  empty: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: 24,
    background: "#050608",
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: 800,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 1.5,
    opacity: 0.68,
    maxWidth: 360,
    marginBottom: 18,
  },
  emptyButton: {
    borderRadius: 16,
    border: "none",
    background: "linear-gradient(180deg, #7c3aed, #5b21b6)",
    color: "#fff",
    padding: "12px 16px",
    fontWeight: 800,
    cursor: "pointer",
  },
};