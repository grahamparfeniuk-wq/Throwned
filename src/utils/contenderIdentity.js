const MAX_SIGNALS = 4;

function asTrimmed(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function dedupe(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

export function normalizeIdentityMeta(item = {}) {
  const identity = item.identity || {};
  return {
    hometown: asTrimmed(item.hometown || identity.hometown),
    country: asTrimmed(item.country || identity.country),
    archetype: asTrimmed(identity.archetype || item.creatorArchetype),
    signals: dedupe([...(Array.isArray(identity.signals) ? identity.signals : []), ...(Array.isArray(item.identitySignals) ? item.identitySignals : [])]).slice(0, 8),
  };
}

export function topIdentitySignals(item) {
  const normalized = normalizeIdentityMeta(item);
  const seeds = [
    normalized.hometown,
    normalized.country,
    normalized.archetype,
    ...normalized.signals,
  ];
  return dedupe(seeds).slice(0, MAX_SIGNALS);
}

