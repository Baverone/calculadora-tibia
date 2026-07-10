/**
 * Best-effort audio/voice alerts for timer completion. Both are optional —
 * browsers can block autoplay audio or lack SpeechSynthesis support, so
 * every call is wrapped and failures are swallowed silently (the visual
 * "terminado" state still fires regardless).
 */

export function playBeep(): void {
  try {
    const AudioContextCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextCtor();
    const now = ctx.currentTime;

    [0, 0.22, 0.44].forEach((offset) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.3, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.18);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start(now + offset);
      oscillator.stop(now + offset + 0.2);
    });

    setTimeout(() => ctx.close(), 900);
  } catch {
    // Web Audio unavailable/blocked — ignore.
  }
}

export function announce(text: string): void {
  if (!('speechSynthesis' in window)) return;
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-PT';
    window.speechSynthesis.speak(utterance);
  } catch {
    // SpeechSynthesis unavailable — ignore.
  }
}
