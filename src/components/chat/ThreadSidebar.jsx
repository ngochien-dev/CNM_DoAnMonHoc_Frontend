import React, { useState } from 'react';
import { FaTimes, FaReply, FaPaperPlane } from 'react-icons/fa';

const ThreadSidebar = ({ activeThread, setActiveThread, messages, user, socket, activeRoom, darkMode }) => {
    const [replyText, setReplyText] = useState('');

    if (!activeThread) return null;

    // Filter messages that are direct replies to this thread
    const threadReplies = messages.filter(msg => msg.replyTo?.messageId === activeThread.messageId);

    const handleSendReply = () => {
        if (!replyText.trim()) return;

        socket.emit('send_message', {
            sender: user.displayName,
            senderUsername: user.username,
            text: replyText,
            roomId: activeRoom.id,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            replyTo: {
                messageId: activeThread.messageId,
                senderUsername: activeThread.senderUsername,
                text: activeThread.text,
                isEncrypted: activeThread.isEncrypted || false,
                iv: activeThread.iv || null
            }
        });

        setReplyText('');
    };

    return (
        <div className={`w-80 border-l hidden lg:flex flex-col shrink-0 transition-all duration-500 ${darkMode ? "border-slate-800 bg-[#1e1f22] text-white" : "border-gray-200/80 bg-slate-50 text-slate-800"}`}>
            {/* Header */}
            <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-[14px]">Thảo luận (Thread)</h3>
                    <span className="text-xs font-black bg-indigo-500 text-white px-2 py-0.5 rounded-full">{threadReplies.length}</span>
                </div>
                <button onClick={() => setActiveThread(null)} className="p-1.5 rounded-full hover:bg-black/10 transition-colors">
                    <FaTimes size={14} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {/* Parent Message */}
                <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white text-xs shrink-0 uppercase">
                        {activeThread.senderUsername[0]}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[13px] font-bold">@{activeThread.senderUsername}</span>
                            <span className="text-[10px] text-gray-500">{new Date(activeThread.sentAt || activeThread.time).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-[13px] break-words">{activeThread.text}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 py-2">
                    <div className="h-px flex-1 bg-gray-500/20"></div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Phản hồi</span>
                    <div className="h-px flex-1 bg-gray-500/20"></div>
                </div>

                {/* Replies */}
                <div className="space-y-4">
                    {threadReplies.map(reply => (
                        <div key={reply.messageId} className="flex gap-3">
                            <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center font-bold text-white text-[10px] shrink-0 uppercase">
                                {reply.senderUsername[0]}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-[12px] font-bold">@{reply.senderUsername}</span>
                                    <span className="text-[9px] text-gray-500">{new Date(reply.sentAt || reply.time).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-[12px] break-words">{reply.text}</p>
                            </div>
                        </div>
                    ))}
                    {threadReplies.length === 0 && (
                        <p className="text-center text-xs text-gray-500 italic mt-8">Chưa có phản hồi nào. Hãy là người đầu tiên!</p>
                    )}
                </div>
            </div>

            {/* Input */}
            <div className={`p-4 border-t ${darkMode ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-white'}`}>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border focus-within:border-indigo-500 transition-colors ${darkMode ? 'bg-[#2b2d31] border-white/10' : 'bg-slate-100 border-gray-200'}`}>
                    <input 
                        type="text" 
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSendReply()}
                        placeholder="Trả lời trong luồng..." 
                        className="flex-1 bg-transparent text-[13px] outline-none"
                    />
                    <button onClick={handleSendReply} className={`p-1.5 rounded-lg transition-colors ${replyText.trim() ? 'text-indigo-500 hover:bg-indigo-500/10' : 'text-gray-500 cursor-not-allowed'}`}>
                        <FaPaperPlane size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ThreadSidebar;
