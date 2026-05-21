import React from 'react';
import {
    FaUserFriends, FaGlobe, FaRobot, FaCloud, FaFolderOpen,
    FaCalendarCheck, FaPhoneAlt, FaSmileBeam, FaGamepad,
    FaArchive, FaSun, FaMoon, FaCog, FaShieldAlt, FaPlusCircle
} from 'react-icons/fa';
import api from '../../services/api';

const SidebarNav = ({
    user,
    onlineUsers,
    activeRoom,
    setActiveRoom, // Nhận prop mới
    darkMode,
    setDarkMode,
    showFriendsTab,
    setShowFriendsTab,
    showDiscoveryTab,
    setShowDiscoveryTab,
    showSocialFeed,
    setShowSocialFeed,
    showTodoTab,
    setShowTodoTab,
    showCallHistoryTab,
    setShowCallHistoryTab,
    showArchivedTab,
    setShowArchivedTab,
    showAITab,
    setShowAITab,
    showCloudDriveTab,
    setShowCloudDriveTab,
    showGameCenter,
    setShowGameCenter,
    isAdminMode,
    setIsAdminMode,
    setShowSoundSettings,
    setIsPublicGroupCreator,
    setShowGroupCreator,
    handleSwitchRoom,
    setStats,
    isCloudActive
}) => {
    return (
        <div className={`w-[72px] hidden sm:flex flex-col items-center py-3 space-y-4 shrink-0 shadow-inner z-20 ${darkMode ? 'bg-[#020617]' : 'bg-white border-r border-gray-200 shadow-sm'}`}>
            {/* 1. OTT Trang chủ */}
            <div className="group relative flex items-center justify-center w-full">
                <div onClick={() => {
                    handleSwitchRoom(null);
                    setShowTodoTab(false);
                    setShowCallHistoryTab(false);
                    setShowArchivedTab(false);
                    setShowAITab(false);
                    setShowCloudDriveTab(false);
                    setShowGameCenter(false);
                    setShowFriendsTab(false);
                    setShowDiscoveryTab(false);
                    setShowSocialFeed(false);
                    setIsAdminMode(false);
                }} className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black cursor-pointer hover:rounded-xl transition-all shadow-md ${(!activeRoom && !showFriendsTab && !showDiscoveryTab && !showSocialFeed && !showTodoTab && !showCallHistoryTab && !showArchivedTab && !showAITab && !showCloudDriveTab && !showGameCenter && !isAdminMode) ? 'bg-indigo-600 scale-110 shadow-indigo-500/50' : 'bg-gradient-to-tr from-indigo-500 to-purple-600 opacity-60 hover:opacity-100'}`}>OTT</div>
                <div className="absolute left-16 px-2.5 py-1.5 bg-slate-900/90 text-white text-[11px] font-bold rounded-lg shadow-xl opacity-0 scale-90 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 origin-left whitespace-nowrap z-50 border border-white/10">Trang chủ / Hội thoại</div>
            </div>

            {/* 2. Bạn bè */}
            <div className="group relative flex items-center justify-center w-full">
                <div onClick={() => { setShowFriendsTab(true); setShowDiscoveryTab(false); setIsAdminMode(false); setActiveRoom(null); setShowSocialFeed(false); setShowTodoTab(false); setShowCallHistoryTab(false); setShowArchivedTab(false); setShowAITab(false); setShowCloudDriveTab(false); setShowGameCenter(false); }} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all relative ${showFriendsTab ? 'bg-[#5865f2] text-white shadow-lg' : 'bg-white/5 text-gray-500 hover:bg-[#5865f2] hover:text-white'}`}>
                    <FaUserFriends size={22} />
                    {user.friendRequests?.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#1e1f22] font-black animate-bounce">{user.friendRequests.length}</span>}
                </div>
                <div className="absolute left-16 px-2.5 py-1.5 bg-slate-900/90 text-white text-[11px] font-bold rounded-lg shadow-xl opacity-0 scale-90 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 origin-left whitespace-nowrap z-50 border border-white/10">Danh sách bạn bè</div>
            </div>

            {/* 3. Khám phá */}
            <div className="group relative flex items-center justify-center w-full">
                <div onClick={() => { setShowDiscoveryTab(true); setShowFriendsTab(false); setShowSocialFeed(false); setShowGameCenter(false); setIsAdminMode(false); setActiveRoom(null); setShowTodoTab(false); setShowCallHistoryTab(false); setShowArchivedTab(false); setShowAITab(false); setShowCloudDriveTab(false); }} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all relative ${showDiscoveryTab ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white/5 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}>
                    <FaGlobe size={22} />
                </div>
                <div className="absolute left-16 px-2.5 py-1.5 bg-slate-900/90 text-white text-[11px] font-bold rounded-lg shadow-xl opacity-0 scale-90 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 origin-left whitespace-nowrap z-50 border border-white/10">Khám phá nhóm công khai</div>
            </div>

            {/* 4. Trợ lý ảo AI */}
            <div className="group relative flex items-center justify-center w-full">
                <div onClick={() => { setShowAITab(true); setShowArchivedTab(false); setShowCallHistoryTab(false); setShowTodoTab(false); setShowFriendsTab(false); setShowDiscoveryTab(false); setShowSocialFeed(false); setShowGameCenter(false); setIsAdminMode(false); setActiveRoom(null); setShowCloudDriveTab(false); }} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all relative ${showAITab ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 text-indigo-400 hover:bg-indigo-600 hover:text-white'}`}>
                    <FaRobot size={22} />
                </div>
                <div className="absolute left-16 px-2.5 py-1.5 bg-slate-900/90 text-white text-[11px] font-bold rounded-lg shadow-xl opacity-0 scale-90 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 origin-left whitespace-nowrap z-50 border border-white/10">Trợ lý ảo AI (Gemini)</div>
            </div>

            {/* 5. Cloud của tôi */}
            <div className="group relative flex items-center justify-center w-full">
                <div onClick={() => {
                    const dmId = `dm_${[user.username, user.username].sort().join("_")}`;
                    handleSwitchRoom({ id: dmId, name: user.username, isDM: true, isCloud: true });
                    setShowFriendsTab(false); setShowDiscoveryTab(false); setShowSocialFeed(false); setShowGameCenter(false); setIsAdminMode(false); setShowTodoTab(false); setShowCallHistoryTab(false); setShowArchivedTab(false); setShowAITab(false); setShowCloudDriveTab(false);
                }} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all relative ${isCloudActive ? 'bg-cyan-500 text-white shadow-lg' : 'bg-white/5 text-cyan-400 hover:bg-cyan-500 hover:text-white'}`}>
                    <FaCloud size={22} />
                </div>
                <div className="absolute left-16 px-2.5 py-1.5 bg-slate-900/90 text-white text-[11px] font-bold rounded-lg shadow-xl opacity-0 scale-90 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 origin-left whitespace-nowrap z-50 border border-white/10">Cloud của tôi (Lưu trữ cá nhân)</div>
            </div>

            {/* 6. Kho tài liệu & Quản lý File */}
            <div className="group relative flex items-center justify-center w-full">
                <div onClick={() => { setShowCloudDriveTab(true); setShowAITab(false); setShowArchivedTab(false); setShowCallHistoryTab(false); setShowTodoTab(false); setShowFriendsTab(false); setShowDiscoveryTab(false); setShowSocialFeed(false); setShowGameCenter(false); setIsAdminMode(false); setActiveRoom(null); }} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all relative ${showCloudDriveTab ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'bg-white/5 text-cyan-400 hover:bg-cyan-500 hover:text-white'}`}>
                    <FaFolderOpen size={20} />
                </div>
                <div className="absolute left-16 px-2.5 py-1.5 bg-slate-900/90 text-white text-[11px] font-bold rounded-lg shadow-xl opacity-0 scale-90 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 origin-left whitespace-nowrap z-50 border border-white/10">Kho tài liệu & Quản lý File</div>
            </div>

            {/* 7. Lịch nhắc việc */}
            <div className="group relative flex items-center justify-center w-full">
                <div onClick={() => { setShowTodoTab(true); setShowFriendsTab(false); setShowDiscoveryTab(false); setShowSocialFeed(false); setShowGameCenter(false); setIsAdminMode(false); setActiveRoom(null); setShowCallHistoryTab(false); setShowArchivedTab(false); setShowAITab(false); setShowCloudDriveTab(false); }} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all relative ${showTodoTab ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white/5 text-indigo-400 hover:bg-indigo-500 hover:text-white'}`}>
                    <FaCalendarCheck size={22} />
                </div>
                <div className="absolute left-16 px-2.5 py-1.5 bg-slate-900/90 text-white text-[11px] font-bold rounded-lg shadow-xl opacity-0 scale-90 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 origin-left whitespace-nowrap z-50 border border-white/10">Lịch nhắc việc (To-Do)</div>
            </div>

            {/* 8. Nhật ký cuộc gọi */}
            <div className="group relative flex items-center justify-center w-full">
                <div onClick={() => { setShowCallHistoryTab(true); setShowTodoTab(false); setShowFriendsTab(false); setShowDiscoveryTab(false); setShowSocialFeed(false); setShowGameCenter(false); setIsAdminMode(false); setActiveRoom(null); setShowArchivedTab(false); setShowAITab(false); setShowCloudDriveTab(false); }} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all relative ${showCallHistoryTab ? 'bg-cyan-500 text-white shadow-lg' : 'bg-white/5 text-cyan-400 hover:bg-cyan-500 hover:text-white'}`}>
                    <FaPhoneAlt size={22} />
                </div>
                <div className="absolute left-16 px-2.5 py-1.5 bg-slate-900/90 text-white text-[11px] font-bold rounded-lg shadow-xl opacity-0 scale-90 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 origin-left whitespace-nowrap z-50 border border-white/10">Nhật ký cuộc gọi</div>
            </div>

            {/* 9. Bảng tin */}
            <div className="group relative flex items-center justify-center w-full">
                <div onClick={() => { setShowSocialFeed(true); setShowFriendsTab(false); setShowDiscoveryTab(false); setShowGameCenter(false); setIsAdminMode(false); setActiveRoom(null); setShowTodoTab(false); setShowCallHistoryTab(false); setShowArchivedTab(false); setShowAITab(false); setShowCloudDriveTab(false); }} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all relative ${showSocialFeed ? 'bg-purple-500 text-white shadow-lg' : 'bg-white/5 text-purple-500 hover:bg-purple-500 hover:text-white'}`}>
                    <FaSmileBeam size={22} />
                </div>
                <div className="absolute left-16 px-2.5 py-1.5 bg-slate-900/90 text-white text-[11px] font-bold rounded-lg shadow-xl opacity-0 scale-90 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 origin-left whitespace-nowrap z-50 border border-white/10">Bảng tin Khoảnh khắc (Social Feed)</div>
            </div>

            {/* 10. Game Center */}
            <div className="group relative flex items-center justify-center w-full">
                <div onClick={() => { setShowGameCenter(true); setShowSocialFeed(false); setShowFriendsTab(false); setShowDiscoveryTab(false); setIsAdminMode(false); setActiveRoom(null); setShowCallHistoryTab(false); setShowArchivedTab(false); setShowAITab(false); setShowCloudDriveTab(false); }} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all relative ${showGameCenter ? 'bg-pink-500 text-white shadow-lg' : 'bg-white/5 text-pink-500 hover:bg-pink-500 hover:text-white'}`}>
                    <FaGamepad size={22} />
                </div>
                <div className="absolute left-16 px-2.5 py-1.5 bg-slate-900/90 text-white text-[11px] font-bold rounded-lg shadow-xl opacity-0 scale-90 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 origin-left whitespace-nowrap z-50 border border-white/10">Trung tâm Trò chơi (Game Center)</div>
            </div>

            {/* 11. Hội thoại lưu trữ */}
            <div className="group relative flex items-center justify-center w-full">
                <div onClick={() => { setShowArchivedTab(true); setShowCallHistoryTab(false); setShowTodoTab(false); setShowFriendsTab(false); setShowDiscoveryTab(false); setShowSocialFeed(false); setShowGameCenter(false); setIsAdminMode(false); setActiveRoom(null); setShowAITab(false); setShowCloudDriveTab(false); }} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all relative ${showArchivedTab ? 'bg-amber-500 text-white shadow-lg' : 'bg-white/5 text-amber-500 hover:bg-amber-500 hover:text-white'}`}>
                    <FaArchive size={20} />
                </div>
                <div className="absolute left-16 px-2.5 py-1.5 bg-slate-900/90 text-white text-[11px] font-bold rounded-lg shadow-xl opacity-0 scale-90 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 origin-left whitespace-nowrap z-50 border border-white/10">Hội thoại lưu trữ (Archived Chats)</div>
            </div>

            <div className="w-8 h-[2px] bg-gray-600 rounded-full opacity-20"></div>

            {/* 12. Sáng / Tối */}
            <div className="group relative flex items-center justify-center w-full">
                <div onClick={() => { localStorage.setItem('theme', !darkMode ? 'dark' : 'light'); setDarkMode(!darkMode); }} className="w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer bg-white/10 hover:bg-white/20 transition-all">
                    {darkMode ? <FaSun className="text-yellow-400" /> : <FaMoon />}
                </div>
                <div className="absolute left-16 px-2.5 py-1.5 bg-slate-900/90 text-white text-[11px] font-bold rounded-lg shadow-xl opacity-0 scale-90 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 origin-left whitespace-nowrap z-50 border border-white/10">Chuyển chế độ Sáng/Tối</div>
            </div>

            {/* 13. Cài đặt nhạc chuông */}
            <div className="group relative flex items-center justify-center w-full">
                <div onClick={() => setShowSoundSettings(true)} className="w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer bg-white/10 hover:bg-white/20 transition-all text-indigo-400 hover:text-white">
                    <FaCog size={20} />
                </div>
                <div className="absolute left-16 px-2.5 py-1.5 bg-slate-900/90 text-white text-[11px] font-bold rounded-lg shadow-xl opacity-0 scale-90 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 origin-left whitespace-nowrap z-50 border border-white/10">Cài đặt nhạc chuông</div>
            </div>

            {/* 14. Admin Panel */}
            {user.role === 'admin' && (
                <div className="group relative flex items-center justify-center w-full">
                    <div onClick={() => { setIsAdminMode(!isAdminMode); setShowFriendsTab(false); setShowDiscoveryTab(false); setShowTodoTab(false); setShowCallHistoryTab(false); setShowArchivedTab(false); setShowAITab(false); setShowCloudDriveTab(false); setShowSocialFeed(false); setActiveRoom(null); if (!isAdminMode) api.get('/admin/stats').then(res => setStats(res.data)); }} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all ${isAdminMode ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-red-500 shadow-lg'}`}>
                        <FaShieldAlt size={22} />
                    </div>
                    <div className="absolute left-16 px-2.5 py-1.5 bg-slate-900/90 text-white text-[11px] font-bold rounded-lg shadow-xl opacity-0 scale-90 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 origin-left whitespace-nowrap z-50 border border-white/10">Bảng quản trị Admin</div>
                </div>
            )}

            {/* 15. Tạo nhóm cộng đồng (Admin Only) */}
            {user.role === 'admin' && (
                <div className="group relative flex items-center justify-center w-full">
                    <div onClick={() => { setIsPublicGroupCreator(true); setShowGroupCreator(true); }} className="w-12 h-12 bg-[#23a559] text-white rounded-2xl flex items-center justify-center cursor-pointer hover:rounded-xl transition-all shadow-md">
                        <FaPlusCircle size={22} />
                    </div>
                    <div className="absolute left-16 px-2.5 py-1.5 bg-slate-900/90 text-white text-[11px] font-bold rounded-lg shadow-xl opacity-0 scale-90 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 origin-left whitespace-nowrap z-50 border border-white/10">Tạo nhóm cộng đồng</div>
                </div>
            )}
        </div>
    );
};

export default SidebarNav;