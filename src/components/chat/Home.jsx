import React from 'react';
import { FaRocket, FaUserFriends, FaGlobe, FaCommentDots, FaShieldAlt, FaCircle } from 'react-icons/fa';

const Home = ({ user, onlineUsers, allGroups, onSwitchTab, darkMode }) => {
    const onlineCount = Object.keys(onlineUsers).length;
    const publicGroups = allGroups.filter(g => g.isPublic).length;

    return (
        <div className={`flex-1 p-8 overflow-y-auto scrollbar-hide animate-in fade-in zoom-in duration-700 font-sans ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            {/* Banner chào mừng */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-[40px] p-10 shadow-2xl mb-10 group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full -mr-20 -mt-20 group-hover:bg-white/20 transition-all duration-700"></div>
                <div className="relative z-10">
                    <h1 className="text-5xl font-black mb-2 drop-shadow-lg tracking-tighter uppercase italic">Chào mừng, {user.displayName}!</h1>
                    <p className="text-indigo-100 text-sm tracking-[3px] font-medium opacity-90">Hệ thống OTT đã sẵn sàng cho cuộc thám hiểm hôm nay.</p>
                </div>
                <FaRocket className="absolute bottom-10 right-10 text-white/20 text-8xl -rotate-12 group-hover:scale-110 transition-transform duration-500" />
            </div>

            {/* Chỉ số nhanh */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className={`${darkMode ? 'bg-[#1e293b]/50 border-white/5' : 'bg-white border-gray-100'} border p-6 rounded-[30px] backdrop-blur-xl flex items-center gap-5 shadow-xl hover:border-indigo-500/30 transition-all`}>
                    <div className={`w-14 h-14 ${darkMode ? 'bg-emerald-500/10' : 'bg-emerald-50'} text-emerald-500 rounded-2xl flex items-center justify-center shadow-inner`}>
                        <FaCircle className="animate-pulse" size={20}/>
                    </div>
                    <div>
                        <p className="text-2xl font-black">{onlineCount}</p>
                        <p className={`text-[10px] uppercase tracking-widest font-bold ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Thực thể online</p>
                    </div>
                </div>

                <div onClick={() => onSwitchTab('friends')} className={`${darkMode ? 'bg-[#1e293b]/50 border-white/5' : 'bg-white border-gray-100'} border p-6 rounded-[30px] backdrop-blur-xl flex items-center gap-5 shadow-xl hover:border-indigo-500/30 transition-all cursor-pointer group`}>
                    <div className={`w-14 h-14 ${darkMode ? 'bg-indigo-500/10' : 'bg-indigo-50'} text-indigo-500 rounded-2xl flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-inner`}>
                        <FaUserFriends size={24}/>
                    </div>
                    <div>
                        <p className="text-2xl font-black">{user.friends?.length || 0}</p>
                        <p className={`text-[10px] uppercase tracking-widest font-bold ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Đồng minh</p>
                    </div>
                </div>

                <div onClick={() => onSwitchTab('discovery')} className={`${darkMode ? 'bg-[#1e293b]/50 border-white/5' : 'bg-white border-gray-100'} border p-6 rounded-[30px] backdrop-blur-xl flex items-center gap-5 shadow-xl hover:border-indigo-500/30 transition-all cursor-pointer group`}>
                    <div className={`w-14 h-14 ${darkMode ? 'bg-pink-500/10' : 'bg-pink-50'} text-pink-500 rounded-2xl flex items-center justify-center group-hover:bg-pink-500 group-hover:text-white transition-all shadow-inner`}>
                        <FaGlobe size={24}/>
                    </div>
                    <div>
                        <p className="text-2xl font-black">{publicGroups}</p>
                        <p className={`text-[10px] uppercase tracking-widest font-bold ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Vùng đất mở</p>
                    </div>
                </div>
            </div>

            {/* Gợi ý hành động */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
                <div className="space-y-4">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[4px] ml-2">Ghi chép hành trình</p>
                    <div className={`${darkMode ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-gray-100'} border rounded-[35px] p-8 min-h-[200px] flex flex-col justify-center items-center text-center shadow-sm`}>
                        <FaCommentDots size={40} className={`mb-4 ${darkMode ? 'text-gray-700' : 'text-slate-300'}`} />
                        <p className={`text-sm font-medium leading-relaxed ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>Chọn một cuộc hội thoại ở Sidebar bên trái<br/>để bắt đầu truyền tín hiệu.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <p className="text-[10px] font-black text-pink-400 uppercase tracking-[4px] ml-2">Thông báo hệ thống</p>
                    <div className={`${darkMode ? 'bg-white/2 border-white/5' : 'bg-white border-gray-100'} border rounded-[35px] p-6 space-y-3 shadow-inner`}>
                        <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-colors ${darkMode ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-slate-50 border-gray-100 hover:bg-slate-100'}`}>
                            <FaShieldAlt className="text-red-500 shrink-0" size={18} />
                            <span className={`text-[13px] font-semibold tracking-wide ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>Mã hóa đầu cuối đã được kích hoạt.</span>
                        </div>
                        <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-colors ${darkMode ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-slate-50 border-gray-100 hover:bg-slate-100'}`}>
                            <FaRocket className="text-orange-500 shrink-0" size={18} />
                            <span className={`text-[13px] font-semibold tracking-wide ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>Tốc độ đường truyền đạt mức tối đa.</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;