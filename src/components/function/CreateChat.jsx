import React, { useState, useEffect } from 'react';
import { FaTimes, FaSearch, FaCamera, FaCheck, FaUsers, FaGlobe } from 'react-icons/fa';
import api from '../../services/api';

const CreateChat = ({ user, isOpen, onClose, onCreateGroup, darkMode, isPublicMode }) => {
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFriends, setSelectedFriends] = useState([]);
    
    const [friendsDetails, setFriendsDetails] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Load friend details when modal opens
    useEffect(() => {
        if (isOpen && user) {
            setGroupName('');
            setGroupDescription('');
            setSearchQuery('');
            setSelectedFriends([]);
            if (!isPublicMode) {
                fetchFriendsDetails();
            }
        }
    }, [isOpen, user, isPublicMode]);

    const fetchFriendsDetails = async () => {
        setLoadingDetails(true);
        try {
            const list = user.friends || [];
            const details = await Promise.all(
                list.map(async (uname) => {
                    try {
                        const res = await api.get(`/users/${uname}`);
                        return res.data;
                    } catch (e) {
                        return { username: uname, displayName: uname, avatar: null };
                    }
                })
            );
            // Sort alphabetically by display name
            const sortedDetails = details
                .filter(d => d && d.username)
                .sort((a, b) => {
                    const nameA = a.displayName || a.username;
                    const nameB = b.displayName || b.username;
                    return nameA.localeCompare(nameB);
                });
            setFriendsDetails(sortedDetails);
        } catch (err) {
            console.error("Lỗi tải chi tiết bạn bè:", err);
        } finally {
            setLoadingDetails(false);
        }
    };

    if (!isOpen) return null;

    const handleToggleFriend = (username) => {
        if (selectedFriends.includes(username)) {
            setSelectedFriends(prev => prev.filter(u => u !== username));
        } else {
            setSelectedFriends(prev => [...prev, username]);
        }
    };

    const handleDeselectFriend = (username) => {
        setSelectedFriends(prev => prev.filter(u => u !== username));
    };

    const handleCreate = () => {
        if (isPublicMode) {
            const finalGroupName = groupName.trim();
            if (!finalGroupName) return;
            onCreateGroup(finalGroupName, true, false, [], groupDescription.trim());
            onClose();
        } else {
            if (selectedFriends.length < 2) return;
            
            let finalGroupName = groupName.trim();
            if (!finalGroupName) {
                // Get names of first 3 selected friends (or all if fewer)
                const firstThree = selectedFriends.slice(0, 3).map(uname => {
                    const friend = friendsDetails.find(f => f.username === uname);
                    return friend ? (friend.displayName || friend.username) : uname;
                });
                finalGroupName = firstThree.join(', ');
            }

            // Call parent onCreateGroup with finalGroupName, isPublic = false, isChannel = false, selectedFriends
            onCreateGroup(finalGroupName, false, false, selectedFriends);
            onClose();
        }
    };

    // Filter friends list based on search query
    const filteredFriends = friendsDetails.filter(f => {
        const query = searchQuery.toLowerCase();
        const displayName = (f.displayName || f.username).toLowerCase();
        const username = f.username.toLowerCase();
        const phone = (f.phone || '').toLowerCase();
        return displayName.includes(query) || username.includes(query) || phone.includes(query);
    });

    // Group friends alphabetically
    const friendsByLetter = {};
    filteredFriends.forEach(f => {
        const name = f.displayName || f.username;
        const firstLetter = name[0].toUpperCase();
        const letter = /[A-Z]/.test(firstLetter) ? firstLetter : '#';
        if (!friendsByLetter[letter]) {
            friendsByLetter[letter] = [];
        }
        friendsByLetter[letter].push(f);
    });

    const alphabet = Object.keys(friendsByLetter).sort();

    const containerBg = darkMode ? 'bg-[#0f172a] text-white border-white/10' : 'bg-white text-slate-800 border-gray-200';
    const inputBg = darkMode ? 'bg-black/30 border-white/10 text-white focus-within:border-indigo-500' : 'bg-slate-50 border-gray-200 text-slate-800 focus-within:border-indigo-600';
    const textClass = darkMode ? 'text-white' : 'text-slate-800';
    const activeText = darkMode ? 'text-white' : 'text-slate-900';
    const secondaryText = darkMode ? 'text-slate-400' : 'text-slate-500';
    const hoverBg = darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50';
    const selectedPaneBg = darkMode ? 'bg-white/2 border-white/5' : 'bg-slate-50 border-gray-100';

    if (isPublicMode) {
        return (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[500] backdrop-blur-md animate-fade-in p-4">
                <div className={`w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border flex flex-col transition-all duration-300 ${containerBg}`}>
                    {/* Header */}
                    <div className={`p-4 border-b flex justify-between items-center ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
                        <div className="flex items-center gap-2 text-indigo-500">
                            <FaGlobe size={18} />
                            <h3 className="font-bold text-base">Tạo nhóm cộng đồng</h3>
                        </div>
                        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                            <FaTimes size={18} />
                        </button>
                    </div>

                    {/* Body Content */}
                    <div className="p-6 space-y-5">
                        {/* Group Name Row */}
                        <div className="flex items-center gap-3">
                            <button className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-sm ${darkMode ? 'bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300' : 'bg-slate-100 border border-gray-200 hover:bg-slate-200 text-slate-500'}`}>
                                <FaCamera size={16} />
                            </button>
                            <input 
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                placeholder="Nhập tên nhóm cộng đồng..."
                                className="flex-1 bg-transparent border-b border-gray-300 dark:border-white/20 py-2 outline-none font-bold text-sm focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                            />
                        </div>

                        {/* Group Description Row */}
                        <div className="flex flex-col gap-1.5">
                            <label className={`text-xs font-bold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Mô tả nhóm cộng đồng</label>
                            <textarea 
                                value={groupDescription}
                                onChange={(e) => setGroupDescription(e.target.value)}
                                placeholder="Mô tả mục đích nhóm, nội quy ngắn gọn..."
                                rows={3}
                                className={`w-full rounded-2xl border p-4 outline-none text-xs font-medium focus:border-indigo-500 transition-colors resize-none ${
                                    darkMode ? 'bg-black/30 border-white/10 text-white' : 'bg-slate-50 border-gray-200 text-slate-800'
                                }`}
                            />
                        </div>

                        {/* Notice Box */}
                        <div className={`p-4 rounded-2xl border text-xs leading-relaxed flex items-start gap-3 ${
                            darkMode ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' : 'bg-indigo-50 border-indigo-100 text-indigo-700'
                        }`}>
                            <span className="text-base mt-0.5">📢</span>
                            <div>
                                <p className="font-bold mb-1">Vũ trụ cộng đồng</p>
                                <p className="opacity-90">Nhóm cộng đồng này sẽ được hiển thị công khai. Tất cả người dùng đều có thể tìm thấy và tham gia nhóm thông qua mục Khám phá.</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className={`p-4 border-t flex justify-end gap-3 ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
                        <button 
                            onClick={onClose}
                            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                darkMode ? 'bg-white/5 hover:bg-white/10 text-gray-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            }`}
                        >
                            Hủy
                        </button>
                        <button 
                            onClick={handleCreate}
                            disabled={!groupName.trim()}
                            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                                groupName.trim()
                                    ? 'bg-blue-600 hover:bg-blue-500 text-white hover:scale-[1.02] active:scale-95' 
                                    : 'bg-gray-300 dark:bg-slate-800 text-gray-500 dark:text-slate-600 cursor-not-allowed shadow-none'
                            }`}
                        >
                            Tạo nhóm
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[500] backdrop-blur-md animate-fade-in p-4">
            <div className={`w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border flex flex-col h-[650px] transition-all duration-300 ${containerBg}`}>
                {/* Header */}
                <div className={`p-4 border-b flex justify-between items-center ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
                    <h3 className="font-bold text-lg">Tạo nhóm</h3>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                        <FaTimes size={18} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Column: Form & Friends list */}
                    <div className={`w-[60%] flex flex-col p-5 space-y-4 border-r overflow-y-auto scrollbar-hide ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
                        {/* Group Name Row */}
                        <div className="flex items-center gap-3">
                            <button className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-sm ${darkMode ? 'bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300' : 'bg-slate-100 border border-gray-200 hover:bg-slate-200 text-slate-500'}`}>
                                <FaCamera size={16} />
                            </button>
                            <input 
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                placeholder="Nhập tên nhóm..."
                                className="flex-1 bg-transparent border-b border-gray-300 dark:border-white/20 py-2 outline-none font-bold text-sm focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                            />
                        </div>

                        {/* Search Row */}
                        <div className={`flex items-center rounded-full px-4 py-2.5 border transition-all ${inputBg}`}>
                            <FaSearch className="text-gray-400 text-sm mr-3" />
                            <input 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Nhập tên, số điện thoại hoặc username"
                                className="bg-transparent border-none outline-none w-full text-xs font-medium"
                            />
                        </div>

                        {/* Quick filter */}
                        <div>
                            <span className="px-3.5 py-1.5 bg-blue-600 text-white rounded-full text-xs font-bold shadow-sm">
                                Tất cả
                            </span>
                        </div>

                        {/* Friends List section */}
                        <div className="flex-1 overflow-y-auto pr-1">
                            <h4 className="text-xs font-bold mb-3">Trò chuyện gần đây</h4>
                            {loadingDetails ? (
                                <div className="flex justify-center py-8">
                                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : filteredFriends.length === 0 ? (
                                <p className="text-xs text-gray-500 italic text-center py-8">Không tìm thấy bạn bè nào</p>
                            ) : (
                                <div className="space-y-4">
                                    {alphabet.map(letter => (
                                        <div key={letter} className="space-y-2">
                                            <div className="text-[10px] font-bold text-indigo-500 tracking-wider uppercase px-1">{letter}</div>
                                            {friendsByLetter[letter].map(friend => {
                                                const isSelected = selectedFriends.includes(friend.username);
                                                return (
                                                    <div 
                                                        key={friend.username}
                                                        onClick={() => handleToggleFriend(friend.username)}
                                                        className={`flex items-center justify-between p-2 rounded-2xl cursor-pointer transition-all ${hoverBg}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                                                isSelected 
                                                                    ? 'bg-blue-600 border-blue-600 text-white' 
                                                                    : (darkMode ? 'border-white/20' : 'border-gray-300')
                                                            }`}>
                                                                {isSelected && <FaCheck size={10} />}
                                                            </div>
                                                            <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center text-white font-bold shrink-0 text-sm">
                                                                {friend.avatar ? (
                                                                    <img src={friend.avatar} className="w-full h-full object-cover" alt="" />
                                                                ) : (
                                                                    (friend.displayName || friend.username)[0].toUpperCase()
                                                                )}
                                                            </div>
                                                            <span className="text-xs font-bold">{friend.displayName || friend.username}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Selected list */}
                    <div className={`w-[40%] flex flex-col p-5 space-y-4 ${selectedPaneBg}`}>
                        <div className="flex justify-between items-center">
                            <h4 className="text-xs font-bold">
                                Đã chọn <span className="text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-md ml-1">{selectedFriends.length}/100</span>
                            </h4>
                        </div>

                        {selectedFriends.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                                <FaUsers size={32} className="mb-2 text-slate-400" />
                                <p className="text-[10px] font-bold">Chưa chọn thành viên nào</p>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
                                {selectedFriends.map(uname => {
                                    const friend = friendsDetails.find(f => f.username === uname) || { username: uname, displayName: uname };
                                    return (
                                        <div 
                                            key={uname}
                                            className={`flex items-center justify-between p-2 rounded-xl border ${
                                                darkMode ? 'bg-white/5 border-white/5' : 'bg-white border-gray-150 shadow-sm'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-8 h-8 rounded-full bg-slate-750 overflow-hidden flex items-center justify-center text-white font-bold text-xs shrink-0">
                                                    {friend.avatar ? (
                                                        <img src={friend.avatar} className="w-full h-full object-cover" alt="" />
                                                    ) : (
                                                        (friend.displayName || friend.username)[0].toUpperCase()
                                                    )}
                                                </div>
                                                <span className="text-xs font-bold truncate">{friend.displayName || friend.username}</span>
                                            </div>
                                            <button 
                                                onClick={() => handleDeselectFriend(uname)}
                                                className="p-1 rounded-full bg-red-500/10 text-red-500 hover:bg-red-50 hover:text-white transition-colors"
                                                title="Hủy chọn"
                                            >
                                                <FaTimes size={10} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className={`p-4 border-t flex justify-end gap-3 ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
                    <button 
                        onClick={onClose}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            darkMode ? 'bg-white/5 hover:bg-white/10 text-gray-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                    >
                        Hủy
                    </button>
                    <button 
                        onClick={handleCreate}
                        disabled={selectedFriends.length < 2}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                            selectedFriends.length >= 2 
                                ? 'bg-blue-600 hover:bg-blue-500 text-white hover:scale-[1.02] active:scale-95' 
                                : 'bg-gray-300 dark:bg-slate-800 text-gray-500 dark:text-slate-600 cursor-not-allowed shadow-none'
                        }`}
                    >
                        Tạo nhóm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateChat;