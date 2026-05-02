export function VSBadge({ accent, styles }) {
  return (
    <div style={styles.vsLayer}>
      <div
        style={{
          ...styles.vsDiamond,
          borderColor: `${accent}aa`,
          boxShadow: `0 0 0 1px rgba(0,0,0,.95), 0 0 26px ${accent}28`,
        }}
      >
        <div style={styles.vsInner}>VS</div>
      </div>
    </div>
  );
}
