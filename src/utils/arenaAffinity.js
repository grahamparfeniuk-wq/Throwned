function now() {
  return Date.now();
}

export function createArenaAffinityTracker() {
  const state = {
    arenas: {},
    contenders: {},
  };

  function ensureArena(arenaId) {
    if (!state.arenas[arenaId]) {
      state.arenas[arenaId] = {
        viewed: 0,
        voted: 0,
        revisited: 0,
        lastViewedAt: 0,
      };
    }
    return state.arenas[arenaId];
  }

  function ensureContender(contenderId) {
    if (!state.contenders[contenderId]) {
      state.contenders[contenderId] = {
        supports: 0,
        lastSupportedAt: 0,
      };
    }
    return state.contenders[contenderId];
  }

  return {
    recordArenaViewed(arenaId) {
      if (!arenaId) return;
      const arena = ensureArena(arenaId);
      if (arena.lastViewedAt > 0) arena.revisited += 1;
      arena.viewed += 1;
      arena.lastViewedAt = now();
    },
    recordVote(arenaId, winnerId) {
      if (!arenaId || !winnerId) return;
      const arena = ensureArena(arenaId);
      arena.voted += 1;
      const contender = ensureContender(winnerId);
      contender.supports += 1;
      contender.lastSupportedAt = now();
    },
    snapshot() {
      return {
        arenas: { ...state.arenas },
        contenders: { ...state.contenders },
      };
    },
  };
}

