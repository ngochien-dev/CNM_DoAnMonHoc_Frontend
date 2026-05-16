import React, { useState } from 'react';
import { FaGlobe, FaLock, FaTimes } from 'react-icons/fa';

const CreateChat = ({ user, isOpen, onClose, onCreateGroup, darkMode }) => {
    // State local để quản lý việc chọn loại nhóm bên trong Modal
    const [isPublic, setIsPublic] = useState(false);
    const [isChannel, setIsChannel] = useState(false);
    const [groupName, setGroupName] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!groupName.trim()) return;
        onCreateGroup(groupName, isPublic, isChannel);
        setGroupName('');
        setIsPublic(false);
        setIsChannel(false);
    };

    return (
        <div className="fixed inset-0 bg-[#020617]/80 flex items-center justify-center z-[300] backdrop-blur-md p-4 animate-in zoom-in-95">
            <div className={`w-[420px] rounded-[40px] p-10 shadow-2xl border ${darkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-gray-100 text-slate-800'}`}>
                
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter text-indigo-500 underline underline-offset-8">Khai mở vũ trụ</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition-colors">
                        <FaTimes size={24}/>
                    </button>
                </div>
                
                <div className="flex gap-4 mb-4">
                    <div 
                        onClick={() => user.role === 'admin' && setIsPublic(true)} 
                        className={`flex-1 p-5 rounded-[25px] border-2 transition-all text-center ${isPublic ? 'border-indigo-500 bg-indigo-500/10' : (darkMode ? 'border-white/5 opacity-20 ' : 'border-gray-200 opacity-50 bg-slate-50 ') + (user.role !== 'admin' ? 'cursor-not-allowed' : 'cursor-pointer')}`}
                    >
                        <FaGlobe className="mx-auto mb-2 text-2xl text-indigo-500"/>
                        <p className="text-[10px] font-black uppercase">Công cộng</p>
                    </div>

                    <div 
                        onClick={() => setIsPublic(false)} 
                        className={`flex-1 p-5 rounded-[25px] border-2 cursor-pointer transition-all text-center ${!isPublic ? 'border-orange-500 bg-orange-500/10' : (darkMode ? 'border-white/5 opacity-40' : 'border-gray-200 opacity-60 bg-slate-50')}`}
                    >
                        <FaLock className="mx-auto mb-2 text-xl text-orange-500"/>
                        <p className="text-[10px] font-black uppercase">Riêng tư</p>
                    </div>
                </div>

                {/* P2: Channel Toggle */}
                <div 
                    onClick={() => setIsChannel(!isChannel)}
                    className={`flex items-center justify-between p-4 rounded-2xl mb-8 border-2 cursor-pointer transition-all ${isChannel ? 'border-purple-500 bg-purple-500/10' : 'border-white/5 opacity-60'}`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${isChannel ? 'bg-purple-500 text-white' : 'bg-white/10 text-gray-500'}`}><FaHashtag/></div>
                        <div className="text-left">
                            <p className="text-[10px] font-black uppercase tracking-widest">Kênh truyền thông</p>
                            <p className="text-[8px] italic opacity-60">Chỉ admin được gửi tin nhắn</p>
                        </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 ${isChannel ? 'border-purple-500 bg-purple-500' : 'border-gray-600'}`}></div>
                </div>

                <input 
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className={`w-full border p-5 rounded-2xl mb-8 outline-none font-black text-center text-lg focus:border-indigo-500 transition-all ${darkMode ? 'bg-white/5 border-white/10 placeholder:text-gray-700' : 'bg-white border-gray-200 placeholder:text-slate-400'}`} 
                    placeholder="TÊN VŨ TRỤ..."
                />

                {/* Nút xác nhận */}
                <button 
                    onClick={handleSubmit}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-5 rounded-[25px] font-black shadow-2xl uppercase tracking-[3px] text-xs hover:scale-[1.02] transition-all active:scale-95"
                >
                    KHỞI TẠO VÙNG ĐẤT
                </button>
            </div>
        </div>
    );
};

export default CreateChat;