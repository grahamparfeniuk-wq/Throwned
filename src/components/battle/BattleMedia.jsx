export function BattleMedia({ item, refProp, priority, onError, styles }) {
  const mediaStyle = {
    ...styles.mediaFill,
    objectFit: "cover",
    objectPosition: item?.position || "center center",
  };

  const fetchPriority = priority ? "high" : "low";

  if (item.type === "video") {
    return (
      <video
        ref={refProp}
        src={item.src}
        playsInline
        preload="auto"
        fetchPriority={fetchPriority}
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
      decoding="async"
      fetchPriority={fetchPriority}
      style={mediaStyle}
      onError={onError}
    />
  );
}
