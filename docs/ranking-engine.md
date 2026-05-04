# Ranking Engine

The ranking system is legitimacy-first and confidence-based.

Core concepts:
- rating
- confidence
- vote trust
- user trust

New contenders should move more aggressively.
Established contenders should stabilize over time.

Trust-weighted voting is required.

Fast/rushed voting should reduce trust score and influence.

Users who repeatedly vote without watching should have lower impact on hierarchy movement.

Possible formula:
finalVoteWeight = voteTrust * userTrust

Anti-manipulation concepts:
- no self battles
- no repeated easy farming
- stale matchup prevention

3-win streak logic:
If a contender wins 3 times in a row:
- trigger a defender/champion moment
- rotate both current contenders out
- load two fresh contenders

Goal:
maintain competitive freshness while preserving hierarchy integrity.

---

## Implementation contract

Engineering behavior the ranking + pairing pipeline must satisfy. Details may evolve; intent stays stable.

### Ratings Scope

- **Per-arena only:** Each contender’s `rating` / `confidence` / W–L apply within one `(arenaId, media type)` lane. No cross-arena rating merge in v1.
- **Ordering:** Leaderboards and sorting use that lane only.

### Pairing

- **No self battles:** A battle pair must be two distinct contender IDs.
- **Anti-repeat:** Matchmaking must exclude immediate repeats and reduce recycled pairs (e.g. exclude recent opponents / recent IDs from a sliding window). Exact mechanism can tighten over time; “same two clips again too soon” is invalid.

### Vote Weight

- **Vote trust `voteTrust(ms)`:** Derived from time since last battle unlock → vote (longer deliberation → higher weight within caps).
- **User trust `userTrust`:** Session-level multiplier; rushed voting decreases it, deliberate voting increases it within `[min, max]`.
- **Combined weight:** Effective vote strength uses **`voteTrust * userTrust`** (see formula above). Ranking deltas use this product, not raw taps.

### Session-First Trust (Now -> Later)

- **Now:** Trust state is **in-memory per browser session** (no durable identity required). Resets on full reload are acceptable for prototype.
- **Later:** Backend may persist trust **per user / device / session**, decay over time, or reconcile across tabs—without changing the mathematical role of `voteTrust * userTrust` at the client.

### 3-Win Streak Rotation

- When the **same contender wins three battles in a row** (streak on that contender): show the champion moment, then **clear both slots from the current pair**, pick **two fresh contenders** from the arena pool (per pairing rules). Not a partial swap unless product explicitly changes.

### Out Of Scope For This Contract

- Global or cross-arena Elo, tournaments, sponsored arenas, or moderation unless added under a new spec revision.
