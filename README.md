# GILT &amp; SMOKE — The Meridian Job


[![Competition](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

[![Rank](https://make.fun/badge/best-heist-game-20261122-0559/Goatleaf12/makefun-best-heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

[![Reward](https://make.fun/badge/best-heist-game-20261122-0559/Goatleaf12/makefun-best-heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

A top-down 2D heist game for the [make.fun](https://make.fun/bounty/best-heist-game-20261122-0559)
**best-heist-game-20261122-0559** bounty. Vanilla JavaScript + Canvas 2D,
procedural art-deco art, synthesized WebAudio — no libraries, no network,
no assets from anywhere else. Every name, room and sound is original.

## The game

You are **Sable**, a shadow thief inside the **Meridian Exchange** — a
brass-and-marble auction house, closed for the night. Case the joint, pick
your way in, take the **Meridian Star** from its vault, and reach the
getaway van — best if the alarm never sounds at all.

- **Three hand-built rooms** — The Gilt Lobby, The Auction Hall, The Vault
  Antechamber + Vault — each with several routes: front door, service dock,
  skylight vent, or straight across the auction floor.
- **A CASING / PLAN screen before every room**: the blueprint shows guard
  patrol routes with arrows, camera sweep arcs, tiered loot icons, and
  three entry points to choose with the mouse. The plan you read is the
  getaway you get.
- **Guards with raycast vision cones** (`PATROLS` in `game/src/levels.js`):
  pillars, tables and glass cases cut the light. Cones shift pale gold →
  orange → red as the alarm climbs.
- **Wall cameras with their own sweeping blue-white cones** (`CAMERAS` in
  `game/src/levels.js`): slower to spot you than a guard, but they never
  lose you while you stand in the light. An EMP pulse kills them for 10s.
- **A global alarm meter that can always recover**: CALM → SUSPICIOUS
  ("?", a guard stops to stare) → HUNT (chase) → LOCKDOWN (doors sealed
  8s, then the meter drains again). You are only caught when a guard
  touches you while hunting, or you stand seen at full alarm for a second.
- **Tools, every one with a cost**: lockpick (2.5s, standing still and
  exposed), glass cutter (3s, silent), smash a case (instant, +25 alarm),
  EMP pulse (2×/room, −5% score each), decoy coin (click, 3×/room).
- **Tiered loot you carry**: cash (instant), paintings (1s lift, 1 slot),
  jewels (in glass cases), the Meridian Star. Every filled carry slot
  costs 8% of your speed — greed is slow.
- **A timed GETAWAY**: once the Star is taken, the van waits 45 seconds.
  Make it and the planning pays off; miss it and you escape on foot at
  −20% score. Ratings: GHOST (never seen, Star taken), CLEAN (no HUNT),
  MESSY (the alarm sounded but you got out), BUSTED (caught).

## Controls

| Key | Action |
| --- | --- |
| WASD / Arrows | Move |
| Shift | Tiptoe (slower, harder to spot) |
| E | Interact — lockpick / glass cutter / lift / take |
| F | Smash a glass case (loud: +25 alarm) |
| Q | EMP pulse (cameras dead 10s) |
| Click | Throw a decoy coin (lures guards) |
| 1 / 2 / 3 | Pick an entry point on the plan screen |
| Space | Start / continue / play again |
| P | Pause |
| M | Mute |
| R | Restart the job |

## Play it

Serve `game/` with any static server and open `index.html`, for example:

```sh
node serve.ts   # serves game/ on http://localhost:8080
```

Screenshot scenes (deterministic, rendered by the real game):

- `?shot=action` — the cover: crossing the Auction Hall under two cones and a camera, alarm half full
- `?shot=plan` — the casing screen: blueprint, patrol lines, camera arcs, three entries
- `?shot=alert` — HUNT at ~70%, one camera EMP-dead, thief behind a pillar with a painting
- `?shot=getaway` — the van, the Star taken, results and rating

## Hand-in

`main.ts` (Node 22, stdlib only) copies `game/` + `screenshots/` to
`/output` and writes `/output/dossier.json` via `vendor/makefun-game.ts`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Structure

- `game/src/config.js` — all tuned numbers in one place
- `game/src/levels.js` — the three rooms, named `PATROLS` routes, `CAMERAS`, `LOOT`, entries
- `game/src/vision.js` — vision cones + grid raycast line of sight
- `game/src/guards.js` — the guard state machine (patrol / suspicious / hunt / return)
- `game/src/cameras.js` — camera sweeps, EMP blackout, camera detection
- `game/src/alarm.js` — the recoverable alarm meter, tiers, lockdown, fair-catch rules
- `game/src/tools.js` — lockpick, glass cutter, smash, EMP, decoy coin, loot
- `game/src/player.js` — movement, tiptoe, carry weight, collision
- `game/src/audio.js` — synthesized WebAudio: footsteps panned by distance, stings, siren, jingle
- `game/src/render.js` — art-deco rooms, cones, loot glitter, van, HUD, all screens
- `game/src/plan.js` — the casing / plan screen
- `game/src/shots.js` — deterministic screenshot scenes
- `game/src/main.js` — the game loop, input, detection, getaway

## License

MIT — see `LICENSE`. SPDX-License-Identifier: MIT
