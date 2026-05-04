export const EVENT_TYPES = Object.freeze({
  CONTENDER_TOP10: "contender_top10",
  HOMETOWN_RISING: "hometown_rising",
  RIVAL_EMERGED: "rival_emerged",
  ARENA_LAUNCHED: "arena_launched",
  CHALLENGE_INVITE: "challenge_invite",
  BACKED_CONTENDER_CLIMBING: "backed_contender_climbing",
});

export function createEventHookBus() {
  const events = [];
  return {
    emit(event) {
      if (!event || !event.type) return;
      events.push({ ...event, at: Date.now() });
    },
    all() {
      return events.slice();
    },
  };
}

export function deriveBattleEvents({ arena, winner, loser, oldWinnerRank, newWinnerRank }) {
  const emitted = [];
  if (!arena || !winner || !loser) return emitted;

  if (newWinnerRank <= 10 && oldWinnerRank > 10) {
    emitted.push({
      type: EVENT_TYPES.CONTENDER_TOP10,
      arenaId: arena.id,
      contenderId: winner.id,
      title: `${winner.creator} entered Top 10`,
    });
  }

  if (winner.hometown && oldWinnerRank > newWinnerRank) {
    emitted.push({
      type: EVENT_TYPES.HOMETOWN_RISING,
      arenaId: arena.id,
      contenderId: winner.id,
      title: `${winner.hometown} contender is rising`,
    });
  }

  if (Math.abs((winner.rating || 0) - (loser.rating || 0)) < 28) {
    emitted.push({
      type: EVENT_TYPES.RIVAL_EMERGED,
      arenaId: arena.id,
      contenderIds: [winner.id, loser.id],
      title: "A rival emerged",
    });
  }

  emitted.push({
    type: EVENT_TYPES.BACKED_CONTENDER_CLIMBING,
    arenaId: arena.id,
    contenderId: winner.id,
    title: "A contender you backed is climbing",
  });

  return emitted;
}

