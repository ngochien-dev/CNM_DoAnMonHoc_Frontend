import React, { useState } from 'react';
import { FaGlobe, FaLock, FaUserCheck, FaSearch, FaUsers, FaArrowRight, FaHashtag, FaFilter, FaUserPlus, FaGhost, FaComments } from 'react-icons/fa';

const GroupDiscovery = ({
    allGroups = [],
    user,
    handleRequestJoin,
    darkMode,
    onJoinSuccess,
    isLoading = false,
    error = ''
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const username = user?.username || '';

    const filteredGroups = (allGroups || []).filter(g => {
        // Chỉ hiện nhóm công khai trong phần khám phá
        if (!g?.isPublic) return false;

        const normalizedSearch = searchTerm.trim().toLowerCase();
        const groupName = g?.groupName || '';
        const owner = g?.owner || '';
        const matchesSearch = !normalizedSearch ||
            groupName.toLowerCase().includes(normalizedSearch) ||
            owner.toLowerCase().includes(normalizedSearch);
        const isJoined = g?.members?.includes(username) || owner === username;

        if (!matchesSearch) return false;
        switch (filterType) {
            case 'joined': return isJoined;
            case 'not_joined': return !isJoined;
            default: return true;
        }
    });

    const filterButtons = [
        { id: 'all', label: 'Tất cả', icon: <FaHashtag size={10}/> },
        { id: 'joined', label: 'Đã tham gia', icon: <FaUserCheck size={10}/> },
        { id: 'not_joined', label: 'Chưa tham gia', icon: <FaUserPlus size={10}/> },
    ];

    return (
        <div className="flex-1 flex flex-col h-full bg-transparent overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500 font-black italic uppercase tracking-tighter">
            <div className="p-8 pb-6">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-4xl font-black text-indigo-500 uppercase italic tracking-tighter flex items-center gap-4">
                            <FaGlobe className="drop-shadow-[0_0_10px_rgba(99,102,241,0.3)]"/> Discovery
                        </h1>
                        <p className="text-[10px] font-black uppercase tracking-[4px] text-gray-500 mt-1 ml-1">Vũ trụ cộng đồng OTT</p>
                    </div>

                    <div className="relative group">
                        <div className="absolute inset-0 bg-indigo-500/5 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                        <div className={`relative flex items-center border rounded-2xl px-4 py-3 backdrop-blur-xl focus-within:border-indigo-500/50 transition-all w-full md:w-96 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                            <FaSearch className="text-gray-500 group-focus-within:text-indigo-500 transition-colors" />
                            <input 
                                type="text"
                                placeholder="Tìm kiếm tên nhóm hoặc quản trị viên..."
                                className="bg-transparent border-none outline-none ml-3 w-full text-sm font-bold placeholder:text-gray-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className={`flex flex-wrap gap-2 items-center border-b pb-6 ${darkMode ? 'border-white/5' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-2 mr-4 text-gray-400 text-[9px] font-black uppercase tracking-widest">
                        <FaFilter/> Lọc theo:
                    </div>
                    {filterButtons.map(btn => (
                        <button
                            key={btn.id}
                            onClick={() => setFilterType(btn.id)}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${
                                filterType === btn.id 
                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20 scale-105' 
                                : (darkMode ? 'bg-white/5 border-transparent text-gray-500 hover:text-indigo-500 hover:bg-white/10' : 'bg-white border-gray-200 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 shadow-sm')
                            }`}
                        >
                            {btn.icon} {btn.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 pt-2 scrollbar-hide">
                {isLoading ? (
                    <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-gray-400 opacity-60">
                        <FaGlobe size={64} className="mb-4 animate-pulse text-indigo-400"/>
                        <p className="font-black uppercase tracking-[6px] text-lg">Đang tải nhóm...</p>
                    </div>
                ) : error ? (
                    <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-red-400 opacity-80 text-center px-6">
                        <FaGhost size={72} className="mb-4"/>
                        <p className="font-black uppercase tracking-[4px] text-lg">{error}</p>
                    </div>
                ) : filteredGroups.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-30">
                        <FaGhost size={80} className="mb-4"/>
                        <p className="font-black uppercase tracking-[10px] text-xl">Không tìm thấy nhóm nào</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3 gap-6 pb-10">
                        {filteredGroups.map(g => {
                            const groupId = g?.groupId;
                            const groupName = g?.groupName || 'Nhóm chưa đặt tên';
                            const owner = g?.owner || 'unknown';
                            const isJoined = g?.members?.includes(username) || owner === username;
                            const isPending = g?.pendingRequests?.includes(username);

                            return (
                                <div key={groupId || groupName} className="group relative">
                                    <div 
                                        onClick={() => isJoined && onJoinSuccess?.(groupId, groupName)}
                                        className={`relative h-full flex flex-col p-8 rounded-[40px] border transition-all duration-500 ${isJoined ? 'cursor-pointer' : ''} ${darkMode ? 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-indigo-500/50' : 'bg-gray-50 border-gray-200 hover:bg-white hover:shadow-xl'}`}
                                    >
                                        <div className="flex justify-between items-start mb-8">
                                            <div className="flex items-center gap-2">
                                                <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[2px] flex items-center gap-2 ${g?.isPublic ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                                    {g?.isPublic ? <FaGlobe/> : <FaLock/>} {g?.isPublic ? 'Công khai' : 'Riêng tư'}
                                                </div>
                                                {g?.isChannel && (
                                                    <div className="px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[2px] bg-purple-500/10 text-purple-400 flex items-center gap-1.5">
                                                        📢 Kênh
                                                    </div>
                                                )}
                                            </div>
                                            <div className={`px-3 py-1.5 rounded-xl flex items-center gap-2 text-[10px] font-black text-indigo-500 ${darkMode ? 'bg-white/10' : 'bg-indigo-50'}`}>
                                                <FaUsers /> {g?.members?.length || 0}
                                            </div>
                                        </div>

                                        <h3 className="text-2xl font-black mb-1 italic uppercase tracking-tighter group-hover:text-indigo-500 transition-colors truncate">#{groupName}</h3>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Quản trị viên: <span className="text-indigo-400">@{owner}</span></p>
                                        
                                        <p className={`text-xs font-normal normal-case not-italic tracking-normal mb-6 line-clamp-2 min-h-[2.5rem] leading-relaxed ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                                            {g?.description || 'Nhóm này chưa có mô tả.'}
                                        </p>

                                        <div className={`mt-auto pt-6 border-t ${darkMode ? 'border-white/5' : 'border-gray-100'}`}>
                                            {isJoined ? (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onJoinSuccess?.(groupId, groupName); }}
                                                    className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-[3px] transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-3"
                                                >
                                                    <FaComments size={14}/> Vào nhóm
                                                </button>
                                            ) : isPending ? (
                                                <div className="w-full py-4 rounded-2xl bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 animate-pulse border border-orange-500/20">
                                                    Đang chờ phê duyệt
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleRequestJoin?.(groupId); }}
                                                    className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-[3px] transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-3"
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
