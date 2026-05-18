import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { 
    FaHashtag, FaPlusCircle, FaPaperPlane, FaSignOutAlt, FaCircle, 
    FaChevronLeft, FaChevronRight, FaFileAlt, FaTrash, FaUndo, FaBroom, FaShieldAlt, 
    FaChartBar, FaImage, FaSmile, FaMoon, FaSun, 
    FaGlobe, FaCog, FaUserMinus, FaPauseCircle, FaPlayCircle, 
    FaUserFriends, FaCommentDots, FaUserPlus, FaTimes, FaUserCheck, FaLock, FaUsers, FaSearch,
    FaVideo, FaShare, FaThumbtack, FaPoll, FaCalendarAlt, FaReply, FaMicrophone, FaStopCircle, FaSmileBeam, FaEdit, FaExchangeAlt, FaTh, FaPlus
} from 'react-icons/fa';
import { Toaster, toast } from 'react-hot-toast';
import StoryBar from './social/StoryBar';
import StoryViewer from './social/StoryViewer';

import UserProfileModal from './user/UserProfileModal';
import AdminStats from './statistics/AdminStats';
import FriendsTab from './friends/FriendsTab';
import GroupDiscovery from './modals/GroupDiscovery'; 
import Home from './chat/Home';
import SocialFeed from './social/SocialFeed';
import RightSidebar from './chat/RightSidebar';
import CreateChat from './function/CreateChat';
import MessageSearch from './chat/MessageSearch';
import GlobalSearch from './chat/GlobalSearch';
import LinkPreview from './chat/LinkPreview';
import StickerPicker from './chat/StickerPicker';
import MediaGallery from './chat/MediaGallery';

import useCall from '../context/useCall'; 
import { getSocket, connectSocket, disconnectSocket } from '../services/socket';

const ChatPage = ({ user, setUser }) => {
    const socket = getSocket();
    const [msgInput, setMsgInput] = useState('');
    const [messages, setMessages] = useState([]); 
    const [onlineUsers, setOnlineUsers] = useState({});
    const [allGroups, setAllGroups] = useState([]);
    const [activeRoom, setActiveRoom] = useState(null); 
    const [unreadCounts, setUnreadCounts] = useState({}); 
    const [callHistory, setCallHistory] = useState([]); // State cho lịch sử cuộc gọi
    const [typingUsers, setTypingUsers] = useState([]); // Danh sách người đang gõ trong phòng hiện tại
    const [loadingMessages, setLoadingMessages] = useState(false); // P0: Loading state cho pagination
    const [hasMoreMessages, setHasMoreMessages] = useState({}); // P0: Track nếu còn tin nhắn cũ hơn per room
    const [notificationPermission, setNotificationPermission] = useState('default'); // P0: Notification permission

    const [showFriendsTab, setShowFriendsTab] = useState(false);
    const [showDiscoveryTab, setShowDiscoveryTab] = useState(false);
    const [showSocialFeed, setShowSocialFeed] = useState(false);
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [showGlobalSearch, setShowGlobalSearch] = useState(false);
    const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [isRightSidebarVisible, setIsRightSidebarVisible] = useState(true);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showGroupCreator, setShowGroupCreator] = useState(false);
    const [showGroupSettings, setShowGroupSettings] = useState(false);
    const [showStickerPicker, setShowStickerPicker] = useState(false);
    const [profileModal, setProfileModal] = useState({ isOpen: false, username: '' });
    const [forwardMessageData, setForwardMessageData] = useState(null); // Lưu tin nhắn cần forward
    const [showPollModal, setShowPollModal] = useState(false);
    const [showEventModal, setShowEventModal] = useState(false);
    const [stats, setStats] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [showMediaGallery, setShowMediaGallery] = useState(false);
    const [mutedRooms, setMutedRooms] = useState(() => {
        try { return JSON.parse(localStorage.getItem('mutedRooms') || '{}'); } catch { return {}; }
    }); // P1: Mute notifications per room
    const [showInviteModal, setShowInviteModal] = useState(false); // P1: Invite to group modal
    const [lastSeenMap, setLastSeenMap] = useState({}); // P1: Last seen timestamps
    const [activeSidebarTab, setActiveSidebarTab] = useState('all'); // Folders: all, personal, groups, unread
    const [selfDestructTimer, setSelfDestructTimer] = useState(0); // 0 = disabled, else seconds
    const [isSecretMode, setIsSecretMode] = useState(false); // P2: Secret Chat (no server logs)
    const [showSelfDestructMenu, setShowSelfDestructMenu] = useState(false); 
    const [viewingStories, setViewingStories] = useState(null); // { username, stories, allGroupedStories }
    const [showStoryUpload, setShowStoryUpload] = useState(false);
    const [storyForm, setStoryForm] = useState({ mediaData: '', caption: '' });

    // P2: Periodically clean up expired messages from state
    useEffect(() => {
        const timer = setInterval(() => {
            setMessages(prev => prev.filter(m => !m.expiresAt || m.expiresAt > Date.now()));
        }, 5000); // Check every 5s
        return () => clearInterval(timer);
    }, []);

    const scrollRef = useRef(null);
    const activeRoomRef = useRef(null);
    useEffect(() => { activeRoomRef.current = activeRoom; }, [activeRoom]);
    const fileInputRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const typingTimeoutRef = useRef(null); // Ref để quản lý timeout debounce typing
    const chatContainerRef = useRef(null); // P0: Ref for scroll container (pagination)
    const readObserverRef = useRef(null); // P0: IntersectionObserver for read receipts
    const mutedRoomsRef = useRef(mutedRooms); // P1: Ref to access current muted state in socket closure

    // Tích hợp hook cuộc gọi
    const { startCall, isCallBusy, callHistoryVersion } = useCall();

    const [pollQuestion, setPollQuestion] = useState("");
    const [pollOptions, setPollOptions] = useState(["", ""]);
    
    const [eventTitle, setEventTitle] = useState("");
    const [eventDate, setEventDate] = useState("");
    const [eventTime, setEventTime] = useState("");

    const [replyingToMessage, setReplyingToMessage] = useState(null);
    const [showReactionMenu, setShowReactionMenu] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [editingMessage, setEditingMessage] = useState(null);
    const [editText, setEditText] = useState('');
    const [renameGroupValue, setRenameGroupValue] = useState('');
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingTimerRef = useRef(null);

    const playNotificationSound = () => {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); 
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.05);
            gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.2);
        } catch (e) {
            console.error("Lỗi phát âm thanh:", e);
        }
    };

    // P0: Send browser notification when tab is not focused
    const sendBrowserNotification = useCallback((title, body, icon) => {
        if (document.hasFocus()) return; // Don't notify if user is looking at the tab
        if (notificationPermission !== 'granted') return;
        try {
            const notif = new Notification(title, {
                body: body || '',
                icon: icon || '/favicon.ico',
                tag: 'ott-message', // Prevents duplicate notifications
                silent: false,
            });
            notif.onclick = () => { window.focus(); notif.close(); };
            setTimeout(() => notif.close(), 5000);
        } catch (e) { /* Browser doesn't support Notification */ }
    }, [notificationPermission]);

    // P0: Request notification permission on mount
    useEffect(() => {
        if ('Notification' in window) {
            setNotificationPermission(Notification.permission);
            if (Notification.permission === 'default') {
                Notification.requestPermission().then(perm => setNotificationPermission(perm));
            }
        }
    }, []);

    // P1: Toggle mute for a room
    const toggleMuteRoom = useCallback((roomId) => {
        setMutedRooms(prev => {
            const next = { ...prev, [roomId]: !prev[roomId] };
            if (!next[roomId]) delete next[roomId];
            localStorage.setItem('mutedRooms', JSON.stringify(next));
            mutedRoomsRef.current = next; // Keep ref in sync
            return next;
        });
    }, []);

    // P1: Fetch last seen for offline friends
    useEffect(() => {
        if (!user?.friends?.length) return;
        const offlineFriends = (user.friends || []).filter(f => !onlineUsers[f]);
        if (offlineFriends.length === 0) return;
        api.get(`/friends/last-seen?usernames=${offlineFriends.slice(0, 30).join(',')}`)
            .then(res => setLastSeenMap(res.data || {}))
            .catch(() => {});
    }, [user?.friends, Object.keys(onlineUsers).length]);

    // P0: Mark messages as read when viewing a room
    const markMessagesAsRead = useCallback((roomMessages) => {
        if (!user?.username || !activeRoomRef.current) return;
        const unreadMsgIds = roomMessages
            .filter(m => m.senderUsername !== user.username && !(m.readBy || []).includes(user.username))
            .map(m => m.messageId);
        if (unreadMsgIds.length === 0) return;
        // Emit via socket for real-time + batch update
        socket.emit('message_read', { messageIds: unreadMsgIds, roomId: activeRoomRef.current.id });
    }, [user?.username, socket]);

    // P0: Pagination — load messages for a specific room
    const loadRoomMessages = useCallback(async (roomId, before = null) => {
        if (!roomId || loadingMessages) return;
        setLoadingMessages(true);
        try {
            const params = new URLSearchParams({ roomId, limit: '50' });
            if (before) params.append('before', before);
            const res = await api.get(`/v1/messages/${user.username}?${params.toString()}`);
            const data = res.data;
            
            if (data.messages) {
                // Paginated response
                const newMsgs = data.messages;
                if (before) {
                    // Prepend older messages
                    setMessages(prev => {
                        const existingIds = new Set(prev.map(m => m.messageId));
                        const unique = newMsgs.filter(m => !existingIds.has(m.messageId));
                        return [...unique, ...prev];
                    });
                } else {
                    // Initial load for room — merge with existing
                    setMessages(prev => {
                        const otherRoomMsgs = prev.filter(m => m.roomId !== roomId);
                        return [...otherRoomMsgs, ...newMsgs];
                    });
                }
                setHasMoreMessages(prev => ({ ...prev, [roomId]: data.hasMore }));
            } else {
                // Legacy non-paginated response (fallback)
                const filtered = (Array.isArray(data) ? data : []).filter(msg => !(user.deletedMessages || []).includes(msg.messageId));
                setMessages(filtered);
            }
        } catch (err) {
            console.error('Load room messages error:', err);
        } finally {
            setLoadingMessages(false);
        }
    }, [user?.username, loadingMessages]);

    const loadData = async () => {
        if (!user?.username) return;
        try {
            const [m, g, u, c] = await Promise.all([
                api.get(`/v1/messages/${user.username}`),
                api.get(`/groups/all`),
                api.get(`/users/${user.username}`),
                api.get('/calls/history?limit=12').catch(() => ({ data: [] }))
            ]);
            // Kiểm tra user vẫn còn đăng nhập trước khi cập nhật state
            if (!localStorage.getItem('user_session')) return;
            const msgData = m.data;
            if (Array.isArray(msgData)) {
                setMessages(msgData.filter(msg => !(u.data.deletedMessages || []).includes(msg.messageId)));
            } else if (msgData.messages) {
                setMessages(msgData.messages.filter(msg => !(u.data.deletedMessages || []).includes(msg.messageId)));
            }
            setAllGroups(g.data);
            setCallHistory(Array.isArray(c.data) ? c.data : c.data?.items || []);
            if (u.data.username === user.username) setUser(prev => prev ? ({ ...prev, ...u.data }) : null);
        } catch (err) { console.error("Load data error:", err); }
    };

    // Hàm xử lý gọi video
    const handleVideoCall = (targetUsername = activeRoom?.name) => {
        if (!targetUsername || isCallBusy) return;
        startCall(targetUsername, activeRoom?.isDM ? activeRoom.id : undefined);
    };

    const handleUpdateSuccess = (updatedData) => {
        if (updatedData) setUser(prev => ({ ...prev, ...updatedData }));
        loadData();
    };

    const handleOpenProfile = (uname) => setProfileModal({ isOpen: true, username: uname });

    const getRecentChatUsers = () => {
        const chatUsers = new Set();
        messages.forEach(m => { 
            if (m.roomId?.startsWith('dm_')) { 
                const other = m.roomId.replace('dm_', '').split('_').find(p => p !== user.username); 
                if (other) chatUsers.add(other); 
            } 
        });
        return Array.from(chatUsers);
    };

    const handleSwitchRoom = (room) => { 
        if (activeRoom && typingTimeoutRef.current) {
            socket.emit('typing_end', { roomId: activeRoom.id, senderUsername: user.username });
            clearTimeout(typingTimeoutRef.current);
        }
        setTypingUsers([]); // Xóa trạng thái typing khi chuyển phòng
        setActiveRoom(room); 
        setShowFriendsTab(false); 
        setShowDiscoveryTab(false); 
        setShowSocialFeed(false);
        setIsAdminMode(false); 
        setShowSearch(false);
        setShowGlobalSearch(false);
        setReplyingToMessage(null);
        setShowReactionMenu(null);
        setIsSecretMode(false); // Reset secret mode on room switch
        setShowSelfDestructMenu(false);
        if (room) {
            setUnreadCounts(prev => ({ ...prev, [room.id]: 0 }));
            // P0: Load messages for the new room (pagination)
            loadRoomMessages(room.id);
        }
    };

    const handleStartDM = (friendUname) => { 
        const dmId = `dm_${[user.username, friendUname].sort().join("_")}`; 
        handleSwitchRoom({ id: dmId, name: friendUname, isDM: true }); 
    };

    const handleCreateGroup = async (name, isPublic, isChannel = false) => {
        const publicStatus = user.role === 'admin' ? isPublic : false;
        await api.post('/groups/create', { groupName: name, owner: user.username, isPublic: publicStatus, isChannel });
        setShowGroupCreator(false);
        loadData();
    };

    const handleRequestJoin = async (groupId) => {
        const res = await api.post('/groups/request', { groupId, username: user.username });
        if (res.data.joined) {
            alert("Đã gia nhập vũ trụ thành công!");
        } else {
            alert("Đã gửi tín hiệu chờ phê duyệt!");
        }
        loadData();
    };

    const handleApprove = async (groupId, targetUsername, action) => {
        await api.post('/groups/approve', { groupId, targetUsername, action });
        loadData();
    };

    const handleManageGroup = async (action) => {
        if(window.confirm(`Xác nhận?`)) {
            await api.post('/groups/manage', { groupId: activeRoom.id, action });
            if(action === 'delete') { handleSwitchRoom(null); setShowGroupSettings(false); }
            loadData();
        }
    };

    const handleLeaveGroup = async () => {
        if(window.confirm(`Bạn có chắc chắn muốn rời khỏi vũ trụ này?`)) {
            await api.post('/groups/remove-member', { groupId: activeRoom.id, targetUsername: user.username });
            handleSwitchRoom(null);
            loadData();
        }
    };

    const handlePinMessage = async (messageId, isPinned) => {
        await api.post('/v1/messages/pin', { messageId, isPinned });
        loadData(); // Re-fetch messages
    };

    const handleKick = async (target) => {
        if(window.confirm(`Kích @${target}?`)) {
            await api.post('/groups/remove-member', { groupId: activeRoom.id, targetUsername: target });
            loadData();
        }
    };

    const handleToggleRole = async (targetUsername, action) => {
        if(window.confirm(`${action === 'grant' ? 'Thăng cấp' : 'Giáng chức'} @${targetUsername}?`)) {
            await api.post('/groups/role', { groupId: activeRoom.id, targetUsername, action });
            loadData();
        }
    };

    const handleUpdateRole = async (target, action) => {
        await api.post('/groups/role', { groupId: activeRoom.id, targetUsername: target, action });
        loadData();
    };

    const clearChatHistory = async () => {
        if (window.confirm(`Xóa lịch sử tại đây?`)) {
            await api.post('/v1/messages/clear-history', { username: user.username, roomId: activeRoom.id });
            setMessages(prev => prev.filter(m => m.roomId !== activeRoom.id));
        }
    };

    const handleSendText = () => {
        const currentG = allGroups.find(g => g.groupId === activeRoom.id);
        if (currentG?.isDisabled) return alert("Kênh đã phong tỏa!");
        if (!msgInput.trim()) return;
        
        const payload = { 
            sender: user.displayName, 
            senderUsername: user.username, 
            text: msgInput, 
            roomId: activeRoom.id, 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            createdAt: new Date().toISOString()
        };
        if (isSecretMode) payload.isSecret = true;
        if (selfDestructTimer > 0) {
            payload.expiresAt = Date.now() + (selfDestructTimer * 1000);
            payload.ttl = Math.floor(payload.expiresAt / 1000); // DynamoDB TTL
        }
        if (replyingToMessage) {
            payload.replyTo = { messageId: replyingToMessage.messageId, senderUsername: replyingToMessage.senderUsername, text: replyingToMessage.text };
        }
        socket.emit('send_message', payload);
        
        setMsgInput(''); setShowEmojiPicker(false);
        setReplyingToMessage(null);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file || file.size > 5000000) return alert("File quá nặng!");
        const reader = new FileReader();
        reader.onloadend = () => {
            const payload = { 
                sender: user.displayName, 
                senderUsername: user.username, 
                fileData: reader.result, 
                fileType: file.type.split('/')[0], 
                fileName: file.name, 
                roomId: activeRoom.id, 
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                createdAt: new Date().toISOString()
            };
            if (isSecretMode) payload.isSecret = true;
            if (selfDestructTimer > 0) {
                payload.expiresAt = Date.now() + (selfDestructTimer * 1000);
                payload.ttl = Math.floor(payload.expiresAt / 1000);
            }
            if (replyingToMessage) {
                payload.replyTo = { messageId: replyingToMessage.messageId, senderUsername: replyingToMessage.senderUsername, text: replyingToMessage.text };
            }
            socket.emit('send_message', payload);
            setReplyingToMessage(null);
        };
        reader.readAsDataURL(file);
    };

    const handleReactToMessage = async (messageId, emoji) => {
        await api.post('/v1/messages/react', { messageId, username: user.username, emoji });
        setShowReactionMenu(null);
    };

    const handleStoryUpload = async () => {
        if (!storyForm.mediaData) return;
        await api.post('/stories/upload', { 
            username: user.username, 
            mediaData: storyForm.mediaData, 
            caption: storyForm.caption,
            mediaType: 'image' // Simplified
        });
        setShowStoryUpload(false);
        setStoryForm({ mediaData: '', caption: '' });
        alert("Khoảnh khắc đã được chia sẻ!");
    };

    const handleReactStory = async (storyId, emoji) => {
        await api.post('/stories/react', { storyId, username: user.username, emoji });
    };

    const handleDeleteStory = async (storyId) => {
        if (!window.confirm("Bạn có chắc muốn xóa khoảnh khắc này?")) return;
        try {
            await api.post('/stories/delete', { storyId });
            setViewingStories(null);
            toast.success("Đã xóa khoảnh khắc");
        } catch (err) {
            toast.error("Lỗi khi xóa khoảnh khắc");
        }
    };

    const handleNextUserStory = () => {
        if (!viewingStories) return;
        const usernames = Object.keys(viewingStories.allGroupedStories);
        const currentIndex = usernames.indexOf(viewingStories.username);
        if (currentIndex < usernames.length - 1) {
            const nextUsername = usernames[currentIndex + 1];
            setViewingStories({
                username: nextUsername,
                stories: viewingStories.allGroupedStories[nextUsername],
                allGroupedStories: viewingStories.allGroupedStories
            });
        } else {
            setViewingStories(null);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = e => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    socket.emit('send_message', { 
                        sender: user.displayName, 
                        senderUsername: user.username, 
                        fileData: reader.result, 
                        fileType: 'audio', 
                        fileName: 'voice_message.webm', 
                        roomId: activeRoom.id, 
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                    });
                };
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            recordingTimerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
        } catch (err) {
            alert("Không thể truy cập microphone: " + err.message);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(recordingTimerRef.current);
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleTogglePin = async (roomId, isPinned) => {
        try {
            const action = isPinned ? 'unpin' : 'pin';
            const res = await api.post('/users/toggle-pin', { username: user.username, roomId, action });
            if (res.data.success) {
                setUser(prev => ({ ...prev, pinnedRooms: res.data.pinnedRooms }));
                toast.success(action === 'pin' ? 'Đã ghim hội thoại' : 'Đã bỏ ghim hội thoại');
            }
        } catch (err) {
            toast.error('Không thể thực hiện yêu cầu');
        }
    };

    const handleInputChange = (e) => {
        setMsgInput(e.target.value);
        if (!activeRoom) return;

        // Phát tín hiệu đang gõ
        socket.emit('typing_start', { roomId: activeRoom.id, senderUsername: user.username });

        // Tự động tắt sau 3 giây ngừng gõ
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('typing_end', { roomId: activeRoom.id, senderUsername: user.username });
        }, 3000);
    };

    const unsendEverywhere = (id) => { if (window.confirm("Thu hồi?")) socket.emit('revoke_message', id); };

    const handleEditMessage = (msg) => {
        setEditingMessage(msg);
        setEditText(msg.text || '');
    };

    const handleSaveEdit = () => {
        if (!editingMessage || !editText.trim()) return;
        socket.emit('edit_message', { messageId: editingMessage.messageId, newText: editText.trim() });
        setEditingMessage(null);
        setEditText('');
    };

    const handleCancelEdit = () => {
        setEditingMessage(null);
        setEditText('');
    };

    const handleCreatePoll = () => {
        if (!pollQuestion.trim() || pollOptions.some(o => !o.trim())) return alert("Vui lòng điền đủ câu hỏi và các lựa chọn!");
        socket.emit('send_message', { 
            sender: user.displayName, 
            senderUsername: user.username, 
            msgType: 'poll',
            text: 'Bình chọn mới: ' + pollQuestion,
            pollData: { question: pollQuestion, options: pollOptions.map(opt => ({ text: opt, votes: [] })) },
            roomId: activeRoom.id, 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        });
        setShowPollModal(false);
        setPollQuestion("");
        setPollOptions(["", ""]);
    };

    const handleCreateEvent = () => {
        if (!eventTitle.trim() || !eventDate || !eventTime) return alert("Vui lòng điền đủ thông tin sự kiện!");
        socket.emit('send_message', { 
            sender: user.displayName, 
            senderUsername: user.username, 
            msgType: 'event',
            text: 'Lịch nhóm mới: ' + eventTitle,
            eventData: { title: eventTitle, date: eventDate, time: eventTime, attendees: [] },
            roomId: activeRoom.id, 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        });
        setShowEventModal(false);
        setEventTitle("");
        setEventDate("");
        setEventTime("");
    };

    const deleteForMe = async (id) => {
        if (window.confirm("Xóa phía bạn?")) {
            await api.post('/v1/messages/delete-for-me', { username: user.username, messageId: id });
            setMessages(prev => prev.filter(m => m.messageId !== id));
        }
    };

    const handleForwardMessage = (targetRoomId) => {
        if (!forwardMessageData) return;
        socket.emit('send_message', { 
            sender: user.displayName, 
            senderUsername: user.username, 
            text: forwardMessageData.text, 
            fileData: forwardMessageData.fileData, 
            fileType: forwardMessageData.fileType, 
            fileName: forwardMessageData.fileName, 
            roomId: targetRoomId, 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        });
        setForwardMessageData(null);
        alert("Đã chuyển tiếp tin nhắn!");
    };

    const handleSendSticker = (stickerUrl) => {
        socket.emit('send_message', { 
            sender: user.displayName, 
            senderUsername: user.username, 
            msgType: 'sticker',
            fileData: stickerUrl, 
            roomId: activeRoom.id, 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        });
        setShowStickerPicker(false);
    };

    const handleSelectSearchResult = (result) => {
        if (result.type === 'user') {
            handleStartDM(result.data.username);
        } else if (result.type === 'group') {
            handleSwitchRoom({ id: result.data.groupId, name: result.data.groupName });
        } else if (result.type === 'message') {
            // Find room and switch
            const room = allGroups.find(g => g.groupId === result.data.roomId) 
                         || { id: result.data.roomId, name: result.data.roomId.startsWith('dm_') ? result.data.senderUsername : result.data.roomId, isDM: result.data.roomId.startsWith('dm_') };
            handleSwitchRoom(room);
        }
        setShowGlobalSearch(false);
    };

    useEffect(() => {
        if (!user?.username) return;
        connectSocket();
        socket.emit('user_online', { ...user });
        loadData();
        socket.on('groups_updated', loadData);
        socket.on('receive_message', (d) => {
            setMessages(p => {
                if (p.some(msg => msg.messageId === d.messageId)) return p;
                return [...p, d];
            });
            const currentActiveRoom = activeRoomRef.current;
            if (d.senderUsername !== user.username) {
                if (currentActiveRoom && d.roomId === currentActiveRoom.id) {
                    // P0: Auto-mark as read if user is viewing this room
                    socket.emit('message_read', { messageIds: [d.messageId], roomId: d.roomId });
                } else {
                    const rId = d.roomId;
                    if (!rId) return;
                    setUnreadCounts(prev => ({ ...prev, [rId]: (prev[rId] || 0) + 1 }));
                    // P1: Check if room is muted before playing sound/notification
                    const isMuted = mutedRoomsRef.current[rId];
                    if (!isMuted) {
                        playNotificationSound();
                        // P0: Browser push notification
                        sendBrowserNotification(
                            `Tin nhắn mới từ ${d.senderUsername}`,
                            d.text || 'Đã gửi một tệp đính kèm',
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
            setMessages(prev => prev.map(m => {
                if (m.messageId === messageId) {
                    return { ...m, ...(pollData && { pollData }), ...(eventData && { eventData }), ...(reactions && { reactions }) };
                }
                return m;
            }));
        });
        socket.on('message_edited', ({ messageId, newText, isEdited, editedAt }) => {
            setMessages(prev => prev.map(m => m.messageId === messageId ? { ...m, text: newText, isEdited, editedAt } : m));
        });

        // P0: Read receipts — update readBy when others read messages
        socket.on('messages_read_update', ({ reader, roomId, updates }) => {
            if (reader === user.username) return; // Skip own reads
            setMessages(prev => prev.map(m => {
                const update = updates.find(u => u.messageId === m.messageId);
                if (update) return { ...m, readBy: update.readBy };
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
                toast(`Có lời mời kết bạn từ ${fromUser}`, {
                    icon: '👋',
                    style: { borderRadius: '10px', background: '#333', color: '#fff' }
                });
            }
        });

        socket.on('force_logout', ({ username, reason }) => {
            if (username === user.username) {
                disconnectSocket();
                localStorage.removeItem('user_session');
                setUser(null);
                if (reason === 'banned') {
                    alert('Tài khoản của bạn đã bị khóa bởi Admin!');
                } else if (reason === 'password_reset') {
                    alert('Mật khẩu của bạn đã được đặt lại bởi Admin. Vui lòng đăng nhập lại!');
                } else if (reason === 'password_changed') {
                    alert('Mật khẩu của bạn đã được thay đổi. Vui lòng đăng nhập lại!');
                }
            }
        });

        return () => { 
            socket.off('groups_updated'); 
            socket.off('receive_message'); 
            socket.off('update_user_list'); 
            socket.off('message_revoked'); 
            socket.off('message_edited');
            socket.off('messages_read_update');
            socket.off('user_typing_start');
            socket.off('user_typing_end');
            socket.off('new_friend_request');
            socket.off('force_logout');
        };
    }, [user?.username]);

    // Load lại data khi có thay đổi từ cuộc gọi
    useEffect(() => {
        if (user?.username) loadData();
    }, [callHistoryVersion]);

    useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, activeRoom]);

    // P0: Mark visible messages as read when switching rooms or receiving new messages
    useEffect(() => {
        if (!activeRoom || !user?.username) return;
        const roomMsgs = messages.filter(m => {
        const roomMsgs = messages.filter(m => m.roomId === activeRoom.id);
        });
        // Small delay to batch read receipts
        const timer = setTimeout(() => markMessagesAsRead(roomMsgs), 1000);
        return () => clearTimeout(timer);
    }, [activeRoom?.id, messages.length, markMessagesAsRead]);

    const currentGroup = allGroups.find(g => g.groupId === activeRoom?.id);
    const isAdminOfGroup = currentGroup?.owner === user.username; 
    const isModOfGroup = currentGroup?.mods?.includes(user.username);
    const isMember = !activeRoom || activeRoom.id.startsWith('dm_') || (activeRoom && currentGroup?.isPublic) || currentGroup?.members?.includes(user.username);

    return (
        <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-500 ${darkMode ? 'bg-[#0f172a] text-[#dbdee1]' : 'bg-[#f8fafc] text-slate-800'}`}>
            <Toaster position="top-right" />
            {/* Cột 1 & 2 giữ nguyên theo style File A của bạn */}
            <div className={`w-[72px] hidden sm:flex flex-col items-center py-3 space-y-4 shrink-0 shadow-inner z-20 ${darkMode ? 'bg-[#020617]' : 'bg-white border-r border-gray-200 shadow-sm'}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black cursor-pointer hover:rounded-xl transition-all shadow-md ${(!activeRoom && !showFriendsTab && !showDiscoveryTab && !isAdminMode) ? 'bg-indigo-600 scale-110 shadow-indigo-500/50' : 'bg-gradient-to-tr from-indigo-500 to-purple-600 opacity-60 hover:opacity-100'}`} onClick={() => handleSwitchRoom(null)}>OTT</div>
                <div onClick={() => {setShowFriendsTab(true); setShowDiscoveryTab(false); setIsAdminMode(false); setActiveRoom(null);}} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all relative ${showFriendsTab ? 'bg-[#5865f2] text-white shadow-lg' : 'bg-white/5 text-gray-500 hover:bg-[#5865f2] hover:text-white'}`}><FaUserFriends size={22}/>{user.friendRequests?.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#1e1f22] font-black animate-bounce">{user.friendRequests.length}</span>}</div>
                <div onClick={() => {setShowDiscoveryTab(true); setShowFriendsTab(false); setShowSocialFeed(false); setIsAdminMode(false); setActiveRoom(null);}} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all relative ${showDiscoveryTab ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white/5 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}><FaGlobe size={22}/></div>
                <div onClick={() => {setShowSocialFeed(true); setShowFriendsTab(false); setShowDiscoveryTab(false); setIsAdminMode(false); setActiveRoom(null);}} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all relative ${showSocialFeed ? 'bg-purple-500 text-white shadow-lg' : 'bg-white/5 text-purple-500 hover:bg-purple-500 hover:text-white'}`} title="Bảng tin"><FaSmileBeam size={22}/></div>
                <div className="w-8 h-[2px] bg-gray-600 rounded-full opacity-20"></div>
                <div onClick={() => { localStorage.setItem('theme', !darkMode ? 'dark' : 'light'); setDarkMode(!darkMode); }} className="w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer bg-white/10 hover:bg-white/20 transition-all">{darkMode ? <FaSun className="text-yellow-400"/> : <FaMoon/>}</div>
                {user.role === 'admin' && (<div onClick={() => { setIsAdminMode(!isAdminMode); setShowFriendsTab(false); setShowDiscoveryTab(false); setActiveRoom(null); if(!isAdminMode) api.get('/admin/stats').then(res => setStats(res.data)); }} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all ${isAdminMode ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-red-500 shadow-lg'}`}><FaShieldAlt size={22} /></div>)}
                <div onClick={() => setShowGroupCreator(true)} className="w-12 h-12 bg-[#23a559] text-white rounded-2xl flex items-center justify-center cursor-pointer hover:rounded-xl transition-all shadow-md group relative"><FaPlusCircle size={22}/></div>
            </div>

            <div className={`flex flex-col border-r transition-all duration-300 ${isSidebarVisible ? 'w-52 md:w-64' : 'w-0 overflow-hidden'} ${darkMode ? 'bg-[#1e293b]/50 backdrop-blur-xl border-white/5' : 'bg-slate-50 border-gray-200'}`}>
                <div className={`h-12 px-4 flex items-center border-b font-black uppercase text-[11px] tracking-widest opacity-60 italic ${darkMode ? 'border-white/5 text-indigo-400' : 'border-gray-200 text-indigo-600'}`}>OTT Community</div>
                
                {/* Folders/Tabs Bar */}
                <div className={`flex px-2 py-1 gap-1 border-b ${darkMode ? 'border-white/5 bg-white/2' : 'border-gray-200 bg-gray-50'}`}>
                    {[
                        { id: 'all', label: 'Tất cả' },
                        { id: 'personal', label: 'Cá nhân' },
                        { id: 'groups', label: 'Nhóm' },
                        { id: 'unread', label: 'Chưa đọc' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveSidebarTab(tab.id)}
                            className={`flex-1 py-1 text-[9px] font-black uppercase rounded-md transition-all ${activeSidebarTab === tab.id ? (darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-600 text-white shadow-sm') : (darkMode ? 'text-gray-500 hover:text-gray-400' : 'text-slate-400 hover:text-slate-600')}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Story Bar */}
                {(activeSidebarTab === 'all' || activeSidebarTab === 'personal') && (
                    <StoryBar 
                        user={user} 
                        friends={user.friends || []} 
                        onlineUsers={onlineUsers} 
                        onOpenStory={(username, stories, allGroupedStories) => setViewingStories({ username, stories, allGroupedStories })}
                        onUploadStory={() => setShowStoryUpload(true)}
                        darkMode={darkMode}
                    />
                )}

                <div className="flex-1 p-2 mt-2 overflow-y-auto space-y-6 font-bold scrollbar-hide">
                    {(() => {
                        const pinnedRooms = user.pinnedRooms || [];
                        const dms = getRecentChatUsers();
                        const publicGroups = allGroups.filter(g => g.isPublic && (g.members?.includes(user.username) || g.owner === user.username));
                        const privateGroups = allGroups.filter(g => !g.isPublic && (g.members?.includes(user.username) || g.owner === user.username));
                        
                        const allRoomItems = [
                            ...dms.map(name => ({ id: `dm_${[user.username, name].sort().join("_")}`, name, isDM: true, type: 'personal' })),
                            ...publicGroups.map(g => ({ id: g.groupId, name: g.groupName, type: 'groups' })),
                            ...privateGroups.map(g => ({ id: g.groupId, name: g.groupName, type: 'groups' }))
                        ];

                        // Filter by Tab
                        let filtered = allRoomItems;
                        if (activeSidebarTab === 'personal') filtered = allRoomItems.filter(r => r.isDM);
                        if (activeSidebarTab === 'groups') filtered = allRoomItems.filter(r => !r.isDM);
                        if (activeSidebarTab === 'unread') filtered = allRoomItems.filter(r => unreadCounts[r.id] > 0);

                        // Separate Pinned and Unpinned
                        const pinned = filtered.filter(r => pinnedRooms.includes(r.id));
                        const unpinned = filtered.filter(r => !pinnedRooms.includes(r.id));

                        const renderRoom = (r) => {
                            const isPinned = pinnedRooms.includes(r.id);
                            const isActive = activeRoom?.id === r.id || (r.isDM && activeRoom?.name === r.name && activeRoom?.isDM);
                            const unread = unreadCounts[r.id] || 0;

                            return (
                                <div key={r.id} onClick={() => r.isDM ? handleStartDM(r.name) : handleSwitchRoom({id: r.id, name: r.name})} className={`group p-2.5 rounded-lg flex items-center gap-3 cursor-pointer mb-1 relative transition-all ${isActive ? 'bg-[#5865f2] text-white shadow-lg' : (darkMode ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-slate-100 text-slate-600')}`}>
                                    {r.isDM ? (
                                        <div className="relative shrink-0" onClick={(e) => { e.stopPropagation(); handleOpenProfile(r.name); }}>
                                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-bold uppercase overflow-hidden border border-white/10">{onlineUsers[r.name]?.avatar ? <img src={onlineUsers[r.name].avatar} className="w-full h-full object-cover" alt="" /> : r.name[0]}</div>
                                            <FaCircle className={`absolute -bottom-0.5 -right-0.5 text-[8px] border-2 ${darkMode ? 'border-[#1e293b]' : 'border-white'} ${onlineUsers[r.name] ? 'text-green-500' : 'text-gray-400'}`} />
                                        </div>
                                    ) : (
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-white/20' : (darkMode ? 'bg-white/5' : 'bg-slate-200')}`}>
                                            {r.type === 'groups' ? <FaGlobe size={14}/> : <FaLock size={12}/>}
                                        </div>
                                    )}
                                    <span className={`truncate text-sm font-medium italic ${r.isDM ? '' : 'uppercase tracking-tighter'}`}>{r.isDM ? `@${r.name}` : r.name}</span>
                                    
                                    <div className="absolute right-2 flex items-center gap-1">
                                        {unread > 0 && <span className="w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full font-black animate-bounce">{unread}</span>}
                                        {isPinned && <FaThumbtack size={10} className="text-indigo-400 rotate-45"/>}
                                        <button onClick={(e) => { e.stopPropagation(); handleTogglePin(r.id, isPinned); }} className="opacity-0 group-hover:opacity-100 p-1 hover:text-indigo-400 transition-opacity">
                                            <FaThumbtack size={10} className={isPinned ? 'text-indigo-400' : 'text-gray-500'} />
                                        </button>
                                    </div>
                                </div>
                            );
                        };

                        return (
                            <>
                                {pinned.length > 0 && (
                                    <div className="mb-4">
                                        <p className={`text-[9px] font-black uppercase tracking-widest px-2 mb-2 italic ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Đã ghim</p>
                                        {pinned.map(renderRoom)}
                                    </div>
                                )}
                                {unpinned.length > 0 && (
                                    <div>
                                        <p className={`text-[9px] font-black uppercase tracking-widest px-2 mb-2 italic ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Hội thoại</p>
                                        {unpinned.map(renderRoom)}
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </div>
                <div onClick={() => handleOpenProfile(user.username)} className={`h-16 flex items-center px-3 cursor-pointer border-t transition-colors shrink-0 ${darkMode ? 'bg-[#020617] border-white/5' : 'bg-white border-gray-200 hover:bg-slate-50 shadow-sm'}`}><div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg overflow-hidden border border-white/20">{user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="" /> : user.displayName[0]}</div><div className="ml-3 truncate flex-1 leading-tight"><div className="text-sm font-black truncate uppercase italic tracking-tighter">{user.displayName}</div><div className="text-[9px] text-green-500 font-black uppercase tracking-widest flex items-center gap-1"><FaCircle size={6}/> Online</div></div><button onClick={(e) => { e.stopPropagation(); disconnectSocket(); localStorage.removeItem('user_session'); setUser(null); }} className="relative z-10 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-90" title="Đăng xuất"><FaSignOutAlt size={16} /></button></div>
            </div>

            <div className={`flex-1 flex flex-col min-w-0 ${darkMode ? 'bg-transparent' : 'bg-[#f8fafc]'}`}>
                {showFriendsTab ? (
                    // Tích hợp thêm callHistory vào FriendsTab
                    <FriendsTab 
                        user={user} 
                        friends={user.friends || []} 
                        friendRequests={user.friendRequests || []} 
                        loadData={loadData} 
                        onlineUsers={onlineUsers} 
                        handleStartDM={handleStartDM} 
                        handleOpenProfile={handleOpenProfile} 
                        callHistory={callHistory}
                        startCall={startCall}
                        isCallBusy={isCallBusy}
                        darkMode={darkMode}
                    />
                ) : showSocialFeed ? (
                    <SocialFeed user={user} darkMode={darkMode} />
                ) : showDiscoveryTab ? (
                    <GroupDiscovery allGroups={allGroups} user={user} handleRequestJoin={handleRequestJoin} darkMode={darkMode} onJoinSuccess={(id, name) => handleSwitchRoom({id, name})} />
                ) : isAdminMode ? (
                    <AdminStats stats={stats} darkMode={darkMode} />
                ) : activeRoom ? (
                    <>
                        <div className={`h-12 flex items-center justify-between px-6 shrink-0 shadow-sm font-black backdrop-blur-md uppercase italic tracking-tighter border-b ${darkMode ? 'border-white/5 bg-white/2' : 'border-gray-200 bg-white/80'}`}>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setIsSidebarVisible(!isSidebarVisible)} className="p-1 hover:bg-black/5 rounded text-indigo-500 transition-all active:scale-90"><FaChevronLeft size={16} className={!isSidebarVisible ? 'rotate-180' : ''}/></button> 
                                {activeRoom.isDM ? <span className="text-indigo-400 text-sm">@ {activeRoom.name}</span> : <span className="text-sm"># {activeRoom.name}</span>}
                            </div>
                            <div className="flex items-center gap-4">
                                {/* NÚT GỌI VIDEO - Chỉ hiện ở DM */}
                                {activeRoom.isDM && (
                                    <button 
                                        onClick={() => handleVideoCall()} 
                                        disabled={isCallBusy}
                                        className={`p-1.5 rounded-lg transition-all ${isCallBusy ? 'text-gray-600' : 'text-cyan-400 hover:bg-cyan-500/10'}`}
                                        title="Gọi Video"
                                    >
                                        <FaVideo size={18}/>
                                    </button>
                                )}
                                
                                <button onClick={() => { setShowGlobalSearch(!showGlobalSearch); setShowSearch(false); }} className={`p-1.5 rounded-lg transition-all ${showGlobalSearch ? 'text-indigo-500 bg-indigo-500/10' : 'text-gray-500 hover:text-white bg-white/5'}`} title="Tìm kiếm toàn cầu"><FaGlobe size={18}/></button>
                                <button onClick={() => { setShowSearch(!showSearch); setShowGlobalSearch(false); }} className={`p-1.5 rounded-lg transition-all ${showSearch ? 'text-indigo-500 bg-indigo-500/10' : 'text-gray-500 hover:text-white bg-white/5'}`} title="Tìm trong phòng"><FaSearch size={18}/></button>
                                <button onClick={() => setShowMediaGallery(true)} className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-400 bg-white/5 transition-all" title="Kho Media"><FaTh size={18}/></button>
                                
                                {/* Self-destruct timer toggle */}
                                <div className="relative">
                                    <button 
                                        onClick={() => setShowSelfDestructMenu(!showSelfDestructMenu)}
                                        className={`p-1.5 rounded-lg transition-all ${selfDestructTimer > 0 ? 'text-orange-500 bg-orange-500/10' : 'text-gray-500 hover:text-orange-400 bg-white/5'}`} 
                                        title="Hẹn giờ tự xóa"
                                    >
                                        <FaStopCircle size={18}/>
                                    </button>
                                    {showSelfDestructMenu && (
                                        <div className="absolute right-0 top-full mt-2 bg-[#1e1f22] border border-white/10 rounded-xl p-2 shadow-2xl z-[100] w-40 animate-in fade-in slide-in-from-top-2">
                                            <p className="text-[10px] font-black uppercase text-gray-500 px-2 py-1 mb-1 italic">Hẹn giờ tự xóa</p>
                                            {[
                                                { label: 'Tắt', value: 0 },
                                                { label: '1 phút', value: 60 },
                                                { label: '1 giờ', value: 3600 },
                                                { label: '1 ngày', value: 86400 }
                                            ].map(opt => (
                                                <div 
                                                    key={opt.value} 
                                                    onClick={() => {
                                                        setSelfDestructTimer(opt.value);
                                                        setShowSelfDestructMenu(false);
                                                    }}
                                                    className={`p-2 text-xs rounded-lg cursor-pointer transition-colors ${selfDestructTimer === opt.value ? 'bg-orange-500 text-white' : 'hover:bg-white/5 text-gray-400'}`}
                                                >
                                                    {opt.label}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Secret Chat Toggle (DMs only) */}
                                {activeRoom.isDM && (
                                    <button 
                                        onClick={() => setIsSecretMode(!isSecretMode)}
                                        className={`p-1.5 rounded-lg transition-all ${isSecretMode ? 'text-red-500 bg-red-500/10' : 'text-gray-500 hover:text-red-400 bg-white/5'}`} 
                                        title={isSecretMode ? "Tắt Chat bí mật" : "Bật Chat bí mật (Không lưu Server)"}
                                    >
                                        <FaLock size={18}/>
                                    </button>
                                )}
                                
                                {isMember && !activeRoom.isDM && currentGroup?.owner !== user.username && (
                                    <button onClick={handleLeaveGroup} className="text-gray-500 hover:text-red-500 transition-all bg-white/5 hover:bg-red-500/10 p-1.5 rounded-lg" title="Rời nhóm">
                                        <FaSignOutAlt size={18}/>
                                    </button>
                                )}
                                
                                {(isAdminOfGroup || isModOfGroup) && !activeRoom.isDM && (<button onClick={() => setShowGroupSettings(true)} className="text-gray-500 hover:text-white transition-all bg-white/5 p-1.5 rounded-lg" title="Cài đặt"><FaCog size={18}/></button>)}
                                {/* P1: Invite to group button */}
                                {(isAdminOfGroup || isModOfGroup) && !activeRoom.isDM && (
                                    <button onClick={() => setShowInviteModal(true)} className="text-gray-500 hover:text-emerald-400 transition-all bg-white/5 p-1.5 rounded-lg" title="Mời thành viên"><FaUserPlus size={18}/></button>
                                )}
                                {/* P1: Mute toggle */}
                                <button onClick={() => toggleMuteRoom(activeRoom.id)} className={`p-1.5 rounded-lg transition-all ${mutedRooms[activeRoom.id] ? 'text-orange-400 bg-orange-500/10' : 'text-gray-500 hover:text-white bg-white/5'}`} title={mutedRooms[activeRoom.id] ? 'Bỏ tắt thông báo' : 'Tắt thông báo'}>{mutedRooms[activeRoom.id] ? <FaPauseCircle size={18}/> : <FaPlayCircle size={18}/>}</button>
                                <button onClick={clearChatHistory} className="text-gray-500 hover:text-red-500 transition-all bg-white/5 p-1.5 rounded-lg" title="Clear Chat History"><FaBroom/></button>
                                <button onClick={() => setIsRightSidebarVisible(!isRightSidebarVisible)} className={`p-1.5 rounded-lg transition-all ${isRightSidebarVisible ? 'text-indigo-500 bg-indigo-500/10' : 'text-gray-500 hover:text-white bg-white/5'}`}>{isRightSidebarVisible ? <FaChevronRight size={18}/> : <FaUsers size={18}/>}</button>
                            </div>
                        </div>

                        {/* Pending requests bar */}
                        {(isAdminOfGroup || isModOfGroup) && currentGroup?.pendingRequests?.length > 0 && (
                            <div className="bg-indigo-600/90 backdrop-blur-md text-white px-6 py-3 flex items-center justify-between animate-in slide-in-from-top duration-500 shadow-xl z-10 border-b border-white/10">
                                <div className="flex items-center gap-3 font-black uppercase text-[10px] italic tracking-widest"><FaUserPlus className="animate-bounce" /> {currentGroup.pendingRequests.filter(un => un !== user.username).length} YÊU CẦU GIA NHẬP</div>
                                <div className="flex gap-2 overflow-x-auto py-1 max-w-[60%] scrollbar-hide">
                                    {currentGroup.pendingRequests.map(uname => {
                                        if (uname === user.username) return null; 
                                        return (
                                            <div key={uname} className="bg-black/40 px-3 py-1.5 rounded-full flex items-center gap-3 border border-white/10 shrink-0 shadow-inner group"><span className="text-[10px] font-black italic">@{uname}</span><div className="flex gap-1"><button onClick={() => handleApprove(currentGroup.groupId, uname, 'accept')} className="bg-emerald-500 p-1.5 rounded-lg hover:scale-110 shadow-lg transition-all"><FaUserCheck size={10}/></button><button onClick={() => handleApprove(currentGroup.groupId, uname, 'reject')} className="bg-red-500 p-1.5 rounded-lg hover:scale-110 shadow-lg transition-all"><FaTimes size={10}/></button></div></div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Phần nội dung Chat, Input... giữ nguyên của File A */}
                        {!isMember ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center animate-in zoom-in-95"><div className="w-24 h-24 bg-orange-500/10 text-orange-500 rounded-[40px] flex items-center justify-center mb-6 shadow-2xl border border-orange-500/20 rotate-12 animate-pulse"><FaLock size={40}/></div><h2 className="text-2xl font-black uppercase mb-2 text-white italic">Khu vực hạn chế</h2><p className="text-gray-500 max-w-sm mb-10 font-bold text-sm italic">Bạn chưa gia nhập vùng đất này. Hãy gửi tín hiệu thâm nhập!</p><button onClick={() => handleRequestJoin(activeRoom.id)} className="bg-indigo-600 text-white px-12 py-5 rounded-2xl font-black uppercase shadow-2xl hover:bg-indigo-500 tracking-[3px] text-xs">Gửi yêu cầu thâm nhập</button></div>
                        ) : (
                            <>
                                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide" ref={chatContainerRef}
                                    onScroll={(e) => {
                                        // P0: Lazy load older messages when scrolling to top
                                        if (e.target.scrollTop < 100 && hasMoreMessages[activeRoom.id] && !loadingMessages) {
                                            const oldestMsg = messages.filter(m => m.roomId === activeRoom.id).sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
                                            if (oldestMsg?.createdAt) loadRoomMessages(activeRoom.id, oldestMsg.createdAt);
                                        }
                                    }}
                                >
                                    {/* Pinned Messages Area */}
                                    {messages.filter(m => (m.roomId === activeRoom.id) && m.isPinned).length > 0 && (
                                        <div className={`p-4 rounded-xl shadow-lg border mb-6 ${darkMode ? 'bg-indigo-900/30 border-indigo-500/30 text-indigo-200' : 'bg-indigo-50 border-indigo-200 text-indigo-800'}`}>
                                            <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest mb-3 opacity-80"><FaThumbtack/> Tin nhắn đã ghim</div>
                                            <div className="space-y-3">
                                                {messages.filter(m => (m.roomId === activeRoom.id) && m.isPinned).map(pm => (
                                                    <div key={`pin-${pm.messageId}`} className="flex justify-between items-center bg-black/5 dark:bg-white/5 p-3 rounded-lg">
                                                        <div className="flex-1 truncate text-sm italic pr-4">
                                                            <span className="font-bold">@{pm.senderUsername}:</span> {pm.text || 'Đã gửi tệp đính kèm...'}
                                                        </div>
                                                        <button onClick={() => handlePinMessage(pm.messageId, false)} className="text-gray-500 hover:text-red-500 shrink-0" title="Bỏ ghim"><FaTimes size={12}/></button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* P0: Loading indicator for pagination */}
                                    {loadingMessages && (
                                        <div className="flex justify-center py-4">
                                            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}

                                    {/* Main Messages Area */}
                                    {messages.filter(m => m.roomId === activeRoom.id).map((msg) => {
                                        const isMe = msg.senderUsername === user.username; 
                                        const sOnline = onlineUsers[msg.senderUsername]; 
                                        return (
                                            <div key={msg.messageId} className={`flex gap-4 ${isMe ? 'flex-row-reverse text-right' : ''} group animate-in slide-in-from-bottom-2`}>
                                                <div onClick={() => handleOpenProfile(msg.senderUsername)} className="w-10 h-10 rounded-xl shadow-lg cursor-pointer overflow-hidden shrink-0 border border-white/5 bg-slate-800 transition-all group-hover:scale-105">{sOnline?.avatar ? <img src={sOnline.avatar} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-white font-black uppercase bg-indigo-500">{msg.sender[0]}</div>}</div>
                                                <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                    <div className={`text-[10px] mb-1.5 font-black uppercase tracking-tighter italic flex items-center gap-1 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                                                        @{msg.senderUsername} • {msg.time}
                                                        {/* P0: Read receipt indicator */}
                                                        {isMe && !msg.isRevoked && (
                                                            <span className={`ml-1 text-[9px] ${(msg.readBy || []).filter(u => u !== user.username).length > 0 ? 'text-blue-400' : 'text-gray-600'}`} title={(msg.readBy || []).filter(u => u !== user.username).join(', ') || 'Chưa ai đọc'}>
                                                                {(msg.readBy || []).filter(u => u !== user.username).length > 0 ? '✓✓' : '✓'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="relative group/bubble">
                                                        {!msg.isRevoked && (
                                                            <div className={`absolute top-0 flex gap-2 p-1 bg-[#0f172a] border border-white/10 shadow-2xl rounded-xl opacity-0 group-hover/bubble:opacity-100 transition-all z-10 ${isMe ? 'right-full mr-3' : 'left-full ml-3'}`}>
                                                                <button onClick={() => setReplyingToMessage(msg)} className="p-1 text-gray-400 hover:text-blue-400" title="Trả lời"><FaReply size={12}/></button>
                                                                <button onClick={() => setForwardMessageData(msg)} className="p-1 text-gray-400 hover:text-green-400" title="Chuyển tiếp"><FaShare size={12}/></button>
                                                                <button onClick={() => handlePinMessage(msg.messageId, !msg.isPinned)} className={`p-1 ${msg.isPinned ? 'text-indigo-400' : 'text-gray-400 hover:text-indigo-400'}`} title={msg.isPinned ? "Bỏ ghim" : "Ghim tin nhắn"}><FaThumbtack size={12}/></button>
                                                                
                                                                <div className="relative">
                                                                    <button onClick={() => setShowReactionMenu(showReactionMenu === msg.messageId ? null : msg.messageId)} className="p-1 text-gray-400 hover:text-yellow-400" title="Thả cảm xúc"><FaSmileBeam size={12}/></button>
                                                                    {showReactionMenu === msg.messageId && (
                                                                        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 shadow-2xl rounded-full p-2 flex gap-2 z-50 animate-in slide-in-from-top-2">
                                                                            {['❤️', '😂', '😮', '😢', '👍'].map(emoji => (
                                                                                <button key={emoji} onClick={() => handleReactToMessage(msg.messageId, emoji)} className="text-xl hover:scale-125 transition-transform">{emoji}</button>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {(isMe || user.role === 'admin') && (
                                                                    <>
                                                                        {isMe && msg.text && !msg.fileData && !msg.msgType && (
                                                                            <button onClick={() => handleEditMessage(msg)} className="p-1 text-gray-400 hover:text-emerald-400" title="Chỉnh sửa"><FaEdit size={12}/></button>
                                                                        )}
                                                                        <button onClick={() => deleteForMe(msg.messageId)} className="p-1 text-gray-400 hover:text-red-500" title="Xóa phía tôi"><FaTrash size={12}/></button>
                                                                        <button onClick={() => unsendEverywhere(msg.messageId)} className="p-1 text-indigo-400 hover:text-indigo-300" title="Thu hồi"><FaUndo size={12}/></button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                        <div className={`p-4 rounded-2xl text-[14px] font-medium leading-relaxed shadow-lg ${msg.msgType === 'sticker' ? 'bg-transparent shadow-none border-none' : (isMe ? (msg.isSecret ? 'bg-red-600 text-white rounded-tr-none' : 'bg-indigo-600 text-white rounded-tr-none') : (darkMode ? 'bg-white/5 text-gray-100 border border-white/5 rounded-tl-none' : 'bg-white text-slate-700 border border-gray-100 rounded-tl-none'))} ${msg.isRevoked ? 'italic opacity-30 border-2 border-dashed' : ''}`}>
                                                            {/* Secret Indicator */}
                                                            {msg.isSecret && (
                                                                <div className={`mb-2 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${isMe ? 'text-red-200/60' : 'text-red-400'}`}>
                                                                    <FaLock size={10}/> Chat Bí Mật (Không lưu server)
                                                                </div>
                                                            )}
                                                            {/* Self-destruct indicator */}
                                                            {msg.expiresAt && !msg.isRevoked && (
                                                                <div className={`mb-2 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${isMe ? 'text-indigo-200/60' : 'text-gray-400'}`}>
                                                                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></div>
                                                                    <FaStopCircle size={10}/> 
                                                                    Tự hủy sau: {(() => {
                                                                        const remaining = Math.max(0, Math.ceil((msg.expiresAt - Date.now()) / 1000));
                                                                        if (remaining < 60) return `${remaining} giây`;
                                                                        if (remaining < 3600) return `${Math.ceil(remaining/60)} phút`;
                                                                        return `${Math.ceil(remaining/3600)} giờ`;
                                                                    })()}
                                                                </div>
                                                            )}
                                                            {!msg.isRevoked && msg.msgType === 'sticker' ? (
                                                                <img src={msg.fileData} className="w-40 h-40 object-contain animate-in zoom-in-50" alt="sticker" />
                                                            ) : (
                                                                <>
                                                                    {!msg.isRevoked && msg.replyTo && (
                                                                        <div className={`mb-3 pl-3 py-1 border-l-2 text-xs opacity-80 ${isMe ? 'border-white/50 bg-black/10' : 'border-indigo-500 bg-black/5 dark:bg-white/5'} rounded-r-lg`}>
                                                                            <div className="font-bold">@{msg.replyTo.senderUsername}</div>
                                                                            <div className="truncate opacity-75">{msg.replyTo.text || 'Đã gửi tệp đính kèm...'}</div>
                                                                        </div>
                                                                    )}
                                                            {msg.msgType === 'poll' ? (
                                                                <div className="min-w-[200px]">
                                                                    <div className="font-black text-lg mb-4 flex items-center gap-2"><FaPoll className="text-emerald-400"/> {msg.pollData?.question}</div>
                                                                    <div className="space-y-2">
                                                                        {msg.pollData?.options.map((opt, i) => {
                                                                            const totalVotes = msg.pollData.options.reduce((sum, o) => sum + (o.votes?.length || 0), 0);
                                                                            const pct = totalVotes === 0 ? 0 : Math.round(((opt.votes?.length || 0) / totalVotes) * 100);
                                                                            const hasVoted = opt.votes?.includes(user.username);
                                                                            return (
                                                                                <div key={i} onClick={() => api.post('/v1/messages/vote', { messageId: msg.messageId, optionIndex: i, username: user.username })} className={`relative p-3 rounded-lg border cursor-pointer overflow-hidden transition-all hover:border-emerald-500 ${hasVoted ? 'border-emerald-500 bg-emerald-500/10' : (darkMode ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-white')}`}>
                                                                                    <div className="absolute left-0 top-0 bottom-0 bg-emerald-500/20 transition-all duration-500" style={{width: `${pct}%`}}></div>
                                                                                    <div className="relative flex justify-between text-sm font-bold z-10">
                                                                                        <span>{opt.text}</span>
                                                                                        <span>{opt.votes?.length || 0} ({pct}%)</span>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            ) : msg.msgType === 'event' ? (
                                                                <div className="min-w-[250px] p-2">
                                                                    <div className="flex items-start gap-4">
                                                                        <div className="w-12 h-12 bg-purple-500 rounded-xl flex flex-col items-center justify-center text-white shrink-0 shadow-lg border border-white/10">
                                                                            <span className="text-[10px] font-black uppercase leading-none opacity-80">THÁNG {msg.eventData?.date.split('-')[1]}</span>
                                                                            <span className="text-xl font-black leading-none">{msg.eventData?.date.split('-')[2]}</span>
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <div className="font-black text-lg mb-1">{msg.eventData?.title}</div>
                                                                            <div className="text-xs font-bold opacity-80 flex items-center gap-1 mb-3"><FaCalendarAlt/> {msg.eventData?.time} • {msg.eventData?.date}</div>
                                                                            <div className="flex items-center justify-between border-t border-white/10 pt-3 mt-3">
                                                                                <div className="text-xs font-bold">{msg.eventData?.attendees?.length || 0} người tham gia</div>
                                                                                <button onClick={() => api.post('/v1/messages/attend-event', { messageId: msg.messageId, username: user.username, action: msg.eventData?.attendees?.includes(user.username) ? 'leave' : 'join' })} className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase transition-all shadow-lg ${msg.eventData?.attendees?.includes(user.username) ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-purple-500 text-white hover:bg-purple-600'}`}>{msg.eventData?.attendees?.includes(user.username) ? 'Hủy tham gia' : 'Tham gia'}</button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    {editingMessage?.messageId === msg.messageId ? (
                                                                        <div className="space-y-2 min-w-[200px]">
                                                                            <input value={editText} onChange={e => setEditText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveEdit()} className="w-full p-2 rounded-lg bg-black/30 border border-white/20 text-sm outline-none focus:border-indigo-400 text-white" autoFocus />
                                                                            <div className="flex gap-2 text-[9px]">
                                                                                <button onClick={handleSaveEdit} className="px-3 py-1 bg-emerald-500 text-white rounded-lg font-black uppercase">Lưu</button>
                                                                                <button onClick={handleCancelEdit} className="px-3 py-1 bg-white/10 text-gray-400 rounded-lg font-black uppercase">Hủy</button>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <>
                                                                            {(() => {
                                                                                const emojiMap = { ':)': '😊', ':D': '😃', ':(': '😢', ';)': '😉', ':P': '😛', '<3': '❤️', ':o': '😮', 'B)': '😎', ':*': '😘', 'xD': '🤣', 'XD': '🤣', ':3': '😺', 'o_O': '😳', '-_-': '😑' };
                                                                                const text = msg.text || '';
                                                                                const urlRegex = /((?:https?:\/\/|www\.)[^\s]+|[a-zA-Z0-9.-]+\.(?:com|net|org|vn|edu|gov|io)[^\s]*)/g;
                                                                                const parts = text.split(urlRegex);
                                                                                return parts.map((part, i) => {
                                                                                    if (urlRegex.test(part)) {
                                                                                        urlRegex.lastIndex = 0;
                                                                                        return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className={`underline font-bold break-all ${isMe ? 'text-blue-200 hover:text-white' : 'text-indigo-400 hover:text-indigo-300'}`}>{part.length > 60 ? part.substring(0, 57) + '...' : part}</a>;
                                                                                    }
                                                                                    let converted = part;
                                                                                    Object.entries(emojiMap).forEach(([code, emoji]) => {
                                                                                        converted = converted.split(code).join(emoji);
                                                                                    });
                                                                                    return <span key={i}>{converted}</span>;
                                                                                });
                                                                            })()}
                                                                            {msg.isEdited && <span className={`text-[9px] italic ml-2 ${isMe ? 'opacity-60' : 'text-gray-500'}`}>(đã chỉnh sửa)</span>}
                                                                        </>
                                                                    )}
                                                                    {!msg.isRevoked && msg.text && (() => {
                                                                        const urlRegex = /((?:https?:\/\/|www\.)[^\s]+|[a-zA-Z0-9.-]+\.(?:com|net|org|vn|edu|gov|io)[^\s]*)/g;
                                                                        const urls = msg.text.match(urlRegex);
                                                                        return urls ? urls.slice(0, 1).map((url, i) => (
                                                                             <LinkPreview key={i} url={url.replace(/\.+$/, '').trim()} darkMode={darkMode} />
                                                                         )) : null;
                                                                    })()}
                                                                    {!msg.isRevoked && msg.fileData && (
                                                                        <div className="mt-3">
                                                                            {msg.fileType === 'audio' ? (
                                                                                <audio controls src={msg.fileData} className="max-w-[200px] h-10" />
                                                                            ) : msg.fileType === 'image' ? (
                                                                                <img src={msg.fileData} onClick={() => setPreviewImage(msg.fileData)} className="max-w-xs rounded-xl shadow-2xl border border-white/10 cursor-pointer hover:opacity-80 transition-all hover:scale-105" alt="attachment" />
                                                                            ) : msg.fileType === 'video' ? (
                                                                                <video controls src={msg.fileData} className="max-w-xs rounded-xl shadow-2xl border border-white/10" />
                                                                            ) : (
                                                                                <a href={msg.fileData} download={msg.fileName} className="flex items-center gap-3 p-3 bg-black/30 rounded-xl text-xs font-black text-indigo-400"><FaFileAlt/> {msg.fileName}</a>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </>
                                                            )}
                                                                </>
                                                            )}
                                                        </div>
                                                        {!msg.isRevoked && msg.reactions && msg.reactions.length > 0 && (
                                                            <div className={`absolute -bottom-3 ${isMe ? 'right-2' : 'left-2'} flex gap-1 z-10`}>
                                                                {Array.from(new Set(msg.reactions.map(r => r.emoji))).map(emoji => (
                                                                    <div key={emoji} className="bg-[#0f172a] border border-white/10 rounded-full px-1.5 py-0.5 text-xs flex items-center gap-1 shadow-lg cursor-pointer hover:scale-110 transition-transform" onClick={() => handleReactToMessage(msg.messageId, emoji)}>
                                                                        {emoji} <span className="text-[10px] text-gray-400 font-bold">{msg.reactions.filter(r => r.emoji === emoji).length}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ); 
                                    })}
                                    <div ref={scrollRef} />
                                </div>

                                {/* Hiển thị Typing Indicator */}
                                {typingUsers.length > 0 && (
                                    <div className="px-6 py-2 text-xs italic font-semibold text-gray-400 flex items-center gap-2 animate-pulse">
                                        <div className="flex gap-1">
                                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                                        </div>
                                        {typingUsers.map(u => `@${u}`).join(', ')} đang soạn tin nhắn...
                                    </div>
                                )}

                                <div className="p-6 shrink-0 relative bg-transparent">
                                    {(currentGroup?.isChannel && user.username !== currentGroup.owner) ? (
                                        <div className="flex items-center justify-center p-4 bg-indigo-500/10 rounded-2xl text-indigo-400 font-black uppercase tracking-[3px] text-[10px] border border-indigo-500/20 animate-pulse">
                                            <FaLock className="mr-2"/> Chỉ quản trị viên mới có thể truyền tín hiệu trong kênh này
                                        </div>
                                    ) : (
                                        <>
                                            {showEmojiPicker && <div ref={emojiPickerRef} className="absolute bottom-24 left-6 z-50 shadow-2xl rounded-[30px] overflow-hidden border border-white/10 animate-in zoom-in-75"><EmojiPicker onEmojiClick={(e)=>setMsgInput(p=>p+e.emoji)} theme={darkMode ? Theme.DARK : Theme.LIGHT} /></div>}
                                            
                                            {replyingToMessage && (
                                                <div className={`mb-2 p-3 rounded-xl flex justify-between items-center border ${darkMode ? 'bg-indigo-900/30 border-indigo-500/30 text-indigo-200' : 'bg-indigo-50 border-indigo-200 text-indigo-800'}`}>
                                                    <div className="flex-1 truncate text-xs">
                                                        <span className="font-black uppercase tracking-widest mr-2"><FaReply className="inline mr-1"/> Trả lời @{replyingToMessage.senderUsername}:</span>
                                                        <span className="italic">{replyingToMessage.text || 'Đã đính kèm tệp...'}</span>
                                                    </div>
                                                    <button onClick={() => setReplyingToMessage(null)} className="ml-4 hover:text-red-500 transition-colors"><FaTimes size={14}/></button>
                                                </div>
                                            )}

                                            <div className={`rounded-2xl flex items-center px-4 py-3 border transition-all ${darkMode ? 'bg-white/5 border-white/10 focus-within:border-indigo-500' : 'bg-white border-gray-200 focus-within:border-indigo-500 shadow-sm'} ${isRecording ? 'border-red-500 animate-pulse bg-red-500/5' : ''}`}>
                                                {!isRecording && (
                                                    <div className={`flex gap-4 mr-4 border-r pr-4 ${darkMode ? 'text-gray-500 border-white/5' : 'text-slate-400 border-gray-200'}`}>
                                                        <FaSmile onClick={()=>{setShowEmojiPicker(!showEmojiPicker); setShowStickerPicker(false);}} className="cursor-pointer hover:text-orange-400 transition-all hover:scale-110" size={20}/>
                                                        <FaSmileBeam onClick={()=>{setShowStickerPicker(!showStickerPicker); setShowEmojiPicker(false);}} className={`cursor-pointer transition-all hover:scale-110 ${showStickerPicker ? 'text-yellow-400' : 'hover:text-yellow-400'}`} size={20} title="Stickers"/>
                                                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                                                        <FaImage onClick={()=>fileInputRef.current.click()} className="cursor-pointer hover:text-blue-500 transition-all hover:scale-110" size={18}/>
                                                        <FaPoll onClick={()=>setShowPollModal(true)} className="cursor-pointer hover:text-emerald-500 transition-all hover:scale-110" size={18} title="Tạo bình chọn"/>
                                                        <FaCalendarAlt onClick={()=>setShowEventModal(true)} className="cursor-pointer hover:text-purple-500 transition-all hover:scale-110" size={18} title="Tạo lịch nhóm"/>
                                                    </div>
                                                )}
                                                
                                                {isRecording ? (
                                                    <div className="flex-1 flex items-center justify-between text-red-500 font-bold uppercase tracking-widest text-xs">
                                                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div> Đang thu âm... {formatTime(recordingTime)}</div>
                                                    </div>
                                                ) : (
                                                    <input value={msgInput} onChange={handleInputChange} onKeyDown={(e)=>e.key==='Enter'&&handleSendText()} placeholder={`Nhập tín hiệu...`} className={`bg-transparent w-full outline-none text-sm font-bold ${darkMode ? 'text-white placeholder:text-gray-700' : 'text-slate-800 placeholder:text-gray-400'}`} />
                                                )}

                                                <div className="flex items-center gap-3 ml-4">
                                                    {isRecording ? (
                                                        <button onClick={stopRecording} className="text-red-500 scale-125 transition-all transform hover:scale-150"><FaStopCircle size={20}/></button>
                                                    ) : (
                                                        <button onClick={startRecording} className="text-gray-400 hover:text-red-500 transition-all transform hover:scale-125"><FaMicrophone size={18}/></button>
                                                    )}
                                                    {!isRecording && (
                                                        <button onClick={handleSendText} className={`${msgInput.trim() ? 'text-indigo-500 scale-125' : 'text-gray-400'} transition-all transform active:scale-90`}><FaPaperPlane size={20}/></button>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <Home user={user} onlineUsers={onlineUsers} allGroups={allGroups} darkMode={darkMode} onSwitchTab={(tab) => {
                        if (tab === 'friends') setShowFriendsTab(true);
                        if (tab === 'discovery') setShowDiscoveryTab(true);
                    }} />
                )}
            </div>

            {/* Cột 4 Right Sidebar */}
            <RightSidebar user={user} onlineUsers={onlineUsers} activeRoom={activeRoom} allGroups={allGroups} handleOpenProfile={handleOpenProfile} handleStartDM={handleStartDM} darkMode={darkMode} isVisible={isRightSidebarVisible && !showSearch} handleKick={handleKick} handleToggleRole={handleToggleRole} lastSeenMap={lastSeenMap} />

            {/* Modals & Components phụ */}
            {showSearch && <MessageSearch darkMode={darkMode} messages={messages} activeRoom={activeRoom} user={user} onClose={() => setShowSearch(false)} />}
            {showGlobalSearch && <GlobalSearch darkMode={darkMode} onClose={() => setShowGlobalSearch(false)} onSelectResult={handleSelectSearchResult} />}
            {showStickerPicker && <div className="absolute bottom-24 left-6 z-50"><StickerPicker onSelect={handleSendSticker} darkMode={darkMode} onClose={() => setShowStickerPicker(false)} /></div>}
            {showMediaGallery && activeRoom && <MediaGallery roomId={activeRoom.id} darkMode={darkMode} onClose={() => setShowMediaGallery(false)} />}
            <CreateChat user={user} isOpen={showGroupCreator} onClose={() => setShowGroupCreator(false)} onCreateGroup={handleCreateGroup} darkMode={darkMode} />
            <UserProfileModal isOpen={profileModal.isOpen} onClose={()=>setProfileModal({isOpen:false, username:''})} targetUsername={profileModal.username} currentUser={user} onUpdateSuccess={handleUpdateSuccess} onStartDM={handleStartDM} />
            
            {/* Modal Chuyển tiếp tin nhắn */}
            {forwardMessageData && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[500] backdrop-blur-sm animate-in zoom-in-95 p-4">
                    <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${darkMode ? 'bg-slate-900 border border-white/10' : 'bg-white'}`}>
                        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-indigo-600 text-white">
                            <h3 className="font-bold uppercase text-sm">Chuyển tiếp tin nhắn</h3>
                            <button onClick={() => setForwardMessageData(null)} className="hover:text-red-300 transition-colors"><FaTimes /></button>
                        </div>
                        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
                            <p className="text-xs text-gray-500 font-bold uppercase mb-2">Chọn nơi chuyển đến</p>
                            
                            {/* Danh sách bạn bè */}
                            {user.friends?.length > 0 && (
                                <div className="space-y-2">
                                    <div className="text-[10px] uppercase font-black text-indigo-400">Bạn bè</div>
                                    {user.friends.map(f => (
                                        <button key={f} onClick={() => handleForwardMessage(`dm_${[user.username, f].sort().join("_")}`)} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${darkMode ? 'border-white/5 hover:bg-white/5 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
                                            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-xs">{f[0].toUpperCase()}</div>
                                            <span className="font-medium text-sm">@{f}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Danh sách nhóm */}
                            {allGroups.filter(g => g.members?.includes(user.username) || g.owner === user.username).length > 0 && (
                                <div className="space-y-2 mt-4">
                                    <div className="text-[10px] uppercase font-black text-orange-400">Nhóm</div>
                                    {allGroups.filter(g => g.members?.includes(user.username) || g.owner === user.username).map(g => (
                                        <button key={g.groupId} onClick={() => handleForwardMessage(g.groupId)} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${darkMode ? 'border-white/5 hover:bg-white/5 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
                                            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs"><FaGlobe/></div>
                                            <span className="font-medium text-sm truncate">{g.groupName}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Tạo Bình Chọn */}
            {showPollModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[500] backdrop-blur-sm animate-in zoom-in-95 p-4">
                    <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${darkMode ? 'bg-slate-900 border border-white/10' : 'bg-white'}`}>
                        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-emerald-600 text-white">
                            <h3 className="font-bold uppercase text-sm flex items-center gap-2"><FaPoll/> Tạo Bình Chọn</h3>
                            <button onClick={() => setShowPollModal(false)} className="hover:text-red-300 transition-colors"><FaTimes /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <input value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} placeholder="Câu hỏi bình chọn..." className={`w-full p-3 rounded-xl border font-bold ${darkMode ? 'bg-black/20 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-slate-800'}`} />
                            {pollOptions.map((opt, i) => (
                                <div key={i} className="flex gap-2">
                                    <input value={opt} onChange={e => { const newOpts = [...pollOptions]; newOpts[i] = e.target.value; setPollOptions(newOpts); }} placeholder={`Lựa chọn ${i + 1}`} className={`w-full p-3 rounded-xl border text-sm ${darkMode ? 'bg-black/20 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-slate-800'}`} />
                                    {pollOptions.length > 2 && (
                                        <button onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))} className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl"><FaTimes/></button>
                                    )}
                                </div>
                            ))}
                            <button onClick={() => setPollOptions([...pollOptions, ""])} className="text-emerald-500 text-sm font-bold uppercase hover:underline">+ Thêm lựa chọn</button>
                            <button onClick={handleCreatePoll} className="w-full py-3 bg-emerald-600 text-white font-black uppercase tracking-widest rounded-xl shadow-lg mt-4 hover:bg-emerald-500 transition-all">Tạo bình chọn</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Tạo Sự Kiện / Lịch */}
            {showEventModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[500] backdrop-blur-sm animate-in zoom-in-95 p-4">
                    <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${darkMode ? 'bg-slate-900 border border-white/10' : 'bg-white'}`}>
                        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-purple-600 text-white">
                            <h3 className="font-bold uppercase text-sm flex items-center gap-2"><FaCalendarAlt/> Tạo Lịch Nhóm</h3>
                            <button onClick={() => setShowEventModal(false)} className="hover:text-red-300 transition-colors"><FaTimes /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <input value={eventTitle} onChange={e => setEventTitle(e.target.value)} placeholder="Tên sự kiện..." className={`w-full p-3 rounded-xl border font-bold ${darkMode ? 'bg-black/20 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-slate-800'}`} />
                            <div className="flex gap-4">
                                <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className={`w-full p-3 rounded-xl border text-sm ${darkMode ? 'bg-black/20 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-slate-800'}`} />
                                <input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} className={`w-full p-3 rounded-xl border text-sm ${darkMode ? 'bg-black/20 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-slate-800'}`} />
                            </div>
                            <button onClick={handleCreateEvent} className="w-full py-3 bg-purple-600 text-white font-black uppercase tracking-widest rounded-xl shadow-lg mt-4 hover:bg-purple-500 transition-all">Tạo Lịch Nhóm</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Group Settings Modal */}
            {showGroupSettings && (
                <div className="fixed inset-0 bg-[#020617]/90 flex items-center justify-center z-[300] backdrop-blur-md p-4 animate-in zoom-in-95">
                    <div className={`w-full max-w-[500px] rounded-[40px] overflow-hidden shadow-2xl border border-white/10 ${darkMode ? 'bg-slate-900' : 'bg-white'}`}>
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-slate-900 to-indigo-900 text-white shadow-xl">
                            <div>
                                <h2 className="text-xl font-black uppercase italic tracking-tighter">Cấu hình #{activeRoom.name}</h2>
                                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest opacity-60 italic uppercase">Admin Control Center</p>
                            </div>
                            <button onClick={()=>setShowGroupSettings(false)} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-red-500 rounded-full transition-all"><FaTimes/></button>
                        </div>
                        
                        <div className="p-8 space-y-8 font-bold">
                            {/* Rename Group */}
                            {(isAdminOfGroup || isModOfGroup) && (
                                <div className="space-y-3">
                                    <p className="text-[9px] font-black uppercase text-gray-500 tracking-[2px] italic border-l-2 border-purple-500 pl-3">Đổi tên nhóm</p>
                                    <div className="flex gap-2">
                                        <input 
                                            value={renameGroupValue} 
                                            onChange={e => setRenameGroupValue(e.target.value)} 
                                            placeholder={activeRoom.name} 
                                            className={`flex-1 p-3 rounded-xl border text-sm outline-none focus:border-purple-500 ${darkMode ? 'bg-black/20 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-slate-800'}`} 
                                        />
                                        <button 
                                            onClick={async () => { 
                                                if (!renameGroupValue.trim()) return; 
                                                await api.post('/groups/rename', { groupId: activeRoom.id, newName: renameGroupValue.trim() }); 
                                                setRenameGroupValue(''); 
                                                setShowGroupSettings(false);
                                                loadData(); 
                                                handleSwitchRoom({ id: activeRoom.id, name: renameGroupValue.trim() });
                                            }} 
                                            className="px-4 py-3 bg-purple-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-purple-500 transition-all shadow-lg"
                                        >
                                            Lưu
                                        </button>
                                    </div>
                                </div>
                            )}

                            {isAdminOfGroup && (
                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={() => handleManageGroup('disable')} className={`p-4 rounded-2xl border-2 flex items-center justify-center gap-2 uppercase text-[10px] font-black transition-all ${currentGroup?.isDisabled ? 'border-emerald-500 text-emerald-500 bg-emerald-500/5 shadow-inner' : 'border-red-500 text-red-500 bg-red-500/5 shadow-inner'}`}>
                                        {currentGroup?.isDisabled ? <><FaPlayCircle size={14}/> Mở cửa</> : <><FaPauseCircle size={14}/> Khóa chat</>}
                                    </button>
                                    <button onClick={() => handleManageGroup('delete')} className="p-4 rounded-2xl border-2 border-gray-600 text-gray-400 flex items-center justify-center gap-2 uppercase text-[10px] font-black hover:bg-red-600 hover:text-white transition-all shadow-md">
                                        <FaTrash size={14}/> Giải tán
                                    </button>
                                </div>
                            )}

                            {!currentGroup?.isPublic && (
                                <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-hide">
                                    <p className="text-[9px] font-black uppercase text-gray-500 tracking-[2px] italic mb-4 border-l-2 border-indigo-500 pl-3">Đội ngũ thám hiểm ({currentGroup?.members?.length})</p>
                                    {currentGroup?.members?.map(u => {
                                        const isHost = u === currentGroup.owner;
                                        const isMod = currentGroup.mods?.includes(u);
                                        const myRoleIsHost = currentGroup.owner === user.username;
                                        const myRoleIsMod = currentGroup.mods?.includes(user.username);
                                        
                                        // MOD không thể đuổi Host hoặc MOD khác
                                        const canKick = myRoleIsHost ? !isHost : (myRoleIsMod && !isHost && !isMod);

                                        return (
                                            <div key={u} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 group/user hover:border-indigo-500/30 transition-all shadow-sm">
                                                <span className="text-sm font-bold italic text-indigo-100 truncate flex-1 uppercase tracking-tighter">
                                                    @{u} 
                                                    {isHost && <span className="text-[8px] bg-indigo-500 text-white px-2 py-0.5 rounded-full uppercase ml-2 shadow-md">Host</span>}
                                                    {isMod && <span className="text-[8px] bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase ml-2 shadow-md">Mod</span>}
                                                </span>
                                                <div className="flex gap-2 opacity-0 group-hover/user:opacity-100 transition-all">
                                                    {myRoleIsHost && !isHost && (
                                                        <>
                                                            <button 
                                                                onClick={() => handleUpdateRole(u, isMod ? 'revoke' : 'grant')} 
                                                                className={`text-[9px] px-2 py-1 uppercase rounded-lg font-black transition-all ${isMod ? 'bg-orange-500 text-white' : 'bg-emerald-500 text-white'}`}
                                                            >
                                                                {isMod ? 'Hủy Mod' : 'Phong Mod'}
                                                            </button>
                                                            <button 
                                                                onClick={async () => { 
                                                                    if (!window.confirm(`Chuyển quyền chủ nhóm cho @${u}?`)) return; 
                                                                    await api.post('/groups/transfer-ownership', { groupId: activeRoom.id, newOwner: u }); 
                                                                    loadData(); 
                                                                    setShowGroupSettings(false);
                                                                }} 
                                                                className="text-[9px] px-2 py-1 uppercase rounded-lg font-black bg-cyan-500 text-white transition-all hover:bg-cyan-400"
                                                                title="Chuyển quyền chủ nhóm"
                                                            >
                                                                <FaExchangeAlt size={10} className="inline mr-1"/> Chuyển
                                                            </button>
                                                        </>
                                                    )}
                                                    {canKick && (
                                                        <button onClick={() => handleKick(u)} className="text-red-400 hover:scale-110 active:text-red-600 bg-red-500/10 p-1.5 rounded-lg">
                                                            <FaUserMinus size={14}/>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Xem Ảnh */}
            {previewImage && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[1000] p-4 animate-in zoom-in-95 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
                    <button onClick={() => setPreviewImage(null)} className="absolute top-6 right-6 text-white bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all">
                        <FaTimes size={24}/>
                    </button>
                    <img src={previewImage} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" alt="Preview" onClick={(e) => e.stopPropagation()} />
                </div>
            )}

            {/* P1: Invite to Group Modal */}
            {showInviteModal && activeRoom && (
                <div className="fixed inset-0 bg-[#020617]/80 flex items-center justify-center z-[300] backdrop-blur-md p-4 animate-in zoom-in-95">
                    <div className={`w-[420px] rounded-[40px] p-8 shadow-2xl border ${darkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-gray-100 text-slate-800'}`}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black uppercase italic tracking-tighter text-indigo-500">Mời thành viên</h2>
                            <button onClick={() => setShowInviteModal(false)} className="text-gray-500 hover:text-red-500 transition-colors"><FaTimes size={20}/></button>
                        </div>
                        <p className={`text-xs mb-6 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Chọn bạn bè để mời vào nhóm <b>{activeRoom.name}</b></p>
                        <div className="max-h-[300px] overflow-y-auto space-y-2 scrollbar-hide">
                            {(user.friends || []).filter(f => {
                                const grp = allGroups.find(g => g.groupId === activeRoom.id);
                                return grp && !(grp.members || []).includes(f);
                            }).map(f => (
                                <div key={f} className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${darkMode ? 'bg-white/2 border-white/5 hover:bg-white/5' : 'bg-slate-50 border-gray-100 hover:bg-slate-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm uppercase overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-slate-300'}`}>
                                            {onlineUsers[f]?.avatar ? <img src={onlineUsers[f].avatar} className="w-full h-full object-cover" alt="" /> : f[0]}
                                        </div>
                                        <div>
                                            <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{onlineUsers[f]?.displayName || f}</p>
                                            <p className={`text-[9px] ${onlineUsers[f] ? 'text-emerald-400' : 'text-gray-500'}`}>{onlineUsers[f] ? 'Online' : 'Offline'}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={async () => {
                                            try {
                                                await api.post('/groups/invite', { groupId: activeRoom.id, targetUsername: f });
                                                toast(`Đã mời @${f} vào nhóm!`, { icon: '✅', style: { borderRadius: '10px', background: '#333', color: '#fff' } });
                                                loadData();
                                            } catch (err) {
                                                toast(err.response?.data?.error || 'Lỗi mời thành viên!', { icon: '❌' });
                                            }
                                        }}
                                        className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all active:scale-95 shadow-lg"
                                    >
                                        Mời
                                    </button>
                                </div>
                            ))}
                            {(user.friends || []).filter(f => {
                                const grp = allGroups.find(g => g.groupId === activeRoom.id);
                                return grp && !(grp.members || []).includes(f);
                            }).length === 0 && (
                                <p className="text-center text-gray-500 py-8 text-sm italic">Tất cả bạn bè đã là thành viên</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Story Viewer Modal */}
            {viewingStories && (
                <StoryViewer 
                    stories={viewingStories.stories} 
                    username={viewingStories.username} 
                    currentUser={user}
                    onClose={() => setViewingStories(null)} 
                    onReact={handleReactStory}
                    onDelete={handleDeleteStory}
                    onNext={handleNextUserStory}
                    darkMode={darkMode} 
                />
            )}

            {/* Story Upload Modal */}
            {showStoryUpload && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[2000] backdrop-blur-md p-4">
                    <div className="w-full max-w-md bg-[#1e293b] rounded-[40px] border border-white/10 p-8 shadow-2xl">
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-6 flex items-center gap-2"><FaPlus className="text-indigo-500"/> Đăng khoảnh khắc</h2>
                        <div className="space-y-6">
                            <div 
                                onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'image/*';
                                    input.onchange = (e) => {
                                        const file = e.target.files[0];
                                        const reader = new FileReader();
                                        reader.onloadend = () => setStoryForm(p => ({ ...p, mediaData: reader.result }));
                                        reader.readAsDataURL(file);
                                    };
                                    input.click();
                                }}
                                className="w-full aspect-video rounded-3xl border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer hover:border-indigo-500 transition-all overflow-hidden"
                            >
                                {storyForm.mediaData ? <img src={storyForm.mediaData} className="w-full h-full object-cover" alt=""/> : <span className="text-gray-500 text-xs font-bold uppercase">Chọn ảnh từ thiết bị</span>}
                            </div>
                            <input 
                                value={storyForm.caption} 
                                onChange={e => setStoryForm(p => ({ ...p, caption: e.target.value }))}
                                placeholder="Thêm mô tả..." 
                                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white text-sm outline-none focus:border-indigo-500"
                            />
                            <div className="flex gap-4">
                                <button onClick={() => setShowStoryUpload(false)} className="flex-1 py-4 bg-white/5 text-gray-400 font-black rounded-2xl uppercase text-[10px] tracking-widest">Hủy</button>
                                <button onClick={handleStoryUpload} className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-600/30">Chia sẻ ngay</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatPage;