import { useEffect, useState } from "react";
import NotificationService from "../services/NotificationService";

export default function useGetAuth() {
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [subscriberAlarmList, setSubscriberAlarmList] = useState<any[]>([]);
    useEffect(() => {
        checkPermissionStatus();
        // 페이지 로드 시 구독 복원 시도
        const restoreSubscriptionOnLoad = async () => {
            if (permissionStatus === 'granted') {
                setIsRestoring(true);
                try {
                    const restored = await NotificationService.restoreSubscription();
                    if (restored) {
                        // console.log('Subscription restored on page load');
                        await checkSubscriptionStatus(); // 상태 업데이트
                        await getSubscriberAlarmList();
                    }
                } catch (error) {
                    console.error('Failed to restore subscription:', error);
                } finally {
                    setIsRestoring(false);
                }
            }
        };

        restoreSubscriptionOnLoad();

    }, [permissionStatus]);

    const checkPermissionStatus = () => {
        const status = NotificationService.getPermissionStatus();
        setPermissionStatus(status);
        fetch(`${process.env.REACT_APP_API_URL}/subscriptions`).then(res => res.json()).then(data => {
        });
    };
    const checkSubscriptionStatus = async () => {
        const subscription = await NotificationService.getCurrentSubscription();
        console.log('check subscription status', subscription);
        setIsSubscribed(!!subscription);
    };
    const handleRequestPermission = async () => {
        setIsLoading(true);
        try {
            const permission = await NotificationService.requestPermission();
            // setPermissionStatus(permission);
            if (permission === 'granted') {
                await checkSubscriptionStatus();
                await handleSubscribe();
            }
        } catch (error) {
            console.error('Permission request failed:', error);
            alert('알림 권한 요청에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubscribe = async () => {
        setIsLoading(true);
        try {
            const subscription = await NotificationService.subscribeToPush();
            if (subscription) {
                setIsSubscribed(true);
                const subscriptionData = NotificationService.subscriptionToJSON(subscription);

                // console.log('Subscription data for server:', subscriptionData);
                alert('푸시 알림 구독이 완료되었습니다!');
            } else {
                alert('푸시 알림 구독에 실패했습니다.');
            }
        } catch (error) {
            console.error('Subscription failed:', error);
            alert('푸시 알림 구독에 실패했습니다: ' + (error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUnsubscribe = async () => {
        setIsLoading(true);
        try {
            const success = await NotificationService.unsubscribeFromPush();
            if (success) {
                setIsSubscribed(false);

                // 서버에서 구독 해제
                const subscription = await NotificationService.getCurrentSubscription();
                if (subscription) {
                    const subscriptionData = NotificationService.subscriptionToJSON(subscription);
                    await fetch(`${process.env.REACT_APP_API_URL}/unsubscribe`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            endpoint: subscriptionData.endpoint
                        }),
                    });
                }

                alert('푸시 알림 구독이 해제되었습니다.');
            } else {
                alert('푸시 알림 구독 해제에 실패했습니다.');
            }
        } catch (error) {
            console.error('Unsubscription failed:', error);
            alert('푸시 알림 구독 해제에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };
    const getSubscriberAlarmList = async () => {
        const subscription = await NotificationService.getCurrentSubscription();
        if (subscription) {
            const subscriptionData = NotificationService.subscriptionToJSON(subscription);
            // console.log('subscriptionData:', subscriptionData);

            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/subscriber-alarm`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        endpoint: subscriptionData.endpoint
                    }),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                console.log('subscriber-alarm response:', result);

                // data 필드 확인
                if (result.data !== undefined) {
                    console.log('Alarm list:', result.data);
                    setSubscriberAlarmList(result.data);
                    return result.data;
                } else {
                    console.warn('No data field in response:', result);
                    return [];
                }
            } catch (error) {
                console.error('Error fetching subscriber alarm:', error);
                return [];
            }
        } else {
            console.log('No subscription found');
            return [];
        }
    };
    return { permissionStatus, checkPermissionStatus, isSubscribed, checkSubscriptionStatus, isLoading, isRestoring, handleRequestPermission, handleSubscribe, handleUnsubscribe, getSubscriberAlarmList, subscriberAlarmList };
}