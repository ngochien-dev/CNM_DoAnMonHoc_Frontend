import React, { useState } from "react";
import {
  FaCircle,
  FaUserFriends,
  FaCommentDots,
  FaUsers,
  FaCrown,
  FaTimes,
  FaArrowUp,
  FaArrowDown,
  FaShieldAlt,
  FaBell,
  FaBellSlash,
  FaThumbtack,
  FaUserPlus,
  FaCog,
  FaChevronDown,
  FaChevronUp,
  FaImage,
  FaFileAlt,
  FaLink,
  FaTrash,
  FaSignOutAlt,
  FaExclamationTriangle,
  FaClock,
  FaEyeSlash,
  FaVideo,
  FaCopy,
  FaPalette,
  FaLock,
  FaSearch,
  FaEdit,
  FaVolumeMute,
  FaInfoCircle
} from "react-icons/fa";

const RightSidebar = ({
  user,
  onlineUsers,
  activeRoom,
  allGroups,
  handleOpenProfile,
  handleStartDM,
  darkMode,
  isVisible,
  handleKick,
  handleToggleRole,
  lastSeenMap,
  
  // Handlers and states
  mutedRooms = {},
  toggleMuteRoom,
  clearChatHistory,
  handleLeaveGroup,
  setShowGroupSettings,
  setShowInviteModal,
  setShowMediaGallery,
  setShowWallpaperModal,
  selfDestructTimer,
  setSelfDestructTimer,
  handleVideoCall,
  isCallBusy,
  setShowSearch,
  showSearch
}) => {
  const [expandedSections, setExpandedSections] = useState({
    chatInfo: true,
    customise: true,
    members: false,
    media: false,
    privacy: true
  });

  if (!isVisible) return null;

  const currentGroup = allGroups.find((g) => g.groupId === activeRoom?.id);
  const isDM = activeRoom?.isDM;

  // Permissions
  const isSysAdmin = user?.role === 'admin';
  const isOwner = currentGroup?.owner === user?.username;
  const isMod = currentGroup?.mods?.includes(user?.username);
  const canManage = isSysAdmin || isOwner || isMod;

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleCopyInviteLink = () => {
    const inviteLink = `${window.location.origin}/invite/${activeRoom?.id}`;
    navigator.clipboard.writeText(inviteLink);
    alert("Đã sao chép đường dẫn tham gia nhóm!");
  };

  const formatLastSeen = (isoStr) => {
    if (!isoStr) return null;
    const diff = Date.now() - new Date(isoStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Vừa mới đây';
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return `${Math.floor(hours / 24)} ngày trước`;
  };

  const getSelfDestructTimerLabel = () => {
    if (selfDestructTimer === 60) return "1 phút";
    if (selfDestructTimer === 3600) return "1 giờ";
    if (selfDestructTimer === 86400) return "1 ngày";
    return "Tắt";
  };

  // Switch to next self destruct timer option
  const handleCycleSelfDestruct = () => {
    const options = [0, 60, 3600, 86400];
    const nextIdx = (options.indexOf(selfDestructTimer) + 1) % options.length;
    setSelfDestructTimer(options[nextIdx]);
  };

  // --- HOME TAB / FRIENDS VIEW ---
  const renderFriends = () => {
    const sortedFriends = [...(user.friends || [])].sort(
      (a, b) => !!onlineUsers[b] - !!onlineUsers[a]
    );
    return (
      <div className="flex flex-col h-full space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
          <p className="text-[10px] font-black uppercase tracking-[3px] text-indigo-400 italic">
            Danh sách đồng minh ({user.friends?.length || 0})
          </p>
          <FaUserFriends className="text-indigo-500/60" size={14} />
        </div>
        <div className="flex-1 overflow-y-auto space-y-2.5 scrollbar-hide">
          {sortedFriends.map((fName) => {
            const isOnline = !!onlineUsers[fName];
            return (
              <div
                key={fName}
                className={`group flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all duration-300 ${
                  darkMode 
                    ? 'hover:bg-white/5 bg-slate-900/20 border border-white/5 hover:border-white/10' 
                    : 'hover:bg-slate-100 bg-white border border-gray-100 shadow-sm'
                } ${!isOnline && "opacity-60"}`}
              >
                <div
                  className="flex items-center gap-3 min-w-0"
                  onClick={() => handleOpenProfile(fName)}
                >
                  <div className="relative shrink-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-white shadow-md uppercase border ${
                        isOnline ? "border-emerald-500/50 bg-indigo-600" : "border-slate-600 bg-slate-700"
                      }`}
                    >
                      {onlineUsers[fName]?.avatar ? (
                        <img
                          src={onlineUsers[fName].avatar}
                          className="w-full h-full object-cover rounded-full"
                          alt=""
                        />
                      ) : (
                        fName[0]
                      )}
                    </div>
                    <FaCircle
                      className={`absolute -bottom-0.5 -right-0.5 text-[8px] border ${
                        darkMode ? "border-[#0f172a]" : "border-white"
                      } ${isOnline ? "text-emerald-500" : "text-gray-500"}`}
                    />
                  </div>
                  <div className="truncate">
                    <p className={`text-xs font-black uppercase italic tracking-tighter ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                      {onlineUsers[fName]?.displayName || fName}
                    </p>
                    <p className="text-[8px] font-bold tracking-widest text-slate-500">
                      {isOnline ? "ĐANG ONLINE" : (formatLastSeen(lastSeenMap?.[fName]) || "OFFLINE")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleStartDM(fName)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-xl transition-all"
                >
                  <FaCommentDots size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // --- MESSENGER STRUCTURED VIEW ---
  const renderChatInfo = () => {
    const isMuted = activeRoom ? !!mutedRooms[activeRoom.id] : false;
    const currentAvatar = isDM 
      ? (onlineUsers[activeRoom.name]?.avatar)
      : (currentGroup?.avatar);

    return (
      <div className="flex flex-col h-full overflow-y-auto space-y-6 scrollbar-hide pr-1">
        
        {/* Header Profile Section */}
        <div className="flex flex-col items-center pt-6 text-center space-y-3">
          <div className="relative shrink-0">
            <img
              src={currentAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeRoom.name)}&background=${isDM ? '5865f2' : 'f97316'}&color=fff&size=128`}
              className={`w-20 h-20 rounded-full object-cover border-2 shadow-sm ${
                darkMode ? 'border-slate-800 bg-slate-900' : 'border-white bg-slate-100'
              }`}
              alt="chat-avt"
            />
          </div>
          <div>
            <h3 className={`text-base font-bold leading-snug tracking-tight ${darkMode ? 'text-gray-100' : 'text-slate-900'}`}>
              {isDM ? (onlineUsers[activeRoom.name]?.displayName || activeRoom.name) : activeRoom.name}
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
              {isDM ? `@${activeRoom.name}` : `Nhóm công khai`}
            </p>
          </div>
        </div>

        {/* Circular Messenger Buttons under Profile */}
        <div className="flex items-center justify-center gap-6 py-2 border-b border-slate-700/20 pb-5">
          {/* Mute/Unmute */}
          <div className="flex flex-col items-center space-y-1">
            <button
              onClick={() => toggleMuteRoom(activeRoom.id)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                darkMode 
                  ? 'bg-white/10 hover:bg-white/20 text-gray-200' 
                  : 'bg-slate-200/80 hover:bg-slate-300/80 text-slate-700'
              }`}
              title={isMuted ? "Bật lại thông báo" : "Tắt âm thông báo"}
            >
              {isMuted ? <FaBellSlash size={14} /> : <FaBell size={14} />}
            </button>
            <span className="text-[10px] font-medium text-slate-400">
              {isMuted ? "Bật lại" : "Tắt âm"}
            </span>
          </div>

          {/* Search */}
          <div className="flex flex-col items-center space-y-1">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                showSearch 
                  ? 'bg-indigo-600 text-white' 
                  : darkMode 
                    ? 'bg-white/10 hover:bg-white/20 text-gray-200' 
                    : 'bg-slate-200/80 hover:bg-slate-300/80 text-slate-700'
              }`}
              title="Tìm kiếm cuộc hội thoại"
            >
              <FaSearch size={14} />
            </button>
            <span className="text-[10px] font-medium text-slate-400">Tìm kiếm</span>
          </div>

          {/* Video (DM) / Invite (Group) */}
          {isDM ? (
            <div className="flex flex-col items-center space-y-1">
              <button
                onClick={() => handleVideoCall()}
                disabled={isCallBusy}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isCallBusy
                    ? 'bg-white/5 text-slate-600 cursor-not-allowed'
                    : darkMode 
                      ? 'bg-white/10 hover:bg-white/20 text-gray-200 hover:scale-105' 
                      : 'bg-slate-200/80 hover:bg-slate-300/80 text-slate-700 hover:scale-105'
                }`}
                title="Gọi video"
              >
                <FaVideo size={14} />
              </button>
              <span className="text-[10px] font-medium text-slate-400">Video</span>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-1">
              <button
                onClick={() => setShowInviteModal(true)}
                disabled={!canManage}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                  !canManage
                    ? 'bg-white/5 text-slate-600 cursor-not-allowed opacity-30'
                    : darkMode 
                      ? 'bg-white/10 hover:bg-white/20 text-gray-200 hover:scale-105' 
                      : 'bg-slate-200/80 hover:bg-slate-300/80 text-slate-700 hover:scale-105'
                }`}
                title="Thêm thành viên"
              >
                <FaUserPlus size={14} />
              </button>
              <span className="text-[10px] font-medium text-slate-400">Mời người</span>
            </div>
          )}
        </div>

        {/* MESSENGER STYLE ACCORDION LIST */}
        <div className="space-y-1">
          
          {/* Section 1: Thông tin về đoạn chat */}
          <div>
            <div 
              onClick={() => toggleSection('chatInfo')}
              className="flex items-center justify-between py-3 cursor-pointer group"
            >
              <span className={`text-[12.5px] font-semibold tracking-wide ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>
                Thông tin về đoạn chat
              </span>
              <FaChevronDown 
                size={10} 
                className={`text-slate-500 transition-transform duration-200 ${expandedSections.chatInfo ? 'rotate-180' : ''}`} 
              />
            </div>
            {expandedSections.chatInfo && (
              <div className="space-y-1 pb-2">
                <div 
                  onClick={() => setShowMediaGallery(true)}
                  className={`flex items-center gap-3.5 py-2.5 px-2 rounded-xl cursor-pointer transition-colors ${
                    darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-100'
                  }`}
                >
                  <FaThumbtack size={12} className="text-slate-400" />
                  <span className={`text-[12.5px] ${darkMode ? 'text-gray-200' : 'text-slate-700'}`}>Xem tin nhắn đã ghim</span>
                </div>
                <div 
                  onClick={handleCycleSelfDestruct}
                  className={`flex items-center gap-3.5 py-2.5 px-2 rounded-xl cursor-pointer transition-colors ${
                    darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-100'
                  }`}
                >
                  <FaClock size={12} className="text-slate-400" />
                  <div className="flex-1 flex justify-between items-center pr-2">
                    <span className={`text-[12.5px] ${darkMode ? 'text-gray-200' : 'text-slate-700'}`}>Hẹn giờ tự hủy tin nhắn</span>
                    <span className="text-[11px] font-black text-orange-400 uppercase tracking-widest">{getSelfDestructTimerLabel()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Tùy chỉnh đoạn chat */}
          <div>
            <div 
              onClick={() => toggleSection('customise')}
              className="flex items-center justify-between py-3 border-t border-slate-700/10 cursor-pointer group"
            >
              <span className={`text-[12.5px] font-semibold tracking-wide ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>
                Tùy chỉnh đoạn chat
              </span>
              <FaChevronDown 
                size={10} 
                className={`text-slate-500 transition-transform duration-200 ${expandedSections.customise ? 'rotate-180' : ''}`} 
              />
            </div>
            {expandedSections.customise && (
              <div className="space-y-1 pb-2">
                {!isDM && (
                  <>
                    <div 
                      onClick={() => setShowGroupSettings(true)}
                      className={`flex items-center gap-3.5 py-2.5 px-2 rounded-xl cursor-pointer transition-colors ${
                        darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-100'
                      }`}
                    >
                      <FaEdit size={12} className="text-slate-400" />
                      <span className={`text-[12.5px] ${darkMode ? 'text-gray-200' : 'text-slate-700'}`}>Đổi tên đoạn chat</span>
                    </div>
                    <div 
                      onClick={() => setShowGroupSettings(true)}
                      className={`flex items-center gap-3.5 py-2.5 px-2 rounded-xl cursor-pointer transition-colors ${
                        darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-100'
                      }`}
                    >
                      <FaImage size={12} className="text-slate-400" />
                      <span className={`text-[12.5px] ${darkMode ? 'text-gray-200' : 'text-slate-700'}`}>Thay đổi ảnh nhóm</span>
                    </div>
                  </>
                )}
                <div 
                  onClick={() => setShowWallpaperModal(true)}
                  className={`flex items-center gap-3.5 py-2.5 px-2 rounded-xl cursor-pointer transition-colors ${
                    darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-100'
                  }`}
                >
                  <FaPalette size={12} className="text-slate-400" />
                  <span className={`text-[12.5px] ${darkMode ? 'text-gray-200' : 'text-slate-700'}`}>Đổi hình nền phòng chat</span>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Thành viên trong đoạn chat (Groups only) */}
          {!isDM && currentGroup && (
            <div>
              <div 
                onClick={() => toggleSection('members')}
                className="flex items-center justify-between py-3 border-t border-slate-700/10 cursor-pointer group"
              >
                <span className={`text-[12.5px] font-semibold tracking-wide ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>
                  Thành viên trong đoạn chat
                </span>
                <FaChevronDown 
                  size={10} 
                  className={`text-slate-500 transition-transform duration-200 ${expandedSections.members ? 'rotate-180' : ''}`} 
                />
              </div>
              {expandedSections.members && (
                <div className="space-y-3 pb-3 pt-1 pl-1">
                  {/* Copy Link Row */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/invite/${activeRoom?.id}`}
                      className={`flex-1 text-[9px] p-2.5 rounded-xl border font-bold text-slate-500 outline-none ${
                        darkMode ? 'bg-black/30 border-white/5' : 'bg-slate-50 border-gray-200'
                      }`}
                    />
                    <button
                      onClick={handleCopyInviteLink}
                      className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl flex items-center justify-center transition-all active:scale-95 shrink-0 border border-slate-700/30"
                    >
                      <FaCopy size={12} />
                    </button>
                  </div>

                  {/* List */}
                  <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-hide">
                    {currentGroup.members?.map((uname) => {
                      const isOnline = !!onlineUsers[uname];
                      const isGroupOwner = uname === currentGroup.owner;
                      const isUserMod = currentGroup?.mods?.includes(uname);
                      return (
                        <div
                          key={uname}
                          onClick={() => handleOpenProfile(uname)}
                          className={`group flex items-center justify-between p-1.5 rounded-xl cursor-pointer hover:bg-white/5 transition-all duration-200 ${!isOnline && "opacity-60"}`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative shrink-0">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-white text-xs bg-slate-700 overflow-hidden border">
                                {onlineUsers[uname]?.avatar ? (
                                  <img src={onlineUsers[uname].avatar} className="w-full h-full object-cover" alt="" />
                                ) : (
                                  uname[0]
                                )}
                              </div>
                              <FaCircle
                                className={`absolute -bottom-0.5 -right-0.5 text-[7px] border ${
                                  darkMode ? "border-[#0a0f1d]" : "border-white"
                                } ${isOnline ? "text-green-500" : "text-gray-500"}`}
                              />
                            </div>
                            <div className="truncate">
                              <p className={`text-[11px] font-semibold flex items-center gap-1 ${
                                darkMode ? 'text-gray-200' : 'text-slate-800'
                              }`}>
                                {onlineUsers[uname]?.displayName || uname}
                                {isGroupOwner && <FaCrown className="text-yellow-500 shrink-0" size={9} />}
                                {isUserMod && !isGroupOwner && <FaShieldAlt className="text-indigo-400 shrink-0" size={9} />}
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                            {user.username === currentGroup.owner && uname !== user.username && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleToggleRole(uname, isUserMod ? 'revoke' : 'grant'); }}
                                className={`p-1 rounded transition-all ${
                                  isUserMod ? 'text-orange-500 bg-orange-500/10' : 'text-emerald-500 bg-emerald-500/10'
                                }`}
                              >
                                {isUserMod ? <FaArrowDown size={8}/> : <FaArrowUp size={8}/>}
                              </button>
                            )}
                            {canManage && uname !== user.username && uname !== currentGroup.owner && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleKick(uname); }}
                                className="p-1 text-red-500 bg-red-500/10 rounded hover:bg-red-500 hover:text-white transition-all"
                              >
                                <FaTimes size={8} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 4: File phương tiện, file và liên kết */}
          <div>
            <div 
              onClick={() => toggleSection('media')}
              className="flex items-center justify-between py-3 border-t border-slate-700/10 cursor-pointer group"
            >
              <span className={`text-[12.5px] font-semibold tracking-wide ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>
                File phương tiện, file và liên kết
              </span>
              <FaChevronDown 
                size={10} 
                className={`text-slate-500 transition-transform duration-200 ${expandedSections.media ? 'rotate-180' : ''}`} 
              />
            </div>
            {expandedSections.media && (
              <div className="space-y-1 pb-2">
                <div 
                  onClick={() => setShowMediaGallery(true)}
                  className={`flex items-center gap-3.5 py-2.5 px-2 rounded-xl cursor-pointer transition-colors ${
                    darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-100'
                  }`}
                >
                  <FaImage size={12} className="text-slate-400" />
                  <span className={`text-[12.5px] ${darkMode ? 'text-gray-200' : 'text-slate-700'}`}>Ảnh / Video</span>
                </div>
                <div 
                  onClick={() => setShowMediaGallery(true)}
                  className={`flex items-center gap-3.5 py-2.5 px-2 rounded-xl cursor-pointer transition-colors ${
                    darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-100'
                  }`}
                >
                  <FaFileAlt size={12} className="text-slate-400" />
                  <span className={`text-[12.5px] ${darkMode ? 'text-gray-200' : 'text-slate-700'}`}>Tập tin / Files</span>
                </div>
                <div 
                  onClick={() => setShowMediaGallery(true)}
                  className={`flex items-center gap-3.5 py-2.5 px-2 rounded-xl cursor-pointer transition-colors ${
                    darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-100'
                  }`}
                >
                  <FaLink size={12} className="text-slate-400" />
                  <span className={`text-[12.5px] ${darkMode ? 'text-gray-200' : 'text-slate-700'}`}>Đường dẫn liên kết</span>
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Quyền riêng tư và hỗ trợ */}
          <div>
            <div 
              onClick={() => toggleSection('privacy')}
              className="flex items-center justify-between py-3 border-t border-slate-700/10 cursor-pointer group"
            >
              <span className={`text-[12.5px] font-semibold tracking-wide ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>
                Quyền riêng tư và hỗ trợ
              </span>
              <FaChevronDown 
                size={10} 
                className={`text-slate-500 transition-transform duration-200 ${expandedSections.privacy ? 'rotate-180' : ''}`} 
              />
            </div>
            {expandedSections.privacy && (
              <div className="space-y-1 pb-2">
                {/* Mute toggle option */}
                <div 
                  onClick={() => toggleMuteRoom(activeRoom.id)}
                  className={`flex items-center gap-3.5 py-2 px-2.5 rounded-xl cursor-pointer transition-colors ${
                    darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-100'
                  }`}
                >
                  <FaBell className="text-slate-400 shrink-0" size={12} />
                  <div className="flex-1 min-w-0 leading-tight">
                    <p className={`text-[12.5px] ${darkMode ? 'text-gray-200' : 'text-slate-700'}`}>Thông báo về đoạn chat</p>
                    <p className="text-[10px] text-slate-500">{isMuted ? "Tắt vô thời hạn" : "Đang bật thông báo"}</p>
                  </div>
                </div>

                {/* Hide chat option */}
                <div 
                  className={`flex items-center justify-between py-2 px-2.5 rounded-xl cursor-pointer transition-colors ${
                    darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 leading-tight">
                    <FaEyeSlash className="text-slate-400 shrink-0" size={12} />
                    <div>
                      <p className={`text-[12.5px] ${darkMode ? 'text-gray-200' : 'text-slate-700'}`}>Ẩn cuộc trò chuyện này</p>
                      <p className="text-[10px] text-slate-500">Mở lại khi có tin nhắn mới</p>
                    </div>
                  </div>
                  <button className="w-8 h-4.5 bg-slate-700 rounded-full transition-all relative border border-white/5 shrink-0">
                    <div className="absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-slate-400 rounded-full transition-all"></div>
                  </button>
                </div>

                {/* Report Option */}
                <div 
                  onClick={() => alert("Đã ghi nhận báo cáo nội dung cuộc trò chuyện.")}
                  className={`flex items-center gap-3.5 py-2.5 px-2.5 rounded-xl cursor-pointer transition-colors ${
                    darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-100'
                  }`}
                >
                  <FaExclamationTriangle size={12} className="text-slate-400" />
                  <div className="flex-1 min-w-0 leading-tight">
                    <p className={`text-[12.5px] ${darkMode ? 'text-gray-200' : 'text-slate-700'}`}>Báo cáo vi phạm</p>
                    <p className="text-[10px] text-slate-500">Báo cáo nội dung hoặc quấy rối</p>
                  </div>
                </div>

                {/* Clear chat history */}
                <div 
                  onClick={clearChatHistory}
                  className={`flex items-center gap-3.5 py-2.5 px-2.5 rounded-xl cursor-pointer transition-colors text-red-500 hover:bg-red-500/10`}
                >
                  <FaTrash size={12} className="shrink-0" />
                  <span className="text-[12.5px] font-semibold">Xóa lịch sử trò chuyện</span>
                </div>

                {/* Leave Group (Groups only) */}
                {!isDM && (
                  <div 
                    onClick={handleLeaveGroup}
                    className={`flex items-center gap-3.5 py-2.5 px-2.5 rounded-xl cursor-pointer transition-colors text-red-500 hover:bg-red-500/10`}
                  >
                    <FaSignOutAlt size={12} className="shrink-0" />
                    <span className="text-[12.5px] font-semibold">Rời khỏi nhóm</span>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

      </div>
    );
  };

  return (
    <div
      className={`w-72 border-l hidden lg:flex flex-col p-5 shrink-0 transition-all duration-500 ${
        darkMode 
          ? "border-slate-800 bg-[#1e1f22] text-white" 
          : "border-gray-200/80 bg-slate-50 text-slate-800"
      }`}
    >
      {activeRoom ? renderChatInfo() : renderFriends()}
    </div>
  );
};

export default RightSidebar;
