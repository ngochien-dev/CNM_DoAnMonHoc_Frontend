import React from "react";

const ChangePassword = ({
  setPassForm,
  passForm,
  setIsChangingPass,
  handleChangePass,
  darkMode
}) => {
  const inputClass = `w-full p-4 rounded-xl text-sm font-medium outline-none transition-all border ${
    darkMode 
      ? 'bg-slate-800/50 border-slate-700/50 text-slate-200 focus:border-rose-500 focus:bg-slate-800 placeholder:text-slate-600' 
      : 'bg-white border-slate-200 text-slate-800 focus:border-rose-500 focus:bg-white placeholder:text-slate-400 shadow-sm'
  }`;

  return (
    <div className={`space-y-6 animate-in slide-in-from-right duration-500 p-6 rounded-3xl border ${darkMode ? 'bg-slate-800/30 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
      <div className="text-center">
        <p className={`text-xs font-semibold uppercase tracking-widest ${darkMode ? 'text-rose-400' : 'text-rose-600'}`}>
          Bảo mật tài khoản
        </p>
        <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Đổi mật khẩu định kỳ để bảo vệ tài khoản của bạn
        </p>
      </div>

      <div className="space-y-4">
        <input
          type="password"
          placeholder="Mật khẩu cũ"
          className={inputClass}
          value={passForm.oldPassword}
          onChange={(e) => setPassForm({ ...passForm, oldPassword: e.target.value })}
        />
        <input
          type="password"
          placeholder="Mật khẩu mới"
          className={inputClass}
          value={passForm.newPassword}
          onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
        />
        <input
          type="password"
          placeholder="Xác nhận mật khẩu mới"
          className={inputClass}
          value={passForm.confirmPassword}
          onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <button
          onClick={handleChangePass}
          className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3.5 rounded-xl text-sm font-semibold shadow-md active:scale-[0.98] transition-all"
        >
          Xác nhận đổi mật khẩu
        </button>
        <button
          onClick={() => {
            setIsChangingPass(false);
            setPassForm({
              oldPassword: "",
              newPassword: "",
              confirmPassword: "",
            });
          }}
          className={`w-full py-3.5 rounded-xl text-sm font-medium transition-all ${
            darkMode 
              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
          }`}
        >
          Hủy bỏ
        </button>
      </div>
    </div>
  );
};

export default ChangePassword;
