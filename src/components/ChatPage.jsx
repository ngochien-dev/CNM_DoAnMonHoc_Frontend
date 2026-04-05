import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { 
    FaHashtag, FaPlusCircle, FaPaperPlane, FaSignOutAlt, FaCircle, 
    FaChevronDown, FaChevronRight, FaChevronLeft, FaFileAlt, FaTrash, FaUndo, FaBroom,
    FaShieldAlt, FaChartBar, FaImage, FaSmile, FaFileMedical, FaVideo,
    FaMoon, FaSun, FaUsers, FaUserCheck, FaTimes, FaLock, FaGlobe,
    FaCog, FaUserMinus, FaBan, FaPauseCircle, FaPlayCircle, FaUserFriends, FaCommentDots, FaUserPlus, FaSearch
} from 'react-icons/fa';
import UserProfileModal from './UserProfileModal';

const socket = io('http://localhost:3001');
const COLORS = ['#5865F2', '#23A559', '#FEE75C', '#EB459E', '#ED4245'];

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
    const [searchUser, setSearchUser] = useState('');
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
            setMessages(m.data);
            setAllGroups(g.data);
            setFriends(u.data.friends || []);
            setFriendRequests(u.data.friendRequests || []);
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
    }, [user, activeRoom.id]);

    useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, activeRoom, isAdminMode]);

    // LOGIC: Tìm những người mình đã từng nhắn tin (không cần kết bạn)
    const getRecentChatUsers = () => {
        const chatUsers = new Set();
        messages.forEach(m => {
            if (m.roomId?.startsWith('dm_')) {
                const parts = m.roomId.replace('dm_', '').split('_');
                const other = parts.find(p => p !== user.username);
                if (other) chatUsers.add(other);
            }
        });
        // Gộp với danh sách bạn bè (nếu muốn hiện cả 2)
        friends.forEach(f => chatUsers.add(f));
        return Array.from(chatUsers);
    };

    const handleSwitchRoom = (room) => {
        setActiveRoom(room);
        setShowFriendsTab(false);
        setIsAdminMode(false);
        setUnreadCounts(prev => ({ ...prev, [room.id]: 0 }));
    };

    const handleStartDM = (friendUname) => {
        const dmId = `dm_${[user.username, friendUname].sort().join("_")}`;
        handleSwitchRoom({ id: dmId, name: friendUname, isDM: true });
    };

    const handleOpenProfile = (uname) => setProfileModal({ isOpen: true, username: uname });

    const handleSendFriendRequest = async () => {
        if (!searchUser.trim() || searchUser === user.username) return alert("Username không hợp lệ!");
        await axios.post('http://localhost:3001/api/friends/request', { fromUser: user.username, toUser: searchUser });
        alert(`Đã gửi lời mời cho @${searchUser}`);
        setSearchUser('');
    };

    const handleSendText = () => {
        const currentG = allGroups.find(g => g.groupId === activeRoom.id);
        if (currentG?.isDisabled) return alert("Kênh đã khóa!");
        if (!msgInput.trim()) return;
        socket.emit('send_message', { sender: user.displayName, senderUsername: user.username, text: msgInput, roomId: activeRoom.id, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
        setMsgInput(''); setShowEmojiPicker(false);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2000000) return alert("File quá lớn!");
        const reader = new FileReader();
        reader.onloadend = () => socket.emit('send_message', { sender: user.displayName, senderUsername: user.username, fileData: reader.result, fileType: file.type.split('/')[0], fileName: file.name, roomId: activeRoom.id, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
        reader.readAsDataURL(file);
    };

    const deleteForMe = (id) => {
        if (window.confirm("Xóa phía bạn?")) setMessages(prev => prev.filter(m => m.messageId !== id));
    };

    const unsendEverywhere = (id) => {
        const isMe = messages.find(m => m.messageId === id)?.senderUsername === user.username;
        if (window.confirm(isMe ? "Thu hồi tin nhắn?" : "Admin: Thu hồi tin nhắn người dùng?")) socket.emit('revoke_message', id);
    };

    const handleApprove = async (groupId, targetUsername, action) => {
        await axios.post('http://localhost:3001/api/groups/approve', { groupId, targetUsername, action });
        socket.emit('admin_update_group');
    };

    const handleRequestJoin = async (groupId) => {
        await axios.post('http://localhost:3001/api/groups/request', { groupId, username: user.username });
        socket.emit('request_join_group');
        alert("Đã gửi yêu cầu!");
    };

    const handleCreateGroup = async (name) => {
        await axios.post('http://localhost:3001/api/groups/create', { groupName: name, owner: user.username, isPublic: isNewGroupPublic });
        socket.emit('admin_update_group');
        setShowGroupCreator(false);
    };

    const handleManageGroup = async (action) => {
        if(window.confirm(`Xác nhận?`)) {
            await axios.post('http://localhost:3001/api/groups/manage', { groupId: activeRoom.id, action });
            if(action === 'delete') { setActiveRoom({ id: 'chung', name: 'Chung' }); setShowGroupSettings(false); }
            socket.emit('admin_update_group');
        }
    };

    const handleKick = async (target) => {
        if(window.confirm(`Kích @${target}?`)) {
            await axios.post('http://localhost:3001/api/groups/remove-member', { groupId: activeRoom.id, targetUsername: target });
            socket.emit('admin_update_group');
        }
    };

    const currentGroup = allGroups.find(g => g.groupId === activeRoom.id);
    const isAdminOfGroup = currentGroup?.owner === user.username || user.role === 'admin';
    const isMember = activeRoom.id === 'chung' || activeRoom.id.startsWith('dm_') || currentGroup?.isPublic || currentGroup?.members?.includes(user.username);

    return (
        <div className={`flex h-screen overflow-hidden font-sans ${darkMode ? 'bg-[#1e1f22] text-[#dbdee1]' : 'bg-white text-[#313338]'}`}>
            
            {/* Cột 1 */}
            <div className={`w-[72px] flex flex-col items-center py-3 space-y-4 shrink-0 shadow-inner z-20 ${darkMode ? 'bg-[#1e1f22]' : 'bg-[#e3e5e8]'}`}>
                <div className="w-12 h-12 bg-[#5865f2] rounded-2xl flex items-center justify-center text-white font-bold cursor-pointer hover:rounded-xl transition-all shadow-md" onClick={() => handleSwitchRoom({id:'chung', name:'Chung'})}>OTT</div>
                <div onClick={() => {setShowFriendsTab(true); setActiveRoom({id:'friends', name:'Bạn bè'})}} 
                     className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all relative ${showFriendsTab ? 'bg-[#5865f2] text-white' : 'bg-white text-gray-500 hover:bg-[#5865f2] hover:text-white'}`}>
                    <FaUserFriends size={22}/>
                    {friendRequests.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#1e1f22] font-black">{friendRequests.length}</span>}
                </div>
                <div className="w-8 h-[2px] bg-gray-600 rounded-full"></div>
                <div onClick={() => setDarkMode(!darkMode)} className="w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer bg-white/10 hover:bg-white/20 transition-all">{darkMode ? <FaSun className="text-yellow-400"/> : <FaMoon/>}</div>
                {user.role === 'admin' && (
                    <div onClick={() => { setIsAdminMode(!isAdminMode); if(!isAdminMode) axios.get('http://localhost:3001/api/admin/stats').then(res => setStats(res.data)); }}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all ${isAdminMode ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-red-500 shadow-lg'}`}><FaShieldAlt size={22} /></div>
                )}
                <div onClick={() => setShowGroupCreator(true)} className="w-12 h-12 bg-[#23a559] text-white rounded-2xl flex items-center justify-center cursor-pointer hover:rounded-xl transition-all shadow-md"><FaPlusCircle size={22}/></div>
            </div>

            {/* Cột 2 */}
            <div className={`flex flex-col border-r transition-all duration-300 ${isSidebarVisible ? 'w-64' : 'w-0 overflow-hidden'} ${darkMode ? 'bg-[#2b2d31] border-[#1e1f22]' : 'bg-[#f2f3f5]'}`}>
                <div className="h-12 px-4 flex items-center border-b font-black uppercase text-[11px] tracking-widest opacity-60">OTT Community</div>
                <div className="flex-1 p-2 mt-2 overflow-y-auto space-y-5">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-2 italic">Tin nhắn trực tiếp</p>
                        {/* FIX 1: HIỆN CẢ NHỮNG NGƯỜI CHƯA KẾT BẠN NHƯNG ĐÃ NHẮN TIN */}
                        {getRecentChatUsers().map(f => (
                            <div key={f} onClick={() => handleStartDM(f)} className={`p-2.5 rounded-lg flex items-center gap-3 cursor-pointer mb-1 relative transition-all ${activeRoom.name === f && activeRoom.isDM ? 'bg-[#5865f2] text-white font-bold' : 'hover:bg-gray-400/20'}`}>
                                <div className="relative shrink-0" onClick={(e) => { e.stopPropagation(); handleOpenProfile(f); }}>
                                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold uppercase">{f.substring(0,2)}</div>
                                    <FaCircle className={`absolute -bottom-0.5 -right-0.5 text-[8px] border-2 ${darkMode ? 'border-[#2b2d31]' : 'border-white'} ${onlineUsers[f] ? 'text-green-500' : 'text-gray-400'}`} />
                                </div>
                                <span className="truncate text-sm font-medium">{f}</span>
                                {unreadCounts[`dm_${[user.username, f].sort().join("_")}`] > 0 && <span className="absolute right-2 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full font-black animate-bounce">{unreadCounts[`dm_${[user.username, f].sort().join("_")}`]}</span>}
                            </div>
                        ))}
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-2 italic">Kênh cộng đồng</p>
                        <div onClick={() => handleSwitchRoom({id:'chung', name:'Chung'})} className={`p-2.5 rounded-lg flex items-center gap-3 cursor-pointer mb-1 relative transition-all ${activeRoom.id === 'chung' ? 'bg-[#5865f2] text-white font-bold' : 'hover:bg-gray-400/20'}`}>
                            <FaHashtag/> chung
                            {unreadCounts['chung'] > 0 && <span className="absolute right-2 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full font-black animate-bounce">{unreadCounts['chung']}</span>}
                        </div>
                        {allGroups.filter(g => g.isPublic).map(g => (
                            <div key={g.groupId} onClick={() => handleSwitchRoom({id:g.groupId, name:g.groupName})} className={`p-2.5 rounded-lg flex items-center gap-3 cursor-pointer mb-1 relative transition-all ${activeRoom.id === g.groupId ? 'bg-[#5865f2] text-white font-bold' : 'hover:bg-gray-400/20'}`}>
                                <FaGlobe size={12}/> {g.groupName}
                                {unreadCounts[g.groupId] > 0 && <span className="absolute right-2 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full font-black animate-bounce">{unreadCounts[g.groupId]}</span>}
                            </div>
                        ))}
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-2 italic">Kênh riêng tư</p>
                        {allGroups.filter(g => !g.isPublic).map(g => {
                            const isJoined = g.members?.includes(user.username);
                            return (
                                <div key={g.groupId} onClick={() => handleSwitchRoom({id:g.groupId, name:g.groupName})} className={`p-2.5 rounded-lg flex items-center gap-3 cursor-pointer mb-1 relative transition-all ${activeRoom.id===g.groupId ? 'bg-orange-500 text-white font-bold' : 'hover:bg-gray-400/20'}`}>
                                    <FaLock size={10} className={isJoined ? 'opacity-50' : 'text-orange-400'}/>
                                    <span className="truncate text-sm font-medium">{g.groupName}</span>
                                    {unreadCounts[g.groupId] > 0 && <span className="absolute right-2 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full font-black animate-bounce">{unreadCounts[g.groupId]}</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div onClick={() => handleOpenProfile(user.username)} className={`h-16 flex items-center px-3 cursor-pointer border-t transition-colors shrink-0 ${darkMode ? 'bg-[#232428]' : 'bg-[#ebedef]'}`}>
                    <div className="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-bold shadow-sm overflow-hidden border-2 border-white">{user.avatar ? <img src={user.avatar} className="w-full h-full object-cover"/> : user.displayName.substring(0,2)}</div>
                    <div className="ml-3 truncate flex-1 leading-tight"><div className="text-xs font-bold truncate">{user.displayName}</div><div className="text-[10px] text-green-500 uppercase font-black tracking-tighter">● Online</div></div>
                    <FaSignOutAlt onClick={(e) => { e.stopPropagation(); setUser(null); }} className="text-gray-400 hover:text-red-500 ml-2" />
                </div>
            </div>

            {/* Cột 3 */}
            <div className={`flex-1 flex flex-col min-w-0 ${darkMode ? 'bg-[#313338]' : 'bg-white'}`}>
                {showFriendsTab ? (
                    <div className="flex-1 p-8 overflow-y-auto animate-in fade-in slide-in-from-right-4">
                        <div className="flex justify-between items-center mb-8 border-b pb-4">
                            <h1 className="text-2xl font-black flex items-center gap-3 uppercase italic text-[#5865f2] tracking-tighter"><FaUserFriends/> Quản lý bạn bè</h1>
                            <div className="flex gap-2">
                                <div className={`flex items-center px-4 py-2 rounded-xl border-2 ${darkMode ? 'bg-[#1e1f22] border-gray-700' : 'bg-gray-100'}`}><FaSearch className="text-gray-400 mr-2" size={14}/><input value={searchUser} onChange={(e)=>setSearchUser(e.target.value)} placeholder="Username bạn bè..." className="bg-transparent outline-none text-sm font-bold w-48"/></div>
                                <button onClick={handleSendFriendRequest} className="bg-[#23a559] text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-green-500/20 transition-all"><FaUserPlus/> KẾT BẠN</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            <div><p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-4 italic font-black">Lời mời ({friendRequests.length})</p>{friendRequests.map(u => (<div key={u} className="flex items-center justify-between p-4 rounded-2xl bg-black/5 mb-2 border-2 border-transparent hover:border-[#5865f2] transition-all"><div className="flex items-center gap-3 cursor-pointer" onClick={()=>handleOpenProfile(u)}><div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white font-bold uppercase">{u.substring(0,2)}</div><span className="font-bold">@{u}</span></div><button onClick={() => axios.post('http://localhost:3001/api/friends/accept', {me:user.username, friendUname:u}).then(loadData)} className="bg-green-500 text-white p-2.5 rounded-xl hover:scale-110 shadow-lg transition-all"><FaUserCheck/></button></div>))}</div>
                            <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 italic font-black">Bạn bè</p>{friends.map(u => (<div key={u} className="flex items-center justify-between p-4 rounded-2xl bg-black/5 mb-2 border-2 border-transparent"><div className="flex items-center gap-3 cursor-pointer" onClick={()=>handleOpenProfile(u)}><div className="relative"><div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold uppercase">{u.substring(0,2)}</div><FaCircle className={`absolute bottom-0 right-0 text-xs ${onlineUsers[u] ? 'text-green-500' : 'text-gray-400'} border-2 border-[#313338]`}/></div><span className="font-bold">@{u}</span></div><button onClick={() => handleStartDM(u)} className="bg-[#5865f2] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:scale-105 active:scale-95 shadow-lg shadow-[#5865f2]/20"><FaCommentDots/> NHẮN TIN</button></div>))}</div>
                        </div>
                    </div>
                ) : isAdminMode ? (
                    <div className={`flex-1 p-8 overflow-y-auto animate-in fade-in duration-500 ${darkMode ? 'bg-[#313338]' : 'bg-gray-50'}`}>
                        <h1 className="text-3xl font-black text-[#5865f2] mb-8 flex items-center gap-3 uppercase italic tracking-tighter"><FaChartBar/> Phân tích</h1>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 text-center font-black">
                            <div className="bg-blue-500 text-white p-6 rounded-3xl shadow-lg"><h4 className="text-[10px] opacity-70 uppercase tracking-widest">Người dùng</h4><p className="text-4xl">{stats?.totalUsers || 0}</p></div>
                            <div className="bg-green-500 text-white p-6 rounded-3xl shadow-lg"><h4 className="text-[10px] opacity-70 uppercase tracking-widest">Tin nhắn</h4><p className="text-4xl">{stats?.totalMessages || 0}</p></div>
                            <div className="bg-purple-500 text-white p-6 rounded-3xl shadow-lg"><h4 className="text-[10px] opacity-70 uppercase tracking-widest">Phòng chat</h4><p className="text-4xl">{stats?.totalGroups || 0}</p></div>
                            <div className="bg-red-500 text-white p-6 rounded-3xl shadow-lg animate-pulse"><h4 className="text-[10px] opacity-70 uppercase tracking-widest">Online</h4><p className="text-4xl">{stats?.onlineNow || 0}</p></div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                            <div className={`${darkMode ? 'bg-[#2b2d31]' : 'bg-white'} p-8 rounded-[32px] shadow-sm`}><h3 className="font-black uppercase italic mb-6">Phân bổ</h3><div className="h-[250px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={stats?.chartData || []} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{(stats?.chartData || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip/><Legend/></PieChart></ResponsiveContainer></div></div>
                            <div className={`${darkMode ? 'bg-[#2b2d31]' : 'bg-white'} p-8 rounded-[32px] shadow-sm`}><h3 className="font-black uppercase italic mb-6 text-green-500">Hoạt động User</h3><div className="space-y-4">{stats?.topUsers?.map((u, i) => (<div key={i} className="relative"><div className="flex justify-between mb-1 items-center"><span className="font-bold text-sm">@{u.name}</span><span className="text-xs font-black text-[#5865f2]">{u.count} tin</span></div><div className="w-full bg-gray-200 rounded-full h-2 font-black"><div className="bg-[#5865f2] h-2 rounded-full transition-all duration-1000" style={{ width: `${(u.count / (stats.totalMessages || 1)) * 100}%` }}></div></div></div>))}</div></div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="h-12 border-b flex items-center justify-between px-6 shrink-0 shadow-sm">
                            <div className="flex items-center gap-3 font-black text-sm uppercase tracking-tighter"><button onClick={() => setIsSidebarVisible(!isSidebarVisible)}><FaChevronLeft size={16}/></button> {activeRoom.isDM ? `@ ${activeRoom.name}` : `# ${activeRoom.name}`}</div>
                            <div className="flex items-center gap-4">
                                {isAdminOfGroup && currentGroup?.pendingRequests?.length > 0 && (<button onClick={() => setShowGroupDiscovery(true)} className="bg-red-500 text-white text-[9px] px-3 py-1 rounded-full animate-bounce font-black">DUYỆT</button>)}
                                {isAdminOfGroup && !activeRoom.isDM && activeRoom.id !== 'chung' && (<button onClick={() => setShowGroupSettings(true)} className="text-gray-400 hover:text-[#5865f2] transition-colors"><FaCog size={18}/></button>)}
                                <button onClick={() => { if(window.confirm("Xóa lịch sử phía bạn?")) { setMessages([]); }}} className="text-gray-400 hover:text-red-500 transition-colors"><FaBroom size={20}/></button>
                            </div>
                        </div>
                        {!isMember ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center animate-in zoom-in-95">
                                <div className="w-24 h-24 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mb-6"><FaLock size={48}/></div>
                                <h2 className="text-2xl font-black uppercase mb-2">Phòng Riêng Tư</h2>
                                <p className="text-gray-400 max-w-sm mb-8 font-medium">Bạn cần quản trị viên duyệt để tham gia phòng này.</p>
                                {currentGroup?.pendingRequests?.includes(user.username) ? (<div className="bg-orange-500 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs animate-bounce shadow-lg">Đang chờ duyệt...</div>) : (<button onClick={() => handleRequestJoin(activeRoom.id)} className="bg-[#5865f2] text-white px-10 py-4 rounded-2xl font-black uppercase shadow-xl hover:scale-105 active:scale-95 transition-all">Gia nhập ngay</button>)}
                            </div>
                        ) : (
                            <>
                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    {messages.filter(m => (activeRoom.id === 'chung' ? !m.roomId || m.roomId === 'chung' : m.roomId === activeRoom.id)).map((msg) => {
                                        const isMe = msg.senderUsername === user.username;
                                        const isRevoked = msg.isRevoked || msg.text?.includes("đã bị thu hồi");
                                        return (
                                            <div key={msg.messageId} className={`flex gap-4 ${isMe ? 'flex-row-reverse text-right' : ''} group animate-in slide-in-from-bottom-2`}>
                                                <div onClick={() => handleOpenProfile(msg.senderUsername)} className="w-10 h-10 rounded-full shadow-sm cursor-pointer overflow-hidden shrink-0 border-2 border-white transition-transform active:scale-90">{onlineUsers[msg.senderUsername]?.avatar ? <img src={onlineUsers[msg.senderUsername].avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-[#5865f2] flex items-center justify-center text-white font-bold uppercase">{msg.sender.substring(0,2)}</div>}</div>
                                                <div className={`max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                    <div className="text-[11px] text-gray-400 mb-1" onClick={() => handleOpenProfile(msg.senderUsername)}><b className="hover:underline cursor-pointer">{msg.sender}</b> • {msg.time} {friends.includes(msg.senderUsername) && <span className="ml-2 text-green-500 font-black text-[8px] uppercase tracking-widest">[Bạn bè]</span>}</div>
                                                    <div className="relative group/bubble">
                                                        {!isRevoked && (<div className={`absolute top-0 flex gap-2 p-1.5 bg-white border shadow-xl rounded-xl opacity-0 group-hover/bubble:opacity-100 transition-all z-10 ${isMe ? 'right-full mr-3' : 'left-full ml-3'}`}><button onClick={() => deleteForMe(msg.messageId)} className="p-1 text-gray-400 hover:text-red-500"><FaTrash size={14}/></button>{(isMe || user.role === 'admin') && <button onClick={() => unsendEverywhere(msg.messageId)} className={`${user.role === 'admin' && !isMe ? 'text-red-500 font-bold' : 'text-blue-500'}`} title="Thu hồi (Admin)"><FaUndo size={14}/></button>}</div>)}
                                                        <div className={`p-4 rounded-2xl shadow-sm text-[15px] leading-relaxed ${isMe ? 'bg-[#5865f2] text-white rounded-tr-none' : (darkMode ? 'bg-[#383a40] text-[#dbdee1] border-[#1e1f22] rounded-tl-none' : 'bg-white border text-gray-800 rounded-tl-none')} ${isRevoked ? 'italic opacity-50' : ''}`}>{msg.text}{!isRevoked && msg.fileData && (<div className="mt-3">{msg.fileType === 'image' ? <img src={msg.fileData} className="max-w-xs rounded-xl shadow-md border" /> : <a href={msg.fileData} download={msg.fileName} className="flex items-center gap-3 p-3 bg-black/10 rounded-xl text-sm border font-bold text-blue-500 hover:bg-black/20 transition-all"><FaFileAlt/> {msg.fileName}</a>}</div>)}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={scrollRef} />
                                </div>
                                <div className="p-4 shrink-0 relative">
                                    <div className={`rounded-xl flex items-center px-4 py-2 border transition-all ${darkMode ? 'bg-[#383a40] border-white/5' : 'bg-[#ebedef]'} ${currentGroup?.isDisabled ? 'opacity-40 grayscale pointer-events-none' : 'focus-within:ring-2 ring-[#5865f2]'}`}>
                                        <button onClick={()=>setShowEmojiPicker(!showEmojiPicker)} className="text-gray-400 hover:text-yellow-500 mr-3 transition-colors"><FaSmile size={20}/></button>
                                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                                        <button onClick={()=>fileInputRef.current.click()} className="text-gray-400 hover:text-blue-500 mr-3 transition-colors"><FaImage size={20}/></button>
                                        <input value={msgInput} onChange={(e)=>setMsgInput(e.target.value)} onKeyDown={(e)=>e.key==='Enter'&&handleSendText()} placeholder={`Nhắn vào ${activeRoom.isDM ? '@' : '#'}${activeRoom.name}...`} className="bg-transparent w-full outline-none text-sm py-2 font-medium"/>
                                        <button onClick={handleSendText} className={`${msgInput.trim() ? 'text-[#5865f2] scale-125' : 'text-gray-400'} ml-3 transition-all`}><FaPaperPlane size={20}/></button>
                                    </div>
                                    {showEmojiPicker && <div ref={emojiPickerRef} className="absolute bottom-20 left-4 z-50 shadow-2xl rounded-2xl overflow-hidden border border-gray-700"><EmojiPicker onEmojiClick={(e) => setMsgInput(prev => prev + e.emoji)} theme={darkMode ? Theme.DARK : Theme.LIGHT} /></div>}
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>

            {/* Cột 4 Online */}
            <div className={`w-64 border-l hidden lg:flex flex-col p-5 overflow-y-auto shrink-0 shadow-inner ${darkMode ? 'bg-[#2b2d31] border-[#1e1f22]' : 'bg-[#f2f3f5]'}`}>
                <p className="text-[10px] font-black uppercase mb-5 tracking-widest italic border-b pb-2 text-gray-400 text-center opacity-60 font-black">Hoạt động — {Object.keys(onlineUsers).length}</p>
                {Object.values(onlineUsers).map((u, i) => (
                    <div key={i} onClick={() => handleOpenProfile(u.username)} className={`flex items-center space-x-4 mb-4 p-2 rounded-2xl cursor-pointer group hover:bg-black/5 transition-all`}>
                        <div className="relative shrink-0"><div className="w-10 h-10 bg-[#5865f2] rounded-full flex items-center justify-center font-black text-white shadow-sm uppercase overflow-hidden border-2 border-white group-hover:scale-110 transition-transform">{u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : u.displayName.substring(0,2)}</div><FaCircle className={`absolute -bottom-0.5 -right-0.5 text-[10px] border-2 ${darkMode ? 'border-[#2b2d31]' : 'border-white'} ${u.role === 'admin' ? 'text-red-500' : 'text-green-500'}`} /></div>
                        <div className={`truncate text-sm font-bold ${darkMode ? 'text-[#dbdee1]' : 'text-gray-700'}`}>{u.displayName}</div>
                    </div>
                ))}
            </div>

            {/* MODALS SECTION */}
            {showGroupDiscovery && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[300] backdrop-blur-sm p-4 animate-in fade-in">
                    <div className={`w-full max-w-[500px] rounded-[32px] p-8 shadow-2xl overflow-y-auto max-h-[80vh] ${darkMode ? 'bg-[#313338] text-white' : 'bg-white'}`}>
                        <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-black italic uppercase text-[#5865f2]">Khám phá OTT</h2><button onClick={()=>setShowGroupDiscovery(false)}><FaTimes size={24}/></button></div>
                        {user.role === 'admin' && (
                            <div className="mb-6"><p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-3 underline italic font-black">Yêu cầu gia nhập</p>
                                {allGroups.filter(g => g.owner === user.username && !g.isPublic).map(g => g.pendingRequests?.map(uname => (
                                    <div key={`${g.groupId}-${uname}`} className="flex items-center justify-between p-4 rounded-2xl bg-black/5 mb-2 border-2 border-red-100"><div className="text-sm font-bold truncate mr-2"><b>@{uname}</b> xin vào <b>#{g.groupName}</b></div><div className="flex gap-2 shrink-0"><button onClick={()=>handleApprove(g.groupId, uname, 'accept')} className="bg-green-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase">Duyệt</button><button onClick={()=>handleApprove(g.groupId, uname, 'reject')} className="bg-gray-400 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase">Xóa</button></div></div>
                                )))}
                            </div>
                        )}
                        <div className="space-y-3">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 italic">Tất cả Nhóm & Kênh</p>
                            {allGroups.map(g => (
                                <div key={g.groupId} className={`flex items-center justify-between p-4 border-2 rounded-2xl mb-2 transition-all ${darkMode ? 'border-[#3f4147] hover:bg-[#3f4147]' : 'border-gray-50'}`}>
                                    <div><p className="font-black text-lg flex items-center gap-2 italic uppercase text-[#5865f2]">#{g.groupName} {g.isPublic ? <FaGlobe className="text-blue-400 text-xs"/> : <FaLock className="text-orange-400 text-xs"/>}</p><p className="text-[10px] text-gray-400 italic font-medium">Admin: @{g.owner}</p></div>
                                    {g.members?.includes(user.username) || g.isPublic ? <span className="text-green-500 text-[10px] font-black uppercase"><FaUserCheck/> Đã vào</span> : g.pendingRequests?.includes(user.username) ? <span className="text-orange-500 text-[10px] font-black italic">Đang chờ...</span> : <button onClick={()=>handleRequestJoin(g.groupId)} className="bg-[#5865f2] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-[#5865f2]/20">Tham gia</button>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {showGroupCreator && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[300] backdrop-blur-sm p-4 animate-in zoom-in">
                    <div className={`w-[400px] rounded-[32px] p-8 shadow-2xl ${darkMode ? 'bg-[#313338] text-white' : 'bg-white'}`}>
                        <div className="flex justify-between items-center mb-6 text-gray-800"><h2 className="text-xl font-black uppercase italic tracking-tighter text-gray-800">Thiết lập OTT mới</h2><button onClick={()=>setShowGroupCreator(false)} className="text-gray-400"><FaTimes size={24}/></button></div>
                        <div className="flex gap-4 mb-6">
                            <div onClick={()=>setIsNewGroupPublic(true)} className={`flex-1 p-4 rounded-2xl border-2 cursor-pointer transition-all text-center group ${isNewGroupPublic ? 'border-[#5865f2] bg-[#5865f2]/10' : 'border-gray-200'}`}><FaGlobe className={`mx-auto mb-2 text-xl ${isNewGroupPublic ? 'text-[#5865f2]' : 'text-gray-400'}`}/><p className="text-[10px] font-black uppercase">Công khai</p></div>
                            <div onClick={()=>setIsNewGroupPublic(false)} className={`flex-1 p-4 rounded-2xl border-2 cursor-pointer transition-all text-center group ${!isNewGroupPublic ? 'border-orange-500 bg-orange-500/10' : 'border-gray-200'}`}><FaLock className={`mx-auto mb-2 text-xl ${!isNewGroupPublic ? 'text-orange-500' : 'text-gray-400'}`}/><p className="text-[10px] font-black uppercase">Riêng tư</p></div>
                        </div>
                        <input id="gnInput" className={`w-full border-2 p-4 rounded-2xl mb-6 outline-none focus:border-[#5865f2] font-black transition-all ${darkMode ? 'bg-[#2b2d31] border-[#3f4147] text-white' : 'bg-gray-50 border-gray-100 text-gray-800'}`} placeholder="Tên kênh hoặc nhóm..."/>
                        <button onClick={() => handleCreateGroup(document.getElementById('gnInput').value)} className={`w-full text-white py-4 rounded-2xl font-black shadow-lg bg-[#5865f2] uppercase tracking-widest text-[10px] transition-all transform active:scale-95`}>KHỞI TẠO NGAY</button>
                    </div>
                </div>
            )}

            {showGroupSettings && currentGroup && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[400] backdrop-blur-md p-4 animate-in fade-in">
                    <div className={`w-full max-w-[550px] rounded-[32px] overflow-hidden flex flex-col max-h-[85vh] shadow-2xl ${darkMode ? 'bg-[#313338] text-white border border-gray-700' : 'bg-white text-gray-800'}`}>
                        <div className="p-8 border-b flex justify-between items-center bg-gradient-to-r from-[#5865f2] to-blue-800 text-white"><div><h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Quản lý: #{currentGroup.groupName}</h2></div><button onClick={()=>setShowGroupSettings(false)} className="p-2 hover:bg-white/20 rounded-full transition-all text-white"><FaTimes size={24}/></button></div>
                        <div className="p-8 overflow-y-auto space-y-8">
                            <div><p className="text-[10px] font-black text-gray-400 uppercase mb-4 tracking-widest">Trạng thái Kênh</p><div className="grid grid-cols-2 gap-4"><button onClick={()=>handleManageGroup('disable')} className={`p-4 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all border-2 ${currentGroup.isDisabled ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'}`}>{currentGroup.isDisabled ? <><FaPlayCircle size={18}/> Mở chat</> : <><FaPauseCircle size={18}/> Ngưng chat</>}</button><button onClick={()=>handleManageGroup('delete')} className="p-4 rounded-2xl border-2 border-gray-600 text-gray-400 flex items-center justify-center gap-3 font-bold hover:bg-red-600 hover:text-white transition-all"><FaTrash size={14}/> Xóa vĩnh viễn</button></div></div>
                            {!currentGroup.isPublic && (<div><p className="text-[10px] font-black text-gray-400 uppercase mb-4 tracking-widest font-black">Thành viên ({currentGroup.members?.length})</p><div className="space-y-2">{currentGroup.members?.map(uname => (<div key={uname} className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${darkMode ? 'border-gray-700 bg-[#2b2d31]' : 'bg-gray-50'}`}><div className="flex items-center gap-3" onClick={()=>handleOpenProfile(uname)}><div className="w-8 h-8 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm shrink-0">{uname.substring(0,2)}</div><span className="font-bold text-sm">@{uname}</span></div>{uname !== currentGroup.owner && (<button onClick={()=>handleKick(uname)} className="p-2 text-gray-400 hover:text-red-500" title="Kích khỏi nhóm"><FaUserMinus size={18}/></button>)}</div>))}</div></div>)}
                        </div>
                    </div>
                </div>
            )}

            <UserProfileModal isOpen={profileModal.isOpen} onClose={()=>setProfileModal({isOpen:false, username:''})} targetUsername={profileModal.username} currentUser={user} onUpdateSuccess={loadData} onStartDM={handleStartDM} />
        </div>
    );
};

export default ChatPage;