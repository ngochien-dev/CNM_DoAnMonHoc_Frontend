import React, { useState, useEffect, useRef } from 'react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { 
    FaHashtag, FaPlusCircle, FaPaperPlane, FaSignOutAlt, FaCircle, 
    FaChevronLeft, FaChevronRight, FaFileAlt, FaTrash, FaUndo, FaBroom, FaShieldAlt, 
    FaChartBar, FaImage, FaSmile, FaMoon, FaSun, 
    FaGlobe, FaCog, FaUserMinus, FaPauseCircle, FaPlayCircle, 
    FaUserFriends, FaCommentDots, FaUserPlus, FaTimes, FaUserCheck, FaLock, FaVideo
} from 'react-icons/fa';

import UserProfileModal from './user/UserProfileModal';
import AdminStats from './statistics/AdminStats';
import Home from './chat/Home';
import RightSidebar from './chat/RightSidebar';
import MessageSearch from './chat/MessageSearch';
import CreateChat from './function/CreateChat';
import api from '../services/api';
import { connectSocket } from '../services/socket';
import useCall from '../context/useCall';

const axios = api;

const ChatPage = ({ user, setUser }) => {
    const [msgInput, setMsgInput] = useState('');
    const [messages, setMessages] = useState([]); 
    const [onlineUsers, setOnlineUsers] = useState({});
    const [allGroups, setAllGroups] = useState([]);
    const [activeRoom, setActiveRoom] = useState(null); 
    const [unreadCounts, setUnreadCounts] = useState({}); 
    const [friends, setFriends] = useState(user?.friends || []);
    const [friendRequests, setFriendRequests] = useState(user?.friendRequests || []);

    const [showFriendsTab, setShowFriendsTab] = useState(false);
    const [showDiscoveryTab, setShowDiscoveryTab] = useState(false);
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [showSearch, setShowSearch] = useState(false); // 2. CHÈN STATE
    const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [isRightSidebarVisible, setIsRightSidebarVisible] = useState(true);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showGroupCreator, setShowGroupCreator] = useState(false);
    const [showGroupSettings, setShowGroupSettings] = useState(false);
    const [profileModal, setProfileModal] = useState({ isOpen: false, username: '' });
    const [stats, setStats] = useState(null);
    const [callHistory, setCallHistory] = useState([]);
    const scrollRef = useRef(null);
    const fileInputRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const { startCall, isCallBusy, callHistoryVersion } = useCall();
    const activeRoomId = activeRoom?.id || null;
    const activeRoomName = activeRoom?.name || '';
    const activeRoomIsDM = Boolean(activeRoom?.isDM);
    const socket = { emit: (...args) => connectSocket().emit(...args) };

    const loadData = async () => {
        if (!user?.username) return;
        try {
            const [m, g, u, c] = await Promise.all([
                api.get(`/messages/${user.username}`),
                api.get('/groups/all'),
                api.get(`/users/${user.username}`),
                api.get('/calls/history?limit=12').catch(() => ({ data: { items: [] } }))
            ]);
            setMessages(m.data.filter(msg => !(u.data.deletedMessages || []).includes(msg.messageId)));
            setAllGroups(g.data);
            setFriends(u.data.friends || []);
            setFriendRequests(u.data.friendRequests || []);
            setCallHistory(Array.isArray(c.data) ? c.data : c.data?.items || []);
            if (u.data.username === user.username) {
                setUser(prev => ({ ...prev, ...u.data }));
            }
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        if (!user?.username) return;
        const socket = connectSocket();
        socket.emit('user_online', { ...user });
        loadData();
        socket.on('groups_updated', loadData);
        socket.on('receive_message', (d) => {
            setMessages(p => [...p, d]);
            if (d.roomId !== activeRoomId && d.senderUsername !== user.username) {
                const rId = d.roomId || 'chung';
                setUnreadCounts(prev => ({ ...prev, [rId]: (prev[rId] || 0) + 1 }));
            }
        });
        socket.on('update_user_list', (u) => setOnlineUsers(u));
        socket.on('message_revoked', (id) => setMessages(p => p.map(m => m.messageId === id ? { ...m, text: "Tin nhắn này đã bị thu hồi", isRevoked: true, fileData: null, fileType: null } : m)));
        return () => { socket.off('groups_updated'); socket.off('receive_message'); socket.off('update_user_list'); socket.off('message_revoked'); };
    }, [user?.username, activeRoomId]);

    useEffect(() => {
        if (!user?.username) return;
        loadData();
    }, [user?.username, callHistoryVersion]);

    useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, activeRoom]);

    const deleteForMe = async (id) => {
        if (!user?.username) return;
        if (window.confirm("Xóa phía bạn?")) {
            await api.post('/messages/delete-for-me', { username: user.username, messageId: id });
            setMessages(prev => prev.filter(m => m.messageId !== id));
        }
    };

    const clearChatHistory = async () => {
        if (!user?.username || !activeRoomId) return;
        if (window.confirm(`Xóa sạch chat tại ${activeRoom.name}?`)) {
            await api.post('/messages/clear-history', { username: user.username, roomId: activeRoomId });
            setMessages(prev => prev.filter(m => m.roomId !== activeRoomId));
        }
    };

    const unsendEverywhere = (id) => {
        if (window.confirm("Thu hồi tin nhắn?")) socket.emit('revoke_message', id);
    };

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
        setActiveRoom(room || null);
        setShowFriendsTab(false);
        setIsAdminMode(false);
        if (room?.id) {
            setUnreadCounts(prev => ({ ...prev, [room.id]: 0 }));
        }
    };
    const handleStartDM = (friendUname) => { const dmId = `dm_${[user.username, friendUname].sort().join("_")}`; handleSwitchRoom({ id: dmId, name: friendUname, isDM: true }); };
    const handleOpenProfile = (uname) => setProfileModal({ isOpen: true, username: uname });
    const handleVideoCall = (targetUsername = activeRoomName) => {
        if (!targetUsername || isCallBusy) return;
        startCall(targetUsername, activeRoomIsDM ? activeRoomId : undefined);
    };

    const handleSendText = () => {
        if (!user?.username || !activeRoomId) return;
        const currentG = allGroups.find(g => g.groupId === activeRoomId);
        if (currentG?.isDisabled) return alert("Kênh đã khóa!");
        if (!msgInput.trim()) return;
        socket.emit('send_message', { sender: user.displayName, senderUsername: user.username, text: msgInput, roomId: activeRoomId, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
        setMsgInput(''); setShowEmojiPicker(false);
    };

    const handleCreateGroup = async (name, isPublic = false) => {
        if(!name.trim()) return;
        await api.post('/groups/create', { groupName: name, owner: user.username, isPublic });
        setShowGroupCreator(false);
        loadData();
    };

    const handleRequestJoin = async (groupId) => {
        await api.post('/groups/request', { groupId, username: user.username });
        alert("Đã gửi yêu cầu!");
        loadData();
    };

    const handleApprove = async (groupId, targetUsername, action) => {
        await api.post('/groups/approve', { groupId, targetUsername, action });
        loadData();
    };

    const handleManageGroup = async (action) => {
        if (!activeRoomId) return;
        if(window.confirm(`Xác nhận?`)) {
            await api.post('/groups/manage', { groupId: activeRoomId, action });
            if(action === 'delete') { setActiveRoom({ id: 'chung', name: 'Chung' }); setShowGroupSettings(false); }
            loadData();
        }
    };

    const handleKick = async (target) => {
        if (!activeRoomId) return;
        if(window.confirm(`Kích @${target}?`)) {
            await api.post('/groups/remove-member', { groupId: activeRoomId, targetUsername: target });
            loadData();
        }
    };

    const handleFileUpload = (event) => {
        const file = event.target.files?.[0];
        if (!file || !user?.username || !activeRoomId) return;

        const reader = new FileReader();
        reader.onload = () => {
            socket.emit('send_message', {
                sender: user.displayName || user.username,
                senderUsername: user.username,
                roomId: activeRoomId,
                text: '',
                fileData: reader.result,
                fileName: file.name,
                fileType: file.type?.startsWith('image/') ? 'image' : file.type || 'file',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            });
            event.target.value = '';
        };
        reader.readAsDataURL(file);
    };

    const callStatusLabelMap = {
        ringing: 'Dang do chuong',
        connecting: 'Dang ket noi',
        in_call: 'Dang trong cuoc goi',
        ended: 'Da ket thuc',
        cancelled: 'Da huy',
        rejected: 'Bi tu choi',
        missed: 'Nho cuoc goi',
        timeout: 'Het gio cho',
        busy: 'May ban',
        failed: 'That bai',
    };

    const formatCallDuration = (durationSec = 0) => {
        const safeDuration = Math.max(0, Number(durationSec) || 0);
        const minutes = Math.floor(safeDuration / 60).toString().padStart(2, '0');
        const seconds = (safeDuration % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    const formatCallTime = (value) => {
        if (!value) return 'Chua co thoi gian';

        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return 'Chua co thoi gian';

        return parsed.toLocaleString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const getCallPeerUsername = (call) => {
        if (!call) return 'unknown';
        return call.callerUsername === user.username ? call.calleeUsername : call.callerUsername;
    };

    if (!user?.username) {
        return <div className="p-6 text-sm font-bold text-gray-500">Dang tai thong tin nguoi dung...</div>;
    }

    const currentGroup = activeRoomId ? allGroups.find(g => g.groupId === activeRoomId) : null;
    const isAdminOfGroup = currentGroup?.owner === user.username || user.role === 'admin';
    const isMember = activeRoomId === 'chung' || activeRoomId?.startsWith('dm_') || currentGroup?.isPublic || currentGroup?.members?.includes(user.username) || user.role === 'admin';

    return (
        <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-500 ${darkMode ? 'bg-[#0f172a] text-[#dbdee1]' : 'bg-white text-[#313338]'}`}>
            <div className={`w-[72px] flex flex-col items-center py-3 space-y-4 shrink-0 shadow-inner z-20 ${darkMode ? 'bg-[#020617]' : 'bg-[#e3e5e8]'}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black cursor-pointer hover:rounded-xl transition-all shadow-md ${(!activeRoom && !showFriendsTab && !showDiscoveryTab && !isAdminMode) ? 'bg-indigo-600 scale-110 shadow-indigo-500/50' : 'bg-gradient-to-tr from-indigo-500 to-purple-600 opacity-60 hover:opacity-100'}`} onClick={() => handleSwitchRoom(null)}>OTT</div>
                <div onClick={() => {setShowFriendsTab(true); setShowDiscoveryTab(false); setIsAdminMode(false); setActiveRoom(null);}} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all relative ${showFriendsTab ? 'bg-[#5865f2] text-white shadow-lg' : 'bg-white/5 text-gray-500 hover:bg-[#5865f2] hover:text-white'}`}><FaUserFriends size={22}/>{user.friendRequests?.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#1e1f22] font-black animate-bounce">{user.friendRequests.length}</span>}</div>
                <div onClick={() => {setShowDiscoveryTab(true); setShowFriendsTab(false); setIsAdminMode(false); setActiveRoom(null);}} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all relative ${showDiscoveryTab ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white/5 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}><FaGlobe size={22}/></div>
                <div className="w-8 h-[2px] bg-gray-600 rounded-full opacity-20"></div>
                <div onClick={() => { localStorage.setItem('theme', !darkMode ? 'dark' : 'light'); setDarkMode(!darkMode); }} className="w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer bg-white/10 hover:bg-white/20 transition-all">{darkMode ? <FaSun className="text-yellow-400"/> : <FaMoon/>}</div>
                {user.role === 'admin' && (
                    <div onClick={() => { setIsAdminMode(!isAdminMode); if(!isAdminMode) api.get('/admin/stats').then(res => setStats(res.data)); }}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all ${isAdminMode ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-red-500 shadow-lg'}`}><FaShieldAlt size={22} /></div>
                )}
                {user.role === 'admin' && (
                    <div onClick={() => setShowGroupCreator(true)} className="w-12 h-12 bg-[#23a559] text-white rounded-2xl flex items-center justify-center cursor-pointer hover:rounded-xl transition-all shadow-md"><FaPlusCircle size={22}/></div>
                )}
            </div>

            <div className={`flex flex-col border-r transition-all duration-300 ${isSidebarVisible ? 'w-64' : 'w-0 overflow-hidden'} ${darkMode ? 'bg-[#1e293b]/50 backdrop-blur-xl border-white/5' : 'bg-[#f2f3f5]'}`}>
                <div className="h-12 px-4 flex items-center border-b border-white/5 font-black uppercase text-[11px] tracking-widest opacity-60 italic text-indigo-400">OTT Community</div>
                <div className="flex-1 p-2 mt-2 overflow-y-auto space-y-6 font-bold scrollbar-hide">
                    <div><p className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-2 mb-2 italic">Hội thoại</p>{getRecentChatUsers().map(f => (<div key={f} onClick={() => handleStartDM(f)} className={`p-2.5 rounded-lg flex items-center gap-3 cursor-pointer mb-1 relative transition-all ${activeRoom?.name === f && activeRoom?.isDM ? 'bg-[#5865f2] text-white shadow-lg' : 'hover:bg-white/5 text-gray-400'}`}><div className="relative shrink-0" onClick={(e) => { e.stopPropagation(); handleOpenProfile(f); }}><div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-bold uppercase overflow-hidden border border-white/10">{onlineUsers[f]?.avatar ? <img src={onlineUsers[f].avatar} className="w-full h-full object-cover" alt="" /> : f[0]}</div><FaCircle className={`absolute -bottom-0.5 -right-0.5 text-[8px] border-2 ${darkMode ? 'border-[#1e293b]' : 'border-white'} ${onlineUsers[f] ? 'text-green-500' : 'text-gray-500'}`} /></div><span className="truncate text-sm font-medium italic">@{f}</span>{unreadCounts[`dm_${[user.username, f].sort().join("_")}`] > 0 && <span className="absolute right-2 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full font-black animate-bounce">{unreadCounts[`dm_${[user.username, f].sort().join("_")}`]}</span>}</div>))}</div>
                    <div><p className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-2 mb-2 italic">Cộng đồng</p><div onClick={() => handleSwitchRoom({id:'chung', name:'Chung'})} className={`p-2.5 rounded-lg flex items-center gap-3 cursor-pointer mb-1 relative transition-all ${activeRoom?.id === 'chung' ? 'bg-[#5865f2] text-white shadow-lg' : 'hover:bg-white/5 text-gray-400'}`}><FaHashtag size={14}/> <span className="text-sm uppercase tracking-tighter italic">chung</span></div>{allGroups.filter(g => g.isPublic).map(g => (<div key={g.groupId} onClick={() => handleSwitchRoom({id:g.groupId, name:g.groupName})} className={`p-2.5 rounded-lg flex items-center gap-3 cursor-pointer mb-1 relative transition-all ${activeRoom?.id === g.groupId ? 'bg-[#5865f2] text-white shadow-lg' : 'hover:bg-white/5 text-gray-400'}`}><FaGlobe size={12} className="opacity-60"/> <span className="text-sm truncate uppercase tracking-tighter italic">{g.groupName}</span></div>))}</div>
                    <div><p className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-2 mb-2 italic">Riêng tư</p>{allGroups.filter(g => !g.isPublic && (g.members?.includes(user.username) || g.owner === user.username || user.role === 'admin')).map(g => (<div key={g.groupId} onClick={() => handleSwitchRoom({id:g.groupId, name:g.groupName})} className={`p-2.5 rounded-lg flex items-center gap-3 cursor-pointer mb-1 relative transition-all ${activeRoom?.id===g.groupId ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'hover:bg-white/5 text-gray-400'}`}><FaLock size={10} className={activeRoom?.id === g.groupId ? 'text-white' : 'text-orange-400'}/><span className="truncate text-sm font-medium uppercase tracking-tighter italic">{g.groupName}</span>{unreadCounts[g.groupId] > 0 && <span className="absolute right-2 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full font-black animate-bounce">{unreadCounts[g.groupId]}</span>}</div>))}</div>
                </div>
                <div onClick={() => handleOpenProfile(user.username)} className={`h-16 flex items-center px-3 cursor-pointer border-t border-white/5 transition-colors shrink-0 ${darkMode ? 'bg-[#020617]' : 'bg-[#ebedef]'}`}><div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg overflow-hidden border border-white/20">{user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="" /> : user.displayName[0]}</div><div className="ml-3 truncate flex-1 leading-tight"><div className="text-sm font-black truncate uppercase italic tracking-tighter">{user.displayName}</div><div className="text-[9px] text-green-500 font-black uppercase tracking-widest flex items-center gap-1"><FaCircle size={6}/> Online</div></div><FaSignOutAlt onClick={(e) => { e.stopPropagation(); setUser(null); }} className="text-gray-400 hover:text-red-500 transition-colors" /></div>
            </div>

            <div className={`flex-1 flex flex-col min-w-0 ${darkMode ? 'bg-transparent' : 'bg-white'}`}>
                {showFriendsTab ? (
                    <div className="flex-1 p-8 overflow-y-auto animate-in fade-in slide-in-from-right-4 font-bold text-gray-700 dark:text-gray-200">
                        <p className="text-xs text-cyan-500 font-black uppercase tracking-widest mb-4 italic">Call History: {callHistory.length}</p>
                        <h1 className="text-2xl font-black mb-8 border-b pb-4 text-[#5865f2] uppercase italic tracking-tighter flex items-center gap-3"><FaUserFriends/> Quản lý bạn bè</h1>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            <div><p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-4 italic">Lời mời ({friendRequests.length})</p>{friendRequests.map(u => (<div key={u} className="flex items-center justify-between p-4 rounded-2xl bg-black/5 mb-2 transition-all shadow-sm"><div className="flex items-center gap-3 cursor-pointer" onClick={()=>handleOpenProfile(u)}><div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white font-bold uppercase">{u.substring(0,2)}</div><span className="font-bold">@{u}</span></div><button onClick={() => axios.post('/friends/accept', {me:user.username, friendUname:u}).then(loadData)} className="bg-green-500 text-white p-2.5 rounded-xl hover:scale-110 shadow-lg transition-all"><FaUserCheck/></button></div>))}</div>
                            <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 italic">Bạn bè ({friends.length})</p>{friends.map(u => (<div key={u} className="flex items-center justify-between p-4 rounded-2xl bg-black/5 mb-2 transition-all shadow-sm"><div className="flex items-center gap-3 cursor-pointer" onClick={()=>handleOpenProfile(u)}><div className="relative"><div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold uppercase">{u.substring(0,2)}</div><FaCircle className={`absolute bottom-0 right-0 text-xs ${onlineUsers[u] ? 'text-green-500' : 'text-gray-400'} border-2 border-[#313338]`}/></div><span className="font-bold">@{u}</span></div><button onClick={() => handleStartDM(u)} className="bg-[#5865f2] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:scale-105 shadow-lg flex items-center gap-2"><FaCommentDots/> NHẮN TIN</button></div>))}</div>
                        </div>
                        <div className="mt-10">
                            <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-4 italic">Cuộc gọi gần đây</p>
                            {callHistory.length === 0 ? (
                                <div className="rounded-3xl border border-dashed border-cyan-500/20 bg-cyan-500/5 px-5 py-6 text-sm text-gray-400">
                                    Chua co lich su cuoc goi. Hay thu goi video giua 2 tai khoan de kiem tra luong 1-1.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {callHistory.slice(0, 6).map((call) => {
                                        const peerUsername = getCallPeerUsername(call);
                                        return (
                                            <div key={call.callId} className="flex flex-col gap-3 rounded-3xl border border-black/5 bg-black/5 px-5 py-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                                                <div>
                                                    <p className="text-sm font-black uppercase tracking-tight">@{peerUsername}</p>
                                                    <p className="mt-1 text-xs text-gray-400">
                                                        {callStatusLabelMap[call.status] || call.status || 'Khong ro trang thai'} • {formatCallTime(call.createdAt)}
                                                    </p>
                                                    <p className="mt-1 text-xs text-gray-400">
                                                        Duration {formatCallDuration(call.durationSec)} • End reason {call.endReason || 'n/a'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button onClick={() => handleStartDM(peerUsername)} className="bg-[#5865f2] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:scale-105 shadow-lg flex items-center gap-2">
                                                        <FaCommentDots/> Mở DM
                                                    </button>
                                                    <button onClick={() => startCall(peerUsername, call.roomId)} disabled={isCallBusy} className={`${isCallBusy ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-cyan-500 text-white hover:scale-105'} px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg flex items-center gap-2 transition-all`}>
                                                        <FaVideo/> Gọi lại
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                ) : isAdminMode ? (
                    <AdminStats stats={stats} darkMode={darkMode} />
                ) : activeRoom ? (
                    <>
                        <div className="h-12 border-b border-white/5 flex items-center justify-between px-6 shrink-0 shadow-sm font-black bg-white/2 backdrop-blur-md uppercase italic tracking-tighter">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setIsSidebarVisible(!isSidebarVisible)} className="p-1 hover:bg-black/5 rounded text-indigo-500 transition-all active:scale-90"><FaChevronLeft size={16} className={!isSidebarVisible ? 'rotate-180' : ''}/></button> 
                                {activeRoom.isDM ? <span className="text-indigo-400 text-sm">@ {activeRoom.name}</span> : <span className="text-sm"># {activeRoom.name}</span>}
                            </div>
                            <div className="flex items-center gap-4">
                                {activeRoom.isDM && <button onClick={() => handleVideoCall(activeRoom.name)} disabled={isCallBusy} className={`${isCallBusy ? 'text-gray-300 cursor-not-allowed' : 'text-cyan-500 hover:text-cyan-400'} transition-colors`} title="Gọi video"><FaVideo size={19}/></button>}
                                {isAdminOfGroup && !activeRoom.isDM && activeRoom.id !== 'chung' && (<button onClick={() => setShowGroupSettings(true)} className="text-gray-400 hover:text-[#5865f2] transition-colors"><FaCog size={18}/></button>)}
                                <button onClick={clearChatHistory} className="text-gray-400 hover:text-red-500 transition-colors" title="Xóa lịch sử chat phía bạn"><FaBroom size={20}/></button>
                            </div>
                        </div>

                        {isAdminOfGroup && currentGroup?.pendingRequests?.length > 0 && (
                            <div className="bg-indigo-600/90 backdrop-blur-md text-white px-6 py-3 flex items-center justify-between animate-in slide-in-from-top duration-500 shadow-xl z-10 border-b border-white/10"><div className="flex items-center gap-3 font-black uppercase text-[10px] italic tracking-widest"><FaUserPlus className="animate-bounce" /> {currentGroup.pendingRequests.filter(un => un !== user.username).length} YÊU CẦU GIA NHẬP</div><div className="flex gap-2 overflow-x-auto py-1 max-w-[60%] scrollbar-hide">
                                {currentGroup.pendingRequests.map(uname => {
                                    if (uname === user.username) return null; 
                                    return (
                                        <div key={uname} className="bg-black/40 px-3 py-1.5 rounded-full flex items-center gap-3 border border-white/10 shrink-0 shadow-inner group"><span className="text-[10px] font-black italic">@{uname}</span><div className="flex gap-1"><button onClick={() => handleApprove(currentGroup.groupId, uname, 'accept')} className="bg-emerald-500 p-1.5 rounded-lg hover:scale-110 shadow-lg transition-all"><FaUserCheck size={10}/></button><button onClick={() => handleApprove(currentGroup.groupId, uname, 'reject')} className="bg-red-500 p-1.5 rounded-lg hover:scale-110 shadow-lg transition-all"><FaTimes size={10}/></button></div></div>
                                    )
                                })}
                            </div></div>
                        )}

                        {!isMember ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center animate-in zoom-in-95"><div className="w-24 h-24 bg-orange-500/10 text-orange-500 rounded-[40px] flex items-center justify-center mb-6 shadow-2xl border border-orange-500/20 rotate-12 animate-pulse"><FaLock size={40}/></div><h2 className="text-2xl font-black uppercase mb-2 text-white italic">Khu vực hạn chế</h2><p className="text-gray-500 max-w-sm mb-10 font-bold text-sm italic">Bạn chưa gia nhập vùng đất này. Hãy gửi tín hiệu thâm nhập!</p><button onClick={() => handleRequestJoin(activeRoom.id)} className="bg-indigo-600 text-white px-12 py-5 rounded-2xl font-black uppercase shadow-2xl hover:bg-indigo-500 tracking-[3px] text-xs">Gửi yêu cầu thâm nhập</button></div>
                        ) : (
                            <><div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">{messages.filter(m => (activeRoom.id === 'chung' ? !m.roomId || m.roomId === 'chung' : m.roomId === activeRoom.id)).map((msg) => {const isMe = msg.senderUsername === user.username; const sOnline = onlineUsers[msg.senderUsername]; return (<div key={msg.messageId} className={`flex gap-4 ${isMe ? 'flex-row-reverse text-right' : ''} group animate-in slide-in-from-bottom-2`}><div onClick={() => handleOpenProfile(msg.senderUsername)} className="w-10 h-10 rounded-xl shadow-lg cursor-pointer overflow-hidden shrink-0 border border-white/5 bg-slate-800 transition-all group-hover:scale-105">{sOnline?.avatar ? <img src={sOnline.avatar} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-white font-black uppercase bg-indigo-500">{msg.sender[0]}</div>}</div><div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}><div className="text-[10px] text-gray-500 mb-1.5 font-black uppercase tracking-tighter italic">@{msg.senderUsername} • {msg.time}</div><div className="relative group/bubble">{(!msg.isRevoked && (isMe || user.role === 'admin')) && (<div className={`absolute top-0 flex gap-2 p-1 bg-[#0f172a] border border-white/10 shadow-2xl rounded-xl opacity-0 group-hover/bubble:opacity-100 transition-all z-10 ${isMe ? 'right-full mr-3' : 'left-full ml-3'}`}><button onClick={() => deleteForMe(msg.messageId)} className="p-1 text-gray-400 hover:text-red-500"><FaTrash size={12}/></button><button onClick={() => unsendEverywhere(msg.messageId)} className="p-1 text-indigo-400 hover:text-indigo-300"><FaUndo size={12}/></button></div>)}<div className={`p-4 rounded-2xl text-[14px] font-medium leading-relaxed shadow-lg ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : (darkMode ? 'bg-white/5 text-gray-100 border border-white/5 rounded-tl-none' : 'bg-gray-100 border-tl-none')} ${msg.isRevoked ? 'italic opacity-30 border-2 border-dashed' : ''}`}>{msg.text}{!msg.isRevoked && msg.fileData && (<div className="mt-3">{msg.fileType === 'image' ? <img src={msg.fileData} className="max-w-xs rounded-xl shadow-2xl border border-white/10" /> : <a href={msg.fileData} download={msg.fileName} className="flex items-center gap-3 p-3 bg-black/30 rounded-xl text-xs font-black text-indigo-400"><FaFileAlt/> {msg.fileName}</a>}</div>)}</div></div></div></div>); })}<div ref={scrollRef} /></div><div className="p-6 shrink-0 relative bg-transparent">{showEmojiPicker && <div ref={emojiPickerRef} className="absolute bottom-24 left-6 z-50 shadow-2xl rounded-[30px] overflow-hidden border border-white/10 animate-in zoom-in-75"><EmojiPicker onEmojiClick={(e)=>setMsgInput(p=>p+e.emoji)} theme={darkMode ? Theme.DARK : Theme.LIGHT} /></div>}<div className={`rounded-2xl flex items-center px-4 py-3 border transition-all ${darkMode ? 'bg-white/5 border-white/10 focus-within:border-indigo-500' : 'bg-gray-50 border-gray-200 focus-within:border-indigo-500'}`}><div className="flex gap-4 mr-4 text-gray-500 border-r border-white/5 pr-4"><FaSmile onClick={()=>setShowEmojiPicker(!showEmojiPicker)} className="cursor-pointer hover:text-orange-400 transition-all hover:scale-110" size={20}/><input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} /><FaImage onClick={()=>fileInputRef.current.click()} className="cursor-pointer hover:text-blue-500 transition-all hover:scale-110" size={18}/></div><input value={msgInput} onChange={(e)=>setMsgInput(e.target.value)} onKeyDown={(e)=>e.key==='Enter'&&handleSendText()} placeholder={`Nhập tín hiệu...`} className="bg-transparent w-full outline-none text-sm font-bold text-white uppercase placeholder:text-gray-700" /><button onClick={handleSendText} className={`${msgInput.trim() ? 'text-indigo-500 scale-125' : 'text-gray-600'} ml-4 transition-all transform active:scale-90`}><FaPaperPlane size={20}/></button></div></div></>
                        )}
                    </>
                ) : (
                    <Home user={user} onlineUsers={onlineUsers} allGroups={allGroups} onSwitchTab={(tab) => {
                        if (tab === 'friends') setShowFriendsTab(true);
                        if (tab === 'discovery') setShowDiscoveryTab(true);
                    }} />
                )}
            </div>

            <RightSidebar user={user} onlineUsers={onlineUsers} activeRoom={activeRoom} allGroups={allGroups} handleOpenProfile={handleOpenProfile} handleStartDM={handleStartDM} darkMode={darkMode} isVisible={isRightSidebarVisible && !showSearch} />

            {/* 4. CHÈN MESSAGE SEARCH COMPONENT */}
            {showSearch && <MessageSearch darkMode={darkMode} messages={messages} activeRoom={activeRoom} user={user} onClose={() => setShowSearch(false)} />}

            <CreateChat user={user} isOpen={showGroupCreator} onClose={() => setShowGroupCreator(false)} onCreateGroup={handleCreateGroup} darkMode={darkMode} />
            {showGroupSettings && activeRoom && (
                <div className="fixed inset-0 bg-[#020617]/90 flex items-center justify-center z-[300] backdrop-blur-md p-4 animate-in zoom-in-95"><div className={`w-full max-w-[450px] rounded-[40px] overflow-hidden shadow-2xl border border-white/10 ${darkMode ? 'bg-slate-900' : 'bg-white'}`}><div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-slate-900 to-indigo-900 text-white shadow-xl"><div><h2 className="text-xl font-black uppercase italic tracking-tighter">Cấu hình #{activeRoom.name}</h2><p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest opacity-60 italic uppercase">Admin Control Center</p></div><button onClick={()=>setShowGroupSettings(false)} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-red-500 rounded-full transition-all"><FaTimes/></button></div><div className="p-8 space-y-8 font-bold"><div className="grid grid-cols-2 gap-4"><button onClick={() => handleManageGroup('disable')} className={`p-4 rounded-2xl border-2 flex items-center justify-center gap-2 uppercase text-[10px] font-black transition-all ${currentGroup?.isDisabled ? 'border-emerald-500 text-emerald-500 bg-emerald-500/5 shadow-inner' : 'border-red-500 text-red-500 bg-red-500/5 shadow-inner'}`}>{currentGroup?.isDisabled ? <><FaPlayCircle size={14}/> Mở cửa</> : <><FaPauseCircle size={14}/> Khóa chat</>}</button><button onClick={() => handleManageGroup('delete')} className="p-4 rounded-2xl border-2 border-gray-600 text-gray-400 flex items-center justify-center gap-2 uppercase text-[10px] font-black hover:bg-red-600 hover:text-white transition-all shadow-md"><FaTrash size={14}/> Giải tán</button></div>{!currentGroup?.isPublic && (<div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-hide"><p className="text-[9px] font-black uppercase text-gray-500 tracking-[2px] italic mb-4 border-l-2 border-indigo-500 pl-3 uppercase">Đội ngũ thám hiểm ({currentGroup?.members?.length})</p>{currentGroup?.members?.map(u => (<div key={u} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 group/user hover:border-indigo-500/30 transition-all shadow-sm"><span className="text-sm font-bold italic text-indigo-100 truncate flex-1 uppercase tracking-tighter">@{u} {u === currentGroup.owner && <span className="text-[8px] bg-indigo-500 text-white px-2 py-0.5 rounded-full uppercase ml-1 shadow-md">Host</span>}</span>{u !== currentGroup.owner && <button onClick={() => handleKick(u)} className="text-red-400 opacity-0 group-hover/user:opacity-100 transition-all hover:scale-110 active:text-red-600"><FaUserMinus size={16}/></button>}</div>))}</div>)}</div></div></div>
            )}

            <UserProfileModal 
                key={`${profileModal.isOpen ? 'open' : 'closed'}-${profileModal.username || 'profile-modal'}`}
                isOpen={profileModal.isOpen} 
                onClose={()=>setProfileModal({isOpen:false, username:''})} 
                targetUsername={profileModal.username} 
                currentUser={user} 
                onStartDM={handleStartDM} 
            />
        </div>
    );
};

export default ChatPage;
