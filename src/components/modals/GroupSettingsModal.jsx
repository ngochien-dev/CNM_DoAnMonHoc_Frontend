import React, { useState, useRef } from 'react';
import { FaTimes, FaCamera, FaPlayCircle, FaPauseCircle, FaTrash, FaExchangeAlt, FaUserMinus } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const GroupSettingsModal = ({
    isOpen,
    onClose,
    activeRoom,
    darkMode,
    user,
    currentGroup,
    isAdminOfGroup,
    isModOfGroup,
    handleManageGroup,
    handleUpdateRole,
    handleKick,
    handleSwitchRoom,
    loadData
}) => {
    const [renameGroupValue, setRenameGroupValue] = useState("");
    const groupFileRef = useRef(null);

    if (!isOpen || !activeRoom) return null;

    const handleGroupAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = async () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 200;
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const base64Avatar = canvas.toDataURL('image/jpeg', 0.8);
                
                try {
                    await api.post('/groups/update-avatar', { 
                        groupId: activeRoom.id, 
                        avatar: base64Avatar 
                    });
                    toast.success("Cập nhật ảnh nhóm thành công!");
                    loadData(); // Tải lại toàn bộ nhóm để đồng bộ giao diện
                } catch (err) {
                    toast.error(err.response?.data?.error || "Lỗi cập nhật ảnh nhóm!");
                }
            };
        };
    };

    return (
        <div className="fixed inset-0 bg-[#020617]/90 flex items-center justify-center z-[300] backdrop-blur-md p-4 animate-in zoom-in-95">
            <div className={`w-full max-w-[500px] rounded-[40px] overflow-hidden shadow-2xl border border-white/10 ${darkMode ? 'bg-slate-900' : 'bg-white'}`}>
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-slate-900 to-indigo-900 text-white shadow-xl">
                    <div>
                        <h2 className="text-xl font-black uppercase italic tracking-tighter">Cấu hình #{activeRoom.name}</h2>
                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest opacity-60 italic uppercase">Admin Control Center</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-red-500 rounded-full transition-all"><FaTimes/></button>
                </div>
                
                <div className="p-8 space-y-8 font-bold">
                    {/* Rename Group */}
                    {(isAdminOfGroup || isModOfGroup) && (
                        <div className="space-y-3">
                            <p className="text-[9px] font-black uppercase text-gray-500 tracking-[2px] italic border-l-2 border-purple-500 pl-3">Đổi tên nhóm</p>
                            <div className="flex gap-2">
                                <input 
                                    value={renameGroupValue} 
                                    onChange={e => setRenameGroupValue(e.target.value)} 
                                    placeholder={activeRoom.name} 
                                    className={`flex-1 p-3 rounded-xl border text-sm outline-none focus:border-purple-500 ${darkMode ? 'bg-black/20 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-slate-800'}`} 
                                />
                                <button 
                                    onClick={async () => { 
                                        if (!renameGroupValue.trim()) return; 
                                        await api.post('/groups/rename', { groupId: activeRoom.id, newName: renameGroupValue.trim() }); 
                                        setRenameGroupValue(''); 
                                        onClose();
                                        loadData(); 
                                        handleSwitchRoom({ id: activeRoom.id, name: renameGroupValue.trim() });
                                    }} 
                                    className="px-4 py-3 bg-purple-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-purple-500 transition-all shadow-lg"
                                >
                                    Lưu
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Group Avatar Uploader */}
                    {(isAdminOfGroup || isModOfGroup) && (
                        <div className="flex flex-col items-center justify-center space-y-4 pb-2">
                            <p className="text-[9px] font-black uppercase text-gray-500 tracking-[2px] italic border-l-2 border-indigo-500 pl-3 self-start">Ảnh đại diện nhóm</p>
                            <div className="relative group shrink-0">
                                <div className="absolute inset-0 bg-gradient-to-tr from-orange-500 to-indigo-500 rounded-[30px] blur-md opacity-40 group-hover:opacity-80 transition-opacity"></div>
                                <img 
                                    src={currentGroup?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeRoom.name)}&background=f97316&color=fff`} 
                                    className="w-24 h-24 rounded-[28px] border-4 border-slate-900 object-cover relative z-10 shadow-xl bg-slate-800 transition-all group-hover:scale-105 animate-in fade-in" 
                                    alt="group-avt" 
                                />
                                <div 
                                    onClick={() => groupFileRef.current?.click()} 
                                    className="absolute inset-0 z-20 bg-black/60 rounded-[28px] flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-all border-2 border-white/20"
                                >
                                    <FaCamera size={20} className="text-white animate-bounce" />
                                    <span className="text-[8px] text-white/90 font-black uppercase tracking-wider mt-1">Thay ảnh</span>
                                </div>
                            </div>
                            <input 
                                type="file" 
                                ref={groupFileRef} 
                                className="hidden" 
                                onChange={handleGroupAvatarChange} 
                                accept="image/*" 
                            />
                        </div>
                    )}

                    {isAdminOfGroup && (
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => handleManageGroup('disable')} className={`p-4 rounded-2xl border-2 flex items-center justify-center gap-2 uppercase text-[10px] font-black transition-all ${currentGroup?.isDisabled ? 'border-emerald-500 text-emerald-500 bg-emerald-500/5 shadow-inner' : 'border-red-500 text-red-500 bg-red-500/5 shadow-inner'}`}>
                                {currentGroup?.isDisabled ? <><FaPlayCircle size={14}/> Mở cửa</> : <><FaPauseCircle size={14}/> Khóa chat</>}
                            </button>
                            <button onClick={() => handleManageGroup('delete')} className="p-4 rounded-2xl border-2 border-gray-600 text-gray-400 flex items-center justify-center gap-2 uppercase text-[10px] font-black hover:bg-red-600 hover:text-white transition-all shadow-md">
                                <FaTrash size={14}/> Giải tán
                            </button>
                        </div>
                    )}

                    {!currentGroup?.isPublic && (
                        <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-hide">
                            <p className="text-[9px] font-black uppercase text-gray-500 tracking-[2px] italic mb-4 border-l-2 border-indigo-500 pl-3">Đội ngũ thám hiểm ({currentGroup?.members?.length})</p>
                            {currentGroup?.members?.map(u => {
                                const isHost = u === currentGroup.owner;
                                const isMod = currentGroup.mods?.includes(u);
                                const myRoleIsHost = currentGroup.owner === user.username;
                                const myRoleIsMod = currentGroup.mods?.includes(user.username);
                                
                                // MOD không thể đuổi Host hoặc MOD khác
                                const canKick = myRoleIsHost ? !isHost : (myRoleIsMod && !isHost && !isMod);

                                return (
                                    <div key={u} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 group/user hover:border-indigo-500/30 transition-all shadow-sm">
                                        <span className="text-sm font-bold italic text-indigo-100 truncate flex-1 uppercase tracking-tighter">
                                            @{u} 
                                            {isHost && <span className="text-[8px] bg-indigo-500 text-white px-2 py-0.5 rounded-full uppercase ml-2 shadow-md">Host</span>}
                                            {isMod && <span className="text-[8px] bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase ml-2 shadow-md">Mod</span>}
                                        </span>
                                        <div className="flex gap-2 opacity-0 group-hover/user:opacity-100 transition-all">
                                            {myRoleIsHost && !isHost && (
                                                <>
                                                    <button 
                                                        onClick={() => handleUpdateRole(u, isMod ? 'revoke' : 'grant')} 
                                                        className={`text-[9px] px-2 py-1 uppercase rounded-lg font-black transition-all ${isMod ? 'bg-orange-500 text-white' : 'bg-emerald-500 text-white'}`}
                                                    >
                                                        {isMod ? 'Hủy Mod' : 'Phong Mod'}
                                                    </button>
                                                    <button 
                                                        onClick={async () => { 
                                                            if (!window.confirm(`Chuyển quyền chủ nhóm cho @${u}?`)) return; 
                                                            await api.post('/groups/transfer-ownership', { groupId: activeRoom.id, newOwner: u }); 
                                                            loadData(); 
                                                            onClose();
                                                        }} 
                                                        className="text-[9px] px-2 py-1 uppercase rounded-lg font-black bg-cyan-500 text-white transition-all hover:bg-cyan-400"
                                                        title="Chuyển quyền chủ nhóm"
                                                    >
                                                        <FaExchangeAlt size={10} className="inline mr-1"/> Chuyển
                                                    </button>
                                                </>
                                            )}
                                            {canKick && (
                                                <button onClick={() => handleKick(u)} className="text-red-400 hover:scale-110 active:text-red-600 bg-red-500/10 p-1.5 rounded-lg">
                                                    <FaUserMinus size={14}/>
                                                </button>
                                            )}
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

export default GroupSettingsModal;
