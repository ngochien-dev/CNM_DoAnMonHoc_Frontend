import React from 'react';
import {
    FaReply, FaCommentDots, FaShare, FaLanguage, FaThumbtack,
    FaSmileBeam, FaShieldAlt, FaEdit, FaTrash, FaUndo, FaLock,
    FaPoll, FaCalendarAlt, FaMapMarkerAlt, FaFileAlt
} from 'react-icons/fa';
import E2EEDecryptor from './E2EEDecryptor';
import LinkPreview from './LinkPreview';
import WaveformVoicePlayer from './WaveformVoicePlayer';
import api from '../../services/api';

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.svg', '.heic', '.heif'];
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.m4v', '.avi', '.mkv', '.webm', '.flv', '.3gp', '.3g2', '.wmv'];

const getAttachmentKind = (fileType = '', fileName = '', fileData = '') => {
    const type = String(fileType).toLowerCase();
    const name = String(fileName).toLowerCase();
    const source = String(fileData).toLowerCase();

    if (type.startsWith('image/') || type === 'image') return 'image';
    if (type.startsWith('video/') || type === 'video') return 'video';
    if (type.startsWith('audio/') || type === 'audio') return 'audio';

    if (IMAGE_EXTENSIONS.some(ext => name.endsWith(ext))) return 'image';
    if (VIDEO_EXTENSIONS.some(ext => name.endsWith(ext))) return 'video';
    if (IMAGE_EXTENSIONS.some(ext => source.includes(ext))) return 'image';
    if (VIDEO_EXTENSIONS.some(ext => source.includes(ext))) return 'video';

    if (type.includes('gif') || name.endsWith('.gif') || source.includes('.gif')) return 'image';
    return 'file';
};

