import React, { useState, useEffect } from 'react';
import { FaUserPlus, FaTimes, FaSearch, FaUserCheck, FaChevronRight, FaCompass } from 'react-icons/fa';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const AddFriendModal = ({ isOpen, onClose, user, loadData, darkMode }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [searching, setSearching] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [sentRequests, setSentRequests] = useState(user.sentRequests || []);

    // Load suggestions on open
    useEffect(() => {
        if (isOpen && user?.username) {
            fetchSuggestions();
            setSearchResult(null);
            setSearchQuery('');
        }
    }, [isOpen, user]);

    // Keep sent requests updated
    useEffect(() => {
        if (user) {
            setSentRequests(user.sentRequests || []);
        }
    }, [user]);

    const fetchSuggestions = async () => {
        setLoadingSuggestions(true);
        try {
            const res = await api.get(`/users/suggestions/list?username=${user.username}`);
            setSuggestions(res.data);
        } catch (err) {
            console.error("Lỗi lấy danh sách gợi ý kết bạn:", err);
        } finally {
            setLoadingSuggestions(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        const query = searchQuery.trim();
        if (!query) return;

        setSearching(true);
        setSearchResult(null);
        try {
            const res = await api.get(`/users/${query}`);
            if (res.data && res.data.username) {
                setSearchResult(res.data);
            } else {
                setSearchResult({ notFound: true, query });
            }
        } catch (err) {
            setSearchResult({ notFound: true, query });
        } finally {
            setSearching(false);
        }
    };

    const handleSendRequest = async (targetUsername) => {
        try {
            const res = await api.post('/friends/request', {
                fromUser: user.username,
                toUser: targetUsername
            });
            toast.success(`Đã gửi lời mời kết bạn tới @${targetUsername}!`);
            
            // Local update of sent requests state
            setSentRequests(prev => [...prev, targetUsername]);
            
            // Refresh data
            if (loadData) loadData();
        } catch (err) {
            const errorMsg = err.response?.data?.error || "Gửi lời mời kết bạn thất bại.";
            toast.error(errorMsg);
        }
    };

    const handleAcceptRequest = async (targetUsername) => {
        try {
            await api.post('/friends/accept', {
                me: user.username,
                friendUname: targetUsername
            });
            toast.success(`Đã đồng ý kết bạn với @${targetUsername}!`);
            if (loadData) loadData();
            // Re-fetch suggestions
            fetchSuggestions();
        } catch (err) {
            toast.error("Lỗi đồng ý kết bạn.");
        }
    };

    if (!isOpen) return null;

    const isFriend = (targetUname) => (user.friends || []).includes(targetUname);
    const hasSent = (targetUname) => sentRequests.includes(targetUname);
    const hasReceived = (targetUname) => (user.friendRequests || []).includes(targetUname);

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[500] backdrop-blur-md animate-fade-in p-4">
            <div className={`w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border transition-all duration-300 transform scale-100 ${
                darkMode ? 'bg-[#0f172a] border-white/10 text-white' : 'bg-white border-gray-200 text-slate-800'
            }`}>
                {/* Header */}
                <div className="p-6 bg-gradient-to-r from-indigo-500 to-indigo-700 text-white flex justify-between items-center">
                    <h3 className="font-black uppercase tracking-widest text-[13px] flex items-center gap-2">
                        <FaUserPlus size={18} className="animate-pulse" /> Kết bạn / Thêm bạn bè
                    </h3>
                    <button 
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-white/10 text-white transition-colors"
                        title="Đóng"
                    >
                        <FaTimes size={16} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Search Field */}
                    <form onSubmit={handleSearch} className="space-y-3">
                        <label className={`text-[10px] font-black uppercase tracking-wider ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                            Tìm kiếm theo Username
                        </label>
                        <div className={`flex items-center rounded-2xl px-4 py-3 border transition-all ${
                            darkMode ? 'bg-black/40 border-white/10 focus-within:border-indigo-500' : 'bg-slate-50 border-gray-200 focus-within:border-indigo-600'
                        }`}>
                            <FaSearch className={`text-indigo-500 text-sm mr-3 ${searching ? 'animate-spin' : ''}`} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Nhập username của bạn bè..."
                                className={`bg-transparent border-none outline-none w-full text-sm font-bold ${
                                    darkMode ? 'text-white placeholder:text-slate-600' : 'text-slate-850 placeholder:text-slate-400'
                                }`}
                                autoFocus
                            />
                            {searchQuery && (
                                <button type="button" onClick={() => { setSearchQuery(''); setSearchResult(null); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                                    <FaTimes size={12} />
                                </button>
                            )}
                        </div>
                        <button 
                            type="submit" 
                            className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-all text-xs active:scale-95 shadow-md shadow-indigo-500/10"
                        >
                            Tìm kiếm
                        </button>
                    </form>

                    {/* Search Result */}
                    {searchResult && (
                        <div className={`p-4 rounded-2xl border ${
                            darkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-gray-150'
                        }`}>
                            {searchResult.notFound ? (
                                <p className="text-xs text-center text-red-500 font-bold">
                                    Không tìm thấy người dùng "{searchResult.query}"
                                </p>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center overflow-hidden text-white font-black shrink-0">
                                            {searchResult.avatar ? (
                                                <img src={searchResult.avatar} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                searchResult.username[0].toUpperCase()
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className={`text-sm font-black truncate ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                                                {searchResult.displayName || searchResult.username}
                                            </p>
                                            <p className="text-[10px] text-gray-500">@{searchResult.username}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Action Buttons */}
                                    {isFriend(searchResult.username) ? (
                                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-[10px] font-black uppercase">
                                            <FaUserCheck /> Bạn bè
                                        </span>
                                    ) : hasSent(searchResult.username) ? (
                                        <span className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl text-[10px] font-black uppercase">
                                            Đã gửi lời mời
                                        </span>
                                    ) : hasReceived(searchResult.username) ? (
                                        <button 
                                            onClick={() => handleAcceptRequest(searchResult.username)}
                                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-md active:scale-95"
                                        >
                                            Chấp nhận
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => handleSendRequest(searchResult.username)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-md active:scale-95"
                                        >
                                            <FaUserPlus /> Kết bạn
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Suggestions Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-gray-400' : 'text-slate-500'} flex items-center gap-1.5`}>
                                <FaCompass className="text-indigo-400" /> Gợi ý kết bạn
                            </h4>
                            <button 
                                onClick={fetchSuggestions} 
                                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-black uppercase tracking-wider"
                                disabled={loadingSuggestions}
                            >
                                Làm mới
                            </button>
                        </div>

                        {loadingSuggestions ? (
                            <div className="flex justify-center py-6">
                                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : suggestions.length === 0 ? (
                            <p className="text-[10px] text-center text-gray-500 italic py-4">
                                Hiện không có gợi ý kết bạn mới nào
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {suggestions.map(s => (
                                    <div 
                                        key={s.username} 
                                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                                            darkMode ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-slate-50 border-gray-150 hover:bg-slate-100/50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center overflow-hidden text-white font-black shrink-0 text-xs">
                                                {s.avatar ? (
                                                    <img src={s.avatar} className="w-full h-full object-cover" alt="" />
                                                ) : (
                                                    s.username[0].toUpperCase()
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className={`text-xs font-black truncate ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                                                    {s.displayName || s.username}
                                                </p>
                                                <p className="text-[9px] text-gray-500">@{s.username}</p>
                                            </div>
                                        </div>

                                        {hasSent(s.username) ? (
                                            <span className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg text-[9px] font-black uppercase">
                                                Đã gửi
                                            </span>
                                        ) : (
                                            <button 
                                                onClick={() => handleSendRequest(s.username)}
                                                className="flex items-center gap-1 px-2.5 py-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase transition-all shadow-md active:scale-95"
                                            >
                                                <FaUserPlus /> Thêm
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddFriendModal;
