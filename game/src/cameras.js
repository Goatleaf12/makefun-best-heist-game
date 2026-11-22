// cameras.js — wall-mounted cameras with their own sweeping blue-white
// cones. A camera fills the alarm slower than a guard, but it never loses
// you while you stand in its cone. An EMP pulse kills every camera in the
// room for EMP_DURATION seconds (sparks and static while dead).
'use strict';

function createCamera(name, def) {
  return {
    name,
    x: tileCenterX(def.x), y: tileCenterY(def.y),
    base: def.base, sweep: def.sweep, period: def.period,
    angle: def.base,
    disabledUntil: 0,   // game time until which the camera is dead
    sparkT: 0,          // spark particle timer while disabled
  };
}

function updateCamera(cam, dt, t) {
  // Oscillating sweep: angle = base + sweep * sin(2π t / period).
  cam.angle = cam.base + cam.sweep * Math.sin((Math.PI * 2 * t) / cam.period);
  if (t < cam.disabledUntil) cam.sparkT -= dt;
}

function cameraDisabled(cam, t) {
  return t < cam.disabledUntil;
}

function empBlast(game) {
  // Kills every camera in the room; costs one EMP use and 5% of the score.
  if (game.tools.empLeft <= 0) return false;
  game.tools.empLeft -= 1;
  game.tools.empUsed += 1;
  for (const cam of game.cameras) {
    cam.disabledUntil = game.time + EMP_DURATION;
    cam.sparkT = 0.2;
  }
  audioEmp();
  game.message = 'EMP pulse — cameras dead for ' + EMP_DURATION + 's (−5% score)';
  game.messageT = 2.5;
  return true;
}

// Does any live camera see the thief? Returns the strongest fill strength.
function cameraSeesThief(game) {
  let best = 0;
  for (const cam of game.cameras) {
    if (cameraDisabled(cam, game.time)) continue;
    const s = coneSees(
      game.level.map, cam.x, cam.y, cam.angle, CAM_RANGE, CAM_HALF,
      game.player.x, game.player.y, game.openDoors,
    );
    if (s > best) best = s;
  }
  return best;
}
