import { Card, FlexBox, Input, ModalLayout, SuccessButton } from "../../assets/styles/common/CommonStyle";
import SelectInput from "../common/SelectInput";
import useGetAuth from "../../hooks/useManageAuth";
import { useCallback, useMemo, useState } from "react";
import { KimpStatusItem } from "../../assets/styles/components/AlarmList";
import { SymbolContainer } from "../../assets/styles/components/AlarmList";

type EditAlarmModalProps = {
  coinList: any,
  kimpThreshold: string,
  setKimpThreshold: (value: string) => void,
  setAlarmCoin: (value: string) => void,
  handleUpdateKimpThreshold: () => void,
  handleAlarmOpen: () => void,
  alarmCoin: string,
  setUserAlarmList?: (value: any[]) => void
}

export default function EditAlarmModal({ coinList, kimpThreshold, setKimpThreshold, setAlarmCoin, handleUpdateKimpThreshold, handleAlarmOpen, alarmCoin, setUserAlarmList }: EditAlarmModalProps) {
  const { subscriberAlarmList, getSubscriberAlarmList } = useGetAuth();
  const currentAlarmCoin = useMemo(() => {
    return subscriberAlarmList.filter((item: any) => item.coin === alarmCoin);
  }, [alarmCoin, subscriberAlarmList]);

  const resetSettings = useCallback(() => {
    setKimpThreshold('');
    setAlarmCoin('');
  }, []);

  const handleSuccessButton = async () => {
    let isValid = validateInput();
    try {
      if (!isValid) return;
      handleUpdateKimpThreshold();
    } catch (error) {
      console.error('Failed to update kimp threshold:', error);
    } finally {
      if (isValid) {
        resetSettings();
        let result = await getSubscriberAlarmList();
        setUserAlarmList && setUserAlarmList(result);
      }
    }
  }

  const validateInput = () => {
    if (alarmCoin === '') {
      alert('코인을 선택해주세요.');
      return false;
    }
    if (kimpThreshold === '') {
      alert('김프 퍼센트를 입력해주세요.');
      return false;
    }
    let numberRegex = /^-?\d+(\.\d+)?$/;;
    if (!numberRegex.test(String(kimpThreshold).trim())) {
      alert('김프 퍼센트는 숫자만 입력해주세요.');
      return false;
    }
    if (subscriberAlarmList.some((item: any) => item.coin === alarmCoin && item.kimpThreshold === Number(String(kimpThreshold).trim()))) {
      alert('이미 알림이 설정된 코인입니다.');
      return false;
    }
    return true;
  }

  return (
    <ModalLayout>
      <Card className="modal-card">
        <FlexBox flexdirection="column" gap="20px" alignitems="flex-start" className="w-100">
          <h3>
            🚨 김프 알림 설정
            <span className="close-button" onClick={() => { handleAlarmOpen(); resetSettings(); }}>🗙</span>
          </h3>
          <p className="mb-20 mt-20">설정한 김프 퍼센트에 도달하면 알림을 받습니다.</p>
          <div>
            <SelectInput
              options={coinList}
              placeholder="코인을 선택해주세요."
              setInputValue={setAlarmCoin}
              value={alarmCoin}
            />
          </div>
        </FlexBox>
        <FlexBox gap="10px" justifycontent="flex-start" alignitems="center" padding="10px 0 20px">
          <label>김프 지정퍼센트 (%): </label>
          <Input
            type="text"
            value={kimpThreshold}
            onChange={(e) => setKimpThreshold(e.target.value)}
            style={{ width: '100px', marginBottom: '0px' }}
          />
        </FlexBox>
        {
          currentAlarmCoin && currentAlarmCoin.length > 0 && (
            <div>
              <label>선택한 코인 알람 목록 </label>
              <KimpStatusItem className="edit-alarm-list header-item">
                <p>코인</p>
                <p>김프</p>
              </KimpStatusItem>
              {currentAlarmCoin.map((item: any, index: number) => {
                return (
                  <KimpStatusItem key={index} className="edit-alarm-list">
                    <SymbolContainer>
                      <img src={`https://static.upbit.com/logos/${item.coin}.png`} />
                      <span>{item.coin}</span>
                    </SymbolContainer>
                    <p>{item.kimpThreshold}%</p>
                  </KimpStatusItem>
                )
              })}
            </div>
          )
        }
        <SuccessButton onClick={handleSuccessButton} className="center">
          알람등록
        </SuccessButton>
      </Card>
    </ModalLayout>
  )
}