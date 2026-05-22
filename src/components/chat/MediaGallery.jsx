import React, { useState, useEffect } from 'react';
import { FaTimes, FaImage, FaFileAlt, FaLink, FaDownload, FaExternalLinkAlt, FaPlay, FaThumbtack } from 'react-icons/fa';
import api from '../../services/api';

const MediaGallery = ({ roomId, onClose, darkMode, initialTab = 'media', onNavigateToMessage }) => {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [data, setData] = useState({ media: [], files: [], links: [], pinned: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMedia = async () => {
            try {
                const [resMedia, resPinned] = await Promise.all([
                    api.get(`/v1/messages/room/${roomId}/media`),
                    api.get(`/v1/messages/search/pinned?in=${roomId}`)
                ]);
                setData({ ...resMedia.data, pinned: resPinned.data || [] });
            } catch (err) {
                console.error("Error fetching media:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMedia();
    }, [roomId]);

    const formatTime = (ts) => {
        return new Date(ts).toLocaleDateString('vi-VN');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className={`w-full max-w-4xl h-[80vh] flex flex-col rounded-[32px] overflow-hidden shadow-2xl border transition-all ${darkMode ? 'bg-[#0f172a] border-white/10' : 'bg-white border-gray-200'}`}>
                
                {/* Header */}
                <div className="p-6 flex items-center justify-between border-b border-white/5">
                    <div>
                        <h2 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Kho lưu trữ Media</h2>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Lịch sử gửi nhận trong phòng chat</p>
                    </div>
                    <button onClick={onClose} className={`p-3 rounded-full transition-all ${darkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-slate-500'}`}>
                        <FaTimes size={20}/>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex px-6 pt-4 gap-6">
                    {[
                        { id: 'media', label: 'Ảnh & Video', icon: <FaImage/> },
                        { id: 'files', label: 'Tệp đính kèm', icon: <FaFileAlt/> },
                        { id: 'links', label: 'Liên kết', icon: <FaLink/> },
                        { id: 'pinned', label: 'Tin nhắn ghim', icon: <FaThumbtack/> }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 pb-4 text-sm font-black transition-all border-b-2 ${activeTab === tab.id ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-gray-500 hover:text-gray-400'}`}
                        >
                            {tab.icon} {tab.label}
                            <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-indigo-500/20' : 'bg-gray-500/10'}`}>
                                {data[tab.id]?.length || 0}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="h-full">
                            {activeTab === 'media' && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {data.media.map((item, i) => (
                                        <div key={i} className="group relative aspect-square rounded-2xl overflow-hidden bg-black/20 border border-white/5 cursor-pointer shadow-lg hover:scale-105 transition-all">
                                            {item.fileType === 'video' ? (
                                                <div className="w-full h-full flex items-center justify-center bg-indigo-500/10">
                                                    <FaPlay className="text-indigo-500" size={32}/>
                                                    <video src={item.fileData} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            ) : (
                                                <img src={item.fileData} className="w-full h-full object-cover" alt="media" />
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                                <p className="text-[10px] text-white font-bold">@{item.senderUsername}</p>
                                                <p className="text-[9px] text-gray-300">{formatTime(item.sentAt)}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {data.media.length === 0 && <EmptyState text="Chưa có hình ảnh hoặc video nào." icon={<FaImage size={48}/>} />}
                                </div>
                            )}

                            {activeTab === 'files' && (
                                <div className="space-y-3">
                                    {data.files.map((item, i) => (
                                        <div key={i} className={`p-4 rounded-2xl flex items-center justify-between border transition-all ${darkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-gray-100 hover:bg-white shadow-sm'}`}>
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-500 shrink-0">
                                                    <FaFileAlt size={24}/>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className={`text-sm font-bold truncate ${darkMode ? 'text-white' : 'text-slate-800'}`}>{item.fileName}</p>
                                                    <p className="text-[10px] text-gray-500 mt-1">Gửi bởi @{item.senderUsername} • {formatTime(item.sentAt)}</p>
                                                </div>
                                            </div>
                                            <a href={item.fileData} download={item.fileName} className="p-3 bg-indigo-500 text-white rounded-xl shadow-lg hover:bg-indigo-600 transition-all">
                                                <FaDownload size={14}/>
                                            </a>
                                        </div>
                                    ))}
                                    {data.files.length === 0 && <EmptyState text="Chưa có tệp đính kèm nào." icon={<FaFileAlt size={48}/>} />}
                                </div>
                            )}

                            {activeTab === 'links' && (
                                <div className="space-y-3">
                                    {data.links.map((item, i) => (
                                        <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" className={`p-4 rounded-2xl flex items-center justify-between border transition-all ${darkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-gray-100 hover:bg-white shadow-sm'}`}>
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500 shrink-0">
                                                    <FaLink size={24}/>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className={`text-sm font-bold truncate ${darkMode ? 'text-white' : 'text-slate-800'}`}>{item.url}</p>
                                                    <p className="text-[10px] text-gray-500 mt-1 truncate">"{item.text}"</p>
                                                    <p className="text-[9px] text-indigo-400 mt-0.5 font-bold">Gửi bởi @{item.senderUsername} • {formatTime(item.sentAt)}</p>
                                                </div>
                                            </div>
                                            <div className="text-gray-400">
                                                <FaExternalLinkAlt size={14}/>
                                            </div>
                                        </a>
                                    ))}
                                    {data.links.length === 0 && <EmptyState text="Chưa có liên kết nào." icon={<FaLink size={48}/>} />}
                                </div>
                            )}

                            {activeTab === 'pinned' && (
                                <div className="space-y-3">
                                    {data.pinned.map((item, i) => (
                                        <div key={i} onClick={() => onNavigateToMessage && onNavigateToMessage(item.messageId)} className={`p-4 rounded-2xl flex flex-col gap-2 border transition-all cursor-pointer ${darkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-gray-100 hover:bg-white shadow-sm'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-500 shrink-0 font-bold uppercase text-[10px] border border-indigo-500/30">
                                                    {(item.senderName || item.senderId)[0]}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-xs font-bold truncate ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>@{item.senderName || item.senderId}</p>
                                                    <p className="text-[9px] text-slate-500 font-medium">{formatTime(item.sentAt)}</p>
                                                </div>
                                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors" title="Đi tới tin nhắn">
                                                    <FaExternalLinkAlt size={10}/>
                                                </div>
                                            </div>
                                            <div className={`text-[13px] leading-snug whitespace-pre-wrap ${darkMode ? 'text-gray-200' : 'text-slate-700'}`}>
                                                {item.content || <span className="italic opacity-50">[Có tệp đính kèm]</span>}
                                            </div>
                                        </div>
                                    ))}
                                    {data.pinned.length === 0 && <EmptyState text="Chưa có tin nhắn được ghim nào." icon={<FaThumbtack size={48}/>} />}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const EmptyState = ({ text, icon }) => (
    <div className="w-full py-20 flex flex-col items-center justify-center text-gray-500 opacity-40">
        <div className="mb-4">{icon}</div>
        <p className="text-sm font-black uppercase tracking-widest">{text}</p>
    </div>
);

export default MediaGallery;
