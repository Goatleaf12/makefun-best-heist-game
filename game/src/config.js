// config.js — every tunable number for GILT & SMOKE lives here, so balance
// can be probed and tuned without touching the systems that use them.
'use strict';

// Canvas and grid.
const TILE = 40;               // pixels per tile
const COLS = 32;               // tiles across
const ROWS = 16;               // tiles down
const HUD_H = 80;              // top HUD strip height in pixels
const VIEW_W = COLS * TILE;    // 1280
const VIEW_H = HUD_H + ROWS * TILE; // 720
const GRID_TOP = HUD_H;        // pixel y of the first map row

// Player movement.
const PLAYER_SPEED = 150;      // px/s walking
const PLAYER_RADIUS = 12;
const SNEAK_MULT = 0.55;       // Shift = tiptoe, slower but quieter
const CARRY_SLOW = 0.08;       // -8% speed per filled carry slot
const MAX_SLOTS = 4;           // carry slots (paintings / jewels / Star)

// Vision cones.
const GUARD_RANGE = 205;       // px, ~5 tiles
const GUARD_HALF = 0.61;       // radians, ~35 degrees each side
const CAM_RANGE = 225;
const CAM_HALF = 0.5;
const GUARD_FOV_FILL = 58;     // alarm points/s at point blank, full light
const CAM_FOV_FILL = 30;       // cameras fill slower than guards
const SNEAK_FILL_MULT = 0.45;  // sneaking halves how fast you are spotted

// Alarm meter (global, 0-100, recoverable).
const ALARM_CALM = 35;         // below this: CALM
const ALARM_HUNT = 70;         // at/above this: HUNT
const ALARM_MAX = 100;         // LOCKDOWN
const ALARM_DECAY = 6;         // points/s drained while unseen
const ALARM_LOCKDOWN_TIME = 8; // seconds doors stay sealed at 100
const ALARM_CAUGHT_HOLD = 1.0; // seconds standing seen at 100 before caught
const LOCKDOWN_DRAIN_TO = 55;  // alarm falls back to this after lockdown

// Guards.
const GUARD_SPEED = 62;        // px/s on patrol
const GUARD_HUNT_SPEED = 118;  // px/s chasing
const GUARD_CATCH_DIST = 20;   // px: touching the thief while hunting

// Tools and their costs.
const LOCKPICK_TIME = 2.5;     // seconds channelling on a locked door
const CUTTER_TIME = 3.0;       // seconds cutting a glass case, silently
const PAINT_TIME = 1.0;        // seconds lifting a painting off the wall
const STAR_TIME = 2.0;         // seconds prising the Meridian Star free
const SMASH_ALARM = 25;        // alarm added by smashing a case (F)
const EMP_PER_ROOM = 2;        // EMP pulses per room
const EMP_DURATION = 10;       // seconds cameras stay dead after an EMP
const EMP_SCORE_COST = 0.05;   // -5% final score per EMP used
const COINS_PER_ROOM = 3;      // decoy coins per room
const COIN_LURE_RADIUS = 320;  // px: guards inside this hear the coin

// Getaway.
const GETAWAY_TIME = 45;       // seconds to reach the van once the Star is taken
const GETAWAY_LATE_PENALTY = 0.2; // -20% score if the van already left

// Loot values are in levels.js (LOOT). Score: loot $ is the score;
// EMP and late-van penalties multiply it at the results screen.
