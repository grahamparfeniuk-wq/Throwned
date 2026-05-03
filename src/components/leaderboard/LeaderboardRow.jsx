import { confidenceLabel } from "../../utils/ranking";
import { LeaderboardThumb } from "./LeaderboardThumb";

export function LeaderboardRow({ item, index, accent, styles }) {
  const rank = index + 1;
  const top = index === 0;

  return (
    <div style={styles.lbRow}>
      <div style={{ ...styles.lbRank, color: top ? accent : "rgba(255,255,255,.55)" }}>#{rank}</div>
      <LeaderboardThumb item={item} styles={styles} />
      <div style={styles.lbRowMain}>
        <div style={styles.lbRowTop}>
          <div style={styles.lbTitleBlock}>
            <div style={styles.lbItemTitle}>{item.title}</div>
            <div style={styles.lbItemCreator}>{item.creator}</div>
          </div>
          <button type="button" style={styles.lbFollow} disabled aria-disabled="true" title="Coming soon">
            Follow
          </button>
        </div>
      </div>
      <div style={styles.lbStats}>
        <div style={styles.lbRating}>{item.rating}</div>
        <div style={styles.lbStatus}>{confidenceLabel(item.confidence)}</div>
      </div>
    </div>
  );
}
