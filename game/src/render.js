// render.js — draws the whole game: the art-deco Meridian Exchange, the
// vision cones, the loot that glitters, the van, and the big alarm meter.
// Safe cover reads as dark floor + brass trim; danger reads as light pools
// and cones; loot reads as gold and emerald sparkle — obvious at a glance.
'use strict';

const GOLD = '#d8b45a';
const GOLD_DIM = '#8a6f35';
const MARBLE = '#9a8f78';
const WALL_C = '#4a3d28';
const FLOOR_A = '#1d2029';
const FLOOR_B = '#232733';

function drawGame(ctx, game) {
  drawFloor(ctx, game);
  drawTiles(ctx, game);
  drawExit(ctx, game);
  drawLoot(ctx, game);
  drawCoins(ctx, game);
  drawCones(ctx, game);
  drawGuards(ctx, game);
  drawPlayer(ctx, game);
  drawChannel(ctx, game);
  drawHUD(ctx, game);
}

function drawFloor(ctx, game) {
  ctx.fillStyle = '#101218';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Checker marble, brass grid lines.
  for (let ty = 0; ty < ROWS; ty += 1) {
    for (let tx = 0; tx < COLS; tx += 1) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? FLOOR_A : FLOOR_B;
      ctx.fillRect(tx * TILE, GRID_TOP + ty * TILE, TILE, TILE);
    }
  }
  // Warm light pools under the chandeliers (pure decoration, no gameplay).
  const lamps = [[8, 4], [24, 4], [8, 12], [24, 12], [16, 8]];
  for (const [lx, ly] of lamps) {
    const cx = tileCenterX(lx), cy = tileCenterY(ly);
    const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, 130);
    g.addColorStop(0, 'rgba(216,180,90,0.10)');
    g.addColorStop(1, 'rgba(216,180,90,0)');
    ctx.fillStyle = g;
    ctx.fillRect(cx - 130, cy - 130, 260, 260);
  }
  ctx.strokeStyle = 'rgba(216,180,90,0.16)';
  ctx.lineWidth = 1;
  for (let tx = 0; tx <= COLS; tx += 1) {
    ctx.beginPath(); ctx.moveTo(tx * TILE, GRID_TOP); ctx.lineTo(tx * TILE, VIEW_H); ctx.stroke();
  }
  for (let ty = 0; ty <= ROWS; ty += 1) {
    ctx.beginPath(); ctx.moveTo(0, GRID_TOP + ty * TILE); ctx.lineTo(VIEW_W, GRID_TOP + ty * TILE); ctx.stroke();
  }
}

function drawTiles(ctx, game) {
  const grid = game.level.map;
  for (let ty = 0; ty < ROWS; ty += 1) {
    for (let tx = 0; tx < COLS; tx += 1) {
      const t = grid[ty][tx];
      const x = tx * TILE, y = GRID_TOP + ty * TILE;
      if (t === '#') {
        ctx.fillStyle = WALL_C;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = GOLD_DIM;
        ctx.fillRect(x, y, TILE, 3);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(x, y + TILE - 4, TILE, 4);
      } else if (t === 'T') {
        ctx.fillStyle = MARBLE;
        ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
        ctx.strokeStyle = GOLD;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 3, y + 3, TILE - 6, TILE - 6);
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(x + 6, y + 6, TILE - 12, 5);
      } else if (t === 'P') {
        ctx.fillStyle = '#2c2417';
        ctx.beginPath(); ctx.arc(x + TILE / 2, y + TILE / 2, 15, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = GOLD; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(x + TILE / 2, y + TILE / 2, 15, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(216,180,90,0.35)';
        ctx.beginPath(); ctx.arc(x + TILE / 2 - 4, y + TILE / 2 - 4, 4, 0, Math.PI * 2); ctx.fill();
      } else if (t === 'G') {
        ctx.fillStyle = 'rgba(150,210,235,0.20)';
        ctx.fillRect(x + 4, y + 4, TILE - 8, TILE - 8);
        ctx.strokeStyle = '#9fd2e8'; ctx.lineWidth = 2;
        ctx.strokeRect(x + 4, y + 4, TILE - 8, TILE - 8);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x + 8, y + TILE - 8); ctx.lineTo(x + TILE - 8, y + 8); ctx.stroke();
      } else if (t === 'D' || t === 'V') {
        const open = game.openDoors.has(tx + ',' + ty);
        if (open) {
          ctx.fillStyle = '#3a3428';
          ctx.fillRect(x, y, TILE, TILE);
        } else {
          ctx.fillStyle = t === 'V' ? '#5a3a1a' : '#4d3f22';
          ctx.fillRect(x, y, TILE, TILE);
          ctx.strokeStyle = GOLD; ctx.lineWidth = 2;
          ctx.strokeRect(x + 4, y + 4, TILE - 8, TILE - 8);
          ctx.fillStyle = GOLD;
          ctx.font = 'bold 15px Georgia, serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(t === 'V' ? 'VAULT' : 'LOCK', x + TILE / 2, y + TILE / 2);
        }
      }
    }
  }
}

