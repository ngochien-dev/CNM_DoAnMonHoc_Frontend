import React from 'react';
import {
    FaReply, FaCommentDots, FaShare, FaLanguage, FaThumbtack,
    FaSmileBeam, FaShieldAlt, FaEdit, FaTrash, FaUndo, FaLock,
    FaStopCircle, FaPoll, FaCalendarAlt, FaMapMarkerAlt, FaFileAlt
} from 'react-icons/fa';
import E2EEDecryptor from './E2EEDecryptor';
import LinkPreview from './LinkPreview';
import WaveformVoicePlayer from './WaveformVoicePlayer';
import api from '../../services/api';

const MessageItem = ({
    msg, user, isMe, sOnline, darkMode, sharedE2EEKey, searchContent,
    translatedMessages, translatingMessageId, showReactionMenu, editingMessage, editText,
    setEditText, handleOpenProfile, setReplyingToMessage, setActiveThread, setIsRightSidebarVisible,
    setForwardMessageData, handleTranslateMessage, handlePinMessage, setShowReactionMenu,
    handleReactToMessage, handleOpenReportModal, handleEditMessage, handleSaveEdit, handleCancelEdit,
    deleteForMe, unsendEverywhere, onImageClick
}) => {
    return (
        <div id={`msg-${msg.messageId}`} className={`flex gap-4 ${isMe ? 'flex-row-reverse text-right' : ''} group animate-in slide-in-from-bottom-2 transition-all duration-500 rounded-2xl`}>
            <div onClick={() => handleOpenProfile(msg.senderUsername)} className="w-10 h-10 rounded-xl shadow-lg cursor-pointer overflow-hidden shrink-0 border border-white/5 bg-slate-800 transition-all group-hover:scale-105">
                {sOnline?.avatar ? <img src={sOnline.avatar} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-white font-black uppercase bg-indigo-500">{msg.sender[0]}</div>}
            </div>
            <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`text-[10px] mb-1.5 font-black uppercase tracking-tighter italic flex items-center gap-1 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                    @{msg.senderUsername} • {msg.time}
                    {isMe && !msg.isRevoked && (() => {
                        const readerCount = (msg.readBy || []).filter(u => u !== user.username).length;
                        const delivereeCount = (msg.deliveredTo || []).filter(u => u !== user.username).length;

                        if (readerCount > 0) {
                            return <span className="ml-1 text-[9px] text-blue-400 font-bold" title={`Đã xem bởi: ${(msg.readBy || []).filter(u => u !== user.username).join(', ')}`}>✓✓</span>;
                        } else if (delivereeCount > 0) {
                            return <span className="ml-1 text-[9px] text-gray-400 font-bold" title={`Đã nhận bởi: ${(msg.deliveredTo || []).filter(u => u !== user.username).join(', ')}`}>✓✓</span>;
                        } else {
                            return <span className="ml-1 text-[9px] text-gray-600" title="Đã gửi">✓</span>;
                        }
                    })()}
                </div>
                <div className="relative group/bubble">
                    {!msg.isRevoked && (
                        <div className={`absolute top-0 flex gap-2 p-1 bg-[#0f172a] border border-white/10 shadow-2xl rounded-xl opacity-0 group-hover/bubble:opacity-100 transition-all z-10 ${isMe ? 'right-full mr-3' : 'left-full ml-3'}`}>
                            <button onClick={() => setReplyingToMessage(msg)} className="p-1 text-gray-400 hover:text-blue-400" title="Trả lời"><FaReply size={12} /></button>
                            <button onClick={() => { setActiveThread(msg); setIsRightSidebarVisible(true); }} className="p-1 text-gray-400 hover:text-pink-400" title="Thảo luận (Thread)"><FaCommentDots size={12} /></button>
                            <button onClick={() => setForwardMessageData(msg)} className="p-1 text-gray-400 hover:text-green-400" title="Chuyển tiếp"><FaShare size={12} /></button>
                            {msg.text && !msg.msgType && (
                                <button onClick={() => handleTranslateMessage(msg.messageId, msg.text)} className={`p-1 transition-all ${translatingMessageId === msg.messageId ? 'text-green-400 animate-pulse' : (translatedMessages[msg.messageId] ? 'text-green-500 hover:text-green-400' : 'text-gray-400 hover:text-green-400')}`} title="Dịch thuật">
                                    <FaLanguage size={14} className={translatingMessageId === msg.messageId ? 'animate-spin' : ''} />
                                </button>
                            )}
                            <button onClick={() => handlePinMessage(msg.messageId, !msg.isPinned)} className={`p-1 ${msg.isPinned ? 'text-indigo-400' : 'text-gray-400 hover:text-indigo-400'}`} title={msg.isPinned ? "Bỏ ghim" : "Ghim tin nhắn"}><FaThumbtack size={12} /></button>

                            <div className="relative">
                                <button onClick={() => setShowReactionMenu(showReactionMenu === msg.messageId ? null : msg.messageId)} className="p-1 text-gray-400 hover:text-yellow-400" title="Thả cảm xúc"><FaSmileBeam size={12} /></button>
                                {showReactionMenu === msg.messageId && (
                                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 shadow-2xl rounded-full p-2 flex gap-2 z-50 animate-in slide-in-from-top-2">
                                        {['❤️', '😂', '😮', '😢', '👍'].map(emoji => (
                                            <button key={emoji} onClick={() => handleReactToMessage(msg.messageId, emoji)} className="text-xl hover:scale-125 transition-transform">{emoji}</button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {!isMe && (
                                <button onClick={() => handleOpenReportModal(msg)} className="p-1 text-gray-400 hover:text-amber-500 transition-colors duration-200" title="Báo cáo vi phạm">
                                    <FaShieldAlt size={12} />
                                </button>
                            )}

                            {(isMe || user.role === 'admin') && (
                                <>
                                    {isMe && msg.text && !msg.fileData && !msg.msgType && (
                                        <button onClick={() => handleEditMessage(msg)} className="p-1 text-gray-400 hover:text-emerald-400" title="Chỉnh sửa"><FaEdit size={12} /></button>
                                    )}
                                    <button onClick={() => deleteForMe(msg.messageId)} className="p-1 text-gray-400 hover:text-red-500" title="Xóa phía tôi"><FaTrash size={12} /></button>
                                    <button onClick={() => unsendEverywhere(msg.messageId)} className="p-1 text-indigo-400 hover:text-indigo-300" title="Thu hồi"><FaUndo size={12} /></button>
                                </>
                            )}
                        </div>
                    )}
                    <div className={`p-4 rounded-2xl text-[14px] font-medium leading-relaxed shadow-lg ${msg.msgType === 'sticker' ? 'bg-transparent shadow-none border-none' : (isMe ? (msg.isSecret ? 'bg-red-600 text-white rounded-tr-none' : 'bg-indigo-600 text-white rounded-tr-none') : (darkMode ? 'bg-white/5 text-gray-100 border border-white/5 rounded-tl-none' : 'bg-white text-slate-700 border border-gray-100 rounded-tl-none'))} ${msg.isRevoked ? 'italic opacity-30 border-2 border-dashed' : ''}`}>
                        {msg.forwardFrom && !msg.isRevoked && (
                            <div className={`mb-2 flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider ${isMe ? 'text-indigo-200/80' : 'text-indigo-500 dark:text-indigo-400'}`}>
                                <FaShare size={10} className="shrink-0 scale-x-[-1] animate-pulse" />
                                <span>Được chuyển tiếp từ @{msg.forwardFrom.senderUsername}</span>
                            </div>
                        )}
                        {msg.isSecret && (
                            <div className={`mb-2 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${isMe ? 'text-red-200/60' : 'text-red-400'}`}>
                                <FaLock size={10} /> Chat Bí Mật (Không lưu server)
                            </div>
                        )}
                        {msg.expiresAt && !msg.isRevoked && (
                            <div className={`mb-2 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${isMe ? 'text-indigo-200/60' : 'text-gray-400'}`}>
                                <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></div>
                                <FaStopCircle size={10} />
                                Tự hủy sau: {(() => {
                                    const remaining = Math.max(0, Math.ceil((msg.expiresAt - Date.now()) / 1000));
                                    if (remaining < 60) return `${remaining} giây`;
                                    if (remaining < 3600) return `${Math.ceil(remaining / 60)} phút`;
                                    return `${Math.ceil(remaining / 3600)} giờ`;
                                })()}
                            </div>
                        )}
                        {!msg.isRevoked && msg.msgType === 'sticker' ? (
                            <img src={msg.fileData} className="w-40 h-40 object-contain animate-in zoom-in-50" alt="sticker" />
                        ) : (
                            <>
                                {!msg.isRevoked && msg.replyTo && (
                                    <div className={`mb-3 pl-3 py-1 border-l-2 text-xs opacity-80 ${isMe ? 'border-white/50 bg-black/10' : 'border-indigo-500 bg-black/5 dark:bg-white/5'} rounded-r-lg`}>
                                        <div className="font-bold">@{msg.replyTo.senderUsername}</div>
                                        <div className="truncate opacity-75">
                                            <E2EEDecryptor msg={msg.replyTo} sharedKey={sharedE2EEKey} isMe={msg.replyTo.senderUsername === user.username} searchQuery={searchContent} />
                                        </div>
                                    </div>
                                )}
                                {msg.msgType === 'poll' ? (
                                    <div className="min-w-[200px]">
                                        <div className="font-black text-lg mb-4 flex items-center gap-2"><FaPoll className="text-emerald-400" /> {msg.pollData?.question}</div>
                                        <div className="space-y-2">
                                            {msg.pollData?.options.map((opt, i) => {
                                                const totalVotes = msg.pollData.options.reduce((sum, o) => sum + (o.votes?.length || 0), 0);
                                                const pct = totalVotes === 0 ? 0 : Math.round(((opt.votes?.length || 0) / totalVotes) * 100);
                                                const hasVoted = opt.votes?.includes(user.username);
                                                return (
                                                    <div key={i} onClick={() => api.post('/v1/messages/vote', { messageId: msg.messageId, optionIndex: i, username: user.username })} className={`relative p-3 rounded-lg border cursor-pointer overflow-hidden transition-all hover:border-emerald-500 ${hasVoted ? 'border-emerald-500 bg-emerald-500/10' : (darkMode ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-white')}`}>
                                                        <div className="absolute left-0 top-0 bottom-0 bg-emerald-500/20 transition-all duration-500" style={{ width: `${pct}%` }}></div>
                                                        <div className="relative flex justify-between text-sm font-bold z-10">
                                                            <span>{opt.text}</span>
                                                            <span>{opt.votes?.length || 0} ({pct}%)</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : msg.msgType === 'event' ? (
                                    <div className="min-w-[250px] p-2">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 bg-purple-500 rounded-xl flex flex-col items-center justify-center text-white shrink-0 shadow-lg border border-white/10">
                                                <span className="text-[10px] font-black uppercase leading-none opacity-80">THÁNG {msg.eventData?.date.split('-')[1]}</span>
                                                <span className="text-xl font-black leading-none">{msg.eventData?.date.split('-')[2]}</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-black text-lg mb-1">{msg.eventData?.title}</div>
                                                <div className="text-xs font-bold opacity-80 flex items-center gap-1 mb-3"><FaCalendarAlt /> {msg.eventData?.time} • {msg.eventData?.date}</div>
                                                <div className="flex items-center justify-between border-t border-white/10 pt-3 mt-3">
                                                    <div className="text-xs font-bold">{msg.eventData?.attendees?.length || 0} người tham gia</div>
                                                    <button onClick={() => api.post('/v1/messages/attend-event', { messageId: msg.messageId, username: user.username, action: msg.eventData?.attendees?.includes(user.username) ? 'leave' : 'join' })} className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase transition-all shadow-lg ${msg.eventData?.attendees?.includes(user.username) ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-purple-500 text-white hover:bg-purple-600'}`}>{msg.eventData?.attendees?.includes(user.username) ? 'Hủy tham gia' : 'Tham gia'}</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : msg.msgType === 'location' ? (
                                    <div className="min-w-[200px] flex flex-col gap-2">
                                        <div className="font-bold text-sm flex items-center gap-2"><FaMapMarkerAlt className="text-red-500" /> Vị trí đã chia sẻ</div>
                                        <div className="w-full h-40 rounded-xl overflow-hidden bg-black/10 border border-white/10 relative">
                                            <iframe
                                                width="100%" height="100%" frameBorder="0" scrolling="no" marginHeight="0" marginWidth="0"
                                                src={`https://www.openstreetmap.org/export/embed.html?bbox=${msg.locationData.lng - 0.01},${msg.locationData.lat - 0.01},${msg.locationData.lng + 0.01},${msg.locationData.lat + 0.01}&layer=mapnik&marker=${msg.locationData.lat},${msg.locationData.lng}`}>
                                            </iframe>
                                        </div>
                                        <a href={`https://www.google.com/maps?q=${msg.locationData.lat},${msg.locationData.lng}`} target="_blank" rel="noopener noreferrer" className={`w-full py-2 rounded-lg font-bold text-xs text-center flex items-center justify-center gap-2 mt-1 transition-all ${isMe ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white'}`}>Mở Google Maps</a>
                                    </div>
                                ) : (
                                    <>
                                        {editingMessage?.messageId === msg.messageId ? (
                                            <div className="space-y-2 min-w-[200px]">
                                                <input value={editText} onChange={e => setEditText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveEdit()} className="w-full p-2 rounded-lg bg-black/30 border border-white/20 text-sm outline-none focus:border-indigo-400 text-white" autoFocus />
                                                <div className="flex gap-2 text-[9px]">
                                                    <button onClick={handleSaveEdit} className="px-3 py-1 bg-emerald-500 text-white rounded-lg font-black uppercase">Lưu</button>
                                                    <button onClick={handleCancelEdit} className="px-3 py-1 bg-white/10 text-gray-400 rounded-lg font-black uppercase">Hủy</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <E2EEDecryptor msg={msg} sharedKey={sharedE2EEKey} isMe={isMe} searchQuery={searchContent} />
                                                {msg.isEdited && <span className={`text-[9px] italic ml-2 ${isMe ? 'opacity-60' : 'text-gray-500'}`}>(đã chỉnh sửa)</span>}

                                                {translatedMessages[msg.messageId] && (
                                                    <div className={`mt-2.5 pt-2 border-t text-[12px] opacity-95 transition-all duration-300 animate-in slide-in-from-top-1 ${isMe ? 'border-white/20 text-indigo-100' : 'border-indigo-500/20 text-indigo-800 dark:text-indigo-200'}`}>
                                                        <div className="flex items-center gap-1.5 mb-1 text-[9px] font-black uppercase tracking-wider opacity-75">
                                                            <FaLanguage size={14} /> Bản dịch tự động:
                                                        </div>
                                                        <p className="italic font-bold font-serif">{translatedMessages[msg.messageId]}</p>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        {!msg.isRevoked && msg.text && (() => {
                                            const urlRegex = /((?:https?:\/\/|www\.)[^\s]+|[a-zA-Z0-9.-]+\.(?:com|net|org|vn|edu|gov|io)[^\s]*)/g;
                                            const urls = msg.text.match(urlRegex);
                                            return urls ? urls.slice(0, 1).map((url, i) => (
                                                <LinkPreview key={i} url={url.replace(/\.+$/, '').trim()} darkMode={darkMode} />
                                            )) : null;
                                        })()}
                                        {!msg.isRevoked && msg.fileData && (
                                            <div className="mt-3">
                                                {msg.fileType === 'audio' ? (
                                                    <WaveformVoicePlayer src={msg.fileData} darkMode={darkMode} />
                                                ) : msg.fileType === 'image' ? (
                                                    <img src={msg.fileData} onClick={onImageClick} className="max-w-xs rounded-xl shadow-2xl border border-white/10 cursor-pointer hover:opacity-80 transition-all hover:scale-105" alt="attachment" />
                                                ) : msg.fileType === 'video' ? (
                                                    <video controls src={msg.fileData} className="max-w-xs rounded-xl shadow-2xl border border-white/10" />
                                                ) : (
                                                    <a href={msg.fileData} download={msg.fileName} className="flex items-center gap-3 p-3 bg-black/30 rounded-xl text-xs font-black text-indigo-400"><FaFileAlt /> {msg.fileName}</a>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                    {!msg.isRevoked && msg.reactions && msg.reactions.length > 0 && (
                        <div className={`absolute -bottom-3 ${isMe ? 'right-2' : 'left-2'} flex gap-1 z-10`}>
                            {Array.from(new Set(msg.reactions.map(r => r.emoji))).map(emoji => (
                                <div key={emoji} className="bg-[#0f172a] border border-white/10 rounded-full px-1.5 py-0.5 text-xs flex items-center gap-1 shadow-lg cursor-pointer hover:scale-110 transition-transform" onClick={() => handleReactToMessage(msg.messageId, emoji)}>
                                    {emoji} <span className="text-[10px] text-gray-400 font-bold">{msg.reactions.filter(r => r.emoji === emoji).length}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageItem;