import React, { useState, useEffect, useRef } from 'react';
import { FaUserSecret, FaSearch, FaStop, FaPaperPlane, FaTimes } from 'react-icons/fa';
import { getSocket } from '../../services/socket';
import toast from 'react-hot-toast';

const StrangerChatTab = ({ darkMode, user }) => {
    const [status, setStatus] = useState('idle'); // 'idle', 'finding', 'chatting'
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);
    const socket = getSocket();

    useEffect(() => {
        if (!socket) return;

        const handleMatched = ({ roomId }) => {
            setStatus('chatting');
            setMessages([]);
            toast.success('Đã kết nối với một người lạ!');
        };

        const handleReceiveMessage = (msg) => {
            setMessages(prev => [...prev, msg]);
        };

        const handleStrangerLeft = () => {
            setStatus('idle');
            setMessages(prev => [...prev, { _id: Date.now().toString(), isSystem: true, content: 'Người lạ đã ngắt kết nối.' }]);
            toast('Người lạ đã thoát.', { icon: '👋' });
        };

        socket.on('stranger_matched', handleMatched);
        socket.on('receive_stranger_message', handleReceiveMessage);
        socket.on('stranger_left', handleStrangerLeft);

        return () => {
            socket.off('stranger_matched', handleMatched);
            socket.off('receive_stranger_message', handleReceiveMessage);
            socket.off('stranger_left', handleStrangerLeft);
            socket.emit('skip_stranger');
        };
    }, [socket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleFindStranger = () => {
        setStatus('finding');
        setMessages([]);
        socket.emit('find_stranger', { username: user.username });
    };

    const handleSkip = () => {
        socket.emit('skip_stranger');
        setStatus('idle');
        setMessages([]);
    };

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim() || status !== 'chatting') return;
        
        const newMsg = {
            _id: Date.now().toString(),
            sender_id: user.username,
            content: input.trim(),
            created_at: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, newMsg]);
        socket.emit('stranger_message', { content: input.trim() });
        setInput('');
    };

    return (
        <div className={`flex flex-col h-full w-full ${darkMode ? 'bg-[#0f172a] text-white' : 'bg-slate-50 text-slate-800'}`}>
            {/* Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b shadow-sm ${darkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-rose-500 rounded-xl text-white shadow-lg shadow-rose-500/30">
                        <FaUserSecret size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Chat với Người Lạ</h2>
                        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Nhắn tin ẩn danh, dữ liệu không được lưu trữ</p>
                    </div>
                </div>
                {status === 'chatting' && (
                    <button onClick={handleSkip} className="flex items-center space-x-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors text-sm font-semibold text-slate-700 dark:text-slate-200">
                        <FaStop />
                        <span>Kết thúc</span>
                    </button>
                )}
            </div>

            {/* Main Area */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col relative">
                {status === 'idle' && (
                    <div className="m-auto flex flex-col items-center justify-center text-center space-y-6 max-w-md">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-rose-400 to-orange-400 p-1 flex items-center justify-center animate-bounce shadow-2xl shadow-rose-500/20">
                            <FaUserSecret size={60} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black mb-2">Gặp gỡ một ai đó</h3>
                            <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Chia sẻ câu chuyện của bạn một cách hoàn toàn ẩn danh. Khi kết thúc, mọi dữ liệu sẽ bị xóa vĩnh viễn.</p>
                        </div>
                        <button onClick={handleFindStranger} className="flex items-center space-x-2 px-8 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-rose-500/30 transition-all hover:scale-105 active:scale-95">
                            <FaSearch />
                            <span>Tìm Người Lạ</span>
                        </button>
                    </div>
                )}

                {status === 'finding' && (
                    <div className="m-auto flex flex-col items-center justify-center text-center space-y-6">
                        <div className="relative w-32 h-32 flex items-center justify-center">
                            <div className="absolute inset-0 border-4 border-rose-500 rounded-full animate-ping opacity-75"></div>
                            <div className="w-24 h-24 bg-rose-500 rounded-full flex items-center justify-center shadow-lg shadow-rose-500/50">
                                <FaSearch size={40} className="text-white animate-pulse" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold animate-pulse">Đang tìm kiếm...</h3>
                        <button onClick={handleSkip} className="px-6 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-full transition-colors text-sm font-semibold">
                            Hủy tìm kiếm
                        </button>
                    </div>
                )}

                {status === 'chatting' && (
                    <div className="flex flex-col space-y-4">
                        <div className="text-center py-4">
                            <span className="px-4 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold rounded-full border border-green-200 dark:border-green-800/50">
                                Đã kết nối với một Người lạ
                            </span>
                        </div>
                        {messages.map((msg) => {
                            if (msg.isSystem) {
                                return (
                                    <div key={msg._id} className="text-center py-2">
                                        <span className="px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs rounded-full">
                                            {msg.content}
                                        </span>
                                    </div>
                                );
                            }

                            const isMe = msg.sender_id === user.username;
                            return (
                                <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl ${isMe ? 'bg-rose-500 text-white rounded-tr-sm' : `${darkMode ? 'bg-[#1e293b] text-slate-200' : 'bg-white text-slate-800 shadow-sm border border-slate-100'} rounded-tl-sm`}`}>
                                        <p className="text-[15px] whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area */}
            {status === 'chatting' && (
                <div className={`p-4 border-t ${darkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200'}`}>
                    <form onSubmit={handleSend} className="flex items-center space-x-2">
                        <button type="button" onClick={handleSkip} className={`p-3 rounded-xl transition-colors shrink-0 ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'}`} title="Bỏ qua / Tìm người mới">
                            <FaTimes />
                        </button>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Nhập tin nhắn..."
                            className={`flex-1 px-4 py-3 rounded-xl outline-none transition-colors ${darkMode ? 'bg-[#0f172a] focus:bg-transparent text-white' : 'bg-slate-100 focus:bg-slate-50 text-slate-800 border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20'}`}
                            autoFocus
                        />
                        <button type="submit" disabled={!input.trim()} className={`p-3 rounded-xl flex items-center justify-center transition-all shrink-0 ${input.trim() ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/30' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}`}>
                            <FaPaperPlane />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default StrangerChatTab;
