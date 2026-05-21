import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const JoinGroupPage = ({ user }) => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
    const [errorMessage, setErrorMessage] = useState('');
    const darkMode = localStorage.getItem('theme') === 'dark';

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setErrorMessage('Thiếu mã mời nhóm!');
            return;
        }

        if (!user) {
            // Lưu lại token và chuyển hướng tới màn hình đăng nhập
            localStorage.setItem('pending_invite_token', token);
            toast.loading("Vui lòng đăng nhập để gia nhập nhóm...", { id: "invite_login_toast", duration: 3000 });
            setTimeout(() => {
                navigate('/');
            }, 1500);
            return;
        }

        // Thực hiện tham gia nhóm
        const joinGroup = async () => {
            try {
                const response = await api.post('/groups/join-by-invite', { token });
                if (response.data && response.data.joined === false) {
                    setStatus('pending_approval');
                    toast.success("Đã gửi yêu cầu gia nhập nhóm!");
                } else {
                    setStatus('success');
                    toast.success("Tham gia nhóm thành công!");
                    
                    // Tự động chuyển hướng tới phòng chat vừa tham gia sau 1.5 giây
                    setTimeout(() => {
                        navigate(`/chat?roomId=${response.data.groupId}`);
                    }, 1500);
                }
            } catch (error) {
                setStatus('error');
                setErrorMessage(error.response?.data?.error || "Không thể gia nhập nhóm. Vui lòng thử lại!");
                toast.error(error.response?.data?.error || "Lỗi tham gia nhóm!");
            }
        };

        joinGroup();
    }, [token, user, navigate]);

    return (
        <div className={`fixed inset-0 flex items-center justify-center p-4 font-sans ${darkMode ? 'bg-[#0f172a] text-[#dbdee1]' : 'bg-[#f8fafc] text-slate-800'}`}>
            <div className={`w-full max-w-md p-8 rounded-[30px] border shadow-2xl text-center backdrop-blur-md transition-all duration-300 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                {/* Background decorative glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-indigo-500 rounded-[30px] blur opacity-15 pointer-events-none"></div>
                
                {status === 'loading' && (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                        <FaSpinner className="w-12 h-12 text-indigo-500 animate-spin" />
                        <h2 className="text-xl font-black uppercase tracking-wider">Đang xử lý mã mời</h2>
                        <p className="text-sm opacity-60">Hệ thống đang xác thực liên kết mời của bạn...</p>
                    </div>
                )}

                {status === 'pending_approval' && (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in zoom-in-95">
                        <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-inner">
                            <FaSpinner className="w-8 h-8 animate-spin" />
                        </div>
                        <h2 className="text-xl font-black uppercase tracking-wider text-amber-500">Đang chờ duyệt</h2>
                        <p className="text-sm opacity-80 font-bold">Yêu cầu gia nhập nhóm của bạn đã được gửi.</p>
                        <p className="text-xs opacity-60 max-w-xs mx-auto">Chủ nhóm hoặc Phó nhóm cần phê duyệt yêu cầu này trước khi bạn có thể vào phòng chat.</p>
                        
                        <button 
                            onClick={() => navigate('/')} 
                            className="mt-6 px-6 py-3 bg-gradient-to-r from-orange-500 to-indigo-500 hover:from-orange-600 hover:to-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg active:scale-95"
                        >
                            Trở về trang chủ
                        </button>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in zoom-in-95">
                        <FaCheckCircle className="w-16 h-16 text-emerald-500 animate-bounce" />
                        <h2 className="text-xl font-black uppercase tracking-wider text-emerald-500">Thành công!</h2>
                        <p className="text-sm opacity-80 font-bold">Bạn đã gia nhập vũ trụ nhóm chat thành công.</p>
                        <p className="text-xs opacity-50">Đang chuyển hướng bạn đến phòng chat...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in zoom-in-95">
                        <FaExclamationTriangle className="w-16 h-16 text-red-500 animate-pulse" />
                        <h2 className="text-xl font-black uppercase tracking-wider text-red-500">Có lỗi xảy ra</h2>
                        <p className="text-sm text-red-400 font-bold max-w-xs">{errorMessage}</p>
                        
                        <button 
                            onClick={() => navigate('/')} 
                            className="mt-4 px-6 py-3 bg-gradient-to-r from-orange-500 to-indigo-500 hover:from-orange-600 hover:to-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg active:scale-95"
                        >
                            Trở về trang chủ
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JoinGroupPage;
