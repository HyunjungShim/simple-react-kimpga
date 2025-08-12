import { useMemo, useState } from "react";
import { Button, Card, FlexBox, ListContainer } from "../../assets/styles/common/CommonStyle";
import { KimpStatus, KimpStatusItem, SymbolContainer } from "../../assets/styles/components/AlarmList";
import { priceFormatter } from "../../utils/textFormatter";
import SearchInput from "../common/SearchInput";
import { sortFilter } from "../../utils/sortFilter";
import TradingViewWidget from "../chart/TradingViewWidget";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleChevronDown } from "@fortawesome/free-solid-svg-icons";
import { BellFilled } from "@ant-design/icons";
import { useTheme } from "styled-components";
import StatusContainer from "../common/StatusContainer";
type KimpListProps = {
    kimpStatus: any,
    handleAlarmOpen: () => void,
    setAlarmCoin: (value: string) => void
}

export default function AlarmList({ kimpStatus, handleAlarmOpen, setAlarmCoin }: KimpListProps) {
    const [chartCoin, setChartCoin] = useState('BTC');
    const [searchInput, setSearchInput] = useState('');
    const [sortKey, setSortKey] = useState({
        'kimp': 'asc',
        'usdtPrice': 'asc',
        'krwPrice': 'asc'
    });
    const [currentSortKey, setCurrentSortKey] = useState<keyof typeof sortKey>('kimp');
    const theme = useTheme();
    const filteredKimpStatus = useMemo(() => {
        return kimpStatus && kimpStatus.totalData ? kimpStatus.totalData.filter((item: any) => item.ticker.toLowerCase().includes(searchInput.toLowerCase().trim())) : [];
    }, [searchInput, kimpStatus]);

    const sortedKimpStatus = useMemo(() => {
        return sortFilter(filteredKimpStatus, currentSortKey, sortKey[currentSortKey] === 'asc' ? 'desc' : 'asc');
    }, [filteredKimpStatus, sortKey, currentSortKey]);

    const handleSort = (key: keyof typeof sortKey) => {
        setCurrentSortKey(key);
        setSortKey({ ...sortKey, [key]: sortKey[key] === 'asc' ? 'desc' : 'asc' });
    }

    return (
        <Card>
            <FlexBox style={{ height: '500px', width: '100%' }}>
                <TradingViewWidget
                    symbol={chartCoin}
                />
            </FlexBox>
            <FlexBox gap="15px" justifycontent="space-between" alignitems="center" padding="20px 0" flexwrap="wrap">
                <h3>현재 김프 상태 📈</h3>
                <span>연결 상태: Binance {kimpStatus.connections?.binance ? '✅' : '❌'} | Upbit {kimpStatus.connections?.upbit ? '✅' : '❌'}</span>
            </FlexBox>
            <SearchInput searchInput={searchInput} setSearchInput={setSearchInput} />
            <KimpStatus>
                <KimpStatusItem className="header-item">
                    <p>코인</p>
                    <p
                        onClick={() => handleSort('kimp')}>
                            김프 
                        <span>
                            <FontAwesomeIcon icon={faCircleChevronDown} flip={sortKey.kimp === 'asc' ? "horizontal" : "vertical"} style={{ color: theme.colors.text }} />
                        </span>
                    </p>
                    {/* <p onClick={() => handleSort('usdtPrice')}>
                        가격(USDT) 
                        <span>
                            <FontAwesomeIcon icon={faCircleChevronDown} flip={sortKey.usdtPrice === 'asc' ? "horizontal" : "vertical"} style={{ color: theme.colors.text }} />
                        </span>
                    </p> */}
                    <FlexBox gap="5px" padding="0 0 0 30px" onClick={() => handleSort('krwPrice')} className="price-wrapper">
                        <span>
                            현재가
                        </span>
                        <span>
                            <FontAwesomeIcon icon={faCircleChevronDown} flip={sortKey.krwPrice === 'asc' ? "horizontal" : "vertical"} style={{ color: theme.colors.text }} />
                        </span>
                    </FlexBox>
                    <p>알람/차트</p>
                </KimpStatusItem>
                <ListContainer minheight="300px">
                    {kimpStatus && kimpStatus.totalData && kimpStatus.totalData.length > 0 ?
                        sortedKimpStatus && sortedKimpStatus.length > 0 ? sortedKimpStatus.map((item: any) => {
                            return (
                                <KimpStatusItem key={item.ticker}>
                                    <SymbolContainer>
                                        <img src={`https://static.upbit.com/logos/${item.ticker}.png`} />
                                        {item.ticker}
                                    </SymbolContainer>
                                    <p>{item.kimp}%</p>
                                    <p>
                                        {priceFormatter(item.krwPrice, 'ko-KR')}
                                        <br/>
                                        {/* {priceFormatter(item.usdtPrice, 'en-US')} */}
                                        {priceFormatter(item.convertedUsdtPrice, 'ko-KR')}
                                    </p>
                                    {/* <p>{priceFormatter(item.krwPrice, 'ko-KR')}</p> */}
                                    <FlexBox gap="10px">
                                        <Button onClick={() => { handleAlarmOpen(); setAlarmCoin(item.ticker) }}>
                                            <BellFilled style={{ color: theme.colors.yellowColor }} />
                                        </Button>
                                        <Button onClick={() => {
                                            setChartCoin(item.ticker);
                                        }}>
                                            📈
                                        </Button>
                                    </FlexBox>
                                </KimpStatusItem>
                            )
                        }) : <StatusContainer status="no-search" />
                        : <StatusContainer status="no-data" />
                    }
                </ListContainer>
            </KimpStatus>
        </Card>
    )
}