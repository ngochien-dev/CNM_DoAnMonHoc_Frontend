import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import api from '../services/api';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { 
    FaHashtag, FaPlusCircle, FaPaperPlane, FaSignOutAlt, FaCircle, 
    FaChevronLeft, FaChevronRight, FaChevronDown, FaFileAlt, FaTrash, FaUndo, FaBroom, FaShieldAlt, 
    FaChartBar, FaImage, FaSmile, FaMoon, FaSun, FaPalette,
    FaGlobe, FaCog, FaUserMinus, FaPauseCircle, FaPlayCircle, 
    FaUserFriends, FaCommentDots, FaUserPlus, FaTimes, FaUserCheck, FaLock, FaUsers, FaSearch,
    FaVideo, FaShare, FaThumbtack, FaPoll, FaCalendarAlt, FaReply, FaMicrophone, FaStopCircle, FaSmileBeam, FaEdit, FaExchangeAlt, FaTh, FaPlus, FaCamera, FaFolderPlus, FaLanguage, FaCloud, FaMapMarkerAlt, FaGamepad, FaCalendarCheck, FaPhoneAlt, FaArchive, FaRobot, FaFolderOpen
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
import ThreadSidebar from './chat/ThreadSidebar';
import CreateChat from './function/CreateChat';
import MessageSearch from './chat/MessageSearch';
import GlobalSearch from './chat/GlobalSearch';
import LinkPreview from './chat/LinkPreview';
import StickerPicker from './chat/StickerPicker';
import MediaGallery from './chat/MediaGallery';
import GameCenter from './games/GameCenter';
import TodoTab from './todo/TodoTab';
import CallHistoryTab from './calls/CallHistoryTab';
import ArchivedChatsTab from './chat/ArchivedChatsTab';
import AIAssistantsTab from './chat/AIAssistantsTab';
import CloudDriveTab from './chat/CloudDriveTab';

import useCall from '../context/useCall'; 
import { getSocket, connectSocket, disconnectSocket } from '../services/socket';
import { 
    generateE2EEKeyPair, 
    deriveSharedKey, 
    encryptText, 
    decryptText 
} from '../utils/crypto';

const E2EEDecryptor = ({ msg, sharedKey, isMe, searchQuery }) => {
    const [decryptedText, setDecryptedText] = useState(msg.isEncrypted ? "[Đang giải mã E2EE...]" : (msg.text || ''));

    useEffect(() => {
        if (!msg.isEncrypted) {
            setDecryptedText(msg.text || '');
            return;
        }

        if (!sharedKey) {
            setDecryptedText("[Tin nhắn mã hóa E2EE - Đối phương chưa online để đồng bộ khóa]");
            return;
        }

        let isMounted = true;
        const decrypt = async () => {
            try {
                const plain = await decryptText(msg.text, msg.iv, sharedKey);
                if (isMounted) setDecryptedText(plain);
            } catch (err) {
                if (isMounted) setDecryptedText("[Lỗi giải mã E2EE - Khóa không hợp lệ]");
            }
        };

        decrypt();
        return () => { isMounted = false; };
    }, [msg.text, msg.iv, msg.isEncrypted, sharedKey]);

    const emojiMap = { ':)': '😊', ':D': '😃', ':(': '😢', ';)': '😉', ':P': '😛', '<3': '❤️', ':o': '😮', 'B)': '😎', ':*': '😘', 'xD': '🤣', 'XD': '🤣', ':3': '😺', 'o_O': '😳', '-_-': '😑' };
    const urlRegex = /((?:https?:\/\/|www\.)[^\s]+|[a-zA-Z0-9.-]+\.(?:com|net|org|vn|edu|gov|io)[^\s]*)/g;
    const parts = decryptedText.split(urlRegex);

    return (
        <>
            {parts.map((part, i) => {
                if (urlRegex.test(part)) {
                    urlRegex.lastIndex = 0;
                    return (
                        <a 
                            key={i} 
                            href={part} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className={`underline font-bold break-all ${isMe ? 'text-blue-200 hover:text-white' : 'text-indigo-400 hover:text-indigo-300'}`}
                        >
                            {part.length > 60 ? part.substring(0, 57) + '...' : part}
                        </a>
                    );
                }
                let converted = part;
                Object.entries(emojiMap).forEach(([code, emoji]) => {
                    converted = converted.split(code).join(emoji);
                });
                
                // Tag Mention formatting
                const mentionRegex = /(@[a-zA-Z0-9_]+)/g;
                const textParts = converted.split(mentionRegex);
                return (
                    <span key={i}>
                        {textParts.map((tPart, j) => {
                            if (mentionRegex.test(tPart)) {
                                mentionRegex.lastIndex = 0; // reset
                                return (
                                    <span 
                                        key={j} 
                                        className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-extrabold cursor-pointer hover:bg-indigo-500 hover:text-white transition-all shadow-sm mx-0.5"
                                        title={`Thành viên: ${tPart}`}
                                    >
                                        {tPart}
                                    </span>
                                );
                            }
                            
                            // Highlight text matching search query (glowing yellow highlight)
                            if (searchQuery && searchQuery.trim().length >= 2 && tPart.toLowerCase().includes(searchQuery.toLowerCase())) {
                                const highlightRegex = new RegExp(`(${searchQuery.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')})`, 'gi');
                                const subParts = tPart.split(highlightRegex);
                                return (
                                    <span key={j}>
                                        {subParts.map((subPart, k) => {
                                            if (highlightRegex.test(subPart)) {
                                                highlightRegex.lastIndex = 0;
                                                return <mark key={k} className="bg-yellow-350 dark:bg-yellow-400 text-black px-0.5 rounded font-black shadow-sm animate-pulse">{subPart}</mark>;
                                            }
                                            return subPart;
                                        })}
                                    </span>
                                );
                            }
                            return tPart;
                        })}
                    </span>
                );
            })}
        </>
    );
};

const WaveformVoicePlayer = ({ src, darkMode }) => {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);

    // Generate consistent visual peaks based on the audio source string
    const peaks = useMemo(() => {
        let hash = 0;
        for (let i = 0; i < src.length; i++) {
            hash = src.charCodeAt(i) + ((hash << 5) - hash);
        }
        const generatedPeaks = [];
        for (let i = 0; i < 28; i++) {
            const peakHeight = Math.abs(Math.sin(hash + i) * 20) + 6; // Height between 6px and 26px
            generatedPeaks.push(peakHeight);
        }
        return generatedPeaks;
    }, [src]);

    useEffect(() => {
        const audio = new Audio(src);
        audioRef.current = audio;

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleLoadedMetadata = () => setDuration(audio.duration || 0);
        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
            audio.currentTime = 0;
        };

        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);

        // Preload metadata
        audio.load();

        return () => {
            audio.pause();
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [src]);

    const togglePlaybackRate = () => {
        let nextRate = 1;
        if (playbackRate === 1) nextRate = 1.5;
        else if (playbackRate === 1.5) nextRate = 2;
        
        setPlaybackRate(nextRate);
        if (audioRef.current) {
            audioRef.current.playbackRate = nextRate;
        }
    };

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.playbackRate = playbackRate;
            audioRef.current.play().catch(err => console.log("Audio play error", err));
        }
    };

    const handleWaveformClick = (e) => {
        if (!audioRef.current || duration === 0) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickPercent = Math.max(0, Math.min(1, clickX / rect.width));
        audioRef.current.currentTime = clickPercent * duration;
        setCurrentTime(clickPercent * duration);
    };

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    const formatTime = (time) => {
        if (isNaN(time)) return '0:00';
        const m = Math.floor(time / 60);
        const s = Math.floor(time % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className={`p-3 rounded-2xl flex items-center gap-3 border transition-all ${
            darkMode 
                ? 'bg-slate-900/50 border-white/5 text-slate-100' 
                : 'bg-slate-50 border-slate-200 text-slate-700'
        } max-w-[280px]`}>
            {/* Play/Pause Button */}
            <button 
                onClick={togglePlay}
                className="w-9 h-9 rounded-full bg-indigo-500 hover:bg-indigo-600 flex items-center justify-center text-white transition-all shadow-md active:scale-95 shrink-0"
            >
                {isPlaying ? <FaPauseCircle size={18}/> : <FaPlayCircle size={18} className="translate-x-[1px]"/>}
            </button>

            {/* Waveform visual bars */}
            <div className="flex flex-col flex-1 min-w-0">
                <div 
                    className="flex items-end gap-[3px] h-7 cursor-pointer relative"
                    onClick={handleWaveformClick}
                >
                    {peaks.map((height, idx) => {
                        const barPercent = (idx / peaks.length) * 100;
                        const isActive = progressPercent >= barPercent;
                        return (
                            <div 
                                key={idx}
                                style={{ height: `${height}px` }}
                                className={`w-[3px] rounded-full transition-all duration-150 ${
                                    isActive 
                                        ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' 
                                        : (darkMode ? 'bg-white/10' : 'bg-slate-300')
                                }`}
                            />
                        );
                    })}
                </div>
                {/* Time Indicator */}
                <div className="flex justify-between items-center text-[10px] text-gray-500 mt-1 font-bold">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {/* Playback speed trigger */}
            <button 
                onClick={togglePlaybackRate}
                className={`px-2 py-1 rounded-lg text-[10px] font-black tracking-wider transition-all active:scale-95 uppercase shrink-0 ${
                    playbackRate > 1 
                        ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' 
                        : (darkMode ? 'bg-white/5 border border-white/5 text-gray-400' : 'bg-slate-200 border border-slate-200 text-slate-500')
                }`}
                title="Tốc độ phát âm thanh"
            >
                {playbackRate}x
            </button>
        </div>
    );
};

