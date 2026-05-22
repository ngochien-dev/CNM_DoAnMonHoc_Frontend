import React from 'react';
import { FaUserFriends, FaGlobe, FaCommentDots, FaShieldAlt, FaCircle, FaInfoCircle, FaUserPlus, FaSearch, FaLightbulb, FaRocket } from 'react-icons/fa';

const Home = ({ user, onlineUsers, allGroups, onSwitchTab, darkMode }) => {
    const onlineCount = Object.keys(onlineUsers || {}).length;
    const publicGroups = (allGroups || []).filter(g => g.isPublic).length;

    return (
        <div className={`flex-1 p-8 overflow-y-auto scrollbar-hide animate-in fade-in zoom-in duration-700 font-sans ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            {/* Banner chào mừng */}
            <div className={`relative overflow-hidden ${darkMode ? 'bg-gradient-to-r from-blue-900 to-indigo-900' : 'bg-gradient-to-r from-blue-600 to-indigo-600'} rounded-2xl p-10 shadow-lg mb-8`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[60px] rounded-full -mr-20 -mt-20"></div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold mb-2 text-white">Chào mừng, {user?.displayName || 'bạn'}! 👋</h1>
                    <p className="text-blue-100 text-sm font-medium opacity-90">Rất vui được gặp lại bạn. Hãy bắt đầu kết nối với mọi người nhé!</p>
                </div>
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
                        <p className="text-2xl font-black">{user?.friends?.length || 0}</p>
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
                    {/* Chọn hội thoại */}
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[4px] ml-2">Ghi chép hành trình</p>
                    <div className={`${darkMode ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-gray-100'} border rounded-[35px] p-8 min-h-[200px] flex flex-col justify-center items-center text-center shadow-sm`}>
                        <FaCommentDots size={40} className={`mb-4 ${darkMode ? 'text-gray-700' : 'text-slate-300'}`} />
                        <p className={`text-sm font-medium leading-relaxed ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>Chọn một cuộc hội thoại ở Sidebar bên trái<br/>để bắt đầu truyền tín hiệu.</p>
                    </div>

                    {/* Hành động nhanh */}
                    <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[4px] ml-2">Hành động nhanh</p>
                    <div className={`${darkMode ? 'bg-[#1e293b]/50 border-white/5' : 'bg-white border-gray-100'} border rounded-[35px] p-8 backdrop-blur-xl flex flex-col justify-between shadow-xl min-h-[180px]`}>
                        <div className="flex flex-col items-center text-center mb-4 mt-2">
                            <div className={`p-3 rounded-2xl mb-3 ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-500'}`}>
                                <FaCommentDots size={28} />
                            </div>
                            <p className={`text-sm font-medium leading-relaxed ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Bắt đầu một cuộc trò chuyện mới<br/>hoặc tìm kiếm bạn bè tham gia cộng đồng.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-auto">
                            <button onClick={() => onSwitchTab('friends')} className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95 ${darkMode ? 'bg-slate-800/80 hover:bg-slate-700 text-indigo-400 border border-indigo-500/20' : 'bg-slate-100 hover:bg-slate-200 border border-gray-200 text-indigo-600'}`}>
                                <FaUserPlus /> Thêm bạn bè
                            </button>
                            <button onClick={() => onSwitchTab('discovery')} className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95 ${darkMode ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20' : 'bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-700'}`}>
                                <FaSearch /> Khám phá
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <p className="text-[10px] font-black text-pink-400 uppercase tracking-[4px] ml-2">Thông báo hệ thống</p>
                    <div className={`${darkMode ? 'bg-white/2 border-white/5' : 'bg-white border-gray-100'} border rounded-[35px] p-6 space-y-3 shadow-inner`}>
                        <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-colors ${darkMode ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-slate-50 border-gray-100 hover:bg-slate-100'}`}>
                            <FaShieldAlt className="text-red-500 shrink-0" size={18} />
                            <span className={`text-[13px] font-semibold tracking-wide ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>Kết nối bảo mật đã được kích hoạt.</span>
                        </div>
                        <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-colors ${darkMode ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-slate-50 border-gray-100 hover:bg-slate-100'}`}>
                            <FaRocket className="text-orange-500 shrink-0" size={18} />
                            <span className={`text-[13px] font-semibold tracking-wide ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>Tốc độ đường truyền đạt mức tối đa.</span>
                        </div>
                    </div>

                    <p className="text-[10px] font-black text-pink-400 uppercase tracking-[4px] ml-2">Thông tin & Tiện ích</p>
                    <div className={`${darkMode ? 'bg-black/20 border-white/5' : 'bg-white border-gray-100'} border rounded-[35px] p-6 space-y-4 shadow-sm min-h-[180px]`}>
                        <div className={`flex gap-4 p-4 rounded-2xl border ${darkMode ? 'bg-[#1e293b]/50 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                            <div className={`p-2 h-max rounded-full shrink-0 ${darkMode ? 'bg-green-500/10 text-green-400' : 'bg-green-100 text-green-600'}`}>
                                <FaShieldAlt size={16} />
                            </div>
                            <div>
                                <p className={`text-sm font-bold mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Bảo mật đường truyền</p>
                                <p className={`text-xs leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Mọi kết nối của bạn đều được mã hóa an toàn. Hệ thống đang hoạt động cực kỳ mượt mà.</p>
                            </div>
                        </div>
                        <div className={`flex gap-4 p-4 rounded-2xl border ${darkMode ? 'bg-[#1e293b]/50 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                            <div className={`p-2 h-max rounded-full shrink-0 ${darkMode ? 'bg-yellow-500/10 text-yellow-500' : 'bg-yellow-100 text-yellow-600'}`}>
                                <FaLightbulb size={16} />
                            </div>
                            <div>
                                <p className={`text-sm font-bold mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Mẹo nhỏ cho bạn</p>
                                <p className={`text-xs leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Sử dụng thanh tìm kiếm phía trên để tra cứu nhanh tin nhắn, nhóm chat hoặc mọi người.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;