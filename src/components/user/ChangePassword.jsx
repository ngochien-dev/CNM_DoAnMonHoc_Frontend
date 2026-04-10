const ChangePassword = ({ setPassForm, passForm, setIsChangingPass }) => (
    <div className="space-y-5 animate-in zoom-in-95 duration-300 bg-gradient-to-b from-white/5 to-transparent p-6 rounded-[30px] border border-white/10 shadow-inner">
        <p className="text-[11px] font-black text-white uppercase text-center tracking-[4px] opacity-60">Security Update</p>
        <div className="space-y-3">
            <input type="password" placeholder="Mật khẩu cũ" className="w-full p-4 bg-black/20 border border-white/10 rounded-xl text-sm outline-none focus:border-pink-500 text-white transition-all" 
                   onChange={e => setPassForm({...passForm, oldPassword: e.target.value})} />
            <input type="password" placeholder="Mật khẩu mới" className="w-full p-4 bg-black/20 border border-white/10 rounded-xl text-sm outline-none focus:border-pink-500 text-white transition-all" 
                   onChange={e => setPassForm({...passForm, newPassword: e.target.value})} />
            <input type="password" placeholder="Xác nhận mật khẩu" className="w-full p-4 bg-black/20 border border-white/10 rounded-xl text-sm outline-none focus:border-pink-500 text-white transition-all" 
                   onChange={e => setPassForm({...passForm, confirmPassword: e.target.value})} />
        </div>
        <div className="flex flex-col gap-2 pt-2">
            <button onClick={() => {/* handleChangePass */}} className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[2px] shadow-lg shadow-pink-500/20">Xác nhận thay đổi</button>
            <button onClick={() => setIsChangingPass(false)} className="w-full py-3 text-gray-500 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors">Hủy bỏ</button>
        </div>
    </div>
);
export default ChangePassword;