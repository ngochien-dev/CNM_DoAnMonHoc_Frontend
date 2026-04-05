import { useState } from 'react';
import axios from 'axios';
import { FaDiscord, FaUser, FaLock, FaEnvelope, FaIdCard } from 'react-icons/fa';

const AuthPage = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [form, setForm] = useState({ username: '', password: '', email: '', displayName: '', otp: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (isLogin) {
                const res = await axios.post('http://localhost:3001/api/auth/login', form);
                onLogin(res.data);
            } else {
                if (step === 1) {
                    await axios.post('http://localhost:3001/api/auth/register', form);
                    setStep(2);
                } else {
                    await axios.post('http://localhost:3001/api/auth/verify', form);
                    alert("Xác thực xong! Giờ đăng nhập nhé.");
                    setIsLogin(true); setStep(1);
                }
            }
        } catch (err) { alert(err.response?.data?.message || "Lỗi rồi!"); }
        finally { setIsLoading(false); }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-[#f2f3f5]">
            <div className="w-[450px] bg-white p-10 rounded-2xl shadow-xl">
                <FaDiscord className="mx-auto text-6xl text-[#5865f2] mb-4" />
                <h2 className="text-2xl font-bold text-center mb-6">
                    {isLogin ? 'Chào mừng trở lại!' : (step === 1 ? 'Tạo tài khoản' : 'Nhập mã OTP')}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isLogin ? (
                        <>
                            <div className="relative"><FaUser className="absolute left-3 top-3 text-gray-400" /><input type="text" placeholder="Username" className="w-full pl-10 p-2 bg-gray-100 rounded" onChange={e => setForm({...form, username: e.target.value})} /></div>
                            <div className="relative"><FaLock className="absolute left-3 top-3 text-gray-400" /><input type="password" placeholder="Password" className="w-full pl-10 p-2 bg-gray-100 rounded" onChange={e => setForm({...form, password: e.target.value})} /></div>
                        </>
                    ) : step === 1 ? (
                        <>
                            <input type="text" placeholder="Username" className="w-full p-2 bg-gray-100 rounded" onChange={e => setForm({...form, username: e.target.value})} />
                            <input type="text" placeholder="Tên hiển thị" className="w-full p-2 bg-gray-100 rounded" onChange={e => setForm({...form, displayName: e.target.value})} />
                            <input type="email" placeholder="Email" className="w-full p-2 bg-gray-100 rounded" onChange={e => setForm({...form, email: e.target.value})} />
                            <input type="password" placeholder="Password" className="w-full p-2 bg-gray-100 rounded" onChange={e => setForm({...form, password: e.target.value})} />
                        </>
                    ) : (
                        <input type="text" placeholder="OTP 6 số" className="w-full p-4 text-center text-2xl font-bold bg-gray-100 rounded" onChange={e => setForm({...form, otp: e.target.value})} />
                    )}
                    <button className="w-full py-3 bg-[#5865f2] text-white font-bold rounded-lg hover:bg-[#4752c4] transition">
                        {isLoading ? 'Chờ xíu...' : (isLogin ? 'Đăng nhập' : (step === 1 ? 'Nhận mã OTP' : 'Xác thực'))}
                    </button>
                </form>

                <p className="mt-4 text-sm text-gray-500 text-center">
                    {isLogin ? 'Chưa có nick?' : 'Có nick rồi?'} 
                    <button onClick={() => {setIsLogin(!isLogin); setStep(1)}} className="ml-1 text-blue-500 font-bold underline">
                        {isLogin ? 'Đăng ký ngay' : 'Quay lại Login'}
                    </button>
                </p>
            </div>
        </div>
    );
};
export default AuthPage;