export const priceFormatter = (price: number, locale: string) => {
    if(locale === 'en-US') {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 5,
        }).format(price);
    }
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'KRW',
        minimumFractionDigits: 0,
        maximumFractionDigits: 5,
    }).format(price);
}

export const getAlarmStatusText = (status: NotificationPermission) => {
    switch (status) {
        case 'granted':
            return '✅ 알림 권한이 허용되었습니다';
        case 'denied':
            return '❌ 알림 권한이 거부되었습니다';
        case 'default':
            return '⏳ 알림 권한이 요청되지 않았습니다';
        default:
            return '❓ 알림 권한 상태를 확인할 수 없습니다';
    }
};

export const getStatusText = (status: string) => {
    switch (status) {
        case 'no-search':
            return '검색 결과가 없습니다.';
        case 'no-data':
            return '데이터가 없습니다.';
        case 'no-setting-alarm':
            return '설정한 알림이 없습니다.';
        case 'default':
            return '';
    }
}