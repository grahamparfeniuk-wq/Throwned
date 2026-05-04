export const CHALLENGE_TYPES = Object.freeze({
  CREATOR: "creator",
  FRIEND: "friend",
  SPONSORED: "sponsored",
  REGIONAL_LADDER: "regional_ladder",
  LOCAL_COMPETITION: "local_competition",
  CHAMPIONSHIP: "championship",
});

export function createChallengeFoundation() {
  const seeds = [];

  return {
    stageChallengeSeed(seed) {
      if (!seed || !seed.type || !seed.arenaId) return null;
      const staged = {
        id: `${seed.type}:${seed.arenaId}:${Date.now()}`,
        type: seed.type,
        arenaId: seed.arenaId,
        contenderIds: Array.isArray(seed.contenderIds) ? seed.contenderIds.slice(0, 32) : [],
        region: seed.region || null,
        sponsor: seed.sponsor || null,
        createdAt: Date.now(),
      };
      seeds.push(staged);
      return staged;
    },
    listSeeds() {
      return seeds.slice();
    },
  };
}

