import React from "react";

const ProfileEdit = ({ editForm, setEditForm, setIsEditing, handleUpdate, darkMode }) => {
  const inputClass = `w-full p-4 rounded-xl text-sm font-medium outline-none transition-all border ${
    darkMode 
      ? 'bg-slate-800/50 border-slate-700/50 text-slate-200 focus:border-indigo-500 focus:bg-slate-800 placeholder:text-slate-600' 
      : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500 focus:bg-white placeholder:text-slate-400 shadow-sm'
  }`;

  const labelClass = `text-xs font-semibold mb-1.5 block ${darkMode ? 'text-slate-400' : 'text-slate-600'}`;

  return (
    <div className="space-y-5 animate-in slide-in-from-right duration-500">
      <div>
        <label className={labelClass}>
          Tên hiển thị
        </label>
        <input
          className={inputClass}
          value={editForm.displayName || ""}
          onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
          placeholder="Nhập tên hiển thị của bạn"
        />
      </div>

      <div>
        <label className={labelClass}>
          Vị trí
        </label>
        <input
          className={inputClass}
          placeholder="Ví dụ: TP. Hồ Chí Minh"
          value={editForm.address || ""}
          onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 gap-5">
        <div>
          <label className={labelClass}>
            Số điện thoại
          </label>
          <input
            className={inputClass}
            placeholder="Nhập số điện thoại"
            value={editForm.phone || ""}
            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>
            Tiểu sử
          </label>
          <textarea
            className={`${inputClass} h-24 resize-none`}
            placeholder="Viết vài dòng giới thiệu về bản thân..."
            value={editForm.bio || ""}
            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          onClick={handleUpdate}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl text-sm font-semibold transition-all shadow-md active:scale-[0.98]"
        >
          Lưu thay đổi
        </button>
        <button
          onClick={() => setIsEditing(false)}
          className={`flex-1 sm:flex-none sm:px-8 py-3.5 rounded-xl text-sm font-medium transition-all ${
            darkMode 
              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Hủy
        </button>
      </div>
    </div>
  );
};

export default ProfileEdit;
