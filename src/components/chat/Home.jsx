import React from 'react';
import { FaUserFriends, FaGlobe, FaCommentDots, FaShieldAlt, FaCircle, FaInfoCircle, FaUserPlus, FaSearch, FaLightbulb } from 'react-icons/fa';

const Home = ({ user, onlineUsers, allGroups, onSwitchTab, darkMode }) => {
    const onlineCount = Object.keys(onlineUsers || {}).length;
    const publicGroups = (allGroups || []).filter(g => g.isPublic).length;

    return (
        <div className={`flex-1 p-8 overflow-y-auto scrollbar-hide animate-in fade-in zoom-in duration-500 font-sans ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
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
                <div className={`${darkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-100'} border p-6 rounded-2xl flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow`}>
                    <div className={`w-12 h-12 ${darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'} rounded-xl flex items-center justify-center`}>
                        <FaCircle className="animate-pulse" size={16}/>
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{onlineCount}</p>
                        <p className={`text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Đang hoạt động</p>
                    </div>
                </div>

                <div onClick={() => onSwitchTab('friends')} className={`${darkMode ? 'bg-gray-800/80 border-gray-700 hover:border-blue-500/50' : 'bg-white border-gray-100 hover:border-blue-300'} border p-6 rounded-2xl flex items-center gap-5 shadow-sm transition-all cursor-pointer group`}>
                    <div className={`w-12 h-12 ${darkMode ? 'bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/40' : 'bg-blue-100 text-blue-600 group-hover:bg-blue-200'} rounded-xl flex items-center justify-center transition-colors`}>
                        <FaUserFriends size={20}/>
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{user?.friends?.length || 0}</p>
                        <p className={`text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Bạn bè</p>
                    </div>
                </div>

                <div onClick={() => onSwitchTab('discovery')} className={`${darkMode ? 'bg-gray-800/80 border-gray-700 hover:border-orange-500/50' : 'bg-white border-gray-100 hover:border-orange-300'} border p-6 rounded-2xl flex items-center gap-5 shadow-sm transition-all cursor-pointer group`}>
                    <div className={`w-12 h-12 ${darkMode ? 'bg-orange-500/20 text-orange-400 group-hover:bg-orange-500/40' : 'bg-orange-100 text-orange-600 group-hover:bg-orange-200'} rounded-xl flex items-center justify-center transition-colors`}>
                        <FaGlobe size={20}/>
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{publicGroups}</p>
                        <p className={`text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Nhóm cộng đồng</p>
                    </div>
                </div>
            </div>

            {/* Gợi ý hành động */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
                <div className="space-y-4">
                    <p className={`text-xs font-bold uppercase tracking-wider ml-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Hành động nhanh</p>
                    <div className={`${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-100'} border rounded-2xl p-6 shadow-sm min-h-[180px] flex flex-col justify-between`}>
                        <div className="flex flex-col items-center text-center mb-4 mt-2">
                            <div className={`p-3 rounded-full mb-3 ${darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-500'}`}>
                                <FaCommentDots size={28} />
                            </div>
                            <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Bắt đầu một cuộc trò chuyện mới<br/>hoặc tìm kiếm bạn bè tham gia cộng đồng.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-auto">
                            <button onClick={() => onSwitchTab('friends')} className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700'}`}>
                                <FaUserPlus /> Thêm bạn bè
                            </button>
                            <button onClick={() => onSwitchTab('discovery')} className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${darkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700'}`}>
                                <FaSearch /> Khám phá
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <p className={`text-xs font-bold uppercase tracking-wider ml-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Thông tin & Tiện ích</p>
                    <div className={`${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-100'} border rounded-2xl p-6 space-y-4 shadow-sm min-h-[180px]`}>
                        <div className={`flex gap-4 p-4 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                            <div className={`p-2 h-max rounded-full shrink-0 ${darkMode ? 'bg-green-500/10 text-green-400' : 'bg-green-100 text-green-600'}`}>
                                <FaShieldAlt size={16} />
                            </div>
                            <div>
                                <p className={`text-sm font-bold mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Bảo mật đường truyền</p>
                                <p className={`text-xs leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Mọi kết nối của bạn đều được mã hóa an toàn. Hệ thống đang hoạt động cực kỳ mượt mà.</p>
                            </div>
                        </div>
                        <div className={`flex gap-4 p-4 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
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