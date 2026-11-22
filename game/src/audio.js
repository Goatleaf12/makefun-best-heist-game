// audio.js — every sound is synthesized with WebAudio: no audio files,
// no network. Footsteps pan and fade with distance; the camera hums, the
// lockpick ticks, the alarm stings and the getaway jingles.
'use strict';

let audioCtx = null;
let audioMuted = false;
let audioMaster = null;

function audioInit() {
  if (audioCtx) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AC();
    audioMaster = audioCtx.createGain();
    audioMaster.gain.value = 0.5;
    audioMaster.connect(audioCtx.destination);
  } catch (e) {
    audioCtx = null; // headless / no audio device: the game stays silent
  }
}

function audioToggleMute() {
  audioMuted = !audioMuted;
  if (audioMaster) audioMaster.gain.value = audioMuted ? 0 : 0.5;
  return audioMuted;
}

function tone(freq, dur, type, vol, when, slideTo) {
  if (!audioCtx || audioMuted) return;
  try {
    const t0 = audioCtx.currentTime + (when || 0);
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(audioMaster);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  } catch (e) { /* audio is decoration, never fatal */ }
}

function noiseBurst(dur, vol, filterFreq) {
  if (!audioCtx || audioMuted) return;
  try {
    const t0 = audioCtx.currentTime;
    const len = Math.max(1, Math.floor(audioCtx.sampleRate * dur));
    const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq || 1200;
    const gain = audioCtx.createGain();
    gain.gain.value = vol;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(audioMaster);
    src.start(t0);
  } catch (e) { /* never fatal */ }
}

// The thief's own step: soft, short.
function audioStep(sneak) {
  if (sneak) noiseBurst(0.05, 0.05, 500);
  else noiseBurst(0.07, 0.12, 700);
}

// A guard's step, panned and faded by distance to the thief.
function audioFootstep(g, game) {
  if (!audioCtx || audioMuted) return;
  const dx = g.x - game.player.x;
  const d = Math.hypot(dx, g.y - game.player.y);
  if (d > 520) return;
  try {
    const pan = Math.max(-1, Math.min(1, dx / 320));
    const vol = 0.22 * (1 - d / 520);
    const t0 = audioCtx.currentTime;
    const len = Math.floor(audioCtx.sampleRate * 0.08);
    const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    const gain = audioCtx.createGain();
    gain.gain.value = vol;
    const panner = audioCtx.createStereoPanner();
    panner.pan.value = pan;
    src.connect(filter); filter.connect(gain); gain.connect(panner); panner.connect(audioMaster);
    src.start(t0);
  } catch (e) { /* never fatal */ }
}

function audioLoot(kind) {
  if (kind === 'star') {
    tone(880, 0.18, 'sine', 0.25);
    tone(1318, 0.22, 'sine', 0.22, 0.09);
    tone(1760, 0.3, 'sine', 0.2, 0.18);
  } else if (kind === 'jewel') {
    tone(1174, 0.12, 'triangle', 0.2);
    tone(1568, 0.16, 'triangle', 0.18, 0.07);
  } else if (kind === 'painting') {
    tone(523, 0.12, 'triangle', 0.16);
  } else {
    tone(1046, 0.08, 'sine', 0.18);
    tone(1318, 0.1, 'sine', 0.15, 0.05);
  }
}

function audioLockpick() { tone(2400, 0.05, 'square', 0.06); tone(2600, 0.05, 'square', 0.05, 0.12); }
function audioUnlock() { tone(660, 0.1, 'triangle', 0.2); tone(990, 0.16, 'triangle', 0.18, 0.08); }
function audioCutter() { noiseBurst(0.35, 0.1, 3200); }
function audioSmash() { noiseBurst(0.3, 0.35, 900); tone(180, 0.25, 'sawtooth', 0.15, 0, 60); }
function audioCoin() { tone(2093, 0.1, 'sine', 0.2); tone(1568, 0.14, 'sine', 0.14, 0.06); }
function audioEmp() { tone(1200, 0.4, 'sawtooth', 0.18, 0, 90); noiseBurst(0.4, 0.2, 2400); }
function audioSting() { tone(220, 0.5, 'sawtooth', 0.16, 0, 440); tone(233, 0.5, 'sawtooth', 0.12, 0, 466); }
function audioSiren() { tone(620, 0.35, 'square', 0.12, 0, 930); tone(930, 0.35, 'square', 0.12, 0.35, 620); }
function audioJingle() {
  const notes = [523, 659, 784, 1046];
  notes.forEach((n, i) => tone(n, 0.22, 'triangle', 0.2, i * 0.13));
}
function audioCaught() { tone(110, 0.7, 'sawtooth', 0.22, 0, 55); tone(116, 0.7, 'sawtooth', 0.18, 0, 58); }
