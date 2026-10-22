/**
 * PatentHub AI - Audio Notification System
 * Synthesizes clear, crisp reminder beeps using the native Web Audio API.
 * Requires zero external audio files, works offline and across all modern browsers.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch (err) {
    console.debug('Web Audio API not supported or blocked:', err);
    return null;
  }
}

/**
 * Checks if reminder sound effects are enabled in user preferences.
 */
export function isReminderSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const pref = localStorage.getItem('patenthub_reminder_sound');
    return pref !== 'false';
  } catch {
    return true;
  }
}

/**
 * Sets user preference for reminder sounds.
 */
export function setReminderSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('patenthub_reminder_sound', enabled ? 'true' : 'false');
  } catch {
    // ignore
  }
}

/**
 * Plays a single clean beep tone.
 * @param frequency Frequency in Hz (default 880Hz / A5)
 * @param duration Duration in seconds (default 0.15s)
 * @param volume Master volume 0.0 to 1.0 (default 0.3)
 */
export function playSingleBeep(frequency = 880, duration = 0.15, volume = 0.3): void {
  if (!isReminderSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (err) {
    console.debug('Failed to play single beep:', err);
  }
}

/**
 * Plays a high-clarity 2-pulse reminder beep notification.
 * Frequency 1: 880 Hz (A5)
 * Frequency 2: 1174.66 Hz (D6)
 * Ideal for alerting users of calendar events, statutory deadlines, and roadmap milestones.
 */
export function playReminderBeep(volume = 0.35): void {
  if (!isReminderSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // First pulse: 880 Hz
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(volume, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.12);

    // Second pulse: 1174.66 Hz (0.15s offset)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1174.66, now + 0.15);
    gain2.gain.setValueAtTime(volume, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.32);
  } catch (err) {
    console.debug('Failed to play reminder beep:', err);
  }
}

/**
 * Triggers a reminder beep and ensures audio context is active (e.g. from a user click).
 */
export function testReminderBeep(): boolean {
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    playReminderBeep(0.4);
    return true;
  } catch {
    return false;
  }
}
