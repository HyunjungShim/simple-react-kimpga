import { useCallback, useState } from "react";
import NotificationService from "../services/NotificationService";
import useGetAuth from "./useManageAuth";
import { useNavigate } from "react-router-dom";
export default function useManageAlarm({ kimpThreshold, alarmCoin }: { kimpThreshold: string, alarmCoin: string }) {
    const [isAlarmOpen, setIsAlarmOpen] = useState(false);
    const { isSubscribed } = useGetAuth();
    const navigate = useNavigate();
    const handleAlarmOpen = useCallback(() => {
        if(isSubscribed){
            setIsAlarmOpen(!isAlarmOpen);
        }else {
            alert('푸시알람 구독을 해주세요.');
            navigate('/setting');
        }
    }, [isAlarmOpen, isSubscribed]);

    const handleUpdateKimpThreshold = async () => {
        try {
            const subscription = await NotificationService.getCurrentSubscription();
            if (subscription) {
                const subscriptionData = NotificationService.subscriptionToJSON(subscription);

                await fetch(`${process.env.REACT_APP_API_URL}/update-kimp-threshold`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        endpoint: subscriptionData.endpoint,
                        data: { kimpThreshold: kimpThreshold, coin: alarmCoin }
                    }),
                });

                alert('김프 알림 설정이 업데이트되었습니다!');
                handleAlarmOpen();
            }
        } catch (error) {
            console.error('Failed to update KIMP threshold:', error);
            alert('김프 알림 설정 업데이트에 실패했습니다.');
        }
    };
    const handleRemoveSubscriberAlarm = async (item: any) => {   
        try {
            const subscription = await NotificationService.getCurrentSubscription();
            if (subscription) {
                const subscriptionData = NotificationService.subscriptionToJSON(subscription);
                await fetch(`${process.env.REACT_APP_API_URL}/remove-subscriber-alarm`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        endpoint: subscriptionData.endpoint,
                        data: item
                    }),
                });
                alert('알림 설정이 해제되었습니다!');
            } else {
                alert('알림 설정을 해제할 수 없습니다.');
            }
        } catch (error) {
            console.error('Failed to remove subscriber alarm:', error);
            alert('알림 설정 해제에 실패했습니다.');
        }
    }
    return { isAlarmOpen, handleAlarmOpen, handleUpdateKimpThreshold, handleRemoveSubscriberAlarm };
}