import { Button, Card, DangerButton, FlexBox, ListContainer, Status, Title, SuccessButton } from "../../assets/styles/common/CommonStyle";
import { KimpStatusItem, KimpStatus, SymbolContainer } from "../../assets/styles/components/AlarmList";
import useManageAlarm from "../../hooks/useManageAlarm";
import useGetAuth from "../../hooks/useManageAuth";
import { getAlarmStatusText } from "../../utils/textFormatter";
import { useKimpContext } from "../../contexts/KimpContext";
import EditAlarmModal from "../../components/nofication/EditAlarmModal";
import { useMemo, useCallback, useState, useEffect } from "react";
import SearchInput from "../../components/common/SearchInput";
import { SettingFilled,EditOutlined,DeleteOutlined } from "@ant-design/icons";
import StatusContainer from "../../components/common/StatusContainer";

export default function UserSetting() {
    const [searchInput, setSearchInput] = useState('');

    const { permissionStatus, isSubscribed, isLoading, isRestoring, handleRequestPermission, handleSubscribe, handleUnsubscribe, subscriberAlarmList, getSubscriberAlarmList } = useGetAuth();

    const { kimpStatus, coinList, alarmCoin, setAlarmCoin, kimpThreshold, setKimpThreshold } = useKimpContext();

    const { isAlarmOpen, handleAlarmOpen, handleUpdateKimpThreshold, handleRemoveSubscriberAlarm } = useManageAlarm({ kimpThreshold, alarmCoin });

    const handleEditSubscriberAlarm = async (type: string, item: any) => {
        console.log('item', item);
        if (type === 'remove') {
            await handleRemoveSubscriberAlarm(item);
            await getSubscriberAlarmList();
        } else if (type === 'edit') {
            setKimpThreshold(item.kimpThreshold);
            setAlarmCoin(item.coin);
            handleAlarmOpen();
        }
    }

    const getCoinCalcKimp = useCallback((item: any) => {
        return kimpStatus && (kimpStatus as any).totalData ?
            (kimpStatus as any).totalData.find((coin: any) => coin.ticker === item.coin)?.kimp || 0 : 0;
    }, [kimpStatus]);

    const [userAlarmList, setUserAlarmList] = useState(subscriberAlarmList);
    useEffect(() => {
        setUserAlarmList(subscriberAlarmList);
    }, [subscriberAlarmList]);

    const filteredUserAlarmList = useMemo(() => {
        return userAlarmList.filter((item: any) => item.coin.toLowerCase().includes(searchInput.toLowerCase().trim()));
    }, [searchInput, userAlarmList]);

    return (
        <>
            <Title style={{ padding: '20px 20px 5px 20px' }}>
                사용자 설정 <SettingFilled />
            </Title>
            <Card>
                <FlexBox flexdirection="column" gap="10px" alignitems="flex-start">
                    <h3 className="">권한 상태</h3>
                    <Status status={permissionStatus}>
                        {getAlarmStatusText(permissionStatus)}
                    </Status>

                    {permissionStatus === 'default' && (
                        <Button
                            onClick={handleRequestPermission}
                            disabled={isLoading}
                        >
                            {isLoading ? '요청 중...' : '알림 권한 요청'}
                        </Button>
                    )}
                </FlexBox>
            </Card>

            <Card>
                <FlexBox flexdirection="column" gap="15px" alignitems="flex-start">
                    <h3>푸시 알림 구독</h3>
                    <p>구독 상태: {isSubscribed ? '✅ 구독됨' : '❌ 구독되지 않음'}</p>
                    {isRestoring && <p>🔄 구독 복원 중...</p>}

                    {permissionStatus === 'granted' && (
                        <>
                            {!isSubscribed ? (
                                <SuccessButton
                                    onClick={handleSubscribe}
                                    disabled={isLoading || isRestoring}
                                >
                                    {isLoading ? '구독 중...' : '푸시 알림 구독'}
                                </SuccessButton>
                            ) : (
                                <DangerButton
                                    onClick={handleUnsubscribe}
                                    disabled={isLoading || isRestoring}
                                >
                                    {isLoading ? '해제 중...' : '푸시 알림 구독 해제'}
                                </DangerButton>
                            )}
                        </>
                    )}
                </FlexBox>
            </Card>
            {
                permissionStatus === 'granted' && isSubscribed && (
                    <Card>
                        <FlexBox gap="15px" justifycontent="space-between" alignitems="center" padding="20px 0">
                            <h3>알림 설정 목록</h3>
                        </FlexBox>
                        {userAlarmList.length > 0 ? (
                            <KimpStatus>
                                <SearchInput searchInput={searchInput} setSearchInput={setSearchInput} />
                                <KimpStatusItem className="setting-alarm-list header-item">
                                    <p>코인</p>
                                    <p>현재 김프(%)</p>
                                    <p>설정한 김프(%)</p>
                                    <p>수정/삭제</p>
                                </KimpStatusItem>
                                <ListContainer minheight="200px">
                                    {filteredUserAlarmList.length > 0 ? filteredUserAlarmList.map((item: any, index: number) => {
                                        return (
                                            <KimpStatusItem className="setting-alarm-list" key={index}>
                                                <SymbolContainer>
                                                    <img src={`https://static.upbit.com/logos/${item.coin}.png`} />
                                                    {item.coin}
                                                </SymbolContainer>
                                                <p>{getCoinCalcKimp(item)}%</p>
                                                <p>{item.kimpThreshold}%</p>
                                                <FlexBox gap="10px">
                                                    <Button onClick={() => handleEditSubscriberAlarm('edit', item)}>
                                                        <EditOutlined />
                                                    </Button>
                                                    <Button onClick={() => handleEditSubscriberAlarm('remove', item)}>
                                                        <DeleteOutlined />
                                                    </Button>
                                                </FlexBox>
                                            </KimpStatusItem>
                                        )
                                    }) : <StatusContainer status="no-search" />}
                                </ListContainer>
                            </KimpStatus>
                        ) : (
                            <StatusContainer status="no-setting-alarm" />
                        )}
                    </Card>
                )
            }
            {
                permissionStatus === 'granted' && isSubscribed && isAlarmOpen && (
                    <EditAlarmModal
                        coinList={coinList}
                        kimpThreshold={kimpThreshold}
                        setKimpThreshold={setKimpThreshold}
                        setAlarmCoin={setAlarmCoin}
                        alarmCoin={alarmCoin}
                        handleUpdateKimpThreshold={handleUpdateKimpThreshold}
                        handleAlarmOpen={handleAlarmOpen}
                        setUserAlarmList={setUserAlarmList}
                    />
                )
            }
        </>
    )
}