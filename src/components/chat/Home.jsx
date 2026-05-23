import React from 'react';
import { FiActivity, FiUsers, FiGlobe, FiMessageSquare, FiShield, FiCheckCircle } from 'react-icons/fi';

const Home = ({ user, onlineUsers, allGroups, onSwitchTab, darkMode }) => {
    const onlineCount = Object.keys(onlineUsers).length;
    const publicGroups = allGroups.filter(g => g.isPublic).length;

    return (
        <div className={`flex-1 p-8 overflow-y-auto scrollbar-hide animate-in fade-in duration-700 font-sans ${darkMode ? 'text-white bg-[#0f172a]' : 'text-slate-800 bg-[#f8fafc]'}`}>
            
            {/* Hero Section - Glassmorphism */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-10 shadow-lg shadow-indigo-500/20 mb-8 group">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 blur-[100px] rounded-full -mr-20 -mt-20 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/20 blur-[80px] rounded-full -ml-10 -mb-10 pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col justify-center h-full">
                    <h1 className="text-4xl font-bold mb-3 tracking-tight text-white">
                        Chào mừng trở lại, {user.displayName}
                    </h1>
                    <p className="text-indigo-100 text-[15px] font-medium opacity-90 max-w-lg leading-relaxed">
                        Kết nối, chia sẻ và làm việc hiệu quả hơn mỗi ngày. Hệ thống đã sẵn sàng hỗ trợ bạn.
                    </p>
                </div>
            </div>

            {/* Quick Access Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className={`${darkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-gray-100'} border p-6 rounded-2xl flex flex-col gap-4 shadow-sm hover:shadow-md transition-all`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'} rounded-xl flex items-center justify-center`}>
                            <FiActivity size={20} />
                        </div>
                        <h3 className={`font-semibold text-sm ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>Đang trực tuyến</h3>
                    </div>
                    <div>
                        <p className="text-3xl font-bold">{onlineCount}</p>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Tài khoản trên hệ thống</p>
                    </div>
                </div>

                <div onClick={() => onSwitchTab('friends')} className={`${darkMode ? 'bg-slate-900 border-white/10 hover:bg-slate-800' : 'bg-white border-gray-100 hover:bg-slate-50'} border p-6 rounded-2xl flex flex-col gap-4 shadow-sm hover:shadow-md transition-all cursor-pointer group`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <FiUsers size={20} />
                        </div>
                        <h3 className={`font-semibold text-sm ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>Danh bạ bạn bè</h3>
                    </div>
                    <div>
                        <p className="text-3xl font-bold">{user.friends?.length || 0}</p>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Đã kết nối</p>
                    </div>
                </div>

                <div onClick={() => onSwitchTab('discovery')} className={`${darkMode ? 'bg-slate-900 border-white/10 hover:bg-slate-800' : 'bg-white border-gray-100 hover:bg-slate-50'} border p-6 rounded-2xl flex flex-col gap-4 shadow-sm hover:shadow-md transition-all cursor-pointer group`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${darkMode ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600'} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <FiGlobe size={20} />
                        </div>
                        <h3 className={`font-semibold text-sm ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>Khám phá cộng đồng</h3>
                    </div>
                    <div>
                        <p className="text-3xl font-bold">{publicGroups}</p>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Nhóm công khai</p>
                    </div>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
                {/* Bắt đầu trò chuyện */}
                <div className={`${darkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-gray-100'} border rounded-2xl p-8 flex flex-col justify-center items-center text-center shadow-sm min-h-[220px]`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 ${darkMode ? 'bg-white/5 text-slate-400' : 'bg-slate-50 text-slate-400'}`}>
                        <FiMessageSquare size={28} />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Bắt đầu trò chuyện</h3>
                    <p className={`text-sm max-w-[250px] leading-relaxed ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>
                        Chọn một cuộc hội thoại ở menu bên trái để gửi tin nhắn hoặc gọi điện.
                    </p>
                </div>

                {/* Trạng thái hệ thống */}
                <div className={`${darkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-gray-100'} border rounded-2xl p-6 shadow-sm flex flex-col`}>
                    <h3 className="font-semibold text-[15px] mb-5 flex items-center gap-2">
                        <FiShield className="text-indigo-500" />
                        Trạng thái hệ thống
                    </h3>
                    <div className="space-y-4 flex-1 flex flex-col justify-center">
                        <div className={`flex items-start gap-4 p-4 rounded-xl border ${darkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-gray-100'}`}>
                            <FiCheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                            <div>
                                <h4 className={`text-sm font-semibold mb-1 ${darkMode ? 'text-gray-200' : 'text-slate-700'}`}>Mọi dịch vụ hoạt động ổn định</h4>
                                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>Server, Database và Socket đều trong trạng thái hoàn hảo.</p>
                            </div>
                        </div>
                        <div className={`flex items-start gap-4 p-4 rounded-xl border ${darkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-gray-100'}`}>
                            <FiCheckCircle className="text-indigo-500 shrink-0 mt-0.5" size={18} />
                            <div>
                                <h4 className={`text-sm font-semibold mb-1 ${darkMode ? 'text-gray-200' : 'text-slate-700'}`}>Mã hóa bảo mật đang bật</h4>
                                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>Tin nhắn và dữ liệu cá nhân của bạn được bảo vệ an toàn.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;