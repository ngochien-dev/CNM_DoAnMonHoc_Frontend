import React, { useState } from 'react';
import { FaGlobe, FaLock, FaUserCheck, FaSearch, FaUsers, FaArrowRight, FaHashtag, FaFilter, FaUserPlus, FaGhost, FaComments } from 'react-icons/fa';

const GroupDiscovery = ({ allGroups, user, handleRequestJoin, darkMode, onJoinSuccess }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    const filteredGroups = allGroups.filter(g => {
        const matchesSearch = g.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             g.owner.toLowerCase().includes(searchTerm.toLowerCase());
        const isJoined = g.members?.includes(user.username) || g.owner === user.username;

        if (!matchesSearch) return false;
        switch (filterType) {
            case 'public': return g.isPublic;
            case 'private': return !g.isPublic;
            case 'joined': return isJoined;
            case 'not_joined': return !isJoined;
            default: return true;
        }
    });

    const filterButtons = [
        { id: 'all', label: 'Tất cả', icon: <FaHashtag size={10}/> },
        { id: 'public', label: 'Công khai', icon: <FaGlobe size={10}/> },
        { id: 'private', label: 'Riêng tư', icon: <FaLock size={10}/> },
        { id: 'joined', label: 'Đã vào', icon: <FaUserCheck size={10}/> },
        { id: 'not_joined', label: 'Chưa vào', icon: <FaUserPlus size={10}/> },
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
                                placeholder="Tìm phòng chat..."
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
                {filteredGroups.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-30">
                        <FaGhost size={80} className="mb-4"/>
                        <p className="font-black uppercase tracking-[10px] text-xl">Empty Space</p>
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
                                        className={`relative h-full flex flex-col p-8 rounded-[40px] border transition-all duration-500 ${isJoined ? 'cursor-pointer' : ''} ${darkMode ? 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-indigo-500/50' : 'bg-gray-50 border-gray-200 hover:bg-white hover:shadow-xl'}`}
                                    >
                                        <div className="flex justify-between items-start mb-8">
                                            <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[2px] flex items-center gap-2 ${g.isPublic ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                                {g.isPublic ? <FaGlobe/> : <FaLock/>} {g.isPublic ? 'Public' : 'Private'}
                                            </div>
                                            <div className={`px-3 py-1.5 rounded-xl flex items-center gap-2 text-[10px] font-black text-indigo-500 ${darkMode ? 'bg-white/10' : 'bg-indigo-50'}`}>
                                                <FaUsers /> {g.members?.length || 0}
                                            </div>
                                        </div>

                                        <h3 className="text-2xl font-black mb-1 italic uppercase tracking-tighter group-hover:text-indigo-500 transition-colors truncate">#{g.groupName}</h3>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-8">Host: <span className="text-indigo-400">@{g.owner}</span></p>

                                        <div className={`mt-auto pt-6 border-t ${darkMode ? 'border-white/5' : 'border-gray-100'}`}>
                                            {isJoined ? (
                                                <button 
                                                    onClick={() => onJoinSuccess(g.groupId, g.groupName)}
                                                    className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-[3px] transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-3"
                                                >
                                                    <FaComments size={14}/> Vào đoạn chat
                                                </button>
                                            ) : isPending ? (
                                                <div className="w-full py-4 rounded-2xl bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 animate-pulse border border-orange-500/20">
                                                    Chờ phê duyệt
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleRequestJoin(g.groupId); }}
                                                    className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-[3px] transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-3"
                                                >
                                                    Gia nhập vũ trụ <FaArrowRight/>
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