import React, { useState, useMemo } from 'react';
import { 
    FaFolderOpen, FaImage, FaFileAlt, FaLink, FaDownload, 
    FaSearch, FaChevronRight, FaExternalLinkAlt, FaRegFolder, 
    FaShare, FaUser, FaClock, FaCommentAlt, FaFileImage, 
    FaFileVideo, FaFileAudio, FaFileWord, FaFilePdf, FaFileArchive, 
    FaFileCode, FaEye
} from 'react-icons/fa';

const CloudDriveTab = ({ 
    user, 
    messages = [], 
    allGroups = [], 
    handleJumpToMessage, 
    darkMode 
}) => {
    const [activeTab, setActiveTab] = useState('media'); // 'media' | 'docs' | 'links'
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRoomId, setSelectedRoomId] = useState('all'); // 'all' or specific roomId

    // Helper to get room name
    const getRoomName = (roomId) => {
        if (!roomId) return 'Không xác định';
        if (roomId.startsWith('dm_')) {
            const users = roomId.replace('dm_', '').split('_');
            const otherUser = users.find(u => u !== user.username);
            return otherUser ? `@${otherUser}` : 'Cloud của tôi';
        }
        const group = allGroups.find(g => g.groupId === roomId);
        return group ? group.groupName : `Nhóm (${roomId.substring(0, 5)})`;
    };

    // Helper to check if it's a DM
    const isRoomDM = (roomId) => {
        return roomId?.startsWith('dm_');
    };

    // Helper to get File Icon based on extension/filename
    const getFileIcon = (fileName = '', fileType = '') => {
        if (fileType === 'image') return <FaFileImage className="text-emerald-400" size={24} />;
        if (fileType === 'video') return <FaFileVideo className="text-indigo-400" size={24} />;
        if (fileType === 'audio') return <FaFileAudio className="text-amber-400" size={24} />;
        
        const ext = fileName.split('.').pop().toLowerCase();
        if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext)) {
            return <FaFileWord className="text-blue-400" size={24} />;
        }
        if (['pdf'].includes(ext)) {
            return <FaFilePdf className="text-rose-500" size={24} />;
        }
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
            return <FaFileArchive className="text-purple-400" size={24} />;
        }
        if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'py', 'java', 'cpp'].includes(ext)) {
            return <FaFileCode className="text-cyan-400" size={24} />;
        }
        return <FaFileAlt className="text-slate-400" size={24} />;
    };

    // Extract unique rooms list from messages that contain files/links
    const availableRooms = useMemo(() => {
        const roomsMap = new Map();
        messages.forEach(msg => {
            if (msg.isRevoked) return;
            
            const hasFile = msg.fileData && msg.msgType !== 'sticker';
            const urlRegex = /((?:https?:\/\/|www\.)[^\s]+|[a-zA-Z0-9.-]+\.(?:com|net|org|vn|edu|gov|io)[^\s]*)/g;
            const hasLink = msg.text && msg.text.match(urlRegex);

            if ((hasFile || hasLink) && msg.roomId) {
                roomsMap.set(msg.roomId, getRoomName(msg.roomId));
            }
        });
        return Array.from(roomsMap.entries()).map(([id, name]) => ({ id, name }));
    }, [messages, allGroups]);

    // Process & Filter items
    const driveItems = useMemo(() => {
        const media = [];
        const docs = [];
        const links = [];

        messages.forEach(msg => {
            if (msg.isRevoked) return;
            if (selectedRoomId !== 'all' && msg.roomId !== selectedRoomId) return;

            const roomName = getRoomName(msg.roomId);
            const dateStr = new Date(msg.createdAt || Date.now()).toLocaleDateString('vi-VN', {
                year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
            });

            // 1. Files (Excluding stickers)
            if (msg.fileData && msg.msgType !== 'sticker') {
                const item = {
                    id: msg.messageId,
                    name: msg.fileName || 'Không có tên',
                    type: msg.fileType || 'other',
                    url: msg.fileData,
                    size: 'N/A', // Base64 doesn't give clean file size easily, or we can approximate
                    sender: msg.sender || msg.senderUsername,
                    senderUsername: msg.senderUsername,
                    date: dateStr,
                    roomId: msg.roomId,
                    roomName,
                };

                if (msg.fileType === 'image' || msg.fileType === 'video') {
                    media.push(item);
                } else if (msg.fileType !== 'audio') {
                    // Treat document files
                    docs.push(item);
                }
            }

            // 2. Links
            if (msg.text) {
                const urlRegex = /((?:https?:\/\/|www\.)[^\s]+|[a-zA-Z0-9.-]+\.(?:com|net|org|vn|edu|gov|io)[^\s]*)/g;
                const urls = msg.text.match(urlRegex);
                if (urls) {
                    urls.forEach((url, i) => {
                        // Clean trailing punctuation
                        const cleanUrl = url.replace(/\.+$/, '').trim();
                        links.push({
                            id: `${msg.messageId}-${i}`,
                            messageId: msg.messageId,
                            url: cleanUrl.startsWith('http') ? cleanUrl : `http://${cleanUrl}`,
                            textContext: msg.text,
                            sender: msg.sender || msg.senderUsername,
                            senderUsername: msg.senderUsername,
                            date: dateStr,
                            roomId: msg.roomId,
                            roomName,
                        });
                    });
                }
            }
        });

        // Filter by Search Query
        const filterFn = (item) => {
            const query = searchQuery.toLowerCase().trim();
            if (!query) return true;
            if (item.name && item.name.toLowerCase().includes(query)) return true;
            if (item.url && item.url.toLowerCase().includes(query)) return true;
            if (item.sender && item.sender.toLowerCase().includes(query)) return true;
            if (item.textContext && item.textContext.toLowerCase().includes(query)) return true;
            return false;
        };

        return {
            media: media.filter(filterFn),
            docs: docs.filter(filterFn),
            links: links.filter(filterFn)
        };
    }, [messages, selectedRoomId, searchQuery, allGroups]);

    const activeItemsList = driveItems[activeTab] || [];

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden select-none">
            
            {/* Header Area */}
            <div className={`p-6 border-b shrink-0 flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
                darkMode ? 'bg-slate-900/40 border-white/5' : 'bg-white border-gray-200 shadow-sm'
            }`}>
                <div>
                    <h2 className="text-xl font-black flex items-center gap-2.5">
                        <FaFolderOpen className="text-cyan-500 text-2xl animate-pulse" /> Kho tài liệu & Quản lý File
                    </h2>
                    <p className="text-[10px] text-gray-500 font-bold lowercase tracking-wider not-italic mt-1">
                        Quản lý hình ảnh, tài liệu và liên kết chia sẻ từ các cuộc hội thoại
                    </p>
                </div>

                {/* Filter and Search controls */}
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search Bar */}
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm file, người gửi..."
                            className={`pl-9 pr-4 py-2.5 w-full sm:w-64 rounded-2xl border text-[11px] font-bold focus:outline-none focus:border-cyan-500 transition-all ${
                                darkMode 
                                    ? 'bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500' 
                                    : 'bg-slate-50 border-gray-200 text-slate-800 placeholder:text-gray-400'
                            }`}
                        />
                        <FaSearch className="absolute left-3.5 top-3.5 text-gray-500 text-xs" />
                    </div>

                    {/* Room Selector Dropdown */}
                    <select
                        value={selectedRoomId}
                        onChange={(e) => setSelectedRoomId(e.target.value)}
                        className={`px-4 py-2.5 rounded-2xl border text-[10px] font-black uppercase tracking-wider focus:outline-none focus:border-cyan-500 transition-all cursor-pointer ${
                            darkMode 
                                ? 'bg-slate-800/80 border-slate-700 text-cyan-400' 
                                : 'bg-slate-50 border-gray-200 text-cyan-600'
                        }`}
                    >
                        <option value="all">📂 Tất cả phòng chat</option>
                        {availableRooms.map(room => (
                            <option key={room.id} value={room.id}>
                                {room.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Sub-navigation Tabs */}
            <div className={`px-6 py-3 border-b shrink-0 flex items-center gap-2 ${
                darkMode ? 'bg-slate-900/20 border-white/5' : 'bg-slate-50/50 border-gray-200'
            }`}>
                <button
                    onClick={() => setActiveTab('media')}
                    className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                        activeTab === 'media'
                            ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20 scale-105'
                            : (darkMode ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-slate-600 hover:bg-slate-100')
                    }`}
                >
                    <FaImage size={12} /> Ảnh & Video ({driveItems.media.length})
                </button>
                <button
                    onClick={() => setActiveTab('docs')}
                    className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                        activeTab === 'docs'
                            ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20 scale-105'
                            : (darkMode ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-slate-600 hover:bg-slate-100')
                    }`}
                >
                    <FaFileAlt size={11} /> Tài liệu ({driveItems.docs.length})
                </button>
                <button
                    onClick={() => setActiveTab('links')}
                    className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                        activeTab === 'links'
                            ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20 scale-105'
                            : (darkMode ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-slate-600 hover:bg-slate-100')
                    }`}
                >
                    <FaLink size={11} /> Liên kết ({driveItems.links.length})
                </button>
            </div>

            {/* Main File Explorer Panel */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                
                {activeItemsList.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-fade-in">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                            darkMode ? 'bg-slate-800/40 text-slate-600' : 'bg-slate-100 text-slate-400'
                        }`}>
                            <FaRegFolder size={40} className="animate-pulse" />
                        </div>
                        <h3 className={`text-base font-black uppercase tracking-wider ${
                            darkMode ? 'text-slate-400' : 'text-slate-700'
                        }`}>Không tìm thấy tài liệu</h3>
                        <p className="text-xs text-gray-500 font-bold lowercase tracking-normal max-w-sm mt-1.5 not-italic">
                            Chưa có tệp tin hoặc liên kết nào được chia sẻ trong phòng chat này hoặc cụm từ tìm kiếm của bạn không khớp.
                        </p>
                    </div>
                ) : (
                    
                    // Render list based on tab
                    activeTab === 'media' ? (
                        /* MEDIA GRID (IMAGES & VIDEOS) */
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {activeItemsList.map(item => (
                                <div 
                                    key={item.id}
                                    className={`group rounded-3xl border overflow-hidden flex flex-col transition-all duration-300 hover:scale-[1.03] hover:shadow-lg ${
                                        darkMode 
                                            ? 'bg-slate-800/30 border-slate-700/50 hover:border-cyan-500/50 hover:bg-slate-800/60' 
                                            : 'bg-white border-gray-100 hover:border-cyan-500/30 shadow-sm hover:shadow-cyan-500/5'
                                    }`}
                                >
                                    {/* Thumbnail Preview Area */}
                                    <div className="aspect-square w-full bg-black/40 relative overflow-hidden group">
                                        {item.type === 'video' ? (
                                            <div className="w-full h-full flex items-center justify-center relative">
                                                <video src={item.url} className="w-full h-full object-cover opacity-80" />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                    <span className="w-8 h-8 rounded-full bg-cyan-500/90 text-white flex items-center justify-center text-[10px] font-black tracking-widest pl-0.5 animate-pulse">▶</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <img 
                                                src={item.url} 
                                                alt={item.name} 
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        )}

                                        {/* Hover Actions Panel Overlay */}
                                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
                                            <div className="flex justify-end gap-1.5">
                                                {/* Go to message bubble link */}
                                                <button
                                                    onClick={() => handleJumpToMessage(item.roomId, item.id)}
                                                    className="w-8 h-8 rounded-xl bg-white/10 text-white hover:bg-cyan-500 hover:text-white transition-all flex items-center justify-center"
                                                    title="Xem tin nhắn gốc"
                                                >
                                                    <FaEye size={12} />
                                                </button>
                                                
                                                {/* Download Button */}
                                                <a
                                                    href={item.url}
                                                    download={item.name}
                                                    className="w-8 h-8 rounded-xl bg-white/10 text-white hover:bg-cyan-500 hover:text-white transition-all flex items-center justify-center"
                                                    title="Tải xuống tệp tin"
                                                >
                                                    <FaDownload size={11} />
                                                </a>
                                            </div>

                                            {/* Date / Sender Info inside overlay */}
                                            <div className="text-white">
                                                <p className="text-[9px] font-black truncate uppercase tracking-wider">@{item.senderUsername}</p>
                                                <p className="text-[8px] opacity-60 not-italic lowercase mt-0.5">{item.date}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer File Details */}
                                    <div className="p-3.5 flex-1 flex flex-col justify-between">
                                        <p className={`text-xs font-black truncate uppercase italic tracking-tighter ${
                                            darkMode ? 'text-slate-300' : 'text-slate-700'
                                        }`}>
                                            {item.name}
                                        </p>
                                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/5 dark:border-white/5">
                                            <span className="text-[8px] text-gray-500 font-black uppercase tracking-wider truncate max-w-[80px]">
                                                {item.roomName}
                                            </span>
                                            <span className="text-[8px] text-cyan-500 font-black uppercase">
                                                {item.type}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : activeTab === 'docs' ? (
                        /* DOCUMENT LIST ROW/TABLE STYLE */
                        <div className="space-y-2 max-w-4xl mx-auto">
                            {activeItemsList.map(item => (
                                <div 
                                    key={item.id}
                                    className={`p-4 rounded-3xl border flex items-center justify-between gap-4 transition-all duration-200 hover:scale-[1.005] hover:shadow-md ${
                                        darkMode 
                                            ? 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/60 hover:border-cyan-500/30 text-slate-300' 
                                            : 'bg-white border-gray-100 hover:bg-slate-50 hover:border-cyan-500/20 text-slate-700 shadow-sm'
                                    }`}
                                >
                                    <div className="flex items-center gap-3.5 min-w-0">
                                        {/* Icon representation */}
                                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                                            darkMode ? 'bg-white/5' : 'bg-slate-100'
                                        }`}>
                                            {getFileIcon(item.name, item.type)}
                                        </div>

                                        {/* Document naming and context info */}
                                        <div className="min-w-0">
                                            <h4 className="text-sm font-black truncate uppercase italic tracking-tight">{item.name}</h4>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-gray-500 font-bold lowercase not-italic mt-0.5">
                                                <span className="flex items-center gap-1"><FaUser className="text-[8px]" /> @{item.senderUsername}</span>
                                                <span className="flex items-center gap-1"><FaClock className="text-[8px]" /> {item.date}</span>
                                                <span className="flex items-center gap-1 uppercase tracking-wider font-black text-cyan-500/90"><FaCommentAlt className="text-[8px]" /> {item.roomName}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action items on the right side */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        {/* Go to message */}
                                        <button 
                                            onClick={() => handleJumpToMessage(item.roomId, item.id)}
                                            className={`p-2.5 rounded-xl border transition-all flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider ${
                                                darkMode 
                                                    ? 'border-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/50 text-cyan-400' 
                                                    : 'border-gray-200 hover:bg-cyan-50 hover:border-cyan-500/30 text-cyan-600'
                                            }`}
                                            title="Đi đến vị trí tin nhắn chứa file"
                                        >
                                            <FaEye size={12} /> <span className="hidden sm:inline">Tin gốc</span>
                                        </button>

                                        {/* Download button */}
                                        <a 
                                            href={item.url} 
                                            download={item.name}
                                            className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-black transition-all flex items-center gap-1.5 text-[9px] uppercase tracking-wider shadow-md shadow-cyan-500/10 hover:scale-95 active:scale-90"
                                            title="Tải xuống tài liệu"
                                        >
                                            <FaDownload size={10} /> <span className="hidden sm:inline">Tải xuống</span>
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* LINKS LIST */
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
                            {activeItemsList.map(item => (
                                <div 
                                    key={item.id}
                                    className={`p-5 rounded-3xl border flex flex-col justify-between gap-4 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg ${
                                        darkMode 
                                            ? 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/60 hover:border-cyan-500/30' 
                                            : 'bg-white border-gray-100 hover:border-cyan-500/20 shadow-sm hover:shadow-cyan-500/5'
                                    }`}
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-start justify-between gap-3">
                                            <span className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0">
                                                <FaLink size={12} />
                                            </span>
                                            
                                            {/* Link Context Metadata */}
                                            <div className="flex-1 text-right text-[8px] text-gray-500 font-black uppercase tracking-wider leading-none">
                                                <span>@{item.senderUsername} • {item.date}</span>
                                                <p className="text-cyan-500/90 tracking-widest mt-1 truncate max-w-[180px] ml-auto">{item.roomName}</p>
                                            </div>
                                        </div>

                                        {/* Link Title and URL */}
                                        <div className="space-y-1">
                                            <a 
                                                href={item.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="text-xs font-bold text-cyan-400 hover:underline break-all flex items-center gap-1.5"
                                            >
                                                {item.url} <FaExternalLinkAlt size={10} className="shrink-0" />
                                            </a>
                                            <p className={`text-xs font-medium leading-relaxed italic line-clamp-3 pl-3 border-l border-black/10 dark:border-white/10 ${
                                                darkMode ? 'text-slate-400' : 'text-slate-600'
                                            }`}>
                                                "{item.textContext}"
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Links Buttons */}
                                    <div className="flex items-center gap-2 pt-3 border-t border-black/5 dark:border-white/5">
                                        <button 
                                            onClick={() => handleJumpToMessage(item.roomId, item.messageId)}
                                            className={`flex-1 py-2 px-3 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                                                darkMode 
                                                    ? 'border-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/50 text-cyan-400' 
                                                    : 'border-gray-200 hover:bg-cyan-55 hover:border-cyan-500/20 text-cyan-600'
                                            }`}
                                            title="Xem tin nhắn gốc"
                                        >
                                            <FaEye size={12} /> Xem tin nhắn gốc
                                        </button>
                                        <a 
                                            href={item.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex-1 py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-black transition-all flex items-center justify-center gap-1.5 text-[9px] uppercase tracking-wider shadow-md shadow-cyan-500/10 hover:scale-95 active:scale-90"
                                            title="Mở liên kết ở tab mới"
                                        >
                                            Mở liên kết <FaExternalLinkAlt size={10} />
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                    
                )}

            </div>
        </div>
    );
};

export default CloudDriveTab;
