import { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { connectSocket, disconnectSocket } from '../services/socket';

const useChatSocket = ({
    socket, user, setUser, loadData,
    activeRoomRef, chatContainerRef, mutedRoomsRef,
    setMessages, setOnlineUsers, setUnreadCounts, setTypingUsers,
    setSecretChatStatus, setSecretChatRequester, setIsSecretMode,
    playNotificationSound, sendBrowserNotification
}) => {
    useEffect(() => {
        if (!user?.username) return;

        // 1. Kết nối Socket & báo Online
        connectSocket();
        socket.emit('user_online', { ...user });
        loadData();

        // 2. Các sự kiện lắng nghe
        socket.on('groups_updated', loadData);

        socket.on('receive_message', (d) => {
            const container = chatContainerRef.current;
            let isCloseToBottom = false;
            if (container) {
                const threshold = 180;
                isCloseToBottom = container.scrollHeight - container.clientHeight - container.scrollTop < threshold;
            }

            setMessages(p => {
                if (p.some(msg => msg.messageId === d.messageId)) return p;
                return [...p, d];
            });

            const currentActiveRoom = activeRoomRef.current;
            const shouldScroll = d.senderUsername === user.username || isCloseToBottom;

            if (shouldScroll) {
                setTimeout(() => {
                    if (chatContainerRef.current) {
                        chatContainerRef.current.scrollTo({
                            top: chatContainerRef.current.scrollHeight,
                            behavior: 'smooth'
                        });
                    }
                }, 60);
            }

            if (d.senderUsername !== user.username) {
                socket.emit('messages_delivered', { messageIds: [d.messageId], roomId: d.roomId });

                const isMentioned = d.text && d.text.includes(`@${user.username}`);
                if (isMentioned) {
                    toast(`Bạn đã được nhắc đến bởi @${d.senderUsername} trong nhóm!`, {
                        icon: '🔔',
                        style: { borderRadius: '12px', background: '#ec4899', color: '#fff', fontWeight: 'bold' },
                        duration: 5000
                    });
                    if (window.Notification && Notification.permission === 'granted') {
                        new Notification('Bạn đã được nhắc đến!', { body: `@${d.senderUsername}: ${d.text}` });
                    }
                }

                if (currentActiveRoom && d.roomId === currentActiveRoom.id) {
                    socket.emit('message_read', { messageIds: [d.messageId], roomId: d.roomId });
                } else {
                    const rId = d.roomId;
                    if (!rId) return;
                    setUnreadCounts(prev => ({ ...prev, [rId]: (prev[rId] || 0) + 1 }));

                    const muteVal = mutedRoomsRef.current[rId];
                    const isMuted = muteVal && (muteVal === true || muteVal === 'forever' || Date.now() < Number(muteVal));
                    if (!isMuted) {
                        playNotificationSound();
                        sendBrowserNotification(
                            `Tin nhắn mới từ ${d.senderUsername}`,
                            d.text || 'Đã gửi một tệp đính kèm'
                        );
                        toast(`Tin nhắn mới từ ${d.senderUsername}`, {
                            icon: '💬',
                            style: { borderRadius: '10px', background: '#333', color: '#fff' }
                        });
                    }
                }
            }
        });

        socket.on('update_user_list', (u) => setOnlineUsers(u));
        socket.on('message_revoked', (id) => setMessages(p => p.map(m => m.messageId === id ? { ...m, text: "Tín hiệu đã bị thu hồi", isRevoked: true, fileData: null, fileType: null } : m)));
        socket.on('message_updated', ({ messageId, pollData, eventData, reactions }) => {
            setMessages(prev => prev.map(m => m.messageId === messageId ? { ...m, ...(pollData && { pollData }), ...(eventData && { eventData }), ...(reactions && { reactions }) } : m));
        });
        socket.on('message_pinned', ({ messageId, isPinned }) => {
            setMessages(prev => prev.map(m => m.messageId === messageId ? { ...m, isPinned } : m));
        });
        socket.on('message_edited', ({ messageId, newText, iv, isEdited, editedAt }) => {
            setMessages(prev => prev.map(m => m.messageId === messageId ? { ...m, text: newText, iv: iv || m.iv, isEdited, editedAt } : m));
        });

        socket.on('messages_read_update', ({ reader, roomId, updates }) => {
            if (reader === user.username) return;
            setMessages(prev => prev.map(m => {
                const update = updates.find(u => u.messageId === m.messageId);
                if (update) return { ...m, readBy: update.readBy };
                return m;
            }));
        });

        socket.on('messages_delivered_bulk_update', ({ deliveree, roomId, updates }) => {
            if (deliveree === user.username) return;
            setMessages(prev => prev.map(m => {
                const update = updates.find(u => u.messageId === m.messageId);
                if (update) return { ...m, deliveredTo: update.deliveredTo };
                return m;
            }));
        });

        socket.on('user_typing_start', ({ roomId, senderUsername }) => {
            const currentActiveRoom = activeRoomRef.current;
            if (currentActiveRoom && roomId === currentActiveRoom.id && senderUsername !== user.username) {
                setTypingUsers(prev => prev.includes(senderUsername) ? prev : [...prev, senderUsername]);
            }
        });

        socket.on('user_typing_end', ({ roomId, senderUsername }) => {
            const currentActiveRoom = activeRoomRef.current;
            if (currentActiveRoom && roomId === currentActiveRoom.id) {
                setTypingUsers(prev => prev.filter(u => u !== senderUsername));
            }
        });

        socket.on('new_friend_request', ({ toUser, fromUser }) => {
            if (toUser === user.username) {
                playNotificationSound();
                sendBrowserNotification('Lời mời kết bạn', `${fromUser} muốn kết bạn với bạn`);
                toast(`Có lời mời kết bạn từ ${fromUser}`, { icon: '👋', style: { borderRadius: '10px', background: '#333', color: '#fff' } });
            }
        });

        socket.on('secret_chat_request', ({ roomId, requester }) => {
            const currentActiveRoom = activeRoomRef.current;
            if (currentActiveRoom && roomId === currentActiveRoom.id) {
                setSecretChatStatus('requested');
                setSecretChatRequester(requester);
            }
            toast(`@${requester} mời bạn tham gia chat bí mật!`, { icon: '🔒', style: { borderRadius: '10px', background: '#e11d48', color: '#fff' } });
        });

        socket.on('secret_chat_established', ({ roomId }) => {
            const currentActiveRoom = activeRoomRef.current;
            if (currentActiveRoom && roomId === currentActiveRoom.id) {
                setIsSecretMode(true);
                setSecretChatStatus('established');
                toast.success("Cuộc trò chuyện bảo mật E2EE đã được thiết lập!");
            }
        });

        socket.on('secret_chat_declined', ({ roomId, decliner }) => {
            const currentActiveRoom = activeRoomRef.current;
            if (currentActiveRoom && roomId === currentActiveRoom.id) {
                setSecretChatStatus('idle');
                toast.error(`@${decliner} đã từ chối lời mời chat bí mật.`);
            }
        });

        socket.on('secret_chat_closed', ({ roomId, sender }) => {
            const currentActiveRoom = activeRoomRef.current;
            if (currentActiveRoom && roomId === currentActiveRoom.id) {
                setIsSecretMode(false);
                setSecretChatStatus('idle');
                setSecretChatRequester(null);
                setMessages(prev => prev.filter(m => !(m.roomId === roomId && m.isSecret)));
                toast(`Cuộc trò chuyện bí mật đã bị đóng bởi @${sender}.`, { icon: '🔒', style: { borderRadius: '10px', background: '#333', color: '#fff' } });
            }
        });

        socket.on('force_logout', ({ username, reason, sessionId }) => {
            if (username === user.username) {
                const currentSess = JSON.parse(localStorage.getItem('user_session') || '{}');
                if (reason === 'remote_logout' && sessionId && currentSess?.sessionId !== sessionId) return;

                disconnectSocket();
                localStorage.removeItem('user_session');
                setUser(null);
                if (reason === 'banned') alert('Tài khoản của bạn đã bị khóa bởi Admin!');
                else if (reason === 'password_reset') alert('Mật khẩu của bạn đã được đặt lại bởi Admin. Vui lòng đăng nhập lại!');
                else if (reason === 'password_changed') alert('Mật khẩu của bạn đã được thay đổi. Vui lòng đăng nhập lại!');
                else if (reason === 'remote_logout') alert('Thiết bị này đã bị đăng xuất khỏi tài khoản của bạn từ xa!');
            }
        });

        // 3. Hủy lắng nghe khi component unmount
        return () => {
            socket.off('groups_updated');
            socket.off('receive_message');
            socket.off('update_user_list');
            socket.off('message_revoked');
            socket.off('message_edited');
            socket.off('messages_read_update');
            socket.off('messages_delivered_bulk_update');
            socket.off('user_typing_start');
            socket.off('user_typing_end');
            socket.off('new_friend_request');
            socket.off('secret_chat_request');
            socket.off('secret_chat_established');
            socket.off('secret_chat_declined');
            socket.off('secret_chat_closed');
            socket.off('force_logout');
            socket.off('message_pinned');
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.username]); // Bỏ qua dependency check để tránh loop
};

export default useChatSocket;