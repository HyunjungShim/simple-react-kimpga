const express = require('express');
const webpush = require('web-push');
const cors = require('cors');
const path = require('path');
const fs = require('fs'); // fs 모듈 추가
const CryptoPriceMonitor = require('./coin-socket');

// 환경에 따라 .env 파일 로드
const env = process.env.NODE_ENV || 'development';
require('dotenv').config({ path: `.env.${env}` });

const app = express();
const PORT = process.env.PORT || 8282;

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 정적 파일 서빙 - 캐시 방지
app.use(express.static(path.join(__dirname, '../client/build'), {
  setHeaders: (res, path) => {
    // HTML 파일은 캐시하지 않음
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
    // JS/CSS 파일도 캐시하지 않음 (빌드 해시 문제 해결)
    else if (path.endsWith('.js') || path.endsWith('.css')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// VAPID 키 생성 (실제 프로덕션에서는 환경변수로 관리)
const vapidKeys = webpush.generateVAPIDKeys();

console.log('VAPID Public Key:', vapidKeys.publicKey);
console.log('VAPID Private Key:', vapidKeys.privateKey);

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// 구독 정보를 저장할 배열 (실제로는 데이터베이스 사용)
let subscriptions = [];

// 김프 모니터 초기화
const kimpMonitor = new CryptoPriceMonitor();

// VAPID 공개키 제공
app.get('/api/vapid-public-key', (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

// 구독 등록 (김프 알림 포함)
app.post('/api/subscribe', (req, res) => {
  const { endpoint, keys } = req.body;
  console.log('subscription', endpoint);
  
  // 요청 데이터 검증
  if (!endpoint || !keys) {
    console.error('Invalid subscription data:', req.body);
    return res.status(400).json({ error: 'Invalid subscription data. Endpoint is required.' });
  }
  
  console.log('Received subscription:', endpoint);
  
  // 중복 구독 확인
  const existingIndex = subscriptions.findIndex(
    sub => sub.endpoint === endpoint
  );
  
  if (existingIndex >= 0) {
    subscriptions[existingIndex] = { endpoint, keys };
    console.log('Updated existing subscription:', endpoint);
  } else {
    subscriptions.push({ endpoint, keys });
    console.log('Added new subscription:', endpoint);
  }
  
  // 김프 모니터에 구독자 추가
  kimpMonitor.addSubscriber(endpoint);
  
  console.log('New subscription added:', endpoint);
  res.status(201).json({ message: 'Subscription added successfully' });
});

// 구독 해제
app.post('/api/unsubscribe', (req, res) => {
  const { endpoint } = req.body;
  
  // 요청 데이터 검증
  if (!endpoint) {
    console.error('Invalid unsubscribe request:', req.body);
    return res.status(400).json({ error: 'Endpoint is required for unsubscribe.' });
  }
  
  const initialCount = subscriptions.length;
  subscriptions = subscriptions.filter(sub => sub.endpoint !== endpoint);
  
  // 김프 모니터에서 구독자 제거
  kimpMonitor.removeSubscriber(endpoint);
  
  console.log('Subscription removed:', endpoint, `(${initialCount} -> ${subscriptions.length})`);
  res.json({ message: 'Subscription removed successfully' });
});

// 김프 임계값 업데이트
app.post('/api/update-kimp-threshold', (req, res) => {
  const { endpoint, data } = req.body;
  
  // 요청 데이터 검증
  if (!endpoint || data === undefined || data === null) {
    console.error('Invalid threshold update request:', req.body);
    return res.status(400).json({ error: 'Endpoint and data are required' });
  }

  const { kimpThreshold, coin } = data;

  // 임계값이 숫자인지 확인
  const threshold = parseFloat(kimpThreshold);
  if (isNaN(threshold)) {
    return res.status(400).json({ error: 'kimpThreshold must be a valid number' });
  }
  
  // 기존 구독자 제거 후 새로운 임계값으로 추가
  kimpMonitor.editSubscriberAlarm(endpoint, { kimpThreshold: threshold, coin: coin });
  
  console.log('KIMP threshold updated for:', endpoint, 'to:', threshold);
  res.json({ message: 'KIMP threshold updated successfully' });
});

app.post('/api/remove-subscriber-alarm', (req, res) => {
  const { endpoint, data } = req.body;
  
  kimpMonitor.removeSubscriberAlarm(endpoint, data);
  
  res.json({ message: 'Subscriber alarm removed successfully' });
});

app.post('/api/subscriber-alarm', (req, res) => {
  const { endpoint } = req.body;
  
  if (!endpoint) {
    return res.status(400).json({ error: 'Endpoint is required' });
  }
  
  const alarmList = kimpMonitor.getSubscriberAlarm(endpoint);
  
  // alarmList가 undefined인 경우 빈 배열로 처리
  const data = alarmList || [];
  
  console.log('Subscriber alarm request:', { endpoint, alarmList: data });
  
  res.json({
    data: data, 
    message: 'Subscriber alarm fetched successfully'
  });
});

// 김프 상태 조회
app.get('/api/kimp-status', (req, res) => {
  const status = kimpMonitor.getStatus();
  res.json(status);
});

// 모든 구독자에게 알림 전송
app.post('/api/send-notification', async (req, res) => {
  const { title, body, icon, url, tag } = req.body;
  
  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required' });
  }
  
  const payload = JSON.stringify({
    title,
    body,
    icon: icon || '/logo192.png',
    url: url || '/',
    tag: tag || 'default'
  });
  
  const results = [];
  
  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(subscription, payload);
      results.push({ endpoint: subscription.endpoint, status: 'success' });
    } catch (error) {
      console.error('Error sending notification:', error);
      
      // 구독이 만료된 경우 제거
      if (error.statusCode === 410) {
        subscriptions = subscriptions.filter(sub => sub.endpoint !== subscription.endpoint);
        kimpMonitor.removeSubscriber(subscription.endpoint);
      }
      
      results.push({ 
        endpoint: subscription.endpoint, 
        status: 'error', 
        error: error.message 
      });
    }
  }
  
  res.json({ 
    message: 'Notifications sent', 
    results,
    totalSubscriptions: subscriptions.length
  });
});

// 특정 구독자에게 알림 전송
app.post('/api/send-notification-to-user', async (req, res) => {
  const { endpoint, title, body, icon, url, tag } = req.body;
  
  if (!endpoint || !title || !body) {
    return res.status(400).json({ error: 'Endpoint, title and body are required' });
  }
  
  const subscription = subscriptions.find(sub => sub.endpoint === endpoint);
  
  if (!subscription) {
    return res.status(404).json({ error: 'Subscription not found' });
  }
  
  const payload = JSON.stringify({
    title,
    body,
    icon: icon || '/logo192.png',
    url: url || '/',
    tag: tag || 'default'
  });
  
  try {
    await webpush.sendNotification(subscription, payload);
    res.json({ message: 'Notification sent successfully' });
  } catch (error) {
    console.error('Error sending notification:', error);
    
    if (error.statusCode === 410) {
      subscriptions = subscriptions.filter(sub => sub.endpoint !== endpoint);
      kimpMonitor.removeSubscriber(endpoint);
    }
    
    res.status(500).json({ error: error.message });
  }
});

// 구독 목록 조회
app.get('/api/subscriptions', (req, res) => {
  res.json({ 
    subscriptions: subscriptions.map(sub => ({ endpoint: sub.endpoint })),
    count: subscriptions.length 
  });
});

// 스케줄된 알림 전송 (예시)
app.post('/api/schedule-notification', (req, res) => {
  const { title, body, delay } = req.body;
  
  if (!title || !body || !delay) {
    return res.status(400).json({ error: 'Title, body and delay are required' });
  }
  
  setTimeout(async () => {
    const payload = JSON.stringify({
      title,
      body,
      icon: '/logo192.png',
      tag: 'scheduled'
    });
    
    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(subscription, payload);
        console.log('Scheduled notification sent to:', subscription.endpoint);
      } catch (error) {
        console.error('Error sending scheduled notification:', error);
      }
    }
  }, delay * 1000);
  
  res.json({ message: 'Notification scheduled successfully' });
});

// React 앱 라우팅 - 정적 파일 우선 확인
app.get('*', (req, res) => {
  const filePath = path.join(__dirname, '../client/build', req.path);
  
  // 정적 파일이 존재하는지 확인
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.sendFile(filePath);
  } else {
    // 정적 파일이 없으면 HTML 반환
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`Push notification server running on port ${PORT}`);
  console.log('VAPID Public Key:', vapidKeys.publicKey);
  console.log('KIMP monitoring started');
});

// 프로세스 종료 시 정리
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  kimpMonitor.close();
  process.exit(0);
});

module.exports = app; 