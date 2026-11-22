// tools.js — the thief's tools, every one with a cost.
// Lockpick (E on a locked door): 2.5s channelling, standing still and exposed.
// Glass cutter (E on a case): 3s silent lift. Smash (F on a case): instant,
// but +25 alarm. EMP (Q): 2 per room, kills cameras 10s, −5% score each.
// Decoy coin (mouse click): 3 per room, lures the nearest guards to the spot.
'use strict';

function createTools() {
  return {
    empLeft: EMP_PER_ROOM, empUsed: 0,
    coinsLeft: COINS_PER_ROOM, coinsUsed: 0,
    channel: null,   // { kind, label, t, total, x, y, onDone } or null
  };
}

function startChannel(tools, kind, label, total, x, y, onDone) {
  if (tools.channel) return false;
  tools.channel = { kind, label, t: 0, total, x, y, onDone };
  return true;
}

function cancelChannel(tools) {
  tools.channel = null;
}

function updateChannel(tools, dt) {
  const c = tools.channel;
  if (!c) return;
  c.t += dt;
  if (c.t >= c.total) {
    tools.channel = null;
    c.onDone();
  }
}

// What can the thief interact with right here? Returns a descriptor or null.
function findInteractable(game) {
  const p = game.player;
  const px = p.x, py = p.y;
  // Locked doors and the vault door (adjacent tiles).
  for (let ty = 0; ty < ROWS; ty += 1) {
    for (let tx = 0; tx < COLS; tx += 1) {
      const t = game.level.map[ty][tx];
      if (t !== 'D' && t !== 'V') continue;
      if (game.openDoors.has(tx + ',' + ty)) continue;
      const cx = tileCenterX(tx), cy = tileCenterY(ty);
      if (Math.hypot(cx - px, cy - py) < TILE * 1.15) {
        return {
          kind: 'door', label: t === 'V' ? 'Pick the vault door' : 'Pick the lock',
          time: LOCKPICK_TIME, tx, ty, x: cx, y: cy,
        };
      }
    }
  }
  // Glass cases with jewel loot still inside.
  for (const loot of game.loot) {
    if (loot.kind !== 'jewel' || loot.taken) continue;
    const cx = tileCenterX(loot.x), cy = tileCenterY(loot.y);
    if (Math.hypot(cx - px, cy - py) < TILE * 1.15) {
      return {
        kind: 'case', label: 'Cut the glass (silent)',
        time: CUTTER_TIME, loot, x: cx, y: cy,
      };
    }
  }
  // Paintings on the wall.
  for (const loot of game.loot) {
    if (loot.kind !== 'painting' || loot.taken) continue;
    const cx = tileCenterX(loot.x), cy = tileCenterY(loot.y);
    if (Math.hypot(cx - px, cy - py) < TILE * 1.15) {
      return {
        kind: 'painting', label: 'Lift the painting',
        time: PAINT_TIME, loot, x: cx, y: cy,
      };
    }
  }
  // The Meridian Star, inside the vault.
  for (const loot of game.loot) {
    if (loot.kind !== 'star' || loot.taken) continue;
    const cx = tileCenterX(loot.x), cy = tileCenterY(loot.y);
    if (Math.hypot(cx - px, cy - py) < TILE * 1.15) {
      return {
        kind: 'star', label: 'Prise the Meridian Star free',
        time: STAR_TIME, loot, x: cx, y: cy,
      };
    }
  }
  return null;
}

function useInteract(game) {
  const tools = game.tools;
  if (tools.channel) return; // already busy
  const it = findInteractable(game);
  if (!it) return;
  if (it.kind === 'door') {
    audioLockpick();
    startChannel(tools, 'door', it.label, it.time, it.x, it.y, () => {
      game.openDoors.add(it.tx + ',' + it.ty);
      game.message = it.tx === 15 && game.level.id === 'vault'
        ? 'Vault door open — the Star is yours to take.'
        : 'Lock picked. The way is open.';
      game.messageT = 2.5;
      audioUnlock();
    });
  } else if (it.kind === 'case') {
    audioCutter();
    startChannel(tools, 'case', it.label, it.time, it.x, it.y, () => {
      takeLoot(game, it.loot);
      game.message = 'Glass cut clean — no sound, no alarm.';
      game.messageT = 2;
    });
  } else if (it.kind === 'painting') {
    startChannel(tools, 'painting', it.label, it.time, it.x, it.y, () => {
      takeLoot(game, it.loot);
    });
  } else if (it.kind === 'star') {
    startChannel(tools, 'star', it.label, it.time, it.x, it.y, () => {
      takeLoot(game, it.loot);
      startGetaway(game);
    });
  }
}

// Smash the nearest glass case: instant jewel, but the noise is +25 alarm.
function smashCase(game) {
  for (const loot of game.loot) {
    if (loot.kind !== 'jewel' || loot.taken) continue;
    const cx = tileCenterX(loot.x), cy = tileCenterY(loot.y);
    if (Math.hypot(cx - game.player.x, cy - game.player.y) < TILE * 1.15) {
      takeLoot(game, loot);
      game.alarm.value = Math.min(ALARM_MAX, game.alarm.value + SMASH_ALARM);
      game.message = 'Glass smashed! +' + SMASH_ALARM + ' alarm — the whole floor heard that.';
      game.messageT = 3;
      audioSmash();
      // Every guard in the room turns toward the noise.
      for (const g of game.guards) {
        if (g.state === 'patrol') {
          g.state = 'suspicious'; g.stateT = 0;
          g.investigate = { x: cx, y: cy }; g.mark = '?';
        }
      }
      return true;
    }
  }
  return false;
}

function throwCoin(game, mx, my) {
  const tools = game.tools;
  if (tools.coinsLeft <= 0) {
    game.message = 'Out of decoy coins.';
    game.messageT = 1.5;
    return false;
  }
  if (my < GRID_TOP) return false; // clicks on the HUD are not throws
  tools.coinsLeft -= 1;
  tools.coinsUsed += 1;
  const coin = { x: mx, y: my, t: 0 };
  game.coins.push(coin);
  audioCoin();
  let lured = 0;
  for (const g of game.guards) if (guardHearsCoin(g, mx, my)) lured += 1;
  game.message = lured > 0
    ? 'Coin clinks — ' + lured + ' guard' + (lured > 1 ? 's' : '') + ' go to look.'
    : 'Coin clinks in the dark. Nobody close enough to hear it.';
  game.messageT = 2;
  return true;
}

function takeLoot(game, loot) {
  if (loot.taken) return;
  loot.taken = true;
  game.player.lootValue += loot.value;
  game.player.slots += loot.weight;
  game.stats.lootTaken += 1;
  audioLoot(loot.kind);
  if (loot.kind === 'star') {
    game.stats.starTaken = true;
  }
}
