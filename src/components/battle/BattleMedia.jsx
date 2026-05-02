export function BattleMedia({ item, refProp, onError, styles }) {
  const mediaStyle = {
    ...styles.mediaFill,
    objectFit: "cover",
    objectPosition: item?.position || "center center",
  };

  if (item.type === "video") {
    return (
      <video
        ref={refProp}
        src={item.src}
        playsInline
        preload="auto"
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
      style={mediaStyle}
      onError={onError}
    />
  );
}
