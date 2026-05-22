import { useState, useEffect } from 'react';

const useDrafts = (username) => {
    // 1. Lấy dữ liệu nháp từ LocalStorage khi khởi tạo
    const [drafts, setDrafts] = useState(() => {
        try {
            const saved = localStorage.getItem(`ott_drafts_${username}`);
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    });

    // 2. Tự động lưu vào LocalStorage mỗi khi bản nháp thay đổi
    useEffect(() => {
        if (username) {
            localStorage.setItem(`ott_drafts_${username}`, JSON.stringify(drafts));
        }
    }, [drafts, username]);

    // 3. Hàm cập nhật bản nháp
    const updateDraft = (roomId, text) => {
        if (!roomId) return;
        setDrafts(prev => {
            const nextDrafts = { ...prev };
            if (text && text.trim()) {
                nextDrafts[roomId] = text;
            } else {
                delete nextDrafts[roomId];
            }
            return nextDrafts;
        });
    };

    // 4. Hàm xóa bản nháp (khi đã gửi tin nhắn thành công)
    const clearDraft = (roomId) => {
        if (!roomId) return;
        setDrafts(prev => {
            const nextDrafts = { ...prev };
            delete nextDrafts[roomId];
            return nextDrafts;
        });
    };

    // 5. Hàm lấy bản nháp của một phòng
    const getDraft = (roomId) => {
        return roomId ? (drafts[roomId] || '') : '';
    };

    return { updateDraft, clearDraft, getDraft };
};

export default useDrafts;