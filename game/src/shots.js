// shots.js — deterministic screenshot scenes (?shot=...&seed=N).
// Every scene stages the REAL game state and lets the normal renderer draw
// it: the same guards, cones, cameras and alarm the player meets. Nothing
// here is a pasted picture. When the scene is drawn, window.__shotReady
// tells the screenshot driver to capture.
'use strict';

function shotRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Place a guard at a tile, facing `dir`, in a given state with a mark.
function stageGuard(game, patrolKey, tx, ty, dir, state, mark) {
  const g = game.guards.find((gg) => gg.patrolKey === patrolKey);
  if (!g) return;
  g.x = tileCenterX(tx);
  g.y = tileCenterY(ty);
  g.dir = dir;
  g.state = state || 'patrol';
  g.mark = mark || null;
  g.waitLeft = 999; // hold the pose for the shot
}

function setupShot(game, name, seed) {
  const rng = shotRng(seed || 1);
  game.shotFrozen = true; // the scene holds still; only sparkle time advances
  if (name === 'action') {
    // COVER — one complete heist frame in the Auction Hall.
    loadLevel(game, 1);
    startLevel(game, 0);
    const p = game.player;
    p.x = tileCenterX(16); p.y = tileCenterY(5); p.dir = 0.5; // crossing, behind the auction tables
    p.lootValue = 1240; p.slots = 2;
    game.tools.empLeft = 1; game.tools.coinsLeft = 2;
    game.alarm.value = 45; game.alarm.tier = alarmTier(45);
    stageGuard(game, 'auctionLead', 11, 5, 0, 'patrol', null);      // cone sweeps across the thief
    stageGuard(game, 'balconyWatch', 5, 9, -0.4, 'patrol', null);   // second guard, lower left
    stageGuard(game, 'auctionSweep', 22, 10, 2.6, 'suspicious', '?');
    const cam = game.cameras[0];
    if (cam) cam.angle = 1.9; // north camera sweeping down over the floor
    game.message = 'Stay out of the gold. Stay out of the blue.';
    game.messageT = 999;
  } else if (name === 'plan') {
    // CASING — the blueprint screen for the Auction Hall.
    game.levelIndex = 1;
    game.level = LEVELS[1];
    game.screen = 'plan';
    game.planHover = 1;
    game.planButtons = null;
  } else if (name === 'alert') {
    // TENSION — HUNT at ~70%, one camera EMP-dead, thief behind a pillar.
    loadLevel(game, 1);
    startLevel(game, 0);
    const p = game.player;
    p.x = tileCenterX(7); p.y = tileCenterY(3); p.dir = 2.4; // tucked behind the pillar at (6,2)
    p.lootValue = 2100; p.slots = 1; // carrying a painting
    game.tools.empLeft = 1; game.tools.coinsLeft = 1;
    game.alarm.value = 70; game.alarm.tier = alarmTier(70);
    game.alarm.maxValue = 70;
    stageGuard(game, 'auctionSweep', 12, 5, 0.9, 'hunt', '!');
    stageGuard(game, 'balconyWatch', 4, 9, 0.2, 'suspicious', '?');
    stageGuard(game, 'auctionLead', 24, 12, -1.8, 'patrol', null);
    const cam = game.cameras[0];
    if (cam) { cam.disabledUntil = game.time + 10; cam.sparkT = 0.2; }
    const cam2 = game.cameras[1];
    if (cam2) cam2.angle = 2.4;
    game.message = 'HUNT — break line of sight and the alarm drains.';
    game.messageT = 999;
  } else if (name === 'getaway') {
    // THE PAYOFF — thief at the van with the Star, results panel on top.
    loadLevel(game, 2);
    startLevel(game, 2);
    const p = game.player;
    p.x = tileCenterX(27); p.y = tileCenterY(14); p.dir = 0; // beside the van, not on top of it
    p.lootValue = 8640; p.slots = 2;
    takeLootSilent(game, 'star');
    game.phase = 'getaway';
    game.getawayT = 18.4;
    game.message = 'STAR SECURED — the van is waiting. Go!';
    game.messageT = 999;
    game.alarm.value = 38; game.alarm.tier = alarmTier(38);
    game.alarm.maxValue = 68;
    game.stats.timesSeen = 2;
    game.tools.empUsed = 1; game.tools.coinsUsed = 2;
    game.results = {
      rating: 'CLEAN', loot: 8640, score: 8208, timeText: '04:37', maxAlarm: 68,
      timesSeen: 2, empUsed: 1, coinsUsed: 2, entryLabel: 'SKYLIGHT VENT',
      lateVan: false,
    };
    game.screen = 'win';
  } else {
    return false;
  }
  game.shotReadyIn = 3; // frames to let the scene settle before capture
  return true;
}

// Mark the Star taken without triggering the getaway timer (shot staging).
function takeLootSilent(game, kind) {
  for (const loot of game.loot) {
    if (loot.kind === kind && !loot.taken) {
      loot.taken = true;
      if (kind === 'star') game.stats.starTaken = true;
    }
  }
}
