import React from 'react';
import {
    FaSearch, FaTimes, FaUserPlus, FaUserFriends, FaChevronDown,
    FaFolderPlus, FaCog, FaCloud, FaCircle, FaThumbtack, FaEllipsisH, FaSignOutAlt,
    FaRobot
} from 'react-icons/fa';
import StoryBar from '../social/StoryBar';
import { disconnectSocket } from '../../services/socket';
import api from '../../services/api';
import { useState, useEffect } from 'react';

const ConversationSidebar = ({
    user, setUser, onlineUsers, allGroups, messages, activeRoom, darkMode,
    isSidebarVisible, roomSearchQuery, setRoomSearchQuery,
    setShowAddFriend, setShowGroupCreator, setIsPublicGroupCreator,
    activeSidebarTab, setActiveSidebarTab, showFilterDropdown, setShowFilterDropdown,
    customFolders, setEditingFolder, setFolderName, setFolderRooms, setShowFolderModal,
    setViewingStories, setShowStoryUpload,
    unreadCounts, handleSwitchRoom, handleStartDM, handleOpenProfile,
    setActiveRoomMenu, getRecentChatUsers
}) => {
    const [offlineUsersCache, setOfflineUsersCache] = useState({});

    useEffect(() => {
        const fetchMissingAvatars = async () => {
            const dms = getRecentChatUsers();
            const friends = user?.friends || [];
            const needed = [...new Set([...dms, ...friends])].filter(u => u !== user.username && !onlineUsers[u] && !offlineUsersCache[u]);
            if (needed.length === 0) return;

            try {
                const results = await Promise.all(needed.map(u => api.get(`/users/${u}`).catch(() => null)));
                const newCache = { ...offlineUsersCache };
                results.forEach((res, i) => {
                    if (res?.data) newCache[needed[i]] = res.data;
                });
                setOfflineUsersCache(newCache);
            } catch (err) {}
        };
        fetchMissingAvatars();
    }, [messages, user?.friends, onlineUsers]);

    // 1. Các hàm Helper xử lý logic tin nhắn cuối cùng
    const getLastMessage = (roomId, isDM, otherUsername) => {
        let roomMsgs = [];
        if (isDM) {
            const altRoomId = `dm_${[user.username, otherUsername].sort().join("_")}`;
            roomMsgs = messages.filter(m => m.roomId === roomId || m.roomId === altRoomId);
        } else {
            roomMsgs = messages.filter(m => m.roomId === roomId);
        }
        if (roomMsgs.length === 0) return null;
        const sorted = [...roomMsgs].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        return sorted[sorted.length - 1];
    };

    const formatRelativeTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Vài giây';
        if (diffMins < 60) return `${diffMins} phút`;
        if (diffHours < 24) return `${diffHours} giờ`;
        if (diffDays < 7) return `${diffDays} ngày`;
        return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' });
    };

    const renderLastMessageText = (msg, isDM) => {
        if (!msg) return <span className="text-gray-400 text-[10px] font-semibold italic">Chưa có tin nhắn</span>;
        if (msg.isRevoked) return <span className="text-gray-400 text-[10px] font-semibold italic">Tin nhắn đã bị thu hồi</span>;

        let prefix = '';
        if (msg.senderUsername === user.username) {
            prefix = 'Bạn: ';
        } else if (!isDM) {
            prefix = `${msg.senderUsername}: `;
        }

        let text = msg.text || '';
        if (msg.fileType) {
            const isImage = msg.fileType.startsWith('image/');
            const isVideo = msg.fileType.startsWith('video/');
            if (isImage) text = '[Hình ảnh]';
            else if (isVideo) text = '[Video]';
            else text = '[Tài liệu]';
        }
        return `${prefix}${text}`;
    };

    // 2. Logic lọc danh sách phòng chat
    const pinnedRooms = user.pinnedRooms || [];
    const archivedRooms = user.archivedRooms || [];
    const dms = getRecentChatUsers();
    const publicGroups = allGroups.filter(g => g.isPublic && (g.members?.includes(user.username) || g.owner === user.username));
    const privateGroups = allGroups.filter(g => !g.isPublic && (g.members?.includes(user.username) || g.owner === user.username));

    const aiRoomItem = { id: 'ai_agent_room', name: 'Trợ lý AI Agent', isDM: true, isAI: true, type: 'personal' };
    const cloudRoomItem = { id: `dm_${user.username}_${user.username}`, name: user.username, isDM: true, isCloud: true, type: 'personal' };
    const filteredDms = dms.filter(name => name !== user.username);

    const allRoomItems = [
        aiRoomItem,
        cloudRoomItem,
        ...filteredDms.map(name => ({ id: `dm_${[user.username, name].sort().join("_")}`, name, isDM: true, type: 'personal' })),
        ...publicGroups.map(g => ({ id: g.groupId, name: g.groupName, type: 'groups' })),
        ...privateGroups.map(g => ({ id: g.groupId, name: g.groupName, type: 'groups' }))
    ];

    let filtered = allRoomItems.filter(r => !archivedRooms.includes(r.id));

    if (activeSidebarTab === 'personal') filtered = filtered.filter(r => r.isDM);
    else if (activeSidebarTab === 'groups') filtered = filtered.filter(r => !r.isDM);
    else if (activeSidebarTab === 'unread') filtered = filtered.filter(r => (unreadCounts[r.id] || 0) > 0);
    else if (activeSidebarTab.startsWith('folder_')) {
        const currentFolder = customFolders.find(f => f.id === activeSidebarTab);
        if (currentFolder) {
            filtered = filtered.filter(r => currentFolder.roomIds.includes(r.id));
        } else {
            filtered = [];
        }
    }

    if (roomSearchQuery.trim()) {
        const query = roomSearchQuery.toLowerCase();
        filtered = filtered.filter(r => {
            if (r.isAI) return 'ai assistant trợ lý'.includes(query) || r.name.toLowerCase().includes(query);
            if (r.isCloud) return 'cloud'.includes(query);
            if (r.isDM) return r.name.toLowerCase().includes(query) || (onlineUsers[r.name]?.displayName || '').toLowerCase().includes(query);
            return r.name.toLowerCase().includes(query);
        });
    }

    const pinned = filtered.filter(r => pinnedRooms.includes(r.id));
    const unpinned = filtered.filter(r => !pinnedRooms.includes(r.id));

    // 3. Hàm render giao diện cho 1 item chat
    const renderRoom = (r) => {
        const isPinned = pinnedRooms.includes(r.id);
        const isCloudRoom = r.id === `dm_${user.username}_${user.username}`;
        const isAIRoom = r.id === 'ai_agent_room';
        const isActive = activeRoom?.id === r.id || (r.isDM && activeRoom?.name === r.name && activeRoom?.isDM && !isAIRoom);
        const unread = unreadCounts[r.id] || 0;
        const groupObj = !r.isDM ? allGroups.find(g => g.groupId === r.id) : null;
        const groupAvatar = groupObj?.avatar;
        const lastMsg = isAIRoom ? null : getLastMessage(r.id, r.isDM, r.name);
        const timeStr = lastMsg ? formatRelativeTime(lastMsg.createdAt) : '';

        return (
            <div
                key={r.id}
                onClick={() => {
                    if (isAIRoom) {
                        handleSwitchRoom({ id: r.id, name: r.name, isAI: true });
                    } else if (isCloudRoom) {
                        handleSwitchRoom({ id: r.id, name: r.name, isDM: true, isCloud: true });
                    } else if (r.isDM) {
                        handleStartDM(r.name);
                    } else {
                        handleSwitchRoom({ id: r.id, name: r.name });
                    }
                }}
                className={`group p-3 rounded-2xl flex items-center gap-3 cursor-pointer mb-1 relative transition-all duration-300 border ${isActive ? 'bg-gradient-to-r from-[#5865f2] to-[#4752c4] text-white shadow-lg border-transparent' : (darkMode ? 'hover:bg-white/5 border-transparent text-gray-300 bg-transparent' : 'hover:bg-slate-100 border-transparent text-slate-700 bg-transparent')}`}
            >
                <div className="relative shrink-0">
                    {r.isDM ? (
                        isAIRoom ? (
                            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white border border-white/10 shrink-0 shadow-md">
                                <FaRobot size={16} className="animate-pulse text-indigo-100" />
                            </div>
                        ) : isCloudRoom ? (
                            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-500 flex items-center justify-center text-white border border-white/10 shrink-0 shadow-md">
                                <FaCloud size={16} className="animate-pulse text-cyan-100" />
                            </div>
                        ) : (
                            <div className="relative shrink-0" onClick={(e) => { e.stopPropagation(); handleOpenProfile(r.name); }}>
                                <div className="w-11 h-11 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-bold uppercase overflow-hidden border border-white/10">
                                    {(onlineUsers[r.name]?.avatar || offlineUsersCache[r.name]?.avatar) ? <img src={onlineUsers[r.name]?.avatar || offlineUsersCache[r.name]?.avatar} className="w-full h-full object-cover" alt="" /> : r.name[0]}
                                </div>
                                <FaCircle className={`absolute -bottom-0.5 -right-0.5 text-[10px] border-2 ${darkMode ? 'border-[#1e293b]' : 'border-white'} ${onlineUsers[r.name] ? 'text-green-500' : 'text-gray-400'}`} />
                            </div>
                        )
                    ) : (
                        <div className="w-11 h-11 rounded-full bg-purple-600/20 border border-purple-500/10 flex items-center justify-center text-purple-400 text-xs font-black overflow-hidden shrink-0 shadow-inner">
                            {groupAvatar ? <img src={groupAvatar} className="w-full h-full object-cover" alt="" /> : r.name.substring(0, 2).toUpperCase()}
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                        <h4 className={`text-xs font-black truncate ${isActive ? 'text-white' : (darkMode ? 'text-gray-100' : 'text-slate-800')}`}>
                            {isAIRoom ? <span>Trợ lý AI Agent</span> : isCloudRoom ? <span>Cloud của tôi</span> : (r.isDM ? (onlineUsers[r.name]?.displayName || `@${r.name}`) : r.name)}
                        </h4>
                        {timeStr && <span className={`text-[9px] font-bold tracking-tight shrink-0 ml-2 ${isActive ? 'text-white/80' : (darkMode ? 'text-gray-400' : 'text-slate-400')}`}>{timeStr}</span>}
                    </div>

                    <div className="flex justify-between items-center gap-2">
                        <p className={`text-[11px] truncate flex-1 font-semibold ${isActive ? 'text-white/80' : (darkMode ? 'text-gray-400' : 'text-slate-500')}`}>
                            {isAIRoom ? 'Hỏi trợ lý AI bất kỳ điều gì...' : renderLastMessageText(lastMsg, r.isDM)}
                        </p>
                        <div className="flex items-center gap-1.5 shrink-0">
                            {unread > 0 && <span className="px-1.5 py-0.5 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full font-black animate-bounce shrink-0 min-w-4 shadow-sm shadow-red-500/30">{unread}</span>}
                            {isPinned && !isActive && <FaThumbtack size={9} className="text-indigo-400 rotate-45 shrink-0" />}
                            {!isAIRoom && (
                                <div className="opacity-0 group-hover:opacity-100 flex items-center transition-opacity duration-200">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            let yPos = rect.bottom + window.scrollY + 4;
                                            if (rect.bottom + 320 > window.innerHeight) yPos = rect.top + window.scrollY - 320 - 4;
                                            setActiveRoomMenu({ roomId: r.id, isPinned, name: r.name, isDM: r.isDM, x: rect.right - 220, y: yPos });
                                        }}
                                        className={`p-1.5 rounded-full transition-colors ${isActive ? 'hover:bg-white/20 text-white' : 'hover:bg-slate-200 dark:hover:bg-white/10 text-gray-400'}`}
                                    >
                                        <FaEllipsisH size={12} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={`flex flex-col border-r transition-all duration-300 ${isSidebarVisible ? 'w-60 md:w-72' : 'w-0 overflow-hidden'} ${darkMode ? 'bg-[#1e293b]/50 backdrop-blur-xl border-white/5' : 'bg-slate-50 border-gray-200'}`}>
            {/* Search Bar and Quick Actions */}
            <div className={`h-16 px-3 flex items-center gap-2 border-b shrink-0 ${darkMode ? 'border-white/5' : 'border-gray-200'}`}>
                <div className="flex-1 relative group">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all border text-xs ${darkMode ? 'bg-black/20 border-white/5 focus-within:border-indigo-500/50 text-gray-200' : 'bg-white border-slate-200 focus-within:border-indigo-600/50 shadow-sm text-slate-700'}`}>
                        <FaSearch className="text-gray-400 shrink-0" size={12} />
                        <input type="text" placeholder="Tìm kiếm" value={roomSearchQuery} onChange={(e) => setRoomSearchQuery(e.target.value)} className="bg-transparent border-none outline-none w-full font-bold placeholder:text-gray-400" />
                        {roomSearchQuery && <button onClick={() => setRoomSearchQuery('')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><FaTimes size={10} /></button>}
                    </div>
                </div>
                <button onClick={() => setShowAddFriend(true)} className={`p-2.5 rounded-xl border transition-all active:scale-90 shrink-0 ${darkMode ? 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10 hover:text-indigo-400' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 shadow-sm'}`}><FaUserPlus size={14} /></button>
                <button onClick={() => { setIsPublicGroupCreator(false); setShowGroupCreator(true); }} className={`p-2.5 rounded-xl border transition-all active:scale-90 shrink-0 ${darkMode ? 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10 hover:text-emerald-400' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-emerald-600 shadow-sm'}`}><FaUserFriends size={14} /></button>
            </div>

            {/* Navigation Tabs */}
            <div className={`px-3 py-1.5 border-b shrink-0 flex items-center justify-between relative z-30 ${darkMode ? 'border-white/5 bg-white/2' : 'border-gray-200 bg-gray-50/50'}`}>
                <div className="flex items-center gap-3 text-xs font-bold">
                    <button onClick={() => { setActiveSidebarTab('all'); setShowFilterDropdown(false); }} className={`py-1.5 px-2 relative transition-all ${activeSidebarTab === 'all' ? (darkMode ? 'text-indigo-400' : 'text-indigo-600') : 'text-gray-500 hover:text-gray-700'}`}>
                        Tất cả
                        {activeSidebarTab === 'all' && <div className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${darkMode ? 'bg-indigo-400' : 'bg-indigo-600'}`}></div>}
                    </button>
                    <button onClick={() => { setActiveSidebarTab('unread'); setShowFilterDropdown(false); }} className={`py-1.5 px-2 relative transition-all flex items-center gap-1.5 ${activeSidebarTab === 'unread' ? (darkMode ? 'text-indigo-400' : 'text-indigo-600') : 'text-gray-500 hover:text-gray-700'}`}>
                        Chưa đọc
                        {unreadCounts && Object.values(unreadCounts).some(v => v > 0) && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>}
                        {activeSidebarTab === 'unread' && <div className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${darkMode ? 'bg-indigo-400' : 'bg-indigo-600'}`}></div>}
                    </button>
                </div>
                <div className="flex items-center gap-1">
                    <div className="relative">
                        <button onClick={() => setShowFilterDropdown(!showFilterDropdown)} className={`flex items-center gap-1 py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all ${darkMode ? 'text-gray-300 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-100'}`}>
                            Phân loại <FaChevronDown size={8} className={`transition-transform duration-300 ${showFilterDropdown ? 'rotate-180 text-indigo-500' : 'text-gray-400'}`} />
                        </button>
                        {showFilterDropdown && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowFilterDropdown(false)}></div>
                                <div className={`absolute right-0 mt-2 w-48 rounded-2xl border p-2 shadow-2xl z-50 ${darkMode ? 'bg-[#0f172a]/95 backdrop-blur-xl border-white/10' : 'bg-white border-gray-150 shadow-lg'}`}>
                                    <div className="space-y-0.5">
                                        {[{ id: 'all', label: 'Tất cả trò chuyện', icon: "💬" }, { id: 'personal', label: 'Chat cá nhân', icon: "👤" }, { id: 'groups', label: 'Nhóm trò chuyện', icon: "👥" }, { id: 'unread', label: 'Tin nhắn chưa đọc', icon: "🔴" }].map(item => (
                                            <button key={item.id} onClick={() => { setActiveSidebarTab(item.id); setShowFilterDropdown(false); }} className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-[11px] font-bold transition-all ${activeSidebarTab === item.id ? (darkMode ? 'bg-indigo-500/20 text-indigo-400 font-extrabold' : 'bg-indigo-50 text-indigo-600 font-extrabold') : (darkMode ? 'hover:bg-white/5 text-gray-300' : 'hover:bg-slate-100 text-slate-700')}`}>
                                                <span>{item.icon} &nbsp;{item.label}</span>
                                            </button>
                                        ))}
                                        <div className={`my-1.5 border-t ${darkMode ? 'border-white/5' : 'border-gray-100'}`}></div>
                                        {customFolders.length > 0 && (
                                            <div className="max-h-40 overflow-y-auto space-y-0.5 pr-1 scrollbar-hide">
                                                {customFolders.map(folder => (
                                                    <div key={folder.id} className="group flex items-center justify-between gap-1">
                                                        <button onClick={() => { setActiveSidebarTab(folder.id); setShowFilterDropdown(false); }} className={`flex-1 flex items-center px-3 py-2 rounded-xl text-left text-[11px] font-bold transition-all ${activeSidebarTab === folder.id ? (darkMode ? 'bg-indigo-500/20 text-indigo-400 font-extrabold' : 'bg-indigo-50 text-indigo-600 font-extrabold') : (darkMode ? 'hover:bg-white/5 text-gray-300' : 'hover:bg-slate-100 text-slate-700')}`}>
                                                            📁 &nbsp;{folder.name}
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); setEditingFolder(folder); setFolderName(folder.name); setFolderRooms(folder.roomIds); setShowFolderModal(true); setShowFilterDropdown(false); }} className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 ${darkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}><FaCog size={10} /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <button onClick={() => { setEditingFolder(null); setFolderName(''); setFolderRooms([]); setShowFolderModal(true); setShowFilterDropdown(false); }} className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-[10px] font-black uppercase tracking-wider transition-all ${darkMode ? 'text-indigo-400 hover:bg-indigo-500/10' : 'text-indigo-600 hover:bg-indigo-50'}`}>
                                            <FaFolderPlus size={11} /> Tạo thư mục mới
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    <button onClick={() => { setEditingFolder(null); setFolderName(''); setFolderRooms([]); setShowFolderModal(true); }} className={`p-1.5 rounded-lg transition-all ${darkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}><FaFolderPlus size={12} /></button>
                </div>
            </div>

            {/* Story Bar */}
            {(activeSidebarTab === 'all' || activeSidebarTab === 'personal') && (
                <StoryBar user={user} friends={user.friends || []} onlineUsers={onlineUsers} onOpenStory={(username, stories, allGroupedStories) => setViewingStories({ username, stories, allGroupedStories })} onUploadStory={() => setShowStoryUpload(true)} darkMode={darkMode} />
            )}

            {/* Danh sách phòng chat */}
            <div className="flex-1 p-2 mt-2 overflow-y-auto space-y-6 font-bold scrollbar-hide">
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
            </div>

            {/* Thông tin tài khoản ở đáy cột */}
            <div onClick={() => handleOpenProfile(user.username)} className={`h-16 flex items-center px-3 cursor-pointer border-t transition-colors shrink-0 ${darkMode ? 'bg-[#020617] border-white/5' : 'bg-white border-gray-200 hover:bg-slate-50 shadow-sm'}`}>
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg overflow-hidden border border-white/20">
                    {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="" /> : user.displayName[0]}
                </div>
                <div className="ml-3 truncate flex-1 leading-tight">
                    <div className="text-sm font-black truncate uppercase italic tracking-tighter">{user.displayName}</div>
                    <div className="text-[9px] text-green-500 font-black uppercase tracking-widest flex items-center gap-1"><FaCircle size={6} /> Online</div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); disconnectSocket(); localStorage.removeItem('user_session'); setUser(null); }} className="relative z-10 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-90" title="Đăng xuất"><FaSignOutAlt size={16} /></button>
            </div>
        </div>
    );
};

export default ConversationSidebar;