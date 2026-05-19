import React, { useState, useEffect, useMemo } from 'react';
import { 
    FaPhoneAlt, FaVideo, FaPhoneSlash, 
    FaClock, FaSearch, FaCalendarAlt, FaTrash, FaCircle,
    FaArrowDown, FaArrowUp
} from 'react-icons/fa';
import api from '../../services/api';

const CallHistoryTab = ({ user, callHistory = [], onlineUsers = {}, startCall, isCallBusy, darkMode }) => {
    const [detailsCache, setDetailsCache] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all'); // all, missed, incoming, outgoing

    // Fetch details of participants in the call history who aren't online
    useEffect(() => {
        const fetchMissing = async () => {
            const peers = (callHistory || []).map(call => 
                call.callerUsername === user.username ? call.calleeUsername : call.callerUsername
            );
            const uniquePeers = [...new Set(peers)];
            const missing = uniquePeers.filter(u => u && !detailsCache[u] && !onlineUsers[u]);
            if (missing.length === 0) return;
            
            const newCache = { ...detailsCache };
            for (const uname of missing) {
                try {
                    const res = await api.get(`/users/${uname}`);
                    if (res.data) newCache[uname] = res.data;
                } catch (e) {
                    console.error("Failed to load details for", uname, e);
                }
            }
            setDetailsCache(newCache);
        };
        fetchMissing();
    }, [callHistory, onlineUsers, user.username, detailsCache]);

    // Format Call Time Helper
    const formatCallTime = (isoString) => {
        if (!isoString) return "";
        const date = new Date(isoString);
        if (Number.isNaN(date.getTime())) return "";

        return date.toLocaleString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Format Duration Helper
    const formatDuration = (seconds) => {
        if (!seconds || seconds <= 0) return "";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins > 0) {
            return `${mins} phút ${secs} giây`;
        }
        return `${secs} giây`;
    };

    // Processed Call History list
    const processedCalls = useMemo(() => {
        return (callHistory || []).map(call => {
            const peerUsername = call.callerUsername === user.username ? call.calleeUsername : call.callerUsername;
            const peerInfo = onlineUsers[peerUsername] || detailsCache[peerUsername];
            const isIncoming = call.calleeUsername === user.username;
            const isMissed = call.status === 'missed' || call.status === 'rejected' || (isIncoming && call.status === 'timeout');

            return {
                ...call,
                peerUsername,
                peerDisplayName: peerInfo?.displayName || peerUsername,
                peerAvatar: peerInfo?.avatar,
                isIncoming,
                isMissed,
                isOnline: !!onlineUsers[peerUsername]
            };
        });
    }, [callHistory, detailsCache, onlineUsers, user.username]);

    // Calculate stats
    const stats = useMemo(() => {
        const total = processedCalls.length;
        const missed = processedCalls.filter(c => c.isMissed).length;
        const incoming = processedCalls.filter(c => c.isIncoming && !c.isMissed).length;
        const outgoing = processedCalls.filter(c => !c.isIncoming && !c.isMissed).length;

        return { total, missed, incoming, outgoing };
    }, [processedCalls]);

    // Filter and Search
    const filteredCalls = useMemo(() => {
        return processedCalls.filter(call => {
            // Filter by type
            if (filter === 'missed') return call.isMissed;
            if (filter === 'incoming') return call.isIncoming && !call.isMissed;
            if (filter === 'outgoing') return !call.isIncoming && !call.isMissed;
            return true;
        }).filter(call => {
            // Filter by Search Query
            const query = searchQuery.toLowerCase();
            return call.peerDisplayName.toLowerCase().includes(query) || call.peerUsername.toLowerCase().includes(query);
        });
    }, [processedCalls, filter, searchQuery]);

    const handleCallPeer = (peerUsername) => {
        if (!startCall || isCallBusy) return;
        const dmRoomId = `dm_${[user.username, peerUsername].sort().join("_")}`;
        startCall(peerUsername, dmRoomId);
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden font-black tracking-tighter uppercase italic">
            {/* Header */}
            <div className={`p-6 border-b shrink-0 flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${darkMode ? 'border-white/5 bg-slate-900/40' : 'border-gray-200 bg-white shadow-sm'}`}>
                <div>
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                        <FaPhoneAlt className="text-cyan-500 text-3xl" /> Nhật Ký Cuộc Gọi
                    </h2>
                    <p className="text-xs text-gray-500 font-medium tracking-normal lowercase not-italic">Lịch sử và nhật ký đàm thoại của bạn</p>
                </div>

                {/* Stats cards */}
                <div className="flex flex-wrap gap-2.5">
                    <div className={`px-4 py-2 rounded-2xl border flex flex-col text-center min-w-[70px] ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-gray-200'}`}>
                        <span className="text-[9px] text-gray-400 font-medium">Tổng</span>
                        <span className="text-sm font-black text-indigo-500">{stats.total}</span>
                    </div>
                    <div className={`px-4 py-2 rounded-2xl border flex flex-col text-center min-w-[70px] ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-gray-200'}`}>
                        <span className="text-[9px] text-gray-400 font-medium">Đến</span>
                        <span className="text-sm font-black text-green-500">{stats.incoming}</span>
                    </div>
                    <div className={`px-4 py-2 rounded-2xl border flex flex-col text-center min-w-[70px] ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-gray-200'}`}>
                        <span className="text-[9px] text-gray-400 font-medium">Đi</span>
                        <span className="text-sm font-black text-blue-500">{stats.outgoing}</span>
                    </div>
                    <div className={`px-4 py-2 rounded-2xl border flex flex-col text-center min-w-[70px] ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-gray-200'}`}>
                        <span className="text-[9px] text-gray-400 font-medium">Nhỡ</span>
                        <span className="text-sm font-black text-red-500">{stats.missed}</span>
                    </div>
                </div>
            </div>

            {/* Main body */}
            <div className={`flex-1 flex flex-col overflow-hidden ${darkMode ? 'bg-transparent' : 'bg-slate-50/50'}`}>
                {/* Search and Filters */}
                <div className={`p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 ${darkMode ? 'border-white/5' : 'border-gray-200 bg-white'}`}>
                    {/* Status Tabs */}
                    <div className="flex bg-slate-800/10 dark:bg-black/20 p-1 rounded-xl self-start gap-1">
                        {['all', 'incoming', 'outgoing', 'missed'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${filter === f ? 'bg-cyan-500 text-white shadow-md' : (darkMode ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')}`}
                            >
                                {f === 'all' ? 'Tất cả' : f === 'incoming' ? 'Đến' : f === 'outgoing' ? 'Đi' : 'Nhỡ'}
                            </button>
                        ))}
                    </div>

                    {/* Search query */}
                    <div className="relative">
                        <span className="absolute left-3.5 top-3 text-gray-500"><FaSearch size={14} /></span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm liên hệ gọi..."
                            className={`pl-10 pr-4 py-2.5 w-full sm:w-64 text-xs rounded-xl outline-none border focus:border-cyan-500 font-semibold ${darkMode ? 'bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500' : 'bg-white border-gray-200 text-slate-800 placeholder:text-gray-400'}`}
                        />
                    </div>
                </div>

                {/* Call History List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {filteredCalls.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-30">
                            <FaPhoneSlash size={64} className="mb-4 text-cyan-400 animate-pulse" />
                            <p className="font-black text-lg">Chưa có nhật ký cuộc gọi nào!</p>
                            <p className="text-xs max-w-sm mt-1 not-italic font-sans lowercase">Các cuộc đàm thoại của bạn sẽ hiển thị ở đây.</p>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto space-y-3">
                            {filteredCalls.map(c => {
                                const callDateStr = formatCallTime(c.createdAt);
                                const durationStr = formatDuration(c.durationSec);

                                return (
                                    <div 
                                        key={c.callId || `${c.peerUsername}-${c.createdAt}`}
                                        className={`p-4 rounded-3xl border flex items-center justify-between gap-4 transition-all hover:scale-[1.01] ${darkMode ? 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/60' : 'bg-white border-gray-200 hover:bg-slate-50'} shadow-sm`}
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            {/* Avatar Area */}
                                            <div className="relative">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-base font-black overflow-hidden shrink-0 border ${darkMode ? 'bg-slate-700 border-white/5' : 'bg-slate-200 border-gray-100'}`}>
                                                    {c.peerAvatar ? <img src={c.peerAvatar} className="w-full h-full object-cover" alt="" /> : c.peerUsername.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 ${darkMode ? 'border-slate-800' : 'border-white'} ${c.isOnline ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`}></div>
                                            </div>

                                            {/* Call Details */}
                                            <div className="min-w-0">
                                                <h3 className={`text-base font-black truncate ${darkMode ? 'text-white' : 'text-slate-800'}`}>{c.peerDisplayName}</h3>
                                                
                                                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] font-bold text-gray-500 not-italic font-sans">
                                                    {/* Direction tag */}
                                                    <span className={`flex items-center gap-1 font-black tracking-wider uppercase text-[8px] px-2 py-0.5 rounded-full ${
                                                        c.isMissed ? 'bg-red-500/10 text-red-500' :
                                                        c.isIncoming ? 'bg-green-500/10 text-green-500' :
                                                        'bg-blue-500/10 text-blue-500'
                                                    }`}>
                                                        {c.isMissed ? <FaPhoneSlash size={8} /> : c.isIncoming ? <FaArrowDown size={8} /> : <FaArrowUp size={8} />}
                                                        {c.isMissed ? 'Cuộc gọi nhỡ' : c.isIncoming ? 'Cuộc gọi đến' : 'Cuộc gọi đi'}
                                                    </span>

                                                    {/* Time ago */}
                                                    <span className="flex items-center gap-1 text-[9px] opacity-70">
                                                        <FaCalendarAlt size={8} />
                                                        {callDateStr}
                                                    </span>

                                                    {/* Duration */}
                                                    {durationStr && (
                                                        <span className="flex items-center gap-1 text-[9px] text-cyan-500 font-bold">
                                                            <FaClock size={8} />
                                                            {durationStr}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => handleCallPeer(c.peerUsername)}
                                                disabled={isCallBusy}
                                                className={`px-4 py-3 rounded-2xl text-[10px] font-black tracking-widest flex items-center gap-2 transition-all ${isCallBusy ? 'bg-slate-700/50 text-gray-600 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md active:scale-95 shadow-cyan-500/20'}`}
                                            >
                                                <FaVideo size={12} /> GỌI LẠI
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

export default CallHistoryTab;
