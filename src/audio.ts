let audioCtx: AudioContext | null = null;
let muted = false;

export function isMuted(): boolean {
  return muted;
}

export function toggleMute(): boolean {
  muted = !muted;
  return muted;
}

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'square',
  volume: number = 0.3
): void {
  if (muted) return;
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

function playNoise(duration: number, volume: number = 0.1): void {
  if (muted) return;
  const ctx = getAudioContext();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  const gainNode = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  noise.buffer = buffer;
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1000, ctx.currentTime);

  noise.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  noise.start(ctx.currentTime);
  noise.stop(ctx.currentTime + duration);
}

export function playKettleFill(): void {
  // Bubbling water sound - rising tones
  playNoise(0.3, 0.05);
  playTone(200, 0.1, 'sine', 0.1);
  setTimeout(() => playTone(250, 0.1, 'sine', 0.1), 100);
}

export function playKettleBoil(): void {
  // Bubbling sound
  playNoise(0.2, 0.08);
  playTone(150, 0.15, 'triangle', 0.15);
}

export function playKettleReady(): void {
  // Cheerful ding - kettle is ready!
  playTone(880, 0.1, 'sine', 0.2);
  setTimeout(() => playTone(1100, 0.15, 'sine', 0.2), 100);
}

export function playPourWater(): void {
  // Pouring sound - descending bubbles
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      playTone(400 - i * 40, 0.08, 'sine', 0.1);
      playNoise(0.05, 0.03);
    }, i * 60);
  }
}

export function playAddTeabag(): void {
  // Soft plop
  playTone(180, 0.1, 'triangle', 0.2);
  setTimeout(() => playTone(120, 0.08, 'triangle', 0.15), 50);
}

export function playSteepComplete(): void {
  // Gentle chime
  playTone(523, 0.15, 'sine', 0.15);
  setTimeout(() => playTone(659, 0.15, 'sine', 0.15), 120);
  setTimeout(() => playTone(784, 0.2, 'sine', 0.15), 240);
}

export function playAddMilk(): void {
  // Soft pour
  playNoise(0.15, 0.05);
  playTone(300, 0.1, 'sine', 0.1);
}

export function playAddSugar(): void {
  // Crystalline sprinkle
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      playTone(1200 + Math.random() * 400, 0.05, 'square', 0.08);
    }, i * 40);
  }
}

export function playServeTea(tip: number): void {
  if (tip >= 4) {
    // Great tip - happy ascending arpeggio
    playTone(523, 0.1, 'square', 0.2);
    setTimeout(() => playTone(659, 0.1, 'square', 0.2), 80);
    setTimeout(() => playTone(784, 0.1, 'square', 0.2), 160);
    setTimeout(() => playTone(1047, 0.2, 'square', 0.25), 240);
  } else if (tip >= 2) {
    // Okay tip - simple chime
    playTone(440, 0.1, 'square', 0.2);
    setTimeout(() => playTone(554, 0.15, 'square', 0.2), 100);
  } else {
    // Bad tip - sad descending
    playTone(330, 0.15, 'square', 0.2);
    setTimeout(() => playTone(262, 0.2, 'square', 0.2), 120);
  }
}

export function playCustomerArrive(): void {
  // Door bell / arrival chime
  playTone(660, 0.08, 'sine', 0.15);
  setTimeout(() => playTone(880, 0.12, 'sine', 0.15), 80);
}

export function playCustomerLeave(): void {
  // Sad departure - descending
  playTone(294, 0.15, 'square', 0.2);
  setTimeout(() => playTone(220, 0.2, 'square', 0.2), 100);
  setTimeout(() => playTone(165, 0.25, 'square', 0.15), 200);
}

export function playDayEnd(): void {
  // End of day jingle
  const notes = [523, 587, 659, 784];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.2, 'square', 0.2), i * 150);
  });
}

export function playUpgradeBuy(): void {
  // Coin/purchase sound
  playTone(988, 0.08, 'square', 0.2);
  setTimeout(() => playTone(1319, 0.15, 'square', 0.25), 80);
}

export function playClick(): void {
  // Simple UI click
  playTone(800, 0.05, 'square', 0.15);
}

export function playPause(): void {
  // Descending tone - game stopping
  playTone(600, 0.1, 'square', 0.2);
  setTimeout(() => playTone(400, 0.15, 'square', 0.2), 80);
}

export function playUnpause(): void {
  // Ascending tone - game resuming
  playTone(400, 0.1, 'square', 0.2);
  setTimeout(() => playTone(600, 0.15, 'square', 0.2), 80);
}

export function playDiscard(): void {
  // Pouring down drain sound
  playNoise(0.3, 0.1);
  playTone(200, 0.15, 'triangle', 0.15);
  setTimeout(() => playTone(150, 0.15, 'triangle', 0.1), 100);
  setTimeout(() => playTone(100, 0.2, 'triangle', 0.08), 200);
}
