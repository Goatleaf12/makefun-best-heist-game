// vision.js — line of sight and vision cones, raycast against the tile grid.
// Pillars, tables, glass cases and locked doors cut a cone; open floor does not.
'use strict';

// Tiles that block sight (and movement). Doors stop blocking once unlocked:
// the live grid is consulted through isBlockingTile, which reads game state.
function tileAt(grid, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return '#';
  return grid[ty][tx];
}

function isBlockingTile(grid, tx, ty, openDoors) {
  const t = tileAt(grid, tx, ty);
  if (t === 'D' || t === 'V') return !(openDoors && openDoors.has(tx + ',' + ty));
  return t === '#' || t === 'T' || t === 'P' || t === 'G';
}

// Sampled line-of-sight: true when no blocking tile stands between two
// points (pixel coordinates). Steps in 4px increments — cheap and exact
// enough for a 40px tile.
function hasLineOfSight(grid, x0, y0, x1, y1, openDoors) {
  const dx = x1 - x0, dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 4));
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const tx = Math.floor((x0 + dx * t) / TILE);
    const ty = Math.floor((y0 + dy * t - GRID_TOP) / TILE);
    if (isBlockingTile(grid, tx, ty, openDoors)) return false;
  }
  return true;
}

// Is point (px, py) inside the cone from (ox, oy) facing `dir`?
// Returns a 0..1 visibility strength (1 at point blank, 0 outside).
function coneStrength(ox, oy, dir, range, half, px, py) {
  const dx = px - ox, dy = py - oy;
  const d = Math.hypot(dx, dy);
  if (d > range || d < 1) return d < 1 ? 1 : 0;
  let ang = Math.atan2(dy, dx) - dir;
  while (ang > Math.PI) ang -= Math.PI * 2;
  while (ang < -Math.PI) ang += Math.PI * 2;
  if (Math.abs(ang) > half) return 0;
  const edge = 1 - Math.abs(ang) / half;      // 1 dead centre, 0 at the edge
  const near = 1 - d / range;                  // 1 point blank, 0 at max range
  return Math.min(1, 0.35 + 0.65 * edge) * (0.35 + 0.65 * near);
}

// Cast one ray from (ox, oy) along `angle` until it hits a blocking tile
// or `range`. Returns the hit point in pixels.
function castRay(grid, ox, oy, angle, range, openDoors) {
  const step = 6;
  let d = 0;
  while (d < range) {
    d += step;
    const x = ox + Math.cos(angle) * d;
    const y = oy + Math.sin(angle) * d;
    const tx = Math.floor(x / TILE);
    const ty = Math.floor((y - GRID_TOP) / TILE);
    if (isBlockingTile(grid, tx, ty, openDoors)) {
      return { x, y, d };
    }
  }
  return { x: ox + Math.cos(angle) * range, y: oy + Math.sin(angle) * range, d: range };
}

// Fan of raycast points forming the visible cone polygon (for rendering and
// for the "is the thief inside a lit cone" test — a cone the eye can see).
function conePolygon(grid, ox, oy, dir, range, half, openDoors) {
  const points = [{ x: ox, y: oy }];
  const rays = 14;
  for (let i = 0; i <= rays; i += 1) {
    const a = dir - half + (2 * half * i) / rays;
    points.push(castRay(grid, ox, oy, a, range, openDoors));
  }
  return points;
}

// Does a cone actually see the player? Cone math plus a real line of sight.
function coneSees(grid, ox, oy, dir, range, half, px, py, openDoors) {
  const s = coneStrength(ox, oy, dir, range, half, px, py);
  if (s <= 0) return 0;
  if (!hasLineOfSight(grid, ox, oy, px, py, openDoors)) return 0;
  return s;
}
