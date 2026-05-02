import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ARENAS } from "../../data/arenas";
import { arenaById } from "../../utils/ranking";

export function UploadSheet({ open, onClose, onSave, arenaId, styles }) {
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
