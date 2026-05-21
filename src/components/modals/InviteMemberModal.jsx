import React from 'react';
import { FaTimes } from 'react-icons/fa';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const InviteMemberModal = ({ isOpen, onClose, activeRoom, user, allGroups, onlineUsers, darkMode, loadData }) => {
    if (!isOpen || !activeRoom) return null;

    return (
        <div className="fixed inset-0 bg-[#020617]/80 flex items-center justify-center z-[300] backdrop-blur-md p-4 animate-in zoom-in-95">
            <div className={`w-[420px] rounded-[40px] p-8 shadow-2xl border ${darkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-gray-100 text-slate-800'}`}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black uppercase italic tracking-tighter text-indigo-500">Mời thành viên</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition-colors"><FaTimes size={20} /></button>
                </div>
                <p className={`text-xs mb-6 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Chọn bạn bè để mời vào nhóm <b>{activeRoom.name}</b></p>

                <div className="max-h-[300px] overflow-y-auto space-y-2 scrollbar-hide">
                    {(user.friends || []).filter(f => {
                        const grp = allGroups.find(g => g.groupId === activeRoom.id);
                        return grp && !(grp.members || []).includes(f);
                    }).map(f => (
                        <div key={f} className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${darkMode ? 'bg-white/2 border-white/5 hover:bg-white/5' : 'bg-slate-50 border-gray-100 hover:bg-slate-100'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm uppercase overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-slate-300'}`}>
                                    {onlineUsers[f]?.avatar ? <img src={onlineUsers[f].avatar} className="w-full h-full object-cover" alt="" /> : f[0]}
                                </div>
                                <div>
                                    <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{onlineUsers[f]?.displayName || f}</p>
                                    <p className={`text-[9px] ${onlineUsers[f] ? 'text-emerald-400' : 'text-gray-500'}`}>{onlineUsers[f] ? 'Online' : 'Offline'}</p>
                                </div>
                            </div>
                            <button
                                onClick={async () => {
                                    try {
                                        await api.post('/groups/invite', { groupId: activeRoom.id, targetUsername: f });
                                        toast(`Đã mời @${f} vào nhóm!`, { icon: '✅', style: { borderRadius: '10px', background: '#333', color: '#fff' } });
                                        loadData();
                                    } catch (err) {
                                        toast(err.response?.data?.error || 'Lỗi mời thành viên!', { icon: '❌' });
                                    }
                                }}
                                className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all active:scale-95 shadow-lg"
                            >
                                Mời
                            </button>
                        </div>
                    ))}
                    {(user.friends || []).filter(f => {
                        const grp = allGroups.find(g => g.groupId === activeRoom.id);
                        return grp && !(grp.members || []).includes(f);
                    }).length === 0 && (
                            <p className="text-center text-gray-500 py-8 text-sm italic">Tất cả bạn bè đã là thành viên</p>
                        )}
                </div>
            </div>
        </div>
    );
};

export default InviteMemberModal;