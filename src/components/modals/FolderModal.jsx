import React from 'react';
import { FaFolderPlus, FaTimes, FaSearch } from 'react-icons/fa';

const FolderModal = ({
    isOpen,
    onClose,
    darkMode,
    editingFolder,
    folderName,
    setFolderName,
    folderRooms,
    modalSearch,
    setModalSearch,
    getRecentChatUsers,
    allGroups,
    user,
    onlineUsers,
    toggleRoomInFolder,
    handleDeleteFolder,
    handleSaveFolder
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[500] backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className={`w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border transition-all duration-300 ${
                darkMode ? 'bg-[#0f172a] border-white/10 text-white' : 'bg-white border-gray-200 text-slate-800'
            }`}>
                <div className="p-5 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                    <h3 className="font-black uppercase tracking-widest text-[10px] flex items-center gap-2">
                        <FaFolderPlus size={14}/> {editingFolder ? "Chỉnh sửa thư mục chat" : "Tạo thư mục chat mới"}
                    </h3>
                    <button 
                        onClick={onClose} 
                        className="p-1 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                    >
                        <FaTimes size={14}/>
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Input Tên Thư Mục */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider opacity-50 pl-1">Tên thư mục</label>
                        <input 
                            type="text" 
                            placeholder="Nhập tên thư mục (VD: Công việc, Gia đình...)" 
                            value={folderName} 
                            onChange={(e) => setFolderName(e.target.value)} 
                            className={`w-full px-4 py-3 rounded-2xl border outline-none text-xs font-bold transition-all ${
                                darkMode 
                                    ? 'bg-black/30 border-white/10 text-white focus:border-indigo-500' 
                                    : 'bg-slate-50 border-gray-200 text-slate-800 focus:border-indigo-600 focus:bg-white'
                            }`} 
                        />
                    </div>

                    {/* Danh sách chọn cuộc trò chuyện */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider opacity-50 pl-1">Chọn cuộc trò chuyện</label>
                        
                        {/* Thanh tìm kiếm nhanh */}
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
                            darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-gray-200 text-slate-800'
                        }`}>
                            <FaSearch size={11} className="text-slate-400 shrink-0" />
                            <input
                                type="text"
                                placeholder="Tìm nhanh cuộc trò chuyện..."
                                value={modalSearch}
                                onChange={(e) => setModalSearch(e.target.value)}
                                className="flex-1 bg-transparent outline-none text-[11px] placeholder:text-slate-500"
                            />
                            {modalSearch && (
                                <FaTimes 
                                    size={10} 
                                    onClick={() => setModalSearch('')} 
                                    className="cursor-pointer text-slate-400 hover:text-white" 
                                />
                            )}
                        </div>

                        {/* List rooms checkboxes */}
                        <div className={`max-h-60 overflow-y-auto pr-1 space-y-1.5 scrollbar-hide rounded-2xl p-2 border ${
                            darkMode ? 'bg-black/20 border-white/5' : 'bg-slate-50/50 border-gray-100'
                        }`}>
                            {(() => {
                                const dms = getRecentChatUsers();
                                const publicGroups = allGroups.filter(g => g.isPublic && (g.members?.includes(user.username) || g.owner === user.username));
                                const privateGroups = allGroups.filter(g => !g.isPublic && (g.members?.includes(user.username) || g.owner === user.username));
                                
                                const allRoomItems = [
                                    ...dms.map(name => ({ id: `dm_${[user.username, name].sort().join("_")}`, name, isDM: true, type: 'personal' })),
                                    ...publicGroups.map(g => ({ id: g.groupId, name: g.groupName, type: 'groups' })),
                                    ...privateGroups.map(g => ({ id: g.groupId, name: g.groupName, type: 'groups' }))
                                ];

                                const filteredRooms = allRoomItems.filter(r => r.name.toLowerCase().includes(modalSearch.toLowerCase()));

                                if (filteredRooms.length === 0) {
                                    return <p className="text-[10px] text-center text-slate-500 py-6">Không tìm thấy cuộc trò chuyện nào</p>;
                                }

                                return filteredRooms.map(r => {
                                    const isChecked = folderRooms.includes(r.id);
                                    return (
                                        <div 
                                            key={r.id}
                                            onClick={() => toggleRoomInFolder(r.id)}
                                            className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                                                darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-100'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className={`w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-bold uppercase overflow-hidden shrink-0 border border-white/10`}>
                                                    {r.isDM && onlineUsers[r.name]?.avatar ? (
                                                        <img src={onlineUsers[r.name].avatar} className="w-full h-full object-cover" alt="" />
                                                    ) : r.name[0]}
                                                </div>
                                                <span className="text-[11.5px] font-bold truncate">
                                                    {r.isDM ? (onlineUsers[r.name]?.displayName || r.name) : r.name}
                                                </span>
                                            </div>
                                            <input 
                                                type="checkbox" 
                                                checked={isChecked}
                                                readOnly
                                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer pointer-events-none accent-indigo-600"
                                            />
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>
                </div>

                {/* Footer buttons */}
                <div className={`p-5 border-t flex justify-end gap-3 ${darkMode ? 'border-white/5 bg-slate-950/20' : 'bg-slate-50 border-gray-100'}`}>
                    {editingFolder && (
                        <button 
                            onClick={() => handleDeleteFolder(editingFolder.id)}
                            className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-wider transition-colors mr-auto"
                        >
                            Xóa thư mục
                        </button>
                    )}
                    <button 
                        onClick={onClose}
                        className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-colors border ${
                            darkMode ? 'hover:bg-white/5 border-white/5 text-gray-300' : 'hover:bg-slate-200 border-slate-200 text-slate-600'
                        }`}
                    >
                        Hủy
                    </button>
                    <button 
                        onClick={handleSaveFolder}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider transition-colors shadow-lg shadow-indigo-600/10 active:scale-95"
                    >
                        Lưu lại
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FolderModal;
