const API_BASE_URL = process.env.REACT_APP_API_URL;

export interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
}

export interface SubscriptionResponse {
  message: string;
}

export interface NotificationResponse {
  message: string;
  results: Array<{
    endpoint: string;
    status: string;
    error?: string;
  }>;
  totalSubscriptions: number;
}

class PushAPI {
  // VAPID 공개키 가져오기
  async getVapidPublicKey(): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/vapid-public-key`);
      const data = await response.json();
      return data.publicKey;
    } catch (error) {
      console.error('Failed to get VAPID public key:', error);
      throw new Error('VAPID 공개키를 가져올 수 없습니다.');
    }
  }

  // 구독 등록
  async registerSubscription(subscription: PushSubscription): Promise<SubscriptionResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to register subscription:', error);
      throw new Error('구독 등록에 실패했습니다.');
    }
  }

  // 구독 해제
  async unregisterSubscription(endpoint: string): Promise<SubscriptionResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ endpoint }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to unregister subscription:', error);
      throw new Error('구독 해제에 실패했습니다.');
    }
  }

  // 모든 구독자에게 알림 전송
  async sendNotificationToAll(data: PushNotificationData): Promise<NotificationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw new Error('알림 전송에 실패했습니다.');
    }
  }

  // 특정 사용자에게 알림 전송
  async sendNotificationToUser(endpoint: string, data: PushNotificationData): Promise<SubscriptionResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/send-notification-to-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint,
          ...data,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to send notification to user:', error);
      throw new Error('사용자에게 알림 전송에 실패했습니다.');
    }
  }

  // 구독 목록 조회
  async getSubscriptions(): Promise<{ subscriptions: Array<{ endpoint: string }>; count: number }> {
    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get subscriptions:', error);
      throw new Error('구독 목록을 가져올 수 없습니다.');
    }
  }

  // 스케줄된 알림 전송
  async scheduleNotification(data: PushNotificationData & { delay: number }): Promise<SubscriptionResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/schedule-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      throw new Error('알림 스케줄링에 실패했습니다.');
    }
  }

  // 테스트 알림 전송
  async sendTestNotification(): Promise<NotificationResponse> {
    const testData: PushNotificationData = {
      title: '테스트 알림',
      body: '서버에서 전송된 테스트 알림입니다!',
      icon: '/assets/images/alarm.png',
      tag: 'test'
    };

    return this.sendNotificationToAll(testData);
  }
}

export default new PushAPI(); 