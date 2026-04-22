import React from 'react';
import { FaCircle, FaSignOutAlt, FaHashtag, FaGlobe, FaLock } from 'react-icons/fa';

const RoomSidebar = ({ 
    isSidebarVisible, darkMode, recentChatUsers = [], handleStartDM, 
    activeRoom, onlineUsers, unreadCounts = {}, handleOpenProfile, 
    handleSwitchRoom, allGroups = [], user, setUser 
}) => {
    return (
        <div className={`flex flex-col border-r transition-all duration-300 ${isSidebarVisible ? 'w-64' : 'w-0 overflow-hidden'} ${darkMode ? 'bg-[#1e293b]/50 backdrop-blur-xl border-white/5' : 'bg-[#f2f3f5]'}`}>
            <div className="h-12 px-4 flex items-center border-b border-white/5 font-black uppercase text-[11px] tracking-widest opacity-60 italic text-indigo-400 shrink-0">
                OTT Community
            </div>

            <div className="flex-1 p-2 mt-2 overflow-y-auto space-y-6 font-bold scrollbar-hide">
                {/* Hội thoại */}
                <div>
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-2 mb-2 italic">Hội thoại</p>
                    {(recentChatUsers || []).map(f => (
                        <div key={f} onClick={() => handleStartDM(f)} className={`p-2.5 rounded-lg flex items-center gap-3 cursor-pointer mb-1 relative transition-all ${activeRoom?.name === f && activeRoom?.isDM ? 'bg-[#5865f2] text-white shadow-lg' : 'hover:bg-white/5 text-gray-400'}`}>
                            <div className="relative shrink-0" onClick={(e) => { e.stopPropagation(); handleOpenProfile(f); }}>
                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-bold uppercase overflow-hidden border border-white/10">
                                    {onlineUsers[f]?.avatar ? <img src={onlineUsers[f].avatar} className="w-full h-full object-cover" alt="" /> : f[0]}
                                </div>
                                <FaCircle className={`absolute -bottom-0.5 -right-0.5 text-[8px] border-2 ${darkMode ? 'border-[#1e293b]' : 'border-white'} ${onlineUsers[f] ? 'text-green-500' : 'text-gray-500'}`} />
                            </div>
                            <span className="truncate text-sm font-medium italic">@{f}</span>
                            {unreadCounts[`dm_${[user.username, f].sort().join("_")}`] > 0 && (
                                <span className="absolute right-2 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full font-black animate-bounce">{unreadCounts[`dm_${[user.username, f].sort().join("_")}`]}</span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Cộng đồng */}
                <div>
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-2 mb-2 italic">Cộng đồng</p>
                    <div onClick={() => handleSwitchRoom({id:'chung', name:'Chung'})} className={`p-2.5 rounded-lg flex items-center gap-3 cursor-pointer mb-1 relative transition-all ${activeRoom?.id === 'chung' ? 'bg-[#5865f2] text-white shadow-lg' : 'hover:bg-white/5 text-gray-400'}`}>
                        <FaHashtag size={14}/> <span className="text-sm uppercase tracking-tighter italic">chung</span>
                    </div>
                    {(allGroups || []).filter(g => g.isPublic).map(g => (
                        <div key={g.groupId} onClick={() => handleSwitchRoom({id:g.groupId, name:g.groupName})} className={`p-2.5 rounded-lg flex items-center gap-3 cursor-pointer mb-1 relative transition-all ${activeRoom?.id === g.groupId ? 'bg-[#5865f2] text-white shadow-lg' : 'hover:bg-white/5 text-gray-400'}`}>
                            <FaGlobe size={12} className="opacity-60"/> <span className="text-sm truncate uppercase tracking-tighter italic">{g.groupName}</span>
                        </div>
                    ))}
                </div>

                {/* Riêng tư */}
{/* Nhóm riêng tư */}
<div>
    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-2 mb-2 italic">Riêng tư</p>
    {(allGroups || []).filter(g => 
        !g.isPublic && (g.members?.includes(user.username) || g.owner === user.username) // XÓA user.role === 'admin' ở đây
    ).map(g => (
        <div key={g.groupId} onClick={() => handleSwitchRoom({id:g.groupId, name:g.groupName})} className={`p-2.5 rounded-lg flex items-center gap-3 cursor-pointer mb-1 relative transition-all ${activeRoom?.id===g.groupId ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'hover:bg-white/5 text-gray-400'}`}>
            <FaLock size={10} className={activeRoom?.id === g.groupId ? 'text-white' : 'text-orange-400'}/>
            <span className="truncate text-sm font-medium uppercase tracking-tighter italic">{g.groupName}</span>
            {unreadCounts[g.groupId] > 0 && (
                <span className="absolute right-2 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full font-black animate-bounce">{unreadCounts[g.groupId]}</span>
            )}
        </div>
    ))}
</div>
            </div>

            <div onClick={() => handleOpenProfile(user.username)} className={`h-16 flex items-center px-3 cursor-pointer border-t border-white/5 transition-colors shrink-0 ${darkMode ? 'bg-[#020617]' : 'bg-[#ebedef]'}`}>
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg overflow-hidden border border-white/20">
                    {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="" /> : user.displayName?.[0] || 'U'}
                </div>
                <div className="ml-3 truncate flex-1 leading-tight text-white">
                    <div className="text-sm font-black truncate uppercase italic tracking-tighter">{user.displayName}</div>
                    <div className="text-[9px] text-green-500 font-black uppercase tracking-widest flex items-center gap-1"><FaCircle size={6}/> Online</div>
                </div>
                <FaSignOutAlt onClick={(e) => { e.stopPropagation(); setUser(null); }} className="text-gray-400 hover:text-red-500 transition-colors" />
            </div>
        </div>
    );
};

export default RoomSidebar;