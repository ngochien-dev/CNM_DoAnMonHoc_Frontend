import { useState } from 'react';
import { FaUserAstronaut, FaEye, FaEyeSlash } from 'react-icons/fa';

const Login = ({ form, setForm, setView }) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="relative group">
                <input 
                    type="text" 
                    placeholder="Tên đăng nhập" 
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-purple-500 focus:bg-white/10 focus:ring-4 ring-purple-500/10 transition-all font-bold text-white placeholder-gray-500" 
                    onChange={e => setForm({...form, username: e.target.value})} 
                    required 
                />
                <FaUserAstronaut className="absolute right-4 top-5 text-gray-600 group-focus-within:text-purple-500 transition-colors" />
            </div>

            <div className="relative group">
                <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Mật khẩu" 
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-purple-500 focus:bg-white/10 focus:ring-4 ring-purple-500/10 transition-all font-bold text-white placeholder-gray-500" 
                    onChange={e => setForm({...form, password: e.target.value})} 
                    required 
                />
                {/* Nút con mắt */}
                <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-5 text-gray-600 hover:text-white focus:outline-none transition-colors"
                >
                    {showPassword ? <FaEyeSlash className="text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]" /> : <FaEye />}
                </button>
            </div>

            <div className="flex justify-start px-1">
                <button type="button" onClick={() => setView('forgot')} className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-purple-400 transition-colors">
                    Trợ giúp mật khẩu?
                </button>
            </div>
        </div>
    );
};

export default Login;