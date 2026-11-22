// main.js — the game loop and state machine: title → plan → play →
// getaway → win / caught. Owns input, detection, the getaway timer, and
// the deterministic screenshot scenes (?shot=...&seed=N).
'use strict';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function createGame() {
  return {
    screen: 'title',        // title | plan | play | caught | win
    phase: 'stealth',       // stealth | getaway | getaway-late
    levelIndex: 0,
    level: LEVELS[0],
    guards: [],
    cameras: [],
    loot: [],
    openDoors: new Set(),
    coins: [],
    tools: createTools(),
    alarm: createAlarm(),
    player: createPlayer(tileCenterX(2), tileCenterY(14)),
    time: 0,                // seconds since the run started (drives sweeps)
    runTime: 0,
    getawayT: 0,
    message: '',
    messageT: 0,
    paused: false,
    caughtReason: '',
    results: null,
    entryLabel: '',
    stats: { lootTaken: 0, timesSeen: 0, starTaken: false },
    planButtons: null,
    planHover: -1,
    shotFrozen: false,
    shotReadyIn: 0,
  };
}

const game = createGame();
window.__game = game; // playtest + driver introspection

// --- Level loading -------------------------------------------------------
function loadLevel(g, idx) {
  g.levelIndex = idx;
  g.level = LEVELS[idx];
  g.loot = g.level.loot.map((l) => ({ ...l, taken: false }));
  g.guards = g.level.patrols.map((key) => createGuard(key, key));
  g.cameras = g.level.cameras.map((key) => createCamera(key, CAMERAS[key]));
  g.openDoors = new Set();
  g.coins = [];
  g.tools = createTools();
  g.phase = 'stealth';
  g.getawayT = 0;
  g.message = '';
  g.messageT = 0;
}

function enterPlan(g) {
  g.level = LEVELS[g.levelIndex];
  g.screen = 'plan';
  g.planHover = -1;
  g.planButtons = null;
}

function startLevel(g, entryIdx) {
  loadLevel(g, g.levelIndex);
  const entry = g.level.entries[entryIdx] || g.level.entries[0];
  g.player = createPlayer(tileCenterX(entry.x), tileCenterY(entry.y));
  // Keep the loot and slots carried from earlier rooms.
  g.player.lootValue = g.carriedLoot || 0;
  g.player.slots = g.carriedSlots || 0;
  g.entryLabel = entry.label;
  g.alarm.value = Math.min(ALARM_MAX, g.alarm.value + entry.alarm);
  g.alarm.tier = alarmTier(g.alarm.value);
  g.screen = 'play';
  g.message = entry.alarm > 0
    ? 'Skylight drop — loud landing, +' + entry.alarm + ' alarm.'
    : 'Inside. ' + g.level.goal.text + '.';
  g.messageT = 3;
}

// --- Getaway and results ---------------------------------------------------
function startGetaway(g) {
  if (g.phase !== 'stealth') return;
  g.phase = 'getaway';
  g.getawayT = GETAWAY_TIME;
  g.alarm.value = Math.max(g.alarm.value, ALARM_CALM);
  g.alarm.tier = alarmTier(g.alarm.value);
  // One extra guard storms in from the front door.
  const relief = createGuard('reliefGuard', g.level.patrols[0]);
  relief.wp = 2;
  g.guards.push(relief);
  g.message = 'STAR SECURED — GETAWAY! Reach the van in ' + GETAWAY_TIME + 's!';
  g.messageT = 4;
  audioJingle();
}

function finishRun(g, lateVan) {
  const t = Math.floor(g.runTime);
  const timeText = String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
  let rating;
  if (g.stats.timesSeen === 0 && g.stats.starTaken) rating = 'GHOST';
  else if (g.alarm.maxValue < ALARM_HUNT) rating = 'CLEAN';
  else rating = 'MESSY';
  if (lateVan) rating = 'MESSY';
  const score = Math.round(
    g.player.lootValue * (1 - EMP_SCORE_COST * g.tools.empUsed) * (lateVan ? 1 - GETAWAY_LATE_PENALTY : 1),
  );
  g.results = {
    rating, score, loot: g.player.lootValue, timeText,
    maxAlarm: g.alarm.maxValue, timesSeen: g.stats.timesSeen,
    empUsed: g.tools.empUsed, coinsUsed: g.tools.coinsUsed,
    entryLabel: g.entryLabel, lateVan,
  };
  g.screen = 'win';
  audioJingle();
}

function restartRun() {
  const fresh = createGame();
  Object.keys(fresh).forEach((k) => { game[k] = fresh[k]; });
  game.carriedLoot = 0;
  game.carriedSlots = 0;
  enterPlan(game);
}

// --- Input ---------------------------------------------------------------
const input = { left: false, right: false, up: false, down: false, sneak: false };

function keyCode(e) { return e.code; }

