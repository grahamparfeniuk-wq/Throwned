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
- creatorId
- type
- src
- thumbnail
- title
- rating
- confidence
- wins
- losses
- createdAt

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