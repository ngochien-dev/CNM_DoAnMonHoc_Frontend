const OTPVerify = ({ view, form, setForm }) => {
    if (view === 'forgot') {
        return (
            <div className="animate-in fade-in duration-500 space-y-4">
                <p className="text-xs text-center text-gray-400 px-4">Nhập email đã đăng ký để nhận mã khôi phục</p>
                <input 
                    type="email" placeholder="Email của bạn..." 
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none font-bold text-center focus:border-purple-500 text-white" 
                    onChange={e => setForm({...form, email: e.target.value})} required 
                />
            </div>
        );
    }

    if (view === 'reset') {
        return (
            <div className="space-y-4 animate-in slide-in-from-bottom duration-500">
                <input 
                    type="text" placeholder="Mã OTP" 
                    className="w-full p-4 bg-white/10 border-2 border-purple-500/30 rounded-2xl text-center text-2xl font-black tracking-[10px] outline-none text-white focus:bg-white/20" 
                    onChange={e => setForm({...form, otp: e.target.value})} required 
                />
                <input 
                    type="password" placeholder="Mật khẩu mới" 
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none font-bold text-white focus:border-purple-500" 
                    onChange={e => setForm({...form, newPassword: e.target.value})} required 
                />
            </div>
        );
    }

    return (
        <div className="text-center animate-in zoom-in duration-500">
            <div className="text-4xl mb-4">📩</div>
            <p className="text-[10px] font-black text-purple-400 uppercase tracking-[3px] mb-6">Xác thực mã OTP</p>
            <input 
                type="text" placeholder="••••••" 
                className="w-full p-5 bg-white/5 border-2 border-white/10 rounded-[24px] text-center text-4xl font-black tracking-[15px] outline-none focus:border-blue-500 text-white transition-all shadow-inner" 
                onChange={e => setForm({...form, otp: e.target.value})} required 
            />
        </div>
    );
};

export default OTPVerify;