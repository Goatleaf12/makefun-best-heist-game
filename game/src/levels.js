// levels.js — DATA for the three rooms of the Meridian Exchange.
// Tile legend: # wall · . floor · T marble table · P pillar · G glass case
//   D locked door · V vault door · X exit / van spot · * the Meridian Star
//   C cash · L painting (loot letters live in LOOT, not in the map).
// Patrols are named waypoint lists; cameras are named sweep definitions.
// Everything here is drawn on the PLAN screen and driven by the real systems.
'use strict';

// --- Room 1: The Gilt Lobby ---------------------------------------------
const LOBBY_MAP = [
  '################################',
  '#..............................#',
  '#..C....P..........P......C....#',
  '#..............................#',
  '#....TTTT.....G......TTTT......#',
  '#..............................#',
  '#..P.........L.........P.......#',
  '#..............................#',
  '#......G.............G.........#',
  '#..............................#',
  '#..C....P..........P......C....#',
  '#..............................#',
  '#....TTTT.....L......TTTT......#',
  '#..............................#',
  '#............................X.#',
  '################################',
];

// --- Room 2: The Auction Hall -------------------------------------------
const HALL_MAP = [
  '################################',
  '#..............................#',
  '#..C...P...........P.....C.....#',
  '#..............................#',
  '#...TTTTTT....G.....TTTTTT.....#',
  '#..............................#',
  '#.P......L.............L....P..#',
  '#..............................#',
  '#.....G....###D###.....G.......#',
  '#..............................#',
  '#..C...P...........P.....C.....#',
  '#..............................#',
  '#...TTTTTT....G.....TTTTTT.....#',
  '#..............................#',
  '#............................X.#',
  '################################',
];

// --- Room 3: The Vault Antechamber + Vault ------------------------------
const VAULT_MAP = [
  '################################',
  '#..............................#',
  '#..C....P..........P......C....#',
  '#..............................#',
  '#....TTTT.....G......TTTT......#',
  '#..............................#',
  '#..P.........L.........P.......#',
  '#..............................#',
  '#......G.............G.........#',
  '#..............................#',
  '#..C....P..........P......C....#',
  '#..............................#',
  '#...........###V###............#',
  '#...........#..*..#............#',
  '#...........#######..........X.#',
  '################################',
];

// Named patrol routes: each guard walks its waypoints in order, waits and
// sweeps its gaze at the listed stops. Coordinates are tiles.
const PATROLS = {
  lobbyWarden: [
    { x: 9, y: 3, wait: 1.5 }, { x: 26, y: 3, wait: 1.5 },
    { x: 26, y: 13, wait: 2, look: 1.57 }, { x: 9, y: 13, wait: 1.5 },
  ],
  lobbyRover: [
    { x: 16, y: 7, wait: 2 }, { x: 24, y: 7, wait: 1 },
    { x: 24, y: 11, wait: 2 }, { x: 12, y: 11, wait: 1 }, { x: 12, y: 7, wait: 1 },
  ],
  auctionLead: [
    { x: 10, y: 3, wait: 1.5 }, { x: 27, y: 3, wait: 1.5 },
    { x: 27, y: 13, wait: 2, look: 1.57 }, { x: 10, y: 13, wait: 1.5 },
  ],
  auctionSweep: [
    { x: 21, y: 5, wait: 2 }, { x: 21, y: 10, wait: 1 },
    { x: 25, y: 10, wait: 2 }, { x: 25, y: 5, wait: 1 },
  ],
  balconyWatch: [
    { x: 4, y: 6, wait: 2 }, { x: 4, y: 11, wait: 2 },
    { x: 8, y: 11, wait: 1 }, { x: 8, y: 6, wait: 1 },
  ],
  vaultChief: [
    { x: 10, y: 3, wait: 1 }, { x: 26, y: 3, wait: 1 },
    { x: 26, y: 11, wait: 2 }, { x: 10, y: 11, wait: 1 },
  ],
  vaultRover: [
    { x: 16, y: 5, wait: 2 }, { x: 16, y: 9, wait: 1 },
    { x: 24, y: 9, wait: 2 }, { x: 24, y: 5, wait: 1 },
  ],
  starGuard: [
    { x: 13, y: 11, wait: 2 }, { x: 21, y: 11, wait: 2 },
    { x: 21, y: 9, wait: 1 }, { x: 13, y: 9, wait: 1 },
  ],
};

// Named cameras: wall-mounted, sweeping cones of blue-white light.
// x, y in tiles; base = centre angle (radians, 0 = east, +y = south);
// sweep = half-amplitude of the oscillation; period in seconds.
const CAMERAS = {
  hallCamNorth: { x: 16, y: 1, base: 1.57, sweep: 0.9, period: 6 },
  hallCamEast: { x: 30, y: 8, base: 3.14, sweep: 0.7, period: 8 },
  vaultCam: { x: 16, y: 11, base: -1.57, sweep: 0.8, period: 5 },
  vaultCamWest: { x: 1, y: 7, base: 0, sweep: 0.6, period: 7 },
};

