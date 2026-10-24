/**
 * Web Speech Synthesis (Text-to-Speech) client
 * Translates recognized mute signs into natural spoken voice for normal people
 */

let lastSpokenText = "";
let lastSpokenTime = 0;

export function speakText(text, options = {}) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    console.warn("SpeechSynthesis is not supported in this browser.");
    return;
  }

  if (!text || text.trim() === "") return;

  const now = Date.now();
  const cooldown = options.cooldown || 2500; // wait 2.5s before repeating the exact same phrase

  if (text === lastSpokenText && now - lastSpokenTime < cooldown) {
    return; // Don't spam repeated phrases
  }

  // Cancel any currently playing speech if requested
  if (options.interrupt) {
    window.speechSynthesis.cancel();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options.rate || 1.0;
  utterance.pitch = options.pitch || 1.0;
  utterance.volume = options.volume || 1.0;

  // Select English voice if available
  const voices = window.speechSynthesis.getVoices();
  const enVoice = voices.find((v) => v.lang.startsWith("en") && v.name.includes("Natural")) ||
    voices.find((v) => v.lang.startsWith("en"));
  if (enVoice) {
    utterance.voice = enVoice;
  }

  lastSpokenText = text;
  lastSpokenTime = now;

  window.speechSynthesis.speak(utterance);
}

export function stopSpeech() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
