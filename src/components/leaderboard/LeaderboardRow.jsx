import { confidenceLabel } from "../../utils/ranking";
import { LeaderboardThumb } from "./LeaderboardThumb";

export function LeaderboardRow({ item, index, accent, styles, isContender }) {
  const rank = index + 1;
  const top = index === 0;
  const podium = index === 0 ? styles.lbPodium1 : index === 1 ? styles.lbPodium2 : index === 2 ? styles.lbPodium3 : null;

  const rowSurface = {
    ...styles.lbRow,
    ...(podium || {}),
    ...(isContender
      ? {
          ...styles.lbRowContender,
          boxShadow: `inset 3px 0 0 ${accent}55`,
          borderColor: "rgba(255,255,255,.11)",
        }
      : {}),
  };

  return (
    <div style={rowSurface}>
      <div
        style={{
          ...styles.lbRank,
          color: top ? accent : index < 3 ? "rgba(255,255,255,.68)" : "rgba(255,255,255,.52)",
        }}
      >
        #{rank}
      </div>
      <LeaderboardThumb item={item} styles={styles} />
      <div style={styles.lbRowMain}>
        <div style={styles.lbRowTop}>
          <div style={styles.lbTitleBlock}>
            <div style={styles.lbItemTitle}>{item.title}</div>
            <div style={styles.lbItemCreator}>{item.creator}</div>
          </div>
          {/* Follow placeholder only — future: rank-move alerts for this creator, arenas they compete in, quick-jump; no notifications/profiles yet */}
          <button
            type="button"
            style={styles.lbFollow}
            disabled
            aria-disabled="true"
            title="Placeholder. Future: notifications when this creator moves up/down in rankings, which arenas they’re active in, and quick jump into those arenas."
          >
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
