import React from "react";
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
}) => {
  // Nếu bị ẩn bởi nút thu/phóng thì không render gì cả
  if (!isVisible) return null;

  // Tìm thông tin group hiện tại nếu đang ở trong một phòng chat
  const currentGroup = allGroups.find((g) => g.groupId === activeRoom?.id);

  // Quyền quản trị trong nhóm
  const isSysAdmin = user?.role === 'admin';
  const isOwner = currentGroup?.owner === user?.username;
  const isMod = currentGroup?.mods?.includes(user?.username);
  const canManage = isSysAdmin || isOwner || isMod;

  // P1: Format last seen time relative to now
  const formatLastSeen = (isoStr) => {
    if (!isoStr) return null;
    const diff = Date.now() - new Date(isoStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Vừa mới đây';
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  };

  // --- CHẾ ĐỘ 1: HIỂN THỊ THÀNH VIÊN NHÓM ---
  const renderGroupMembers = () => {
    if (!currentGroup) return null;
    const members = currentGroup.members || [];

    return (
      <>
        <div className={`flex items-center justify-between mb-6 border-b pb-4 ${darkMode ? 'border-white/5' : 'border-gray-200'}`}>
          <p className={`text-[10px] font-black uppercase tracking-[3px] italic ${darkMode ? 'text-indigo-400' : 'text-indigo-500'}`}>
            Thành viên — {members.length}
          </p>
          <FaUsers className="text-indigo-500 opacity-50" size={14} />
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide">
          {members.map((uname) => {
            const isOnline = !!onlineUsers[uname];
            const isOwner = uname === currentGroup.owner;
            const isUserMod = currentGroup?.mods?.includes(uname);
            return (
              <div
                key={uname}
                onClick={() => handleOpenProfile(uname)}
                className={`group flex items-center justify-between p-2 rounded-2xl cursor-pointer transition-all ${darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-100'} ${!isOnline && "opacity-50"}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shadow-lg uppercase border-2 ${isOnline ? "border-emerald-500/50 bg-indigo-600" : "border-transparent bg-slate-700"}`}
                    >
                      {onlineUsers[uname]?.avatar ? (
                        <img
                          src={onlineUsers[uname].avatar}
                          className="w-full h-full object-cover"
                          alt=""
                        />
                      ) : (
                        uname[0]
                      )}
                    </div>
                    <FaCircle
                      className={`absolute -bottom-0.5 -right-0.5 text-[10px] border-2 ${darkMode ? "border-[#0f172a]" : "border-white"} ${isOnline ? "text-emerald-500" : "text-gray-400"}`}
                    />
                  </div>
                  <div className="truncate">
                    <p className={`text-[11px] font-black uppercase italic tracking-tighter flex items-center gap-1 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                      {onlineUsers[uname]?.displayName || uname}
                      {isOwner && (
                        <FaCrown
                          className="text-yellow-500"
                          size={10}
                          title="Chủ vùng đất"
                        />
                      )}
                      {isUserMod && !isOwner && (
                        <FaShieldAlt
                          className="text-indigo-400"
                          size={10}
                          title="Phó nhóm (MOD)"
                        />
                      )}
                    </p>
                    <p className={`text-[7px] font-bold tracking-widest ${darkMode ? 'text-gray-600' : 'text-slate-400'}`}>
                      {isOnline ? "ĐANG HIỆN DIỆN" : (formatLastSeen(lastSeenMap?.[uname]) || "VẮNG MẶT")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  {user.username === currentGroup.owner && uname !== user.username && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleRole(uname, isUserMod ? 'revoke' : 'grant'); }}
                      className={`p-2 rounded-lg transition-all transform hover:scale-125 ${isUserMod ? 'text-orange-500 hover:text-orange-400 bg-orange-500/10' : 'text-emerald-500 hover:text-emerald-400 bg-emerald-500/10'}`}
                      title={isUserMod ? "Giáng chức" : "Thăng cấp MOD"}
                    >
                      {isUserMod ? <FaArrowDown size={12}/> : <FaArrowUp size={12}/>}
                    </button>
                  )}
                  {canManage && uname !== user.username && uname !== currentGroup.owner && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleKick(uname); }}
                      className="p-2 text-red-500 hover:text-red-400 transition-all transform hover:scale-125 bg-red-500/10 rounded-lg"
                      title="Đuổi khỏi nhóm"
                    >
                      <FaTimes size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  // --- CHẾ ĐỘ 2: HIỂN THỊ BẠN BÈ (TRANG HOME) ---
  const renderFriends = () => {
    const sortedFriends = [...(user.friends || [])].sort(
      (a, b) => !!onlineUsers[b] - !!onlineUsers[a],
    );
    return (
      <>
        <div className={`flex items-center justify-between mb-6 border-b pb-4 ${darkMode ? 'border-white/5' : 'border-gray-200'}`}>
          <p className={`text-[10px] font-black uppercase tracking-[3px] italic ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
            Đồng minh — {user.friends?.length || 0}
          </p>
          <FaUserFriends className="text-indigo-500 opacity-50" size={14} />
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide">
          {sortedFriends.map((fName) => {
            const isOnline = !!onlineUsers[fName];
            return (
              <div
                key={fName}
                className={`group flex items-center justify-between p-2 rounded-2xl cursor-pointer transition-all ${darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-100'} ${!isOnline && "opacity-60"}`}
              >
                <div
                  className="flex items-center gap-3 min-w-0"
                  onClick={() => handleOpenProfile(fName)}
                >
                  <div className="relative shrink-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shadow-lg uppercase border-2 ${isOnline ? "border-emerald-500/50 bg-indigo-600" : "border-transparent bg-slate-700"}`}
                    >
                      {onlineUsers[fName]?.avatar ? (
                        <img
                          src={onlineUsers[fName].avatar}
                          className="w-full h-full object-cover"
                          alt=""
                        />
                      ) : (
                        fName[0]
                      )}
                    </div>
                    <FaCircle
                      className={`absolute -bottom-0.5 -right-0.5 text-[10px] border-2 ${darkMode ? "border-[#0f172a]" : "border-white"} ${isOnline ? "text-emerald-500" : "text-gray-400"}`}
                    />
                  </div>
                  <div className="truncate">
                    <p className={`text-[11px] font-black uppercase italic tracking-tighter ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                      {onlineUsers[fName]?.displayName || fName}
                    </p>
                    <p className={`text-[7px] font-bold tracking-widest ${darkMode ? 'text-gray-600' : 'text-slate-400'}`}>
                      {isOnline ? "VỪA MỚI ĐÂY" : (formatLastSeen(lastSeenMap?.[fName]) || "ĐANG NGỦ")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleStartDM(fName)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-indigo-400 hover:text-indigo-300 transition-all transform hover:scale-125"
                >
                  <FaCommentDots size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <div
      className={`w-64 border-l hidden lg:flex flex-col p-5 shrink-0 transition-all duration-500 ${darkMode ? "border-white/5 bg-[#0f172a]/30 backdrop-blur-xl" : "border-gray-200 bg-slate-50"}`}
    >
      {activeRoom ? renderGroupMembers() : renderFriends()}
    </div>
  );
};

export default RightSidebar;
