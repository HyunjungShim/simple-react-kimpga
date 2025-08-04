// Service Worker for Push Notifications
const CACHE_NAME = 'kimpga-v3'; // 버전 업데이트
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
];

// Install event - Service Worker 설치 시 캐시 생성
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // 캐시 추가 시 에러 처리
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(error => {
              console.warn('Failed to cache URL:', url, error);
            })
          )
        );
      })
      .then(() => {
        // 이전 캐시들 삭제
        return caches.keys().then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              if (cacheName !== CACHE_NAME) {
                console.log('Deleting old cache:', cacheName);
                return caches.delete(cacheName);
              }
            })
          );
        });
      })
  );
});

// Fetch event - 네트워크 요청 처리
self.addEventListener('fetch', (event) => {
  // Chrome 확장 프로그램 요청은 캐시하지 않음
  if (event.request.url.startsWith('chrome-extension://') || 
      event.request.url.startsWith('chrome://') ||
      event.request.url.startsWith('moz-extension://')) {
    return;
  }

  // HTML 파일이나 JS/CSS 파일은 네트워크 우선, 캐시 폴백
  if (event.request.method === 'GET' && 
      (event.request.url.includes('.js') || 
       event.request.url.includes('.css') || 
       event.request.url.includes('index.html'))) {
    
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // 성공하면 캐시에 저장 (HTTPS 또는 localhost만)
          if (response.status === 200 && 
              (event.request.url.startsWith('https://') || 
               event.request.url.startsWith('http://localhost') ||
               event.request.url.startsWith('http://127.0.0.1'))) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone).catch((error) => {
                console.warn('Failed to cache request:', event.request.url, error);
              });
            });
          }
          return response;
        })
        .catch(() => {
          // 네트워크 실패시 캐시에서 가져오기
          return caches.match(event.request);
        })
    );
  } else {
    // 다른 리소스는 기존 로직 유지
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request);
        })
    );
  }
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