function drawExit(ctx, game) {
  const ex = tileCenterX(game.level.exit.x), ey = tileCenterY(game.level.exit.y);
  const met = roomGoalMet(game) || game.phase === 'getaway';
  ctx.save();
  ctx.fillStyle = met ? 'rgba(90,220,130,0.25)' : 'rgba(120,120,120,0.14)';
  ctx.fillRect(ex - 20, ey - 20, 40, 40);
  ctx.strokeStyle = met ? '#5adc82' : '#777';
  ctx.lineWidth = 2;
  ctx.strokeRect(ex - 20, ey - 20, 40, 40);
  ctx.fillStyle = met ? '#5adc82' : '#999';
  ctx.font = 'bold 11px Georgia, serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(game.phase === 'getaway' ? 'VAN' : 'EXIT', ex, ey);
  ctx.restore();
  if (game.phase === 'getaway') drawVan(ctx, ex, ey, game);
}

function drawVan(ctx, ex, ey, game) {
  // The getaway van: dark body, brass stripe, headlights sweeping out.
  ctx.save();
  ctx.translate(ex, ey);
  const bob = Math.sin(game.time * 3) * 1.5;
  ctx.fillStyle = '#22252e';
  ctx.beginPath();
  ctx.roundRect(-34, -16 + bob, 68, 32, 6);
  ctx.fill();
  ctx.fillStyle = GOLD;
  ctx.fillRect(-34, -3 + bob, 68, 5);
  ctx.fillStyle = '#cfe8ff';
  ctx.fillRect(24, -10 + bob, 8, 7);
  ctx.fillRect(24, 3 + bob, 8, 7);
  const g = ctx.createRadialGradient(34, 0, 4, 34, 0, 90);
  g.addColorStop(0, 'rgba(255,240,180,0.35)');
  g.addColorStop(1, 'rgba(255,240,180,0)');
  ctx.fillStyle = g;
  ctx.fillRect(30, -90, 100, 180);
  ctx.fillStyle = '#e8e2d0';
  ctx.font = 'bold 12px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('GETAWAY VAN', 0, -26 + bob);
  ctx.restore();
}

