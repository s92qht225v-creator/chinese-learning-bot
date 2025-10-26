// Text-to-Speech utility for Chinese pronunciation
class ChineseTTS {
  constructor() {
    this.synth = window.speechSynthesis;
    this.voice = null;
    this.initVoice();
  }

  // Initialize Chinese voice
  initVoice() {
    const loadVoices = () => {
      const voices = this.synth.getVoices();
      // Try to find a Chinese voice (Mandarin)
      this.voice = voices.find(voice => 
        voice.lang === 'zh-CN' || 
        voice.lang === 'zh-TW' || 
        voice.lang.startsWith('zh')
      );
      
      // Fallback to any available voice if no Chinese voice found
      if (!this.voice && voices.length > 0) {
        this.voice = voices[0];
        console.warn('No Chinese voice found, using default voice');
      }
    };

    // Load voices
    loadVoices();
    
    // Some browsers load voices asynchronously
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoices;
    }
  }

  // Speak Chinese text
  speak(text, options = {}) {
    if (!this.synth) {
      console.error('Speech synthesis not supported');
      return;
    }

    // Cancel any ongoing speech
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice if available
    if (this.voice) {
      utterance.voice = this.voice;
    }
    
    // Set language to Chinese
    utterance.lang = 'zh-CN';
    
    // Set rate, pitch, and volume
    utterance.rate = options.rate || 0.9; // Slightly slower for learning
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume || 1.0;
    
    // Optional callbacks
    if (options.onEnd) {
      utterance.onend = options.onEnd;
    }
    if (options.onError) {
      utterance.onerror = options.onError;
    }
    
    this.synth.speak(utterance);
  }

  // Stop speaking
  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  // Check if speech synthesis is supported
  isSupported() {
    return 'speechSynthesis' in window;
  }

  // Get available voices
  getVoices() {
    return this.synth ? this.synth.getVoices() : [];
  }
}

// Create global instance
const tts = new ChineseTTS();
