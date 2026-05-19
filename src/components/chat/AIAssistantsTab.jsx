import React, { useState, useEffect, useRef } from 'react';
import { 
    FaRobot, FaCode, FaLanguage, FaPenNib, FaHeartbeat, 
    FaPaperPlane, FaTrash, FaVolumeUp, FaCopy, FaUndo,
    FaRegLightbulb
} from 'react-icons/fa';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const AGENTS = [
    {
        id: 'ott',
        name: 'Trợ lý Hệ thống OTT',
        roleName: 'OTT Support & Co-pilot',
        desc: 'Giải đáp toàn bộ thông tin, tài liệu và hướng dẫn sử dụng các tính năng của ứng dụng OTT này.',
        icon: FaRobot,
        color: 'from-blue-500 to-indigo-600',
        textColor: 'text-indigo-400',
        bgColor: 'bg-indigo-500/10',
        prompts: [
            'Tính năng bảo mật mã hóa đầu cuối E2EE hoạt động như thế nào?',
            'Làm cách nào để tạo trò chuyện bí mật (Secret Chat) tự hủy tin nhắn?',
            'Làm thế nào để quản lý các phiên đăng nhập (Session) và đăng xuất từ xa?'
        ]
    },
    {
        id: 'coder',
        name: 'Chuyên gia Lập trình',
        roleName: 'Senior Software Architect',
        desc: 'Hướng dẫn lập trình, giải thích giải thuật, tối ưu hóa và phát hiện lỗi trong code.',
        icon: FaCode,
        color: 'from-emerald-400 to-teal-600',
        textColor: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        prompts: [
            'Giải thích khái niệm Closure trong Javascript kèm ví dụ',
            'Viết hàm Python để kiểm tra xem một số có phải số nguyên tố không',
            'Tối ưu hóa truy vấn SQL SELECT này...'
        ]
    },
    {
        id: 'translator',
        name: 'Dịch thuật viên',
        roleName: 'Universal Translator',
        desc: 'Dịch thuật chuẩn xác các ngôn ngữ Anh, Trung, Nhật, Hàn,... sát nghĩa và tự nhiên.',
        icon: FaLanguage,
        color: 'from-amber-400 to-orange-600',
        textColor: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        prompts: [
            'Dịch sang tiếng Anh trang trọng: "Tôi rất lấy làm tiếc vì sự chậm trễ này"',
            'Dịch đoạn văn này sang tiếng Nhật lịch sự: "Chào mừng quý khách đến cửa hàng"',
            'Giải thích thành ngữ "Break a leg" có nghĩa là gì'
        ]
    },
    {
        id: 'writer',
        name: 'Nhà sáng tạo Nội dung',
        roleName: 'Professional Copywriter',
        desc: 'Viết email công việc, soạn thảo văn bản, lên kịch bản video hoặc sáng tạo slogan cuốn hút.',
        icon: FaPenNib,
        color: 'from-purple-400 to-pink-600',
        textColor: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        prompts: [
            'Viết email gửi sếp xin nghỉ phép 2 ngày đi việc gia đình',
            'Lên dàn ý kịch bản video TikTok giới thiệu sản phẩm tai nghe chống ồn',
            'Nghĩ 5 câu slogan ấn tượng cho thương hiệu cà phê organic'
        ]
    },
    {
        id: 'health',
        name: 'Bác sĩ Sức khỏe',
        roleName: 'Wellness & Nutrition Expert',
        desc: 'Tư vấn chế độ dinh dưỡng, bài tập thể thao, cải thiện giấc ngủ và thói quen lành mạnh.',
        icon: FaHeartbeat,
        color: 'from-rose-400 to-red-600',
        textColor: 'text-rose-400',
        bgColor: 'bg-rose-500/10',
        prompts: [
            'Gợi ý thực đơn giảm cân khoa học trong 1 tuần (thâm hụt calo)',
            'Các bài tập kéo giãn cơ lưng hiệu quả cho dân văn phòng',
            'Làm thế nào để cải thiện chất lượng giấc ngủ sâu buổi tối?'
        ]
    }
];

