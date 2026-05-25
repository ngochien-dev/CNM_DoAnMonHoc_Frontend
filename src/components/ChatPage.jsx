import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import api from '../services/api';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import {
    FaHashtag, FaPlusCircle, FaPaperPlane, FaSignOutAlt, FaCircle,
    FaChevronLeft, FaChevronRight, FaChevronDown, FaFileAlt, FaTrash, FaUndo, FaBroom, FaShieldAlt,
    FaChartBar, FaImage, FaSmile, FaMoon, FaSun, FaPalette,
    FaGlobe, FaCog, FaUserMinus, FaPauseCircle, FaPlayCircle,
    FaUserFriends, FaCommentDots, FaUserPlus, FaTimes, FaUserCheck, FaLock, FaUsers, FaSearch,
    FaVideo, FaShare, FaThumbtack, FaPoll, FaCalendarAlt, FaReply, FaMicrophone, FaStopCircle, FaSmileBeam, FaEdit, FaExchangeAlt, FaTh, FaPlus, FaCamera, FaFolderPlus, FaLanguage, FaCloud, FaMapMarkerAlt, FaGamepad, FaCalendarCheck, FaPhoneAlt, FaArchive, FaRobot, FaFolderOpen,
    FaEllipsisH, FaEllipsisV, FaEye, FaEyeSlash, FaExclamationTriangle, FaCheck, FaBell, FaBellSlash, FaClock
} from 'react-icons/fa';
import { Toaster, toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import StoryBar from './social/StoryBar';
import StoryViewer from './social/StoryViewer';

import UserProfileModal from './user/UserProfileModal';
import AdminStats from './statistics/AdminStats';
import FriendsTab from './friends/FriendsTab';
import GroupDiscovery from './modals/GroupDiscovery';
import AddFriendModal from './modals/AddFriendModal';
import WallpaperModal from './modals/WallpaperModal';
import ForwardMessageModal from './modals/ForwardMessageModal';
import Home from './chat/Home';
import PollModal from './modals/PollModal';
import EventModal from './modals/EventModal';
import SocialFeed from './social/SocialFeed';
import GroupSettingsModal from './modals/GroupSettingsModal';
import RightSidebar from './chat/RightSidebar';
import FolderModal from './modals/FolderModal';
import ThreadSidebar from './chat/ThreadSidebar';
import ImageLightbox from './modals/ImageLightbox';
import CreateChat from './function/CreateChat';
import ChatHeader from './chat/ChatHeader';
import MessageSearch from './chat/MessageSearch';
import GlobalSearch from './chat/GlobalSearch';
import LinkPreview from './chat/LinkPreview';
import StickerPicker from './chat/StickerPicker';
import MediaGallery from './chat/MediaGallery';
import GameCenter from './games/GameCenter';
import TodoTab from './todo/TodoTab';
import CallHistoryTab from './calls/CallHistoryTab';
import ArchivedChatsTab from './chat/ArchivedChatsTab';
import StrangerChatTab from './chat/StrangerChatTab';
import AIAssistantsTab from './chat/AIAssistantsTab';
import CloudDriveTab from './chat/CloudDriveTab';
import SidebarNav from './chat/SidebarNav';
import PaintPadModal from './modals/PaintPadModal';
import SoundSettingsModal from './modals/SoundSettingsModal';
import StoryUploadModal from './modals/StoryUploadModal';
import MessageItem from './chat/MessageItem';
import RoomContextMenu from './chat/RoomContextMenu';
import useAudioRecorder from '../hooks/useAudioRecorder';
import ReportMessageModal from './modals/ReportMessageModal';
import ReportViolationModal from './modals/ReportViolationModal';
import InviteMemberModal from './modals/InviteMemberModal';
import ConversationSidebar from './chat/ConversationSidebar';
import InChatAIPanel from './chat/InChatAIPanel';
import ChatInput from './chat/ChatInput';
import useChatSocket from '../hooks/useChatSocket';
import useE2EE from '../hooks/useE2EE';
import useDrafts from '../hooks/useDrafts';
import useFCM from '../hooks/useFCM';

import useCall from '../context/useCall';
import { useGroupCall } from '../context/GroupCallContext';
import { getSocket, connectSocket, disconnectSocket } from '../services/socket';
import {
    encryptText,
    decryptText
} from '../utils/crypto';

import E2EEDecryptor from './chat/E2EEDecryptor';
import WaveformVoicePlayer from './chat/WaveformVoicePlayer';
import OfflineIndicator from './chat/OfflineIndicator';
import useOfflineSync from '../hooks/useOfflineSync';

const ChatPage = ({ user, setUser }) => {
    const socket = getSocket();
    useFCM(user);
    const [msgInput, setMsgInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState({});
    const [allGroups, setAllGroups] = useState([]);
    const [activeRoom, setActiveRoom] = useState(null);
    const [lastContextRoom, setLastContextRoom] = useState(null);
    const isCloudActive = activeRoom?.id === `dm_${user?.username}_${user?.username}`;

    useEffect(() => {
        if (activeRoom && activeRoom.id !== 'ai_agent_room') {
            setLastContextRoom(activeRoom);
        }
    }, [activeRoom]);
    const [unreadCounts, setUnreadCounts] = useState({});
    const [callHistory, setCallHistory] = useState([]); // State cho lịch sử cuộc gọi
    const [typingUsers, setTypingUsers] = useState([]); // Danh sách người đang gõ trong phòng hiện tại
    const [loadingMessages, setLoadingMessages] = useState(false); // P0: Loading state cho pagination
    const [hasMoreMessages, setHasMoreMessages] = useState({}); // P0: Track nếu còn tin nhắn cũ hơn per room
    const [notificationPermission, setNotificationPermission] = useState('default'); // P0: Notification permission

    const [showFriendsTab, setShowFriendsTab] = useState(false);
    const [showDiscoveryTab, setShowDiscoveryTab] = useState(false);
    const [showTodoTab, setShowTodoTab] = useState(false);
    const [showCallHistoryTab, setShowCallHistoryTab] = useState(false);
    const [showArchivedTab, setShowArchivedTab] = useState(false);
    const [showAITab, setShowAITab] = useState(false);
    const [showCloudDriveTab, setShowCloudDriveTab] = useState(false);
    const [showGameCenter, setShowGameCenter] = useState(false);
    const [showStrangerTab, setShowStrangerTab] = useState(false);
    const [showSocialFeed, setShowSocialFeed] = useState(false);
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [showGlobalSearch, setShowGlobalSearch] = useState(false);
    const [showAddFriend, setShowAddFriend] = useState(false);
    const [searchContent, setSearchContent] = useState('');
    const [roomSearchQuery, setRoomSearchQuery] = useState('');
    const [filterUser, setFilterUser] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [isRightSidebarVisible, setIsRightSidebarVisible] = useState(true);
    const [activeThread, setActiveThread] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showGroupCreator, setShowGroupCreator] = useState(false);
    const [isPublicGroupCreator, setIsPublicGroupCreator] = useState(false);
    const [showGroupSettings, setShowGroupSettings] = useState(false);
    const [showStickerPicker, setShowStickerPicker] = useState(false);
    const [profileModal, setProfileModal] = useState({ isOpen: false, username: '' });
    const [forwardMessageData, setForwardMessageData] = useState(null); // Lưu tin nhắn cần forward
    const [showPollModal, setShowPollModal] = useState(false);
    const [showEventModal, setShowEventModal] = useState(false);
    const [stats, setStats] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [lightboxImage, setLightboxImage] = useState(null); // { url, sender, time }
    const [translatedMessages, setTranslatedMessages] = useState({});
    const [translatingMessageId, setTranslatingMessageId] = useState(null);

    // Canvas Paint Pad & Custom Sound State
    const [showPaintPad, setShowPaintPad] = useState(false);
    const [showSoundSettings, setShowSoundSettings] = useState(false);
    const [showMediaGallery, setShowMediaGallery] = useState(false);
    const [mutedRooms, setMutedRooms] = useState(() => {
        try { return JSON.parse(localStorage.getItem('mutedRooms') || '{}'); } catch { return {}; }
    }); // P1: Mute notifications per room
    const [showInviteModal, setShowInviteModal] = useState(false); // P1: Invite to group modal
    const [lastSeenMap, setLastSeenMap] = useState({}); // P1: Last seen timestamps
    const [activeSidebarTab, setActiveSidebarTab] = useState('all'); // Folders: all, personal, groups, unread
    const [activeRoomMenu, setActiveRoomMenu] = useState(null); // { roomId, name, isDM, isPinned, x, y }

    const toggleRoomClassification = (folderId, roomId) => {
        setCustomFolders(prev => prev.map(f => {
            if (f.id === folderId) {
                const exists = f.roomIds.includes(roomId);
                return {
                    ...f,
                    roomIds: exists ? f.roomIds.filter(id => id !== roomId) : [...f.roomIds, roomId]
                };
            }
            return f;
        }));
        toast.success('Đã cập nhật phân loại thư mục');
    };

    const toggleMuteRoomDuration = (roomId, durationMs) => {
        setMutedRooms(prev => {
            let next;
            if (durationMs === null) {
                next = { ...prev };
                delete next[roomId];
            } else if (durationMs === -1) {
                next = { ...prev, [roomId]: 'forever' };
            } else {
                next = { ...prev, [roomId]: (Date.now() + durationMs).toString() };
            }
            localStorage.setItem('mutedRooms', JSON.stringify(next));
            mutedRoomsRef.current = next;
            return next;
        });
        toast.success(durationMs === null ? 'Đã bật lại thông báo' : 'Đã tắt thông báo cuộc trò chuyện');
    };

    const [isSecretMode, setIsSecretMode] = useState(false); // P2: Secret Chat (no server logs)
    const [secretChatStatus, setSecretChatStatus] = useState('idle'); // 'idle' | 'waiting' | 'requested' | 'established'
    const [secretChatRequester, setSecretChatRequester] = useState(null);
    const [viewingStories, setViewingStories] = useState(null); // { username, stories, allGroupedStories }
    const [showStoryUpload, setShowStoryUpload] = useState(false);

    // Custom Chat Wallpapers (Hình nền phòng chat)
    const [showWallpaperModal, setShowWallpaperModal] = useState(false);
    const [currentWallpaper, setCurrentWallpaper] = useState('');
    const [customWallpaperUrl, setCustomWallpaperUrl] = useState('');

    // Message Moderation states
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportingMessage, setReportingMessage] = useState(null);
    const [showReportViolationModal, setShowReportViolationModal] = useState(false);

    // Rich Chat, Mention, and Audio states
    const [activePinIndex, setActivePinIndex] = useState(0);
    const [isPinListExpanded, setIsPinListExpanded] = useState(false);
    const [showMentionPopup, setShowMentionPopup] = useState(false);
    const [mentionSearchQuery, setMentionSearchQuery] = useState('');

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

    const {
        startGroupCall,
        isInGroupCall,
    } = useGroupCall();

    // Ref trỏ đến loadRoomMessages để dùng trong onSyncComplete callback (tránh forward reference)
    const loadRoomMessagesRef = useRef(null);

    // Offline/Sync: IndexedDB cache + pending message queue
    const {
        isOnline,
        pendingCount,
        syncStatus,
        sendOfflineMessage,
        cacheRoomMessages,
        getCachedRoomMessages,
        flushPendingQueue,
        resolvePendingMessage,
    } = useOfflineSync({
        socket,
        user,
        setMessages,
        activeRoomId: activeRoom?.id,
        onSyncComplete: () => {
            // Reload dữ liệu sau khi sync xong (dùng ref để tránh stale closure)
            if (activeRoom?.id && loadRoomMessagesRef.current) {
                loadRoomMessagesRef.current(activeRoom.id);
            }
        },
    });

    // ─── Push Notification FCM & Badge Count Effects ─────────────────────────────
    // Cập nhật số tin nhắn chưa đọc lên tiêu đề trang (badge count)
    useEffect(() => {
        const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + (count || 0), 0);
        if (totalUnread > 0) {
            document.title = `(${totalUnread}) OTT Chat`;
        } else {
            document.title = 'OTT Chat';
        }
    }, [unreadCounts]);

    // Xử lý chuyển phòng từ Service Worker background click (khi app đang chạy)
    useEffect(() => {
        const handleServiceWorkerMessage = (event) => {
            if (event.data && event.data.type === 'NAVIGATE_ROOM' && event.data.roomId) {
                const roomId = event.data.roomId;
                const isDM = roomId.startsWith('dm_');
                let roomName = '';
                if (isDM) {
                    const parts = roomId.replace('dm_', '').split('_');
                    const other = parts.find(p => p !== user?.username);
                    roomName = other || '';
                } else {
                    const group = allGroups.find(g => g.groupId === roomId);
                    roomName = group ? group.groupName : 'Nhóm';
                }
                handleSwitchRoom({ id: roomId, name: roomName, isDM });
            }
        };

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
        }

        return () => {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
            }
        };
    }, [allGroups, user?.username]);

    // Xử lý chuyển phòng từ Service Worker background click (khi app khởi chạy mới)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const urlRoomId = params.get('roomId');
        if (urlRoomId && allGroups.length > 0 && user?.username) {
            const isDM = urlRoomId.startsWith('dm_');
            let roomName = '';
            if (isDM) {
                const parts = urlRoomId.replace('dm_', '').split('_');
                const other = parts.find(p => p !== user.username);
                roomName = other || '';
            } else {
                const group = allGroups.find(g => g.groupId === urlRoomId);
                roomName = group ? group.groupName : 'Nhóm';
            }
            handleSwitchRoom({ id: urlRoomId, name: roomName, isDM });
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [allGroups, user?.username]);

    // Xử lý link mời nhóm còn đang chờ (sau khi đăng nhập)
    useEffect(() => {
        const pendingToken = localStorage.getItem('pending_invite_token');
        if (pendingToken && user?.username) {
            localStorage.removeItem('pending_invite_token'); // Xóa ngay tránh lặp lại
            
            const joinPendingGroup = async () => {
                const toastId = toast.loading("Đang tự động tham gia nhóm từ liên kết mời...");
                try {
                    const response = await api.post('/groups/join-by-invite', { token: pendingToken });
                    const { groupId, joined } = response.data;
                    if (joined === false) {
                        toast.success("Đã gửi yêu cầu gia nhập nhóm từ liên kết mời. Vui lòng chờ phê duyệt!", { id: toastId });
                    } else {
                        toast.success("Tự động tham gia nhóm thành công!", { id: toastId });
                        
                        // Tải lại dữ liệu nhóm mới
                        await loadData();
                        
                        // Chuyển tới phòng chat mới
                        const groupName = response.data.groupName || 'Nhóm mới';
                        handleSwitchRoom({ id: groupId, name: groupName, isDM: false });
                    }
                } catch (error) {
                    console.error("Auto join group failed:", error);
                    toast.error(error.response?.data?.error || "Không thể tự động gia nhập nhóm từ liên kết mời!", { id: toastId });
                }
            };
            
            joinPendingGroup();
        }
    }, [user?.username]);



    const [replyingToMessage, setReplyingToMessage] = useState(null);
    const [showReactionMenu, setShowReactionMenu] = useState(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const [editText, setEditText] = useState('');

    // Telegram-style Custom Folders State & Handlers
    const [customFolders, setCustomFolders] = useState(() => {
        try {
            const saved = localStorage.getItem(`ott_folders_${user?.username}`);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    useEffect(() => {
        if (user?.username) {
            localStorage.setItem(`ott_folders_${user.username}`, JSON.stringify(customFolders));
        }
    }, [customFolders, user?.username]);

    const [showFolderModal, setShowFolderModal] = useState(false);
    const [editingFolder, setEditingFolder] = useState(null);
    const [folderName, setFolderName] = useState('');
    const [folderRooms, setFolderRooms] = useState([]);
    const [modalSearch, setModalSearch] = useState('');
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);

    // Persisted Draft Messages State
    const { updateDraft, clearDraft, getDraft } = useDrafts(user?.username);

    const toggleRoomInFolder = (roomId) => {
        setFolderRooms(prev =>
            prev.includes(roomId) ? prev.filter(id => id !== roomId) : [...prev, roomId]
        );
    };

    const handleDeleteFolder = (folderId) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa thư mục này không? Các cuộc hội thoại bên trong sẽ không bị ảnh hưởng.")) {
            setCustomFolders(prev => prev.filter(f => f.id !== folderId));
            setActiveSidebarTab('all');
            setShowFolderModal(false);
            setEditingFolder(null);
        }
    };

    const handleSaveFolder = () => {
        if (!folderName.trim()) {
            toast.error("Vui lòng nhập tên thư mục!");
            return;
        }
        if (folderRooms.length === 0) {
            toast.error("Vui lòng chọn ít nhất 1 cuộc trò chuyện!");
            return;
        }

        if (editingFolder) {
            setCustomFolders(prev => prev.map(f => f.id === editingFolder.id ? { ...f, name: folderName, roomIds: folderRooms } : f));
            toast.success("Đã cập nhật thư mục!");
        } else {
            const newFolder = {
                id: `folder_${Date.now()}`,
                name: folderName,
                roomIds: folderRooms
            };
            setCustomFolders(prev => [...prev, newFolder]);
            toast.success("Đã tạo thư mục mới!");
        }

        setFolderName('');
        setFolderRooms([]);
        setEditingFolder(null);
        setShowFolderModal(false);
    };
    // Khởi tạo Hook ghi âm
    const handleSendAudio = (audioDataUrl) => {
        if (!user?.username || !activeRoom?.id) return;
        socket.emit('send_message', {
            sender: user.displayName,
            senderUsername: user.username,
            fileData: audioDataUrl,
            fileType: 'audio',
            fileName: 'voice_message.webm',
            roomId: activeRoom.id,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
    };

    const { isRecording, recordingTime, startRecording, stopRecording, formatTime } = useAudioRecorder(handleSendAudio);
    const sharedE2EEKey = useE2EE(user, activeRoom);

    // Load Wallpaper when switching rooms
    useEffect(() => {
        if (activeRoom && user?.username) {
            const wp = localStorage.getItem(`chat_wallpaper_${user.username}_${activeRoom.id}`);
            setCurrentWallpaper(wp || '');
            setCustomWallpaperUrl(wp && (wp.startsWith('http') || wp.startsWith('data:image')) ? wp : '');
        } else {
            setCurrentWallpaper('');
            setCustomWallpaperUrl('');
        }
    }, [activeRoom, user?.username]);

    const playNotificationSound = (soundType) => {
        const activeSound = soundType || localStorage.getItem('alertSound') || 'telegram';
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();

            if (activeSound === 'telegram') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);

                gain.gain.setValueAtTime(0.25, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.4);
            }
            else if (activeSound === 'zalo') {
                const playChirp = (delay, freq) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
                    osc.frequency.exponentialRampToValueAtTime(freq * 1.4, ctx.currentTime + delay + 0.08);

                    gain.gain.setValueAtTime(0, ctx.currentTime + delay);
                    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + delay + 0.02);
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.08);

                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(ctx.currentTime + delay);
                    osc.stop(ctx.currentTime + delay + 0.08);
                };
                playChirp(0, 523);
                playChirp(0.1, 659);
            }
            else if (activeSound === 'discord') {
                const osc1 = ctx.createOscillator();
                const gain1 = ctx.createGain();
                osc1.type = 'sine';
                osc1.frequency.setValueAtTime(660, ctx.currentTime);
                gain1.gain.setValueAtTime(0.1, ctx.currentTime);
                gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
                osc1.connect(gain1);
                gain1.connect(ctx.destination);
                osc1.start();
                osc1.stop(ctx.currentTime + 0.08);

                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(660, ctx.currentTime + 0.12);
                gain2.gain.setValueAtTime(0.1, ctx.currentTime + 0.12);
                gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc2.start(ctx.currentTime + 0.12);
                osc2.stop(ctx.currentTime + 0.2);
            }
            else if (activeSound === 'retro') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(150, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.25);

                gain.gain.setValueAtTime(0.05, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.25);
            }
            else if (activeSound === 'nokia') {
                const playNote = (delay, freq, duration) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

                    gain.gain.setValueAtTime(0, ctx.currentTime + delay);
                    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + delay + 0.01);
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + duration);

                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(ctx.currentTime + delay);
                    osc.stop(ctx.currentTime + delay + duration);
                };
                playNote(0, 1318.51, 0.1); // E6
                playNote(0.12, 1174.66, 0.1); // D6
                playNote(0.24, 783.99, 0.15); // G5
                playNote(0.4, 880, 0.15); // A5
            }
        } catch (e) {
            console.error("Lỗi phát âm thanh:", e);
        }
    };

    // Canvas drawing methods
    const handleSendPaint = (dataUrl) => {
        socket.emit('send_message', {
            sender: user.displayName,
            senderUsername: user.username,
            text: '[Bản vẽ phác thảo]',
            fileData: dataUrl,
            fileType: 'image',
            fileName: 'sketch.png',
            roomId: activeRoom.id,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });

        setShowPaintPad(false);
        toast.success("Đã gửi bức vẽ phác thảo nghệ thuật!");
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

    // P1: Fetch last seen for offline friends (Đã fix lỗi Infinite Loop)
    const friendsString = user?.friends ? user.friends.join(',') : '';
    const onlineCount = Object.keys(onlineUsers).length;

    useEffect(() => {
        if (!friendsString) return;
        const offlineFriends = friendsString.split(',').filter(f => !onlineUsers[f]);
        if (offlineFriends.length === 0) return;

        api.get(`/friends/last-seen?usernames=${offlineFriends.slice(0, 30).join(',')}`)
            .then(res => setLastSeenMap(res.data || {}))
            .catch(() => { });
    }, [friendsString, onlineCount]);

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

    // P0: Mark messages as delivered when loaded or received
    const markMessagesAsDelivered = useCallback((roomMessages, roomId) => {
        if (!user?.username || !roomId) return;
        const undeliveredMsgIds = roomMessages
            .filter(m => m.senderUsername !== user.username && !(m.deliveredTo || []).includes(user.username))
            .map(m => m.messageId);
        if (undeliveredMsgIds.length === 0) return;
        // Emit via socket for real-time bulk update
        socket.emit('messages_delivered', { messageIds: undeliveredMsgIds, roomId });
    }, [user?.username, socket]);

    // P0: Pagination — load messages for a specific room
    const loadRoomMessages = useCallback(async (roomId, before = null) => {
        if (!roomId || loadingMessages) return;
        if (roomId === 'ai_agent_room') return;
        setLoadingMessages(true);
        try {
            // Nếu đang offline, đọc từ IndexedDB cache ngay lập tức
            if (!navigator.onLine && !before) {
                const cached = await getCachedRoomMessages(roomId);
                if (cached.length > 0) {
                    const activeCached = cached;
                    setMessages(prev => {
                        const otherRoomMsgs = prev.filter(m => m.roomId !== roomId);
                        return [...otherRoomMsgs, ...activeCached];
                    });
                }
                setLoadingMessages(false);
                return;
            }

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
                    const activeNewMsgs = newMsgs;
                    setMessages(prev => {
                        const otherRoomMsgs = prev.filter(m => m.roomId !== roomId);
                        return [...otherRoomMsgs, ...activeNewMsgs];
                    });
                    // Cache lại vào IndexedDB sau khi fetch thành công
                    cacheRoomMessages(roomId, activeNewMsgs).catch(() => { });
                }
                setHasMoreMessages(prev => ({ ...prev, [roomId]: data.hasMore }));
            } else {
                // Legacy non-paginated response (fallback)
                const filtered = (Array.isArray(data) ? data : [])
                    .filter(msg => !(user.deletedMessages || []).includes(msg.messageId));
                setMessages(filtered);
                cacheRoomMessages(roomId, filtered).catch(() => { });
            }
        } catch (err) {
            console.error('Load room messages error:', err);
            // API lỗi (ví dụ: mất mạng) -> fallback về IndexedDB cache
            if (!before) {
                const cached = await getCachedRoomMessages(roomId);
                if (cached.length > 0) {
                    const activeCached = cached;
                    setMessages(prev => {
                        const otherRoomMsgs = prev.filter(m => m.roomId !== roomId);
                        return [...otherRoomMsgs, ...activeCached];
                    });
                }
            }
        } finally {
            setLoadingMessages(false);
        }
    }, [user?.username, loadingMessages, getCachedRoomMessages, cacheRoomMessages]);

    // Sync ref sau khi khai báo (để onSyncComplete callback luôn có version mới nhất)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    loadRoomMessagesRef.current = loadRoomMessages;

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
                setMessages(msgData
                    .filter(msg => !(u.data.deletedMessages || []).includes(msg.messageId))
                );
            } else if (msgData.messages) {
                setMessages(msgData.messages
                    .filter(msg => !(u.data.deletedMessages || []).includes(msg.messageId))
                );
            }
            setAllGroups(g.data);
            setCallHistory(Array.isArray(c.data) ? c.data : c.data?.items || []);
            if (u.data.username === user.username) {
                setUser(prev => {
                    if (!prev) return null;
                    // Tối ưu hóa: Chỉ cập nhật React state nếu dữ liệu mảng quan trọng có sự thay đổi
                    const isChanged =
                        JSON.stringify(prev.friends) !== JSON.stringify(u.data.friends) ||
                        JSON.stringify(prev.friendRequests) !== JSON.stringify(u.data.friendRequests) ||
                        JSON.stringify(prev.pinnedRooms) !== JSON.stringify(u.data.pinnedRooms) ||
                        JSON.stringify(prev.archivedRooms) !== JSON.stringify(u.data.archivedRooms);

                    return isChanged ? { ...prev, ...u.data } : prev;
                });
            }
        } catch (err) { console.error("Load data error:", err); }
    };

    // Hàm xử lý gọi video
    const handleVideoCall = (targetUsername = activeRoom?.name) => {
        if (!targetUsername || isCallBusy) return;
        startCall(targetUsername, activeRoom?.isDM ? activeRoom.id : undefined);
    };

    // Hàm xử lý gọi video nhóm
    const handleGroupVideoCall = async () => {
        console.groupCollapsed('[GroupCall][ChatPage] CLICK group video button');
        console.debug('activeRoom:', activeRoom);
        console.debug('user:', user);
        console.debug('isCallBusy:', isCallBusy);
        console.debug('isInGroupCall:', isInGroupCall);
        console.debug('allGroups count:', allGroups.length);
        console.groupEnd();

        if (!activeRoom || activeRoom.isDM) {
            console.warn('[GroupCall][ChatPage] Không phải phòng nhóm, bỏ qua gọi nhóm', {
                activeRoom,
            });
            return;
        }

        if (isCallBusy || isInGroupCall) {
            console.warn('[GroupCall][ChatPage] Đang bận call, không bắt đầu group call mới', {
                isCallBusy,
                isInGroupCall,
            });
            return;
        }

        const currentG = allGroups.find(g => g.groupId === activeRoom.id);

        console.groupCollapsed('[GroupCall][ChatPage] RESOLVE current group');
        console.debug('activeRoomId:', activeRoom.id);
        console.debug('currentGroup:', currentG);
        try {
          console.debug('currentGroup JSON:', JSON.stringify(currentG, null, 2));
        } catch (error) {
          console.debug('currentGroup JSON failed:', error);
        }
        console.groupEnd();

        if (!currentG) {
            console.warn('[GroupCall][ChatPage] Không tìm thấy group hiện tại', {
                activeRoomId: activeRoom.id,
                allGroupsCount: allGroups.length,
            });
            return;
        }

        const groupMembers = Array.isArray(currentG.members) ? currentG.members : [];

        const participants = groupMembers
            .map(member => {
                if (typeof member === 'string') return member;
                return member?.username || member?.userName || member?.id || member?.userId || '';
            })
            .filter(Boolean);

        const uniqueParticipants = Array.from(new Set(participants));

        console.groupCollapsed('[GroupCall][ChatPage] START group video call');
        console.debug('groupId:', activeRoom.id);
        console.debug('groupName:', activeRoom.name);
        console.debug('currentUsername:', user?.username);
        console.debug('raw members:', groupMembers);
        console.debug('participants:', uniqueParticipants);
        try {
          console.debug('participants JSON:', JSON.stringify(uniqueParticipants, null, 2));
        } catch (error) {
          console.debug('participants JSON failed:', error);
        }
        console.groupEnd();

        await startGroupCall(activeRoom.id, uniqueParticipants);
    };

    const handleUpdateSuccess = (updatedData) => {
        if (updatedData) setUser(prev => ({ ...prev, ...updatedData }));
        loadData();
    };

    const handleOpenProfile = (uname) => setProfileModal({ isOpen: true, username: uname });
    
    const handleLogout = () => {
        disconnectSocket();
        localStorage.removeItem('user_session');
        setUser(null);
    };

    const handleOpenReportModal = (msg) => {
        setReportingMessage(msg);
        setShowReportModal(true);
    };

    const scrollToMessage = (messageId) => {
        const el = document.getElementById(`msg-${messageId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Highlight temporarily
            el.classList.add('bg-indigo-500/20');
            setTimeout(() => {
                el.classList.remove('bg-indigo-500/20');
            }, 2000);
        }
    };

    const getRecentChatUsers = () => {
        const chatUsers = new Set();
        messages.forEach(m => {
            if (m.roomId?.startsWith('dm_') && m.roomId.includes(user.username)) {
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

        // SAVE DRAFT FOR THE PREVIOUS ROOM
        if (activeRoom?.id) {
            updateDraft(activeRoom?.id, msgInput);
        }

        if (activeRoom && (isSecretMode || secretChatStatus !== 'idle')) {
            socket.emit('close_secret_chat', { roomId: activeRoom.id });
            setMessages(prev => prev.filter(m => !(m.roomId === activeRoom.id && m.isSecret)));
        }
        setTypingUsers([]); // Xóa trạng thái typing khi chuyển phòng
        setActivePinIndex(0);
        setShowMentionPopup(false);
        setActiveRoom(room);
        setShowFriendsTab(false);
        setShowDiscoveryTab(false);
        setShowSocialFeed(false);
        setShowAITab(false);
        setShowCloudDriveTab(false);
        setShowGameCenter(false);
        setShowArchivedTab(false);
        setShowTodoTab(false);
        setShowCallHistoryTab(false);
        setIsAdminMode(false);
        setShowSearch(false);
        setShowGlobalSearch(false);
        setReplyingToMessage(null);
        setShowReactionMenu(null);
        setIsSecretMode(false); // Reset secret mode on room switch
        setSecretChatStatus('idle');
        setSecretChatRequester(null);
        if (room) {
            setUnreadCounts(prev => ({ ...prev, [room.id]: 0 }));
            // P0: Load messages for the new room (pagination)
            loadRoomMessages(room.id);
            // RESTORE DRAFT FOR THE NEW ROOM
            setMsgInput(getDraft(room.id));
        } else {
            setMsgInput('');
        }
    };

    const handleStartDM = (friendUname) => {
        const dmId = `dm_${[user.username, friendUname].sort().join("_")}`;
        handleSwitchRoom({ id: dmId, name: friendUname, isDM: true });
    };

    const handleJumpToMessage = (roomId, messageId) => {
        const isDM = roomId.startsWith('dm_');
        let roomName = '';
        if (isDM) {
            const users = roomId.replace('dm_', '').split('_');
            const other = users.find(p => p !== user.username);
            roomName = other || '';
        } else {
            const group = allGroups.find(g => g.groupId === roomId);
            roomName = group ? group.groupName : '';
        }

        if (isDM) {
            handleStartDM(roomName);
        } else {
            handleSwitchRoom({ id: roomId, name: roomName });
        }

        // Wait for room to render
        setTimeout(() => {
            scrollToMessage(messageId);
        }, 400);
        setShowCloudDriveTab(false);
    };

    const handleCreateGroup = async (name, isPublic, isChannel = false, members = [], description = '') => {
        const publicStatus = user.role === 'admin' ? isPublic : false;
        await api.post('/groups/create', { groupName: name, owner: user.username, isPublic: publicStatus, isChannel, members, description });
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
        if (window.confirm(`Xác nhận?`)) {
            await api.post('/groups/manage', { groupId: activeRoom.id, action });
            if (action === 'delete') { handleSwitchRoom(null); setShowGroupSettings(false); }
            loadData();
        }
    };

    const handleLeaveGroup = async () => {
        if (window.confirm(`Bạn có chắc chắn muốn rời khỏi vũ trụ này?`)) {
            await api.post('/groups/remove-member', { groupId: activeRoom.id, targetUsername: user.username });
            handleSwitchRoom(null);
            loadData();
        }
    };

    const handlePinMessage = async (messageId, isPinned) => {
        // Optimistic update for instant UI feedback
        setMessages(prev => prev.map(m => m.messageId === messageId ? { ...m, isPinned } : m));

        try {
            await api.post('/v1/messages/pin', { messageId, isPinned });
        } catch (err) {
            console.error('Failed to pin/unpin message:', err);
            toast.error('Không thể cập nhật trạng thái ghim');
            // Revert optimistic update on failure
            setMessages(prev => prev.map(m => m.messageId === messageId ? { ...m, isPinned: !isPinned } : m));
        }
    };

    const handleKick = async (target) => {
        if (window.confirm(`Kích @${target}?`)) {
            await api.post('/groups/remove-member', { groupId: activeRoom.id, targetUsername: target });
            loadData();
        }
    };

    const handleToggleRole = async (targetUsername, action) => {
        if (window.confirm(`${action === 'grant' ? 'Thăng cấp' : 'Giáng chức'} @${targetUsername}?`)) {
            await api.post('/groups/role', { groupId: activeRoom.id, targetUsername, action });
            loadData();
        }
    };

    const handleUpdateRole = async (target, action) => {
        await api.post('/groups/role', { groupId: activeRoom.id, targetUsername: target, action });
        loadData();
    };

    const handleExportChat = () => {
        if (!activeRoom) return;
        const roomMessages = messages.filter(m => m.roomId === activeRoom.id);
        if (roomMessages.length === 0) return alert('Không có tin nhắn nào để tải xuống!');

        const exportFormat = window.prompt("Nhập 'pdf' để xuất định dạng PDF, hoặc 'json' để xuất JSON:", "pdf");
        if (!exportFormat) return; // Hủy bỏ

        const format = exportFormat.toLowerCase().trim();

        if (format === 'json') {
            const dataStr = JSON.stringify(roomMessages, null, 2);
            const blob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `chat_backup_${activeRoom.id}_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } else if (format === 'pdf') {
            const toastId = toast.loading("Đang tạo file PDF...");
            const script = document.createElement('script');
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
            script.onload = () => {
                const container = document.createElement('div');
                container.style.padding = '20px';
                container.style.fontFamily = 'Arial, sans-serif';
                container.style.color = '#333';

                let html = `<h2 style="text-align:center; font-family: sans-serif;">Lịch sử trò chuyện: ${activeRoom.name}</h2><hr/>`;
                roomMessages.forEach(msg => {
                    let timeStr = "";
                    if (msg.createdAt) {
                        timeStr = new Date(msg.createdAt).toLocaleString('vi-VN');
                    } else if (msg.time) {
                        timeStr = msg.time;
                    } else {
                        timeStr = "[Không rõ thời gian]";
                    }

                    const content = msg.isRevoked ? '<i style="color:red">Tin nhắn này đã bị thu hồi</i>' : (msg.text || '[Nội dung đa phương tiện / Tin nhắn hệ thống]');

                    html += `
                        <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee; font-family: sans-serif;">
                            <div style="font-size: 12px; color: #888; margin-bottom: 5px;">
                                <strong>@${msg.senderUsername}</strong> • ${timeStr}
                            </div>
                            <div style="font-size: 14px; line-height: 1.5;">
                                ${content}
                            </div>
                        </div>
                    `;
                });
                container.innerHTML = html;

                const opt = {
                    margin: 15,
                    filename: `chat_backup_${activeRoom.id}_${new Date().toISOString().split('T')[0]}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2 },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };

                window.html2pdf().set(opt).from(container).save().then(() => {
                    toast.success("Xuất PDF thành công!", { id: toastId });
                }).catch(err => {
                    toast.error("Lỗi tạo PDF", { id: toastId });
                    console.error(err);
                });
            };
            document.body.appendChild(script);
        } else {
            alert("Lựa chọn không hợp lệ. Vui lòng nhập 'pdf' hoặc 'json'.");
        }
    };

    const clearChatHistory = async () => {
        if (!user?.username || !activeRoom?.id) return;
        if (window.confirm(`Xóa lịch sử tại đây?`)) {
            await api.post('/v1/messages/clear-history', { username: user.username, roomId: activeRoom.id });
            setMessages(prev => prev.filter(m => m.roomId !== activeRoom.id));
            await loadData(); // Sync deleted messages state immediately!
        }
    };

    const handleSendText = async () => {
        if (!user?.username || !activeRoom?.id) return;
        const currentG = allGroups.find(g => g.groupId === activeRoom.id);
        if (currentG?.isDisabled) return alert("Kênh đã phong tỏa!");
        if (!msgInput.trim()) return;

        let textToSend = msgInput;
        let isEncrypted = false;
        let iv = null;

        if (isSecretMode) {
            if (!sharedE2EEKey) {
                alert("Đối phương chưa kích hoạt E2EE. Vui lòng chờ họ trực tuyến để thiết lập kết nối an toàn!");
                return;
            }
            try {
                const encrypted = await encryptText(msgInput, sharedE2EEKey);
                textToSend = encrypted.ciphertext;
                iv = encrypted.iv;
                isEncrypted = true;
            } catch (err) {
                console.error("Encryption failed:", err);
                alert("Lỗi mã hóa tin nhắn!");
                return;
            }
        }

        const payload = {
            sender: user.displayName,
            senderUsername: user.username,
            text: textToSend,
            roomId: activeRoom.id,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            createdAt: new Date().toISOString()
        };
        if (isSecretMode) payload.isSecret = true;
        if (isEncrypted) {
            payload.isEncrypted = true;
            payload.iv = iv;
        }
        if (replyingToMessage) {
            payload.replyTo = {
                messageId: replyingToMessage.messageId,
                senderUsername: replyingToMessage.senderUsername,
                text: replyingToMessage.text,
                isEncrypted: replyingToMessage.isEncrypted || false,
                iv: replyingToMessage.iv || null
            };
        }
        // Nếu đang offline hoặc socket chưa kết nối, enqueue vào IndexedDB queue
        if (!isOnline || !socket.connected) {
            const optimisticMsg = await sendOfflineMessage(payload, activeRoom.id);
            setMessages(prev => [...prev, optimisticMsg]);
            setMsgInput(''); setShowEmojiPicker(false);
            setReplyingToMessage(null);
            if (activeRoom?.id) clearDraft(activeRoom?.id);
            return;
        }

        socket.emit('send_message', payload);

        setMsgInput(''); setShowEmojiPicker(false);
        setReplyingToMessage(null);

        // CLEAR DRAFT ON MESSAGE SEND
        if (activeRoom?.id) {
            clearDraft(activeRoom?.id);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file || !user?.username || !activeRoom?.id) return;
        if (file.size > 5000000) return alert("File quá nặng!");
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
            if (replyingToMessage) {
                payload.replyTo = {
                    messageId: replyingToMessage.messageId,
                    senderUsername: replyingToMessage.senderUsername,
                    text: replyingToMessage.text,
                    isEncrypted: replyingToMessage.isEncrypted || false,
                    iv: replyingToMessage.iv || null
                };
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

    const handleToggleArchive = async (roomId, isArchived) => {
        try {
            const action = isArchived ? 'unarchive' : 'archive';
            const res = await api.post('/users/toggle-archive', { username: user.username, roomId, action });
            if (res.data.success) {
                setUser(prev => ({ ...prev, archivedRooms: res.data.archivedRooms || [] }));
                toast.success(action === 'archive' ? 'Đã lưu trữ hội thoại' : 'Đã đưa hội thoại ra màn hình chính');
                if (action === 'archive' && activeRoom?.id === roomId) {
                    setActiveRoom(null);
                }
            }
        } catch (err) {
            toast.error('Không thể thực hiện yêu cầu');
        }
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setMsgInput(val);

        // Mentions logic
        const currentG = allGroups.find(g => g.groupId === activeRoom?.id);
        if (currentG && !currentG.isDM) {
            const lastAtIndex = val.lastIndexOf('@');
            if (lastAtIndex !== -1) {
                const afterAt = val.slice(lastAtIndex + 1);
                if (!afterAt.includes(' ')) {
                    setShowMentionPopup(true);
                    setMentionSearchQuery(afterAt.toLowerCase());
                } else {
                    setShowMentionPopup(false);
                }
            } else {
                setShowMentionPopup(false);
            }
        } else {
            setShowMentionPopup(false);
        }

        // SAVE DRAFT IN REAL TIME
        if (activeRoom?.id) {
            updateDraft(activeRoom?.id, val);
        }

        if (!activeRoom) return;

        // Phát tín hiệu đang gõ
        socket.emit('typing_start', { roomId: activeRoom.id, senderUsername: user.username });

        // Tự động tắt sau 3 giây ngừng gõ
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('typing_end', { roomId: activeRoom.id, senderUsername: user.username });
        }, 3000);
    };

    const handleSelectMention = (username) => {
        const lastAtIndex = msgInput.lastIndexOf('@');
        if (lastAtIndex !== -1) {
            const base = msgInput.slice(0, lastAtIndex);
            const nextVal = base + `@${username} `;
            setMsgInput(nextVal);
            setShowMentionPopup(false);
            if (activeRoom?.id) {
                updateDraft(activeRoom?.id, nextVal);
            }
        }
    };

    const handleEmojiClick = (emojiData) => {
        const newVal = msgInput + emojiData.emoji;
        setMsgInput(newVal);

        // SAVE DRAFT IN REAL TIME ON EMOJI SELECT
        if (activeRoom?.id) {
            updateDraft(activeRoom?.id, newVal);
        }
    };

    const unsendEverywhere = (id) => { if (window.confirm("Thu hồi?")) socket.emit('revoke_message', id); };

    const handleEditMessage = async (msg) => {
        setEditingMessage(msg);
        if (msg.isEncrypted && sharedE2EEKey) {
            try {
                const plainText = await decryptText(msg.text, msg.iv, sharedE2EEKey);
                setEditText(plainText);
            } catch (err) {
                setEditText(msg.text || '');
            }
        } else {
            setEditText(msg.text || '');
        }
    };

    const handleSaveEdit = async () => {
        if (!editingMessage || !editText.trim()) return;

        let newTextToSend = editText.trim();
        let newIv = null;

        if (editingMessage.isEncrypted) {
            if (!sharedE2EEKey) {
                alert("Không thể thiết lập E2EE: Khóa chung chưa đồng bộ!");
                return;
            }
            try {
                const encrypted = await encryptText(newTextToSend, sharedE2EEKey);
                newTextToSend = encrypted.ciphertext;
                newIv = encrypted.iv;
            } catch (err) {
                console.error("Encryption failed for edit:", err);
                alert("Lỗi mã hóa tin nhắn chỉnh sửa!");
                return;
            }
        }

        socket.emit('edit_message', {
            messageId: editingMessage.messageId,
            newText: newTextToSend,
            ...(editingMessage.isEncrypted && { iv: newIv })
        });
        setEditingMessage(null);
        setEditText('');
    };

    const handleCancelEdit = () => {
        setEditingMessage(null);
        setEditText('');
    };

    const handleSendLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Trình duyệt của bạn không hỗ trợ định vị!");
            return;
        }

        const toastId = toast.loading("Đang lấy vị trí...");
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

                socket.emit('send_message', {
                    sender: user.displayName,
                    senderUsername: user.username,
                    msgType: 'location',
                    locationData: { lat: latitude, lng: longitude },
                    text: `📍 Đã chia sẻ vị trí hiện tại`,
                    roomId: activeRoom.id,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                });

                toast.success("Đã chia sẻ vị trí!", { id: toastId });
            },
            (error) => {
                console.error("Lỗi lấy vị trí:", error);
                toast.error("Không thể lấy vị trí. Vui lòng cấp quyền!", { id: toastId });
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
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
            forwardFrom: {
                senderUsername: forwardMessageData.senderUsername,
                senderDisplayName: forwardMessageData.sender || forwardMessageData.senderUsername
            },
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        setForwardMessageData(null);
        setForwardSearchQuery('');
        toast.success("Đã chuyển tiếp tin nhắn thành công!");
    };

    const handleTranslateMessage = async (msgId, rawText) => {
        if (translatedMessages[msgId]) {
            setTranslatedMessages(prev => {
                const next = { ...prev };
                delete next[msgId];
                return next;
            });
            return;
        }

        setTranslatingMessageId(msgId);
        try {
            const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(rawText);
            const langPair = hasVietnamese ? 'vi|en' : 'en|vi';

            const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(rawText)}&langpair=${langPair}`);
            const data = await res.json();

            if (data.responseData?.translatedText) {
                setTranslatedMessages(prev => ({
                    ...prev,
                    [msgId]: data.responseData.translatedText
                }));
                toast.success(`Đã dịch sang ${hasVietnamese ? 'Tiếng Anh' : 'Tiếng Việt'}!`);
            } else {
                throw new Error("Translation failed");
            }
        } catch (error) {
            console.error("Translation error:", error);
            toast.error("Không thể kết nối máy chủ dịch thuật. Đang dịch ngoại tuyến bằng AI...");
            const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(rawText);
            const offlineTranslation = hasVietnamese
                ? "[AI Translator] " + rawText + " (Translated to English automatically)"
                : "[AI Dịch Giả] " + rawText + " (Tự động dịch sang Tiếng Việt)";
            setTranslatedMessages(prev => ({
                ...prev,
                [msgId]: offlineTranslation
            }));
        } finally {
            setTranslatingMessageId(null);
        }
    };

    const handleSummarizeChat = async () => {
        if (!activeRoom) return;
        const roomMsgs = messages.filter(m => m.roomId === activeRoom.id);
        if (roomMsgs.length === 0) {
            toast.error("Không có tin nhắn nào để tóm tắt.");
            return;
        }

        const recentMsgs = roomMsgs.slice(-50); // Get up to 50 recent messages
        let chatText = recentMsgs.map(m => {
            const sender = onlineUsers[m.senderUsername]?.displayName || m.senderUsername;
            return `${sender}: ${m.isRevoked ? "[Đã thu hồi]" : m.text || "[Hình ảnh/File]"}`;
        }).join('\n');

        const toastId = toast.loading("✨ AI đang đọc và tóm tắt hội thoại...");
        try {
            const res = await api.post('/chatbot/summarize', { chatText });
            toast.success("Đã có bản tóm tắt!", { id: toastId });
            
            // Show result using SweetAlert2
            Swal.fire({
                title: '✨ Tóm tắt Hội thoại',
                text: res.data.summary,
                icon: 'info',
                confirmButtonText: 'Đóng',
                confirmButtonColor: '#4f46e5',
                background: darkMode ? '#1e293b' : '#ffffff',
                color: darkMode ? '#ffffff' : '#0f172a',
            });
        } catch (error) {
            console.error("Summarize error:", error);
            toast.error("Lỗi khi tóm tắt hội thoại.", { id: toastId });
        }
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

    // Gọi Hook quản lý Socket (Clean Code)
    useChatSocket({
        socket, user, setUser, loadData,
        activeRoomRef, chatContainerRef, mutedRoomsRef,
        setMessages, setOnlineUsers, setUnreadCounts, setTypingUsers,
        setSecretChatStatus, setSecretChatRequester, setIsSecretMode,
        playNotificationSound, sendBrowserNotification,
        onReconnect: flushPendingQueue,          // Flush pending queue khi socket reconnect
        resolvePendingMessage,                   // Resolve optimistic messages khi server confirm
    });

    // Load lại data khi có thay đổi từ cuộc gọi
    useEffect(() => {
        if (user?.username) loadData();
    }, [callHistoryVersion]);

    // Tự động cuộn xuống đáy chỉ khi chuyển phòng chat (nhìn thấy tin nhắn mới nhất ban đầu)
    useEffect(() => {
        if (activeRoom) {
            setTimeout(() => {
                if (chatContainerRef.current) {
                    chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
                }
            }, 60);
        }
    }, [activeRoom?.id]);

    // P0: Mark visible messages as read and delivered when switching rooms or receiving new messages
    useEffect(() => {
        if (!activeRoom || !user?.username) return;
        const roomMsgs = messages.filter(m => m.roomId === activeRoom.id);

        // Mark as delivered immediately
        markMessagesAsDelivered(roomMsgs, activeRoom.id);

        // Small delay to batch read receipts
        const timer = setTimeout(() => markMessagesAsRead(roomMsgs), 1000);
        return () => clearTimeout(timer);
    }, [activeRoom?.id, messages.length, markMessagesAsRead, markMessagesAsDelivered]);

    if (!user?.username) {
        return <div className="p-6 text-sm font-bold text-gray-500">Dang tai thong tin nguoi dung...</div>;
    }

    const currentGroup = allGroups.find(g => g.groupId === activeRoom?.id);
    const isAdminOfGroup = currentGroup?.owner === user.username;
    const isModOfGroup = currentGroup?.mods?.includes(user.username);
    const isMember = !activeRoom || activeRoom.id.startsWith('dm_') || (activeRoom && currentGroup?.isPublic) || currentGroup?.members?.includes(user.username);

    return (
        <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-500 ${darkMode ? 'bg-[#0f172a] text-[#dbdee1]' : 'bg-[#f8fafc] text-slate-800'}`}>
            <Toaster position="top-right" />
            <div onClickCapture={() => { if (profileModal.isOpen) setProfileModal({ isOpen: false, username: '' }); }} className="h-full shrink-0 flex">
                <SidebarNav
                    user={user}
                    onlineUsers={onlineUsers}
                    activeRoom={activeRoom}
                    setActiveRoom={setActiveRoom}
                    darkMode={darkMode}
                    setDarkMode={setDarkMode}
                    showFriendsTab={showFriendsTab}
                    setShowFriendsTab={setShowFriendsTab}
                    showDiscoveryTab={showDiscoveryTab}
                    setShowDiscoveryTab={setShowDiscoveryTab}
                    showSocialFeed={showSocialFeed}
                    setShowSocialFeed={setShowSocialFeed}
                    showTodoTab={showTodoTab}
                    setShowTodoTab={setShowTodoTab}
                    showCallHistoryTab={showCallHistoryTab}
                    setShowCallHistoryTab={setShowCallHistoryTab}
                    showArchivedTab={showArchivedTab}
                    setShowArchivedTab={setShowArchivedTab}
                    showAITab={showAITab}
                    setShowAITab={setShowAITab}
                    showCloudDriveTab={showCloudDriveTab}
                    setShowCloudDriveTab={setShowCloudDriveTab}
                    showGameCenter={showGameCenter}
                    setShowGameCenter={setShowGameCenter}
                    showStrangerTab={showStrangerTab}
                    setShowStrangerTab={setShowStrangerTab}
                    isAdminMode={isAdminMode}
                    setIsAdminMode={setIsAdminMode}
                    setShowSoundSettings={setShowSoundSettings}
                    setIsPublicGroupCreator={setIsPublicGroupCreator}
                    setShowGroupCreator={setShowGroupCreator}
                    handleSwitchRoom={handleSwitchRoom}
                    setStats={setStats}
                    isCloudActive={isCloudActive}
                    handleOpenProfile={handleOpenProfile}
                />
            </div>

            <div onClickCapture={() => { if (profileModal.isOpen) setProfileModal({ isOpen: false, username: '' }); }} className="h-full shrink-0 flex">
                <ConversationSidebar
                    user={user} setUser={setUser} onlineUsers={onlineUsers}
                    allGroups={allGroups} messages={messages} activeRoom={activeRoom}
                    darkMode={darkMode} isSidebarVisible={isSidebarVisible}
                    roomSearchQuery={roomSearchQuery} setRoomSearchQuery={setRoomSearchQuery}
                    setShowAddFriend={setShowAddFriend} setShowGroupCreator={setShowGroupCreator}
                    setIsPublicGroupCreator={setIsPublicGroupCreator}
                    activeSidebarTab={activeSidebarTab} setActiveSidebarTab={setActiveSidebarTab}
                    showFilterDropdown={showFilterDropdown} setShowFilterDropdown={setShowFilterDropdown}
                    customFolders={customFolders} setEditingFolder={setEditingFolder}
                    setFolderName={setFolderName} setFolderRooms={setFolderRooms}
                    setShowFolderModal={setShowFolderModal}
                    setViewingStories={setViewingStories} setShowStoryUpload={setShowStoryUpload}
                    unreadCounts={unreadCounts} handleSwitchRoom={handleSwitchRoom}
                    handleStartDM={handleStartDM} handleOpenProfile={handleOpenProfile}
                    setActiveRoomMenu={setActiveRoomMenu} getRecentChatUsers={getRecentChatUsers}
                />
            </div>

            <div className={`flex-1 flex flex-col min-w-0 ${darkMode ? 'bg-transparent' : 'bg-[#f8fafc]'}`}>
                {profileModal.isOpen ? (
                    <UserProfileModal
                        isOpen={profileModal.isOpen}
                        onClose={() => setProfileModal({ isOpen: false, username: '' })}
                        targetUsername={profileModal.username}
                        currentUser={user}
                        onStartDM={handleStartDM}
                        darkMode={darkMode}
                        onLogout={handleLogout}
                    />
                ) : showStrangerTab ? (
                    <StrangerChatTab darkMode={darkMode} user={user} />
                ) : showFriendsTab ? (
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
                ) : showGameCenter ? (
                    <GameCenter
                        user={user}
                        onClose={() => setShowGameCenter(false)}
                        darkMode={darkMode}
                    />
                ) : showDiscoveryTab ? (
                    <GroupDiscovery allGroups={allGroups} user={user} handleRequestJoin={handleRequestJoin} darkMode={darkMode} onJoinSuccess={(id, name) => handleSwitchRoom({ id, name })} />
                ) : showTodoTab ? (
                    <TodoTab user={user} darkMode={darkMode} />
                ) : showCallHistoryTab ? (
                    <CallHistoryTab
                        user={user}
                        callHistory={callHistory}
                        onlineUsers={onlineUsers}
                        startCall={startCall}
                        isCallBusy={isCallBusy}
                        darkMode={darkMode}
                    />
                ) : showArchivedTab ? (
                    <ArchivedChatsTab
                        user={user}
                        allGroups={allGroups}
                        onlineUsers={onlineUsers}
                        unreadCounts={unreadCounts}
                        getRecentChatUsers={getRecentChatUsers}
                        handleStartDM={handleStartDM}
                        handleSwitchRoom={handleSwitchRoom}
                        handleToggleArchive={handleToggleArchive}
                        darkMode={darkMode}
                    />
                ) : showAITab ? (
                    <AIAssistantsTab
                        darkMode={darkMode}
                    />
                ) : showCloudDriveTab ? (
                    <CloudDriveTab
                        user={user}
                        messages={messages}
                        allGroups={allGroups}
                        handleJumpToMessage={handleJumpToMessage}
                        darkMode={darkMode}
                    />
                ) : isAdminMode ? (
                    <AdminStats stats={stats} darkMode={darkMode} />
                ) : activeRoom ? (
                    activeRoom.id === 'ai_agent_room' ? (
                        <InChatAIPanel
                            darkMode={darkMode}
                            activeRoom={activeRoom}
                            lastContextRoom={lastContextRoom}
                            onPasteToInput={(text) => {
                                if (lastContextRoom) {
                                    if (lastContextRoom.isDM && lastContextRoom.id !== `dm_${user.username}_${user.username}`) {
                                        handleStartDM(lastContextRoom.name);
                                    } else {
                                        handleSwitchRoom(lastContextRoom);
                                    }
                                }
                                setMsgInput(text);
                            }}
                        />
                    ) : (
                        <>
                            <ChatHeader
                            activeRoom={activeRoom}
                            darkMode={darkMode}
                            isCloudActive={isCloudActive}
                            onlineUsers={onlineUsers}
                            currentGroup={currentGroup}
                            isCallBusy={isCallBusy}
                            showSearch={showSearch}
                            setShowSearch={setShowSearch}
                            setShowGlobalSearch={setShowGlobalSearch}
                            currentWallpaper={currentWallpaper}
                            setShowWallpaperModal={setShowWallpaperModal}
                            isSecretMode={isSecretMode}
                            secretChatStatus={secretChatStatus}
                            setIsSecretMode={setIsSecretMode}
                            setSecretChatStatus={setSecretChatStatus}
                            setSecretChatRequester={setSecretChatRequester}
                            setMessages={setMessages}
                            sharedE2EEKey={sharedE2EEKey}
                            user={user}
                            isMember={isMember}
                            handleLeaveGroup={handleLeaveGroup}
                            isAdminOfGroup={isAdminOfGroup}
                            isModOfGroup={isModOfGroup}
                            setShowGroupSettings={setShowGroupSettings}
                            setShowInviteModal={setShowInviteModal}
                            toggleMuteRoom={toggleMuteRoom}
                            mutedRooms={mutedRooms}
                            onSummarize={handleSummarizeChat}
                            clearChatHistory={clearChatHistory}
                            isRightSidebarVisible={isRightSidebarVisible}
                            setIsRightSidebarVisible={setIsRightSidebarVisible}
                            handleApprove={handleApprove}
                            handleVideoCall={handleVideoCall}
                            handleGroupVideoCall={handleGroupVideoCall}
                            isInGroupCall={isInGroupCall}
                            isSidebarVisible={isSidebarVisible}
                            setIsSidebarVisible={setIsSidebarVisible}
                            setShowMediaGallery={setShowMediaGallery}
                            socket={socket}
                        />
                        {/* Phần nội dung Chat, Input... giữ nguyên của File A */}
                        {!isMember ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center animate-in zoom-in-95"><div className="w-24 h-24 bg-orange-500/10 text-orange-500 rounded-[40px] flex items-center justify-center mb-6 shadow-2xl border border-orange-500/20 rotate-12 animate-pulse"><FaLock size={40} /></div><h2 className="text-2xl font-black uppercase mb-2 text-white italic">Khu vực hạn chế</h2><p className="text-gray-500 max-w-sm mb-10 font-bold text-sm italic">Bạn chưa gia nhập vùng đất này. Hãy gửi tín hiệu thâm nhập!</p><button onClick={() => handleRequestJoin(activeRoom.id)} className="bg-indigo-600 text-white px-12 py-5 rounded-2xl font-black uppercase shadow-2xl hover:bg-indigo-500 tracking-[3px] text-xs">Gửi yêu cầu thâm nhập</button></div>
                        ) : (
                            <>
                                {secretChatStatus === 'waiting' && (
                                    <div className={`px-6 py-4 flex items-center justify-between shadow-xl z-10 border-b transition-all duration-300 ${darkMode ? 'bg-yellow-600/20 border-yellow-500/20 text-yellow-200' : 'bg-yellow-50 border-yellow-200 text-yellow-800'}`}>
                                        <div className="flex items-center gap-3 font-black uppercase text-[10px] tracking-wider animate-pulse">
                                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-ping"></div>
                                            <FaLock /> Đang đợi đối phương chấp nhận chat bí mật...
                                        </div>
                                        <button
                                            onClick={() => {
                                                socket.emit('close_secret_chat', { roomId: activeRoom.id });
                                                setSecretChatStatus('idle');
                                                toast("Đã hủy lời mời Chat Bí Mật.");
                                            }}
                                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
                                        >
                                            Hủy yêu cầu
                                        </button>
                                    </div>
                                )}

                                {secretChatStatus === 'requested' && (
                                    <div className={`px-6 py-4 flex flex-col sm:flex-row items-center justify-between shadow-xl z-10 border-b gap-3 transition-all duration-300 ${darkMode ? 'bg-rose-950/40 border-rose-500/20 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                                        <div className="flex items-center gap-3 font-black uppercase text-[10px] tracking-wider">
                                            <FaLock className="animate-bounce text-rose-500" size={14} />
                                            @{secretChatRequester} mời bạn tham gia chat bí mật (E2EE)
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <button
                                                onClick={() => {
                                                    socket.emit('accept_secret_chat', { roomId: activeRoom.id, requester: secretChatRequester });
                                                    setSecretChatStatus('established');
                                                    setIsSecretMode(true);
                                                }}
                                                className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all shadow-md hover:scale-105 active:scale-95"
                                            >
                                                Chấp nhận
                                            </button>
                                            <button
                                                onClick={() => {
                                                    socket.emit('decline_secret_chat', { roomId: activeRoom.id, requester: secretChatRequester });
                                                    setSecretChatStatus('idle');
                                                    setSecretChatRequester(null);
                                                }}
                                                className="bg-black/20 hover:bg-black/30 text-rose-400 dark:text-rose-300 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all active:scale-95"
                                            >
                                                Từ chối
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {secretChatStatus === 'established' && (
                                    <div className={`px-6 py-3.5 flex items-center justify-between shadow-xl z-10 border-b transition-all duration-300 ${darkMode ? 'bg-emerald-950/30 border-emerald-500/20 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                                        <div className="flex items-center gap-3 font-black uppercase text-[10px] tracking-wider">
                                            <FaShieldAlt className="text-emerald-500 animate-pulse" />
                                            Đã thiết lập kết nối mã hóa đầu cuối (E2EE) thành công!
                                        </div>
                                        <button
                                            onClick={() => {
                                                socket.emit('close_secret_chat', { roomId: activeRoom.id });
                                                setIsSecretMode(false);
                                                setSecretChatStatus('idle');
                                                setSecretChatRequester(null);
                                                setMessages(prev => prev.filter(m => !(m.roomId === activeRoom.id && m.isSecret)));
                                                toast("Đã đóng cuộc trò chuyện bí mật.");
                                            }}
                                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
                                        >
                                            Thoát chat bí mật
                                        </button>
                                    </div>
                                )}

                                {/* Multiple Pinned Messages Sticky Header Banner */}
                                {(() => {
                                    const pinnedMsgs = messages.filter(m => (m.roomId === activeRoom.id) && m.isPinned);
                                    if (pinnedMsgs.length === 0) return null;

                                    // Zalo/Telegram style: always show the most recent pin at the top collapsed banner
                                    const latestPin = pinnedMsgs[pinnedMsgs.length - 1];

                                    return (
                                        <div className="relative z-40 shrink-0">
                                            {/* Collapsed Main Pinned Banner */}
                                            <div className={`px-6 py-2.5 flex items-center justify-between gap-4 border-b transition-all duration-300 ${darkMode ? 'bg-[#0f172a]/95 border-white/5 text-indigo-200 backdrop-blur-md' : 'bg-indigo-50 border-indigo-100 text-indigo-900 shadow-sm'
                                                }`}>
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <FaThumbtack className="text-indigo-500 animate-bounce shrink-0" size={13} />
                                                    <div
                                                        className="flex-1 min-w-0 cursor-pointer hover:underline"
                                                        onClick={() => scrollToMessage(latestPin.messageId)}
                                                    >
                                                        <div className="text-[9px] uppercase font-black tracking-wider opacity-60">
                                                            Tin ghim mới nhất • @{latestPin.senderUsername}
                                                        </div>
                                                        <p className="text-xs font-bold truncate italic mt-0.5">
                                                            {latestPin.text || '[Tệp đính kèm]'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 shrink-0">
                                                    {pinnedMsgs.length > 1 && (
                                                        <button
                                                            onClick={() => setIsPinListExpanded(prev => !prev)}
                                                            className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 ${isPinListExpanded
                                                                ? 'bg-indigo-600 text-white shadow-md'
                                                                : 'bg-black/10 dark:bg-white/5 hover:bg-black/15 dark:hover:bg-white/10 text-indigo-500 dark:text-indigo-300 border border-black/5 dark:border-white/5'
                                                                }`}
                                                            title="Xem tất cả tin ghim"
                                                        >
                                                            +{pinnedMsgs.length - 1} ghim {isPinListExpanded ? '▲' : '▼'}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handlePinMessage(latestPin.messageId, false)}
                                                        className="p-1.5 rounded-full hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors"
                                                        title="Bỏ ghim tin này"
                                                    >
                                                        <FaTimes size={13} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Expanded Vertical Dropdown List */}
                                            {isPinListExpanded && pinnedMsgs.length > 1 && (
                                                <div className={`absolute top-full left-0 right-0 max-h-60 overflow-y-auto border-b shadow-2xl transition-all duration-300 animate-in slide-in-from-top-2 pr-1 scrollbar-hide ${darkMode ? 'bg-[#0f172a]/98 border-white/5 backdrop-blur-xl text-white' : 'bg-white/98 border-gray-150 backdrop-blur-xl text-slate-800'
                                                    }`}>
                                                    <div className="p-2 space-y-1.5">
                                                        <div className="px-3 py-1 text-[9px] uppercase font-black tracking-wider opacity-40">
                                                            Danh sách tất cả tin ghim ({pinnedMsgs.length})
                                                        </div>
                                                        {pinnedMsgs.slice().reverse().map((pin, i) => (
                                                            <div
                                                                key={pin.messageId}
                                                                className={`p-2.5 rounded-xl flex items-center justify-between gap-4 transition-all duration-200 ${darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                                                                    }`}
                                                            >
                                                                <div
                                                                    className="flex-1 min-w-0 cursor-pointer"
                                                                    onClick={() => {
                                                                        scrollToMessage(pin.messageId);
                                                                        setIsPinListExpanded(false);
                                                                    }}
                                                                >
                                                                    <div className="text-[9px] font-black tracking-tighter opacity-65 flex items-center gap-1.5">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                                                        @{pin.senderUsername}
                                                                    </div>
                                                                    <p className="text-xs font-semibold mt-0.5 truncate italic">
                                                                        {pin.text || '[Tệp đính kèm]'}
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    onClick={() => handlePinMessage(pin.messageId, false)}
                                                                    className="p-1 rounded-full hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                                                                    title="Bỏ ghim"
                                                                >
                                                                    <FaTimes size={12} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide" ref={chatContainerRef}
                                    style={currentWallpaper ? (
                                        currentWallpaper.startsWith('http') || currentWallpaper.startsWith('data:image') || currentWallpaper.startsWith('/assets') || currentWallpaper.startsWith('blob:')
                                            ? { backgroundImage: `url(${currentWallpaper})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }
                                            : { background: currentWallpaper }
                                    ) : undefined}
                                    onScroll={(e) => {
                                        // P0: Lazy load older messages when scrolling to top
                                        if (e.target.scrollTop < 100 && hasMoreMessages[activeRoom.id] && !loadingMessages) {
                                            const oldestMsg = messages.filter(m => m.roomId === activeRoom.id).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
                                            if (oldestMsg?.createdAt) loadRoomMessages(activeRoom.id, oldestMsg.createdAt);
                                        }
                                    }}
                                >

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
                                            <MessageItem
                                                key={msg.messageId}
                                                msg={msg}
                                                user={user}
                                                isMe={isMe}
                                                sOnline={sOnline}
                                                darkMode={darkMode}
                                                sharedE2EEKey={sharedE2EEKey}
                                                searchContent={searchContent}
                                                translatedMessages={translatedMessages}
                                                translatingMessageId={translatingMessageId}
                                                showReactionMenu={showReactionMenu}
                                                editingMessage={editingMessage}
                                                editText={editText}
                                                setEditText={setEditText}
                                                handleOpenProfile={handleOpenProfile}
                                                setReplyingToMessage={setReplyingToMessage}
                                                setActiveThread={setActiveThread}
                                                setIsRightSidebarVisible={setIsRightSidebarVisible}
                                                setForwardMessageData={setForwardMessageData}
                                                handleTranslateMessage={handleTranslateMessage}
                                                handlePinMessage={handlePinMessage}
                                                setShowReactionMenu={setShowReactionMenu}
                                                handleReactToMessage={handleReactToMessage}
                                                handleOpenReportModal={handleOpenReportModal}
                                                handleEditMessage={handleEditMessage}
                                                handleSaveEdit={handleSaveEdit}
                                                handleCancelEdit={handleCancelEdit}
                                                deleteForMe={deleteForMe}
                                                unsendEverywhere={unsendEverywhere}
                                                onImageClick={() => {
                                                    setLightboxImage({ url: msg.fileData, sender: msg.senderUsername, time: msg.time });
                                                    try {
                                                        setLightboxZoom(1); setLightboxRotation(0); setLightboxFilter('none');
                                                    } catch (e) { }
                                                }}
                                            />
                                        );
                                    })}
                                    <div ref={scrollRef} />
                                    <div ref={scrollRef} />
                                </div>

                                {/* Hiển thị Typing Indicator */}
                                {typingUsers.length > 0 && (
                                    <div className="px-6 py-2 text-xs italic font-semibold text-gray-400 flex items-center gap-2 animate-pulse">
                                        <div className="flex gap-1">
                                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                        </div>
                                        {typingUsers.map(u => `@${u}`).join(', ')} đang soạn tin nhắn...
                                    </div>
                                )}

                                {/* Offline/Sync Indicator */}
                                <OfflineIndicator
                                    isOnline={isOnline}
                                    pendingCount={pendingCount}
                                    syncStatus={syncStatus}
                                />

                                <ChatInput
                                    user={user}
                                    activeRoom={activeRoom}
                                    currentGroup={currentGroup}
                                    allGroups={allGroups}
                                    onlineUsers={onlineUsers}
                                    darkMode={darkMode}
                                    msgInput={msgInput}
                                    handleInputChange={handleInputChange}
                                    handleSendText={handleSendText}
                                    showEmojiPicker={showEmojiPicker}
                                    setShowEmojiPicker={setShowEmojiPicker}
                                    emojiPickerRef={emojiPickerRef}
                                    handleEmojiClick={handleEmojiClick}
                                    showStickerPicker={showStickerPicker}
                                    setShowStickerPicker={setShowStickerPicker}
                                    replyingToMessage={replyingToMessage}
                                    setReplyingToMessage={setReplyingToMessage}
                                    sharedE2EEKey={sharedE2EEKey}
                                    showMentionPopup={showMentionPopup}
                                    mentionSearchQuery={mentionSearchQuery}
                                    handleSelectMention={handleSelectMention}
                                    fileInputRef={fileInputRef}
                                    handleFileUpload={handleFileUpload}
                                    setShowPollModal={setShowPollModal}
                                    setShowEventModal={setShowEventModal}
                                    setShowPaintPad={setShowPaintPad}
                                    handleSendLocation={handleSendLocation}
                                    isRecording={isRecording}
                                    startRecording={startRecording}
                                    stopRecording={stopRecording}
                                    recordingTime={recordingTime}
                                    formatTime={formatTime}
                                />
                            </>
                        )}
                    </>
                )
                ) : (
                    <Home user={user} onlineUsers={onlineUsers} allGroups={allGroups} darkMode={darkMode} onSwitchTab={(tab) => {
                        if (tab === 'friends') setShowFriendsTab(true);
                        if (tab === 'discovery') setShowDiscoveryTab(true);
                        if (tab === 'social') setShowSocialFeed(true);
                        if (tab === 'todo') setShowTodoTab(true);
                        if (tab === 'callHistory') setShowCallHistoryTab(true);
                        if (tab === 'archived') setShowArchivedTab(true);
                        if (tab === 'ai') setShowAITab(true);
                        if (tab === 'cloudDrive') setShowCloudDriveTab(true);
                        if (tab === 'game') setShowGameCenter(true);
                        if (tab === 'admin' && user?.role === 'admin') setIsAdminMode(true);
                    }} />
                )}
            </div>

            {/* Cột 4 Right Sidebar */}
            {activeThread ? (
                <ThreadSidebar
                    activeThread={activeThread}
                    setActiveThread={setActiveThread}
                    messages={messages}
                    user={user}
                    activeRoom={activeRoom}
                    darkMode={darkMode}
                    socket={socket}
                />
            ) : (
                <RightSidebar
                    user={user}
                    onlineUsers={onlineUsers}
                    activeRoom={activeRoom}
                    allGroups={allGroups}
                    handleOpenProfile={handleOpenProfile}
                    handleStartDM={handleStartDM}
                    darkMode={darkMode}
                    isVisible={isRightSidebarVisible}
                    handleKick={handleKick}
                    handleToggleRole={handleToggleRole}
                    lastSeenMap={lastSeenMap}
                    mutedRooms={mutedRooms}
                    toggleMuteRoom={toggleMuteRoom}
                    toggleMuteRoomDuration={toggleMuteRoomDuration}
                    handleTogglePin={handleTogglePin}
                    handleToggleArchive={handleToggleArchive}
                    clearChatHistory={clearChatHistory}
                    handleExportChat={handleExportChat}
                    handleLeaveGroup={handleLeaveGroup}
                    setShowGroupSettings={setShowGroupSettings}
                    setShowInviteModal={setShowInviteModal}
                    setShowMediaGallery={setShowMediaGallery}
                    setShowWallpaperModal={setShowWallpaperModal}
                    handleVideoCall={handleVideoCall}
                    handleGroupVideoCall={handleGroupVideoCall}
                    isInGroupCall={isInGroupCall}
                    isCallBusy={isCallBusy}
                    setShowSearch={setShowSearch}
                    showSearch={showSearch}
                    messages={messages}
                    searchContent={searchContent}
                    setSearchContent={setSearchContent}
                    filterUser={filterUser}
                    setFilterUser={setFilterUser}
                    filterDate={filterDate}
                    setFilterDate={setFilterDate}
                    filterType={filterType}
                    setFilterType={setFilterType}
                    scrollToMessage={scrollToMessage}
                    onOpenReportViolation={() => setShowReportViolationModal(true)}
                />
            )}

            {/* Modals & Components phụ */}
            {showGlobalSearch && <GlobalSearch darkMode={darkMode} onClose={() => setShowGlobalSearch(false)} onSelectResult={handleSelectSearchResult} />}
            <AddFriendModal isOpen={showAddFriend} onClose={() => setShowAddFriend(false)} user={user} loadData={loadData} darkMode={darkMode} />

            {/* Context menu 3 chấm cho phòng chat */}
            <RoomContextMenu
                menu={activeRoomMenu}
                onClose={() => setActiveRoomMenu(null)}
                darkMode={darkMode}
                handleTogglePin={handleTogglePin}
                customFolders={customFolders}
                toggleRoomClassification={toggleRoomClassification}
                setEditingFolder={setEditingFolder}
                setFolderName={setFolderName}
                setFolderRooms={setFolderRooms}
                setShowFolderModal={setShowFolderModal}
                unreadCounts={unreadCounts}
                setUnreadCounts={setUnreadCounts}
                toggleMuteRoomDuration={toggleMuteRoomDuration}
                mutedRooms={mutedRooms}
                handleToggleArchive={handleToggleArchive}
                clearChatHistory={clearChatHistory}
            />

            {showStickerPicker && <div className="absolute bottom-24 left-6 z-50"><StickerPicker onSelect={handleSendSticker} darkMode={darkMode} onClose={() => setShowStickerPicker(false)} /></div>}
            {showMediaGallery && activeRoom && <MediaGallery roomId={activeRoom.id} darkMode={darkMode} onClose={() => setShowMediaGallery(false)} initialTab={typeof showMediaGallery === 'string' ? showMediaGallery : 'media'} onNavigateToMessage={(msgId) => { scrollToMessage(msgId); setShowMediaGallery(false); }} />}
            <CreateChat user={user} isOpen={showGroupCreator} onClose={() => setShowGroupCreator(false)} onCreateGroup={handleCreateGroup} darkMode={darkMode} isPublicMode={isPublicGroupCreator} />

            {/* Modal Báo Cáo Tin Nhắn Vi Phạm */}
            <ReportMessageModal
                isOpen={showReportModal}
                onClose={() => { setShowReportModal(false); setReportingMessage(null); }}
                reportingMessage={reportingMessage}
                darkMode={darkMode}
            />

            {/* Modal Báo Cáo Vi Phạm Chung từ Sidebar */}
            <ReportViolationModal
                isOpen={showReportViolationModal}
                onClose={() => setShowReportViolationModal(false)}
                activeRoom={activeRoom}
                allGroups={allGroups}
                user={user}
                darkMode={darkMode}
            />

            {/* Modal Tạo/Sửa Thư Mục Chat (Telegram Style) */}
            <FolderModal
                isOpen={showFolderModal}
                onClose={() => {
                    setShowFolderModal(false);
                    setEditingFolder(null);
                    setFolderName('');
                    setFolderRooms([]);
                    setModalSearch('');
                }}
                darkMode={darkMode}
                editingFolder={editingFolder}
                folderName={folderName}
                setFolderName={setFolderName}
                folderRooms={folderRooms}
                modalSearch={modalSearch}
                setModalSearch={setModalSearch}
                getRecentChatUsers={getRecentChatUsers}
                allGroups={allGroups}
                user={user}
                onlineUsers={onlineUsers}
                toggleRoomInFolder={toggleRoomInFolder}
                handleDeleteFolder={handleDeleteFolder}
                handleSaveFolder={handleSaveFolder}
            />
            {/* Modal Chọn Hình Nền Phòng Chat */}
            <WallpaperModal
                isOpen={showWallpaperModal}
                onClose={() => setShowWallpaperModal(false)}
                activeRoom={activeRoom}
                user={user}
                darkMode={darkMode}
                currentWallpaper={currentWallpaper}
                setCurrentWallpaper={setCurrentWallpaper}
                customWallpaperUrl={customWallpaperUrl}
                setCustomWallpaperUrl={setCustomWallpaperUrl}
            />

            {/* Modal Chuyển tiếp tin nhắn */}
            <ForwardMessageModal
                isOpen={!!forwardMessageData}
                onClose={() => { setForwardMessageData(null); }}
                darkMode={darkMode}
                user={user}
                allGroups={allGroups}
                handleForwardMessage={handleForwardMessage}
            />
            {/* Modal Tạo Bình Chọn */}
            <PollModal
                isOpen={showPollModal}
                onClose={() => setShowPollModal(false)}
                socket={socket}
                user={user}
                activeRoom={activeRoom}
                darkMode={darkMode}
            />
            {/* Modal Tạo Sự Kiện / Lịch */}
            <EventModal
                isOpen={showEventModal}
                onClose={() => setShowEventModal(false)}
                socket={socket}
                user={user}
                activeRoom={activeRoom}
                darkMode={darkMode}
            />

            {/* Group Settings Modal */}
            <GroupSettingsModal
                isOpen={showGroupSettings}
                onClose={() => setShowGroupSettings(false)}
                activeRoom={activeRoom}
                darkMode={darkMode}
                user={user}
                currentGroup={currentGroup}
                isAdminOfGroup={isAdminOfGroup}
                isModOfGroup={isModOfGroup}
                handleManageGroup={handleManageGroup}
                handleUpdateRole={handleUpdateRole}
                handleKick={handleKick}
                handleSwitchRoom={handleSwitchRoom}
                loadData={loadData}
            />
            {/* Image Lightbox & Studio */}
            <ImageLightbox
                previewImage={previewImage}
                setPreviewImage={setPreviewImage}
                lightboxImage={lightboxImage}
                setLightboxImage={setLightboxImage}
            />
            {/* Modal Mời thành viên */}
            <InviteMemberModal
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                activeRoom={activeRoom}
                user={user}
                allGroups={allGroups}
                onlineUsers={onlineUsers}
                darkMode={darkMode}
                loadData={loadData}
            />

            {/* Modal Cài Đặt Ứng Dụng (Giao diện, Nhạc chuông) */}
            <SoundSettingsModal
                isOpen={showSoundSettings}
                onClose={() => setShowSoundSettings(false)}
                darkMode={darkMode}
                setDarkMode={setDarkMode}
                playNotificationSound={playNotificationSound}
                onLogout={handleLogout}
            />

            {/* Canvas Paint Pad (Bảng vẽ phác thảo trực tuyến) */}
            <PaintPadModal
                isOpen={showPaintPad}
                onClose={() => setShowPaintPad(false)}
                darkMode={darkMode}
                onSendSketch={handleSendPaint}
            />

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
            <StoryUploadModal
                isOpen={showStoryUpload}
                onClose={() => setShowStoryUpload(false)}
                user={user}
            />
            {/* Todo List Modal */}
        </div>
    );
};
export default ChatPage;
