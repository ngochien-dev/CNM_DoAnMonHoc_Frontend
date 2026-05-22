import React, { useState } from 'react';
import { FaTimes, FaSearch, FaCloud, FaGlobe } from 'react-icons/fa';

const ForwardMessageModal = ({
    isOpen,
    onClose,
    darkMode,
    user,
    allGroups,
    handleForwardMessage
}) => {
    const [forwardSearchQuery, setForwardSearchQuery] = useState('');

    if (!isOpen) return null;

    const handleClose = () => {
        setForwardSearchQuery('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[500] backdrop-blur-sm animate-in zoom-in-95 p-4">
            <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${darkMode ? 'bg-slate-900 border border-white/10' : 'bg-white'}`}>
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-indigo-600 text-white">
                    <h3 className="font-bold uppercase text-sm">Chuyển tiếp tin nhắn</h3>
                    <button onClick={handleClose} className="hover:text-red-300 transition-colors"><FaTimes /></button>
                </div>
                <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
                    {/* Premium Search Filter inside Modal */}
                    <div className="relative mb-2">
                        <input
                            type="text"
                            value={forwardSearchQuery}
                            onChange={e => setForwardSearchQuery(e.target.value)}
                            placeholder="Tìm bạn bè hoặc nhóm để chuyển tiếp..."
                            className={`w-full p-3 pl-10 rounded-xl text-xs font-bold border transition-colors outline-none focus:border-indigo-500 ${
                                darkMode ? 'bg-black/20 border-white/10 text-white placeholder:text-gray-500' : 'bg-gray-50 border-gray-200 text-slate-800 placeholder:text-slate-400'
                            }`}
                        />
                        <FaSearch className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`} />
                    </div>

                    <p className="text-xs text-gray-500 font-bold uppercase mb-2">Chọn nơi chuyển đến</p>
                    
                    {/* Lưu trữ cá nhân (Cloud) */}
                    {("cloud của tôi".includes(forwardSearchQuery.toLowerCase()) || "luu tru".includes(forwardSearchQuery.toLowerCase()) || "cloud".includes(forwardSearchQuery.toLowerCase())) && (
                        <div className="space-y-2 mb-4">
                            <div className="text-[10px] uppercase font-black text-cyan-400">Không gian cá nhân</div>
                            <button onClick={() => handleForwardMessage(`dm_${user.username}_${user.username}`)} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${darkMode ? 'border-white/5 hover:bg-white/5 text-gray-300 hover:border-indigo-500/40' : 'border-gray-200 hover:bg-gray-50 text-gray-700 hover:border-indigo-500'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-tr from-cyan-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-xs"><FaCloud/></div>
                                    <span className="font-semibold text-sm">Cloud của tôi</span>
                                </div>
                                <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider">Chọn ➔</span>
                            </button>
                        </div>
                    )}
                    
                    {/* Danh sách bạn bè */}
                    {user.friends?.filter(f => f.toLowerCase().includes(forwardSearchQuery.toLowerCase())).length > 0 && (
                        <div className="space-y-2">
                            <div className="text-[10px] uppercase font-black text-indigo-400">Bạn bè</div>
                            {user.friends.filter(f => f.toLowerCase().includes(forwardSearchQuery.toLowerCase())).map(f => (
                                <button key={f} onClick={() => handleForwardMessage(`dm_${[user.username, f].sort().join("_")}`)} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${darkMode ? 'border-white/5 hover:bg-white/5 text-gray-300 hover:border-indigo-500/40' : 'border-gray-200 hover:bg-gray-50 text-gray-700 hover:border-indigo-500'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-xs">{f[0].toUpperCase()}</div>
                                        <span className="font-semibold text-sm">@{f}</span>
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Chọn ➔</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Danh sách nhóm */}
                    {allGroups.filter(g => (g.members?.includes(user.username) || g.owner === user.username) && g.groupName.toLowerCase().includes(forwardSearchQuery.toLowerCase())).length > 0 && (
                        <div className="space-y-2 mt-4">
                            <div className="text-[10px] uppercase font-black text-orange-400">Nhóm</div>
                            {allGroups.filter(g => (g.members?.includes(user.username) || g.owner === user.username) && g.groupName.toLowerCase().includes(forwardSearchQuery.toLowerCase())).map(g => (
                                <button key={g.groupId} onClick={() => handleForwardMessage(g.groupId)} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${darkMode ? 'border-white/5 hover:bg-white/5 text-gray-300 hover:border-indigo-500/40' : 'border-gray-200 hover:bg-gray-50 text-gray-700 hover:border-indigo-500'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs"><FaGlobe/></div>
                                        <span className="font-semibold text-sm truncate">{g.groupName}</span>
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-orange-400 tracking-wider">Chọn ➔</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* No results notice */}
                    {user.friends?.filter(f => f.toLowerCase().includes(forwardSearchQuery.toLowerCase())).length === 0 &&
                     allGroups.filter(g => (g.members?.includes(user.username) || g.owner === user.username) && g.groupName.toLowerCase().includes(forwardSearchQuery.toLowerCase())).length === 0 && (
                        <div className="text-center py-6 text-xs text-gray-500 font-bold uppercase">Không tìm thấy kết quả chuyển tiếp nào trùng khớp</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForwardMessageModal;
