# Product Scope

## Phase 2 Definition of Done

Phase 2 is successful when Throwned has a stable, mobile-tested battle experience with clean architecture and a clear path to backend persistence.

Phase 2 does not require full production backend yet.

Phase 2 must include:
- smooth mobile battle UX
- stable portrait and landscape layouts
- gesture-first navigation
- reliable pause/resume
- arena selector/search
- upload flow that works locally
- crop preview for uploads
- modular frontend architecture
- Vercel mobile testing workflow
- clear data model docs for backend

## Current Non-Goals

Do not build these yet:
- native iOS/Android app
- paid competitions
- comments
- messaging
- complex social graph
- creator monetization
- advanced moderation workflow
- full recommendation engine
- live streaming
- betting/gambling
- NFTs/crypto

## Identity

Start with anonymous session identity.

Users should be able to:
- vote
- upload
- participate in arenas

Later, add accounts for:
- creator profiles
- upload ownership
- leaderboard history
- anti-cheat
- private competitions

## Upload Ownership

Each uploaded media item should eventually have:
- creator/session/user id
- title
- arena id
- media type
- source URL
- upload timestamp
- rating
- confidence
- wins
- losses
- status

Users should eventually be able to edit/delete their own uploads.

## Pairing Policy

Match content primarily within the same arena.

Avoid:
- self-battles
- immediate repeats
- stale matchups
- one item farming the same weak opponents

Pairing should balance:
- fairness
- freshness
- competitive tension
- enough randomness to feel alive

## Ranking Contract

Ratings are per-arena.

A clip can become strong in one arena without implying global dominance.

Future possibility:
- global creator score
- cross-arena champion events
- seasonal tournaments

## Streak Rule

If the same item wins 3 times in a row:
- show a subtle champion/defender moment
- rotate both current contenders out
- load two fresh contenders

This keeps the feed fresh and reduces gaming.

## Trust Logic

Vote trust should be based partly on watch behavior.

Rushed votes should count less.

Repeated rushed voting should reduce user/session influence.

Initial implementation can be session-based.

Future backend implementation may persist trust:
- per session
- per user
- per device
- over time

## Moderation and Safety

Initial prototype does not need full moderation.

Future uploaded content will require:
- reporting
- removal
- NSFW filtering
- copyright/music policy
- age-sensitive handling
- abuse prevention

## Analytics Events To Track Later

Important future events:
- arena_viewed
- battle_loaded
- vote_cast
- vote_rushed
- contender_uploaded
- upload_completed
- arena_switched
- leaderboard_opened
- details_opened
- champion_streak_triggered

## Accessibility Minimum

Phase 2 should not over-optimize accessibility yet, but should avoid obvious blockers.

Minimum:
- overlays should be readable
- controls should not require tiny taps
- reduced motion should be considered later
- keyboard/focus support can come after core mobile UX stabilizes