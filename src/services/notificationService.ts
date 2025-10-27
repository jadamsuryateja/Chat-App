let registration: ServiceWorkerRegistration | null = null;
let isAppVisible = true;

export async function initNotificationService() {
  if (!('serviceWorker' in navigator) || !('Notification' in window)) {
    console.log('Notifications not supported');
    return false;
  }

  try {
    registration = await navigator.serviceWorker.register('/service-worker.js');
    console.log('Service Worker registered');

    document.addEventListener('visibilitychange', () => {
      isAppVisible = document.visibilityState === 'visible';
    });

    return true;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return false;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

interface ExtendedNotificationOptions extends NotificationOptions {
  vibrate?: number[];
}

export async function showNotification(title: string, body: string, roomId: string) {
  if (!registration || isAppVisible) {
    return;
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  try {
    await registration.showNotification(title, {
      body,
      icon: '/app.png',
      badge: '/app.png',
      tag: `chat-${roomId}`,
      requireInteraction: false,
      silent: false,
      vibrate: [5],
      actions: [
        {
          action: 'reply',
          title: 'Reply',
        },
      ],
      data: {
        roomId,
        url: '/',
      },
    } as ExtendedNotificationOptions);
  } catch (error) {
    console.error('Failed to show notification:', error);
  }
}

export function triggerHapticFeedback() {
  if ('vibrate' in navigator) {
    navigator.vibrate([5]);
  }
}

export function isAppInForeground(): boolean {
  return isAppVisible;
}
