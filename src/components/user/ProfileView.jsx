import React from "react";
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaSignOutAlt } from "react-icons/fa";

const ProfileView = ({ viewingUser, darkMode, isMe, onLogout }) => (
  <div className="space-y-4 animate-in fade-in duration-500">
    {viewingUser.bio && (
        <div className={`p-5 rounded-2xl text-sm italic text-center leading-relaxed border ${darkMode ? 'bg-slate-800/30 text-slate-300 border-slate-700/50' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
            "{viewingUser.bio}"
        </div>
    )}
    
    <div className="grid grid-cols-1 gap-3">
      <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-colors ${darkMode ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800' : 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm'}`}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
          <FaEnvelope size={18} />
        </div>
        <div className="flex flex-col min-w-0">
          <span className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Email liên hệ
          </span>
          <span className={`text-sm font-medium truncate mt-0.5 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
            {viewingUser.email}
          </span>
        </div>
      </div>
      
      <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-colors ${darkMode ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800' : 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm'}`}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
          <FaPhone size={18} />
        </div>
        <div className="flex flex-col min-w-0">
          <span className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Điện thoại
          </span>
          <span className={`text-sm font-medium truncate mt-0.5 ${viewingUser.phone ? (darkMode ? 'text-slate-200' : 'text-slate-800') : (darkMode ? 'text-slate-500 italic' : 'text-slate-400 italic')}`}>
            {viewingUser.phone || "Chưa cập nhật"}
          </span>
        </div>
      </div>
      
      <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-colors ${darkMode ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800' : 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm'}`}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${darkMode ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-50 text-rose-600'}`}>
          <FaMapMarkerAlt size={18} />
        </div>
        <div className="flex flex-col min-w-0">
          <span className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Vị trí
          </span>
          <span className={`text-sm font-medium truncate mt-0.5 ${viewingUser.address ? (darkMode ? 'text-slate-200' : 'text-slate-800') : (darkMode ? 'text-slate-500 italic' : 'text-slate-400 italic')}`}>
            {viewingUser.address || "Chưa xác định"}
          </span>
        </div>
      </div>
    </div>
    
    {isMe && (
        <div className="mt-8 pt-4 border-t border-gray-200 dark:border-white/10">
            <button
                onClick={() => onLogout?.()}
                className={`w-full p-4 rounded-2xl border text-center transition-all duration-200 flex items-center justify-center gap-2 font-bold ${darkMode ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-500 hover:text-white shadow-sm'}`}
            >
                <FaSignOutAlt size={18} />
                Đăng xuất tài khoản
            </button>
        </div>
    )}
  </div>
);

export default ProfileView;
