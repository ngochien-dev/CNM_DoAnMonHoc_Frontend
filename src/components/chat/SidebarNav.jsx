import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
    FaUserFriends, FaGlobe, FaRobot, FaCloud, FaFolderOpen,
    FaCalendarCheck, FaPhoneAlt, FaSmileBeam, FaGamepad,
    FaArchive, FaSun, FaMoon, FaCog, FaShieldAlt, FaPlusCircle, FaUserSecret
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
    showStrangerTab,
    setShowStrangerTab,
    isAdminMode,
    setIsAdminMode,
    setShowSoundSettings,
    setIsPublicGroupCreator,
    setShowGroupCreator,
    handleSwitchRoom,
    setStats,
    isCloudActive
}) => {
    // State cho Portal Tooltip
    const [tooltip, setTooltip] = useState({ text: '', top: 0, visible: false });

    const showTooltip = (e, text) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltip({ text, top: rect.top + (rect.height / 2), visible: true });
    };

    const hideTooltip = () => {
        setTooltip(prev => ({ ...prev, visible: false }));
    };

    return (
        <div className={`w-[72px] hidden sm:flex flex-col items-center py-3 space-y-4 shrink-0 shadow-inner z-20 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${darkMode ? 'bg-[#020617]' : 'bg-white border-r border-gray-200 shadow-sm'}`}>
            
            {/* Global Tooltip Portal */}
            {tooltip.visible && createPortal(
                <div 
                    className="fixed left-[76px] px-2.5 py-1.5 bg-slate-900/95 text-white text-[12px] font-bold rounded-lg shadow-xl pointer-events-none z-[9999] border border-white/10"
                    style={{ top: tooltip.top, transform: 'translateY(-50%)' }}
                >
                    {tooltip.text}
                </div>,
                document.body
            )}

            {/* 1. OTT Trang chủ */}
            <div className="group relative flex items-center justify-center w-full"
                 onMouseEnter={(e) => showTooltip(e, 'Trang chủ / Hội thoại')}
                 onMouseLeave={hideTooltip}>
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
                    setShowStrangerTab(false);
                    setIsAdminMode(false);
                }} className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black cursor-pointer hover:rounded-xl transition-all shadow-md ${(!activeRoom && !showFriendsTab && !showDiscoveryTab && !showSocialFeed && !showTodoTab && !showCallHistoryTab && !showArchivedTab && !showAITab && !showCloudDriveTab && !showGameCenter && !showStrangerTab && !isAdminMode) ? 'bg-indigo-600 scale-110 shadow-indigo-500/50' : 'bg-gradient-to-tr from-indigo-500 to-purple-600 opacity-60 hover:opacity-100'}`}>OTT</div>
            </div>

            {/* 2. Bạn bè */}
            <div className="group relative flex items-center justify-center w-full"
                 onMouseEnter={(e) => showTooltip(e, 'Danh sách bạn bè')}
                 onMouseLeave={hideTooltip}>
                <div onClick={() => { setShowFriendsTab(true); setShowStrangerTab(false); setShowDiscoveryTab(false); setIsAdminMode(false); setActiveRoom(null); setShowSocialFeed(false); setShowTodoTab(false); setShowCallHistoryTab(false); setShowArchivedTab(false); setShowAITab(false); setShowCloudDriveTab(false); setShowGameCenter(false); }} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all relative ${showFriendsTab ? 'bg-[#5865f2] text-white shadow-lg' : 'bg-white/5 text-gray-500 hover:bg-[#5865f2] hover:text-white'}`}>
                    <FaUserFriends size={22} />
                    {user.friendRequests?.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#1e1f22] font-black animate-bounce">{user.friendRequests.length}</span>}
                </div>
            </div>

            {/* 3. Khám phá */}
            <div className="group relative flex items-center justify-center w-full"
                 onMouseEnter={(e) => showTooltip(e, 'Khám phá nhóm công khai')}
                 onMouseLeave={hideTooltip}>
                <div onClick={() => { setShowDiscoveryTab(true); setShowStrangerTab(false); setShowFriendsTab(false); setShowSocialFeed(false); setShowGameCenter(false); setIsAdminMode(false); setActiveRoom(null); setShowTodoTab(false); setShowCallHistoryTab(false); setShowArchivedTab(false); setShowAITab(false); setShowCloudDriveTab(false); }} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all relative ${showDiscoveryTab ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white/5 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}>
                    <FaGlobe size={22} />
                </div>
            </div>

            {/* 4. Trợ lý ảo AI */}
            <div className="group relative flex items-center justify-center w-full"
                 onMouseEnter={(e) => showTooltip(e, 'Trợ lý ảo AI (Gemini)')}
                 onMouseLeave={hideTooltip}>
                <div onClick={() => { setShowAITab(true); setShowStrangerTab(false); setShowArchivedTab(false); setShowCallHistoryTab(false); setShowTodoTab(false); setShowFriendsTab(false); setShowDiscoveryTab(false); setShowSocialFeed(false); setShowGameCenter(false); setIsAdminMode(false); setActiveRoom(null); setShowCloudDriveTab(false); }} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all relative ${showAITab ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 text-indigo-400 hover:bg-indigo-600 hover:text-white'}`}>
                    <FaRobot size={22} />
                </div>
            </div>

            {/* 5. Cloud của tôi */}
            <div className="group relative flex items-center justify-center w-full"
                 onMouseEnter={(e) => showTooltip(e, 'Cloud của tôi (Lưu trữ cá nhân)')}
                 onMouseLeave={hideTooltip}>
                <div onClick={() => {
                    const dmId = `dm_${[user.username, user.username].sort().join("_")}`;
                    handleSwitchRoom({ id: dmId, name: user.username, isDM: true, isCloud: true });
                    setShowFriendsTab(false); setShowStrangerTab(false); setShowDiscoveryTab(false); setShowSocialFeed(false); setShowGameCenter(false); setIsAdminMode(false); setShowTodoTab(false); setShowCallHistoryTab(false); setShowArchivedTab(false); setShowAITab(false); setShowCloudDriveTab(false);
                }} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all relative ${isCloudActive ? 'bg-cyan-500 text-white shadow-lg' : 'bg-white/5 text-cyan-400 hover:bg-cyan-500 hover:text-white'}`}>
                    <FaCloud size={22} />
                </div>
            </div>

            {/* 6. Kho tài liệu & Quản lý File */}
            <div className="group relative flex items-center justify-center w-full"
                 onMouseEnter={(e) => showTooltip(e, 'Kho tài liệu & Quản lý File')}
                 onMouseLeave={hideTooltip}>
                <div onClick={() => { setShowCloudDriveTab(true); setShowStrangerTab(false); setShowAITab(false); setShowArchivedTab(false); setShowCallHistoryTab(false); setShowTodoTab(false); setShowFriendsTab(false); setShowDiscoveryTab(false); setShowSocialFeed(false); setShowGameCenter(false); setIsAdminMode(false); setActiveRoom(null); }} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all relative ${showCloudDriveTab ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'bg-white/5 text-cyan-400 hover:bg-cyan-500 hover:text-white'}`}>
                    <FaFolderOpen size={20} />
                </div>
            </div>

            {/* 7. Lịch nhắc việc */}
            <div className="group relative flex items-center justify-center w-full"
                 onMouseEnter={(e) => showTooltip(e, 'Lịch nhắc việc (To-Do)')}
                 onMouseLeave={hideTooltip}>
                <div onClick={() => { setShowTodoTab(true); setShowStrangerTab(false); setShowFriendsTab(false); setShowDiscoveryTab(false); setShowSocialFeed(false); setShowGameCenter(false); setIsAdminMode(false); setActiveRoom(null); setShowCallHistoryTab(false); setShowArchivedTab(false); setShowAITab(false); setShowCloudDriveTab(false); }} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all relative ${showTodoTab ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white/5 text-indigo-400 hover:bg-indigo-500 hover:text-white'}`}>
                    <FaCalendarCheck size={22} />
                </div>
            </div>

            {/* 8. Nhật ký cuộc gọi */}
            <div className="group relative flex items-center justify-center w-full"
                 onMouseEnter={(e) => showTooltip(e, 'Nhật ký cuộc gọi')}
                 onMouseLeave={hideTooltip}>
                <div onClick={() => { setShowCallHistoryTab(true); setShowStrangerTab(false); setShowTodoTab(false); setShowFriendsTab(false); setShowDiscoveryTab(false); setShowSocialFeed(false); setShowGameCenter(false); setIsAdminMode(false); setActiveRoom(null); setShowArchivedTab(false); setShowAITab(false); setShowCloudDriveTab(false); }} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all relative ${showCallHistoryTab ? 'bg-cyan-500 text-white shadow-lg' : 'bg-white/5 text-cyan-400 hover:bg-cyan-500 hover:text-white'}`}>
                    <FaPhoneAlt size={22} />
                </div>
            </div>

            {/* 9. Bảng tin */}
            <div className="group relative flex items-center justify-center w-full"
                 onMouseEnter={(e) => showTooltip(e, 'Bảng tin Khoảnh khắc')}
                 onMouseLeave={hideTooltip}>
                <div onClick={() => { setShowSocialFeed(true); setShowStrangerTab(false); setShowFriendsTab(false); setShowDiscoveryTab(false); setShowGameCenter(false); setIsAdminMode(false); setActiveRoom(null); setShowTodoTab(false); setShowCallHistoryTab(false); setShowArchivedTab(false); setShowAITab(false); setShowCloudDriveTab(false); }} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all relative ${showSocialFeed ? 'bg-purple-500 text-white shadow-lg' : 'bg-white/5 text-purple-500 hover:bg-purple-500 hover:text-white'}`}>
                    <FaSmileBeam size={22} />
                </div>
            </div>

            {/* 10. Game Center */}
            <div className="group relative flex items-center justify-center w-full"
                 onMouseEnter={(e) => showTooltip(e, 'Trung tâm Trò chơi')}
                 onMouseLeave={hideTooltip}>
                <div onClick={() => { setShowGameCenter(true); setShowStrangerTab(false); setShowSocialFeed(false); setShowFriendsTab(false); setShowDiscoveryTab(false); setIsAdminMode(false); setActiveRoom(null); setShowCallHistoryTab(false); setShowArchivedTab(false); setShowAITab(false); setShowCloudDriveTab(false); }} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all relative ${showGameCenter ? 'bg-pink-500 text-white shadow-lg' : 'bg-white/5 text-pink-500 hover:bg-pink-500 hover:text-white'}`}>
                    <FaGamepad size={22} />
                </div>
            </div>

            {/* 11. Hội thoại lưu trữ */}
            <div className="group relative flex items-center justify-center w-full"
                 onMouseEnter={(e) => showTooltip(e, 'Hội thoại lưu trữ')}
                 onMouseLeave={hideTooltip}>
                <div onClick={() => { setShowArchivedTab(true); setShowStrangerTab(false); setShowCallHistoryTab(false); setShowTodoTab(false); setShowFriendsTab(false); setShowDiscoveryTab(false); setShowSocialFeed(false); setShowGameCenter(false); setIsAdminMode(false); setActiveRoom(null); setShowAITab(false); setShowCloudDriveTab(false); }} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all relative ${showArchivedTab ? 'bg-amber-500 text-white shadow-lg' : 'bg-white/5 text-amber-500 hover:bg-amber-500 hover:text-white'}`}>
                    <FaArchive size={20} />
                </div>
            </div>

            {/* 12. Chat Người Lạ */}
            <div className="group relative flex items-center justify-center w-full"
                 onMouseEnter={(e) => showTooltip(e, 'Chat với Người Lạ')}
                 onMouseLeave={hideTooltip}>
                <div onClick={() => { setShowStrangerTab(true); setShowArchivedTab(false); setShowCallHistoryTab(false); setShowTodoTab(false); setShowFriendsTab(false); setShowDiscoveryTab(false); setShowSocialFeed(false); setShowGameCenter(false); setIsAdminMode(false); setActiveRoom(null); setShowAITab(false); setShowCloudDriveTab(false); }} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all relative ${showStrangerTab ? 'bg-rose-500 text-white shadow-lg' : 'bg-white/5 text-rose-500 hover:bg-rose-500 hover:text-white'}`}>
                    <FaUserSecret size={22} />
                </div>
            </div>

            <div className="w-8 h-[2px] bg-gray-600 rounded-full opacity-20"></div>

            {/* 13. Cài đặt ứng dụng */}
            <div className="group relative flex items-center justify-center w-full"
                 onMouseEnter={(e) => showTooltip(e, 'Cài đặt ứng dụng')}
                 onMouseLeave={hideTooltip}>
                <div onClick={() => setShowSoundSettings(true)} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all ${darkMode ? 'bg-white/10 hover:bg-white/20 text-indigo-400 hover:text-white' : 'bg-gray-100 hover:bg-gray-200 text-slate-500 hover:text-indigo-600'}`}>
                    <FaCog size={20} />
                </div>
            </div>

            {/* 14. Admin Panel */}
            {user.role === 'admin' && (
                <div className="group relative flex items-center justify-center w-full"
                     onMouseEnter={(e) => showTooltip(e, 'Bảng quản trị Admin')}
                     onMouseLeave={hideTooltip}>
                    <div onClick={() => { setIsAdminMode(!isAdminMode); setShowFriendsTab(false); setShowStrangerTab(false); setShowDiscoveryTab(false); setShowTodoTab(false); setShowCallHistoryTab(false); setShowArchivedTab(false); setShowAITab(false); setShowCloudDriveTab(false); setShowSocialFeed(false); setActiveRoom(null); if (!isAdminMode) api.get('/admin/stats').then(res => setStats(res.data)); }} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all ${isAdminMode ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-red-500 shadow-lg'}`}>
                        <FaShieldAlt size={22} />
                    </div>
                </div>
            )}

            {/* 15. Tạo nhóm cộng đồng (Admin Only) */}
            {user.role === 'admin' && (
                <div className="group relative flex items-center justify-center w-full"
                     onMouseEnter={(e) => showTooltip(e, 'Tạo nhóm cộng đồng')}
                     onMouseLeave={hideTooltip}>
                    <div onClick={() => { setIsPublicGroupCreator(true); setShowGroupCreator(true); }} className="w-12 h-12 bg-[#23a559] text-white rounded-2xl flex items-center justify-center cursor-pointer hover:rounded-xl transition-all shadow-md">
                        <FaPlusCircle size={22} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default SidebarNav;