const WebSocket = require('ws');
const axios = require('axios');
const { urlencoded } = require('express');

// 환경에 따라 .env 파일 로드
const env = process.env.NODE_ENV || 'development';
require('dotenv').config({ path: `.env.${env}` });

const PORT = process.env.PORT || 8282;
const API_URL = process.env.SERVER_URL || 'http://localhost:8282';
console.log('API_URL',API_URL);
class CryptoPriceMonitor {
  constructor() {
    this.kimpPercentage = 0;
    this.subscribers = new Map(); // endpoint -> {kimpThreshold, lastNotified}
    this.isConnected = {
      binance: false,
      upbit: false
    };
    
    // WebSocket 연결
    this.binanceWs = null;
    this.upbitWs = null;
    this.usdkrw = 0; // 환율 저장
    this.upbitMarket = [];
    this.binanceMarket = [];
    this.upbitData = [];
    this.binanceData = [];
    this.totalData = [];
    this.fetchExchangeRate();
    this.initConnections();
    
    // 환율 주기적 갱신 (5분마다)
    setInterval(() => this.fetchExchangeRate(), 5 * 60 * 1000);
  }

  // 구독자 추가
  addSubscriber(endpoint) {
    this.subscribers.set(endpoint, {
      alarmList: [],
      lastNotified: 0 // 0으로 설정하면 즉시 알림 가능
    });
    console.log(`Subscriber added: ${endpoint}`);
  }
  // 구독자 제거
  removeSubscriber(endpoint) {
    this.subscribers.delete(endpoint);
    console.log(`Subscriber removed: ${endpoint}`);
  }
  editSubscriberAlarm(endpoint, data) {
    const existingSubscriber = this.subscribers.get(endpoint);
    if (!existingSubscriber) {
      console.error(`Subscriber not found: ${endpoint}`);
      return;
    }
    if(existingSubscriber.alarmList.findIndex(item => item.coin === data.coin && item.kimpThreshold === data.kimpThreshold) >= 0) {
      console.log(`Subscriber already exists: ${endpoint} ${data.coin} ${data.kimpThreshold}`);
      return;
    }

    this.subscribers.set(endpoint, {
      alarmList: [...existingSubscriber.alarmList, data],
      lastNotified: 0 // 새로운 알람 추가시 즉시 알림 가능
    });
    console.log(`Subscriber edited: ${endpoint},${JSON.stringify(this.subscribers.get(endpoint))}`);
  }
  removeSubscriberAlarm(endpoint, data) {
    const existingSubscriber = this.subscribers.get(endpoint);
    if (!existingSubscriber) {
      console.error(`Subscriber not found: ${endpoint}`);
      return;
    }
    this.subscribers.set(endpoint, {
      alarmList: existingSubscriber.alarmList.filter(item => item.coin !== data.coin || item.kimpThreshold !== data.kimpThreshold),
      lastNotified: 0
    });
    console.log('existingSubscriber.alarmList',existingSubscriber.alarmList);
    console.log('data',data);
    console.log(`Subscriber alarm removed: ${endpoint},${JSON.stringify(this.subscribers.get(endpoint))}`);
  }
  getSubscriberAlarm(endpoint) {
    const existingSubscriber = this.subscribers.get(endpoint);
    if (!existingSubscriber) {
      console.log(`Subscriber not found: ${endpoint}, returning empty array`);
      return []; // 빈 배열 반환
    }
    console.log(`Found subscriber alarms for ${endpoint}:`, existingSubscriber.alarmList);
    return existingSubscriber.alarmList;
  }
  // 구독자 목록 반환
  getSubscribers() {
    return Array.from(this.subscribers.keys());
  }

  // Binance WebSocket 연결
  initBinanceConnection() {
    try {
      this.binanceWs = new WebSocket('wss://stream.binance.com:9443/ws/!miniTicker@arr');
      
      this.binanceWs.on('open', () => {
        console.log('Binance WebSocket connected');
        this.isConnected.binance = true;
      });

      this.binanceWs.on('message', (data) => {
        try {
          const tickers = JSON.parse(data);
          if(!this.binanceData){
            this.binanceData = [];
          }
          let result = tickers.filter(item => item.s.includes('USDT')).map((item)=> {
            const existingIndex = this.binanceData.findIndex(data => data.ticker === item.s.split('USDT')[0]);
            if (existingIndex >= 0) {
                this.binanceData[existingIndex].price = item.c;
            } else {
                this.binanceData.push({
                    ticker: item.s.split('USDT')[0],
                    price: item.c
                });
            }
          });
        //   console.log('binanceData',this.binanceData,this.binanceData.length);
          
          this.calculateKimp();
        } catch (error) {
          console.error('Error parsing Binance data:', error);
        }
      });

      this.binanceWs.on('error', (error) => {
        console.error('Binance WebSocket error:', error);
        this.isConnected.binance = false;
      });

      this.binanceWs.on('close', () => {
        console.log('Binance WebSocket disconnected');
        this.isConnected.binance = false;
        // 재연결 시도
        setTimeout(() => this.initBinanceConnection(), 5000);
      });

    } catch (error) {
      console.error('Error initializing Binance connection:', error);
      this.isConnected.binance = false;
    }
  }