window.addEventListener('keydown', (e) => {
  audioInit();
  const c = keyCode(e);
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(c)) e.preventDefault();
  if (c === 'KeyM') { audioToggleMute(); return; }
  if (c === 'KeyR') { restartRun(); return; }
  if (c === 'KeyP' && game.screen === 'play') { game.paused = !game.paused; return; }
  if (c === 'Space') {
    if (game.screen === 'title') { enterPlan(game); return; }
    if (game.screen === 'caught' || game.screen === 'win') { restartRun(); return; }
    return;
  }
  if (game.screen === 'plan') {
    if (c === 'Digit1') startLevel(game, 0);
    if (c === 'Digit2') startLevel(game, 1);
    if (c === 'Digit3') startLevel(game, 2);
    return;
  }
  if (game.screen !== 'play' || game.paused) return;
  if (c === 'ArrowLeft' || c === 'KeyA') input.left = true;
  if (c === 'ArrowRight' || c === 'KeyD') input.right = true;
  if (c === 'ArrowUp' || c === 'KeyW') input.up = true;
  if (c === 'ArrowDown' || c === 'KeyS') input.down = true;
  if (c === 'ShiftLeft' || c === 'ShiftRight') input.sneak = true;
  if (c === 'KeyE') useInteract(game);
  if (c === 'KeyF') smashCase(game);
  if (c === 'KeyQ') empBlast(game);
});

window.addEventListener('keyup', (e) => {
  const c = keyCode(e);
  if (c === 'ArrowLeft' || c === 'KeyA') input.left = false;
  if (c === 'ArrowRight' || c === 'KeyD') input.right = false;
  if (c === 'ArrowUp' || c === 'KeyW') input.up = false;
  if (c === 'ArrowDown' || c === 'KeyS') input.down = false;
  if (c === 'ShiftLeft' || c === 'ShiftRight') input.sneak = false;
});

function canvasPos(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) * (canvas.width / r.width),
    y: (e.clientY - r.top) * (canvas.height / r.height),
  };
}

canvas.addEventListener('mousemove', (e) => {
  if (game.screen !== 'plan') return;
  const pos = canvasPos(e);
  game.planHover = planHitTest(game, pos.x, pos.y);
});

canvas.addEventListener('click', (e) => {
  audioInit();
  const pos = canvasPos(e);
  if (game.screen === 'plan') {
    const i = planHitTest(game, pos.x, pos.y);
    if (i >= 0) startLevel(game, i);
    return;
  }
  if (game.screen === 'play' && !game.paused) {
    throwCoin(game, pos.x, pos.y);
  }
});

// --- Detection -------------------------------------------------------------
function detectThief(g) {
  let guardStr = 0;
  for (const guard of g.guards) {
    const s = coneSees(
      g.level.map, guard.x, guard.y, guard.dir, GUARD_RANGE, GUARD_HALF,
      g.player.x, g.player.y, g.openDoors,
    );
    if (s > guardStr) guardStr = s;
    if (s > 0.3) guardSpotted(guard, g.player.x, g.player.y, g.alarm.tier);
  }
  const camStr = cameraSeesThief(g);
  const seen = Math.max(guardStr, camStr * (CAM_FOV_FILL / GUARD_FOV_FILL));
  return { guardStr, camStr, seen };
}

// --- Update ----------------------------------------------------------------
function update(dt) {
  game.time += dt;
  if (game.screen === 'play' && !game.paused) {
    game.runTime += dt;
    if (game.messageT > 0) game.messageT -= dt;
    updateChannel(game.tools, dt);
    updatePlayer(game.player, dt, input, game);
    // Carry totals across rooms.
    game.carriedLoot = game.player.lootValue;
    game.carriedSlots = game.player.slots;
    for (const guard of game.guards) updateGuard(guard, dt, game);
    for (const cam of game.cameras) updateCamera(cam, dt, game.time);
    game.coins = game.coins.filter((c) => { c.t += dt; return c.t < 6; });
    const det = detectThief(game);
    updateAlarm(game.alarm, dt, det.seen, !!input.sneak, game);
    // Getaway timer and the van.
    if (game.phase === 'getaway') {
      game.getawayT -= dt;
      if (game.getawayT <= 0) {
        game.phase = 'getaway-late';
        game.message = 'The van left! Escape through the service door.';
        game.messageT = 4;
      }
    }
    const ex = tileCenterX(game.level.exit.x), ey = tileCenterY(game.level.exit.y);
    if (game.phase !== 'stealth' &&
        Math.hypot(ex - game.player.x, ey - game.player.y) < TILE * 0.8) {
      finishRun(game, game.phase === 'getaway-late');
      return;
    }
    const caught = isCaught(game);
    if (caught) {
      game.caughtReason = caught;
      game.screen = 'caught';
      audioCaught();
    }
  }
}

// --- Render ----------------------------------------------------------------
function render() {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  if (game.screen === 'title') {
    drawTitle(ctx, game);
  } else if (game.screen === 'plan') {
    drawPlan(ctx, game);
  } else if (game.screen === 'play') {
    drawGame(ctx, game);
    if (game.paused) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      ctx.fillStyle = '#e8e2d0';
      ctx.font = 'bold 40px Georgia, serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('PAUSED — press P to resume', VIEW_W / 2, VIEW_H / 2);
    }
  } else if (game.screen === 'caught') {
    drawGame(ctx, game);
    drawCaught(ctx, game);
  } else if (game.screen === 'win') {
    drawGame(ctx, game);
    drawWin(ctx, game);
  }
  if (game.shotReadyIn > 0) {
    game.shotReadyIn -= 1;
    if (game.shotReadyIn === 0) window.__shotReady = true;
  }
}

// --- Boot ------------------------------------------------------------------
(function boot() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  const seed = Number(params.get('seed') || 1);
  if (shot) {
    // Staged screenshot scene: the real game, posed.
    if (!setupShot(game, shot, seed)) {
      game.screen = 'title';
    }
  }
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!game.shotFrozen) update(dt);
    else game.time += dt; // sparkle and glow keep breathing in a frozen scene
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
