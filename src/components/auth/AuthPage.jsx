// import { useState } from 'react';
// import axios from 'axios';
// import { FaArrowLeft, FaShieldAlt, FaRocket } from 'react-icons/fa';
// import Login from './LoginPage';
// import Register from './Register';
// import OTPVerify from './OTPVerify';

// const AuthPage = ({ onLogin }) => {
//     const [view, setView] = useState('login'); 
//     const [isLoading, setIsLoading] = useState(false);
//     const [form, setForm] = useState({ 
//         username: '', password: '', email: '', displayName: '', otp: '', newPassword: '' 
//     });

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setIsLoading(true);
//         try {
//             if (view === 'login') {
//                 const res = await axios.post('http://localhost:3001/api/auth/login', {
//                     username: form.username, password: form.password
//                 });
//                 onLogin(res.data);
//             } else if (view === 'register') {
//                 await axios.post('http://localhost:3001/api/auth/register', form);
//                 setView('verify');
//             } else if (view === 'verify') {
//                 await axios.post('http://localhost:3001/api/auth/verify', {
//                     username: form.username, otp: form.otp
//                 });
//                 setView('login');
//             } else if (view === 'forgot') {
//                 await axios.post('http://localhost:3001/api/auth/forgot-password', { email: form.email });
//                 setView('reset');
//             } else if (view === 'reset') {
//                 await axios.post('http://localhost:3001/api/auth/reset-password', { 
//                     email: form.email, otp: form.otp, newPassword: form.newPassword 
//                 });
//                 setView('login');
//             }
//         } catch (err) {
//             alert(err.response?.data?.message || "Lỗi hệ thống!");
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <div className="min-h-screen w-full flex items-center justify-center bg-[#0f172a] relative overflow-hidden font-sans">
//             {/* Hiệu ứng nền Blur */}
//             <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/30 rounded-full blur-[120px] animate-pulse"></div>
//             <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]"></div>

//             {/* Main Card - Kính mờ */}
//             <div className="w-full max-w-[450px] mx-4 relative z-10 backdrop-blur-xl bg-white/10 border border-white/20 p-8 md:p-12 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] text-white">
                
//                 <div className="text-center mb-10">
//                     <div className="w-16 h-16 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/50 rotate-3">
//                         <FaRocket size={32} className="text-white" />
//                     </div>
//                     <h2 className="text-3xl font-black tracking-tight mb-2">
//                         {view === 'login' ? 'OTT CONNECT' : view === 'register' ? 'JOIN US' : 'SECURITY'}
//                     </h2>
//                     <p className="text-gray-400 text-sm font-medium tracking-wide uppercase italic">
//                         {view === 'login' && 'Chào mừng bạn trở lại hệ thống'}
//                         {view === 'register' && 'Khám phá không gian chat mới'}
//                         {(view === 'verify' || view === 'reset') && 'Xác thực để tiếp tục'}
//                     </p>
//                 </div>

//                 <form onSubmit={handleSubmit} className="space-y-6">
//                     {view === 'login' && <Login form={form} setForm={setForm} setView={setView} />}
//                     {view === 'register' && <Register form={form} setForm={setForm} />}
//                     {(view === 'verify' || view === 'forgot' || view === 'reset') && <OTPVerify view={view} form={form} setForm={setForm} />}

//                     <button className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-black rounded-2xl uppercase tracking-[2px] text-xs shadow-lg shadow-blue-600/30 transition-all transform active:scale-95 flex items-center justify-center gap-2 mt-4 overflow-hidden relative group">
//                         <div className="absolute inset-0 w-full h-full bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-[-20deg]"></div>
//                         {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (
//                             <><FaShieldAlt /> BẮT ĐẦU TRẢI NGHIỆM</>
//                         )}
//                     </button>
//                 </form>

