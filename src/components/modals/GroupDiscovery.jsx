import React, { useState } from 'react';
import { FaGlobe, FaLock, FaUserCheck, FaSearch, FaUsers, FaArrowRight, FaHashtag, FaFilter, FaUserPlus, FaGhost, FaComments } from 'react-icons/fa';

const GroupDiscovery = ({ allGroups, user, handleRequestJoin, darkMode, onJoinSuccess }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    const filteredGroups = allGroups.filter(g => {
        // Chỉ hiện nhóm công khai trong phần khám phá
        if (!g.isPublic) return false;

        const matchesSearch = g.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             g.owner.toLowerCase().includes(searchTerm.toLowerCase());
        const isJoined = g.members?.includes(user.username) || g.owner === user.username;

        if (!matchesSearch) return false;
        switch (filterType) {
            case 'joined': return isJoined;
            case 'not_joined': return !isJoined;
            default: return true;
        }
    });

    const filterButtons = [
        { id: 'all', label: 'Tất cả', icon: <FaHashtag size={14}/> },
        { id: 'joined', label: 'Đã tham gia', icon: <FaUserCheck size={14}/> },
        { id: 'not_joined', label: 'Chưa tham gia', icon: <FaUserPlus size={14}/> },
    ];

    return (
        <div className={`flex-1 flex flex-col h-full overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500 font-sans ${darkMode ? 'bg-[#0f172a]' : 'bg-white'}`}>
            <div className={`p-8 pb-6 border-b ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-indigo-600 flex items-center gap-3">
                            <FaGlobe /> Khám phá Cộng đồng
                        </h1>
                        <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tìm kiếm và tham gia các nhóm trò chuyện công khai.</p>
                    </div>

                    <div className="relative group w-full xl:w-96">
                        <div className={`relative flex items-center border rounded-xl px-4 py-3 transition-colors focus-within:border-indigo-500 focus-within:shadow-sm ${darkMode ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                            <FaSearch className="text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input 
                                type="text"
                                placeholder="Tìm kiếm tên nhóm hoặc quản trị viên..."
                                className={`bg-transparent border-none outline-none ml-3 w-full text-sm font-medium ${darkMode ? 'text-white placeholder:text-gray-500' : 'text-slate-800 placeholder:text-gray-400'}`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 items-center">
                    <div className={`flex items-center gap-2 mr-2 text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <FaFilter/> Lọc theo:
                    </div>
                    {filterButtons.map(btn => (
                        <button
                            key={btn.id}
                            onClick={() => setFilterType(btn.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 border ${
                                filterType === btn.id 
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' 
                                : (darkMode ? 'bg-white/5 border-white/5 text-gray-300 hover:text-white hover:bg-white/10' : 'bg-white border-gray-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50')
                            }`}
                        >
                            {btn.icon} {btn.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className={`flex-1 overflow-y-auto p-8 pt-6 scrollbar-hide ${darkMode ? 'bg-[#0f172a]' : 'bg-gray-50/50'}`}>
                {filteredGroups.length === 0 ? (
                    <div className="h-full min-h-[300px] flex flex-col items-center justify-center opacity-40">
                        <FaGhost size={60} className="mb-4 text-gray-400"/>
                        <p className="font-semibold text-lg text-gray-500">Không tìm thấy nhóm nào</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3 gap-6 pb-10">
                        {filteredGroups.map(g => {
                            const isJoined = g.members?.includes(user.username) || g.owner === user.username;
                            const isPending = g.pendingRequests?.includes(user.username);

                            return (
                                <div key={g.groupId} className="group relative">
                                    <div 
                                        onClick={() => isJoined && onJoinSuccess(g.groupId, g.groupName)}
                                        className={`relative h-full flex flex-col p-6 rounded-2xl border transition-all duration-300 shadow-sm ${isJoined ? 'cursor-pointer' : ''} ${darkMode ? 'bg-[#1e293b] border-white/10 hover:border-indigo-500/50' : 'bg-white border-gray-200 hover:shadow-md'}`}
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-2">
                                                <div className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${g.isPublic ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400'}`}>
                                                    {g.isPublic ? <FaGlobe/> : <FaLock/>} {g.isPublic ? 'Công khai' : 'Riêng tư'}
                                                </div>
                                                {g.isChannel && (
                                                    <div className="px-3 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 flex items-center gap-1.5">
                                                        📢 Kênh
                                                    </div>
                                                )}
                                            </div>
                                            <div className={`px-3 py-1 rounded-lg flex items-center gap-1.5 text-xs font-bold ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                                <FaUsers /> {g.members?.length || 0}
                                            </div>
                                        </div>

                                        <h3 className={`text-xl font-bold mb-1 truncate group-hover:text-indigo-500 transition-colors ${darkMode ? 'text-white' : 'text-slate-800'}`}>{g.groupName}</h3>
                                        <p className={`text-xs font-semibold mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Quản trị viên: <span className="text-indigo-500">@{g.owner}</span></p>
                                        
                                        <p className={`text-sm leading-relaxed mb-6 line-clamp-2 min-h-[2.5rem] ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                                            {g.description || 'Nhóm này chưa có mô tả.'}
                                        </p>

                                        <div className={`mt-auto pt-5 border-t ${darkMode ? 'border-white/10' : 'border-gray-100'}`}>
                                            {isJoined ? (
                                                <button 
                                                    onClick={() => onJoinSuccess(g.groupId, g.groupName)}
                                                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
                                                >
                                                    <FaComments size={16}/> Vào nhóm
                                                </button>
                                            ) : isPending ? (
                                                <div className="w-full py-3 rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 text-sm font-semibold flex items-center justify-center gap-2 animate-pulse border border-orange-200 dark:border-orange-500/20">
                                                    Đang chờ phê duyệt
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleRequestJoin(g.groupId); }}
                                                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
                                                >
                                                    Tham gia nhóm <FaArrowRight/>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GroupDiscovery;