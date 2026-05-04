import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  arenaCountForCreator,
  locationLine,
  normalizeCreatorHandle,
} from "../../utils/creatorStats";
import {
  buildStatusSnapshot,
  selectBroadcastEyebrow,
  selectNarrativeLines,
} from "../../utils/contenderNarratives";

export function DetailsPeek({ item, pool, arena, accent, side, portrait, styles, onClose, opponent }) {
  const handle = normalizeCreatorHandle(item);

  const broadcastTag = useMemo(
    () => (item && pool && arena ? selectBroadcastEyebrow({ item, pool, arena }) : "CONTENDER"),
    [item, pool, arena]
  );

  const narrativeLines = useMemo(
    () => (item && pool && arena ? selectNarrativeLines({ item, pool, arena, opponent }) : []),
    [item, pool, arena, opponent]
  );

  const statusSnapshot = useMemo(
    () => (item && arena ? buildStatusSnapshot({ item, arena }) : ""),
    [item, arena]
  );

  const arenasEntered = useMemo(() => {
    if (!item || !pool) return 0;
    return arenaCountForCreator(pool, handle);
  }, [handle, item, pool]);

  const affiliationLine = useMemo(() => {
    if (!item) return "";
    const parts = [];
    const loc = locationLine(item);
    if (loc) parts.push(loc);
    if (arenasEntered === 1) parts.push("One circuit entered");
    else if (arenasEntered > 1) parts.push(`${arenasEntered} circuits`);
    if (typeof item.supporters === "number") {
      parts.push(`${item.supporters.toLocaleString()} in this corner`);
    } else {
      parts.push("Corner fills when you follow");
    }
    return parts.join(" · ");
  }, [item, arenasEntered]);

  const record =
    item?.wins != null || item?.losses != null
      ? `${item.wins ?? 0}–${item.losses ?? 0}`
      : null;

  const anchor =
    portrait && side === "first"
      ? styles.peekAnchorFirstPortrait
      : portrait && side === "second"
        ? styles.peekAnchorSecondPortrait
        : !portrait && side === "first"
          ? styles.peekAnchorFirstLandscape
          : styles.peekAnchorSecondLandscape;

  if (!item) return null;

  return (
    <div style={{ ...styles.peekWrap, ...anchor }}>
      <motion.div
        role="dialog"
        aria-modal="false"
        aria-label="Contender intro"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        style={{ ...styles.peekCard, borderColor: `${accent}28` }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close contender intro"
          style={styles.peekClose}
          onClick={(e) => {
            e.stopPropagation();
            onClose?.();
          }}
        >
          ×
        </button>

        <div style={{ ...styles.peekBroadcastEyebrow, color: accent }}>{broadcastTag}</div>

        <div style={styles.peekAthlete}>{item.creator}</div>
        <div style={styles.peekClipTitle}>{item.title}</div>

        {narrativeLines.length > 0 ? (
          <div style={styles.peekNarrativeBlock}>
            {narrativeLines.map((line, i) => (
              <p
                key={line}
                style={{
                  ...styles.peekNarrativeLine,
                  marginBottom: i === narrativeLines.length - 1 ? 0 : 12,
                }}
              >
                {line}
              </p>
            ))}
          </div>
        ) : null}

        <div style={styles.peekDividerSoft} />

        <div style={styles.peekStatusSnapshot}>{statusSnapshot}</div>

        {record ? <div style={styles.peekRecordQuiet}>{record} record</div> : null}

        <div style={styles.peekRatingFootnote}>Rating {item.rating}</div>

        <div style={styles.peekAffiliation}>{affiliationLine}</div>

        <button
          type="button"
          style={{ ...styles.peekFollowBtn, borderColor: `${accent}26` }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          Follow
        </button>
        <div style={styles.peekFollowHint}>Back their corner — show up for the next bell</div>
      </motion.div>
    </div>
  );
}
