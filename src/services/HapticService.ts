import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

class HapticService {
  private isSupported: boolean;

  constructor() {
    this.isSupported = 'vibrate' in navigator;
  }

  async doorKnock() {
    try {
      // Try native haptics first
      await Haptics.impact({ style: ImpactStyle.Heavy });
      // Add additional vibration for stronger notification
      if (this.isSupported) {
        navigator.vibrate([5]);
      }
    } catch {
      // Fallback to basic vibration
      if (this.isSupported) {
        navigator.vibrate([5]);
      }
    }
  }

  async light() {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      if (this.isSupported) {
        navigator.vibrate(5);
      }
    }
  }

  async medium() {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {
      if (this.isSupported) {
        navigator.vibrate(5);
      }
    }
  }

  async heavy() {
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch {
      if (this.isSupported) {
        navigator.vibrate(5);
      }
    }
  }

  async success() {
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch {
      if (this.isSupported) {
        navigator.vibrate(5);
      }
    }
  }

  async warning() {
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch {
      if (this.isSupported) {
        navigator.vibrate([50, 25, 50]);
      }
    }
  }

  async error() {
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch {
      if (this.isSupported) {
        navigator.vibrate([100, 50, 100]);
      }
    }
  }
}

export default new HapticService();