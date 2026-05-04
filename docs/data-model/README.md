# Data Model

## Arena

- id
- slug
- title
- type
- accentColor
- createdAt

## Media

- id
- arenaId
- contenderId
- type
- src
- thumbnail
- title
- rating
- confidence
- wins
- losses
- createdAt

## Contender Identity

- contenderId
- hometown
- country
- archetype
- identitySignals[]
- affiliationTags[] (optional, doctrine-safe usage only)

## Vote

- id
- winnerId
- loserId
- arenaId
- voteTrust
- userTrust
- sessionId
- createdAt

## Session

- id
- trustScore
- createdAt

## Arena Affinity

- sessionId
- arenaId
- viewedCount
- votedCount
- revisitedCount
- lastViewedAt

## Contender Support

- sessionId
- contenderId
- supportCount
- lastSupportedAt

## Challenge Seed (Foundation)

- id
- type (creator, friend, sponsored, regional_ladder, local_competition, championship)
- arenaId
- contenderIds[]
- region (optional)
- sponsor (optional)
- createdAt

## Event Hook (Foundation)

- id (optional runtime)
- type
- arenaId
- contenderId or contenderIds[]
- title
- at