

import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { 
    FaHashtag, FaPlusCircle, FaPaperPlane, FaSignOutAlt, FaCircle, 
    FaChevronLeft, FaFileAlt, FaTrash, FaUndo, FaBroom, FaShieldAlt, 
    FaChartBar, FaImage, FaSmile, FaFileMedical, FaMoon, FaSun, 
    FaGlobe, FaCog, FaUserMinus, FaPauseCircle, FaPlayCircle, 
    FaUserFriends, FaCommentDots, FaUserPlus, FaTimes, FaUserCheck, FaLock 
} from 'react-icons/fa';
import UserProfileModal from './user/UserProfileModal';
import AdminStats from './statistics/AdminStats';

const socket = io('http://localhost:3001');

const ChatPage = ({ user, setUser }) => {
    const [msgInput, setMsgInput] = useState('');
    const [messages, setMessages] = useState([]); 
    const [onlineUsers, setOnlineUsers] = useState({});
    const [allGroups, setAllGroups] = useState([]);
    const [activeRoom, setActiveRoom] = useState({ id: 'chung', name: 'Chung' });
    const [unreadCounts, setUnreadCounts] = useState({}); 
    const [friends, setFriends] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const [showFriendsTab, setShowFriendsTab] = useState(false);
    const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showGroupCreator, setShowGroupCreator] = useState(false);
    const [showGroupDiscovery, setShowGroupDiscovery] = useState(false);
    const [showGroupSettings, setShowGroupSettings] = useState(false);
    const [isNewGroupPublic, setIsNewGroupPublic] = useState(false);
    const [profileModal, setProfileModal] = useState({ isOpen: false, username: '' });
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [stats, setStats] = useState(null);
    const scrollRef = useRef(null);
    const fileInputRef = useRef(null);
    const emojiPickerRef = useRef(null);

    const loadData = async () => {
        try {
            const [m, g, u] = await Promise.all([
                axios.get(`http://localhost:3001/api/messages/${user.username}`),
                axios.get(`http://localhost:3001/api/groups/all`),
                axios.get(`http://localhost:3001/api/users/${user.username}`)
            ]);
            const deletedList = u.data.deletedMessages || [];
            const visibleMessages = m.data.filter(msg => !deletedList.includes(msg.messageId));
            setMessages(visibleMessages);
            setAllGroups(g.data);
            setFriends(u.data.friends || []);
            setFriendRequests(u.data.friendRequests || []);
            if (u.data.username === user.username) {
                setUser(prev => ({ ...prev, ...u.data }));
            }
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        if (!user) return;
        socket.emit('user_online', { ...user });
        loadData();
        socket.on('groups_updated', loadData);
        socket.on('receive_message', (d) => {
            setMessages(p => [...p, d]);
            if (d.roomId !== activeRoom.id && d.senderUsername !== user.username) {
                const rId = d.roomId || 'chung';
                setUnreadCounts(prev => ({ ...prev, [rId]: (prev[rId] || 0) + 1 }));
            }
        });
        socket.on('update_user_list', (u) => setOnlineUsers(u));
        socket.on('message_revoked', (id) => setMessages(p => p.map(m => m.messageId === id ? { ...m, text: "Tin nhắn này đã bị thu hồi", isRevoked: true, fileData: null, fileType: null } : m)));
        return () => { socket.off('groups_updated'); socket.off('receive_message'); socket.off('update_user_list'); socket.off('message_revoked'); };
    }, [user.username, activeRoom.id]);

    useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, activeRoom]);

    const handleUpdateSuccess = (updatedData) => {
        if (updatedData && updatedData.username === user.username) {
            setUser(updatedData); 
            socket.emit('user_online', updatedData); 
        }
        loadData();
    };

    const deleteForMe = async (id) => {
        if (window.confirm("Xóa phía bạn?")) {
            await axios.post('http://localhost:3001/api/messages/delete-for-me', { username: user.username, messageId: id });
            setMessages(prev => prev.filter(m => m.messageId !== id));
        }
    };

    const clearChatHistory = async () => {
        if (window.confirm(`Xóa sạch chat tại ${activeRoom.name}?`)) {
            await axios.post('http://localhost:3001/api/messages/clear-history', { username: user.username, roomId: activeRoom.id });
            setMessages(prev => prev.filter(m => m.roomId !== activeRoom.id));
        }
    };

    const unsendEverywhere = (id) => {
        if (window.confirm("Thu hồi tin nhắn?")) socket.emit('revoke_message', id);
    };

    const getRecentChatUsers = () => {
        const chatUsers = new Set();
        messages.forEach(m => { if (m.roomId?.startsWith('dm_')) { const other = m.roomId.replace('dm_', '').split('_').find(p => p !== user.username); if (other) chatUsers.add(other); } });
        friends.forEach(f => chatUsers.add(f));
        return Array.from(chatUsers);
    };

    const handleSwitchRoom = (room) => { setActiveRoom(room); setShowFriendsTab(false); setIsAdminMode(false); setUnreadCounts(prev => ({ ...prev, [room.id]: 0 })); };
    const handleStartDM = (friendUname) => { const dmId = `dm_${[user.username, friendUname].sort().join("_")}`; handleSwitchRoom({ id: dmId, name: friendUname, isDM: true }); };
    const handleOpenProfile = (uname) => setProfileModal({ isOpen: true, username: uname });

    const handleSendText = () => {
        const currentG = allGroups.find(g => g.groupId === activeRoom.id);
        if (currentG?.isDisabled) return alert("Kênh đã khóa!");
        if (!msgInput.trim()) return;
        socket.emit('send_message', { sender: user.displayName, senderUsername: user.username, text: msgInput, roomId: activeRoom.id, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
        setMsgInput(''); setShowEmojiPicker(false);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file || file.size > 2000000) return alert("File quá lớn!");
        const reader = new FileReader();
        reader.onloadend = () => socket.emit('send_message', { sender: user.displayName, senderUsername: user.username, fileData: reader.result, fileType: file.type.split('/')[0], fileName: file.name, roomId: activeRoom.id, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
        reader.readAsDataURL(file);
    };

    const handleCreateGroup = async (name) => {
        if(!name.trim()) return;
        await axios.post('http://localhost:3001/api/groups/create', { groupName: name, owner: user.username, isPublic: isNewGroupPublic });
        setShowGroupCreator(false);
        loadData();
    };

    const handleRequestJoin = async (groupId) => {
        await axios.post('http://localhost:3001/api/groups/request', { groupId, username: user.username });
        alert("Đã gửi yêu cầu!");
        loadData();
    };

    const handleApprove = async (groupId, targetUsername, action) => {
        await axios.post('http://localhost:3001/api/groups/approve', { groupId, targetUsername, action });
        loadData();
    };

    const handleManageGroup = async (action) => {
        if(window.confirm(`Xác nhận?`)) {
            await axios.post('http://localhost:3001/api/groups/manage', { groupId: activeRoom.id, action });
            if(action === 'delete') { setActiveRoom({ id: 'chung', name: 'Chung' }); setShowGroupSettings(false); }
            loadData();
        }
    };

    const handleKick = async (target) => {
        if(window.confirm(`Kích @${target}?`)) {
            await axios.post('http://localhost:3001/api/groups/remove-member', { groupId: activeRoom.id, targetUsername: target });
            loadData();
        }
    };

    const currentGroup = allGroups.find(g => g.groupId === activeRoom.id);
    const isAdminOfGroup = currentGroup?.owner === user.username || user.role === 'admin';
    const isMember = activeRoom.id === 'chung' || activeRoom.id.startsWith('dm_') || currentGroup?.isPublic || currentGroup?.members?.includes(user.username) || user.role === 'admin';

    return (
        <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-500 ${darkMode ? 'bg-[#1e1f22] text-[#dbdee1]' : 'bg-white text-[#313338]'}`}>
            
            {/* Cột 1 */}
            <div className={`w-[72px] flex flex-col items-center py-3 space-y-4 shrink-0 shadow-inner z-20 ${darkMode ? 'bg-[#1e1f22]' : 'bg-[#e3e5e8]'}`}>
                <div className="w-12 h-12 bg-[#5865f2] rounded-2xl flex items-center justify-center text-white font-bold cursor-pointer hover:rounded-xl transition-all shadow-md font-black" onClick={() => handleSwitchRoom({id:'chung', name:'Chung'})}>OTT</div>
                <div onClick={() => {setShowFriendsTab(true); setActiveRoom({id:'friends', name:'Bạn bè'})}} 
                     className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all relative ${showFriendsTab ? 'bg-[#5865f2] text-white' : 'bg-white text-gray-500 hover:bg-[#5865f2] hover:text-white'}`}>
                    <FaUserFriends size={22}/>
                    {friendRequests.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#1e1f22] font-black">{friendRequests.length}</span>}
                </div>
                <div onClick={() => setShowGroupDiscovery(true)} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all bg-white text-[#23a559] hover:bg-[#23a559] hover:text-white shadow-sm`}><FaGlobe size={22}/></div>
                <div className="w-8 h-[2px] bg-gray-600 rounded-full opacity-20"></div>
                <div onClick={() => { localStorage.setItem('theme', !darkMode ? 'dark' : 'light'); setDarkMode(!darkMode); }} className="w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer bg-white/10 hover:bg-white/20 transition-all">{darkMode ? <FaSun className="text-yellow-400"/> : <FaMoon/>}</div>
                {user.role === 'admin' && (
                    <div onClick={() => { setIsAdminMode(!isAdminMode); if(!isAdminMode) axios.get('http://localhost:3001/api/admin/stats').then(res => setStats(res.data)); }}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all ${isAdminMode ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-red-500 shadow-lg'}`}><FaShieldAlt size={22} /></div>
                )}
                {user.role === 'admin' && (
                    <div onClick={() => setShowGroupCreator(true)} className="w-12 h-12 bg-[#23a559] text-white rounded-2xl flex items-center justify-center cursor-pointer hover:rounded-xl transition-all shadow-md"><FaPlusCircle size={22}/></div>
                )}
            </div>

            {/* Cột 2 */}
            <div className={`flex flex-col border-r transition-all duration-300 ${isSidebarVisible ? 'w-64' : 'w-0 overflow-hidden'} ${darkMode ? 'bg-[#2b2d31] border-[#1e1f22]' : 'bg-[#f2f3f5]'}`}>
                <div className="h-12 px-4 flex items-center border-b font-black uppercase text-[11px] tracking-widest opacity-60 italic">OTT Community</div>
                <div className="flex-1 p-2 mt-2 overflow-y-auto space-y-5 font-bold">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-2 italic">Tin nhắn trực tiếp</p>
                        {getRecentChatUsers().map(f => (
                            <div key={f} onClick={() => handleStartDM(f)} className={`p-2.5 rounded-lg flex items-center gap-3 cursor-pointer mb-1 relative transition-all ${activeRoom.name === f && activeRoom.isDM ? 'bg-[#5865f2] text-white font-bold shadow-md' : 'hover:bg-gray-400/20'}`}>
                                <div className="relative shrink-0" onClick={(e) => { e.stopPropagation(); handleOpenProfile(f); }}>
                                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold uppercase overflow-hidden border border-white/20">
                                        {onlineUsers[f]?.avatar ? <img src={onlineUsers[f].avatar} className="w-full h-full object-cover" /> : f.substring(0,2)}
                                    </div>
                                    <FaCircle className={`absolute -bottom-0.5 -right-0.5 text-[8px] border-2 ${darkMode ? 'border-[#2b2d31]' : 'border-white'} ${onlineUsers[f] ? 'text-green-500' : 'text-gray-400'}`} />
                                </div>
                                <span className="truncate text-sm font-medium italic">@{f}</span>
                                {unreadCounts[`dm_${[user.username, f].sort().join("_")}`] > 0 && <span className="absolute right-2 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full font-black animate-bounce">{unreadCounts[`dm_${[user.username, f].sort().join("_")}`]}</span>}
                            </div>
                        ))}
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-2 italic">Kênh cộng đồng</p>
                        <div onClick={() => handleSwitchRoom({id:'chung', name:'Chung'})} className={`p-2.5 rounded-lg flex items-center gap-3 cursor-pointer mb-1 relative transition-all ${activeRoom.id === 'chung' ? 'bg-[#5865f2] text-white font-bold shadow-md' : 'hover:bg-gray-400/20'}`}>
                            <FaHashtag/> chung
                            {unreadCounts['chung'] > 0 && <span className="absolute right-2 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full font-black animate-bounce">{unreadCounts['chung']}</span>}
                        </div>
                        {allGroups.filter(g => g.isPublic).map(g => (
                            <div key={g.groupId} onClick={() => handleSwitchRoom({id:g.groupId, name:g.groupName})} className={`p-2.5 rounded-lg flex items-center gap-3 cursor-pointer mb-1 relative transition-all ${activeRoom.id === g.groupId ? 'bg-[#5865f2] text-white font-bold' : 'hover:bg-gray-400/20'}`}>
                                <FaGlobe size={12} className="opacity-60"/> {g.groupName}
                                {unreadCounts[g.groupId] > 0 && <span className="absolute right-2 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full font-black animate-bounce">{unreadCounts[g.groupId]}</span>}
                            </div>
                        ))}
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-2 italic">Kênh riêng tư</p>
                        {allGroups.filter(g => !g.isPublic).map(g => (
                            <div key={g.groupId} onClick={() => handleSwitchRoom({id:g.groupId, name:g.groupName})} className={`p-2.5 rounded-lg flex items-center gap-3 cursor-pointer mb-1 relative transition-all ${activeRoom.id===g.groupId ? 'bg-orange-500 text-white font-bold' : 'hover:bg-gray-400/20'}`}>
                                <FaLock size={10} className="text-orange-400"/>
                                <span className="truncate text-sm font-medium">{g.groupName}</span>
                                {unreadCounts[g.groupId] > 0 && <span className="absolute right-2 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full font-black animate-bounce">{unreadCounts[g.groupId]}</span>}
                            </div>
                        ))}
                    </div>
                </div>
                <div onClick={() => handleOpenProfile(user.username)} className={`h-16 flex items-center px-3 cursor-pointer border-t transition-colors shrink-0 ${darkMode ? 'bg-[#232428]' : 'bg-[#ebedef]'}`}>
                    <div className="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-bold shadow-sm overflow-hidden border-2 border-white">
                        {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user.displayName.substring(0,2)}
                    </div>
                    <div className="ml-3 truncate flex-1 leading-tight"><div className="text-sm font-black truncate uppercase italic tracking-tighter">{user.displayName}</div><div className="text-[10px] text-green-500 font-black italic">● Online</div></div>
                    <FaSignOutAlt onClick={(e) => { e.stopPropagation(); setUser(null); }} className="text-gray-400 hover:text-red-500 ml-2" />
                </div>
            </div>

            {/* Cột 3 */}
            <div className={`flex-1 flex flex-col min-w-0 ${darkMode ? 'bg-[#313338]' : 'bg-white'}`}>
                {showFriendsTab ? (
                    <div className="flex-1 p-8 overflow-y-auto animate-in fade-in slide-in-from-right-4 font-bold text-gray-700 dark:text-gray-200">
                        <h1 className="text-2xl font-black mb-8 border-b pb-4 text-[#5865f2] uppercase italic tracking-tighter flex items-center gap-3"><FaUserFriends/> Quản lý bạn bè</h1>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            <div><p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-4 italic">Lời mời ({friendRequests.length})</p>{friendRequests.map(u => (<div key={u} className="flex items-center justify-between p-4 rounded-2xl bg-black/5 mb-2 transition-all shadow-sm"><div className="flex items-center gap-3 cursor-pointer" onClick={()=>handleOpenProfile(u)}><div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white font-bold uppercase">{u.substring(0,2)}</div><span className="font-bold">@{u}</span></div><button onClick={() => axios.post('http://localhost:3001/api/friends/accept', {me:user.username, friendUname:u}).then(loadData)} className="bg-green-500 text-white p-2.5 rounded-xl hover:scale-110 shadow-lg transition-all"><FaUserCheck/></button></div>))}</div>
                            <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 italic">Bạn bè ({friends.length})</p>{friends.map(u => (<div key={u} className="flex items-center justify-between p-4 rounded-2xl bg-black/5 mb-2 transition-all shadow-sm"><div className="flex items-center gap-3 cursor-pointer" onClick={()=>handleOpenProfile(u)}><div className="relative"><div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold uppercase">{u.substring(0,2)}</div><FaCircle className={`absolute bottom-0 right-0 text-xs ${onlineUsers[u] ? 'text-green-500' : 'text-gray-400'} border-2 border-[#313338]`}/></div><span className="font-bold">@{u}</span></div><button onClick={() => handleStartDM(u)} className="bg-[#5865f2] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:scale-105 shadow-lg flex items-center gap-2"><FaCommentDots/> NHẮN TIN</button></div>))}</div>
                        </div>
                    </div>
                ) : isAdminMode ? (
                    <AdminStats stats={stats} darkMode={darkMode} /> // SỬ DỤNG COMPONENT ĐÃ TÁCH
                ) : (
                    <>
                        <div className="h-12 border-b flex items-center justify-between px-6 shrink-0 shadow-sm font-black">
                            <div className="flex items-center gap-3 font-black text-sm uppercase tracking-tighter italic"><button onClick={() => setIsSidebarVisible(!isSidebarVisible)} className="p-1 hover:bg-black/5 rounded"><FaChevronLeft size={16} className={!isSidebarVisible ? 'rotate-180 transition-all' : ''}/></button> {activeRoom.isDM ? `@ ${activeRoom.name}` : `# ${activeRoom.name}`}</div>
                            <div className="flex items-center gap-4">
                                {isAdminOfGroup && !activeRoom.isDM && activeRoom.id !== 'chung' && (<button onClick={() => setShowGroupSettings(true)} className="text-gray-400 hover:text-[#5865f2] transition-colors"><FaCog size={18}/></button>)}
                                <button onClick={clearChatHistory} className="text-gray-400 hover:text-red-500 transition-colors" title="Xóa lịch sử chat phía bạn"><FaBroom size={20}/></button>
                            </div>
                        </div>

                        {isAdminOfGroup && currentGroup?.pendingRequests?.length > 0 && (
                            <div className="bg-[#5865f2] text-white px-6 py-3 flex items-center justify-between animate-in slide-in-from-top duration-300 shadow-lg">
                                <div className="flex items-center gap-3"><FaUserPlus className="animate-bounce" /><span className="text-[10px] font-black uppercase italic tracking-wider">{currentGroup.pendingRequests.length} yêu cầu mới</span></div>
                                <div className="flex gap-2 overflow-x-auto max-w-[60%] py-1">
                                    {currentGroup.pendingRequests.map(uname => (
                                        <div key={uname} className="bg-white/20 px-3 py-1.5 rounded-full flex items-center gap-2 shrink-0 border border-white/30">
                                            <span className="text-[10px] font-black italic">@{uname}</span>
                                            <button onClick={() => handleApprove(currentGroup.groupId, uname, 'accept')} className="bg-green-500 p-1 rounded-full hover:scale-110"><FaUserCheck size={10}/></button>
                                            <button onClick={() => handleApprove(currentGroup.groupId, uname, 'reject')} className="bg-red-500 p-1 rounded-full hover:scale-110"><FaTimes size={10}/></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!isMember ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center animate-in zoom-in-95">
                                <div className="w-24 h-24 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mb-6 shadow-inner"><FaLock size={48}/></div>
                                <h2 className="text-2xl font-black uppercase mb-2">Phòng chat riêng tư</h2>
                                <p className="text-gray-400 max-w-sm mb-8 font-bold text-sm">Bạn cần được quản trị viên duyệt để tham gia phòng này.</p>
                                {currentGroup?.pendingRequests?.includes(user.username) ? (
                                    <div className="bg-orange-500 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs animate-bounce shadow-lg">Đang chờ duyệt...</div>
                                ) : (
                                    <button onClick={() => handleRequestJoin(activeRoom.id)} className="bg-[#5865f2] text-white px-10 py-4 rounded-2xl font-black uppercase shadow-xl hover:scale-105 active:scale-95 transition-all">Gửi yêu cầu gia nhập</button>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                                    {messages.filter(m => (activeRoom.id === 'chung' ? !m.roomId || m.roomId === 'chung' : m.roomId === activeRoom.id)).map((msg) => {
                                        const isMe = msg.senderUsername === user.username;
                                        const sOnline = onlineUsers[msg.senderUsername];
                                        const isRevoked = msg.isRevoked || msg.text?.includes("đã bị thu hồi");
                                        return (
                                            <div key={msg.messageId} className={`flex gap-4 ${isMe ? 'flex-row-reverse text-right' : ''} group animate-in slide-in-from-bottom-2`}>
                                                <div onClick={() => handleOpenProfile(msg.senderUsername)} className="w-11 h-11 rounded-full shadow-sm cursor-pointer overflow-hidden shrink-0 border-2 border-white bg-indigo-500 transition-transform active:scale-90">
                                                    {sOnline?.avatar ? <img src={sOnline.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white font-bold uppercase">{msg.sender.substring(0,2)}</div>}
                                                </div>
                                                <div className={`max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                    <div className="text-[11px] text-gray-400 mb-1 font-bold italic" onClick={() => handleOpenProfile(msg.senderUsername)}><b className="hover:underline cursor-pointer">@{msg.senderUsername}</b> • {msg.time}</div>
                                                    <div className="relative group/bubble">
                                                        {!isRevoked && (
                                                            <div className={`absolute top-0 flex gap-2 p-1.5 bg-white dark:bg-[#1e1f22] border shadow-xl rounded-xl opacity-0 group-hover/bubble:opacity-100 transition-all z-10 ${isMe ? 'right-full mr-3' : 'left-full ml-3'}`}>
                                                                <button onClick={() => deleteForMe(msg.messageId)} className="p-1 text-gray-400 hover:text-red-500"><FaTrash size={14}/></button>
                                                                {(isMe || user.role === 'admin') && <button onClick={() => unsendEverywhere(msg.messageId)} className={`${user.role === 'admin' && !isMe ? 'text-red-500 font-bold' : 'text-blue-500'}`}><FaUndo size={14}/></button>}
                                                            </div>
                                                        )}
                                                        <div className={`p-4 rounded-2xl text-[15px] font-medium ${isMe ? 'bg-[#5865f2] text-white rounded-tr-none' : (darkMode ? 'bg-[#383a40] text-[#dbdee1] border-[#1e1f22] rounded-tl-none' : 'bg-white border text-gray-800 rounded-tl-none')} ${isRevoked ? 'italic opacity-50 border-2 border-dashed shadow-none bg-transparent' : 'shadow-sm transition-all hover:shadow-md'}`}>
                                                            {msg.text}
                                                            {!isRevoked && msg.fileData && (
                                                                <div className="mt-3">{msg.fileType === 'image' ? <img src={msg.fileData} className="max-w-xs rounded-xl shadow-md border" /> : <a href={msg.fileData} download={msg.fileName} className="flex items-center gap-3 p-3 bg-black/10 rounded-xl text-sm border font-black text-blue-500 hover:bg-black/20 transition-all shadow-inner"><FaFileAlt/> {msg.fileName}</a>}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={scrollRef} />
                                </div>
                                <div className={`p-6 border-t shrink-0 relative ${darkMode ? 'bg-[#313338]' : 'bg-white'}`}>
                                    {showEmojiPicker && <div ref={emojiPickerRef} className="absolute bottom-24 left-6 z-50 shadow-2xl rounded-2xl overflow-hidden border border-gray-700 animate-in slide-in-from-bottom-5"><EmojiPicker onEmojiClick={(e)=>setMsgInput(p=>p+e.emoji)} theme={darkMode ? Theme.DARK : Theme.LIGHT} /></div>}
                                    <div className={`rounded-2xl flex items-center px-5 py-3 shadow-inner border transition-all ${darkMode ? 'bg-[#383a40] border-[#1e1f22]' : 'bg-[#ebedef]'}`}>
                                        <div className="flex gap-4 mr-4 text-gray-400 border-r pr-4 border-gray-300">
                                            <FaSmile onClick={()=>setShowEmojiPicker(!showEmojiPicker)} className="cursor-pointer hover:text-yellow-500 transition-colors" size={22}/>
                                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                                            <FaImage onClick={()=>fileInputRef.current.click()} className="cursor-pointer hover:text-blue-500 transition-colors" size={20}/>
                                        </div>
                                        <input value={msgInput} onChange={(e)=>setMsgInput(e.target.value)} onKeyDown={(e)=>e.key==='Enter'&&handleSendText()} placeholder={`Nhắn vào ${activeRoom.isDM ? '@' : '#'}${activeRoom.name}...`} className="bg-transparent w-full outline-none text-[15px] font-medium" />
                                        <button onClick={handleSendText} className={`${msgInput.trim() ? 'text-[#5865f2] scale-125 rotate-[-10deg]' : 'text-gray-400'} ml-4 transition-all transform active:scale-90`}><FaPaperPlane size={22}/></button>
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>

            {/* Cột 4 */}
            <div className={`w-64 border-l hidden lg:flex flex-col p-5 overflow-y-auto shrink-0 shadow-inner ${darkMode ? 'bg-[#2b2d31] border-[#1e1f22]' : 'bg-[#f2f3f5]'}`}>
                <p className="text-[10px] font-black uppercase mb-5 tracking-widest italic border-b pb-2 text-gray-400 text-center opacity-60">Thành viên Trực tuyến — {Object.keys(onlineUsers).length}</p>
                {Object.values(onlineUsers).map((u, i) => (
                    <div key={i} onClick={() => handleOpenProfile(u.username)} className={`flex items-center space-x-4 mb-4 p-2 rounded-2xl cursor-pointer group hover:bg-black/5 transition-all shadow-sm`}>
                        <div className="relative shrink-0">
                            <div className="w-10 h-10 bg-[#5865f2] rounded-full flex items-center justify-center font-black text-white shadow-sm uppercase overflow-hidden border-2 border-white group-hover:scale-110 transition-transform">
                                {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : u.displayName.substring(0,2)}
                            </div>
                            <FaCircle className={`absolute -bottom-0.5 -right-0.5 text-[10px] border-2 ${darkMode ? 'border-[#2b2d31]' : 'border-white'} text-green-500`} />
                        </div>
                        <div className={`truncate text-sm font-black italic ${darkMode ? 'text-[#dbdee1]' : 'text-gray-700'}`}>{u.displayName}</div>
                    </div>
                ))}
            </div>

            {/* MODALS */}
            {showGroupDiscovery && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[300] backdrop-blur-sm p-4 animate-in fade-in">
                    <div className={`w-full max-w-[500px] rounded-[32px] p-8 shadow-2xl overflow-y-auto max-h-[80vh] ${darkMode ? 'bg-[#313338] text-white border border-gray-700' : 'bg-white'}`}>
                        <div className="flex justify-between items-center mb-6 text-[#5865f2] font-black italic uppercase text-2xl tracking-tighter"><h2>Khám phá OTT</h2><button onClick={()=>setShowGroupDiscovery(false)} className="text-gray-400"><FaTimes size={24}/></button></div>
                        <div className="space-y-3 font-bold">
                            {allGroups.map(g => {
                                const isJoined = g.members?.includes(user.username) || g.owner === user.username;
                                return (
                                    <div key={g.groupId} className={`flex items-center justify-between p-4 border-2 rounded-2xl mb-2 transition-all ${darkMode ? 'border-[#3f4147] hover:bg-[#3f4147]' : 'border-gray-50 hover:bg-white hover:shadow-md'}`}>
                                        <div><p className="font-black text-lg flex items-center gap-2 italic uppercase text-[#5865f2] tracking-tighter">#{g.groupName} {g.isPublic ? <FaGlobe size={14} className="opacity-50"/> : <FaLock size={12} className="text-orange-400"/>}</p><p className="text-[10px] text-gray-400 italic">Chủ phòng: @{g.owner}</p></div>
                                        {isJoined ? (
                                            <span className="text-green-500 text-[10px] font-black uppercase bg-green-50 px-3 py-1 rounded-full"><FaUserCheck className="inline mr-1"/> Thành viên</span>
                                        ) : g.pendingRequests?.includes(user.username) ? (
                                            <span className="text-orange-500 text-[10px] font-black italic uppercase px-3 py-1 rounded-full border border-orange-200">Đang chờ...</span>
                                        ) : (
                                            <button onClick={()=>handleRequestJoin(g.groupId)} className="bg-[#5865f2] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg transition-all hover:scale-105">Gia nhập</button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {showGroupCreator && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[300] backdrop-blur-sm p-4 animate-in zoom-in">
                    <div className={`w-[400px] rounded-[32px] p-8 shadow-2xl ${darkMode ? 'bg-[#313338] text-white' : 'bg-white text-gray-800'}`}>
                        <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-black uppercase italic tracking-tighter text-[#5865f2]">Tạo phòng mới</h2><button onClick={()=>setShowGroupCreator(false)} className="text-gray-400"><FaTimes size={24}/></button></div>
                        <div className="flex gap-4 mb-6">
                            <div onClick={()=>setIsNewGroupPublic(true)} className={`flex-1 p-4 rounded-2xl border-2 cursor-pointer transition-all text-center ${isNewGroupPublic ? 'border-[#5865f2] bg-[#5865f2]/10' : 'border-gray-200 opacity-50'}`}><FaGlobe className="mx-auto mb-2 text-xl text-[#5865f2]"/><p className="text-[10px] font-black uppercase">Công khai</p></div>
                            <div onClick={()=>setIsNewGroupPublic(false)} className={`flex-1 p-4 rounded-2xl border-2 cursor-pointer transition-all text-center ${!isNewGroupPublic ? 'border-orange-500 bg-orange-500/10' : 'border-gray-200 opacity-50'}`}><FaLock className="mx-auto mb-2 text-xl text-orange-500"/><p className="text-[10px] font-black uppercase">Riêng tư</p></div>
                        </div>
                        <input id="gnInput" className="w-full border-2 p-4 rounded-2xl mb-6 outline-none font-black text-center" placeholder="Tên phòng..."/>
                        <button onClick={() => handleCreateGroup(document.getElementById('gnInput').value)} className="w-full text-white py-4 rounded-2xl font-black shadow-lg bg-[#5865f2] uppercase tracking-widest text-[10px] transform active:scale-95 transition-all">KHỞI TẠO NGAY</button>
                    </div>
                </div>
            )}

            {showGroupSettings && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[300] backdrop-blur-sm p-4 animate-in fade-in">
                    <div className={`w-full max-w-[450px] rounded-[32px] overflow-hidden shadow-2xl ${darkMode ? 'bg-[#313338] text-white' : 'bg-white text-gray-800'}`}>
                        <div className="p-6 border-b flex justify-between items-center bg-gray-900 text-white"><h2 className="text-xl font-black uppercase italic tracking-tighter">Cấu hình #{activeRoom.name}</h2><button onClick={()=>setShowGroupSettings(false)}><FaTimes/></button></div>
                        <div className="p-8 space-y-6 font-bold">
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => handleManageGroup('disable')} className={`p-4 rounded-2xl border-2 flex items-center justify-center gap-2 uppercase text-[10px] font-black ${currentGroup?.isDisabled ? 'border-green-500 text-green-500 bg-green-500/5' : 'border-red-500 text-red-500 bg-red-500/5'}`}>{currentGroup?.isDisabled ? <><FaPlayCircle/> Mở chat</> : <><FaPauseCircle/> Khóa chat</>}</button>
                                <button onClick={() => handleManageGroup('delete')} className="p-4 rounded-2xl border-2 border-gray-400 text-gray-400 flex items-center justify-center gap-2 uppercase text-[10px] font-black hover:bg-red-500 hover:text-white transition-all"><FaTrash/> Giải tán</button>
                            </div>
                            {!currentGroup?.isPublic && (
                                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                    <p className="text-[10px] uppercase text-gray-400 mb-3 italic">Thành viên ({currentGroup?.members?.length})</p>
                                    {currentGroup?.members?.map(u => (
                                        <div key={u} className="flex items-center justify-between p-3 rounded-xl bg-black/5 border border-white/5">
                                            <span className="text-sm">@{u} {u === currentGroup.owner && <span className="text-[8px] bg-indigo-500 text-white px-2 py-0.5 rounded-full uppercase ml-1">Chủ</span>}</span>
                                            {u !== currentGroup.owner && <button onClick={() => handleKick(u)} className="text-red-400 hover:text-red-600 transition-colors"><FaUserMinus size={16}/></button>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <UserProfileModal 
                isOpen={profileModal.isOpen} 
                onClose={()=>setProfileModal({isOpen:false, username:''})} 
                targetUsername={profileModal.username} 
                currentUser={user} 
                onUpdateSuccess={handleUpdateSuccess} 
                onStartDM={handleStartDM} 
            />
        </div>
    );
};

export default ChatPage;