//                 <div className="mt-10 text-center border-t border-white/10 pt-6">
//                     {view === 'login' ? (
//                         <div className="flex flex-col gap-3">
//                             <span className="text-xs text-gray-400">Bạn là thành viên mới?</span>
//                             <button onClick={() => setView('register')} className="text-sm font-black text-blue-400 hover:text-white transition-colors underline-offset-4 hover:underline">Tạo tài khoản ngay</button>
//                         </div>
//                     ) : (
//                         <button onClick={() => setView('login')} className="text-sm font-black text-gray-400 hover:text-white flex items-center justify-center mx-auto gap-2 transition-all">
//                             <FaArrowLeft size={10}/> QUAY LẠI ĐĂNG NHẬP
//                         </button>
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default AuthPage;

import { useState } from 'react';
import { FaArrowLeft, FaShieldAlt, FaRocket } from 'react-icons/fa';
import Login from './LoginPage';
import Register from './Register';
import OTPVerify from './OTPVerify';
import api from '../../services/api';

const AuthPage = ({ onLogin }) => {
    const [view, setView] = useState('login');
    const [isLoading, setIsLoading] = useState(false);
    const [form, setForm] = useState({
        username: '',
        password: '',
        email: '',
        displayName: '',
        otp: '',
        newPassword: '',
    });

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsLoading(true);

        try {
            if (view === 'login') {
                const response = await api.post('/auth/login', {
                    username: form.username,
                    password: form.password,
                });
                localStorage.setItem('user_session', JSON.stringify(response.data));
                onLogin(response.data);
            } else if (view === 'register') {
                await api.post('/auth/register', form);
                setView('verify');
            } else if (view === 'verify') {
                await api.post('/auth/verify', {
                    username: form.username,
                    otp: form.otp,
                });
                setView('login');
            } else if (view === 'forgot') {
                await api.post('/auth/forgot-password', { email: form.email });
                setView('reset');
            } else if (view === 'reset') {
                await api.post('/auth/reset-password', {
                    email: form.email,
                    otp: form.otp,
                    newPassword: form.newPassword,
                });
                setView('login');
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Loi he thong!');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#0f172a] relative overflow-hidden font-sans">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/30 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />

            <div className="w-full max-w-[450px] mx-4 relative z-10 backdrop-blur-xl bg-white/10 border border-white/20 p-8 md:p-12 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] text-white">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/50 rotate-3">
                        <FaRocket size={32} className="text-white" />
                    </div>
                    <h2 className="text-3xl font-black tracking-tight mb-2">
                        {view === 'login' ? 'OTT CONNECT' : view === 'register' ? 'JOIN US' : 'SECURITY'}
                    </h2>
                    <p className="text-gray-400 text-sm font-medium tracking-wide uppercase italic">
                        {view === 'login' && 'Chao mung ban tro lai he thong'}
                        {view === 'register' && 'Kham pha khong gian chat moi'}
                        {(view === 'verify' || view === 'reset') && 'Xac thuc de tiep tuc'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {view === 'login' && <Login form={form} setForm={setForm} setView={setView} />}
                    {view === 'register' && <Register form={form} setForm={setForm} />}
                    {(view === 'verify' || view === 'forgot' || view === 'reset') && (
                        <OTPVerify view={view} form={form} setForm={setForm} />
                    )}

                    <button className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-black rounded-2xl uppercase tracking-[2px] text-xs shadow-lg shadow-blue-600/30 transition-all transform active:scale-95 flex items-center justify-center gap-2 mt-4 overflow-hidden relative group">
                        <div className="absolute inset-0 w-full h-full bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-[-20deg]" />
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <FaShieldAlt /> BAT DAU TRAI NGHIEM
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-10 text-center border-t border-white/10 pt-6">
                    {view === 'login' ? (
                        <div className="flex flex-col gap-3">
                            <span className="text-xs text-gray-400">Ban la thanh vien moi?</span>
                            <button
                                type="button"
                                onClick={() => setView('register')}
                                className="text-sm font-black text-blue-400 hover:text-white transition-colors underline-offset-4 hover:underline"
                            >
                                Tao tai khoan ngay
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setView('login')}
                            className="text-sm font-black text-gray-400 hover:text-white flex items-center justify-center mx-auto gap-2 transition-all"
                        >
                            <FaArrowLeft size={10} /> QUAY LAI DANG NHAP
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthPage;