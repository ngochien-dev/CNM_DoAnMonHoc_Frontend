import React from 'react';
import {
    FaThumbtack, FaFolderPlus, FaChevronRight, FaCheck, FaPlus,
    FaEye, FaEyeSlash, FaBellSlash, FaClock, FaTrash, FaExclamationTriangle
} from 'react-icons/fa';

const RoomContextMenu = ({
    menu, onClose, darkMode, handleTogglePin, customFolders, toggleRoomClassification,
    setEditingFolder, setFolderName, setFolderRooms, setShowFolderModal,
    unreadCounts, setUnreadCounts, toggleMuteRoomDuration, mutedRooms,
    handleToggleArchive, clearChatHistory
}) => {
    if (!menu) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[999]"
                onClick={onClose}
                onContextMenu={(e) => { e.preventDefault(); onClose(); }}
            />

            {/* Menu Container */}
            <div
                style={{ top: `${menu.y}px`, left: `${menu.x}px` }}
                className={`fixed z-[1000] w-56 rounded-2xl border p-1.5 flex flex-col shadow-2xl transition-all duration-200 animate-in fade-in zoom-in-95 ${darkMode ? 'bg-[#1e1f22] border-white/10 text-gray-200 shadow-black/60' : 'bg-white border-gray-200 text-slate-800 shadow-slate-300/40'}`}
            >
                {/* 1. Ghim hội thoại */}
                <button
                    onClick={() => { handleTogglePin(menu.roomId, menu.isPinned); onClose(); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-colors ${darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-100'}`}
                >
                    <FaThumbtack size={12} className={`text-slate-400 ${menu.isPinned ? 'rotate-45 text-indigo-400' : ''}`} />
                    <span>{menu.isPinned ? 'Bỏ ghim hội thoại' : 'Ghim hội thoại'}</span>
                </button>

                {/* 2. Phân loại */}
                <div className={`relative group/sub w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold cursor-pointer transition-colors ${darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-100'}`}>
                    <div className="flex items-center gap-2.5">
                        <FaFolderPlus size={12} className="text-slate-400" />
                        <span>Phân loại</span>
                    </div>
                    <FaChevronRight size={8} className="text-slate-400" />

                    {/* Submenu Phân loại */}
                    <div className={`absolute left-full top-0 ml-1.5 hidden group-hover/sub:block w-48 rounded-xl border p-1.5 flex flex-col shadow-xl ${darkMode ? 'bg-[#1e1f22] border-white/10 text-gray-200' : 'bg-white border-gray-200 text-slate-800'}`}>
                        <p className="text-[9px] font-black uppercase text-gray-500 px-2 py-1 mb-1 tracking-wider">Thư mục phân loại</p>
                        {customFolders.map(folder => (
                            <button
                                key={folder.id}
                                onClick={() => { toggleRoomClassification(folder.id, menu.roomId); onClose(); }}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-[11px] font-medium transition-colors ${darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                            >
                                <span className="truncate">{folder.name}</span>
                                {folder.roomIds.includes(menu.roomId) && <FaCheck size={9} className="text-emerald-500" />}
                            </button>
                        ))}
                        <div className={`my-1 border-t ${darkMode ? 'border-white/5' : 'border-gray-100'}`} />
                        <button
                            onClick={() => {
                                setEditingFolder(null); setFolderName(''); setFolderRooms([menu.roomId]);
                                setShowFolderModal(true); onClose();
                            }}
                            className={`w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-left text-[10px] font-bold text-indigo-500 transition-colors ${darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                        >
                            <FaPlus size={8} /> Tạo thư mục mới...
                        </button>
                    </div>
                </div>

                {/* 3. Đánh dấu chưa đọc */}
                <button
                    onClick={() => { setUnreadCounts(prev => ({ ...prev, [menu.roomId]: (unreadCounts[menu.roomId] || 0) > 0 ? 0 : 1 })); onClose(); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-colors ${darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-100'}`}
                >
                    {(unreadCounts[menu.roomId] || 0) > 0 ? <><FaEye size={12} className="text-slate-400" /><span>Đánh dấu đã đọc</span></> : <><FaEyeSlash size={12} className="text-slate-400" /><span>Đánh dấu chưa đọc</span></>}
                </button>

                <div className={`my-1 border-t ${darkMode ? 'border-white/5' : 'border-gray-100'}`} />

                {/* 4. Tắt thông báo */}
                <div className={`relative group/sub w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold cursor-pointer transition-colors ${darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-100'}`}>
                    <div className="flex items-center gap-2.5">
                        <FaBellSlash size={12} className="text-slate-400" />
                        <span>Tắt thông báo</span>
                    </div>
                    <FaChevronRight size={8} className="text-slate-400" />

                    {/* Submenu Tắt thông báo */}
                    <div className={`absolute left-full top-0 ml-1.5 hidden group-hover/sub:block w-48 rounded-xl border p-1.5 flex flex-col shadow-xl ${darkMode ? 'bg-[#1e1f22] border-white/10 text-gray-200' : 'bg-white border-gray-200 text-slate-800'}`}>
                        <p className="text-[9px] font-black uppercase text-gray-500 px-2 py-1 mb-1 tracking-wider">Thời gian tắt thông báo</p>
                        {[{ label: 'Tắt trong 1 giờ', ms: 3600000 }, { label: 'Tắt trong 4 giờ', ms: 14400000 }, { label: 'Tắt trong 24 giờ', ms: 86400000 }, { label: 'Tắt cho đến khi bật lại', ms: -1 }].map(opt => (
                            <button key={opt.label} onClick={() => { toggleMuteRoomDuration(menu.roomId, opt.ms); onClose(); }} className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>{opt.label}</button>
                        ))}
                        {mutedRooms[menu.roomId] && (
                            <><div className={`my-1 border-t ${darkMode ? 'border-white/5' : 'border-gray-100'}`} /><button onClick={() => { toggleMuteRoomDuration(menu.roomId, null); onClose(); }} className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-emerald-500 hover:bg-emerald-500/10 transition-colors">Bật lại thông báo</button></>
                        )}
                    </div>
                </div>

                {/* 5. Ẩn trò chuyện */}
                <button onClick={() => { handleToggleArchive(menu.roomId, false); onClose(); }} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-colors ${darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-100'}`}>
                    <FaEyeSlash size={12} className="text-slate-400" /><span>Ẩn trò chuyện</span>
                </button>



                <div className={`my-1 border-t ${darkMode ? 'border-white/5' : 'border-gray-100'}`} />

                {/* 7. Xóa hội thoại & 8. Báo xấu */}
                <button onClick={() => { clearChatHistory(menu.roomId); onClose(); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors">
                    <FaTrash size={12} /><span>Xóa hội thoại</span>
                </button>
                <button onClick={() => { alert("Đã ghi nhận báo cáo nội dung cuộc trò chuyện."); onClose(); }} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-colors ${darkMode ? 'hover:bg-white/5 text-gray-400 hover:text-white' : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'}`}>
                    <FaExclamationTriangle size={12} /><span>Báo xấu</span>
                </button>
            </div>
        </>
    );
};

export default RoomContextMenu;