  // Upbit WebSocket 연결
  initUpbitConnection() {
    try {
    
      this.upbitWs = new WebSocket('wss://api.upbit.com/websocket/v1');
      
      this.upbitWs.on('open', () => {
        console.log('Upbit WebSocket connected');
        this.isConnected.upbit = true;
        
        // BTC/KRW 티커 구독 요청
        const subscribeMessage = JSON.stringify([
          { ticket: "UNIQUE_TICKET" },
          { type: "ticker", codes: this.upbitMarket,is_only_realtime: true },
          {format:"SIMPLE_LIST"}
        ]);
        
        this.upbitWs.send(subscribeMessage);
      });

      this.upbitWs.on('message', (data) => {
        try {
            const tickers = JSON.parse(data);
            
            if (!this.upbitData) {
                this.upbitData = [];
            }

            // 받은 데이터를 기존 데이터에 병합/업데이트
            tickers.forEach((item) => {
                const ticker = item.cd.split('KRW-')[1];
                const price = item.tp;
                
                // 기존에 있는지 확인하고 업데이트 또는 추가
                const existingIndex = this.upbitData.findIndex(data => data.ticker === ticker);
                if (existingIndex >= 0) {
                    this.upbitData[existingIndex].price = price;
                } else {
                    this.upbitData.push({
                        ticker: ticker,
                        price: price
                    });
                }
            });
            // console.log('upbitData',this.upbitData);
            this.calculateKimp();
          
        } catch (error) {
          console.error('Error parsing Upbit data:', error);
        }
      });

      this.upbitWs.on('error', (error) => {
        console.error('Upbit WebSocket error:', error);
        this.isConnected.upbit = false;
      });

      this.upbitWs.on('close', () => {
        console.log('Upbit WebSocket disconnected');
        this.isConnected.upbit = false;
        // 재연결 시도
        setTimeout(() => this.initUpbitConnection(), 5000);
      });

    } catch (error) {
      console.error('Error initializing Upbit connection:', error);
      this.isConnected.upbit = false;
    }
  }

  // 모든 연결 초기화
  async initConnections() {
    await this.fetchUpbitMarket();
    await this.fetchBinanceMarket();
    this.initBinanceConnection();
    this.initUpbitConnection();
  }

  async fetchUpbitMarket() {
    try {
      const marketRes = await axios.get('https://api.upbit.com/v1/market/all?is_details=false');
    //   console.log('upbit market',res.data);
      let result = marketRes.data.filter(item => item.market.includes('KRW-')).map(item => item.market);
      this.upbitMarket = result;
      const tickerRes = await axios.get('https://api.upbit.com/v1/ticker/all?quote_currencies=KRW');
      
      this.upbitData = tickerRes.data.map(item => ({
        ticker: item.market.split('KRW-')[1],
        price: item.trade_price
      }));
    //   console.log('upbitData',this.upbitData,this.upbitData.length);
      
    } catch (e) {
      console.error('환율 가져오기 실패:', e);
    }
  }
  async fetchBinanceMarket() {
    try {
      // 정확한 JSON 배열 형식으로 만들기
    //   const binanceRes = await axios.get('https://api.binance.com/api/v3/exchangeInfo')
    //   this.binanceMarket = binanceRes.data.symbols.filter(item => item.quoteAsset == "USDT").map(item => item.symbol)
    //   const symbolsArray = this.binanceMarket.map(symbol => `"${symbol}"`);
    //   const symbolsParam = `[${symbolsArray.join(',')}]`;
    //   console.log('symbolsParam:', symbolsParam,'symbolsArray',symbolsArray);
      
    //   const marketRes = await axios.get(`https://api.binance.com/api/v3/ticker/24hr?symbols=${symbolsParam}&type=MINI`);
    const marketRes = await axios.get(`https://api.binance.com/api/v3/ticker/24hr?type=MINI`);
    //   console.log('binance market',marketRes.data);
      this.binanceData = marketRes.data.filter(item => item.symbol.endsWith('USDT')).map(item => ({
        ticker: item.symbol.replace('USDT', ''),
        price: parseFloat(item.lastPrice)
    }));
    // console.log('binanceData',this.binanceData);
      
    } catch (e) {
      console.error('바이낸스 마켓 가져오기 실패:', e);
    }
  }
  // 환율 갱신 함수
  async fetchExchangeRate() {
    try {
      const res = await axios.get('https://api.frankfurter.app/latest?from=USD&to=KRW');
      this.usdkrw = res.data.rates.KRW;
    //   console.log('환율(USD/KRW):', this.usdkrw);
    } catch (e) {
      console.error('환율 가져오기 실패:', e);
    }
  }

