// alarm.js — the one global alarm meter, 0–100, in four tiers that can
// always recover. CALM < 35 · SUSPICIOUS 35–69 · HUNT 70–99 · LOCKDOWN 100.
// Being seen fills it; hiding drains it. Being caught is never instant:
// a guard must touch you while hunting, or you must stand seen at 100
// for a full second.
'use strict';

// Tier index: 0 CALM, 1 SUSPICIOUS, 2 HUNT, 3 LOCKDOWN.
function alarmTier(value) {
  if (value >= ALARM_MAX) return 3;
  if (value >= ALARM_HUNT) return 2;
  if (value >= ALARM_CALM) return 1;
  return 0;
}

const ALARM_NAMES = ['CALM', 'SUSPICIOUS', 'HUNT', 'LOCKDOWN'];
const ALARM_COLORS = ['#d8c26a', '#e8963c', '#e0523c', '#ff2e4d'];

function createAlarm() {
  return {
    value: 0,
    tier: 0,
    lockdownT: 0,      // seconds left of a lockdown seal
    caughtHold: 0,     // seconds the thief has stood seen at 100
    maxValue: 0,       // highest meter reached this run (results screen)
    seenNow: false,    // any guard or camera sees the thief this frame
  };
}

// seenStrength: 0..1 combined visibility this frame (guard or camera).
// sneak: true while tiptoeing. Returns nothing; mutates the alarm.
function updateAlarm(alarm, dt, seenStrength, sneak, game) {
  const prevTier = alarm.tier;
  if (alarm.lockdownT > 0) {
    alarm.lockdownT -= dt;
    if (alarm.lockdownT <= 0) {
      alarm.value = LOCKDOWN_DRAIN_TO;
      game.message = 'Lockdown lifted — the alarm is draining. Move.';
      game.messageT = 3;
    }
  } else if (seenStrength > 0) {
    const rate = seenStrength * (sneak ? SNEAK_FILL_MULT : 1);
    alarm.value = Math.min(ALARM_MAX, alarm.value + GUARD_FOV_FILL * rate * dt);
    alarm.seenNow = true;
    if (alarm.value >= ALARM_MAX) {
      alarm.lockdownT = ALARM_LOCKDOWN_TIME;
      alarm.caughtHold = 0;
      game.message = 'LOCKDOWN — doors sealed for ' + ALARM_LOCKDOWN_TIME + 's. Break line of sight!';
      game.messageT = 3;
      audioSiren();
    }
  } else {
    alarm.value = Math.max(0, alarm.value - ALARM_DECAY * dt);
    alarm.seenNow = false;
    if (alarm.value >= ALARM_MAX) alarm.caughtHold = 0;
  }
  alarm.maxValue = Math.max(alarm.maxValue, alarm.value);
  alarm.tier = alarmTier(alarm.value);
  if (alarm.tier !== prevTier) {
    if (alarm.tier === 1) audioSting();
    if (alarm.tier === 2) audioSiren();
    game.stats.timesSeen += alarm.tier > prevTier && alarm.tier >= 1 ? 1 : 0;
  }
  // Standing seen at 100 for a full second is a fair catch.
  if (alarm.value >= ALARM_MAX && alarm.seenNow) {
    alarm.caughtHold += dt;
  } else {
    alarm.caughtHold = 0;
  }
}

// Is the thief caught right now? Touch while hunting, or a full second seen
// at maximum alarm.
function isCaught(game) {
  if (game.alarm.caughtHold >= ALARM_CAUGHT_HOLD) return 'spotted at full alarm';
  if (game.alarm.tier >= 2) {
    for (const g of game.guards) {
      const d = Math.hypot(g.x - game.player.x, g.y - game.player.y);
      if (d < GUARD_CATCH_DIST + PLAYER_RADIUS) return 'grabbed by ' + guardDisplayName(g);
    }
  }
  return null;
}

function guardDisplayName(g) {
  return g.name.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
}
