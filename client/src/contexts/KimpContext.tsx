import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { SymbolContainer } from "../assets/styles/components/AlarmList";

export const KimpContext = createContext({
    kimpStatus: [],
    setKimpStatus: (status: any) => { },
    coinList: [],
    setCoinList: (list: any) => { },
    kimpThreshold: '',
    setKimpThreshold: (threshold: string) => { },
    alarmCoin: '',
    setAlarmCoin: (coin: string) => { },
    fetchKimpStatus: () => { },
    setSymbolContainer: (ticker: string) => { },
});

export const useKimpContext = () => {
    return useContext(KimpContext);
}

export default function KimpProvider({ children }: { children: React.ReactNode }) {
    const [kimpStatus, setKimpStatus] = useState<any>([]);
    const [coinList, setCoinList] = useState<any>([]);
    const [kimpThreshold, setKimpThreshold] = useState<string>('');
    const [alarmCoin, setAlarmCoin] = useState<string>('');

    const fetchKimpStatus = useCallback(async () => {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/kimp-status`);
        const status = await response.json();
        setKimpStatus(status);
        setCoinList(status.totalData.map((item: any) => ({ value: item.ticker, label: setSymbolContainer(item.ticker) })));
    }, []);

    const setSymbolContainer = (ticker: string) => {
        return (
            <SymbolContainer className="select-symbol">
                <img src={`https://static.upbit.com/logos/${ticker}.png`} />
                <span>{ticker}</span>
            </SymbolContainer>
        )
    }
    useEffect(() => {
        fetchKimpStatus();
        const kimpInterval = setInterval(fetchKimpStatus, 10000); // 10초마다 업데이트
        return () => clearInterval(kimpInterval);
    }, []);
    return (
        <KimpContext.Provider value={{ kimpStatus, setKimpStatus, coinList, setCoinList, kimpThreshold, setKimpThreshold, alarmCoin, setAlarmCoin, fetchKimpStatus, setSymbolContainer }}>
            {children}
        </KimpContext.Provider>
    )
}