import React from 'react';
import {
    FaChevronLeft, FaCloud, FaVideo,
    FaLock, FaSignOutAlt, FaCog, FaUserPlus,
    FaChevronRight, FaUsers, FaUserCheck, FaTimes
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const ChatHeader = ({
    activeRoom,
    darkMode,
    isCloudActive,
    onlineUsers,
    currentGroup,
    isCallBusy,
    showSearch,
    setShowSearch,
    setShowGlobalSearch,
    currentWallpaper,
    setShowWallpaperModal,
    isSecretMode,
    secretChatStatus,
    setIsSecretMode,
    setSecretChatStatus,
    setSecretChatRequester,
    setMessages,
    sharedE2EEKey,
    user,
    isMember,
    handleLeaveGroup,
    isAdminOfGroup,
    isModOfGroup,
    setShowGroupSettings,
    setShowInviteModal,
    toggleMuteRoom,
    mutedRooms,
    clearChatHistory,
    isRightSidebarVisible,
    setIsRightSidebarVisible,
    handleApprove,
    handleVideoCall,
    handleGroupVideoCall,
    isInGroupCall,
    isSidebarVisible,
    setIsSidebarVisible,
    setShowMediaGallery,
    socket
}) => {
    return (
        <>
            <div className={`h-12 flex items-center justify-between px-6 shrink-0 shadow-sm font-black backdrop-blur-md uppercase italic tracking-tighter border-b ${darkMode ? 'border-white/5 bg-white/2' : 'border-gray-200 bg-white/80'}`}>
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsSidebarVisible(!isSidebarVisible)} className="p-1 hover:bg-black/5 rounded text-indigo-500 transition-all active:scale-90"><FaChevronLeft size={16} className={!isSidebarVisible ? 'rotate-180' : ''} /></button>
                    {activeRoom.isDM ? (
                        isCloudActive ? (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-500 flex items-center justify-center text-white text-xs font-black overflow-hidden border border-cyan-400/20 shrink-0 shadow-inner">
                                <FaCloud size={14} className="animate-pulse text-cyan-100" />
                            </div>
                        ) : (
                            <div className="w-7 h-7 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-400 text-xs font-black overflow-hidden border border-indigo-500/10 shrink-0 shadow-inner">
                                {onlineUsers[activeRoom.name]?.avatar ? (
                                    <img src={onlineUsers[activeRoom.name].avatar} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    activeRoom.name.substring(0, 2).toUpperCase()
                                )}
                            </div>
                        )
                    ) : (
                        <div className="w-7 h-7 rounded-lg bg-orange-600/20 flex items-center justify-center text-orange-400 text-xs font-black overflow-hidden border border-orange-500/10 shrink-0 shadow-inner">
                            {currentGroup?.avatar ? (
                                <img src={currentGroup.avatar} className="w-full h-full object-cover" alt="" />
                            ) : (
                                activeRoom.name.substring(0, 2).toUpperCase()
                            )}
                        </div>
                    )}
                    {activeRoom.isDM ? (
                        isCloudActive ? <span className="text-cyan-400 text-sm tracking-wide font-extrabold normal-case">☁ Cloud của tôi</span> : <span className="text-indigo-400 text-sm">@ {activeRoom.name}</span>
                    ) : <span className="text-sm"># {activeRoom.name}</span>}
                </div>
                <div className="flex items-center gap-4">
                    {/* Nút gọi video: DM dùng call 1-1, group dùng group call */}
                    {!isCloudActive && (
                        <button
                            onClick={() => {
                                console.groupCollapsed('[GroupCall][ChatHeader] CLICK video button');
                                console.debug('activeRoom:', activeRoom);
                                console.debug('isDM:', activeRoom?.isDM);
                                console.debug('isCloudActive:', isCloudActive);
                                console.debug('isCallBusy:', isCallBusy);
                                console.debug('isInGroupCall:', isInGroupCall);
                                console.debug('isMember:', isMember);
                                console.groupEnd();

                                if (activeRoom.isDM) {
                                    handleVideoCall?.();
                                } else {
                                    handleGroupVideoCall?.();
                                }
                            }}
                            disabled={isCallBusy || isInGroupCall || (!activeRoom.isDM && !isMember)}
                            className={`p-1.5 rounded-lg transition-all ${
                                isCallBusy || isInGroupCall || (!activeRoom.isDM && !isMember)
                                    ? 'text-gray-600 cursor-not-allowed'
                                    : activeRoom.isDM
                                        ? 'text-cyan-400 hover:bg-cyan-500/10'
                                        : 'text-emerald-400 hover:bg-emerald-500/10'
                            }`}
                            title={
                                activeRoom.isDM
                                    ? 'Gọi video'
                                    : isInGroupCall
                                        ? 'Đang trong cuộc gọi nhóm'
                                        : 'Gọi video nhóm'
                            }
                        >
                            <FaVideo size={18} />
                        </button>
                    )}

                    {/* Secret Chat Toggle (DMs only) */}
                    {activeRoom.isDM && (
                        <button
                            onClick={() => {
                                if (isSecretMode || secretChatStatus !== 'idle') {
                                    socket.emit('close_secret_chat', { roomId: activeRoom.id });
                                    setIsSecretMode(false);
                                    setSecretChatStatus('idle');
                                    setSecretChatRequester(null);
                                    setMessages(prev => prev.filter(m => !(m.roomId === activeRoom.id && m.isSecret)));
                                    toast("Đã đóng cuộc trò chuyện bí mật.");
                                } else {
                                    if (!sharedE2EEKey) {
                                        alert("Đối phương chưa kích hoạt E2EE. Vui lòng chờ họ trực tuyến để thiết lập kết nối an sau!");
                                        return;
                                    }
                                    socket.emit('request_secret_chat', { roomId: activeRoom.id, senderUsername: user.username });
                                    setSecretChatStatus('waiting');
                                    toast("Đã gửi lời mời Chat Bí Mật tới đối phương...");
                                }
                            }}
                            className={`p-1.5 rounded-lg transition-all ${secretChatStatus === 'established' ? 'text-red-500 bg-red-500/10 hover:bg-red-500/20' :
                                    secretChatStatus === 'waiting' ? 'text-yellow-500 bg-yellow-500/10 animate-pulse' :
                                        secretChatStatus === 'requested' ? 'text-blue-500 bg-blue-500/10 animate-bounce' :
                                            'text-gray-500 hover:text-red-400 bg-white/5'
                                }`}
                            title={
                                secretChatStatus === 'established' ? "Thoát Chat bí mật" :
                                    secretChatStatus === 'waiting' ? "Đang đợi phản hồi..." :
                                        secretChatStatus === 'requested' ? "Lời mời chat bí mật mới!" :
                                            "Bật Chat bí mật (Không lưu Server)"
                            }
                        >
                            <FaLock size={18} />
                        </button>
                    )}

                    {isMember && !activeRoom.isDM && currentGroup?.owner !== user.username && (
                        <button onClick={handleLeaveGroup} className="text-gray-500 hover:text-red-500 transition-all bg-white/5 hover:bg-red-500/10 p-1.5 rounded-lg" title="Rời nhóm">
                            <FaSignOutAlt size={18} />
                        </button>
                    )}

                    {(isAdminOfGroup || isModOfGroup) && !activeRoom.isDM && (<button onClick={() => setShowGroupSettings(true)} className="text-gray-500 hover:text-white transition-all bg-white/5 p-1.5 rounded-lg" title="Cài đặt"><FaCog size={18} /></button>)}
                    {/* P1: Invite to group button */}
                    {isMember && !activeRoom.isDM && (
                        <button onClick={() => setShowInviteModal(true)} className="text-gray-500 hover:text-emerald-400 transition-all bg-white/5 p-1.5 rounded-lg" title="Mời thành viên"><FaUserPlus size={18} /></button>
                    )}
                    <button onClick={() => setIsRightSidebarVisible(!isRightSidebarVisible)} className={`p-1.5 rounded-lg transition-all ${isRightSidebarVisible ? 'text-indigo-500 bg-indigo-500/10' : 'text-gray-500 hover:text-white bg-white/5'}`}>{isRightSidebarVisible ? <FaChevronRight size={18} /> : <FaUsers size={18} />}</button>
                </div>
            </div>

            {/* Pending requests bar */}
            {(isAdminOfGroup || isModOfGroup) && currentGroup?.pendingRequests?.length > 0 && (
                <div className="bg-indigo-600/90 backdrop-blur-md text-white px-6 py-3 flex items-center justify-between animate-in slide-in-from-top duration-500 shadow-xl z-10 border-b border-white/10">
                    <div className="flex items-center gap-3 font-black uppercase text-[10px] italic tracking-widest"><FaUserPlus className="animate-bounce" /> {currentGroup.pendingRequests.filter(un => un !== user.username).length} YÊU CẦU GIA NHẬP</div>
                    <div className="flex gap-2 overflow-x-auto py-1 max-w-[60%] scrollbar-hide">
                        {currentGroup.pendingRequests.map(uname => {
                            if (uname === user.username) return null;
                            return (
                                <div key={uname} className="bg-black/40 px-3 py-1.5 rounded-full flex items-center gap-3 border border-white/10 shrink-0 shadow-inner group">
                                    <span className="text-[10px] font-black italic">@{uname}</span>
                                    <div className="flex gap-1">
                                        <button onClick={() => handleApprove(currentGroup.groupId, uname, 'accept')} className="bg-emerald-500 p-1.5 rounded-lg hover:scale-110 shadow-lg transition-all"><FaUserCheck size={10} /></button>
                                        <button onClick={() => handleApprove(currentGroup.groupId, uname, 'reject')} className="bg-red-500 p-1.5 rounded-lg hover:scale-110 shadow-lg transition-all"><FaTimes size={10} /></button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatHeader;
