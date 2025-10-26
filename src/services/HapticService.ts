class HapticService {
  private isSupported: boolean;

  constructor() {
    this.isSupported = 'vibrate' in navigator;
  }

  light() {
    if (this.isSupported) {
      navigator.vibrate(5);
    }
  }

  medium() {
    if (this.isSupported) {
      navigator.vibrate(5);
    }
  }

  heavy() {
    if (this.isSupported) {
      navigator.vibrate(5);
    }
  }

  success() {
    if (this.isSupported) {
      navigator.vibrate([5]);
    }
  }

  warning() {
    if (this.isSupported) {
      navigator.vibrate([50, 25, 50]);
    }
  }

  error() {
    if (this.isSupported) {
      navigator.vibrate([100, 50, 100]);
    }
  }

  doorKnock() {
    if (this.isSupported) {
      navigator.vibrate(5);
    }
  }
}

export default new HapticService();