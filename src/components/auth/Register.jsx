import { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Register = ({ form, setForm }) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="grid grid-cols-1 gap-4 animate-in slide-in-from-bottom-4 duration-500">
            <input 
                type="text" placeholder="Username" 
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-blue-500 font-bold text-white transition-all" 
                onChange={e => setForm({...form, username: e.target.value})} required 
            />
            <input 
                type="text" placeholder="Nickname" 
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-blue-500 font-bold text-white transition-all" 
                onChange={e => setForm({...form, displayName: e.target.value})} required 
            />
            <input 
                type="email" placeholder="Địa chỉ Email" 
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-blue-500 font-bold text-white transition-all" 
                onChange={e => setForm({...form, email: e.target.value})} required 
            />
            
            <div className="relative group">
                <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Mật khẩu" 
                    className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-blue-500 font-bold text-white transition-all" 
                    onChange={e => setForm({...form, password: e.target.value})} required 
                />
                <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-4 text-gray-600 hover:text-white transition-colors"
                >
                    {showPassword ? <FaEyeSlash className="text-blue-400" /> : <FaEye />}
                </button>
            </div>
        </div>
    );
};

export default Register;