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
        if (fileType === 'image') return <FaFileImage className="text-emerald-500" size={24} />;
        if (fileType === 'video') return <FaFileVideo className="text-indigo-500" size={24} />;
        if (fileType === 'audio') return <FaFileAudio className="text-amber-500" size={24} />;
        
        const ext = fileName.split('.').pop().toLowerCase();
        if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext)) {
            return <FaFileWord className="text-blue-500" size={24} />;
        }
        if (['pdf'].includes(ext)) {
            return <FaFilePdf className="text-rose-500" size={24} />;
        }
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
            return <FaFileArchive className="text-purple-500" size={24} />;
        }
        if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'py', 'java', 'cpp'].includes(ext)) {
            return <FaFileCode className="text-cyan-500" size={24} />;
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
        <div className={`flex-1 flex flex-col h-full overflow-hidden font-sans ${darkMode ? 'bg-[#0f172a]' : 'bg-white'}`}>
            
            {/* Header Area */}
            <div className={`p-8 pb-6 border-b shrink-0 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 ${
                darkMode ? 'border-white/10' : 'border-gray-200'
            }`}>
                <div>
                    <h2 className={`text-2xl font-bold flex items-center gap-3 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                        <FaFolderOpen className="text-indigo-500 text-3xl" /> Quản lý Lưu trữ
                    </h2>
                    <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Quản lý hình ảnh, tài liệu và liên kết chia sẻ từ tất cả các cuộc hội thoại.
                    </p>
                </div>

                {/* Filter and Search controls */}
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search Bar */}
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm file, người gửi..."
                            className={`pl-10 pr-4 py-2.5 w-full sm:w-64 rounded-xl border text-sm font-medium focus:outline-none focus:border-indigo-500 transition-all ${
                                darkMode 
                                    ? 'bg-black/20 border-white/10 text-white placeholder:text-gray-500' 
                                    : 'bg-gray-50 border-gray-200 text-slate-800 placeholder:text-gray-400'
                            }`}
                        />
                        <FaSearch className="absolute left-4 top-3.5 text-gray-400 text-sm" />
                    </div>

                    {/* Room Selector Dropdown */}
                    <select
                        value={selectedRoomId}
                        onChange={(e) => setSelectedRoomId(e.target.value)}
                        className={`px-4 py-2.5 rounded-xl border text-sm font-semibold focus:outline-none focus:border-indigo-500 transition-all cursor-pointer ${
                            darkMode 
                                ? 'bg-black/20 border-white/10 text-indigo-400' 
                                : 'bg-indigo-50 border-indigo-100 text-indigo-600'
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
            <div className={`px-8 py-4 border-b shrink-0 flex items-center gap-3 ${
                darkMode ? 'border-white/10' : 'border-gray-200 bg-gray-50/50'
            }`}>
                <button
                    onClick={() => setActiveTab('media')}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                        activeTab === 'media'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : (darkMode ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-slate-600 hover:bg-gray-100')
                    }`}
                >
                    <FaImage size={16} /> Ảnh & Video ({driveItems.media.length})
                </button>
                <button
                    onClick={() => setActiveTab('docs')}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                        activeTab === 'docs'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : (darkMode ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-slate-600 hover:bg-gray-100')
                    }`}
                >
                    <FaFileAlt size={16} /> Tài liệu ({driveItems.docs.length})
                </button>
                <button
                    onClick={() => setActiveTab('links')}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                        activeTab === 'links'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : (darkMode ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-slate-600 hover:bg-gray-100')
                    }`}
                >
                    <FaLink size={16} /> Liên kết ({driveItems.links.length})
                </button>
            </div>

            {/* Main File Explorer Panel */}
            <div className={`flex-1 overflow-y-auto p-8 custom-scrollbar ${darkMode ? 'bg-[#0f172a]' : 'bg-white'}`}>
                
                {activeItemsList.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${
                            darkMode ? 'bg-slate-800 text-slate-500' : 'bg-gray-100 text-gray-400'
                        }`}>
                            <FaRegFolder size={48} />
                        </div>
                        <h3 className={`text-lg font-bold ${
                            darkMode ? 'text-white' : 'text-slate-700'
                        }`}>Không tìm thấy tài liệu</h3>
                        <p className={`text-sm max-w-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Chưa có tệp tin hoặc liên kết nào được chia sẻ trong phòng chat này hoặc từ khóa tìm kiếm không khớp.
                        </p>
                    </div>
                ) : (
                    
                    // Render list based on tab
                    activeTab === 'media' ? (
                        /* MEDIA GRID (IMAGES & VIDEOS) */
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                            {activeItemsList.map(item => (
                                <div 
                                    key={item.id}
                                    className={`group rounded-2xl border overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                                        darkMode 
                                            ? 'bg-[#1e293b] border-white/10 hover:border-indigo-500/50' 
                                            : 'bg-white border-gray-200 hover:border-indigo-500/30'
                                    }`}
                                >
                                    {/* Thumbnail Preview Area */}
                                    <div className="aspect-square w-full bg-gray-100 dark:bg-black/40 relative overflow-hidden">
                                        {item.type === 'video' ? (
                                            <div className="w-full h-full flex items-center justify-center relative">
                                                <video src={item.url} className="w-full h-full object-cover opacity-90" />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                    <span className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold pl-1 shadow-md">▶</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <img 
                                                src={item.url} 
                                                alt={item.name} 
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        )}

                                        {/* Hover Actions Panel Overlay */}
                                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
                                            <div className="flex justify-end gap-2">
                                                {/* Go to message bubble link */}
                                                <button
                                                    onClick={() => handleJumpToMessage(item.roomId, item.id)}
                                                    className="w-8 h-8 rounded-lg bg-white/20 text-white hover:bg-indigo-500 transition-colors flex items-center justify-center backdrop-blur-sm"
                                                    title="Xem tin nhắn gốc"
                                                >
                                                    <FaEye size={14} />
                                                </button>
                                                
                                                {/* Download Button */}
                                                <a
                                                    href={item.url}
                                                    download={item.name}
                                                    className="w-8 h-8 rounded-lg bg-white/20 text-white hover:bg-indigo-500 transition-colors flex items-center justify-center backdrop-blur-sm"
                                                    title="Tải xuống tệp tin"
                                                >
                                                    <FaDownload size={14} />
                                                </a>
                                            </div>

                                            {/* Date / Sender Info inside overlay */}
                                            <div className="text-white">
                                                <p className="text-xs font-semibold truncate">@{item.senderUsername}</p>
                                                <p className="text-[10px] opacity-70 mt-1">{item.date}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer File Details */}
                                    <div className="p-4 flex-1 flex flex-col justify-between">
                                        <p className={`text-sm font-semibold truncate mb-3 ${
                                            darkMode ? 'text-white' : 'text-slate-800'
                                        }`}>
                                            {item.name}
                                        </p>
                                        <div className="flex items-center justify-between mt-auto">
                                            <span className="text-xs text-gray-500 font-medium truncate max-w-[80px]">
                                                {item.roomName}
                                            </span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${darkMode ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                                {item.type.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : activeTab === 'docs' ? (
                        /* DOCUMENT LIST ROW/TABLE STYLE */
                        <div className="space-y-3 max-w-5xl mx-auto">
                            {activeItemsList.map(item => (
                                <div 
                                    key={item.id}
                                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 hover:shadow-md ${
                                        darkMode 
                                            ? 'bg-[#1e293b] border-white/10 hover:border-indigo-500/50' 
                                            : 'bg-white border-gray-200 hover:border-indigo-500/30'
                                    }`}
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        {/* Icon representation */}
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                            darkMode ? 'bg-white/5' : 'bg-indigo-50'
                                        }`}>
                                            {getFileIcon(item.name, item.type)}
                                        </div>

                                        {/* Document naming and context info */}
                                        <div className="min-w-0">
                                            <h4 className={`text-sm font-bold truncate mb-1.5 ${darkMode ? 'text-white' : 'text-slate-800'}`}>{item.name}</h4>
                                            <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                <span className="flex items-center gap-1.5"><FaUser className="text-[10px]" /> @{item.senderUsername}</span>
                                                <span className="flex items-center gap-1.5"><FaClock className="text-[10px]" /> {item.date}</span>
                                                <span className="flex items-center gap-1.5 text-indigo-500"><FaCommentAlt className="text-[10px]" /> {item.roomName}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action items on the right side */}
                                    <div className="flex items-center gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-white/5">
                                        {/* Go to message */}
                                        <button 
                                            onClick={() => handleJumpToMessage(item.roomId, item.id)}
                                            className={`px-4 py-2 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-2 ${
                                                darkMode 
                                                    ? 'border-white/10 hover:bg-white/10 text-gray-300' 
                                                    : 'border-gray-200 hover:bg-gray-50 text-slate-600'
                                            }`}
                                            title="Xem tin nhắn gốc"
                                        >
                                            <FaEye size={14} /> <span className="hidden sm:inline">Tin gốc</span>
                                        </button>

                                        {/* Download button */}
                                        <a 
                                            href={item.url} 
                                            download={item.name}
                                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors flex items-center gap-2 shadow-sm"
                                            title="Tải xuống tài liệu"
                                        >
                                            <FaDownload size={14} /> <span className="hidden sm:inline">Tải xuống</span>
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* LINKS LIST */
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
                            {activeItemsList.map(item => (
                                <div 
                                    key={item.id}
                                    className={`p-6 rounded-2xl border flex flex-col justify-between gap-5 transition-all duration-300 hover:shadow-md ${
                                        darkMode 
                                            ? 'bg-[#1e293b] border-white/10 hover:border-indigo-500/50' 
                                            : 'bg-white border-gray-200 hover:border-indigo-500/30'
                                    }`}
                                >
                                    <div className="space-y-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                                <FaLink size={16} />
                                            </span>
                                            
                                            {/* Link Context Metadata */}
                                            <div className="flex-1 text-right text-xs font-medium text-gray-500">
                                                <span>@{item.senderUsername} • {item.date}</span>
                                                <p className="text-indigo-500 font-semibold mt-1 truncate max-w-[180px] ml-auto">{item.roomName}</p>
                                            </div>
                                        </div>

                                        {/* Link Title and URL */}
                                        <div className="space-y-2">
                                            <a 
                                                href={item.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="text-sm font-semibold text-indigo-500 hover:underline break-all flex items-center gap-2"
                                            >
                                                {item.url} <FaExternalLinkAlt size={12} className="shrink-0" />
                                            </a>
                                            <p className={`text-sm leading-relaxed line-clamp-3 pl-3 border-l-2 ${
                                                darkMode ? 'border-white/20 text-gray-400' : 'border-gray-200 text-slate-600'
                                            }`}>
                                                "{item.textContext}"
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Links Buttons */}
                                    <div className={`flex items-center gap-3 pt-4 border-t ${darkMode ? 'border-white/10' : 'border-gray-100'}`}>
                                        <button 
                                            onClick={() => handleJumpToMessage(item.roomId, item.messageId)}
                                            className={`flex-1 py-2.5 px-4 rounded-xl border text-xs font-semibold transition-colors flex items-center justify-center gap-2 ${
                                                darkMode 
                                                    ? 'border-white/10 hover:bg-white/10 text-gray-300' 
                                                    : 'border-gray-200 hover:bg-gray-50 text-slate-600'
                                            }`}
                                        >
                                            <FaEye size={14} /> Tin gốc
                                        </button>
                                        <a 
                                            href={item.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            Mở liên kết <FaExternalLinkAlt size={12} />
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