// Loot: kind cash (instant on touch, no slot) · painting (1s lift, 1 slot) ·
// jewel (inside a glass case, needs the cutter or a smash) · star (the job).
// value in dollars; weight in carry slots.
const LOOT = {
  lobby: [
    { x: 3, y: 2, kind: 'cash', value: 200, weight: 0 },
    { x: 26, y: 2, kind: 'cash', value: 200, weight: 0 },
    { x: 3, y: 10, kind: 'cash', value: 150, weight: 0 },
    { x: 26, y: 10, kind: 'cash', value: 150, weight: 0 },
    { x: 13, y: 6, kind: 'painting', value: 900, weight: 1 },
    { x: 14, y: 12, kind: 'painting', value: 900, weight: 1 },
    { x: 14, y: 4, kind: 'jewel', value: 1400, weight: 1 },
    { x: 7, y: 8, kind: 'jewel', value: 1400, weight: 1 },
    { x: 21, y: 8, kind: 'jewel', value: 1400, weight: 1 },
  ],
  hall: [
    { x: 3, y: 2, kind: 'cash', value: 250, weight: 0 },
    { x: 25, y: 2, kind: 'cash', value: 250, weight: 0 },
    { x: 3, y: 10, kind: 'cash', value: 200, weight: 0 },
    { x: 25, y: 10, kind: 'cash', value: 200, weight: 0 },
    { x: 9, y: 6, kind: 'painting', value: 1000, weight: 1 },
    { x: 23, y: 6, kind: 'painting', value: 1000, weight: 1 },
    { x: 14, y: 4, kind: 'jewel', value: 1600, weight: 1 },
    { x: 6, y: 8, kind: 'jewel', value: 1600, weight: 1 },
    { x: 23, y: 8, kind: 'jewel', value: 1600, weight: 1 },
  ],
  vault: [
    { x: 3, y: 2, kind: 'cash', value: 300, weight: 0 },
    { x: 26, y: 2, kind: 'cash', value: 300, weight: 0 },
    { x: 3, y: 10, kind: 'cash', value: 250, weight: 0 },
    { x: 26, y: 10, kind: 'cash', value: 250, weight: 0 },
    { x: 13, y: 6, kind: 'painting', value: 1200, weight: 1 },
    { x: 14, y: 4, kind: 'jewel', value: 1800, weight: 1 },
    { x: 7, y: 8, kind: 'jewel', value: 1800, weight: 1 },
    { x: 21, y: 8, kind: 'jewel', value: 1800, weight: 1 },
    { x: 15, y: 13, kind: 'star', value: 5000, weight: 1 },
  ],
};

// Three entry points per room. x, y in tiles; alarm = starting alarm cost;
// note is shown on the PLAN screen.
const ENTRIES = {
  lobby: [
    { id: 'front', label: 'FRONT DOOR', x: 2, y: 14, alarm: 0, note: 'Quiet street entrance' },
    { id: 'service', label: 'SERVICE DOCK', x: 29, y: 2, alarm: 0, note: 'Near the cases, far from guards' },
    { id: 'vent', label: 'SKYLIGHT VENT', x: 16, y: 7, alarm: 10, note: 'Drop in by the loot — noisy landing' },
  ],
  hall: [
    { id: 'front', label: 'FRONT DOOR', x: 2, y: 14, alarm: 0, note: 'Main doors, under the north camera' },
    { id: 'service', label: 'SERVICE DOCK', x: 29, y: 2, alarm: 0, note: 'Back corridor, out of the sweep' },
    { id: 'vent', label: 'SKYLIGHT VENT', x: 16, y: 7, alarm: 10, note: 'Drop onto the auction floor' },
  ],
  vault: [
    { id: 'front', label: 'FRONT DOOR', x: 2, y: 14, alarm: 0, note: 'Through the antechamber' },
    { id: 'service', label: 'SERVICE DOCK', x: 29, y: 2, alarm: 0, note: 'East wall, near the cash' },
    { id: 'vent', label: 'SKYLIGHT VENT', x: 16, y: 10, alarm: 10, note: 'Drop right by the vault door' },
  ],
};

const LEVELS = [
  {
    id: 'lobby', name: 'THE GILT LOBBY', sub: 'Room 1 of 3 — learn the ropes',
    map: LOBBY_MAP, patrols: ['lobbyWarden', 'lobbyRover'], cameras: [],
    loot: LOOT.lobby, entries: ENTRIES.lobby, exit: { x: 29, y: 14 },
    goal: { text: 'Take at least $500 of loot, then reach the exit', minLoot: 500 },
  },
  {
    id: 'hall', name: 'THE AUCTION HALL', sub: 'Room 2 of 3 — cameras watch here',
    map: HALL_MAP, patrols: ['auctionLead', 'auctionSweep', 'balconyWatch'],
    cameras: ['hallCamNorth', 'hallCamEast'],
    loot: LOOT.hall, entries: ENTRIES.hall, exit: { x: 29, y: 14 },
    goal: { text: 'Take at least $1,500 of loot, then reach the exit', minLoot: 1500 },
  },
  {
    id: 'vault', name: 'THE VAULT ANTECHAMBER', sub: 'Room 3 of 3 — the Meridian Star',
    map: VAULT_MAP, patrols: ['vaultChief', 'vaultRover', 'starGuard'],
    cameras: ['vaultCam', 'vaultCamWest'],
    loot: LOOT.vault, entries: ENTRIES.vault, exit: { x: 29, y: 14 },
    goal: { text: 'Take the Meridian Star, then reach the van', needStar: true },
  },
];