const ChatPage = ({ user, setUser }) => {
    const socket = getSocket();
    const [msgInput, setMsgInput] = useState('');
    const [messages, setMessages] = useState([]); 
    const [onlineUsers, setOnlineUsers] = useState({});
    const [allGroups, setAllGroups] = useState([]);
    const [activeRoom, setActiveRoom] = useState(null); 
    const isCloudActive = activeRoom?.id === `dm_${user?.username}_${user?.username}`;
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
    const [showSocialFeed, setShowSocialFeed] = useState(false);
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [showGlobalSearch, setShowGlobalSearch] = useState(false);
    const [searchContent, setSearchContent] = useState('');
    const [filterUser, setFilterUser] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [isRightSidebarVisible, setIsRightSidebarVisible] = useState(true);
    const [activeThread, setActiveThread] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showGroupCreator, setShowGroupCreator] = useState(false);
    const [showGroupSettings, setShowGroupSettings] = useState(false);
    const [showStickerPicker, setShowStickerPicker] = useState(false);
    const [profileModal, setProfileModal] = useState({ isOpen: false, username: '' });
    const [forwardMessageData, setForwardMessageData] = useState(null); // Lưu tin nhắn cần forward
    const [forwardSearchQuery, setForwardSearchQuery] = useState('');
    const [showPollModal, setShowPollModal] = useState(false);
    const [showEventModal, setShowEventModal] = useState(false);
    const [stats, setStats] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [lightboxImage, setLightboxImage] = useState(null); // { url, sender, time }
    const [lightboxZoom, setLightboxZoom] = useState(1);
    const [lightboxRotation, setLightboxRotation] = useState(0);
    const [lightboxFilter, setLightboxFilter] = useState('none');
    const [translatedMessages, setTranslatedMessages] = useState({});
    const [translatingMessageId, setTranslatingMessageId] = useState(null);
    
    // Canvas Paint Pad & Custom Sound State
    const [showPaintPad, setShowPaintPad] = useState(false);
    const [paintColor, setPaintColor] = useState('#6366f1');
    const [paintBrushSize, setPaintBrushSize] = useState(5);
    const [isDrawing, setIsDrawing] = useState(false);
    const [showSoundSettings, setShowSoundSettings] = useState(false);
    const [notificationSound, setNotificationSound] = useState(localStorage.getItem('alertSound') || 'telegram');

    const paintCanvasRef = useRef(null);
    const lastX = useRef(0);
    const lastY = useRef(0);
    const [showMediaGallery, setShowMediaGallery] = useState(false);
    const [mutedRooms, setMutedRooms] = useState(() => {
        try { return JSON.parse(localStorage.getItem('mutedRooms') || '{}'); } catch { return {}; }
    }); // P1: Mute notifications per room
    const [showInviteModal, setShowInviteModal] = useState(false); // P1: Invite to group modal
    const [lastSeenMap, setLastSeenMap] = useState({}); // P1: Last seen timestamps
    const [activeSidebarTab, setActiveSidebarTab] = useState('all'); // Folders: all, personal, groups, unread
    const [selfDestructTimer, setSelfDestructTimer] = useState(0); // 0 = disabled, else seconds
    const [isSecretMode, setIsSecretMode] = useState(false); // P2: Secret Chat (no server logs)
    const [secretChatStatus, setSecretChatStatus] = useState('idle'); // 'idle' | 'waiting' | 'requested' | 'established'
    const [secretChatRequester, setSecretChatRequester] = useState(null);
    const [showSelfDestructMenu, setShowSelfDestructMenu] = useState(false); 
    const [viewingStories, setViewingStories] = useState(null); // { username, stories, allGroupedStories }
    const [showStoryUpload, setShowStoryUpload] = useState(false);
    const [storyForm, setStoryForm] = useState({ mediaData: '', caption: '' });
    
    // Custom Chat Wallpapers (Hình nền phòng chat)
    const [showWallpaperModal, setShowWallpaperModal] = useState(false);
    const [currentWallpaper, setCurrentWallpaper] = useState('');
    const [customWallpaperUrl, setCustomWallpaperUrl] = useState('');
    
    // Message Moderation states
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportingMessage, setReportingMessage] = useState(null);
    const [reportReason, setReportReason] = useState('Abuse');

    // Rich Chat, Mention, and Audio states
    const [activePinIndex, setActivePinIndex] = useState(0);
    const [isPinListExpanded, setIsPinListExpanded] = useState(false);
    const [showMentionPopup, setShowMentionPopup] = useState(false);
    const [mentionSearchQuery, setMentionSearchQuery] = useState('');

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

    const groupFileRef = useRef(null);

    const handleGroupAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = async () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 200;
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const base64Avatar = canvas.toDataURL('image/jpeg', 0.8);
                
                try {
                    await api.post('/groups/update-avatar', { 
                        groupId: activeRoom.id, 
                        avatar: base64Avatar 
                    });
                    toast.success("Cập nhật ảnh nhóm thành công!");
                    loadData(); // Tải lại toàn bộ nhóm để đồng bộ giao diện
                } catch (err) {
                    toast.error(err.response?.data?.error || "Lỗi cập nhật ảnh nhóm!");
                }
            };
        };
    };

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
    const [drafts, setDrafts] = useState(() => {
        try {
            const saved = localStorage.getItem(`ott_drafts_${user?.username}`);
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    });

    useEffect(() => {
        if (user?.username) {
            localStorage.setItem(`ott_drafts_${user.username}`, JSON.stringify(drafts));
        }
    }, [drafts, user?.username]);

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

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingTimerRef = useRef(null);

    const [sharedE2EEKey, setSharedE2EEKey] = useState(null);

    // Initialize E2EE Keys for the logged-in user
    useEffect(() => {
        if (!user?.username) return;

        const initUserE2EE = async () => {
            const storageKey = `e2ee_private_key_${user.username}`;
            let ownPrivateKeyJwk = localStorage.getItem(storageKey);

            if (!ownPrivateKeyJwk) {
                console.log("Generating E2EE key pair for", user.username);
                try {
                    const { publicKeyJwk, privateKeyJwk } = await generateE2EEKeyPair();
                    localStorage.setItem(storageKey, JSON.stringify(privateKeyJwk));
                    // Upload public key to DynamoDB
                    await api.post('/users/update-e2ee-key', {
                        username: user.username,
                        e2eePublicKey: publicKeyJwk
                    });
                    toast.success("Đã kích hoạt Mã hóa Đầu cuối (E2EE) thành công!");
                } catch (err) {
                    console.error("Failed to initialize E2EE keys:", err);
                }
            } else {
                // If server is missing the public key, re-upload it derived from our local private key
                if (!user.e2eePublicKey) {
                    try {
                        const ownPrivKeyParsed = JSON.parse(ownPrivateKeyJwk);
                        const { d, ...publicKeyJwk } = ownPrivKeyParsed;
                        publicKeyJwk.key_ops = []; // Public key has no private ops
                        await api.post('/users/update-e2ee-key', {
                            username: user.username,
                            e2eePublicKey: publicKeyJwk
                        });
                        console.log("Re-uploaded E2EE public key to server");
                    } catch (err) {
                        console.error("Failed to re-upload E2EE public key:", err);
                    }
                }
            }
        };

        initUserE2EE();
    }, [user?.username, user?.e2eePublicKey]);

    // Derive Shared E2EE Key when switching rooms
    useEffect(() => {
        if (!user?.username || !activeRoom || !activeRoom.id?.startsWith('dm_')) {
            setSharedE2EEKey(null);
            return;
        }

        const deriveKey = async () => {
            try {
                const peerUsername = activeRoom.name;
                const res = await api.get(`/users/${peerUsername}`);
                const peerPubKey = res.data.e2eePublicKey;

                if (peerPubKey) {
                    const storageKey = `e2ee_private_key_${user.username}`;
                    const ownPrivateKeyJwk = localStorage.getItem(storageKey);
                    if (ownPrivateKeyJwk) {
                        const sharedKey = await deriveSharedKey(JSON.parse(ownPrivateKeyJwk), peerPubKey);
                        setSharedE2EEKey(sharedKey);
                        console.log("Derived E2EE shared key with", peerUsername);
                    }
                } else {
                    setSharedE2EEKey(null);
                    console.log("Peer has no E2EE public key");
                }
            } catch (err) {
                console.error("Failed to derive shared E2EE key:", err);
                setSharedE2EEKey(null);
            }
        };

        deriveKey();
    }, [activeRoom, user?.username]);

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
    const startDrawing = (e) => {
        const canvas = paintCanvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        lastX.current = e.clientX - rect.left;
        lastY.current = e.clientY - rect.top;
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const canvas = paintCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        ctx.beginPath();
        ctx.strokeStyle = paintColor;
        ctx.lineWidth = paintBrushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(lastX.current, lastY.current);
        ctx.lineTo(x, y);
        ctx.stroke();
        
        lastX.current = x;
        lastY.current = y;
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearPaintCanvas = () => {
        const canvas = paintCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = darkMode ? '#1e293b' : '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const handleSendPaint = () => {
        const canvas = paintCanvasRef.current;
        if (!canvas) return;
        const dataUrl = canvas.toDataURL('image/png');
        
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

    useEffect(() => {
        if (showPaintPad) {
            setTimeout(() => {
                clearPaintCanvas();
            }, 100);
        }
    }, [showPaintPad]);

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

    const handleOpenReportModal = (msg) => {
        setReportingMessage(msg);
        setReportReason('Abuse');
        setShowReportModal(true);
    };

    const handleSubmitReport = async () => {
        if (!reportingMessage) return;
        try {
            await api.post('/v1/messages/report', {
                messageId: reportingMessage.messageId,
                reason: reportReason
            });
            toast.success('Báo cáo tin nhắn thành công! Đang chờ Admin xử lý.', {
                icon: '🛡️',
                style: { borderRadius: '12px', background: '#333', color: '#fff' }
            });
            setShowReportModal(false);
            setReportingMessage(null);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Không thể gửi báo cáo tin nhắn');
        }
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
            setDrafts(prev => {
                const nextDrafts = { ...prev };
                if (msgInput.trim()) {
                    nextDrafts[activeRoom.id] = msgInput;
                } else {
                    delete nextDrafts[activeRoom.id];
                }
                return nextDrafts;
            });
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
        setIsAdminMode(false); 
        setShowSearch(false);
        setShowGlobalSearch(false);
        setReplyingToMessage(null);
        setShowReactionMenu(null);
        setIsSecretMode(false); // Reset secret mode on room switch
        setSecretChatStatus('idle');
        setSecretChatRequester(null);
        setShowSelfDestructMenu(false);
        if (room) {
            setUnreadCounts(prev => ({ ...prev, [room.id]: 0 }));
            // P0: Load messages for the new room (pagination)
            loadRoomMessages(room.id);
            // RESTORE DRAFT FOR THE NEW ROOM
            setMsgInput(drafts[room.id] || '');
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
                  margin:       15,
                  filename:     `chat_backup_${activeRoom.id}_${new Date().toISOString().split('T')[0]}.pdf`,
                  image:        { type: 'jpeg', quality: 0.98 },
                  html2canvas:  { scale: 2 },
                  jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
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
        if (selfDestructTimer > 0) {
            payload.expiresAt = Date.now() + (selfDestructTimer * 1000);
            payload.ttl = Math.floor(payload.expiresAt / 1000); // DynamoDB TTL
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
        socket.emit('send_message', payload);
        
        setMsgInput(''); setShowEmojiPicker(false);
        setReplyingToMessage(null);

        // CLEAR DRAFT ON MESSAGE SEND
        if (activeRoom?.id) {
            setDrafts(prev => {
                const nextDrafts = { ...prev };
                delete nextDrafts[activeRoom.id];
                return nextDrafts;
            });
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
            if (selfDestructTimer > 0) {
                payload.expiresAt = Date.now() + (selfDestructTimer * 1000);
                payload.ttl = Math.floor(payload.expiresAt / 1000);
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
            setDrafts(prev => {
                const nextDrafts = { ...prev };
                if (val.trim()) {
                    nextDrafts[activeRoom.id] = val;
                } else {
                    delete nextDrafts[activeRoom.id];
                }
                return nextDrafts;
            });
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
                setDrafts(prev => {
                    const nextDrafts = { ...prev };
                    nextDrafts[activeRoom.id] = nextVal;
                    return nextDrafts;
                });
            }
        }
    };

    const handleEmojiClick = (emojiData) => {
        const newVal = msgInput + emojiData.emoji;
        setMsgInput(newVal);

        // SAVE DRAFT IN REAL TIME ON EMOJI SELECT
        if (activeRoom?.id) {
            setDrafts(prev => {
                const nextDrafts = { ...prev };
                nextDrafts[activeRoom.id] = newVal;
                return nextDrafts;
            });
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
            const container = chatContainerRef.current;
            let isCloseToBottom = false;
            if (container) {
                const threshold = 180; // px
                isCloseToBottom = container.scrollHeight - container.clientHeight - container.scrollTop < threshold;
            }

            setMessages(p => {
                if (p.some(msg => msg.messageId === d.messageId)) return p;
                return [...p, d];
            });

            const currentActiveRoom = activeRoomRef.current;
            
            // Tự động cuộn xuống chỉ khi ta tự gửi tin HOẶC đang đứng ở dưới đáy chat đọc tin mới
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
                // Emit delivery receipt immediately
                socket.emit('messages_delivered', { messageIds: [d.messageId], roomId: d.roomId });

                // Mention check
                const isMentioned = d.text && d.text.includes(`@${user.username}`);
                if (isMentioned) {
                    toast(`Bạn đã được nhắc đến bởi @${d.senderUsername} trong nhóm!`, {
                        icon: '🔔',
                        style: { borderRadius: '12px', background: '#ec4899', color: '#fff', fontWeight: 'bold' },
                        duration: 5000
                    });
                    if (window.Notification && Notification.permission === 'granted') {
                        new Notification('Bạn đã được nhắc đến!', {
                            body: `@${d.senderUsername}: ${d.text}`
                        });
                    }
                }

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
        socket.on('message_pinned', ({ messageId, isPinned }) => {
            setMessages(prev => prev.map(m => m.messageId === messageId ? { ...m, isPinned } : m));
        });
        socket.on('message_edited', ({ messageId, newText, iv, isEdited, editedAt }) => {
            setMessages(prev => prev.map(m => m.messageId === messageId ? { ...m, text: newText, iv: iv || m.iv, isEdited, editedAt } : m));
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

        // P0: Delivery receipts — update deliveredTo when others receive messages
        socket.on('messages_delivered_bulk_update', ({ deliveree, roomId, updates }) => {
            if (deliveree === user.username) return; // Skip own deliveries
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
                toast(`Có lời mời kết bạn từ ${fromUser}`, {
                    icon: '👋',
                    style: { borderRadius: '10px', background: '#333', color: '#fff' }
                });
            }
        });

        socket.on('secret_chat_request', ({ roomId, requester }) => {
            const currentActiveRoom = activeRoomRef.current;
            if (currentActiveRoom && roomId === currentActiveRoom.id) {
                setSecretChatStatus('requested');
                setSecretChatRequester(requester);
            }
            toast(`@${requester} mời bạn tham gia chat bí mật!`, {
                icon: '🔒',
                style: { borderRadius: '10px', background: '#e11d48', color: '#fff' }
            });
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
                toast(`Cuộc trò chuyện bí mật đã bị đóng bởi @${sender}.`, {
                    icon: '🔒',
                    style: { borderRadius: '10px', background: '#333', color: '#fff' }
                });
            }
        });

        socket.on('force_logout', ({ username, reason, sessionId }) => {
            if (username === user.username) {
                const currentSess = JSON.parse(localStorage.getItem('user_session') || '{}');
                if (reason === 'remote_logout' && sessionId && currentSess?.sessionId !== sessionId) {
                    return; // Ignore, it was another device's session
                }

                disconnectSocket();
                localStorage.removeItem('user_session');
                setUser(null);
                if (reason === 'banned') {
                    alert('Tài khoản của bạn đã bị khóa bởi Admin!');
                } else if (reason === 'password_reset') {
                    alert('Mật khẩu của bạn đã được đặt lại bởi Admin. Vui lòng đăng nhập lại!');
                } else if (reason === 'password_changed') {
                    alert('Mật khẩu của bạn đã được thay đổi. Vui lòng đăng nhập lại!');
                } else if (reason === 'remote_logout') {
                    alert('Thiết bị này đã bị đăng xuất khỏi tài khoản của bạn từ xa!');
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
    }, [user?.username]);

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
            {/* Cột 1 & 2 giữ nguyên theo style File A của bạn */}
            <div className={`w-[72px] hidden sm:flex flex-col items-center py-3 space-y-4 shrink-0 shadow-inner z-20 ${darkMode ? 'bg-[#020617]' : 'bg-white border-r border-gray-200 shadow-sm'}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black cursor-pointer hover:rounded-xl transition-all shadow-md ${(!activeRoom && !showFriendsTab && !showDiscoveryTab && !showSocialFeed && !showTodoTab && !showCallHistoryTab && !showArchivedTab && !showAITab && !showCloudDriveTab && !isAdminMode) ? 'bg-indigo-600 scale-110 shadow-indigo-500/50' : 'bg-gradient-to-tr from-indigo-500 to-purple-600 opacity-60 hover:opacity-100'}`} onClick={() => { handleSwitchRoom(null); setShowTodoTab(false); setShowCallHistoryTab(false); setShowArchivedTab(false); setShowAITab(false); setShowCloudDriveTab(false); }}>OTT</div>
                <div onClick={() => {setShowFriendsTab(true); setShowDiscoveryTab(false); setIsAdminMode(false); setActiveRoom(null); setShowSocialFeed(false); setShowTodoTab(false); setShowCallHistoryTab(false); setShowArchivedTab(false); setShowAITab(false); setShowCloudDriveTab(false);}} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all relative ${showFriendsTab ? 'bg-[#5865f2] text-white shadow-lg' : 'bg-white/5 text-gray-500 hover:bg-[#5865f2] hover:text-white'}`}><FaUserFriends size={22}/>{user.friendRequests?.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#1e1f22] font-black animate-bounce">{user.friendRequests.length}</span>}</div>
                <div onClick={() => {setShowDiscoveryTab(true); setShowFriendsTab(false); setShowSocialFeed(false); setShowGameCenter(false); setIsAdminMode(false); setActiveRoom(null); setShowTodoTab(false); setShowCallHistoryTab(false); setShowArchivedTab(false); setShowAITab(false); setShowCloudDriveTab(false);}} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all relative ${showDiscoveryTab ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white/5 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}><FaGlobe size={22}/></div>
                <div onClick={() => {setShowSocialFeed(true); setShowFriendsTab(false); setShowDiscoveryTab(false); setShowGameCenter(false); setIsAdminMode(false); setActiveRoom(null); setShowTodoTab(false); setShowCallHistoryTab(false); setShowArchivedTab(false); setShowAITab(false); setShowCloudDriveTab(false);}} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all relative ${showSocialFeed ? 'bg-purple-500 text-white shadow-lg' : 'bg-white/5 text-purple-500 hover:bg-purple-500 hover:text-white'}`} title="Bảng tin"><FaSmileBeam size={22}/></div>
                <div onClick={() => {setShowGameCenter(true); setShowSocialFeed(false); setShowFriendsTab(false); setShowDiscoveryTab(false); setIsAdminMode(false); setActiveRoom(null); setShowCallHistoryTab(false); setShowArchivedTab(false); setShowAITab(false); setShowCloudDriveTab(false);}} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all relative ${showGameCenter ? 'bg-pink-500 text-white shadow-lg' : 'bg-white/5 text-pink-500 hover:bg-pink-500 hover:text-white'}`} title="Game Center"><FaGamepad size={22}/></div>
                <div onClick={() => {setShowAITab(true); setShowArchivedTab(false); setShowCallHistoryTab(false); setShowTodoTab(false); setShowFriendsTab(false); setShowDiscoveryTab(false); setShowSocialFeed(false); setShowGameCenter(false); setIsAdminMode(false); setActiveRoom(null); setShowCloudDriveTab(false);}} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all relative ${showAITab ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 text-indigo-400 hover:bg-indigo-600 hover:text-white'}`} title="Trợ lý ảo AI"><FaRobot size={22}/></div>
                <div onClick={() => {handleStartDM(user.username); setShowFriendsTab(false); setShowDiscoveryTab(false); setShowSocialFeed(false); setShowGameCenter(false); setIsAdminMode(false); setShowTodoTab(false); setShowCallHistoryTab(false); setShowArchivedTab(false); setShowAITab(false); setShowCloudDriveTab(false);}} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all relative ${isCloudActive ? 'bg-cyan-500 text-white shadow-lg' : 'bg-white/5 text-cyan-400 hover:bg-cyan-500 hover:text-white'}`} title="Cloud của tôi"><FaCloud size={22}/></div>
                <div onClick={() => {setShowCloudDriveTab(true); setShowAITab(false); setShowArchivedTab(false); setShowCallHistoryTab(false); setShowTodoTab(false); setShowFriendsTab(false); setShowDiscoveryTab(false); setShowSocialFeed(false); setShowGameCenter(false); setIsAdminMode(false); setActiveRoom(null);}} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all relative ${showCloudDriveTab ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'bg-white/5 text-cyan-400 hover:bg-cyan-500 hover:text-white'}`} title="Kho tài liệu & Quản lý File"><FaFolderOpen size={20}/></div>
                <div onClick={() => {setShowTodoTab(true); setShowFriendsTab(false); setShowDiscoveryTab(false); setShowSocialFeed(false); setShowGameCenter(false); setIsAdminMode(false); setActiveRoom(null); setShowCallHistoryTab(false); setShowArchivedTab(false); setShowAITab(false); setShowCloudDriveTab(false);}} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all relative ${showTodoTab ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white/5 text-indigo-400 hover:bg-indigo-500 hover:text-white'}`} title="Lịch nhắc việc"><FaCalendarCheck size={22}/></div>
                <div onClick={() => {setShowCallHistoryTab(true); setShowTodoTab(false); setShowFriendsTab(false); setShowDiscoveryTab(false); setShowSocialFeed(false); setShowGameCenter(false); setIsAdminMode(false); setActiveRoom(null); setShowArchivedTab(false); setShowAITab(false); setShowCloudDriveTab(false);}} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all relative ${showCallHistoryTab ? 'bg-cyan-500 text-white shadow-lg' : 'bg-white/5 text-cyan-400 hover:bg-cyan-500 hover:text-white'}`} title="Nhật ký cuộc gọi"><FaPhoneAlt size={22}/></div>
                <div onClick={() => {setShowArchivedTab(true); setShowCallHistoryTab(false); setShowTodoTab(false); setShowFriendsTab(false); setShowDiscoveryTab(false); setShowSocialFeed(false); setShowGameCenter(false); setIsAdminMode(false); setActiveRoom(null); setShowAITab(false); setShowCloudDriveTab(false);}} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all relative ${showArchivedTab ? 'bg-amber-500 text-white shadow-lg' : 'bg-white/5 text-amber-500 hover:bg-amber-500 hover:text-white'}`} title="Hội thoại lưu trữ"><FaArchive size={20}/></div>
                <div className="w-8 h-[2px] bg-gray-600 rounded-full opacity-20"></div>
                <div onClick={() => { localStorage.setItem('theme', !darkMode ? 'dark' : 'light'); setDarkMode(!darkMode); }} className="w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer bg-white/10 hover:bg-white/20 transition-all">{darkMode ? <FaSun className="text-yellow-400"/> : <FaMoon/>}</div>
                <div onClick={() => setShowSoundSettings(true)} className="w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer bg-white/10 hover:bg-white/20 transition-all text-indigo-400 hover:text-white" title="Cài đặt nhạc chuông"><FaCog size={20}/></div>
                {user.role === 'admin' && (<div onClick={() => { setIsAdminMode(!isAdminMode); setShowFriendsTab(false); setShowDiscoveryTab(false); setShowTodoTab(false); setShowCallHistoryTab(false); setShowArchivedTab(false); setShowAITab(false); setShowCloudDriveTab(false); setShowSocialFeed(false); setActiveRoom(null); if(!isAdminMode) api.get('/admin/stats').then(res => setStats(res.data)); }} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all ${isAdminMode ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-red-500 shadow-lg'}`}><FaShieldAlt size={22} /></div>)}
                <div onClick={() => setShowGroupCreator(true)} className="w-12 h-12 bg-[#23a559] text-white rounded-2xl flex items-center justify-center cursor-pointer hover:rounded-xl transition-all shadow-md group relative"><FaPlusCircle size={22}/></div>
            </div>

            <div className={`flex flex-col border-r transition-all duration-300 ${isSidebarVisible ? 'w-60 md:w-72' : 'w-0 overflow-hidden'} ${darkMode ? 'bg-[#1e293b]/50 backdrop-blur-xl border-white/5' : 'bg-slate-50 border-gray-200'}`}>
                <div className={`h-12 px-4 flex items-center border-b font-black uppercase text-[11px] tracking-widest opacity-60 italic ${darkMode ? 'border-white/5 text-indigo-400' : 'border-gray-200 text-indigo-600'}`}>OTT Community</div>
                
                {/* Active Folder/Filter Selector Dropdown */}
                <div className={`relative px-4 py-2.5 border-b shrink-0 flex items-center justify-between z-30 ${darkMode ? 'border-white/5 bg-white/2' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="relative flex-1">
                        <button
                            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 border ${
                                darkMode 
                                    ? 'bg-black/30 border-white/10 hover:border-indigo-500/50 text-indigo-400' 
                                    : 'bg-white border-gray-200 hover:border-indigo-600/50 text-indigo-600 shadow-sm'
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                {activeSidebarTab === 'all' && "💬 Tất cả trò chuyện"}
                                {activeSidebarTab === 'personal' && "👤 Chat cá nhân"}
                                {activeSidebarTab === 'groups' && "👥 Nhóm trò chuyện"}
                                {activeSidebarTab === 'unread' && "🔴 Tin nhắn chưa đọc"}
                                {activeSidebarTab.startsWith('folder_') && `📁 Thư mục: ${customFolders.find(f => f.id === activeSidebarTab)?.name || ''}`}
                            </span>
                            <FaChevronDown size={8} className={`transition-transform duration-300 ${showFilterDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Floating Glassmorphic Dropdown List */}
                        {showFilterDropdown && (
                            <>
                                {/* Overlay backdrop to close dropdown */}
                                <div className="fixed inset-0 z-40" onClick={() => setShowFilterDropdown(false)}></div>
                                
                                <div className={`absolute top-full left-0 right-0 mt-1.5 rounded-2xl shadow-2xl border p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200 ${
                                    darkMode ? 'bg-[#0f172a]/95 backdrop-blur-xl border-white/10 text-white' : 'bg-white border-gray-200 text-slate-800'
                                }`}>
                                    <div className="space-y-0.5">
                                        {[
                                            { id: 'all', label: 'Tất cả trò chuyện', icon: "💬" },
                                            { id: 'personal', label: 'Chat cá nhân', icon: "👤" },
                                            { id: 'groups', label: 'Nhóm trò chuyện', icon: "👥" },
                                            { id: 'unread', label: 'Tin nhắn chưa đọc', icon: "🔴" }
                                        ].map(item => (
                                            <button
                                                key={item.id}
                                                onClick={() => {
                                                    setActiveSidebarTab(item.id);
                                                    setShowFilterDropdown(false);
                                                }}
                                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-[11px] font-bold transition-all ${
                                                    activeSidebarTab === item.id 
                                                        ? (darkMode ? 'bg-indigo-500/20 text-indigo-400 font-extrabold' : 'bg-indigo-50 text-indigo-600 font-extrabold')
                                                        : (darkMode ? 'hover:bg-white/5 text-gray-300' : 'hover:bg-slate-100 text-slate-700')
                                                }`}
                                            >
                                                <span>{item.icon} &nbsp;{item.label}</span>
                                            </button>
                                        ))}

                                        {/* Divider */}
                                        <div className={`my-1.5 border-t ${darkMode ? 'border-white/5' : 'border-gray-100'}`}></div>

                                        {/* Custom Folders Section */}
                                        {customFolders.length > 0 && (
                                            <div className="max-h-40 overflow-y-auto space-y-0.5 pr-1 scrollbar-hide">
                                                {customFolders.map(folder => (
                                                    <div 
                                                        key={folder.id}
                                                        className="group flex items-center justify-between gap-1"
                                                    >
                                                        <button
                                                            onClick={() => {
                                                                setActiveSidebarTab(folder.id);
                                                                setShowFilterDropdown(false);
                                                            }}
                                                            className={`flex-1 flex items-center px-3 py-2 rounded-xl text-left text-[11px] font-bold transition-all ${
                                                                activeSidebarTab === folder.id
                                                                    ? (darkMode ? 'bg-indigo-500/20 text-indigo-400 font-extrabold' : 'bg-indigo-50 text-indigo-600 font-extrabold')
                                                                    : (darkMode ? 'hover:bg-white/5 text-gray-300' : 'hover:bg-slate-100 text-slate-700')
                                                            }`}
                                                        >
                                                            📁 &nbsp;{folder.name}
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingFolder(folder);
                                                                setFolderName(folder.name);
                                                                setFolderRooms(folder.roomIds);
                                                                setShowFolderModal(true);
                                                                setShowFilterDropdown(false);
                                                            }}
                                                            className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 ${
                                                                darkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                                                            }`}
                                                            title="Sửa thư mục"
                                                        >
                                                            <FaCog size={10} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Create Folder Option */}
                                        <button
                                            onClick={() => {
                                                setEditingFolder(null);
                                                setFolderName('');
                                                setFolderRooms([]);
                                                setShowFolderModal(true);
                                                setShowFilterDropdown(false);
                                            }}
                                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-[10px] font-black uppercase tracking-wider transition-all ${
                                                darkMode ? 'text-indigo-400 hover:bg-indigo-500/10' : 'text-indigo-600 hover:bg-indigo-50'
                                            }`}
                                        >
                                            <FaFolderPlus size={11} />
                                            Tạo thư mục mới
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
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
                        const archivedRooms = user.archivedRooms || [];
                        const dms = getRecentChatUsers();
                        const publicGroups = allGroups.filter(g => g.isPublic && (g.members?.includes(user.username) || g.owner === user.username));
                        const privateGroups = allGroups.filter(g => !g.isPublic && (g.members?.includes(user.username) || g.owner === user.username));
                        
                        const cloudRoomItem = {
                            id: `dm_${user.username}_${user.username}`,
                            name: user.username,
                            isDM: true,
                            isCloud: true,
                            type: 'personal'
                        };
                        const filteredDms = dms.filter(name => name !== user.username);
                        
                        const allRoomItems = [
                            cloudRoomItem,
                            ...filteredDms.map(name => ({ id: `dm_${[user.username, name].sort().join("_")}`, name, isDM: true, type: 'personal' })),
                            ...publicGroups.map(g => ({ id: g.groupId, name: g.groupName, type: 'groups' })),
                            ...privateGroups.map(g => ({ id: g.groupId, name: g.groupName, type: 'groups' }))
                        ];

                        // Filter out archived rooms by default
                        let filtered = allRoomItems.filter(r => !archivedRooms.includes(r.id));
                        
                        if (activeSidebarTab === 'personal') filtered = filtered.filter(r => r.isDM);
                        else if (activeSidebarTab === 'groups') filtered = filtered.filter(r => !r.isDM);
                        else if (activeSidebarTab === 'unread') filtered = filtered.filter(r => unreadCounts[r.id] > 0);
                        else if (activeSidebarTab.startsWith('folder_')) {
                            const currentFolder = customFolders.find(f => f.id === activeSidebarTab);
                            if (currentFolder) {
                                filtered = filtered.filter(r => currentFolder.roomIds.includes(r.id));
                            } else {
                                filtered = [];
                            }
                        }

                        // Separate Pinned and Unpinned
                        const pinned = filtered.filter(r => pinnedRooms.includes(r.id));
                        const unpinned = filtered.filter(r => !pinnedRooms.includes(r.id));

                        const renderRoom = (r) => {
                            const isPinned = pinnedRooms.includes(r.id);
                            const isCloudRoom = r.id === `dm_${user.username}_${user.username}`;
                            const isActive = activeRoom?.id === r.id || (r.isDM && activeRoom?.name === r.name && activeRoom?.isDM);
                            const unread = unreadCounts[r.id] || 0;

                            return (
                                <div key={r.id} onClick={() => isCloudRoom ? handleSwitchRoom({id: r.id, name: r.name, isDM: true, isCloud: true}) : (r.isDM ? handleStartDM(r.name) : handleSwitchRoom({id: r.id, name: r.name}))} className={`group p-2.5 rounded-lg flex items-center gap-3 cursor-pointer mb-1 relative transition-all ${isActive ? 'bg-[#5865f2] text-white shadow-lg' : (darkMode ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-slate-100 text-slate-600')}`}>
                                    {r.isDM ? (
                                        isCloudRoom ? (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-500 flex items-center justify-center text-white border border-white/10 shrink-0 shadow-md">
                                                <FaCloud size={14} className="animate-pulse text-cyan-100"/>
                                            </div>
                                        ) : (
                                            <div className="relative shrink-0" onClick={(e) => { e.stopPropagation(); handleOpenProfile(r.name); }}>
                                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-bold uppercase overflow-hidden border border-white/10">{onlineUsers[r.name]?.avatar ? <img src={onlineUsers[r.name].avatar} className="w-full h-full object-cover" alt="" /> : r.name[0]}</div>
                                                <FaCircle className={`absolute -bottom-0.5 -right-0.5 text-[8px] border-2 ${darkMode ? 'border-[#1e293b]' : 'border-white'} ${onlineUsers[r.name] ? 'text-green-500' : 'text-gray-400'}`} />
                                            </div>
                                        )
                                    ) : (
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-white/20' : (darkMode ? 'bg-white/5' : 'bg-slate-200')}`}>
                                            {r.type === 'groups' ? <FaGlobe size={14}/> : <FaLock size={12}/>}
                                        </div>
                                    )}
                                    <span className={`truncate text-sm font-medium italic ${r.isDM ? '' : 'uppercase tracking-tighter'}`}>
                                        {isCloudRoom ? (
                                            <span className="font-bold text-cyan-400 not-italic tracking-wide">☁ Cloud của tôi</span>
                                        ) : (
                                            r.isDM ? `@${r.name}` : r.name
                                        )}
                                    </span>
                                    
                                    <div className="absolute right-2 flex items-center gap-0.5">
                                        {unread > 0 && <span className="w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full font-black animate-bounce shrink-0">{unread}</span>}
                                        {isPinned && <FaThumbtack size={10} className="text-indigo-400 rotate-45 shrink-0"/>}
                                        <button onClick={(e) => { e.stopPropagation(); handleTogglePin(r.id, isPinned); }} className="opacity-0 group-hover:opacity-100 p-1 hover:text-indigo-400 transition-opacity shrink-0" title={isPinned ? "Bỏ ghim" : "Ghim"}>
                                            <FaThumbtack size={10} className={isPinned ? 'text-indigo-400' : 'text-gray-500'} />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleToggleArchive(r.id, false); }} className="opacity-0 group-hover:opacity-100 p-1 hover:text-amber-500 transition-opacity shrink-0" title="Lưu trữ">
                                            <FaArchive size={10} className="text-gray-500" />
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
                    <>
                        <div className={`h-12 flex items-center justify-between px-6 shrink-0 shadow-sm font-black backdrop-blur-md uppercase italic tracking-tighter border-b ${darkMode ? 'border-white/5 bg-white/2' : 'border-gray-200 bg-white/80'}`}>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setIsSidebarVisible(!isSidebarVisible)} className="p-1 hover:bg-black/5 rounded text-indigo-500 transition-all active:scale-90"><FaChevronLeft size={16} className={!isSidebarVisible ? 'rotate-180' : ''}/></button> 
                                {activeRoom.isDM ? (
                                    isCloudActive ? (
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-500 flex items-center justify-center text-white text-xs font-black overflow-hidden border border-cyan-400/20 shrink-0 shadow-inner">
                                            <FaCloud size={14} className="animate-pulse text-cyan-100"/>
                                        </div>
                                    ) : (
                                        <div className="w-7 h-7 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-400 text-xs font-black overflow-hidden border border-indigo-500/10 shrink-0 shadow-inner">
                                            {onlineUsers[activeRoom.name]?.avatar ? (
                                                <img src={onlineUsers[activeRoom.name].avatar} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                activeRoom.name.substring(0, 2).toUpperCase()
                                            )}
                                        </div>
                                    )
                                ) : (
                                    <div className="w-7 h-7 rounded-lg bg-orange-600/20 flex items-center justify-center text-orange-400 text-xs font-black overflow-hidden border border-orange-500/10 shrink-0 shadow-inner">
                                        {currentGroup?.avatar ? (
                                            <img src={currentGroup.avatar} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            activeRoom.name.substring(0, 2).toUpperCase()
                                        )}
                                    </div>
                                )}
                                {activeRoom.isDM ? (
                                    isCloudActive ? <span className="text-cyan-400 text-sm tracking-wide font-extrabold normal-case">☁ Cloud của tôi</span> : <span className="text-indigo-400 text-sm">@ {activeRoom.name}</span>
                                ) : <span className="text-sm"># {activeRoom.name}</span>}
                            </div>
                            <div className="flex items-center gap-4">
                                {/* NÚT GỌI VIDEO - Chỉ hiện ở DM và không phải Cloud */}
                                {activeRoom.isDM && !isCloudActive && (
                                    <button 
                                        onClick={() => handleVideoCall()} 
                                        disabled={isCallBusy}
                                        className={`p-1.5 rounded-lg transition-all ${isCallBusy ? 'text-gray-600' : 'text-cyan-400 hover:bg-cyan-500/10'}`}
                                        title="Gọi Video"
                                    >
                                        <FaVideo size={18}/>
                                    </button>
                                )}
                                
                                {/* Nút tìm kiếm toàn cầu tạm ẩn theo yêu cầu */}
                                <button onClick={() => { setShowSearch(!showSearch); setShowGlobalSearch(false); }} className={`p-1.5 rounded-lg transition-all ${showSearch ? 'text-indigo-500 bg-indigo-500/10' : 'text-gray-500 hover:text-white bg-white/5'}`} title="Tìm trong phòng"><FaSearch size={18}/></button>
                                <button onClick={() => setShowMediaGallery(true)} className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-400 bg-white/5 transition-all" title="Kho Media"><FaTh size={18}/></button>
                                <button onClick={() => setShowWallpaperModal(true)} className={`p-1.5 rounded-lg transition-all ${currentWallpaper ? 'text-pink-400 bg-pink-500/10' : 'text-gray-500 hover:text-pink-400 bg-white/5'}`} title="Hình nền phòng chat"><FaPalette size={18}/></button>
                                
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
                                        onClick={() => {
                                            if (isSecretMode || secretChatStatus !== 'idle') {
                                                socket.emit('close_secret_chat', { roomId: activeRoom.id });
                                                setIsSecretMode(false);
                                                setSecretChatStatus('idle');
                                                setSecretChatRequester(null);
                                                setMessages(prev => prev.filter(m => !(m.roomId === activeRoom.id && m.isSecret)));
                                                toast("Đã đóng cuộc trò chuyện bí mật.");
                                            } else {
                                                if (!sharedE2EEKey) {
                                                    alert("Đối phương chưa kích hoạt E2EE. Vui lòng chờ họ trực tuyến để thiết lập kết nối an toàn!");
                                                    return;
                                                }
                                                socket.emit('request_secret_chat', { roomId: activeRoom.id, senderUsername: user.username });
                                                setSecretChatStatus('waiting');
                                                toast("Đã gửi lời mời Chat Bí Mật tới đối phương...");
                                            }
                                        }}
                                        className={`p-1.5 rounded-lg transition-all ${
                                            secretChatStatus === 'established' ? 'text-red-500 bg-red-500/10 hover:bg-red-500/20' :
                                            secretChatStatus === 'waiting' ? 'text-yellow-500 bg-yellow-500/10 animate-pulse' :
                                            secretChatStatus === 'requested' ? 'text-blue-500 bg-blue-500/10 animate-bounce' :
                                            'text-gray-500 hover:text-red-400 bg-white/5'
                                        }`} 
                                        title={
                                            secretChatStatus === 'established' ? "Thoát Chat bí mật" :
                                            secretChatStatus === 'waiting' ? "Đang đợi phản hồi..." :
                                            secretChatStatus === 'requested' ? "Lời mời chat bí mật mới!" :
                                            "Bật Chat bí mật (Không lưu Server)"
                                        }
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
                                        <div className="relative z-[150] shrink-0">
                                            {/* Collapsed Main Pinned Banner */}
                                            <div className={`px-6 py-2.5 flex items-center justify-between gap-4 border-b transition-all duration-300 ${
                                                darkMode ? 'bg-[#0f172a]/95 border-white/5 text-indigo-200 backdrop-blur-md' : 'bg-indigo-50 border-indigo-100 text-indigo-900 shadow-sm'
                                            }`}>
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <FaThumbtack className="text-indigo-500 animate-bounce shrink-0" size={13}/>
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
                                                            className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 ${
                                                                isPinListExpanded
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
                                                        <FaTimes size={13}/>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Expanded Vertical Dropdown List */}
                                            {isPinListExpanded && pinnedMsgs.length > 1 && (
                                                <div className={`absolute top-full left-0 right-0 max-h-60 overflow-y-auto border-b shadow-2xl transition-all duration-300 animate-in slide-in-from-top-2 pr-1 scrollbar-hide ${
                                                    darkMode ? 'bg-[#0f172a]/98 border-white/5 backdrop-blur-xl text-white' : 'bg-white/98 border-gray-150 backdrop-blur-xl text-slate-800'
                                                }`}>
                                                    <div className="p-2 space-y-1.5">
                                                        <div className="px-3 py-1 text-[9px] uppercase font-black tracking-wider opacity-40">
                                                            Danh sách tất cả tin ghim ({pinnedMsgs.length})
                                                        </div>
                                                        {pinnedMsgs.slice().reverse().map((pin, i) => (
                                                            <div 
                                                                key={pin.messageId}
                                                                className={`p-2.5 rounded-xl flex items-center justify-between gap-4 transition-all duration-200 ${
                                                                    darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'
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
                                                                    <FaTimes size={12}/>
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
                                            const oldestMsg = messages.filter(m => m.roomId === activeRoom.id).sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
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
                                            <div key={msg.messageId} id={`msg-${msg.messageId}`} className={`flex gap-4 ${isMe ? 'flex-row-reverse text-right' : ''} group animate-in slide-in-from-bottom-2 transition-all duration-500 rounded-2xl`}>
                                                <div onClick={() => handleOpenProfile(msg.senderUsername)} className="w-10 h-10 rounded-xl shadow-lg cursor-pointer overflow-hidden shrink-0 border border-white/5 bg-slate-800 transition-all group-hover:scale-105">{sOnline?.avatar ? <img src={sOnline.avatar} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-white font-black uppercase bg-indigo-500">{msg.sender[0]}</div>}</div>
                                                <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                    <div className={`text-[10px] mb-1.5 font-black uppercase tracking-tighter italic flex items-center gap-1 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                                                        @{msg.senderUsername} • {msg.time}
                                                        {isMe && !msg.isRevoked && (() => {
                                                            const readerCount = (msg.readBy || []).filter(u => u !== user.username).length;
                                                            const delivereeCount = (msg.deliveredTo || []).filter(u => u !== user.username).length;
                                                            
                                                            if (readerCount > 0) {
                                                                return (
                                                                    <span 
                                                                        className="ml-1 text-[9px] text-blue-400 font-bold" 
                                                                        title={`Đã xem bởi: ${(msg.readBy || []).filter(u => u !== user.username).join(', ')}`}
                                                                    >
                                                                        ✓✓
                                                                    </span>
                                                                );
                                                            } else if (delivereeCount > 0) {
                                                                return (
                                                                    <span 
                                                                        className="ml-1 text-[9px] text-gray-400 font-bold" 
                                                                        title={`Đã nhận bởi: ${(msg.deliveredTo || []).filter(u => u !== user.username).join(', ')}`}
                                                                    >
                                                                        ✓✓
                                                                    </span>
                                                                );
                                                            } else {
                                                                return (
                                                                    <span 
                                                                        className="ml-1 text-[9px] text-gray-600" 
                                                                        title="Đã gửi"
                                                                    >
                                                                        ✓
                                                                    </span>
                                                                );
                                                            }
                                                        })()}
                                                    </div>
                                                    <div className="relative group/bubble">
                                                        {!msg.isRevoked && (
                                                            <div className={`absolute top-0 flex gap-2 p-1 bg-[#0f172a] border border-white/10 shadow-2xl rounded-xl opacity-0 group-hover/bubble:opacity-100 transition-all z-10 ${isMe ? 'right-full mr-3' : 'left-full ml-3'}`}>
                                                                <button onClick={() => setReplyingToMessage(msg)} className="p-1 text-gray-400 hover:text-blue-400" title="Trả lời"><FaReply size={12}/></button>
                                                                <button onClick={() => { setActiveThread(msg); setIsRightSidebarVisible(true); }} className="p-1 text-gray-400 hover:text-pink-400" title="Thảo luận (Thread)"><FaCommentDots size={12}/></button>
                                                                <button onClick={() => setForwardMessageData(msg)} className="p-1 text-gray-400 hover:text-green-400" title="Chuyển tiếp"><FaShare size={12}/></button>
                                                                {msg.text && !msg.msgType && (
                                                                     <button 
                                                                         onClick={() => handleTranslateMessage(msg.messageId, msg.text)} 
                                                                         className={`p-1 transition-all ${translatingMessageId === msg.messageId ? 'text-green-400 animate-pulse' : (translatedMessages[msg.messageId] ? 'text-green-500 hover:text-green-400' : 'text-gray-400 hover:text-green-400')}`} 
                                                                         title="Dịch thuật"
                                                                     >
                                                                         <FaLanguage size={14} className={translatingMessageId === msg.messageId ? 'animate-spin' : ''}/>
                                                                     </button>
                                                                )}
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

                                                                {!isMe && (
                                                                    <button onClick={() => handleOpenReportModal(msg)} className="p-1 text-gray-400 hover:text-amber-500 transition-colors duration-200" title="Báo cáo vi phạm">
                                                                        <FaShieldAlt size={12}/>
                                                                    </button>
                                                                )}

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
                                                             {/* Forwarded Message Indicator */}
                                                             {msg.forwardFrom && !msg.isRevoked && (
                                                                 <div className={`mb-2 flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider ${isMe ? 'text-indigo-200/80' : 'text-indigo-500 dark:text-indigo-400'}`}>
                                                                     <FaShare size={10} className="shrink-0 scale-x-[-1] animate-pulse"/>
                                                                     <span>Được chuyển tiếp từ @{msg.forwardFrom.senderUsername}</span>
                                                                 </div>
                                                             )}
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
                                                                            <div className="truncate opacity-75">
                                                                                <E2EEDecryptor msg={msg.replyTo} sharedKey={sharedE2EEKey} isMe={msg.replyTo.senderUsername === user.username} searchQuery={searchContent} />
                                                                            </div>
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
                                                            ) : msg.msgType === 'location' ? (
                                                                <div className="min-w-[200px] flex flex-col gap-2">
                                                                    <div className="font-bold text-sm flex items-center gap-2"><FaMapMarkerAlt className="text-red-500"/> Vị trí đã chia sẻ</div>
                                                                    <div className="w-full h-40 rounded-xl overflow-hidden bg-black/10 border border-white/10 relative">
                                                                        <iframe 
                                                                            width="100%" 
                                                                            height="100%" 
                                                                            frameBorder="0" 
                                                                            scrolling="no" 
                                                                            marginHeight="0" 
                                                                            marginWidth="0" 
                                                                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${msg.locationData.lng-0.01},${msg.locationData.lat-0.01},${msg.locationData.lng+0.01},${msg.locationData.lat+0.01}&layer=mapnik&marker=${msg.locationData.lat},${msg.locationData.lng}`}>
                                                                        </iframe>
                                                                    </div>
                                                                    <a href={`https://www.google.com/maps?q=${msg.locationData.lat},${msg.locationData.lng}`} target="_blank" rel="noopener noreferrer" className={`w-full py-2 rounded-lg font-bold text-xs text-center flex items-center justify-center gap-2 mt-1 transition-all ${isMe ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white'}`}>
                                                                        Mở Google Maps
                                                                    </a>
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
                                                                            <E2EEDecryptor msg={msg} sharedKey={sharedE2EEKey} isMe={isMe} searchQuery={searchContent} />
                                                                            {msg.isEdited && <span className={`text-[9px] italic ml-2 ${isMe ? 'opacity-60' : 'text-gray-500'}`}>(đã chỉnh sửa)</span>}
                                                                            
                                                                            {/* Dịch tin nhắn */}
                                                                            {translatedMessages[msg.messageId] && (
                                                                                 <div className={`mt-2.5 pt-2 border-t text-[12px] opacity-95 transition-all duration-300 animate-in slide-in-from-top-1 ${isMe ? 'border-white/20 text-indigo-100' : 'border-indigo-500/20 text-indigo-800 dark:text-indigo-200'}`}>
                                                                                     <div className="flex items-center gap-1.5 mb-1 text-[9px] font-black uppercase tracking-wider opacity-75">
                                                                                         <FaLanguage size={14}/> Bản dịch tự động:
                                                                                     </div>
                                                                                     <p className="italic font-bold font-serif">{translatedMessages[msg.messageId]}</p>
                                                                                 </div>
                                                                            )}
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
                                                                                <WaveformVoicePlayer src={msg.fileData} darkMode={darkMode} />
                                                                            ) : msg.fileType === 'image' ? (
                                                                                <img src={msg.fileData} onClick={() => { setLightboxImage({ url: msg.fileData, sender: msg.senderUsername, time: msg.time }); setLightboxZoom(1); setLightboxRotation(0); setLightboxFilter('none'); }} className="max-w-xs rounded-xl shadow-2xl border border-white/10 cursor-pointer hover:opacity-80 transition-all hover:scale-105" alt="attachment" />
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
                                            {showEmojiPicker && <div ref={emojiPickerRef} className="absolute bottom-24 left-6 z-50 shadow-2xl rounded-[30px] overflow-hidden border border-white/10 animate-in zoom-in-75"><EmojiPicker onEmojiClick={handleEmojiClick} theme={darkMode ? Theme.DARK : Theme.LIGHT} /></div>}
                                            
                                            {replyingToMessage && (
                                                <div className={`mb-2 p-3 rounded-xl flex justify-between items-center border ${darkMode ? 'bg-indigo-900/30 border-indigo-500/30 text-indigo-200' : 'bg-indigo-50 border-indigo-200 text-indigo-800'}`}>
                                                    <div className="flex-1 truncate text-xs">
                                                        <span className="font-black uppercase tracking-widest mr-2"><FaReply className="inline mr-1"/> Trả lời @{replyingToMessage.senderUsername}:</span>
                                                        <span className="italic">
                                                            <E2EEDecryptor msg={replyingToMessage} sharedKey={sharedE2EEKey} isMe={replyingToMessage.senderUsername === user.username} />
                                                        </span>
                                                    </div>
                                                    <button onClick={() => setReplyingToMessage(null)} className="ml-4 hover:text-red-500 transition-colors"><FaTimes size={14}/></button>
                                                </div>
                                            )}

                                            {showMentionPopup && (() => {
                                                const currentG = allGroups.find(g => g.groupId === activeRoom?.id);
                                                const mentionOptions = (currentG?.members || []).filter(uname => uname !== user.username && uname.toLowerCase().includes(mentionSearchQuery));
                                                if (mentionOptions.length === 0) return null;
                                                return (
                                                    <div className={`absolute bottom-20 left-6 z-[200] w-64 max-h-56 overflow-y-auto rounded-2xl shadow-2xl border transition-all duration-200 animate-in slide-in-from-bottom-2 ${
                                                        darkMode ? 'bg-[#0f172a]/95 border-white/10 text-white backdrop-blur-md' : 'bg-white border-gray-200 text-slate-800'
                                                    }`}>
                                                        <div className="p-3 border-b border-white/5 bg-indigo-500/10 text-[9px] uppercase font-black tracking-widest text-indigo-400">
                                                            Nhắc tên thành viên (@)
                                                        </div>
                                                        <div className="p-1">
                                                            {mentionOptions.map(uname => {
                                                                const memberOnline = onlineUsers[uname];
                                                                return (
                                                                    <div 
                                                                        key={uname} 
                                                                        onClick={() => handleSelectMention(uname)}
                                                                        className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all ${
                                                                            darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                                                                        }`}
                                                                    >
                                                                        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-xs overflow-hidden shrink-0">
                                                                            {memberOnline?.avatar ? <img src={memberOnline.avatar} className="w-full h-full object-cover" alt="" /> : uname[0].toUpperCase()}
                                                                        </div>
                                                                        <div className="truncate flex-1 min-w-0">
                                                                            <p className="text-xs font-bold truncate">@{uname}</p>
                                                                            <p className="text-[9px] text-gray-500 truncate">
                                                                                {memberOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })()}

                                            <div className={`rounded-2xl flex items-center px-4 py-3 border transition-all ${darkMode ? 'bg-white/5 border-white/10 focus-within:border-indigo-500' : 'bg-white border-gray-200 focus-within:border-indigo-500 shadow-sm'} ${isRecording ? 'border-red-500 animate-pulse bg-red-500/5' : ''}`}>
                                                {!isRecording && (
                                                    <div className={`flex gap-4 mr-4 border-r pr-4 ${darkMode ? 'text-gray-500 border-white/5' : 'text-slate-400 border-gray-200'}`}>
                                                        <FaSmile onClick={()=>{setShowEmojiPicker(!showEmojiPicker); setShowStickerPicker(false);}} className="cursor-pointer hover:text-orange-400 transition-all hover:scale-110" size={20}/>
                                                        <FaSmileBeam onClick={()=>{setShowStickerPicker(!showStickerPicker); setShowEmojiPicker(false);}} className={`cursor-pointer transition-all hover:scale-110 ${showStickerPicker ? 'text-yellow-400' : 'hover:text-yellow-400'}`} size={20} title="Stickers"/>
                                                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                                                        <FaImage onClick={()=>fileInputRef.current.click()} className="cursor-pointer hover:text-blue-500 transition-all hover:scale-110" size={18}/>
                                                        <FaPoll onClick={()=>setShowPollModal(true)} className="cursor-pointer hover:text-emerald-500 transition-all hover:scale-110" size={18} title="Tạo bình chọn"/>
                                                        <FaCalendarAlt onClick={()=>setShowEventModal(true)} className="cursor-pointer hover:text-purple-500 transition-all hover:scale-110" size={18} title="Tạo lịch nhóm"/>
                                                         <FaPalette onClick={()=>setShowPaintPad(true)} className="cursor-pointer hover:text-pink-500 transition-all hover:scale-110" size={18} title="Vẽ phác thảo"/>
                                                         <FaMapMarkerAlt onClick={handleSendLocation} className="cursor-pointer hover:text-red-500 transition-all hover:scale-110" size={18} title="Chia sẻ vị trí"/>
                                                    </div>
                                                )}
                                                
                                                {isRecording ? (
                                                    <div className="flex-1 flex items-center justify-between text-red-500 font-bold uppercase tracking-widest text-xs">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div> 
                                                            Đang thu âm... {formatTime(recordingTime)}
                                                            <div className="flex items-center gap-[3px] h-6 px-2 shrink-0">
                                                                {[...Array(12)].map((_, i) => (
                                                                    <div 
                                                                        key={i} 
                                                                        style={{ 
                                                                            animationDelay: `${i * 0.05}s`,
                                                                            height: '6px'
                                                                        }} 
                                                                        className="w-[2.5px] bg-red-500 rounded-full recording-wave-bar" 
                                                                    />
                                                                ))}
                                                            </div>
                                                            <style>{`
                                                                @keyframes soundWave {
                                                                    0%, 100% { height: 6px; }
                                                                    50% { height: 18px; }
                                                                }
                                                                .recording-wave-bar {
                                                                    animation: soundWave 0.6s ease-in-out infinite;
                                                                }
                                                            `}</style>
                                                        </div>
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
                clearChatHistory={clearChatHistory}
                handleExportChat={handleExportChat}
                handleLeaveGroup={handleLeaveGroup}
                setShowGroupSettings={setShowGroupSettings}
                setShowInviteModal={setShowInviteModal}
                setShowMediaGallery={setShowMediaGallery}
                setShowWallpaperModal={setShowWallpaperModal}
                selfDestructTimer={selfDestructTimer}
                setSelfDestructTimer={setSelfDestructTimer}
                handleVideoCall={handleVideoCall}
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
            />
            )}

            {/* Modals & Components phụ */}
            {showGlobalSearch && <GlobalSearch darkMode={darkMode} onClose={() => setShowGlobalSearch(false)} onSelectResult={handleSelectSearchResult} />}
            {showStickerPicker && <div className="absolute bottom-24 left-6 z-50"><StickerPicker onSelect={handleSendSticker} darkMode={darkMode} onClose={() => setShowStickerPicker(false)} /></div>}
            {showMediaGallery && activeRoom && <MediaGallery roomId={activeRoom.id} darkMode={darkMode} onClose={() => setShowMediaGallery(false)} />}
            <CreateChat user={user} isOpen={showGroupCreator} onClose={() => setShowGroupCreator(false)} onCreateGroup={handleCreateGroup} darkMode={darkMode} />
            <UserProfileModal isOpen={profileModal.isOpen} onClose={()=>setProfileModal({isOpen:false, username:''})} targetUsername={profileModal.username} currentUser={user} onUpdateSuccess={handleUpdateSuccess} onStartDM={handleStartDM} />
            
            {/* Modal Báo Cáo Tin Nhắn Vi Phạm */}
            {showReportModal && reportingMessage && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[600] backdrop-blur-md animate-in fade-in duration-200 p-4">
                    <div className={`w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border transition-all duration-300 ${
                        darkMode ? 'bg-[#0f172a] border-white/10 text-white' : 'bg-white border-gray-200 text-slate-800'
                    }`}>
                        <div className="p-6 bg-gradient-to-r from-red-500 to-rose-600 text-white flex justify-between items-center">
                            <h3 className="font-black uppercase tracking-widest text-[11px] flex items-center gap-2">
                                <FaShieldAlt size={16}/> Báo cáo tin nhắn vi phạm
                            </h3>
                            <button 
                                onClick={() => { setShowReportModal(false); setReportingMessage(null); }}
                                className="p-1 rounded-full hover:bg-white/10 text-white transition-colors"
                            >
                                <FaTimes size={14}/>
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-gray-100'}`}>
                                <h4 className="text-[10px] uppercase font-black tracking-wider text-gray-400 mb-1">Nội dung bị báo cáo</h4>
                                <p className={`text-sm italic font-medium leading-relaxed break-all ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                    "{reportingMessage.text || '[Tệp tin đính kèm]'}"
                                </p>
                                <span className="text-[9px] text-gray-500 mt-2 block">Gửi bởi: @{reportingMessage.senderUsername || reportingMessage.sender}</span>
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-2">Lý do báo cáo</label>
                                <select 
                                    value={reportReason}
                                    onChange={(e) => setReportReason(e.target.value)}
                                    className={`w-full px-4 py-3 rounded-2xl border font-bold text-sm outline-none transition-all ${
                                        darkMode 
                                            ? 'bg-slate-800 border-white/5 text-white focus:border-red-500' 
                                            : 'bg-slate-50 border-gray-200 text-slate-700 focus:border-red-500 focus:bg-white'
                                    }`}
                                >
                                    <option value="Abuse">Quấy rối, công kích, xúc phạm cá nhân</option>
                                    <option value="Spam">Quảng cáo rác, lừa đảo, Spam</option>
                                    <option value="Dangerous">Nội dung đồi trụy, độc hại, bạo lực</option>
                                    <option value="Other">Lý do vi phạm khác</option>
                                </select>
                            </div>

                            <div className="flex gap-4">
                                <button 
                                    onClick={() => { setShowReportModal(false); setReportingMessage(null); }}
                                    className={`flex-1 py-3.5 rounded-2xl font-bold transition-all text-sm border ${
                                        darkMode ? 'bg-white/5 hover:bg-white/10 border-white/5 text-white' : 'bg-slate-100 hover:bg-slate-200 border-gray-200 text-slate-600'
                                    }`}
                                >
                                    Hủy bỏ
                                </button>
                                <button 
                                    onClick={handleSubmitReport}
                                    className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold transition-all hover:opacity-90 shadow-lg shadow-rose-500/20 text-sm"
                                >
                                    Gửi báo cáo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Modal Tạo/Sửa Thư Mục Chat (Telegram Style) */}
            {showFolderModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[500] backdrop-blur-sm animate-in fade-in duration-200 p-4">
                    <div className={`w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border transition-all duration-300 ${
                        darkMode ? 'bg-[#0f172a] border-white/10 text-white' : 'bg-white border-gray-200 text-slate-800'
                    }`}>
                        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                            <h3 className="font-black uppercase tracking-widest text-[10px] flex items-center gap-2">
                                <FaFolderPlus size={14}/> {editingFolder ? "Chỉnh sửa thư mục chat" : "Tạo thư mục chat mới"}
                            </h3>
                            <button 
                                onClick={() => {
                                    setShowFolderModal(false);
                                    setEditingFolder(null);
                                    setFolderName('');
                                    setFolderRooms([]);
                                    setModalSearch('');
                                }} 
                                className="p-1 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                            >
                                <FaTimes size={14}/>
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Input Tên Thư Mục */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-wider opacity-50 pl-1">Tên thư mục</label>
                                <input 
                                    type="text" 
                                    placeholder="Nhập tên thư mục (VD: Công việc, Gia đình...)" 
                                    value={folderName} 
                                    onChange={(e) => setFolderName(e.target.value)} 
                                    className={`w-full px-4 py-3 rounded-2xl border outline-none text-xs font-bold transition-all ${
                                        darkMode 
                                            ? 'bg-black/30 border-white/10 text-white focus:border-indigo-500' 
                                            : 'bg-slate-50 border-gray-200 text-slate-800 focus:border-indigo-600 focus:bg-white'
                                    }`} 
                                />
                            </div>

                            {/* Danh sách chọn cuộc trò chuyện */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-wider opacity-50 pl-1">Chọn cuộc trò chuyện</label>
                                
                                {/* Thanh tìm kiếm nhanh */}
                                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
                                    darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-gray-200 text-slate-800'
                                }`}>
                                    <FaSearch size={11} className="text-slate-400 shrink-0" />
                                    <input
                                        type="text"
                                        placeholder="Tìm nhanh cuộc trò chuyện..."
                                        value={modalSearch}
                                        onChange={(e) => setModalSearch(e.target.value)}
                                        className="flex-1 bg-transparent outline-none text-[11px] placeholder:text-slate-500"
                                    />
                                    {modalSearch && (
                                        <FaTimes 
                                            size={10} 
                                            onClick={() => setModalSearch('')} 
                                            className="cursor-pointer text-slate-400 hover:text-white" 
                                        />
                                    )}
                                </div>

                                {/* List rooms checkboxes */}
                                <div className={`max-h-60 overflow-y-auto pr-1 space-y-1.5 scrollbar-hide rounded-2xl p-2 border ${
                                    darkMode ? 'bg-black/20 border-white/5' : 'bg-slate-50/50 border-gray-100'
                                }`}>
                                    {(() => {
                                        const dms = getRecentChatUsers();
                                        const publicGroups = allGroups.filter(g => g.isPublic && (g.members?.includes(user.username) || g.owner === user.username));
                                        const privateGroups = allGroups.filter(g => !g.isPublic && (g.members?.includes(user.username) || g.owner === user.username));
                                        
                                        const allRoomItems = [
                                            ...dms.map(name => ({ id: `dm_${[user.username, name].sort().join("_")}`, name, isDM: true, type: 'personal' })),
                                            ...publicGroups.map(g => ({ id: g.groupId, name: g.groupName, type: 'groups' })),
                                            ...privateGroups.map(g => ({ id: g.groupId, name: g.groupName, type: 'groups' }))
                                        ];

                                        const filteredRooms = allRoomItems.filter(r => r.name.toLowerCase().includes(modalSearch.toLowerCase()));

                                        if (filteredRooms.length === 0) {
                                            return <p className="text-[10px] text-center text-slate-500 py-6">Không tìm thấy cuộc trò chuyện nào</p>;
                                        }

                                        return filteredRooms.map(r => {
                                            const isChecked = folderRooms.includes(r.id);
                                            return (
                                                <div 
                                                    key={r.id}
                                                    onClick={() => toggleRoomInFolder(r.id)}
                                                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                                                        darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-100'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className={`w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-bold uppercase overflow-hidden shrink-0 border border-white/10`}>
                                                            {r.isDM && onlineUsers[r.name]?.avatar ? (
                                                                <img src={onlineUsers[r.name].avatar} className="w-full h-full object-cover" alt="" />
                                                            ) : r.name[0]}
                                                        </div>
                                                        <span className="text-[11.5px] font-bold truncate">
                                                            {r.isDM ? (onlineUsers[r.name]?.displayName || r.name) : r.name}
                                                        </span>
                                                    </div>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={isChecked}
                                                        readOnly
                                                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer pointer-events-none accent-indigo-600"
                                                    />
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>
                        </div>

                        {/* Footer buttons */}
                        <div className={`p-5 border-t flex justify-end gap-3 ${darkMode ? 'border-white/5 bg-slate-950/20' : 'bg-slate-50 border-gray-100'}`}>
                            {editingFolder && (
                                <button 
                                    onClick={() => handleDeleteFolder(editingFolder.id)}
                                    className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-wider transition-colors mr-auto"
                                >
                                    Xóa thư mục
                                </button>
                            )}
                            <button 
                                onClick={() => {
                                    setShowFolderModal(false);
                                    setEditingFolder(null);
                                    setFolderName('');
                                    setFolderRooms([]);
                                    setModalSearch('');
                                }}
                                className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-colors border ${
                                    darkMode ? 'hover:bg-white/5 border-white/5 text-gray-300' : 'hover:bg-slate-200 border-slate-200 text-slate-600'
                                }`}
                            >
                                Hủy
                            </button>
                            <button 
                                onClick={handleSaveFolder}
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider transition-colors shadow-lg shadow-indigo-600/10 active:scale-95"
                            >
                                Lưu lại
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Chọn Hình Nền Phòng Chat */}
            {showWallpaperModal && activeRoom && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[500] backdrop-blur-sm animate-in fade-in duration-200 p-4">
                    <div className={`w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border transition-all duration-300 ${darkMode ? 'bg-[#0f172a] border-white/10 text-white' : 'bg-white border-gray-200 text-slate-800'}`}>
                        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-pink-500 to-indigo-600 text-white">
                            <h3 className="font-black uppercase tracking-widest text-[10px] flex items-center gap-2"><FaPalette size={14}/> Hình nền phòng chat</h3>
                            <button onClick={() => setShowWallpaperModal(false)} className="p-1 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"><FaTimes size={14}/></button>
                        </div>
                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide">
                            {/* Khung xem trước nhỏ (Mini Preview) */}
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-3 italic">Xem trước (Preview)</p>
                                <div 
                                    className="h-28 rounded-2xl border border-white/10 shadow-inner flex items-end p-4 relative overflow-hidden bg-black/10"
                                    style={currentWallpaper ? (
                                        currentWallpaper.startsWith('http') || currentWallpaper.startsWith('data:image') || currentWallpaper.startsWith('/assets') || currentWallpaper.startsWith('blob:')
                                        ? { backgroundImage: `url(${currentWallpaper})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }
                                        : { background: currentWallpaper }
                                    ) : undefined}
                                >
                                    <div className="absolute inset-0 bg-black/10"></div>
                                    <div className="bg-indigo-600 text-white text-[10px] px-3 py-1.5 rounded-xl font-bold max-w-[75%] shadow-lg relative z-10 leading-tight">
                                        Hình nền phòng chat này sẽ được lưu riêng cho phòng này! ✨
                                    </div>
                                </div>
                            </div>

                            {/* Màu sắc tối giản */}
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-3 italic">Màu sắc tinh tế (Solid Colors)</p>
                                <div className="grid grid-cols-5 gap-2">
                                    {[
                                        { name: 'Slate Gray', value: '#1e293b' },
                                        { name: 'Midnight Blue', value: '#0f172a' },
                                        { name: 'Dark Teal', value: '#064e3b' },
                                        { name: 'Deep Burgundy', value: '#4c0519' },
                                        { name: 'Plum Purple', value: '#2e1065' },
                                    ].map(color => (
                                        <button 
                                            key={color.value}
                                            onClick={() => {
                                                setCurrentWallpaper(color.value);
                                                localStorage.setItem(`chat_wallpaper_${user.username}_${activeRoom.id}`, color.value);
                                                toast.success("Đã áp dụng màu nền!");
                                            }}
                                            className="w-full aspect-square rounded-xl border border-white/10 hover:scale-105 active:scale-95 transition-all shadow-md"
                                            style={{ backgroundColor: color.value }}
                                            title={color.name}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Hiệu ứng Gradients */}
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-3 italic">Gradients Thời Thượng</p>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { name: 'Nordic Aurora', value: 'linear-gradient(135deg, #0f172a 0%, #115e59 100%)' },
                                        { name: 'Sunset Velvet', value: 'linear-gradient(135deg, #31103f 0%, #742a2a 100%)' },
                                        { name: 'Cyberpunk Dusk', value: 'linear-gradient(135deg, #1e1b4b 0%, #3b0764 100%)' },
                                        { name: 'Deep Ocean', value: 'linear-gradient(135deg, #0f172a 0%, #0369a1 100%)' },
                                        { name: 'Velvet Forest', value: 'linear-gradient(135deg, #022c22 0%, #047857 100%)' },
                                        { name: 'Lavender Dusk', value: 'linear-gradient(135deg, #2d1b4e 0%, #581c87 100%)' },
                                    ].map(grad => (
                                        <button 
                                            key={grad.name}
                                            onClick={() => {
                                                setCurrentWallpaper(grad.value);
                                                localStorage.setItem(`chat_wallpaper_${user.username}_${activeRoom.id}`, grad.value);
                                                toast.success("Đã áp dụng hình nền Gradient!");
                                            }}
                                            className="w-full h-12 rounded-xl border border-white/10 hover:scale-105 active:scale-95 transition-all shadow-md"
                                            style={{ background: grad.value }}
                                            title={grad.name}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Link ảnh tùy chỉnh */}
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-3 italic">Link ảnh tùy chọn (Custom Image URL)</p>
                                <div className="flex gap-2">
                                    <input 
                                        type="text"
                                        placeholder="Dán URL hình ảnh từ Unsplash/Google..."
                                        value={customWallpaperUrl}
                                        onChange={(e) => setCustomWallpaperUrl(e.target.value)}
                                        className={`flex-1 p-2.5 rounded-xl border text-xs font-bold outline-none transition-all ${darkMode ? 'bg-white/5 border-white/10 focus:border-indigo-500 text-white' : 'bg-slate-50 border-gray-200 focus:border-indigo-500'}`}
                                    />
                                    <button 
                                        onClick={() => {
                                            if (customWallpaperUrl.trim()) {
                                                setCurrentWallpaper(customWallpaperUrl);
                                                localStorage.setItem(`chat_wallpaper_${user.username}_${activeRoom.id}`, customWallpaperUrl);
                                                toast.success("Đã áp dụng ảnh nền tùy chỉnh!");
                                            } else {
                                                toast.error("Vui lòng nhập URL hợp lệ");
                                            }
                                        }}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 shrink-0"
                                    >
                                        Áp dụng
                                    </button>
                                </div>
                                <span className="text-[8px] text-gray-500 block mt-1.5">Gợi ý: Tìm ảnh đẹp trên Unsplash và copy link ảnh dán vào đây!</span>
                            </div>

                            {/* Reset Wallpaper */}
                            <div className="flex gap-3 border-t border-white/5 pt-4">
                                <button 
                                    onClick={() => {
                                        setCurrentWallpaper('');
                                        setCustomWallpaperUrl('');
                                        localStorage.removeItem(`chat_wallpaper_${user.username}_${activeRoom.id}`);
                                        toast.success("Đã gỡ bỏ hình nền phòng chat!");
                                    }}
                                    className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-black uppercase tracking-wider py-3 rounded-xl transition-all active:scale-95"
                                >
                                    Gỡ bỏ hình nền
                                </button>
                                <button 
                                    onClick={() => setShowWallpaperModal(false)}
                                    className={`flex-1 text-xs font-black uppercase tracking-wider py-3 rounded-xl transition-all active:scale-95 border ${darkMode ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10' : 'bg-slate-50 border-gray-200 text-slate-700 hover:bg-slate-100'}`}
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Modal Chuyển tiếp tin nhắn */}
            {forwardMessageData && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[500] backdrop-blur-sm animate-in zoom-in-95 p-4">
                    <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${darkMode ? 'bg-slate-900 border border-white/10' : 'bg-white'}`}>
                        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-indigo-600 text-white">
                            <h3 className="font-bold uppercase text-sm">Chuyển tiếp tin nhắn</h3>
                            <button onClick={() => { setForwardMessageData(null); setForwardSearchQuery(''); }} className="hover:text-red-300 transition-colors"><FaTimes /></button>
                        </div>
                        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
                            {/* Premium Search Filter inside Modal */}
                            <div className="relative mb-2">
                                <input
                                    type="text"
                                    value={forwardSearchQuery}
                                    onChange={e => setForwardSearchQuery(e.target.value)}
                                    placeholder="Tìm bạn bè hoặc nhóm để chuyển tiếp..."
                                    className={`w-full p-3 pl-10 rounded-xl text-xs font-bold border transition-colors outline-none focus:border-indigo-500 ${
                                        darkMode ? 'bg-black/20 border-white/10 text-white placeholder:text-gray-500' : 'bg-gray-50 border-gray-200 text-slate-800 placeholder:text-slate-400'
                                    }`}
                                />
                                <FaSearch className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`} />
                            </div>

                            <p className="text-xs text-gray-500 font-bold uppercase mb-2">Chọn nơi chuyển đến</p>
                            
                            {/* Lưu trữ cá nhân (Cloud) */}
                            {("cloud của tôi".includes(forwardSearchQuery.toLowerCase()) || "luu tru".includes(forwardSearchQuery.toLowerCase()) || "cloud".includes(forwardSearchQuery.toLowerCase())) && (
                                <div className="space-y-2 mb-4">
                                    <div className="text-[10px] uppercase font-black text-cyan-400">Không gian cá nhân</div>
                                    <button onClick={() => handleForwardMessage(`dm_${user.username}_${user.username}`)} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${darkMode ? 'border-white/5 hover:bg-white/5 text-gray-300 hover:border-indigo-500/40' : 'border-gray-200 hover:bg-gray-50 text-gray-700 hover:border-indigo-500'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gradient-to-tr from-cyan-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-xs"><FaCloud/></div>
                                            <span className="font-semibold text-sm">Cloud của tôi</span>
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider">Chọn ➔</span>
                                    </button>
                                </div>
                            )}
                            
                            {/* Danh sách bạn bè */}
                            {user.friends?.filter(f => f.toLowerCase().includes(forwardSearchQuery.toLowerCase())).length > 0 && (
                                <div className="space-y-2">
                                    <div className="text-[10px] uppercase font-black text-indigo-400">Bạn bè</div>
                                    {user.friends.filter(f => f.toLowerCase().includes(forwardSearchQuery.toLowerCase())).map(f => (
                                        <button key={f} onClick={() => handleForwardMessage(`dm_${[user.username, f].sort().join("_")}`)} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${darkMode ? 'border-white/5 hover:bg-white/5 text-gray-300 hover:border-indigo-500/40' : 'border-gray-200 hover:bg-gray-50 text-gray-700 hover:border-indigo-500'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-xs">{f[0].toUpperCase()}</div>
                                                <span className="font-semibold text-sm">@{f}</span>
                                            </div>
                                            <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Chọn ➔</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Danh sách nhóm */}
                            {allGroups.filter(g => (g.members?.includes(user.username) || g.owner === user.username) && g.groupName.toLowerCase().includes(forwardSearchQuery.toLowerCase())).length > 0 && (
                                <div className="space-y-2 mt-4">
                                    <div className="text-[10px] uppercase font-black text-orange-400">Nhóm</div>
                                    {allGroups.filter(g => (g.members?.includes(user.username) || g.owner === user.username) && g.groupName.toLowerCase().includes(forwardSearchQuery.toLowerCase())).map(g => (
                                        <button key={g.groupId} onClick={() => handleForwardMessage(g.groupId)} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${darkMode ? 'border-white/5 hover:bg-white/5 text-gray-300 hover:border-indigo-500/40' : 'border-gray-200 hover:bg-gray-50 text-gray-700 hover:border-indigo-500'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs"><FaGlobe/></div>
                                                <span className="font-semibold text-sm truncate">{g.groupName}</span>
                                            </div>
                                            <span className="text-[10px] font-black uppercase text-orange-400 tracking-wider">Chọn ➔</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* No results notice */}
                            {user.friends?.filter(f => f.toLowerCase().includes(forwardSearchQuery.toLowerCase())).length === 0 &&
                             allGroups.filter(g => (g.members?.includes(user.username) || g.owner === user.username) && g.groupName.toLowerCase().includes(forwardSearchQuery.toLowerCase())).length === 0 && (
                                <div className="text-center py-6 text-xs text-gray-500 font-bold uppercase">Không tìm thấy kết quả chuyển tiếp nào trùng khớp</div>
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

                            {/* Group Avatar Uploader */}
                            {(isAdminOfGroup || isModOfGroup) && (
                                <div className="flex flex-col items-center justify-center space-y-4 pb-2">
                                    <p className="text-[9px] font-black uppercase text-gray-500 tracking-[2px] italic border-l-2 border-indigo-500 pl-3 self-start">Ảnh đại diện nhóm</p>
                                    <div className="relative group shrink-0">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-orange-500 to-indigo-500 rounded-[30px] blur-md opacity-40 group-hover:opacity-80 transition-opacity"></div>
                                        <img 
                                            src={currentGroup?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeRoom.name)}&background=f97316&color=fff`} 
                                            className="w-24 h-24 rounded-[28px] border-4 border-slate-900 object-cover relative z-10 shadow-xl bg-slate-800 transition-all group-hover:scale-105 animate-in fade-in" 
                                            alt="group-avt" 
                                        />
                                        <div 
                                            onClick={() => groupFileRef.current?.click()} 
                                            className="absolute inset-0 z-20 bg-black/60 rounded-[28px] flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-all border-2 border-white/20"
                                        >
                                            <FaCamera size={20} className="text-white animate-bounce" />
                                            <span className="text-[8px] text-white/90 font-black uppercase tracking-wider mt-1">Thay ảnh</span>
                                        </div>
                                    </div>
                                    <input 
                                        type="file" 
                                        ref={groupFileRef} 
                                        className="hidden" 
                                        onChange={handleGroupAvatarChange} 
                                        accept="image/*" 
                                    />
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

            {/* Immersive Image Lightbox & Studio */}
            {lightboxImage && (() => {
                const filterStyles = {
                    none: 'none',
                    grayscale: 'grayscale(100%)',
                    sepia: 'sepia(80%) contrast(90%)',
                    cinematic: 'contrast(125%) brightness(95%) saturate(120%)',
                    retroInvert: 'invert(100%) hue-rotate(180deg)',
                    warmDream: 'saturate(150%) sepia(20%) brightness(105%)',
                    softBlur: 'blur(2px) saturate(130%)'
                };
                return (
                    <div 
                        className="fixed inset-0 bg-black/95 z-[999] flex flex-col justify-between p-6 backdrop-blur-md font-sans select-none animate-in fade-in duration-300"
                        onClick={() => setLightboxImage(null)}
                    >
                        {/* Header bar */}
                        <div className="flex justify-between items-center bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 shadow-2xl z-[1001]" onClick={e => e.stopPropagation()}>
                            <div className="flex flex-col text-left">
                                <span className="text-xs font-black uppercase text-indigo-400 tracking-wider">Trình xem ảnh & Studio</span>
                                <span className="text-[10px] text-gray-400 font-medium">Gửi bởi @{lightboxImage.sender} vào {lightboxImage.time}</span>
                            </div>
                            
                            {/* Control actions */}
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => setLightboxZoom(prev => Math.max(1, prev - 0.25))}
                                    className="p-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition-all"
                                    title="Thu nhỏ"
                                >
                                    <FaChevronLeft size={16}/>
                                </button>
                                <span className="text-xs font-black text-white w-10 text-center">{Math.round(lightboxZoom * 100)}%</span>
                                <button 
                                    onClick={() => setLightboxZoom(prev => Math.min(3, prev + 0.25))}
                                    className="p-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition-all"
                                    title="Phóng to"
                                >
                                    <FaChevronRight size={16}/>
                                </button>
                                <div className="h-6 w-px bg-white/10"></div>
                                <button 
                                    onClick={() => setLightboxRotation(prev => (prev + 90) % 360)}
                                    className="p-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition-all"
                                    title="Xoay ảnh 90°"
                                >
                                    <FaPalette size={16} className="animate-spin" style={{ animationDuration: '6s' }} />
                                </button>
                                <a 
                                    href={lightboxImage.url} 
                                    download={`ott_attachment_${Date.now()}.png`}
                                    className="p-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition-all"
                                    title="Tải xuống ảnh gốc"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <FaPaperPlane size={16} className="rotate-45" />
                                </a>
                                <div className="h-6 w-px bg-white/10"></div>
                                <button 
                                    onClick={() => setLightboxImage(null)} 
                                    className="p-2 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-xl transition-all"
                                    title="Đóng"
                                >
                                    <FaTimes size={16}/>
                                </button>
                            </div>
                        </div>

                        {/* Main Image Viewport */}
                        <div className="flex-1 flex items-center justify-center overflow-hidden py-4">
                            <div 
                                className="relative transition-all duration-300 ease-out max-w-full max-h-[70vh] flex items-center justify-center"
                                style={{
                                    transform: `scale(${lightboxZoom}) rotate(${lightboxRotation}deg)`,
                                }}
                                onClick={e => e.stopPropagation()}
                            >
                                <img 
                                    src={lightboxImage.url} 
                                    className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-[0_0_80px_rgba(99,102,241,0.25)] border border-white/10 transition-all duration-300" 
                                    style={{
                                        filter: filterStyles[lightboxFilter] || 'none'
                                    }}
                                    alt="Studio Preview" 
                                />
                            </div>
                        </div>

                        {/* Bottom Studio Filter Selector */}
                        <div 
                            className="bg-black/60 backdrop-blur-xl p-4 rounded-3xl border border-white/5 shadow-2xl flex flex-col items-center gap-3 z-[1001] max-w-xl mx-auto w-full"
                            onClick={e => e.stopPropagation()}
                        >
                            <span className="text-[10px] font-black uppercase text-indigo-400 tracking-[3px]">Bộ lọc màu Studio nghệ thuật</span>
                            <div className="flex items-center gap-2 overflow-x-auto w-full justify-center py-1 scrollbar-hide">
                                {[
                                    { id: 'none', label: 'Bản gốc' },
                                    { id: 'grayscale', label: 'Cổ điển B&W' },
                                    { id: 'sepia', label: 'Hoài niệm' },
                                    { id: 'cinematic', label: 'Điện ảnh' },
                                    { id: 'retroInvert', label: 'Âm bản Retro' },
                                    { id: 'warmDream', label: 'Mơ mộng' },
                                    { id: 'softBlur', label: 'Ảo ảnh' }
                                ].map(filter => (
                                    <button
                                        key={filter.id}
                                        onClick={() => setLightboxFilter(filter.id)}
                                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wider uppercase border transition-all shrink-0 ${
                                            lightboxFilter === filter.id 
                                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25 scale-105 font-black' 
                                                : 'bg-white/5 border-white/5 hover:border-white/20 text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        {filter.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            })()}

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

            {/* Modal Cài Đặt Nhạc Chuông Thông Báo */}
            {showSoundSettings && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[999] backdrop-blur-md p-4 animate-in zoom-in-95" onClick={() => setShowSoundSettings(false)}>
                    <div 
                        className={`w-[360px] rounded-3xl p-6 shadow-2xl border transition-all duration-300 ${darkMode ? 'bg-slate-900 border-white/10 text-white shadow-[0_0_50px_rgba(99,102,241,0.15)]' : 'bg-white border-gray-100 text-slate-800'}`}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex flex-col text-left">
                                <span className="text-xs font-black uppercase text-indigo-500 tracking-wider">Tùy chọn hệ thống</span>
                                <h2 className="text-lg font-black uppercase tracking-tighter italic flex items-center gap-2">Nhạc chuông báo ♪</h2>
                            </div>
                            <button onClick={() => setShowSoundSettings(false)} className="text-gray-500 hover:text-red-500 transition-colors p-1.5 bg-white/5 rounded-xl"><FaTimes size={16}/></button>
                        </div>
                        <p className={`text-[10px] font-medium mb-4 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Chọn nhạc chuông yêu thích được tổng hợp trực tiếp từ Web Audio API:</p>
                        
                        <div className="space-y-2">
                            {[
                                { id: 'telegram', label: 'Telegram Bell', desc: 'Âm chuông cao vút, thanh lịch' },
                                { id: 'zalo', label: 'Zalo Chirp', desc: 'Tiếng kêu kép nhịp điệu sinh động' },
                                { id: 'discord', label: 'Discord Beep', desc: 'Âm báo đúp đôi đặc trưng' },
                                { id: 'retro', label: 'Retro Laser', desc: 'Phong cách máy game thùng 8-bit' },
                                { id: 'nokia', label: 'Nokia Tune', desc: 'Giai điệu monophonic cổ điển' }
                            ].map(sound => (
                                <button
                                    key={sound.id}
                                    onClick={() => {
                                        setNotificationSound(sound.id);
                                        localStorage.setItem('alertSound', sound.id);
                                        playNotificationSound(sound.id);
                                    }}
                                    className={`w-full p-3 rounded-2xl border text-left transition-all duration-200 flex flex-col gap-0.5 ${
                                        notificationSound === sound.id
                                            ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400 font-bold scale-[1.02] shadow-lg shadow-indigo-500/5'
                                            : 'bg-white/5 border-white/5 hover:border-white/10 text-gray-400 hover:text-white'
                                    }`}
                                >
                                    <div className="flex justify-between items-center w-full">
                                        <span className="text-xs font-black uppercase tracking-wider">{sound.label}</span>
                                        {notificationSound === sound.id && <span className="text-[10px] font-black uppercase bg-indigo-500 text-white px-2 py-0.5 rounded-lg shadow-md animate-pulse">Đang chọn</span>}
                                    </div>
                                    <span className="text-[9px] opacity-75 font-serif italic">{sound.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Canvas Paint Pad (Bảng vẽ phác thảo trực tuyến) */}
            {showPaintPad && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[999] backdrop-blur-md p-4 animate-in zoom-in-95" onClick={() => setShowPaintPad(false)}>
                    <div 
                        className={`w-[450px] rounded-3xl p-6 shadow-2xl border transition-all duration-300 flex flex-col gap-4 ${darkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-gray-100 text-slate-800'}`}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center">
                            <div className="flex flex-col text-left">
                                <span className="text-xs font-black uppercase text-indigo-500 tracking-wider">Studio vẽ phác thảo</span>
                                <h2 className="text-lg font-black uppercase tracking-tighter italic">Vẽ phác thảo trực tuyến 🎨</h2>
                            </div>
                            <button onClick={() => setShowPaintPad(false)} className="text-gray-500 hover:text-red-500 transition-colors p-1.5 bg-white/5 rounded-xl"><FaTimes size={16}/></button>
                        </div>

                        {/* Drawing canvas viewport */}
                        <div className="border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative bg-white">
                            <canvas
                                ref={paintCanvasRef}
                                width={400}
                                height={300}
                                className="w-full h-[300px] cursor-crosshair block"
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                            />
                        </div>

                        {/* Controls Panel */}
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                                {/* Color choices */}
                                <div className="flex items-center gap-1.5">
                                    {[
                                        '#6366f1', // Indigo
                                        '#10b981', // Emerald
                                        '#ef4444', // Red
                                        '#f59e0b', // Amber
                                        '#ec4899', // Pink
                                        '#000000', // Black
                                    ].map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setPaintColor(color)}
                                            className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${paintColor === color ? 'border-white scale-105 shadow-lg' : 'border-transparent opacity-80'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>

                                {/* Brush Size Slider */}
                                <div className="flex items-center gap-2 flex-1 max-w-[120px]">
                                    <span className="text-[10px] font-black uppercase tracking-wider opacity-75">Nét:</span>
                                    <input
                                        type="range"
                                        min={1}
                                        max={20}
                                        value={paintBrushSize}
                                        onChange={e => setPaintBrushSize(parseInt(e.target.value))}
                                        className="w-full accent-indigo-500 h-1 bg-white/10 rounded-lg outline-none cursor-pointer"
                                    />
                                    <span className="text-[10px] font-black text-indigo-400 w-4 text-center">{paintBrushSize}</span>
                                </div>
                            </div>

                            {/* Main action buttons */}
                            <div className="flex gap-2 text-xs">
                                <button
                                    onClick={clearPaintCanvas}
                                    className="flex-1 py-3 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-2xl font-black uppercase tracking-wider border border-red-500/10 transition-all"
                                >
                                    Xóa hết
                                </button>
                                <button
                                    onClick={handleSendPaint}
                                    className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-wider shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <FaPaperPlane size={12}/> Gửi phác thảo
                                </button>
                            </div>
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

            {/* Game Center Modal */}
            {showGameCenter && (
                <GameCenter user={user} onClose={() => setShowGameCenter(false)} />
            )}

            {/* Todo List Modal */}
        </div>
    );
};

export default ChatPage;