  // 김프 계산식 수정
  calculateKimp() {
    if (!this.binanceData || !this.upbitData || !this.usdkrw) return;
    // console.log(this.upbitData,this.binanceData);
    
    this.totalData = this.binanceData
      .filter((item) => {
        // upbitItem이 있는 항목만 필터링
        return this.upbitData.find(upbitItem => upbitItem.ticker === item.ticker) && item.price > 0;
      })
      .map((item) => {
        let upbitItem = this.upbitData.find(upbitItem => upbitItem.ticker === item.ticker);
        return {
          ticker: item.ticker,
          usdtPrice: item.price,
          krwPrice: upbitItem.price,
          kimp: (((upbitItem.price - item.price * this.usdkrw) / (item.price * this.usdkrw)) * 100).toFixed(2)
        };
      });
    
    // 구독자들에게 알림 전송
    this.checkAndNotifySubscribers();
  }

  // 구독자들에게 알림 전송
  checkAndNotifySubscribers() {
    const currentTime = Date.now();
    const cooldownPeriod = 5 * 60 * 1000; // 5분 쿨다운

    // 각 사용자별로 알림 체크
    for (const [endpoint, config] of this.subscribers) {
      const { alarmList, lastNotified } = config;
      
      // 쿨다운 체크 (lastNotified가 0이면 즉시 알림 가능)
      if (lastNotified !== 0 && currentTime - lastNotified < cooldownPeriod) {
        continue; // 쿨다운 기간이면 스킵
      }
      
      // 각 코인별로 알림 조건 체크
      for (const alarm of alarmList) {
        const { coin, kimpThreshold } = alarm;
        
        // 해당 코인의 현재 김프 찾기
        const coinData = this.totalData.find(item => item.ticker === coin);
        if (!coinData) continue; // 해당 코인 데이터가 없으면 스킵
        
        const currentKimp = parseFloat(coinData.kimp);
        
        // 임계값을 넘었는지 체크 (양수/음수 모두 고려)
        if (currentKimp >= kimpThreshold) {
          console.log(`Alarm triggered for ${endpoint}: ${coin} KIMP ${currentKimp}% (abs: ${Math.abs(currentKimp)}%) >= ${kimpThreshold}%`);
          
          // 알림 전송
          this.sendKimpNotification(endpoint, coin, currentKimp,kimpThreshold);
          
          // 마지막 알림 시간 업데이트
          config.lastNotified = currentTime;
          // break; // 한 번 알림 보냈으면 다른 코인은 체크하지 않음
        }
      }
    }
  }

  // 김프 알림 전송
  async sendKimpNotification(endpoint, coin, kimpValue, kimpThreshold) {
    const sign = kimpValue > 0 ? '+' : '';
    const title = `${coin} 김프 알림 🚨`;
    const body = `지정 김프 도달: ${kimpThreshold}% \n현재 김프 : ${sign}${kimpValue.toFixed(2)}%`;
    
    const notificationData = {
      endpoint,
      title,
      body,
      icon: '/assets/images/alarm.png',
      url: '/',
      tag: `kimp-alert-${coin}`
    };

    // 푸시 서버로 알림 전송 요청
    try {
      const response = await axios.post(`${API_URL}/send-notification-to-user`, notificationData);
      console.log(`KIMP notification sent to ${endpoint}: ${coin} ${sign}${kimpValue.toFixed(2)}%`);
    } catch (error) {
      console.error('Error sending KIMP notification:', error.message);
    }
  }

  // 현재 상태 반환
  getStatus() {
    return {
    //   binanceData: this.binanceData,
    //   upbitData: this.upbitData,
      totalData: this.totalData,
      connections: this.isConnected,
      subscribersCount: this.subscribers.size
    };
  }

  // 연결 종료
  close() {
    if (this.binanceWs) {
      this.binanceWs.close();
    }
    if (this.upbitWs) {
      this.upbitWs.close();
    }
  }
}

module.exports = CryptoPriceMonitor;