function drawLoot(ctx, game) {
  for (const loot of game.loot) {
    if (loot.taken) continue;
    const cx = tileCenterX(loot.x), cy = tileCenterY(loot.y);
    const tw = Math.sin(game.time * 3 + loot.x) * 0.5 + 1;
    if (loot.kind === 'cash') {
      ctx.fillStyle = '#3fae5a';
      ctx.fillRect(cx - 9, cy - 6, 18, 12);
      ctx.strokeStyle = '#b8e6c2'; ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - 9, cy - 6, 18, 12);
      ctx.fillStyle = '#eaffef';
      ctx.font = 'bold 10px Georgia, serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('$', cx, cy + 0.5);
    } else if (loot.kind === 'painting') {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = '#6b4f1d';
      ctx.fillRect(-13, -16, 26, 32);
      ctx.fillStyle = '#7a5c8a';
      ctx.fillRect(-10, -13, 20, 26);
      ctx.fillStyle = GOLD;
      ctx.beginPath(); ctx.arc(0, -3, 5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.fillStyle = 'rgba(216,180,90,' + (0.5 * tw) + ')';
      ctx.font = 'bold 10px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('$' + loot.value, cx, cy - 22);
    } else if (loot.kind === 'jewel') {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.PI / 4);
      const s = 9 * tw;
      ctx.fillStyle = '#8fe8ff';
      ctx.fillRect(-s / 2, -s / 2, s, s);
      ctx.strokeStyle = '#eafcff'; ctx.lineWidth = 1.5;
      ctx.strokeRect(-s / 2, -s / 2, s, s);
      ctx.restore();
      ctx.fillStyle = '#bfefff';
      ctx.font = 'bold 10px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('$' + loot.value, cx, cy - 20);
    } else if (loot.kind === 'star') {
      ctx.save();
      ctx.translate(cx, cy);
      const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 34);
      g.addColorStop(0, 'rgba(255,220,110,0.85)');
      g.addColorStop(1, 'rgba(255,220,110,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, 34, 0, Math.PI * 2); ctx.fill();
      drawStarShape(ctx, 0, 0, 5, 15, 6, '#ffe27a', '#b8860b');
      ctx.restore();
      ctx.fillStyle = '#ffe27a';
      ctx.font = 'bold 12px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('MERIDIAN STAR  $5,000', cx, cy - 30);
    }
  }
}

function drawStarShape(ctx, x, y, points, outer, inner, fill, stroke) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i += 1) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / points - Math.PI / 2;
    const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = fill; ctx.fill();
  ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke();
}

