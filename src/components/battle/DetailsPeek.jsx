import { confidenceLabel } from "../../utils/ranking";

/** Minimal native-style peek; pointer-events none so release reaches GestureLayer below */
export function DetailsPeek({ item, accent, side, portrait, styles }) {
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

  return (
    <div style={{ ...styles.peekWrap, ...anchor }} aria-hidden>
      <div style={{ ...styles.peekCard, borderColor: `${accent}40` }}>
        <div style={styles.peekTitle}>{item.title}</div>
        <div style={styles.peekCreator}>{item.creator}</div>
        <div style={styles.peekMeta}>
          {item.rank != null ? `#${item.rank}` : "—"}
          {record != null ? ` · ${record}` : ""} · Rating {item.rating} · {confidenceLabel(item.confidence)}
        </div>
        <span style={styles.peekFollow} aria-disabled="true">
          Follow
        </span>
      </div>
    </div>
  );
}
