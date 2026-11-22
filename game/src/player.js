// player.js — Sable, the thief: movement, tiptoe, carrying weight, and
// collision against the tile grid. Heavier bags mean slower feet.
'use strict';

function createPlayer(x, y) {
  return {
    x, y,                     // pixel position (centre)
    dir: 0,                   // facing angle
    moving: false,
    sneak: false,
    lootValue: 0,             // dollars carried
    slots: 0,                 // carry slots filled (max MAX_SLOTS)
    stepT: 0,                 // footstep sound timer
  };
}

function playerSpeed(p) {
  let s = PLAYER_SPEED * (1 - CARRY_SLOW * p.slots);
  if (p.sneak) s *= SNEAK_MULT;
  return Math.max(45, s);
}

// Circle-vs-grid collision: true when a circle at (x, y) overlaps a tile
// that blocks movement.
function circleHitsWall(grid, x, y, r, openDoors) {
  const x0 = Math.floor((x - r) / TILE);
  const x1 = Math.floor((x + r) / TILE);
  const y0 = Math.floor((y - r - GRID_TOP) / TILE);
  const y1 = Math.floor((y + r - GRID_TOP) / TILE);
  for (let ty = y0; ty <= y1; ty += 1) {
    for (let tx = x0; tx <= x1; tx += 1) {
      if (!isBlockingTile(grid, tx, ty, openDoors)) continue;
      // Nearest point of the tile to the circle centre.
      const nx = Math.max(tx * TILE, Math.min(x, tx * TILE + TILE));
      const ny = Math.max(GRID_TOP + ty * TILE, Math.min(y, GRID_TOP + ty * TILE + TILE));
      const dx = x - nx, dy = y - ny;
      if (dx * dx + dy * dy < r * r) return true;
    }
  }
  return false;
}

function updatePlayer(p, dt, input, game) {
  const grid = game.level.map;
  const openDoors = game.openDoors;
  // Channelling a tool roots the thief in place.
  if (game.tools.channel) {
    p.moving = false;
    return;
  }
  let dx = 0, dy = 0;
  if (input.left) dx -= 1;
  if (input.right) dx += 1;
  if (input.up) dy -= 1;
  if (input.down) dy += 1;
  p.sneak = !!input.sneak;
  p.moving = dx !== 0 || dy !== 0;
  if (p.moving) {
    const len = Math.hypot(dx, dy);
    dx /= len; dy /= len;
    const speed = playerSpeed(p);
    const nx = p.x + dx * speed * dt;
    const ny = p.y + dy * speed * dt;
    p.dir = Math.atan2(dy, dx);
    if (!circleHitsWall(grid, nx, p.y, PLAYER_RADIUS, openDoors)) p.x = nx;
    if (!circleHitsWall(grid, p.x, ny, PLAYER_RADIUS, openDoors)) p.y = ny;
    // Footsteps: quieter and slower while sneaking.
    p.stepT -= dt;
    if (p.stepT <= 0) {
      p.stepT = p.sneak ? 0.62 : 0.42;
      audioStep(p.sneak);
    }
  }
  // Cash on the floor is scooped up by walking over it — or standing on it.
  for (const loot of game.loot) {
    if (loot.kind !== 'cash' || loot.taken) continue;
    const cx = tileCenterX(loot.x), cy = tileCenterY(loot.y);
    if (Math.hypot(cx - p.x, cy - p.y) < TILE * 0.7) takeLoot(game, loot);
  }
  // Reaching the exit advances the job (when the room goal is met).
  const ex = tileCenterX(game.level.exit.x), ey = tileCenterY(game.level.exit.y);
  if (Math.hypot(ex - p.x, ey - p.y) < TILE * 0.8) {
    if (roomGoalMet(game)) reachExit(game);
  }
}

function roomGoalMet(game) {
  const goal = game.level.goal;
  if (goal.needStar) return game.stats.starTaken;
  return game.player.lootValue >= goal.minLoot;
}

function reachExit(game) {
  if (game.phase === 'getaway') return; // the van is the exit now
  if (game.levelIndex < LEVELS.length - 1) {
    game.levelIndex += 1;
    enterPlan(game);
  } else {
    finishRun(game, 'CLEAN');
  }
}
