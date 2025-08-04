// TradingViewWidget.jsx
import React, { useEffect, useRef, memo, useLayoutEffect, useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeProviderWithState';

function TradingViewWidget({ symbol }: { symbol: string }) {
  const container = useRef<HTMLDivElement | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const { theme } = useContext(ThemeContext);
  
  useLayoutEffect(() => {
    if (!container.current) return;
    
    // 기존 스크립트 제거
    if (scriptRef.current) {
      container.current.removeChild(scriptRef.current);
      scriptRef.current = null;
    }
    
    // 컨테이너 초기화
    container.current.innerHTML = "";
    
    // 새로운 스크립트 생성
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.crossOrigin = "anonymous";
    
    let upbitSymbol = `UPBIT:${symbol}KRW`;
    let binanceSymbol = `BINANCE:${symbol}USDT`;

    script.innerHTML = `
    {
      "allow_symbol_change": true,
      "calendar": false,
      "details": false,
      "hide_side_toolbar": false,
      "hide_top_toolbar": false,
      "hide_legend": false,
      "hide_volume": false,
      "hotlist": false,
      "interval": "60",
      "locale": "kr",
      "save_image": true,
      "style": "1",
      "symbol": "${upbitSymbol}",
      "theme": "${theme}",
      "timezone": "Asia/Seoul",
      "backgroundColor": "${theme === 'dark' ? '#0F0F0F' : '#ffffff'}",
      "gridColor": "${theme === 'dark' ? 'rgba(242, 242, 242, 0.06)' : 'rgba(46, 46, 46, 0.06)'}",
      "watchlist": [],
      "withdateranges": true,
      "compareSymbols": [
        {
          "symbol": "${binanceSymbol}",
          "position": "NewPane"
        }
      ],
      "studies": [],
      "autosize": true
    }`;
    
    container.current.appendChild(script);
    scriptRef.current = script;
    
    return () => {
      if (scriptRef.current && container.current) {
        try {
          container.current.removeChild(scriptRef.current);
        } catch (e) {
          // 이미 제거된 경우 무시
        }
        scriptRef.current = null;
      }
    };
  }, [symbol, theme]);

  return (
    <div className="tradingview-widget-container" ref={container} style={{ height: "100%", width: "100%" }}>
    </div>
  );
}

export default memo(TradingViewWidget);