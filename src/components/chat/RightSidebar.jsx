import React from "react";
import {
  FaCircle,
  FaUserFriends,
  FaCommentDots,
  FaUsers,
  FaCrown,
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
}) => {
  // Nếu bị ẩn bởi nút thu/phóng thì không render gì cả
  if (!isVisible) return null;

  // Tìm thông tin group hiện tại nếu đang ở trong một phòng chat
  const currentGroup = allGroups.find((g) => g.groupId === activeRoom?.id);

  // --- CHẾ ĐỘ 1: HIỂN THỊ THÀNH VIÊN NHÓM ---
  const renderGroupMembers = () => {
    if (!currentGroup) return null;
    const members = currentGroup.members || [];

    return (
      <>
        <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
          <p className="text-[10px] font-black uppercase tracking-[3px] italic text-indigo-400">
            Thành viên — {members.length}
          </p>
          <FaUsers className="text-indigo-500 opacity-50" size={14} />
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide">
          {members.map((uname) => {
            const isOnline = !!onlineUsers[uname];
            const isOwner = uname === currentGroup.owner;
            return (
              <div
                key={uname}
                onClick={() => handleOpenProfile(uname)}
                className={`group flex items-center justify-between p-2 rounded-2xl cursor-pointer transition-all hover:bg-white/5 ${!isOnline && "opacity-50"}`}
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
                      className={`absolute -bottom-0.5 -right-0.5 text-[10px] border-2 ${darkMode ? "border-[#0f172a]" : "border-white"} ${isOnline ? "text-emerald-500" : "text-gray-500"}`}
                    />
                  </div>
                  <div className="truncate">
                    <p className="text-[11px] font-black uppercase italic tracking-tighter flex items-center gap-1">
                      {onlineUsers[uname]?.displayName || uname}
                      {isOwner && (
                        <FaCrown
                          className="text-yellow-500"
                          size={10}
                          title="Chủ vùng đất"
                        />
                      )}
                    </p>
                    <p className="text-[7px] font-bold text-gray-600 tracking-widest">
                      {isOnline ? "ĐANG HIỆN DIỆN" : "VẮNG MẶT"}
                    </p>
                  </div>
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
        <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
          <p className="text-[10px] font-black uppercase tracking-[3px] italic text-gray-500">
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
                className={`group flex items-center justify-between p-2 rounded-2xl cursor-pointer transition-all hover:bg-white/5 ${!isOnline && "opacity-60"}`}
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
                      className={`absolute -bottom-0.5 -right-0.5 text-[10px] border-2 ${darkMode ? "border-[#0f172a]" : "border-white"} ${isOnline ? "text-emerald-500" : "text-gray-500"}`}
                    />
                  </div>
                  <div className="truncate">
                    <p className="text-[11px] font-black uppercase italic tracking-tighter">
                      {onlineUsers[fName]?.displayName || fName}
                    </p>
                    <p className="text-[7px] font-bold text-gray-600 tracking-widest">
                      {isOnline ? "VỪA MỚI ĐÂY" : "ĐANG NGỦ"}
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
      className={`w-64 border-l border-white/5 hidden lg:flex flex-col p-5 shrink-0 transition-all duration-500 ${darkMode ? "bg-[#0f172a]/30 backdrop-blur-xl" : "bg-[#f2f3f5]"}`}
    >
      {activeRoom ? renderGroupMembers() : renderFriends()}
    </div>
  );
};

export default RightSidebar;
