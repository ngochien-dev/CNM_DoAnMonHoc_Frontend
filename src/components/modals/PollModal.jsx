import React, { useState } from 'react';
import { FaPoll, FaTimes } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const PollModal = ({ isOpen, onClose, socket, user, activeRoom, darkMode }) => {
    const [pollQuestion, setPollQuestion] = useState("");
    const [pollOptions, setPollOptions] = useState(["", ""]);

    if (!isOpen) return null;

    const handleCreatePoll = () => {
        if (!pollQuestion.trim() || pollOptions.some(o => !o.trim())) {
            toast.error("Vui lòng điền đủ câu hỏi và các lựa chọn!");
            return;
        }
        socket.emit('send_message', { 
            sender: user.displayName, 
            senderUsername: user.username, 
            msgType: 'poll',
            text: 'Bình chọn mới: ' + pollQuestion,
            pollData: { question: pollQuestion, options: pollOptions.map(opt => ({ text: opt, votes: [] })) },
            roomId: activeRoom.id, 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        });
        setPollQuestion("");
        setPollOptions(["", ""]);
        onClose();
        toast.success("Đã tạo bình chọn!");
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[500] backdrop-blur-sm animate-in zoom-in-95 p-4">
            <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${darkMode ? 'bg-slate-900 border border-white/10' : 'bg-white'}`}>
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-emerald-600 text-white">
                    <h3 className="font-bold uppercase text-sm flex items-center gap-2"><FaPoll/> Tạo Bình Chọn</h3>
                    <button onClick={onClose} className="hover:text-red-300 transition-colors"><FaTimes /></button>
                </div>
                <div className="p-6 space-y-4">
                    <input 
                        value={pollQuestion} 
                        onChange={e => setPollQuestion(e.target.value)} 
                        placeholder="Câu hỏi bình chọn..." 
                        className={`w-full p-3 rounded-xl border font-bold ${darkMode ? 'bg-black/20 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-slate-800'}`} 
                    />
                    {pollOptions.map((opt, i) => (
                        <div key={i} className="flex gap-2">
                            <input 
                                value={opt} 
                                onChange={e => { 
                                    const newOpts = [...pollOptions]; 
                                    newOpts[i] = e.target.value; 
                                    setPollOptions(newOpts); 
                                }} 
                                placeholder={`Lựa chọn ${i + 1}`} 
                                className={`w-full p-3 rounded-xl border text-sm ${darkMode ? 'bg-black/20 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-slate-800'}`} 
                            />
                            {pollOptions.length > 2 && (
                                <button 
                                    onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))} 
                                    className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl"
                                >
                                    <FaTimes/>
                                </button>
                            )}
                        </div>
                    ))}
                    <button 
                        onClick={() => setPollOptions([...pollOptions, ""])} 
                        className="text-emerald-500 text-sm font-bold uppercase hover:underline"
                    >
                        + Thêm lựa chọn
                    </button>
                    <button 
                        onClick={handleCreatePoll} 
                        className="w-full py-3 bg-emerald-600 text-white font-black uppercase tracking-widest rounded-xl shadow-lg mt-4 hover:bg-emerald-500 transition-all"
                    >
                        Tạo bình chọn
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PollModal;
