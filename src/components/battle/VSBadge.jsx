export function VSBadge({ accent, styles, impactHit }) {
  const hit = !!impactHit;
  return (
    <div style={styles.vsLayer}>
      <div
        style={{
          ...styles.vsDiamond,
          borderColor: `${accent}77`,
          boxShadow: hit
            ? `0 0 0 1px rgba(0,0,0,.94), 0 0 22px ${accent}38, inset 0 1px 0 rgba(255,255,255,.07)`
            : `0 0 0 1px rgba(0,0,0,.94), 0 0 18px ${accent}22, inset 0 1px 0 rgba(255,255,255,.05)`,
          transform: hit ? "rotate(45deg) scale(1.03)" : styles.vsDiamond.transform,
          transition: "transform 95ms ease-out, box-shadow 95ms ease-out, border-color 95ms ease-out",
        }}
      >
        <div style={styles.vsInner}>VS</div>
      </div>
    </div>
  );
}
