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
        <div className={`flex-1 flex flex-col h-full overflow-hidden font-sans ${darkMode ? 'bg-[#0f172a]' : 'bg-white'}`}>
            {/* Header */}
            <div className={`p-8 border-b shrink-0 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
                <div>
                    <h2 className={`text-2xl font-bold flex items-center gap-3 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                        <FaPhoneAlt className="text-indigo-600" /> Nhật Ký Cuộc Gọi
                    </h2>
                    <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Lịch sử và nhật ký đàm thoại của bạn</p>
                </div>

                {/* Stats cards */}
                <div className="flex flex-wrap gap-4">
                    <div className={`px-5 py-3 rounded-2xl border flex flex-col text-center min-w-[80px] shadow-sm ${darkMode ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                        <span className="text-xs text-gray-500 font-semibold mb-1">Tổng</span>
                        <span className="text-lg font-bold text-indigo-600">{stats.total}</span>
                    </div>
                    <div className={`px-5 py-3 rounded-2xl border flex flex-col text-center min-w-[80px] shadow-sm ${darkMode ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                        <span className="text-xs text-gray-500 font-semibold mb-1">Đến</span>
                        <span className="text-lg font-bold text-emerald-500">{stats.incoming}</span>
                    </div>
                    <div className={`px-5 py-3 rounded-2xl border flex flex-col text-center min-w-[80px] shadow-sm ${darkMode ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                        <span className="text-xs text-gray-500 font-semibold mb-1">Đi</span>
                        <span className="text-lg font-bold text-blue-500">{stats.outgoing}</span>
                    </div>
                    <div className={`px-5 py-3 rounded-2xl border flex flex-col text-center min-w-[80px] shadow-sm ${darkMode ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                        <span className="text-xs text-gray-500 font-semibold mb-1">Nhỡ</span>
                        <span className="text-lg font-bold text-rose-500">{stats.missed}</span>
                    </div>
                </div>
            </div>

            {/* Main body */}
            <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
                {/* Search and Filters */}
                <div className={`p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
                    {/* Status Tabs */}
                    <div className={`flex p-1.5 rounded-xl self-start gap-1 ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                        {['all', 'incoming', 'outgoing', 'missed'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${filter === f ? 'bg-indigo-600 text-white shadow-sm' : (darkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-slate-900 hover:bg-white')}`}
                            >
                                {f === 'all' ? 'Tất cả' : f === 'incoming' ? 'Đến' : f === 'outgoing' ? 'Đi' : 'Nhỡ'}
                            </button>
                        ))}
                    </div>

                    {/* Search query */}
                    <div className="relative w-full sm:w-auto">
                        <span className="absolute left-4 top-3.5 text-gray-400"><FaSearch size={14} /></span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm liên hệ..."
                            className={`pl-10 pr-4 py-2.5 w-full sm:w-72 text-sm rounded-xl outline-none border focus:border-indigo-500 transition-colors ${darkMode ? 'bg-black/20 border-white/10 text-white placeholder:text-gray-500' : 'bg-white border-gray-200 text-slate-800 placeholder:text-gray-400'}`}
                        />
                    </div>
                </div>

                {/* Call History List */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {filteredCalls.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-50 min-h-[300px]">
                            <FaPhoneSlash size={64} className="mb-6 text-gray-400" />
                            <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Chưa có nhật ký cuộc gọi nào!</p>
                            <p className={`text-sm mt-2 max-w-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Các cuộc đàm thoại của bạn sẽ hiển thị ở đây.</p>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto space-y-4">
                            {filteredCalls.map(c => {
                                const callDateStr = formatCallTime(c.createdAt);
                                const durationStr = formatDuration(c.durationSec);

                                return (
                                    <div 
                                        key={c.callId || `${c.peerUsername}-${c.createdAt}`}
                                        className={`p-5 rounded-2xl border flex items-center justify-between gap-4 transition-all duration-300 hover:shadow-md ${darkMode ? 'bg-[#1e293b] border-white/10 hover:border-indigo-500/30' : 'bg-white border-gray-200 hover:border-indigo-200'} shadow-sm`}
                                    >
                                        <div className="flex items-center gap-5 min-w-0">
                                            {/* Avatar Area */}
                                            <div className="relative shrink-0">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-bold overflow-hidden border ${darkMode ? 'bg-slate-700 border-white/5' : 'bg-indigo-100 text-indigo-600 border-indigo-50'}`}>
                                                    {c.peerAvatar ? <img src={c.peerAvatar} className="w-full h-full object-cover" alt="" /> : c.peerUsername.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 ${darkMode ? 'border-[#1e293b]' : 'border-white'} ${c.isOnline ? "bg-emerald-500" : "bg-gray-400"}`}></div>
                                            </div>

                                            {/* Call Details */}
                                            <div className="min-w-0">
                                                <h3 className={`text-base font-bold truncate ${darkMode ? 'text-white' : 'text-slate-800'}`}>{c.peerDisplayName}</h3>
                                                
                                                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs font-semibold text-gray-500">
                                                    {/* Direction tag */}
                                                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${
                                                        c.isMissed ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' :
                                                        c.isIncoming ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                                                        'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                                                    }`}>
                                                        {c.isMissed ? <FaPhoneSlash size={10} /> : c.isIncoming ? <FaArrowDown size={10} /> : <FaArrowUp size={10} />}
                                                        {c.isMissed ? 'Cuộc gọi nhỡ' : c.isIncoming ? 'Cuộc gọi đến' : 'Cuộc gọi đi'}
                                                    </span>

                                                    {/* Time ago */}
                                                    <span className={`flex items-center gap-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        <FaCalendarAlt size={12} />
                                                        {callDateStr}
                                                    </span>

                                                    {/* Duration */}
                                                    {durationStr && (
                                                        <span className="flex items-center gap-1.5 text-indigo-500">
                                                            <FaClock size={12} />
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
                                                className={`px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm ${isCallBusy ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-white/5 dark:text-gray-500' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
                                            >
                                                <FaVideo size={14} /> Gọi lại
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
