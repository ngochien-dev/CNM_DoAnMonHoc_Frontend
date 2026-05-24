import React, { useState, useEffect, useRef } from 'react';
import {
    FaRobot, FaPaperPlane, FaTrash, FaCopy, FaRegLightbulb,
    FaSearch, FaLanguage, FaPenNib, FaLink, FaImage,
    FaClipboard, FaArrowRight, FaMagic, FaCommentDots
} from 'react-icons/fa';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

// ─── Quick Action Buttons ───────────────────────────────────────────────────
const QUICK_ACTIONS = [
    { id: 'summarize', icon: FaRegLightbulb, label: 'Tóm tắt', color: 'from-amber-400 to-orange-500', prompt: 'Tóm tắt lại cuộc trò chuyện gần đây trong phòng chat này' },
    { id: 'search', icon: FaSearch, label: 'Tìm kiếm', color: 'from-blue-400 to-cyan-500', prompt: null },
    { id: 'smart_reply', icon: FaCommentDots, label: 'Gợi ý reply', color: 'from-emerald-400 to-teal-500', prompt: 'Gợi ý cho tôi một số câu trả lời phù hợp với ngữ cảnh cuộc trò chuyện hiện tại' },
    { id: 'polite', icon: FaPenNib, label: 'Viết lịch sự', color: 'from-purple-400 to-pink-500', prompt: null },
    { id: 'translate', icon: FaLanguage, label: 'Dịch thuật', color: 'from-rose-400 to-red-500', prompt: null },
    { id: 'summarize_link', icon: FaLink, label: 'Tóm tắt link', color: 'from-indigo-400 to-violet-500', prompt: null },
];