function drawCoins(ctx, game) {
  for (const coin of game.coins) {
    const age = game.time - 0; // coins persist until picked up by a guard's look
    ctx.fillStyle = GOLD;
    ctx.beginPath(); ctx.arc(coin.x, coin.y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff2c0'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(coin.x, coin.y, 8, 0, Math.PI * 2); ctx.stroke();
  }
}

function coneFillStyle(state, kind) {
  if (kind === 'camera') return 'rgba(140,190,255,0.30)';
  if (state === 'hunt') return 'rgba(224,82,60,0.34)';
  if (state === 'suspicious') return 'rgba(232,150,60,0.32)';
  return 'rgba(216,194,106,0.26)';
}

function drawCones(ctx, game) {
  // Cameras first (blue-white), then guards (gold → orange → red).
  for (const cam of game.cameras) {
    if (cameraDisabled(cam, game.time)) {
      // Dead camera: grey stub + sparks.
      ctx.fillStyle = 'rgba(120,120,120,0.5)';
      ctx.beginPath(); ctx.arc(cam.x, cam.y, 7, 0, Math.PI * 2); ctx.fill();
      if (Math.random() < 0.3) {
        ctx.fillStyle = '#ffe27a';
        ctx.beginPath();
        ctx.arc(cam.x + (Math.random() * 14 - 7), cam.y + (Math.random() * 14 - 7), 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#9aa0aa';
      ctx.font = 'bold 10px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('EMP', cam.x, cam.y - 14);
      continue;
    }
    const poly = conePolygon(game.level.map, cam.x, cam.y, cam.angle, CAM_RANGE, CAM_HALF, game.openDoors);
    ctx.fillStyle = coneFillStyle('patrol', 'camera');
    ctx.beginPath();
    ctx.moveTo(poly[0].x, poly[0].y);
    for (let i = 1; i < poly.length; i += 1) ctx.lineTo(poly[i].x, poly[i].y);
    ctx.closePath(); ctx.fill();
    // The camera itself, mounted on the wall.
    ctx.fillStyle = '#dfe9f5';
    ctx.beginPath(); ctx.arc(cam.x, cam.y, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#22303f';
    ctx.beginPath(); ctx.arc(cam.x, cam.y, 3, 0, Math.PI * 2); ctx.fill();
  }
  for (const g of game.guards) {
    const poly = conePolygon(game.level.map, g.x, g.y, g.dir, GUARD_RANGE, GUARD_HALF, game.openDoors);
    ctx.fillStyle = coneFillStyle(g.state, 'guard');
    ctx.beginPath();
    ctx.moveTo(poly[0].x, poly[0].y);
    for (let i = 1; i < poly.length; i += 1) ctx.lineTo(poly[i].x, poly[i].y);
    ctx.closePath(); ctx.fill();
    // Faint edge line so the cone reads at a glance.
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawGuards(ctx, game) {
  for (const g of game.guards) {
    ctx.save();
    ctx.translate(g.x, g.y);
    // Body: dark navy uniform, brass buttons.
    ctx.fillStyle = '#1c2733';
    ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = g.state === 'hunt' ? '#ff5a4a' : '#c8d2dc';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.stroke();
    // Facing tick.
    ctx.strokeStyle = '#e8e2d0';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(g.dir) * 17, Math.sin(g.dir) * 17); ctx.stroke();
    // Cap.
    ctx.fillStyle = '#0f141b';
    ctx.beginPath(); ctx.arc(0, -3, 6, Math.PI, 0); ctx.fill();
    ctx.restore();
    // Suspicion mark.
    if (g.mark) {
      ctx.fillStyle = g.mark === '!' ? '#ff5a4a' : '#ffb347';
      ctx.font = 'bold 20px Georgia, serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(g.mark, g.x, g.y - 26);
    }
  }
}

function drawPlayer(ctx, game) {
  const p = game.player;
  ctx.save();
  ctx.translate(p.x, p.y);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(0, 8, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
  // Sable: black coat, gold trim, pale face.
  ctx.fillStyle = '#0c0c10';
  ctx.beginPath(); ctx.arc(0, 0, PLAYER_RADIUS, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = GOLD; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, PLAYER_RADIUS, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#e8dcc0';
  ctx.beginPath(); ctx.arc(Math.cos(p.dir) * 4, Math.sin(p.dir) * 4, 4.5, 0, Math.PI * 2); ctx.fill();
  // Sneak = crouched: smaller, dashed ring.
  if (p.sneak) {
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(216,180,90,0.7)';
    ctx.beginPath(); ctx.arc(0, 0, PLAYER_RADIUS + 4, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
  }
  // Carried loot rides on the back.
  if (p.slots > 0) {
    ctx.fillStyle = '#6b4f1d';
    ctx.fillRect(-9, -PLAYER_RADIUS - 10, 18, 8);
    ctx.strokeStyle = GOLD; ctx.lineWidth = 1;
    ctx.strokeRect(-9, -PLAYER_RADIUS - 10, 18, 8);
  }
  ctx.restore();
  // Name tag.
  ctx.fillStyle = '#e8e2d0';
  ctx.font = 'bold 10px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('SABLE', p.x, p.y - PLAYER_RADIUS - 13);
}

function drawChannel(ctx, game) {
  const c = game.tools.channel;
  if (!c) return;
  const w = 110, h = 10;
  const x = c.x - w / 2, y = c.y - 34;
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.fillStyle = GOLD;
  ctx.fillRect(x, y, w * (c.t / c.total), h);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(c.label + '…', c.x, y - 8);
}

// --- HUD -----------------------------------------------------------------
function drawHUD(ctx, game) {
  ctx.fillStyle = '#14161d';
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, HUD_H - 3, VIEW_W, 3);
  // Room name.
  ctx.fillStyle = '#e8e2d0';
  ctx.font = 'bold 17px Georgia, serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(game.level.name, 16, 22);
  ctx.fillStyle = '#9aa0aa';
  ctx.font = '12px Georgia, serif';
  ctx.fillText(game.level.sub, 16, 44);
  // Alarm meter — big, centre.
  const ax = 330, ay = 16, aw = 420, ah = 26;
  const tier = game.alarm.tier;
  ctx.fillStyle = '#000';
  ctx.fillRect(ax - 2, ay - 2, aw + 4, ah + 4);
  ctx.fillStyle = '#2a2e38';
  ctx.fillRect(ax, ay, aw, ah);
  ctx.fillStyle = ALARM_COLORS[tier];
  ctx.fillRect(ax, ay, aw * (game.alarm.value / 100), ah);
  ctx.strokeStyle = GOLD; ctx.lineWidth = 1.5;
  ctx.strokeRect(ax, ay, aw, ah);
  // Tier ticks at 35 and 70.
  ctx.fillStyle = '#fff';
  ctx.fillRect(ax + aw * 0.35, ay, 2, ah);
  ctx.fillRect(ax + aw * 0.7, ay, 2, ah);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM  ' + ALARM_NAMES[tier] + '  ' + Math.round(game.alarm.value) + '%', ax, ay + ah + 16);
  if (game.alarm.lockdownT > 0) {
    ctx.fillStyle = '#ff2e4d';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.fillText('LOCKDOWN ' + Math.ceil(game.alarm.lockdownT) + 's', ax + 250, ay + ah + 16);
  }
  // Loot total.
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 22px Georgia, serif';
  ctx.textAlign = 'right';
  ctx.fillText('$' + game.player.lootValue.toLocaleString('en-US'), VIEW_W - 16, 24);
  ctx.fillStyle = '#9aa0aa';
  ctx.font = '12px Georgia, serif';
  ctx.fillText('loot carried  ·  ' + game.player.slots + '/' + MAX_SLOTS + ' slots', VIEW_W - 16, 46);
  // Tools remaining.
  ctx.fillStyle = '#c8d2dc';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('EMP [Q] ×' + game.tools.empLeft + '    COIN [click] ×' + game.tools.coinsLeft, 780, 24);
  ctx.fillStyle = '#9aa0aa';
  ctx.font = '12px Georgia, serif';
  ctx.fillText('E interact · F smash case · Shift sneak · P pause · M mute', 780, 46);
  // Getaway timer.
  if (game.phase === 'getaway') {
    ctx.fillStyle = game.getawayT < 10 ? '#ff2e4d' : '#ffb347';
    ctx.font = 'bold 26px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('GETAWAY  ' + Math.ceil(game.getawayT) + 's', VIEW_W / 2, 66);
  } else if (game.phase === 'getaway-late') {
    ctx.fillStyle = '#ff2e4d';
    ctx.font = 'bold 16px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('THE VAN LEFT — escape through the service door', VIEW_W / 2, 66);
  }
  // Transient message line — a toast at the bottom of the screen, clear of
  // the HUD, so it never collides with the alarm label or the timer.
  if (game.messageT > 0 && game.message) {
    ctx.font = 'bold 14px Georgia, serif';
    const w = ctx.measureText(game.message).width + 28;
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(VIEW_W / 2 - w / 2, VIEW_H - 34, w, 26);
    ctx.strokeStyle = GOLD; ctx.lineWidth = 1;
    ctx.strokeRect(VIEW_W / 2 - w / 2, VIEW_H - 34, w, 26);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(game.message, VIEW_W / 2, VIEW_H - 20);
  }
}

// --- Full screens --------------------------------------------------------
function drawTitle(ctx, game) {
  ctx.fillStyle = '#0d0f14';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Deco sunburst.
  ctx.save();
  ctx.translate(VIEW_W / 2, 210);
  for (let i = 0; i < 24; i += 1) {
    ctx.rotate(Math.PI / 12);
    ctx.fillStyle = i % 2 === 0 ? 'rgba(216,180,90,0.07)' : 'rgba(216,180,90,0.03)';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(700, -40); ctx.lineTo(700, 40); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 64px Georgia, serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('GILT & SMOKE', VIEW_W / 2, 170);
  ctx.fillStyle = '#e8e2d0';
  ctx.font = 'italic 24px Georgia, serif';
  ctx.fillText('The Meridian Job', VIEW_W / 2, 225);
  ctx.fillStyle = '#9aa0aa';
  ctx.font = '16px Georgia, serif';
  ctx.fillText('You are Sable. Cross the Meridian Exchange, take the Meridian Star,', VIEW_W / 2, 300);
  ctx.fillText('and reach the getaway van — before the alarm catches up with you.', VIEW_W / 2, 326);
  ctx.fillStyle = '#c8d2dc';
  ctx.font = '15px Georgia, serif';
  ctx.fillText('WASD / arrows move · Shift tiptoe · E interact (lockpick / cutter / take)', VIEW_W / 2, 400);
  ctx.fillText('Q EMP pulse · click throws a decoy coin · F smashes a case (loud!)', VIEW_W / 2, 426);
  ctx.fillText('P pause · M mute · R restart', VIEW_W / 2, 452);
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillText('Press SPACE to case the joint', VIEW_W / 2, 530);
  ctx.fillStyle = '#9aa0aa';
  ctx.font = '13px Georgia, serif';
  ctx.fillText('Three rooms. Patrols to read. Cameras to dodge. One van waiting outside.', VIEW_W / 2, 580);
}

function drawCaught(ctx, game) {
  ctx.fillStyle = 'rgba(10,4,6,0.88)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#ff5a4a';
  ctx.font = 'bold 56px Georgia, serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('BUSTED', VIEW_W / 2, 240);
  ctx.fillStyle = '#e8e2d0';
  ctx.font = '20px Georgia, serif';
  ctx.fillText(game.caughtReason || 'The guards closed in.', VIEW_W / 2, 310);
  ctx.fillStyle = '#9aa0aa';
  ctx.font = '16px Georgia, serif';
  ctx.fillText('Loot carried: $' + game.player.lootValue.toLocaleString('en-US') +
    '  ·  Highest alarm: ' + Math.round(game.alarm.maxValue) + '%', VIEW_W / 2, 360);
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText('Press SPACE to try the job again', VIEW_W / 2, 440);
}

function drawWin(ctx, game) {
  const r = game.results;
  // Dim the world, but leave the van and the thief visible around the panel:
  // the getaway should read as a scene, not a blank card.
  ctx.fillStyle = 'rgba(8,12,10,0.55)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#10141c';
  ctx.fillRect(260, 90, 760, 470);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.strokeRect(260, 90, 760, 470);
  ctx.strokeStyle = 'rgba(216,180,90,0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(268, 98, 744, 454);
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 52px Georgia, serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('THE GETAWAY', VIEW_W / 2, 130);
  ctx.fillStyle = '#e8e2d0';
  ctx.font = 'bold 30px Georgia, serif';
  ctx.fillText('Rating: ' + r.rating, VIEW_W / 2, 200);
  const lines = [
    'Total loot:  $' + r.loot.toLocaleString('en-US') + '   ·   Final score:  $' + r.score.toLocaleString('en-US'),
    'Time:  ' + r.timeText + '   ·   Highest alarm: ' + Math.round(r.maxAlarm) + '%',
    'Times spotted:  ' + r.timesSeen + '   ·   EMP used: ' + r.empUsed + '   ·   Coins thrown: ' + r.coinsUsed,
    'Entry point:  ' + r.entryLabel,
    r.lateVan ? 'The van had already left — escaped on foot (−20% score).' : 'Out clean through the van.',
  ];
  ctx.font = '19px Georgia, serif';
  lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, 260 + i * 36));
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillText('Press SPACE to run the job again', VIEW_W / 2, 500);
}
