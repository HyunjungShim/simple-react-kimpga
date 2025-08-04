export interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  url?: string;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class NotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private isSupported: boolean;
  private readonly STORAGE_KEY = 'push_subscription_data';
  private readonly API_BASE_URL = `${process.env.REACT_APP_API_URL}`;

  constructor() {
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // Service Worker 등록
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    // console.log('registerServiceWorker called');
    // console.log('Service Worker support:', 'serviceWorker' in navigator);
    // console.log('Push Manager support:', 'PushManager' in window);
    
    if (!this.isSupported) {
      console.warn('Push notifications are not supported');
      return null;
    }

    try {
      // console.log('Registering service worker...');
      this.swRegistration = await navigator.serviceWorker.register('/sw.js');
      // console.log('Service Worker registered successfully:', this.swRegistration);
      
      // Service Worker 상태 확인
      if (this.swRegistration.installing) {
        // console.log('Service Worker installing...');
      } else if (this.swRegistration.waiting) {
        // console.log('Service Worker waiting...');
      } else if (this.swRegistration.active) {
        // console.log('Service Worker active!');
      }
      
      return this.swRegistration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  // 알림 권한 요청
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      throw new Error('Push notifications are not supported');
    }

    const permission = await Notification.requestPermission();
    // console.log('Notification permission:', permission);
    return permission;
  }

  // 현재 권한 상태 확인
  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  // 푸시 구독 생성
  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.swRegistration) {
      await this.registerServiceWorker();
    }

    if (!this.swRegistration) {
      throw new Error('Service Worker registration failed');
    }

    const permission = this.getPermissionStatus();
    if (permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    try {
      // 서버에서 VAPID public key 가져오기
      const response = await fetch(`${this.API_BASE_URL}/vapid-public-key`);
      const { publicKey } = await response.json();
      const convertedVapidKey = this.urlBase64ToUint8Array(publicKey);

      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });

      // console.log('Push subscription created:', subscription);
      
      // 구독 정보를 로컬 스토리지에 저장
      this.saveSubscriptionToStorage(subscription);
      
      // 서버에도 구독 정보 전송
      await this.sendSubscriptionToServer(subscription);
      
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push:', error);
      return null;
    }
  }

  // 푸시 구독 해제
  async unsubscribeFromPush(): Promise<boolean> {
    if (!this.swRegistration) {
      return false;
    }

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        // console.log('Push subscription removed');
        
        // 로컬 스토리지에서도 구독 정보 삭제
        this.removeSubscriptionFromStorage();
        
        // 서버에서도 구독 정보 삭제
        await this.removeSubscriptionFromServer(endpoint);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to unsubscribe from push:', error);
      return false;
    }
  }

  // 현재 구독 정보 가져오기
  async getCurrentSubscription(): Promise<PushSubscription | null> {
    if (!this.swRegistration) {
      return null;
    }

    return await this.swRegistration.pushManager.getSubscription();
  }

  // 로컬 알림 전송 (앱이 열려있을 때)
  async showLocalNotification(data: NotificationData): Promise<void> {
    // console.log('showLocalNotification called with data:', data);
    
    if (!this.swRegistration) {
      console.log('No service worker registration, registering...');
      await this.registerServiceWorker();
    }

    if (!this.swRegistration) {
      throw new Error('Service Worker registration failed');
    }

    const permission = this.getPermissionStatus();
    // console.log('Current permission status:', permission);
    
    if (permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    const options: NotificationOptions = {
      body: data.body,
      icon: data.icon || '/assets/images/alarm.png',
      badge: data.badge || '/assets/images/alarm.png',
      tag: data.tag || `notification-${Date.now()}`, // 기본값도 고유하게 설정
      requireInteraction: data.requireInteraction || false,
      data: {
        url: data.url || '/',
        timestamp: Date.now()
      }
    };

    // actions는 TypeScript 타입에 없으므로 any로 캐스팅
    if (data.actions) {
      (options as any).actions = data.actions;
    }

    // console.log('Showing notification with options:', options);
    
    try {
      await this.swRegistration.showNotification(data.title, options);
      //  console.log('Notification shown successfully');
    } catch (error) {
      console.error('Failed to show notification:', error);
      throw error;
    }
  }

  // VAPID 키를 Uint8Array로 변환
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    // URL-safe base64를 표준 base64로 변환
    const base64 = base64String
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    // 패딩 추가 (4의 배수가 되도록)
    const paddedBase64 = base64 + '='.repeat((4 - base64.length % 4) % 4);

    try {
      const rawData = window.atob(paddedBase64);
      const outputArray = new Uint8Array(rawData.length);

      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    } catch (error) {
      console.error('Failed to decode VAPID key:', error);
      throw new Error('Invalid VAPID public key format');
    }
  }

  // 구독 데이터를 서버에 전송할 수 있는 형태로 변환
  subscriptionToJSON(subscription: PushSubscription): PushSubscriptionData {
    const p256dhKey = subscription.getKey('p256dh');
    const authKey = subscription.getKey('auth');
    
    return {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: p256dhKey ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(p256dhKey)))) : '',
        auth: authKey ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(authKey)))) : ''
      }
    };
  }

  // 구독 정보를 로컬 스토리지에 저장
  private saveSubscriptionToStorage(subscription: PushSubscription): void {
    try {
      const subscriptionData = this.subscriptionToJSON(subscription);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(subscriptionData));
      // console.log('Subscription saved to localStorage');
    } catch (error) {
      console.error('Failed to save subscription to localStorage:', error);
    }
  }

  // 로컬 스토리지에서 구독 정보 가져오기
  private getSubscriptionFromStorage(): PushSubscriptionData | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to get subscription from localStorage:', error);
    }
    return null;
  }

  // 저장된 구독 정보 삭제
  private removeSubscriptionFromStorage(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      // console.log('Subscription removed from localStorage');
    } catch (error) {
      console.error('Failed to remove subscription from localStorage:', error);
    }
  }

  // 서버에 구독 정보 전송
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<boolean> {
    try {
      const subscriptionData = this.subscriptionToJSON(subscription);
      // console.log('subscriptionData', subscriptionData);
      const response = await fetch(`${this.API_BASE_URL}/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData)
      });

      if (response.ok) {
        // console.log('Subscription sent to server successfully');
        return true;
      } else {
        console.error('Failed to send subscription to server:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Error sending subscription to server:', error);
      return false;
    }
  }

  // 서버에서 구독 정보 삭제
  private async removeSubscriptionFromServer(endpoint: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ endpoint })
      });

      if (response.ok) {
        // console.log('Subscription removed from server successfully');
        return true;
      } else {
        console.error('Failed to remove subscription from server:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Error removing subscription from server:', error);
      return false;
    }
  }

  // 페이지 로드 시 구독 복원
  async restoreSubscription(): Promise<boolean> {
    // console.log('Attempting to restore subscription...');
    
    const storedData = this.getSubscriptionFromStorage();
    if (!storedData) {
      // console.log('No stored subscription found');
      return false;
    }

    if (!this.swRegistration) {
      await this.registerServiceWorker();
    }

    if (!this.swRegistration) {
      console.error('Service Worker registration failed during restore');
      return false;
    }

    try {
      // 현재 구독 확인
      const currentSubscription = await this.swRegistration.pushManager.getSubscription();
      
      if (currentSubscription) {
        // console.log('Current subscription exists, checking if it matches stored data...');
        const currentData = this.subscriptionToJSON(currentSubscription);
        
        if (currentData.endpoint === storedData.endpoint) {
          // console.log('Subscription already matches stored data');
          return true;
        }
      }

      // 저장된 구독 정보로 새 구독 생성
      // console.log('Creating new subscription from stored data...');
      const vapidPublicKey = 'BLN3Bd-uKJExpFxnKPbgqCk7Yz57KDGeCnEBCF5HtVf95JHUVz6njuKNwTEVbKMBpOgTjkQdlRItdJcLmrDxBtk';
      const convertedVapidKey = this.urlBase64ToUint8Array(vapidPublicKey);

      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });

      // console.log('Subscription restored successfully');
      
      // 서버에도 구독 정보 전송
      await this.sendSubscriptionToServer(subscription);
      
      return true;
    } catch (error) {
      console.error('Failed to restore subscription:', error);
      // 복원 실패 시 저장된 데이터 삭제
      this.removeSubscriptionFromStorage();
      return false;
    }
  }

  // 테스트 알림 전송
  async sendTestNotification(): Promise<void> {
    const timestamp = Date.now();
    const testData: NotificationData = {
      title: `테스트 알림 (${new Date().toLocaleTimeString()})`,
      body: `이것은 테스트 알림입니다! (${timestamp})`,
      icon: '/assets/images/alarm.png',
      tag: `test-${timestamp}`, // 고유한 태그로 설정
      requireInteraction: true,
      actions: [
        {
          action: 'open',
          title: '열기'
        },
        {
          action: 'close',
          title: '닫기'
        }
      ]
    };

    await this.showLocalNotification(testData);
  }
}

export default new NotificationService(); 