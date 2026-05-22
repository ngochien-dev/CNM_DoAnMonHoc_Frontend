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
        <div className={`flex-1 flex flex-col h-full overflow-hidden font-sans ${darkMode ? 'bg-[#0f172a]' : 'bg-white'}`}>
            {/* Header */}
            <div className={`p-8 border-b shrink-0 flex items-center justify-between gap-4 ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
                <div>
                    <h2 className={`text-2xl font-bold flex items-center gap-3 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                        <FaArchive className="text-amber-500" /> Hội thoại lưu trữ
                    </h2>
                    <p className={`text-sm mt-2 font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Nơi lưu trữ các cuộc trò chuyện cũ hoặc ít sử dụng</p>
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
                {/* Search query */}
                <div className={`p-6 border-b flex items-center justify-between gap-4 shrink-0 ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
                    <div className="relative w-full sm:w-96">
                        <span className="absolute left-4 top-3.5 text-gray-400"><FaSearch size={14} /></span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm hội thoại..."
                            className={`pl-10 pr-4 py-2.5 w-full text-sm rounded-xl outline-none border focus:border-indigo-500 transition-colors ${darkMode ? 'bg-black/20 border-white/10 text-white placeholder:text-gray-500' : 'bg-white border-gray-200 text-slate-800 placeholder:text-gray-400'}`}
                        />
                    </div>
                </div>

                {/* List of archived rooms */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 custom-scrollbar">
                    {archivedChats.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-50 min-h-[300px]">
                            <FaFolderOpen size={64} className="mb-6 text-amber-500" />
                            <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Thư mục lưu trữ trống!</p>
                            <p className={`text-sm mt-2 max-w-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Bạn có thể lưu trữ bất kỳ cuộc hội thoại nào từ danh sách chat chính.</p>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto space-y-4">
                            {archivedChats.map(r => {
                                const isCloudRoom = r.id === `dm_${user.username}_${user.username}`;
                                const unread = unreadCounts[r.id] || 0;
                                const isOnline = !isCloudRoom && r.isDM && !!onlineUsers[r.name];

                                return (
                                    <div 
                                        key={r.id}
                                        className={`p-5 rounded-2xl border flex items-center justify-between gap-4 transition-all hover:shadow-md ${darkMode ? 'bg-[#1e293b] border-white/10 hover:border-indigo-500/30' : 'bg-white border-gray-200 hover:border-indigo-200'} shadow-sm`}
                                    >
                                        <div className="flex items-center gap-5 min-w-0">
                                            {/* Avatar/Icon */}
                                            {r.isDM ? (
                                                isCloudRoom ? (
                                                    <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400 flex items-center justify-center shrink-0 border border-transparent">
                                                        <FaCloud size={24}/>
                                                    </div>
                                                ) : (
                                                    <div className="relative shrink-0">
                                                        <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-slate-700 dark:text-gray-300 flex items-center justify-center text-lg font-bold uppercase overflow-hidden border border-transparent dark:border-white/5">
                                                            {onlineUsers[r.name]?.avatar ? <img src={onlineUsers[r.name].avatar} className="w-full h-full object-cover" alt="" /> : r.name.substring(0,2)}
                                                        </div>
                                                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 ${darkMode ? 'border-[#1e293b]' : 'border-white'} ${isOnline ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                                    </div>
                                                )
                                            ) : (
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${darkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-gray-100'}`}>
                                                    <FaGlobe size={20} className="text-indigo-500" />
                                                </div>
                                            )}

                                            {/* Details */}
                                            <div className="min-w-0">
                                                <h3 className={`text-base font-bold truncate ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                                                    {isCloudRoom ? "Cloud của tôi" : r.name}
                                                </h3>
                                                
                                                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs font-semibold">
                                                    <span className={`px-2.5 py-1 rounded-lg ${r.isDM ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
                                                        {r.isDM ? 'Cá nhân' : 'Nhóm'}
                                                    </span>
                                                    {unread > 0 && (
                                                        <span className="bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 px-2.5 py-1 rounded-lg">
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
                                                className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors ${darkMode ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                                                title="Bỏ lưu trữ"
                                            >
                                                <FaInbox size={14} /> Bỏ lưu trữ
                                            </button>
                                            <button
                                                onClick={() => handleOpenChat(r)}
                                                className="px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors"
                                            >
                                                <FaCommentDots size={14} /> Mở chat
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
