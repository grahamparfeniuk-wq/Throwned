import { useMemo } from "react";
import { motion } from "framer-motion";
import { confidenceLabel } from "../../utils/ranking";
import {
  arenaCountForCreator,
  isArenaDefender,
  isRisingContender,
  locationLine,
  normalizeCreatorHandle,
} from "../../utils/creatorStats";
import { selectNarrativeLines } from "../../utils/contenderNarratives";

export function DetailsPeek({ item, pool, arena, accent, side, portrait, styles, onClose }) {
  const handle = normalizeCreatorHandle(item);

  const narrativeLines = useMemo(
    () => selectNarrativeLines({ item, pool, arena }),
    [item, pool, arena]
  );

  const hooks = useMemo(() => {
    if (!item || !pool || !arena) {
      return { arenaCount: 0, defender: false, rising: false };
    }
    return {
      arenaCount: arenaCountForCreator(pool, handle),
      defender: isArenaDefender(pool, arena, item),
      rising: isRisingContender(pool, arena, item),
    };
  }, [handle, item, pool, arena]);

  if (!item) return null;

  const anchor =
    portrait && side === "first"
      ? styles.peekAnchorFirstPortrait
      : portrait && side === "second"
        ? styles.peekAnchorSecondPortrait
        : !portrait && side === "first"
          ? styles.peekAnchorFirstLandscape
          : styles.peekAnchorSecondLandscape;

  const record =
    item.wins != null || item.losses != null
      ? `${item.wins ?? 0}–${item.losses ?? 0}`
      : null;

  const loc = locationLine(item);

  const supporterLine =
    typeof item.supporters === "number"
      ? `${item.supporters.toLocaleString()} people in this corner`
      : "Supporters — connect to join";

  return (
    <div style={{ ...styles.peekWrap, ...anchor }}>
      <motion.div
        role="dialog"
        aria-modal="false"
        aria-label="Contender formation"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        style={{ ...styles.peekCard, borderColor: `${accent}38` }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close contender focus"
          style={styles.peekClose}
          onClick={(e) => {
            e.stopPropagation();
            onClose?.();
          }}
        >
          ×
        </button>

        <div style={styles.peekFormationLabel}>Attachment formation</div>
        <div style={styles.peekEyebrow}>Contender</div>

        <div style={styles.peekAthlete}>{item.creator}</div>
        <div style={styles.peekClipTitle}>{item.title}</div>

        {narrativeLines.length > 0 ? (
          <div style={styles.peekNarrativeBlock}>
            {narrativeLines.map((line, i) => (
              <p
                key={line}
                style={{
                  ...styles.peekNarrativeLine,
                  marginBottom: i === narrativeLines.length - 1 ? 0 : 10,
                }}
              >
                {line}
              </p>
            ))}
          </div>
        ) : null}

        {loc ? <div style={styles.peekLocationTop}>{loc}</div> : null}

        {hooks.defender || hooks.rising || item.localFavorite || item.localContender || item.country ? (
          <div style={styles.peekHookRow}>
            {hooks.defender ? <span style={styles.peekHook}>Defending</span> : null}
            {hooks.rising ? <span style={styles.peekHook}>Rising</span> : null}
            {item.localFavorite || item.localContender ? <span style={styles.peekHook}>Local contender</span> : null}
            {item.country ? <span style={styles.peekHookMuted}>{item.country}</span> : null}
          </div>
        ) : null}

        <div style={styles.peekDivider} />

        <div style={styles.peekStatBlock}>
          <div style={styles.peekStatLine}>
            {record != null ? <span style={styles.peekStatEm}>{record}</span> : <span style={styles.peekStatMuted}>—</span>}
            <span style={styles.peekStatSep}>·</span>
            <span>{item.rank != null ? `#${item.rank}` : "Unranked"}</span>
            {item.rank != null ? (
              <span style={styles.peekStatMuted}> · {arena?.label ? shortArena(arena.label) : "arena"}</span>
            ) : null}
          </div>
          <div style={styles.peekStatLineMuted}>
            Rating {item.rating} · {confidenceLabel(item.confidence)}
          </div>
          <div style={styles.peekStatLineMuted}>
            {hooks.arenaCount === 0
              ? "Competitions entered —"
              : hooks.arenaCount === 1
                ? "1 competition entered"
                : `${hooks.arenaCount} competitions entered`}
          </div>
          <div style={styles.peekSupportersLine}>{supporterLine}</div>
        </div>

        <button
          type="button"
          style={{ ...styles.peekFollowBtn, borderColor: `${accent}33` }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          Follow
        </button>
      </motion.div>
    </div>
  );
}

function shortArena(label) {
  const w = label.trim().split(/\s+/);
  return w.length > 2 ? `${w[0]} ${w[1]}…` : label;
}
