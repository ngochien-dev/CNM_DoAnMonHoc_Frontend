import React from 'react';
import {
    FaLock, FaReply, FaTimes, FaSmile, FaSmileBeam, FaImage,
    FaPoll, FaCalendarAlt, FaPalette, FaMapMarkerAlt,
    FaMicrophone, FaStopCircle, FaPaperPlane
} from 'react-icons/fa';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import E2EEDecryptor from './E2EEDecryptor';

const ChatInput = ({
    user, activeRoom, currentGroup, allGroups, onlineUsers, darkMode,
    msgInput, handleInputChange, handleSendText,
    showEmojiPicker, setShowEmojiPicker, emojiPickerRef, handleEmojiClick,
    showStickerPicker, setShowStickerPicker,
    replyingToMessage, setReplyingToMessage, sharedE2EEKey,
    showMentionPopup, mentionSearchQuery, handleSelectMention,
    fileInputRef, handleFileUpload,
    setShowPollModal, setShowEventModal, setShowPaintPad, handleSendLocation,
    isRecording, startRecording, stopRecording, recordingTime, formatTime
}) => {

    const isOwner = user.username === currentGroup?.owner;
    const isMod = (currentGroup?.mods || []).includes(user.username);
    const canSendInChannel = isOwner || isMod;

    // Kiểm tra cấm chat (Muted)
    const muteExpiresAt = currentGroup?.mutedMembers?.[user.username];
    let isMuted = false;
    let muteMessage = '';
    
    if (muteExpiresAt) {
        if (muteExpiresAt === 'forever') {
            isMuted = true;
            muteMessage = "Bạn đã bị cấm chat vô thời hạn bởi Quản trị viên";
        } else {
            const expireTime = new Date(muteExpiresAt).getTime();
            if (expireTime > Date.now()) {
                isMuted = true;
                const formattedTime = new Date(muteExpiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const formattedDate = new Date(muteExpiresAt).toLocaleDateString([], { day: '2-digit', month: '2-digit' });
                muteMessage = `Bạn đã bị cấm chat bởi Quản trị viên đến ${formattedTime} ngày ${formattedDate}`;
            }
        }
    }

    if (isMuted) {
        return (
            <div className="p-6 shrink-0 relative bg-transparent">
                <div className="flex items-center justify-center p-4 bg-red-500/10 rounded-2xl text-red-500 font-black uppercase tracking-[2px] text-[10px] border border-red-500/20 animate-pulse">
                    <FaLock className="mr-2" /> {muteMessage}
                </div>
            </div>
        );
    }

    // Nếu là kênh thông báo và user không phải owner/mod -> Chỉ đọc
    if (currentGroup?.isChannel && !canSendInChannel) {
        return (
            <div className="p-6 shrink-0 relative bg-transparent">
                <div className="flex items-center justify-center p-4 bg-indigo-500/10 rounded-2xl text-indigo-400 font-black uppercase tracking-[3px] text-[10px] border border-indigo-500/20 animate-pulse">
                    <FaLock className="mr-2" /> Chỉ quản trị viên mới có thể truyền tín hiệu trong kênh này
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 shrink-0 relative bg-transparent">
            {/* Khung chọn Emoji */}
            {showEmojiPicker && (
                <div ref={emojiPickerRef} className="absolute bottom-24 left-6 z-50 shadow-2xl rounded-[30px] overflow-hidden border border-white/10 animate-in zoom-in-75">
                    <EmojiPicker onEmojiClick={handleEmojiClick} theme={darkMode ? Theme.DARK : Theme.LIGHT} />
                </div>
            )}

            {/* Khung hiển thị Đang trả lời tin nhắn */}
            {replyingToMessage && (
                <div className={`mb-2 p-3 rounded-xl flex justify-between items-center border ${darkMode ? 'bg-indigo-900/30 border-indigo-500/30 text-indigo-200' : 'bg-indigo-50 border-indigo-200 text-indigo-800'}`}>
                    <div className="flex-1 truncate text-xs">
                        <span className="font-black uppercase tracking-widest mr-2">
                            <FaReply className="inline mr-1" /> Trả lời @{replyingToMessage.senderUsername}:
                        </span>
                        <span className="italic">
                            <E2EEDecryptor msg={replyingToMessage} sharedKey={sharedE2EEKey} isMe={replyingToMessage.senderUsername === user.username} />
                        </span>
                    </div>
                    <button onClick={() => setReplyingToMessage(null)} className="ml-4 hover:text-red-500 transition-colors">
                        <FaTimes size={14} />
                    </button>
                </div>
            )}

            {/* Popup Nhắc tên (@ Mention) */}
            {showMentionPopup && (() => {
                const currentG = allGroups.find(g => g.groupId === activeRoom?.id);
                const mentionOptions = (currentG?.members || []).filter(uname => uname !== user.username && uname.toLowerCase().includes(mentionSearchQuery));
                if (mentionOptions.length === 0) return null;

                return (
                    <div className={`absolute bottom-20 left-6 z-[200] w-64 max-h-56 overflow-y-auto rounded-2xl shadow-2xl border transition-all duration-200 animate-in slide-in-from-bottom-2 ${darkMode ? 'bg-[#0f172a]/95 border-white/10 text-white backdrop-blur-md' : 'bg-white border-gray-200 text-slate-800'}`}>
                        <div className="p-3 border-b border-white/5 bg-indigo-500/10 text-[9px] uppercase font-black tracking-widest text-indigo-400">
                            Nhắc tên thành viên (@)
                        </div>
                        <div className="p-1">
                            {mentionOptions.map(uname => {
                                const memberOnline = onlineUsers[uname];
                                return (
                                    <div key={uname} onClick={() => handleSelectMention(uname)} className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all ${darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                                        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-xs overflow-hidden shrink-0">
                                            {memberOnline?.avatar ? <img src={memberOnline.avatar} className="w-full h-full object-cover" alt="" /> : uname[0].toUpperCase()}
                                        </div>
                                        <div className="truncate flex-1 min-w-0">
                                            <p className="text-xs font-bold truncate">@{uname}</p>
                                            <p className="text-[9px] text-gray-500 truncate">{memberOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })()}

            {/* Thanh nhập liệu chính */}
            <div className={`rounded-2xl flex items-center px-4 py-3 border transition-all ${darkMode ? 'bg-white/5 border-white/10 focus-within:border-indigo-500' : 'bg-white border-gray-200 focus-within:border-indigo-500 shadow-sm'} ${isRecording ? 'border-red-500 animate-pulse bg-red-500/5' : ''}`}>
                {!isRecording && (
                    <div className={`flex gap-4 mr-4 border-r pr-4 ${darkMode ? 'text-gray-500 border-white/5' : 'text-slate-400 border-gray-200'}`}>
                        <FaSmile onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowStickerPicker(false); }} className="cursor-pointer hover:text-orange-400 transition-all hover:scale-110" size={20} />
                        <FaSmileBeam onClick={() => { setShowStickerPicker(!showStickerPicker); setShowEmojiPicker(false); }} className={`cursor-pointer transition-all hover:scale-110 ${showStickerPicker ? 'text-yellow-400' : 'hover:text-yellow-400'}`} size={20} title="Stickers" />

                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />

                        <FaImage onClick={() => fileInputRef.current.click()} className="cursor-pointer hover:text-blue-500 transition-all hover:scale-110" size={18} />
                        <FaPoll onClick={() => setShowPollModal(true)} className="cursor-pointer hover:text-emerald-500 transition-all hover:scale-110" size={18} title="Tạo bình chọn" />
                        <FaCalendarAlt onClick={() => setShowEventModal(true)} className="cursor-pointer hover:text-purple-500 transition-all hover:scale-110" size={18} title="Tạo lịch nhóm" />
                        <FaPalette onClick={() => setShowPaintPad(true)} className="cursor-pointer hover:text-pink-500 transition-all hover:scale-110" size={18} title="Vẽ phác thảo" />
                        <FaMapMarkerAlt onClick={handleSendLocation} className="cursor-pointer hover:text-red-500 transition-all hover:scale-110" size={18} title="Chia sẻ vị trí" />
                    </div>
                )}

                {isRecording ? (
                    <div className="flex-1 flex items-center justify-between text-red-500 font-bold uppercase tracking-widest text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
                            Đang thu âm... {formatTime(recordingTime)}
                            <div className="flex items-center gap-[3px] h-6 px-2 shrink-0">
                                {[...Array(12)].map((_, i) => (
                                    <div key={i} style={{ animationDelay: `${i * 0.05}s`, height: '6px' }} className="w-[2.5px] bg-red-500 rounded-full recording-wave-bar" />
                                ))}
                            </div>
                            <style>{`
                                @keyframes soundWave {
                                    0%, 100% { height: 6px; }
                                    50% { height: 18px; }
                                }
                                .recording-wave-bar { animation: soundWave 0.6s ease-in-out infinite; }
                            `}</style>
                        </div>
                    </div>
                ) : (
                    <input
                        value={msgInput}
                        onChange={handleInputChange}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
                        placeholder={`Nhập tín hiệu...`}
                        className={`bg-transparent w-full outline-none text-sm font-bold ${darkMode ? 'text-white placeholder:text-gray-700' : 'text-slate-800 placeholder:text-gray-400'}`}
                    />
                )}

                <div className="flex items-center gap-3 ml-4">
                    {isRecording ? (
                        <button onClick={stopRecording} className="text-red-500 scale-125 transition-all transform hover:scale-150"><FaStopCircle size={20} /></button>
                    ) : (
                        <button onClick={startRecording} className="text-gray-400 hover:text-red-500 transition-all transform hover:scale-125"><FaMicrophone size={18} /></button>
                    )}
                    {!isRecording && (
                        <button onClick={handleSendText} className={`${msgInput.trim() ? 'text-indigo-500 scale-125' : 'text-gray-400'} transition-all transform active:scale-90`}><FaPaperPlane size={20} /></button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatInput;