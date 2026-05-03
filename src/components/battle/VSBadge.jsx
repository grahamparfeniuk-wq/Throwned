export function VSBadge({ accent, styles, impactHit }) {
  const hit = !!impactHit;
  return (
    <div style={styles.vsLayer}>
      <div
        style={{
          ...styles.vsDiamond,
          borderColor: `${accent}aa`,
          boxShadow: hit
            ? `0 0 0 1px rgba(0,0,0,.95), 0 0 34px ${accent}44`
            : `0 0 0 1px rgba(0,0,0,.95), 0 0 26px ${accent}28`,
          transform: hit ? "rotate(45deg) scale(1.05)" : styles.vsDiamond.transform,
          transition: "transform 90ms ease-out, box-shadow 90ms ease-out",
        }}
      >
        <div style={styles.vsInner}>VS</div>
      </div>
    </div>
  );
}
