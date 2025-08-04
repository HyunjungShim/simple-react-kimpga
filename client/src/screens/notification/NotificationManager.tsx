import React, { useState, useEffect, useCallback } from 'react';
import KimpList from '../../components/nofication/KimpList';
import { SymbolContainer } from '../../assets/styles/components/AlarmList';
import useGetAuth from '../../hooks/useManageAuth';
import useManageAlarm from '../../hooks/useManageAlarm';
import EditAlarmModal from '../../components/nofication/EditAlarmModal';
import { useKimpContext } from '../../contexts/KimpContext';
export default function NotificationManager() {
  const { permissionStatus, isSubscribed } = useGetAuth();
  const { kimpStatus,coinList,alarmCoin,setAlarmCoin,kimpThreshold,setKimpThreshold } = useKimpContext();
  const { isAlarmOpen, handleAlarmOpen, handleUpdateKimpThreshold } = useManageAlarm({ kimpThreshold, alarmCoin });

  return (
    <>
      {kimpStatus && (
        <KimpList kimpStatus={kimpStatus} handleAlarmOpen={handleAlarmOpen} setAlarmCoin={setAlarmCoin}/>
      )}

      {/* 김프 알림 설정 */}
      {
        permissionStatus === 'granted' && isSubscribed && isAlarmOpen && (
          <>
          <EditAlarmModal
            coinList={coinList}
            kimpThreshold={kimpThreshold}
            setKimpThreshold={setKimpThreshold}
            setAlarmCoin={setAlarmCoin}
            alarmCoin={alarmCoin}
            handleUpdateKimpThreshold={handleUpdateKimpThreshold}
            handleAlarmOpen={handleAlarmOpen}
          />
          </>
        )
      }
    </>
  );
} 