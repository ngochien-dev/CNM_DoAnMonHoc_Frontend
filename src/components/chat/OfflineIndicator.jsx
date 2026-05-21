/**
 * OfflineIndicator.jsx
 * Banner hiển thị trạng thái kết nối mạng và đồng bộ tin nhắn.
 * Xuất hiện ở đầu khu vực chat khi offline hoặc đang sync.
 */

import React, { useEffect, useState } from 'react';

const STATUS_CONFIG = {
    offline: {
        bg: 'linear-gradient(90deg, #7f1d1d 0%, #991b1b 100%)',
        border: '1px solid #ef4444',
        icon: '📡',
        color: '#fca5a5',
        pulse: true,
    },
    syncing: {
        bg: 'linear-gradient(90deg, #1e3a5f 0%, #1d4ed8 100%)',
        border: '1px solid #60a5fa',
        icon: '🔄',
        color: '#93c5fd',
        pulse: false,
    },
    synced: {
        bg: 'linear-gradient(90deg, #14532d 0%, #166534 100%)',
        border: '1px solid #4ade80',
        icon: '✅',
        color: '#86efac',
        pulse: false,
    },
    error: {
        bg: 'linear-gradient(90deg, #451a03 0%, #92400e 100%)',
        border: '1px solid #fbbf24',
        icon: '⚠️',
        color: '#fde68a',
        pulse: false,
    },
};

/**
 * @param {object}  props
 * @param {boolean} props.isOnline      - Trạng thái mạng
 * @param {number}  props.pendingCount  - Số tin nhắn đang chờ gửi
 * @param {string}  props.syncStatus    - 'idle' | 'syncing' | 'synced' | 'error'
 */
const OfflineIndicator = ({ isOnline, pendingCount, syncStatus }) => {
    const [visible, setVisible] = useState(false);
    const [autoHideTimer, setAutoHideTimer] = useState(null);

    // Tính trạng thái hiển thị
    const resolvedStatus = !isOnline
        ? 'offline'
        : syncStatus === 'syncing'
        ? 'syncing'
        : syncStatus === 'error'
        ? 'error'
        : syncStatus === 'synced'
        ? 'synced'
        : null;

    useEffect(() => {
        if (autoHideTimer) clearTimeout(autoHideTimer);

        if (resolvedStatus === null) {
            setVisible(false);
            return;
        }

        setVisible(true);

        // Tự ẩn sau 4 giây nếu synced
        if (resolvedStatus === 'synced') {
            const timer = setTimeout(() => setVisible(false), 4000);
            setAutoHideTimer(timer);
        }

        return () => {
            if (autoHideTimer) clearTimeout(autoHideTimer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resolvedStatus]);

    if (!visible || !resolvedStatus) return null;

    const config = STATUS_CONFIG[resolvedStatus];

    const getMessage = () => {
        switch (resolvedStatus) {
            case 'offline':
                return pendingCount > 0
                    ? `Bạn đang offline — ${pendingCount} tin nhắn đang chờ gửi`
                    : 'Bạn đang offline — Đang hiển thị tin nhắn đã cache';
            case 'syncing':
                return pendingCount > 0
                    ? `Đang gửi ${pendingCount} tin nhắn...`
                    : 'Đang đồng bộ tin nhắn mới...';
            case 'synced':
                return 'Đã kết nối — Đồng bộ thành công!';
            case 'error':
                return 'Một số tin nhắn không thể gửi. Kiểm tra kết nối mạng.';
            default:
                return '';
        }
    };

    return (
        <div
            style={{
                background: config.bg,
                border: config.border,
                color: config.color,
                padding: '8px 16px',
                borderRadius: '8px',
                margin: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '13px',
                fontWeight: '600',
                letterSpacing: '0.01em',
                boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
                animation: 'offlineSlideIn 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Animated shimmer for syncing */}
            {resolvedStatus === 'syncing' && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
                        animation: 'shimmer 1.5s infinite',
                    }}
                />
            )}

            {/* Pulse dot for offline */}
            {config.pulse && (
                <span
                    style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#ef4444',
                        display: 'inline-block',
                        flexShrink: 0,
                        animation: 'pulseDot 1.2s ease-in-out infinite',
                    }}
                />
            )}

            {/* Spinning icon for syncing */}
            <span
                style={{
                    fontSize: '16px',
                    display: 'inline-block',
                    animation: resolvedStatus === 'syncing' ? 'spinIcon 1s linear infinite' : 'none',
                }}
            >
                {config.icon}
            </span>

            <span style={{ flex: 1 }}>{getMessage()}</span>

            {/* Pending badge */}
            {pendingCount > 0 && resolvedStatus !== 'synced' && (
                <span
                    style={{
                        background: 'rgba(255,255,255,0.15)',
                        borderRadius: '999px',
                        padding: '2px 10px',
                        fontSize: '12px',
                        fontWeight: '700',
                        flexShrink: 0,
                    }}
                >
                    {pendingCount} đang chờ
                </span>
            )}

            {/* CSS Animations inline */}
            <style>{`
                @keyframes offlineSlideIn {
                    from { opacity: 0; transform: translateY(-8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulseDot {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50%       { opacity: 0.4; transform: scale(0.7); }
                }
                @keyframes spinIcon {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
                @keyframes shimmer {
                    from { transform: translateX(-100%); }
                    to   { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
};

export default OfflineIndicator;
