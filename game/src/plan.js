// plan.js — the CASING / PLAN screen. Before every room, Sable studies the
// blueprint: patrol routes drawn with arrows, camera sweep arcs, tiered loot
// icons, and three entry points to choose with the mouse. The plan you read
// is the getaway you get.
'use strict';

function drawPlan(ctx, game) {
  const level = game.level;
  ctx.fillStyle = '#0d1420';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Blueprint panel.
  const px = 40, py = 110, pw = 780, ph = 480;
  const scale = Math.min(pw / (COLS * TILE), ph / (ROWS * TILE));
  const ox = px + (pw - COLS * TILE * scale) / 2;
  const oy = py + (ph - ROWS * TILE * scale) / 2;
  const bx = (tx) => ox + tx * TILE * scale;
  const by = (ty) => oy + ty * TILE * scale;

  ctx.fillStyle = '#101b2e';
  ctx.fillRect(px - 8, py - 8, pw + 16, ph + 16);
  ctx.strokeStyle = '#3a5a80';
  ctx.lineWidth = 2;
  ctx.strokeRect(px - 8, py - 8, pw + 16, ph + 16);

  // Walls and cover as blueprint lines.
  for (let ty = 0; ty < ROWS; ty += 1) {
    for (let tx = 0; tx < COLS; tx += 1) {
      const t = level.map[ty][tx];
      if (t === '#') {
        ctx.fillStyle = '#27405e';
        ctx.fillRect(bx(tx), by(ty), TILE * scale, TILE * scale);
      } else if (t === 'T') {
        ctx.strokeStyle = '#7a9cc0'; ctx.lineWidth = 1;
        ctx.strokeRect(bx(tx) + 2, by(ty) + 2, TILE * scale - 4, TILE * scale - 4);
      } else if (t === 'P') {
        ctx.fillStyle = '#7a9cc0';
        ctx.beginPath(); ctx.arc(bx(tx) + TILE * scale / 2, by(ty) + TILE * scale / 2, 4, 0, Math.PI * 2); ctx.fill();
      } else if (t === 'G') {
        ctx.strokeStyle = '#9fd2e8'; ctx.lineWidth = 1.5;
        ctx.strokeRect(bx(tx) + 2, by(ty) + 2, TILE * scale - 4, TILE * scale - 4);
      } else if (t === 'D' || t === 'V') {
        ctx.fillStyle = t === 'V' ? '#c07a2a' : '#c0a02a';
        ctx.fillRect(bx(tx), by(ty), TILE * scale, TILE * scale);
      }
    }
  }
  // Exit / van spot.
  ctx.fillStyle = '#5adc82';
  ctx.font = 'bold 11px Georgia, serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('EXIT', bx(level.exit.x) + TILE * scale / 2, by(level.exit.y) + TILE * scale / 2);

  // Patrol routes: dashed gold lines with arrowheads, waypoint dots.
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.setLineDash([7, 5]);
  for (const key of level.patrols) {
    const route = PATROLS[key];
    ctx.beginPath();
    route.forEach((w, i) => {
      const x = bx(w.x) + TILE * scale / 2, y = by(w.y) + TILE * scale / 2;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
    for (const w of route) {
      const x = bx(w.x) + TILE * scale / 2, y = by(w.y) + TILE * scale / 2;
      ctx.fillStyle = GOLD;
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.setLineDash([]);

  // Camera sweep arcs (blue-white).
  for (const key of level.cameras) {
    const c = CAMERAS[key];
    const x = bx(c.x) + TILE * scale / 2, y = by(c.y) + TILE * scale / 2;
    ctx.fillStyle = 'rgba(140,190,255,0.35)';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, CAM_RANGE * scale, c.base - c.sweep, c.base + c.sweep);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#dfe9f5';
    ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
  }

  // Loot icons, tiered by size.
  for (const loot of level.loot) {
    const x = bx(loot.x) + TILE * scale / 2, y = by(loot.y) + TILE * scale / 2;
    if (loot.kind === 'cash') {
      ctx.fillStyle = '#3fae5a';
      ctx.fillRect(x - 4, y - 3, 8, 6);
    } else if (loot.kind === 'painting') {
      ctx.fillStyle = '#7a5c8a';
      ctx.fillRect(x - 6, y - 7, 12, 14);
      ctx.strokeStyle = GOLD; ctx.lineWidth = 1;
      ctx.strokeRect(x - 6, y - 7, 12, 14);
    } else if (loot.kind === 'jewel') {
      ctx.fillStyle = '#8fe8ff';
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4);
      ctx.fillRect(-4, -4, 8, 8); ctx.restore();
    } else if (loot.kind === 'star') {
      ctx.fillStyle = '#ffe27a';
      drawStarShape(ctx, x, y, 5, 8, 3.5, '#ffe27a', '#b8860b');
    }
  }

  // Header.
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 30px Georgia, serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('CASING — ' + level.name, 40, 48);
  ctx.fillStyle = '#c8d2dc';
  ctx.font = '16px Georgia, serif';
  ctx.fillText(level.sub + '  ·  Study the patrols and camera sweeps, then pick your way in.', 40, 82);
  ctx.fillStyle = '#9aa0aa';
  ctx.font = '13px Georgia, serif';
  ctx.fillText('— gold line: guard patrol   ·   blue arc: camera sweep   ·   green: exit', 40, 612);

  // Right column: target, tools, entries.
  const rx = 860;
  ctx.fillStyle = '#e8e2d0';
  ctx.font = 'bold 17px Georgia, serif';
  ctx.fillText('THE JOB', rx, 130);
  ctx.fillStyle = '#c8d2dc';
  ctx.font = '15px Georgia, serif';
  const target = level.goal.needStar
    ? 'Take the Meridian Star.'
    : 'Take at least $' + level.goal.minLoot.toLocaleString('en-US') + ' of loot.';
  ctx.fillText(target, rx, 158);
  ctx.fillText('Reach the van.', rx, 182);
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 17px Georgia, serif';
  ctx.fillText('TOOLS — EVERY ONE COSTS', rx, 224);
  ctx.fillStyle = '#c8d2dc';
  ctx.font = '14px Georgia, serif';
  const toolLines = [
    'Lockpick [E] — 2.5s still, exposed',
    'Glass cutter [E] — 3s, silent',
    'Smash case [F] — instant, +25 alarm',
    'EMP [Q] — ' + EMP_PER_ROOM + '×/room, cameras dead 10s, −5% score',
    'Decoy coin [click] — ' + COINS_PER_ROOM + '×/room, lures guards',
    'Tiptoe [Shift] — slower, harder to spot',
  ];
  toolLines.forEach((line, i) => ctx.fillText('· ' + line, rx, 250 + i * 22));

  // Entry buttons.
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 17px Georgia, serif';
  ctx.fillText('CHOOSE YOUR ENTRY', rx, 400);
  game.planButtons = [];
  level.entries.forEach((entry, i) => {
    const bx0 = rx, by0 = 420 + i * 72, bw = 380, bh = 60;
    const hover = game.planHover === i;
    ctx.fillStyle = hover ? '#2a3a2a' : '#16202e';
    ctx.fillRect(bx0, by0, bw, bh);
    ctx.strokeStyle = hover ? '#5adc82' : GOLD;
    ctx.lineWidth = 2;
    ctx.strokeRect(bx0, by0, bw, bh);
    ctx.fillStyle = '#e8e2d0';
    ctx.font = 'bold 16px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText(entry.label, bx0 + 14, by0 + 22);
    ctx.fillStyle = '#9aa0aa';
    ctx.font = '13px Georgia, serif';
    ctx.fillText(entry.note + (entry.alarm > 0 ? '  (+' + entry.alarm + ' alarm)' : ''), bx0 + 14, by0 + 44);
    game.planButtons.push({ x: bx0, y: by0, w: bw, h: bh, entry });
  });
  ctx.fillStyle = '#9aa0aa';
  ctx.font = '13px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('Click an entry, or press 1 / 2 / 3.', rx, 650);
}

// Mouse position (canvas pixels) → entry index, or -1.
function planHitTest(game, mx, my) {
  if (!game.planButtons) return -1;
  for (let i = 0; i < game.planButtons.length; i += 1) {
    const b = game.planButtons[i];
    if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) return i;
  }
  return -1;
}
