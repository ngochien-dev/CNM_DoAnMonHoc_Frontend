// frontend/src/components/user/ProfileView.jsx

import React from "react";
import { FaEnvelope, FaPhone, FaMapMarkerAlt } from "react-icons/fa";

// Hiện giao diện trang cá nhân
const ProfileView = ({ viewingUser }) => (
  <div className="space-y-4 animate-in fade-in duration-700 font-bold">
    <div className="bg-white/5 border border-white/10 p-5 rounded-[24px] text-sm italic text-gray-300 text-center leading-relaxed">
      "{viewingUser.bio || "Thành viên bí ẩn của OTT Community..."}"
    </div>
    <div className="grid grid-cols-1 gap-3">
      <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
          <FaEnvelope />
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] uppercase font-black text-gray-500 tracking-tighter">
            Email liên hệ
          </span>
          <span className="text-sm font-bold truncate">
            {viewingUser.email}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
          <FaPhone />
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] uppercase font-black text-gray-500 tracking-tighter">
            Điện thoại
          </span>
          <span className="text-sm font-bold">
            {viewingUser.phone || "Chưa cập nhật"}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
        <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center text-pink-400">
          <FaMapMarkerAlt />
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] uppercase font-black text-gray-500 tracking-tighter">
            Vị trí
          </span>
          <span className="text-sm font-bold">
            {viewingUser.address || "Chưa xác định"}
          </span>
        </div>
      </div>
    </div>
  </div>
);

export default ProfileView;
