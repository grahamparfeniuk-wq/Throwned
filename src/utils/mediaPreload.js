/** Max contender URLs to hint ahead of the next swap (rank-ordered pool excludes current pair). */
const BATTLE_PRELOAD_CAP = 10;

/**
 * Adds `<link rel="preload">` rows for likely next battle media so swaps hit warm cache.
 * Returns a teardown that removes those nodes.
 */
export function attachBattleMediaPreloads(items, pair) {
  if (!pair?.first?.id || !pair?.second?.id || !items?.length) {
    return () => {};
  }

  const inPair = new Set([pair.first.id, pair.second.id]);
  const rest = items.filter((x) => !inPair.has(x.id));
  const candidates = rest.slice(0, BATTLE_PRELOAD_CAP);

  const seen = new Set();
  const links = [];

  for (const item of candidates) {
    const url = item?.src;
    if (!url || seen.has(url)) continue;
    seen.add(url);

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = item.type === "video" ? "video" : "image";
    link.href = url;
    document.head.appendChild(link);
    links.push(link);
  }

  return () => {
    for (const link of links) {
      link.remove();
    }
  };
}