const InChatAIPanel = ({ darkMode, activeRoom, lastContextRoom, onPasteToInput }) => {
    const [inputMsg, setInputMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeQuickAction, setActiveQuickAction] = useState(null);
    const messagesEndRef = useRef(null);

    // Chat history state (persisted per context room)
    const [chatHistory, setChatHistory] = useState(() => {
        const saved = localStorage.getItem('ott_ai_inchat_history');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { return {}; }
        }
        return {};
    });

    // Determine context room (phòng chat gần nhất trước khi mở AI)
    const contextRoomId = lastContextRoom?.id || null;
    const contextRoomName = lastContextRoom?.name || 'chung';

    const historyKey = contextRoomId || 'global';
    const activeHistory = chatHistory[historyKey] || [
        {
            role: 'assistant',
            content: `Xin chào! Tôi là **Trợ lý AI OTT** 🤖\n\n${contextRoomId ? `Tôi đang theo dõi phòng chat **${contextRoomName}**. ` : ''}Tôi có thể giúp bạn:\n• Tóm tắt cuộc trò chuyện\n• Tìm kiếm tin nhắn\n• Gợi ý phản hồi nhanh\n• Sửa văn phong / Dịch thuật\n• Tóm tắt link\n\nHãy chọn nút nhanh bên dưới hoặc gõ yêu cầu!`,
            mode: 'chatbot'
        }
    ];

    // Persist history
    useEffect(() => {
        localStorage.setItem('ott_ai_inchat_history', JSON.stringify(chatHistory));
    }, [chatHistory]);

    // Auto scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, historyKey, loading]);

    // ─── Send message to AI ─────────────────────────────────────────────────
    const handleSend = async (textToSend) => {
        const msgText = textToSend || inputMsg;
        if (!msgText.trim() || loading) return;

        if (!textToSend) setInputMsg('');
        setActiveQuickAction(null);

        // Update UI with user message
        const updatedHistory = [
            ...activeHistory,
            { role: 'user', content: msgText }
        ];

        setChatHistory(prev => ({
            ...prev,
            [historyKey]: updatedHistory
        }));

        setLoading(true);

        try {
            const apiMessages = updatedHistory.map(h => ({
                role: h.role,
                content: h.content
            }));

            const res = await api.post('/chatbot', {
                messages: apiMessages,
                agent: 'in-chat',
                roomId: contextRoomId,
            });

            if (res.data && res.data.reply) {
                const aiMessage = {
                    role: 'assistant',
                    content: res.data.reply,
                    mode: res.data.mode || 'chatbot',
                    tool: res.data.tool || null,
                    toolData: res.data.toolData || null,
                    smartReplies: res.data.smartReplies || null,
                };

                setChatHistory(prev => ({
                    ...prev,
                    [historyKey]: [...updatedHistory, aiMessage]
                }));
            } else {
                throw new Error("Không có phản hồi từ máy chủ.");
            }
        } catch (error) {
            setChatHistory(prev => ({
                ...prev,
                [historyKey]: [
                    ...updatedHistory,
                    {
                        role: 'assistant',
                        content: "⚠️ Có lỗi xảy ra. Vui lòng thử lại sau!",
                        mode: 'error'
                    }
                ]
            }));
            toast.error("Trợ lý AI đang bận hoặc gặp sự cố.");
        } finally {
            setLoading(false);
        }
    };

    // ─── Quick Action handlers ──────────────────────────────────────────────
    const handleQuickAction = (action) => {
        if (action.prompt) {
            handleSend(action.prompt);
        } else {
            setActiveQuickAction(action.id);
            // Set placeholder text based on action
            const placeholders = {
                search: 'Nhập nội dung cần tìm... VD: "Phúc nói về file logo"',
                polite: 'Nhập đoạn text cần chỉnh sửa...',
                translate: 'Nhập đoạn text cần dịch...',
                summarize_link: 'Nhập URL cần tóm tắt...',
            };
            setInputMsg('');
        }
    };

    const handleQuickActionSend = () => {
        if (!inputMsg.trim()) return;
        const prefixes = {
            search: 'Tìm tin nhắn: ',
            polite: 'Chuyển sang giọng văn lịch sự hơn: ',
            translate: 'Dịch sang tiếng Anh: ',
            summarize_link: 'Tóm tắt link: ',
        };
        const prefix = prefixes[activeQuickAction] || '';
        handleSend(prefix + inputMsg);
    };

    // ─── Clear history ──────────────────────────────────────────────────────
    const handleClearHistory = () => {
        if (window.confirm('Xóa toàn bộ lịch sử trò chuyện với Trợ lý AI?')) {
            setChatHistory(prev => {
                const next = { ...prev };
                delete next[historyKey];
                return next;
            });
            toast.success("Đã xóa lịch sử trò chuyện AI.");
        }
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        toast.success("Đã sao chép vào clipboard.");
    };

    const handlePasteToChat = (text) => {
        if (onPasteToInput) {
            onPasteToInput(text);
            toast.success("Đã paste vào khung chat.");
        }
    };

    // ─── Render markdown (simplified) ───────────────────────────────────────
    const renderMarkdown = (text) => {
        if (!text) return "";
        let formatted = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        formatted = formatted.replace(/```([\s\S]+?)```/g, (match, p1) => {
            return `<pre class="bg-black/30 p-3 rounded-xl font-mono text-xs overflow-x-auto my-2 border border-white/5 whitespace-pre-wrap select-all">${p1.trim()}</pre>`;
        });
        formatted = formatted.replace(/`([^`]+)`/g, '<code class="bg-black/20 px-1.5 py-0.5 rounded font-mono text-[11px] text-amber-400 select-all">$1</code>');
        formatted = formatted.replace(/\*\*([\s\S]+?)\*\*/g, '<strong class="font-black text-indigo-400">$1</strong>');
        formatted = formatted.replace(/^\s*[-•]\s+(.+)$/gm, '<li class="ml-4 list-disc mb-1">$1</li>');

        const parts = formatted.split(/(<pre[\s\S]*?<\/pre>)/);
        const finalHtml = parts.map(part => {
            if (part.startsWith('<pre')) return part;
            return part.replace(/\n/g, '<br/>');
        }).join('');

        return <div dangerouslySetInnerHTML={{ __html: finalHtml }} className="leading-relaxed text-sm select-text" />;
    };

    // ─── Get placeholder ────────────────────────────────────────────────────
    const getPlaceholder = () => {
        if (activeQuickAction) {
            const map = {
                search: '🔍 Nhập nội dung cần tìm... VD: "Phúc nói về file logo"',
                polite: '✍️ Nhập đoạn text cần sửa lịch sự hơn...',
                translate: '🌐 Nhập đoạn text cần dịch...',
                summarize_link: '🔗 Dán URL cần tóm tắt...',
            };
            return map[activeQuickAction] || 'Nhập nội dung...';
        }
        return '💬 Hỏi Trợ lý AI bất cứ điều gì...';
    };

    // ─── Mode badge component ───────────────────────────────────────────────
    const ModeBadge = ({ mode, tool }) => {
        if (!mode || mode === 'chatbot') return null;
        const toolLabels = {
            summarize_conversation: '📋 Tóm tắt',
            search_messages: '🔍 Tìm kiếm',
            suggest_smart_replies: '💡 Gợi ý reply',
            writing_assistant: '✍️ Hỗ trợ viết',
            process_content: '🔗 Xử lý nội dung',
        };
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-1.5">
                {toolLabels[tool] || '🤖 Agent'}
            </span>
        );
    };

    return (
        <div className={`flex-1 flex flex-col overflow-hidden ${darkMode ? 'bg-[#0f172a]' : 'bg-slate-50'}`}>
            {/* ─── Header ─────────────────────────────────────────────────────── */}
            <div className={`px-5 py-4 border-b shrink-0 flex items-center justify-between ${darkMode ? 'border-white/5 bg-slate-900/50' : 'border-gray-200 bg-white shadow-sm'}`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/30">
                        <FaRobot size={18} />
                    </div>
                    <div>
                        <h3 className={`text-sm font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                            Trợ lý AI OTT
                        </h3>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                            <p className="text-[10px] text-emerald-400 font-bold">
                                Online
                                {contextRoomId && (
                                    <span className={`ml-1.5 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                                        • Đang theo dõi: {contextRoomName}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleClearHistory}
                    className={`p-2.5 rounded-xl border transition-all hover:scale-95 ${darkMode ? 'border-white/10 hover:bg-red-500/10 text-red-400' : 'border-gray-200 hover:bg-red-50 text-red-500'}`}
                    title="Xóa lịch sử"
                >
                    <FaTrash size={12} />
                </button>
            </div>

            {/* ─── Chat Messages ──────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                <div className="max-w-3xl mx-auto space-y-3">
                    {activeHistory.map((msg, idx) => {
                        const isMe = msg.role === 'user';
                        return (
                            <div key={idx} className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : ''} group`}>
                                {/* Avatar */}
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm text-xs font-bold ${
                                    isMe
                                        ? 'bg-indigo-600'
                                        : 'bg-gradient-to-tr from-indigo-500 to-purple-600'
                                }`}>
                                    {isMe ? 'U' : <FaRobot size={14} />}
                                </div>

                                {/* Message bubble */}
                                <div className="max-w-[80%] min-w-[60px]">
                                    {!isMe && <ModeBadge mode={msg.mode} tool={msg.tool} />}
                                    <div className={`px-4 py-3 rounded-2xl border text-sm relative ${
                                        isMe
                                            ? 'bg-indigo-600 border-indigo-500 text-white rounded-tr-sm'
                                            : (darkMode
                                                ? 'bg-slate-800/60 border-slate-700/60 text-slate-100 rounded-tl-sm'
                                                : 'bg-white border-gray-200 text-slate-800 rounded-tl-sm shadow-sm')
                                    }`}>
                                        {isMe ? (
                                            <div className="whitespace-pre-wrap select-text">{msg.content}</div>
                                        ) : (
                                            renderMarkdown(msg.content)
                                        )}
                                    </div>

                                    {/* Action buttons for AI messages */}
                                    {!isMe && msg.content && (
                                        <div className="flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleCopy(msg.content)}
                                                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${darkMode ? 'text-gray-500 hover:text-indigo-400 hover:bg-white/5' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'}`}
                                            >
                                                <FaCopy size={9} /> Copy
                                            </button>
                                            {onPasteToInput && (
                                                <button
                                                    onClick={() => handlePasteToChat(msg.content)}
                                                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${darkMode ? 'text-gray-500 hover:text-emerald-400 hover:bg-white/5' : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-100'}`}
                                                >
                                                    <FaClipboard size={9} /> Paste vào chat
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* Smart Reply buttons */}
                                    {!isMe && msg.smartReplies && msg.smartReplies.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {msg.smartReplies.map((reply, rIdx) => (
                                                <button
                                                    key={rIdx}
                                                    onClick={() => handlePasteToChat(reply)}
                                                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all hover:scale-[1.02] ${
                                                        darkMode
                                                            ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20'
                                                            : 'border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                                                    }`}
                                                >
                                                    <FaArrowRight size={8} className="inline mr-1" />
                                                    {reply}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Loading indicator */}
                    {loading && (
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0">
                                <FaRobot size={14} />
                            </div>
                            <div className={`px-5 py-3 rounded-2xl border rounded-tl-sm flex items-center gap-2 ${darkMode ? 'bg-slate-800/40 border-slate-700/60 text-slate-400' : 'bg-white border-gray-200 text-slate-500 shadow-sm'}`}>
                                <FaMagic className="animate-spin text-indigo-400" size={12} />
                                <span className="text-xs font-bold">Đang xử lý...</span>
                                <div className="flex gap-1">
                                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* ─── Quick Actions & Input ──────────────────────────────────────── */}
            <div className={`px-5 py-4 border-t shrink-0 ${darkMode ? 'border-white/5 bg-slate-950/30' : 'border-gray-200 bg-white shadow-inner'}`}>
                <div className="max-w-3xl mx-auto space-y-3">
                    {/* Quick Action Chips */}
                    <div className="flex flex-wrap gap-1.5">
                        {QUICK_ACTIONS.map(action => (
                            <button
                                key={action.id}
                                onClick={() => handleQuickAction(action)}
                                disabled={loading}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all hover:scale-[1.02] ${
                                    activeQuickAction === action.id
                                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/20'
                                        : (darkMode
                                            ? 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                                            : 'border-gray-200 bg-slate-50 text-slate-600 hover:bg-slate-100')
                                }`}
                            >
                                <action.icon size={10} />
                                {action.label}
                            </button>
                        ))}
                    </div>

                    {/* Active Quick Action hint */}
                    {activeQuickAction && (
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold ${darkMode ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
                            <FaMagic size={10} />
                            {activeQuickAction === 'search' && 'Chế độ tìm kiếm — nhập nội dung cần tìm'}
                            {activeQuickAction === 'polite' && 'Chế độ sửa văn phong — nhập đoạn text cần sửa'}
                            {activeQuickAction === 'translate' && 'Chế độ dịch thuật — nhập đoạn text cần dịch'}
                            {activeQuickAction === 'summarize_link' && 'Chế độ tóm tắt link — dán URL vào'}
                            <button
                                onClick={() => setActiveQuickAction(null)}
                                className="ml-auto text-gray-400 hover:text-red-400 transition-colors"
                            >✕</button>
                        </div>
                    )}

                    {/* Input */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (activeQuickAction) {
                                handleQuickActionSend();
                            } else {
                                handleSend();
                            }
                        }}
                        className="flex items-center gap-2"
                    >
                        <input
                            type="text"
                            value={inputMsg}
                            onChange={(e) => setInputMsg(e.target.value)}
                            placeholder={getPlaceholder()}
                            disabled={loading}
                            className={`flex-1 px-4 py-3 rounded-2xl border text-sm font-medium focus:outline-none transition-all ${
                                darkMode
                                    ? 'bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500'
                                    : 'bg-slate-50 border-gray-200 text-slate-800 placeholder:text-gray-400 focus:border-indigo-500'
                            }`}
                        />
                        <button
                            type="submit"
                            disabled={loading || !inputMsg.trim()}
                            className={`p-3 rounded-2xl text-white transition-all flex items-center justify-center shrink-0 shadow-md ${
                                (loading || !inputMsg.trim())
                                    ? 'bg-gray-500/50 cursor-not-allowed opacity-50'
                                    : 'bg-indigo-600 hover:bg-indigo-500 hover:scale-95 shadow-indigo-500/20 active:scale-90'
                            }`}
                        >
                            <FaPaperPlane size={14} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default InChatAIPanel;
