import React, { useState, useMemo } from 'react';
import { 
    FaArchive, FaFolderOpen, FaSearch, FaCommentDots, 
    FaInbox, FaCloud, FaCircle, FaGlobe, FaLock 
} from 'react-icons/fa';

const ArchivedChatsTab = ({ 
    user, 
    allGroups = [], 
    onlineUsers = {}, 
    unreadCounts = {}, 
    getRecentChatUsers, 
    handleStartDM, 
    handleSwitchRoom, 
    handleToggleArchive, 
    darkMode 
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const archivedRooms = user.archivedRooms || [];

    // Build the list of all rooms
    const allRoomItems = useMemo(() => {
        const dms = getRecentChatUsers() || [];
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
        
        return [
            cloudRoomItem,
            ...filteredDms.map(name => ({ id: `dm_${[user.username, name].sort().join("_")}`, name, isDM: true, type: 'personal' })),
            ...publicGroups.map(g => ({ id: g.groupId, name: g.groupName, type: 'groups' })),
            ...privateGroups.map(g => ({ id: g.groupId, name: g.groupName, type: 'groups' }))
        ];
    }, [allGroups, getRecentChatUsers, user.username]);

    // Filter to only get archived ones and apply search
    const archivedChats = useMemo(() => {
        return allRoomItems
            .filter(r => archivedRooms.includes(r.id))
            .filter(r => {
                const query = searchQuery.toLowerCase();
                const isCloudRoom = r.id === `dm_${user.username}_${user.username}`;
                const displayName = isCloudRoom ? "Cloud của tôi" : r.name;
                return displayName.toLowerCase().includes(query);
            });
    }, [allRoomItems, archivedRooms, searchQuery, user.username]);

    const handleOpenChat = (r) => {
        const isCloudRoom = r.id === `dm_${user.username}_${user.username}`;
        if (isCloudRoom) {
            handleSwitchRoom({ id: r.id, name: r.name, isDM: true, isCloud: true });
        } else if (r.isDM) {
            handleStartDM(r.name);
        } else {
            handleSwitchRoom({ id: r.id, name: r.name });
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden font-black tracking-tighter uppercase italic">
            {/* Header */}
            <div className={`p-6 border-b shrink-0 flex items-center justify-between gap-4 ${darkMode ? 'border-white/5 bg-slate-900/40' : 'border-gray-200 bg-white shadow-sm'}`}>
                <div>
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                        <FaArchive className="text-amber-500 text-3xl" /> Hội thoại lưu trữ
                    </h2>
                    <p className="text-xs text-gray-500 font-medium tracking-normal lowercase not-italic">Nơi lưu trữ các cuộc trò chuyện cũ hoặc ít sử dụng</p>
                </div>
            </div>

            {/* Main Area */}
            <div className={`flex-1 flex flex-col overflow-hidden ${darkMode ? 'bg-transparent' : 'bg-slate-50/50'}`}>
                {/* Search query */}
                <div className={`p-4 border-b flex items-center justify-between gap-4 shrink-0 ${darkMode ? 'border-white/5 bg-slate-900/10' : 'border-gray-200 bg-white'}`}>
                    <div className="relative w-full max-w-md">
                        <span className="absolute left-3.5 top-3 text-gray-500"><FaSearch size={14} /></span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm hội thoại lưu trữ..."
                            className={`pl-10 pr-4 py-2.5 w-full text-xs rounded-xl outline-none border focus:border-amber-500 font-semibold ${darkMode ? 'bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500' : 'bg-white border-gray-200 text-slate-800 placeholder:text-gray-400'}`}
                        />
                    </div>
                </div>

                {/* List of archived rooms */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {archivedChats.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-30">
                            <FaFolderOpen size={64} className="mb-4 text-amber-500 animate-pulse" />
                            <p className="font-black text-lg">Thư mục lưu trữ trống!</p>
                            <p className="text-xs max-w-sm mt-1 not-italic font-sans lowercase">Bạn có thể lưu trữ bất kỳ cuộc hội thoại nào từ danh sách chat chính.</p>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto space-y-3">
                            {archivedChats.map(r => {
                                const isCloudRoom = r.id === `dm_${user.username}_${user.username}`;
                                const unread = unreadCounts[r.id] || 0;
                                const isOnline = !isCloudRoom && r.isDM && !!onlineUsers[r.name];

                                return (
                                    <div 
                                        key={r.id}
                                        className={`p-4 rounded-3xl border flex items-center justify-between gap-4 transition-all hover:scale-[1.01] ${darkMode ? 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/60' : 'bg-white border-gray-200 hover:bg-slate-50'} shadow-sm`}
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            {/* Avatar/Icon */}
                                            {r.isDM ? (
                                                isCloudRoom ? (
                                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-400 to-indigo-500 flex items-center justify-center text-white border border-white/10 shrink-0 shadow-md">
                                                        <FaCloud size={20} className="text-cyan-100"/>
                                                    </div>
                                                ) : (
                                                    <div className="relative shrink-0">
                                                        <div className="w-12 h-12 rounded-2xl bg-slate-700 flex items-center justify-center text-white text-base font-bold uppercase overflow-hidden border border-white/10">
                                                            {onlineUsers[r.name]?.avatar ? <img src={onlineUsers[r.name].avatar} className="w-full h-full object-cover" alt="" /> : r.name[0]}
                                                        </div>
                                                        <FaCircle className={`absolute -bottom-0.5 -right-0.5 text-[10px] border-2 ${darkMode ? 'border-[#1e293b]' : 'border-white'} ${isOnline ? 'text-green-500 animate-pulse' : 'text-gray-400'}`} />
                                                    </div>
                                                )
                                            ) : (
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${darkMode ? 'bg-white/5 border-white/5' : 'bg-slate-200 border-gray-200'}`}>
                                                    <FaGlobe size={18} className="text-indigo-400" />
                                                </div>
                                            )}

                                            {/* Details */}
                                            <div className="min-w-0">
                                                <h3 className={`text-base font-black truncate ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                                                    {isCloudRoom ? "Cloud của tôi" : r.name}
                                                </h3>
                                                
                                                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] font-bold text-gray-500 not-italic font-sans">
                                                    <span className={`text-[8px] font-black uppercase px-2.5 py-0.5 rounded-full ${r.isDM ? 'bg-indigo-500/10 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                                        {r.isDM ? 'Cá nhân' : 'Nhóm'}
                                                    </span>
                                                    {unread > 0 && (
                                                        <span className="bg-red-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full">
                                                            {unread} tin nhắn mới
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => handleToggleArchive(r.id, true)}
                                                className={`px-4 py-3 rounded-2xl text-[10px] font-black tracking-widest flex items-center gap-2 border transition-all ${darkMode ? 'border-white/10 hover:bg-white/5 text-gray-300' : 'border-gray-300 hover:bg-slate-100 text-slate-700'}`}
                                                title="Bỏ lưu trữ cuộc trò chuyện này"
                                            >
                                                <FaInbox size={12} /> Bỏ lưu trữ
                                            </button>
                                            <button
                                                onClick={() => handleOpenChat(r)}
                                                className="px-4 py-3 rounded-2xl text-[10px] font-black tracking-widest flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-md active:scale-95 shadow-indigo-500/20"
                                            >
                                                <FaCommentDots size={12} /> Nhắn tin
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ArchivedChatsTab;
