// Service Worker for Push Notifications Only
// 캐싱 기능 완전 제거

// Install event - Service Worker 설치 시
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  // 즉시 활성화
  event.waitUntil(self.skipWaiting());
});

// Activate event - Service Worker 활성화 시
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    Promise.all([
      // 모든 클라이언트 제어
      self.clients.claim(),
      // 모든 캐시 삭제
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      })
    ])
  );
});

// Fetch event - 캐싱 없이 네트워크만 사용
self.addEventListener('fetch', (event) => {
  // 모든 요청을 네트워크로만 처리
  event.respondWith(fetch(event.request));
});

// Push event - 푸시 알림을 받았을 때 실행
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  let notificationData = {
    title: '새로운 알림',
    body: '새로운 메시지가 도착했습니다.',
    icon: '/assets/images/alarm.png',
    badge: '/assets/images/alarm.png',
    tag: `push-${Date.now()}`, // 고유한 태그로 설정
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: '열기',
        icon: ''
      },
      {
        action: 'close',
        title: '닫기',
        icon: ''
      }
    ]
  };

  // 서버에서 전송된 데이터가 있으면 사용
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    requireInteraction: notificationData.requireInteraction,
    actions: notificationData.actions,
    data: {
      url: notificationData.url || '/',
      timestamp: Date.now()
    }
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Notification click event - 알림을 클릭했을 때 실행
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || '/')
    );
  }
});

// Background sync - 백그라운드 동기화
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // 백그라운드에서 동기화할 작업 수행
    console.log('Background sync completed');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
} 