const AIAssistantsTab = ({ darkMode }) => {
    const [selectedAgent, setSelectedAgent] = useState(AGENTS[0]);
    const [inputMsg, setInputMsg] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Load chat history from localStorage independently for each agent
    const [chatHistories, setChatHistories] = useState(() => {
        const saved = localStorage.getItem('ott_ai_chat_histories');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { return {}; }
        }
        return {};
    });

    const messagesEndRef = useRef(null);

    // Save histories to localStorage
    useEffect(() => {
        localStorage.setItem('ott_ai_chat_histories', JSON.stringify(chatHistories));
    }, [chatHistories]);

    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatHistories, selectedAgent]);

    const activeHistory = chatHistories[selectedAgent.id] || [
        {
            role: 'assistant',
            content: `Xin chào! Tôi là **${selectedAgent.name}** (${selectedAgent.roleName}). \n\n${selectedAgent.desc}\n\nHôm nay tôi có thể hỗ trợ gì cho bạn?`
        }
    ];

    const handleSend = async (textToSend) => {
        const msgText = textToSend || inputMsg;
        if (!msgText.trim() || loading) return;

        // Clear input
        if (!textToSend) setInputMsg('');

        // 1. Update UI with user message
        const updatedHistory = [
            ...activeHistory,
            { role: 'user', content: msgText }
        ];
        
        setChatHistories(prev => ({
            ...prev,
            [selectedAgent.id]: updatedHistory
        }));
        
        setLoading(true);

        try {
            // Send history to backend (exclude instructions if API handles it, but include user/assistant turns)
            const apiMessages = updatedHistory.map(h => ({
                role: h.role,
                content: h.content
            }));

            const res = await api.post('/chatbot', {
                messages: apiMessages,
                agent: selectedAgent.id
            });

            if (res.data && res.data.reply) {
                setChatHistories(prev => ({
                    ...prev,
                    [selectedAgent.id]: [
                        ...updatedHistory,
                        { role: 'assistant', content: res.data.reply }
                    ]
                }));
            } else {
                throw new Error("Không có phản hồi từ máy chủ.");
            }
        } catch (error) {
            toast.error("Trợ lý AI đang bận hoặc gặp sự cố.");
            setChatHistories(prev => ({
                ...prev,
                [selectedAgent.id]: [
                    ...updatedHistory,
                    { role: 'assistant', content: "⚠️ Có lỗi xảy ra trong quá trình xử lý thông tin. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau ít phút!" }
                ]
            }));
        } finally {
            setLoading(false);
        }
    };

    const handleClearHistory = () => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện với ${selectedAgent.name}?`)) {
            setChatHistories(prev => ({
                ...prev,
                [selectedAgent.id]: [
                    {
                        role: 'assistant',
                        content: `Xin chào! Tôi là **${selectedAgent.name}** (${selectedAgent.roleName}). \n\n${selectedAgent.desc}\n\nHôm nay tôi có thể hỗ trợ gì cho bạn?`
                    }
                ]
            }));
            toast.success("Đã xóa lịch sử trò chuyện.");
        }
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        toast.success("Đã sao chép vào bộ nhớ tạm.");
    };

    // Helper to format code blocks and bold text simply
    const renderMarkdown = (text) => {
        if (!text) return "";
        
        // Escape HTML
        let formatted = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        // Format code blocks ```code```
        formatted = formatted.replace(/```([\s\S]+?)```/g, (match, p1) => {
            return `<pre class="bg-black/30 p-4 rounded-2xl font-mono text-xs overflow-x-auto my-3 border border-white/5 whitespace-pre-wrap select-all">${p1.trim()}</pre>`;
        });

        // Format inline code `code`
        formatted = formatted.replace(/`([^`]+)`/g, '<code class="bg-black/20 px-1.5 py-0.5 rounded font-mono text-[11px] text-amber-400 select-all">$1</code>');

        // Format bold **text**
        formatted = formatted.replace(/\*\*([\s\S]+?)\*\*/g, '<strong class="font-black italic text-indigo-400">$1</strong>');

        // Format bullet points
        formatted = formatted.replace(/^\s*-\s+(.+)$/gm, '<li class="ml-4 list-disc font-semibold not-italic font-sans lowercase mb-1">$1</li>');

        // Format newlines to <br/> (except inside pre blocks)
        const parts = formatted.split(/(<pre[\s\S]*?<\/pre>)/);
        const finalHtml = parts.map(part => {
            if (part.startsWith('<pre')) return part;
            return part.replace(/\n/g, '<br/>');
        }).join('');

        return <div dangerouslySetInnerHTML={{ __html: finalHtml }} className="leading-relaxed text-sm select-text font-medium not-italic font-sans" />;
    };

    return (
        <div className="flex-1 flex h-full overflow-hidden font-black tracking-tighter uppercase italic">
            
            {/* 1. Left Sidebar of the AI Hub (Agent List) */}
            <div className={`w-80 shrink-0 border-r flex flex-col ${darkMode ? 'bg-slate-900/60 border-white/5' : 'bg-white border-gray-200'}`}>
                {/* Title */}
                <div className="p-6 border-b border-inherit shrink-0">
                    <h2 className="text-xl font-black flex items-center gap-2.5">
                        <FaRobot className="text-indigo-500 text-2xl animate-bounce" /> Trợ lý ảo AI
                    </h2>
                    <p className="text-[10px] text-gray-500 font-bold lowercase tracking-wider not-italic mt-1">Trò chuyện với các trợ lý thông minh</p>
                </div>

                {/* Agent Cards */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                    {AGENTS.map(agent => {
                        const Icon = agent.icon;
                        const isSelected = selectedAgent.id === agent.id;
                        return (
                            <div
                                key={agent.id}
                                onClick={() => setSelectedAgent(agent)}
                                className={`p-4 rounded-3xl cursor-pointer border transition-all hover:scale-[1.02] flex items-center gap-4 ${
                                    isSelected 
                                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                                        : (darkMode ? 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/60 text-slate-300' : 'bg-slate-50 border-gray-100 hover:bg-slate-100 text-slate-700')
                                }`}
                            >
                                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${agent.color} flex items-center justify-center text-white shrink-0 shadow-md`}>
                                    <Icon size={18} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-sm font-black truncate">{agent.name}</h3>
                                    <p className={`text-[9px] font-bold tracking-wider opacity-60 truncate uppercase italic`}>{agent.roleName}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 2. Main Chat Panel */}
            <div className={`flex-1 flex flex-col overflow-hidden ${darkMode ? 'bg-[#0f172a]/20' : 'bg-slate-50/30'}`}>
                
                {/* Active Agent Header */}
                <div className={`p-5 border-b shrink-0 flex items-center justify-between gap-4 ${darkMode ? 'border-white/5 bg-slate-900/20' : 'border-gray-200 bg-white shadow-sm'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${selectedAgent.color} flex items-center justify-center text-white shrink-0`}>
                            {React.createElement(selectedAgent.icon, { size: 16 })}
                        </div>
                        <div>
                            <h3 className={`text-base font-black truncate ${darkMode ? 'text-white' : 'text-slate-800'}`}>{selectedAgent.name}</h3>
                            <p className="text-[10px] text-gray-500 font-bold lowercase tracking-wider not-italic">{selectedAgent.desc}</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleClearHistory}
                        className={`p-3 rounded-2xl border transition-all ${darkMode ? 'border-white/10 hover:bg-red-500/10 text-red-400' : 'border-gray-200 hover:bg-red-50 text-red-500'}`}
                        title="Xóa lịch sử chat"
                    >
                        <FaTrash size={12} />
                    </button>
                </div>

                {/* Message Log */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    <div className="max-w-3xl mx-auto space-y-4">
                        {activeHistory.map((msg, idx) => {
                            const isMe = msg.role === 'user';
                            return (
                                <div 
                                    key={idx}
                                    className={`flex items-start gap-3.5 ${isMe ? 'flex-row-reverse' : ''} group`}
                                >
                                    {/* Avatar */}
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm ${
                                        isMe 
                                            ? 'bg-indigo-600' 
                                            : `bg-gradient-to-tr ${selectedAgent.color}`
                                    }`}>
                                        {isMe ? 'U' : React.createElement(selectedAgent.icon, { size: 14 })}
                                    </div>

                                    {/* Message bubble */}
                                    <div className="max-w-[80%] min-w-[60px]">
                                        <div className={`px-4 py-3 rounded-3xl border text-sm leading-relaxed relative ${
                                            isMe 
                                                ? 'bg-indigo-600 border-indigo-500 text-white rounded-tr-none' 
                                                : (darkMode ? 'bg-slate-800/50 border-slate-700/60 text-slate-100 rounded-tl-none' : 'bg-white border-gray-200 text-slate-800 rounded-tl-none shadow-sm')
                                        }`}>
                                            {isMe ? (
                                                <div className="whitespace-pre-wrap select-text font-semibold not-italic font-sans">{msg.content}</div>
                                            ) : (
                                                renderMarkdown(msg.content)
                                            )}

                                            {/* Action bar (hover copy) */}
                                            <div className={`absolute bottom-0.5 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5`}>
                                                <button 
                                                    onClick={() => handleCopy(msg.content)}
                                                    className="p-1 text-slate-400 hover:text-indigo-400 transition-colors"
                                                    title="Sao chép tin nhắn"
                                                >
                                                    <FaCopy size={10} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* AI Thinking/Typing Indicator */}
                        {loading && (
                            <div className="flex items-start gap-3.5">
                                <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${selectedAgent.color} flex items-center justify-center text-white shrink-0`}>
                                    {React.createElement(selectedAgent.icon, { size: 14 })}
                                </div>
                                <div className={`px-5 py-3.5 rounded-3xl border rounded-tl-none flex items-center gap-1.5 ${darkMode ? 'bg-slate-800/40 border-slate-700/60 text-slate-400' : 'bg-white border-gray-200 text-slate-500 shadow-sm'}`}>
                                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Prompt templates & Input box */}
                <div className={`p-5 border-t shrink-0 ${darkMode ? 'border-white/5 bg-slate-950/20' : 'border-gray-200 bg-white shadow-inner'}`}>
                    <div className="max-w-3xl mx-auto space-y-4">
                        
                        {/* Quick Prompt Templates */}
                        {activeHistory.length === 1 && (
                            <div className="space-y-2">
                                <p className="text-[10px] text-gray-500 font-black tracking-wider flex items-center gap-1.5">
                                    <FaRegLightbulb className="text-amber-500" /> Đề xuất câu hỏi nhanh:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {selectedAgent.prompts.map((p, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSend(p)}
                                            className={`px-3 py-2 rounded-2xl text-[10px] font-bold border transition-all text-left truncate max-w-xs hover:scale-[1.01] ${
                                                darkMode 
                                                    ? 'border-white/5 bg-slate-800/40 hover:bg-slate-800/80 text-gray-300' 
                                                    : 'border-gray-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input form */}
                        <form 
                            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                            className="flex items-center gap-3"
                        >
                            <input
                                type="text"
                                value={inputMsg}
                                onChange={(e) => setInputMsg(e.target.value)}
                                placeholder={`Hỏi ${selectedAgent.name}...`}
                                className={`flex-1 px-4 py-3 rounded-2xl border text-xs font-semibold focus:outline-none focus:border-indigo-500 transition-all ${
                                    darkMode 
                                        ? 'bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500' 
                                        : 'bg-white border-gray-200 text-slate-800 placeholder:text-gray-400'
                                }`}
                            />
                            <button
                                type="submit"
                                disabled={loading || !inputMsg.trim()}
                                className={`p-4 rounded-2xl text-white font-black transition-all flex items-center justify-center shrink-0 shadow-md ${
                                    (loading || !inputMsg.trim()) 
                                        ? 'bg-gray-500/50 cursor-not-allowed opacity-50' 
                                        : 'bg-indigo-600 hover:bg-indigo-500 hover:scale-95 shadow-indigo-500/20 active:scale-90'
                                }`}
                            >
                                <FaPaperPlane size={12} />
                            </button>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AIAssistantsTab;