const MessageItem = ({
    msg, user, isMe, sOnline, darkMode, sharedE2EEKey, searchContent,
    translatedMessages, translatingMessageId, showReactionMenu, editingMessage, editText,
    setEditText, handleOpenProfile, setReplyingToMessage, setActiveThread, setIsRightSidebarVisible,
    setForwardMessageData, handleTranslateMessage, handlePinMessage, setShowReactionMenu,
    handleReactToMessage, handleOpenReportModal, handleEditMessage, handleSaveEdit, handleCancelEdit,
    deleteForMe, unsendEverywhere, onImageClick
}) => {
    const senderLabel = msg.sender || msg.senderUsername || '?';
    const pollOptions = Array.isArray(msg.pollData?.options) ? msg.pollData.options : [];
    const eventDateParts = msg.eventData?.date ? msg.eventData.date.split('-') : [];
    const attachmentKind = getAttachmentKind(msg.fileType, msg.fileName, msg.fileData);

    // === Giao diện khi tin nhắn bị thu hồi ===
    if (msg.isRevoked) {
        return (
            <div id={`msg-${msg.messageId}`} className={`flex gap-3 mb-4 animate-in fade-in duration-300 ${isMe ? 'flex-row-reverse text-right' : ''}`}>
                <div className="w-9 h-9 shrink-0"></div> {/* Placeholder cho Avatar để canh lề */}
                <div className={`max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-2.5 rounded-[18px] text-[13px] italic font-medium flex items-center gap-2 shadow-sm border ${
                        darkMode ? 'bg-black/20 border-white/5 text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-400'
                    }`}>
                        <FaUndo size={12} className="opacity-60" /> Tín hiệu đã bị thu hồi
                    </div>
                </div>
            </div>
        );
    }

    // === Giao diện tin nhắn bình thường ===
    return (
        <div id={`msg-${msg.messageId}`} className={`flex gap-3 mb-4 group animate-in slide-in-from-bottom-2 transition-all duration-300 ${isMe ? 'flex-row-reverse text-right' : ''}`}>
            
            {/* Avatar Section */}
            <div className="shrink-0 flex flex-col justify-end select-none">
                <div className="relative w-9 h-9">
                    <div 
                        onClick={() => handleOpenProfile(msg.senderUsername)} 
                        className="w-full h-full rounded-full shadow-sm cursor-pointer overflow-hidden transition-transform duration-200 hover:scale-105 active:scale-95"
                    >
                        {sOnline?.avatar ? (
                            <img src={sOnline.avatar} className="w-full h-full object-cover" alt="avatar" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-tr from-blue-500 to-indigo-500">
                                {senderLabel[0]?.toUpperCase()}
                            </div>
                        )}
                    </div>
                    {sOnline && (
                        <span className={`absolute bottom-0 -right-0.5 w-3 h-3 bg-emerald-500 border-[2px] rounded-full z-10 ${darkMode ? 'border-[#0f172a]' : 'border-white'}`}></span>
                    )}
                </div>
            </div>

            {/* Message Content Section */}
            <div className={`max-w-[85%] sm:max-w-[70%] flex flex-col relative group/bubble ${isMe ? 'items-end' : 'items-start'}`}>
                
                {/* Sender Info & Timestamp */}
                <div className={`flex items-center gap-1.5 mb-1 text-[11px] font-semibold tracking-wide opacity-70 select-none ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                    <span>{msg.senderUsername}</span>
                    <span className="opacity-30 text-[8px]">•</span>
                    <span className="text-[10px] font-medium">{msg.time}</span>
                    {isMe && (() => {
                        const readerCount = (msg.readBy || []).filter(u => u !== user.username).length;
                        const delivereeCount = (msg.deliveredTo || []).filter(u => u !== user.username).length;

                        if (readerCount > 0) return <span className="ml-1 text-[10px] text-blue-500" title={`Đã xem bởi: ${(msg.readBy || []).filter(u => u !== user.username).join(', ')}`}>✓✓</span>;
                        if (delivereeCount > 0) return <span className="ml-1 text-[10px] text-gray-400" title={`Đã nhận bởi: ${(msg.deliveredTo || []).filter(u => u !== user.username).join(', ')}`}>✓✓</span>;
                        return <span className="ml-1 text-[10px] text-gray-400 opacity-60" title="Đã gửi">✓</span>;
                    })()}
                </div>

                {/* The Message Bubble */}
                <div className={`relative px-4 py-2.5 text-[14.5px] leading-relaxed shadow-sm transition-all duration-200 
                    ${msg.msgType === 'sticker' ? 'bg-transparent shadow-none px-0 py-0' : 
                    isMe 
                        ? (msg.isSecret 
                            ? 'bg-rose-600 text-white rounded-[20px] rounded-br-[4px]' 
                            : 'bg-blue-600 text-white rounded-[20px] rounded-br-[4px]') 
                        : (darkMode 
                            ? 'bg-[#1e293b] text-gray-100 border border-white/5 rounded-[20px] rounded-tl-[4px]' 
                            : 'bg-white text-slate-800 border border-gray-100 rounded-[20px] rounded-tl-[4px]')}`
                }>
                    
                    {/* Hover Actions Toolbar (Pill) - Dời vào trong bubble nhưng định vị absolute */}
                    <div className={`absolute -top-5 flex items-center gap-0.5 px-2 py-1 rounded-full shadow-lg opacity-0 group-hover/bubble:opacity-100 transition-opacity duration-200 z-40 border ${
                        darkMode ? 'bg-[#2a364a] border-white/10' : 'bg-white border-gray-200'
                    } ${isMe ? 'right-0' : 'left-0'}`}>
                        <button onClick={() => setReplyingToMessage(msg)} className="p-1.5 rounded-full text-gray-400 hover:text-blue-500 hover:bg-black/5 dark:hover:bg-white/5 transition-all" title="Trả lời"><FaReply size={12} /></button>
                        <button onClick={() => { setActiveThread(msg); setIsRightSidebarVisible(true); }} className="p-1.5 rounded-full text-gray-400 hover:text-pink-500 hover:bg-black/5 dark:hover:bg-white/5 transition-all" title="Thảo luận"><FaCommentDots size={12} /></button>
                        <button onClick={() => setForwardMessageData(msg)} className="p-1.5 rounded-full text-gray-400 hover:text-emerald-500 hover:bg-black/5 dark:hover:bg-white/5 transition-all" title="Chuyển tiếp"><FaShare size={12} /></button>
                        {msg.text && !msg.msgType && (
                            <button onClick={() => handleTranslateMessage(msg.messageId, msg.text)} className={`p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all ${translatingMessageId === msg.messageId ? 'text-emerald-400 animate-pulse' : (translatedMessages[msg.messageId] ? 'text-emerald-500' : 'text-gray-400 hover:text-emerald-500')}`} title="Dịch thuật">
                                <FaLanguage size={14} className={translatingMessageId === msg.messageId ? 'animate-spin' : ''} />
                            </button>
                        )}
                        <button onClick={() => handlePinMessage(msg.messageId, !msg.isPinned)} className={`p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all ${msg.isPinned ? 'text-indigo-500' : 'text-gray-400 hover:text-indigo-500'}`} title={msg.isPinned ? "Bỏ ghim" : "Ghim tin nhắn"}><FaThumbtack size={12} /></button>

                        <div className="relative group/emoji">
                            <button onClick={() => setShowReactionMenu(showReactionMenu === msg.messageId ? null : msg.messageId)} className="p-1.5 rounded-full text-gray-400 hover:text-yellow-500 hover:bg-black/5 dark:hover:bg-white/5 transition-all" title="Thả cảm xúc"><FaSmileBeam size={12} /></button>
                            {showReactionMenu === msg.messageId && (
                                <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 border shadow-2xl rounded-full p-2 flex gap-1 z-50 animate-in slide-in-from-bottom-2 ${darkMode ? 'bg-[#1e293b] border-white/10' : 'bg-white border-gray-200'}`}>
                                    {['❤️', '😂', '😮', '😢', '👍'].map(emoji => (
                                        <button key={emoji} onClick={() => handleReactToMessage(msg.messageId, emoji)} className="text-xl px-1 hover:scale-150 transition-transform duration-200">{emoji}</button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {!isMe && (
                            <button onClick={() => handleOpenReportModal(msg)} className="p-1.5 rounded-full text-gray-400 hover:text-amber-500 hover:bg-black/5 dark:hover:bg-white/5 transition-all" title="Báo cáo vi phạm">
                                <FaShieldAlt size={12} />
                            </button>
                        )}

                        {(isMe || user.role === 'admin') && (
                            <>
                                <div className="w-[1px] h-4 bg-gray-400/30 mx-0.5"></div>
                                {isMe && msg.text && !msg.fileData && !msg.msgType && (
                                    <button onClick={() => handleEditMessage(msg)} className="p-1.5 rounded-full text-gray-400 hover:text-emerald-500 hover:bg-black/5 dark:hover:bg-white/5 transition-all" title="Chỉnh sửa"><FaEdit size={12} /></button>
                                )}
                                <button onClick={() => deleteForMe(msg.messageId)} className="p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-black/5 dark:hover:bg-white/5 transition-all" title="Xóa phía tôi"><FaTrash size={12} /></button>
                                <button onClick={() => unsendEverywhere(msg.messageId)} className="p-1.5 rounded-full text-indigo-400 hover:text-indigo-300 hover:bg-black/5 dark:hover:bg-white/5 transition-all" title="Thu hồi"><FaUndo size={12} /></button>
                            </>
                        )}
                    </div>

                    {/* Forwarded Status */}
                    {msg.forwardFrom && (
                        <div className={`mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide ${isMe ? 'text-blue-200' : 'text-blue-500 dark:text-blue-400'}`}>
                            <FaShare size={10} className="shrink-0 scale-x-[-1]" />
                            <span>Chuyển tiếp từ @{msg.forwardFrom.senderUsername}</span>
                        </div>
                    )}
                    
                    {/* Secret Status */}
                    {msg.isSecret && (
                        <div className={`mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${isMe ? 'text-red-200' : 'text-red-500'}`}>
                            <FaLock size={10} /> Chat Bí Mật
                        </div>
                    )}

                    {/* Sticker */}
                    {msg.msgType === 'sticker' ? (
                        <img src={msg.fileData} className="w-36 h-36 object-contain hover:scale-105 transition-transform duration-300 cursor-pointer drop-shadow-xl" alt="sticker" />
                    ) : (
                        <>
                            {/* Replying To Preview */}
                            {msg.replyTo && (
                                <div className={`mb-2 pl-2.5 py-1 border-l-[3px] text-[13px] rounded-r-md opacity-90 cursor-pointer hover:opacity-100 transition-opacity ${isMe ? 'border-white bg-white/10' : 'border-blue-500 bg-blue-500/10'}`}>
                                    <div className="font-bold text-[11px] mb-0.5">@{msg.replyTo.senderUsername}</div>
                                    <div className="truncate opacity-80 italic">
                                        <E2EEDecryptor msg={msg.replyTo} sharedKey={sharedE2EEKey} isMe={msg.replyTo.senderUsername === user.username} searchQuery={searchContent} />
                                    </div>
                                </div>
                            )}

                            {/* --- WIDGET BÌNH CHỌN (POLL) --- */}
                            {msg.msgType === 'poll' ? (
                                <div className="min-w-[280px]">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isMe ? 'bg-white/20 text-white' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                            <FaPoll size={18} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-[16px] leading-tight">{msg.pollData?.question}</div>
                                            <div className="text-[11px] opacity-70 font-medium">Thăm dò ý kiến</div>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                                {pollOptions.map((opt, i) => {
                                                    const totalVotes = pollOptions.reduce((sum, o) => sum + (o.votes?.length || 0), 0);
                                            const pct = totalVotes === 0 ? 0 : Math.round(((opt.votes?.length || 0) / totalVotes) * 100);
                                            const hasVoted = opt.votes?.includes(user.username);
                                            
                                            return (
                                                <div 
                                                    key={i} 
                                                    onClick={() => api.post('/v1/messages/vote', { messageId: msg.messageId, optionIndex: i, username: user.username })} 
                                                    className={`relative group cursor-pointer overflow-hidden rounded-xl`}
                                                >
                                                    {/* Background Bar */}
                                                    <div className={`absolute inset-0 bg-black/5 dark:bg-white/5`}>
                                                        <div className={`h-full transition-all duration-700 ease-out ${hasVoted ? (isMe ? 'bg-white/30' : 'bg-emerald-500/20') : (isMe ? 'bg-white/10' : 'bg-black/10 dark:bg-white/10')}`} style={{ width: `${pct}%` }}></div>
                                                    </div>
                                                    {/* Content */}
                                                    <div className="relative z-10 p-3 flex items-center justify-between gap-4">
                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                            <div className={`w-4 h-4 shrink-0 rounded-full border-[1.5px] flex items-center justify-center transition-all ${
                                                                hasVoted 
                                                                    ? (isMe ? 'border-white bg-white' : 'border-emerald-500 bg-emerald-500') 
                                                                    : (isMe ? 'border-white/50 group-hover:border-white' : 'border-gray-400 group-hover:border-emerald-500')
                                                            }`}>
                                                                {hasVoted && <div className={`w-1.5 h-1.5 rounded-full ${isMe ? 'bg-blue-600' : 'bg-white'}`}></div>}
                                                            </div>
                                                            <span className={`text-[14px] font-medium truncate ${hasVoted ? 'font-bold' : ''}`}>{opt.text}</span>
                                                        </div>
                                                        <span className={`text-[12px] font-bold shrink-0 ${hasVoted ? '' : 'opacity-60'}`}>{pct}%</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-3 text-[11px] font-medium opacity-60 text-right">
                                        {msg.pollData?.options.reduce((sum, o) => sum + (o.votes?.length || 0), 0)} lượt bình chọn
                                    </div>
                                </div>
                            ) : msg.msgType === 'event' ? (
                                <div className="min-w-[260px]">
                                    <div className={`flex items-stretch rounded-xl overflow-hidden border shadow-sm ${darkMode && !isMe ? 'border-white/10' : 'border-black/5'}`}>
                                        <div className="w-[60px] bg-red-500 flex flex-col items-center justify-center text-white p-2 shrink-0">
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-90 mb-0.5">Tháng {eventDateParts[1] || '--'}</span>
                                            <span className="text-2xl font-black leading-none">{eventDateParts[2] || '--'}</span>
                                        </div>
                                        <div className={`flex-1 p-3 flex flex-col justify-center ${isMe ? 'bg-white/10' : (darkMode ? 'bg-white/5' : 'bg-gray-50')}`}>
                                            <div className="font-bold text-[15px] mb-1 line-clamp-2 leading-tight">{msg.eventData?.title}</div>
                                            <div className="text-[11px] font-medium opacity-70 flex items-center gap-1.5 mb-2">
                                                <FaCalendarAlt size={10} /> {msg.eventData?.time}
                                            </div>
                                            <div className="flex items-center gap-2 mt-auto">
                                                <div className="flex -space-x-1.5">
                                                    {(msg.eventData?.attendees || []).slice(0, 3).map((u, i) => (
                                                        <div key={i} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[7px] font-bold text-white uppercase ${isMe ? 'bg-white/20 border-blue-600' : 'bg-indigo-500 border-white dark:border-[#1e293b]'}`}>{u[0]}</div>
                                                    ))}
                                                </div>
                                                <span className="text-[10px] font-semibold opacity-70">{msg.eventData?.attendees?.length || 0} tham gia</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => api.post('/v1/messages/attend-event', { messageId: msg.messageId, username: user.username, action: msg.eventData?.attendees?.includes(user.username) ? 'leave' : 'join' })} 
                                        className={`w-full mt-2 py-2 rounded-xl text-[12px] font-bold uppercase tracking-wide transition-all ${
                                            msg.eventData?.attendees?.includes(user.username) 
                                                ? (isMe ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:bg-red-500/20 dark:text-red-400') 
                                                : (isMe ? 'bg-white text-blue-600 hover:bg-gray-100 shadow-md' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md')
                                        }`}
                                    >
                                        {msg.eventData?.attendees?.includes(user.username) ? 'Hủy tham gia' : 'Đăng ký tham gia'}
                                    </button>
                                </div>
                            ) : msg.msgType === 'location' ? (
                                <div className="min-w-[240px] flex flex-col gap-2.5">
                                    <div className="font-bold text-[15px] flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-500"><FaMapMarkerAlt size={14} /></div>
                                        Vị trí đã chia sẻ
                                    </div>
                                    <div className="w-full h-40 rounded-xl overflow-hidden relative shadow-inner">
                                        <iframe
                                            width="100%" height="100%" frameBorder="0" scrolling="no" marginHeight="0" marginWidth="0"
                                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${msg.locationData.lng - 0.01},${msg.locationData.lat - 0.01},${msg.locationData.lng + 0.01},${msg.locationData.lat + 0.01}&layer=mapnik&marker=${msg.locationData.lat},${msg.locationData.lng}`}
                                            className="pointer-events-none"
                                        >
                                        </iframe>
                                    </div>
                                    <a 
                                        href={`https://www.google.com/maps?q=${msg.locationData.lat},${msg.locationData.lng}`} 
                                        target="_blank" rel="noopener noreferrer" 
                                        className={`w-full py-2 rounded-xl font-bold text-[13px] text-center transition-all ${
                                            isMe ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-white/5 dark:hover:bg-white/10 dark:text-blue-400'
                                        }`}
                                    >
                                        Mở trên Google Maps
                                    </a>
                                </div>
                            ) : (
                                <>
                                    {/* Edit Mode Input */}
                                    {editingMessage?.messageId === msg.messageId ? (
                                        <div className="space-y-3 min-w-[220px]">
                                            <input 
                                                value={editText} 
                                                onChange={e => setEditText(e.target.value)} 
                                                onKeyDown={e => e.key === 'Enter' && handleSaveEdit()} 
                                                className={`w-full p-2.5 rounded-xl border text-[14px] outline-none transition-colors shadow-inner ${
                                                    darkMode ? 'bg-black/30 border-white/20 text-white' : 'bg-white border-gray-300 text-slate-800'
                                                }`} 
                                                autoFocus 
                                            />
                                            <div className="flex gap-2 text-[11px]">
                                                <button onClick={handleSaveEdit} className="px-4 py-1.5 bg-emerald-500 text-white rounded-lg font-bold">Lưu thay đổi</button>
                                                <button onClick={handleCancelEdit} className="px-4 py-1.5 bg-gray-500/20 text-gray-400 rounded-lg font-bold hover:bg-gray-500/30">Hủy</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <E2EEDecryptor msg={msg} sharedKey={sharedE2EEKey} isMe={isMe} searchQuery={searchContent} />
                                            {msg.isEdited && <span className={`text-[10px] italic ml-1 opacity-60 font-medium`}>(đã chỉnh sửa)</span>}

                                            {/* Auto-Translation Box */}
                                            {translatedMessages[msg.messageId] && (
                                                <div className={`mt-2 pt-2 border-t text-[13px] transition-all duration-300 animate-in slide-in-from-top-1 ${isMe ? 'border-white/20 text-blue-50' : 'border-blue-500/20 text-blue-900 dark:text-blue-200'}`}>
                                                    <div className="flex items-center gap-1.5 mb-0.5 text-[9px] font-bold uppercase tracking-wider opacity-60">
                                                        <FaLanguage size={12} className="opacity-80" /> Dịch tự động
                                                    </div>
                                                    <p className="italic font-medium">{translatedMessages[msg.messageId]}</p>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* Link Preview */}
                                    {msg.text && (() => {
                                        const urlRegex = /((?:https?:\/\/|www\.)[^\s]+|[a-zA-Z0-9.-]+\.(?:com|net|org|vn|edu|gov|io)[^\s]*)/g;
                                        const urls = msg.text.match(urlRegex);
                                        return urls ? urls.slice(0, 1).map((url, i) => (
                                            <div key={i} className="mt-2">
                                                <LinkPreview url={url.replace(/\.+$/, '').trim()} darkMode={darkMode} />
                                            </div>
                                        )) : null;
                                    })()}

                                    {/* File Attachments */}
                                    {msg.fileData && (
                                        <div className="mt-2">
                                            {attachmentKind === 'audio' ? (
                                                <div className={`p-1 rounded-xl ${isMe ? '' : ''}`}>
                                                    <WaveformVoicePlayer src={msg.fileData} darkMode={darkMode} />
                                                </div>
                                            ) : attachmentKind === 'image' ? (
                                                <img 
                                                    src={msg.fileData} 
                                                    onClick={onImageClick} 
                                                    className="max-w-[200px] sm:max-w-xs rounded-xl shadow-sm border border-white/5 cursor-pointer hover:opacity-90 transition-all duration-200" 
                                                    alt="attachment" 
                                                />
                                            ) : attachmentKind === 'video' ? (
                                                <video controls src={msg.fileData} className="max-w-[200px] sm:max-w-xs rounded-xl shadow-sm border border-white/5" />
                                            ) : (
                                                <a href={msg.fileData} download={msg.fileName} className={`flex items-center gap-3 p-2.5 rounded-xl text-[13px] font-bold transition-all border ${
                                                    isMe ? 'bg-black/10 border-white/10 text-white hover:bg-black/20' : 'bg-gray-50 dark:bg-black/20 border-gray-200 dark:border-white/5 text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-black/30'
                                                }`}>
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isMe ? 'bg-white/20' : 'bg-blue-100 dark:bg-white/10'}`}>
                                                        <FaFileAlt size={14} />
                                                    </div>
                                                    <span className="truncate max-w-[150px]">{msg.fileName}</span>
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </div>

                {/* Reactions Display */}
                {msg.reactions && msg.reactions.length > 0 && (
                    <div className={`absolute -bottom-3 ${isMe ? 'right-2' : 'left-2'} flex gap-1 z-30`}>
                        {Array.from(new Set(msg.reactions.map(r => r.emoji))).map(emoji => {
                            const count = msg.reactions.filter(r => r.emoji === emoji).length;
                            return (
                                <div 
                                    key={emoji} 
                                    className={`rounded-full px-1.5 py-0.5 text-[12px] flex items-center gap-1 shadow-md border cursor-pointer transition-transform duration-200 hover:scale-110 ${
                                        darkMode ? 'bg-[#1e293b] border-white/10' : 'bg-white border-gray-100'
                                    }`} 
                                    onClick={() => handleReactToMessage(msg.messageId, emoji)}
                                >
                                    <span>{emoji}</span> 
                                    <span className="text-[9px] font-bold opacity-70">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageItem;