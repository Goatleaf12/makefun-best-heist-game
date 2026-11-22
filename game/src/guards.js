// guards.js — the guard state machine: patrol, suspicious, hunt, return.
// A guard walks named waypoints, pauses to sweep its gaze, investigates
// noises (coins) and last-seen positions, and chases when the alarm is high.
'use strict';

function tileCenterX(tx) { return tx * TILE + TILE / 2; }
function tileCenterY(ty) { return GRID_TOP + ty * TILE + TILE / 2; }

function createGuard(name, patrolKey) {
  const route = PATROLS[patrolKey];
  const first = route[0];
  return {
    name, patrolKey, route,
    x: tileCenterX(first.x), y: tileCenterY(first.y),
    dir: 0,                       // facing angle, radians
    wp: 1,                        // next waypoint index
    waitLeft: first.wait || 0,
    state: 'patrol',              // patrol | suspicious | hunt | return | lured
    stateT: 0,
    lookTarget: null,             // angle to sweep toward while waiting
    lastSeen: null,               // {x, y} of the thief, when spotted
    seenT: 0,                     // seconds since the thief was last seen
    investigate: null,            // {x, y} point to walk to and check
    stepT: 0,                     // footstep sound timer
    mark: null,                   // '?' or '!' shown above the head
  };
}

function guardTargetPoint(g) {
  const w = g.route[g.wp % g.route.length];
  return { x: tileCenterX(w.x), y: tileCenterY(w.y) };
}

// Move toward a point, sliding along blocking tiles. Returns true on arrival.
function guardStepToward(g, tx, ty, speed, dt, grid, openDoors) {
  const dx = tx - g.x, dy = ty - g.y;
  const d = Math.hypot(dx, dy);
  if (d < 4) return true;
  const step = Math.min(d, speed * dt);
  const nx = g.x + (dx / d) * step;
  const ny = g.y + (dy / d) * step;
  g.dir = Math.atan2(dy, dx);
  if (!circleHitsWall(grid, nx, g.y, PLAYER_RADIUS, openDoors)) g.x = nx;
  if (!circleHitsWall(grid, g.x, ny, PLAYER_RADIUS, openDoors)) g.y = ny;
  return false;
}

function updateGuard(g, dt, game) {
  const grid = game.level.map;
  const openDoors = game.openDoors;
  g.stateT += dt;
  g.seenT += dt;

  // Footstep ticks for the audio layer.
  g.stepT -= dt;
  if (g.stepT <= 0 && (g.state === 'patrol' || g.state === 'hunt' || g.state === 'return')) {
    g.stepT = 0.55;
    audioFootstep(g, game);
  }

  if (g.state === 'patrol') {
    const w = g.route[g.wp % g.route.length];
    if (g.waitLeft > 0) {
      g.waitLeft -= dt;
      // Sweep the gaze at the stop: the waypoint just reached may name a
      // look direction, otherwise scan slowly around.
      const stop = g.route[(g.wp - 1 + g.route.length) % g.route.length];
      const target = stop.look !== undefined ? stop.look : g.dir + dt * 0.6;
      g.dir = turnToward(g.dir, target, dt * 1.4);
      return; // wp already points at the next waypoint; walk there when done
    }
    const tp = guardTargetPoint(g);
    if (guardStepToward(g, tp.x, tp.y, GUARD_SPEED, dt, grid, openDoors)) {
      g.waitLeft = w.wait || 0;
      g.wp = (g.wp + 1) % g.route.length;
      // Face along the route while walking; at the stop, look around.
      const next = g.route[g.wp % g.route.length];
      g.lookTarget = Math.atan2(tileCenterY(next.y) - g.y, tileCenterX(next.x) - g.x);
    }
  } else if (g.state === 'suspicious') {
    // Stop, stare at the thing that felt wrong, then go look.
    if (g.investigate) {
      const arrived = guardStepToward(g, g.investigate.x, g.investigate.y, GUARD_SPEED * 1.15, dt, grid, openDoors);
      if (arrived) {
        g.state = 'patrol';
        g.investigate = null;
        g.waitLeft = 2;
        g.mark = null;
      }
    } else if (g.stateT > 1.6) {
      g.state = 'patrol';
      g.mark = null;
    }
  } else if (g.state === 'hunt') {
    // Chase the last seen spot; keep the thief in sight or lose the trail.
    if (g.lastSeen) {
      const arrived = guardStepToward(g, g.lastSeen.x, g.lastSeen.y, GUARD_HUNT_SPEED, dt, grid, openDoors);
      if (arrived || g.seenT > 4) {
        g.state = 'return';
        g.stateT = 0;
        g.mark = '?';
      }
    } else {
      g.state = 'return';
      g.stateT = 0;
    }
  } else if (g.state === 'return') {
    // Walk back to the nearest waypoint, then resume the patrol.
    let best = 0, bestD = Infinity;
    for (let i = 0; i < g.route.length; i += 1) {
      const w = g.route[i];
      const d = Math.hypot(tileCenterX(w.x) - g.x, tileCenterY(w.y) - g.y);
      if (d < bestD) { bestD = d; best = i; }
    }
    const w = g.route[best];
    if (guardStepToward(g, tileCenterX(w.x), tileCenterY(w.y), GUARD_SPEED, dt, grid, openDoors)) {
      g.wp = best;
      g.state = 'patrol';
      g.mark = null;
    }
  }
}

// A guard spots the thief: remember where, turn to hunt or investigate.
function guardSpotted(g, px, py, alarmLevel) {
  g.lastSeen = { x: px, y: py };
  g.seenT = 0;
  if (alarmLevel >= 2) {           // HUNT or LOCKDOWN
    if (g.state !== 'hunt') { g.state = 'hunt'; g.stateT = 0; }
    g.mark = '!';
  } else if (alarmLevel === 1) {   // SUSPICIOUS: go look, ask questions
    if (g.state === 'patrol') {
      g.state = 'suspicious';
      g.stateT = 0;
      g.investigate = { x: px, y: py };
      g.mark = '?';
    }
  }
}

// A coin clinks somewhere: the nearest guards in earshot go to look.
function guardHearsCoin(g, cx, cy) {
  const d = Math.hypot(cx - g.x, cy - g.y);
  if (d > COIN_LURE_RADIUS) return false;
  if (g.state === 'hunt') return false;   // a hunting guard ignores coins
  g.state = 'suspicious';
  g.stateT = 0;
  g.investigate = { x: cx, y: cy };
  g.mark = '?';
  return true;
}

function turnToward(angle, target, maxStep) {
  let diff = target - angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) <= maxStep) return target;
  return angle + Math.sign(diff) * maxStep;
}
