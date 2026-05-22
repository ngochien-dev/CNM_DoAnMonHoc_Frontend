import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaUserEdit, FaCamera, FaShieldAlt, FaCommentDots, FaUserPlus, FaUserMinus, FaLock, FaVideo, FaMobileAlt, FaDesktop, FaTrash, FaUserCircle, FaHistory } from 'react-icons/fa';
import ProfileView from './ProfileView';
import ProfileEdit from './ProfileEdit';
import ChangePassword from './ChangePassword';
import api from '../../services/api';
import useCall from '../../context/useCall';

const UserProfileModal = ({ isOpen, onClose, targetUsername, currentUser, onStartDM, darkMode }) => {
    const [viewingUser, setViewingUser] = useState(null);
    const [activeTab, setActiveTab] = useState('view'); // 'view', 'edit', 'security', 'sessions'
    const [sessions, setSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [passForm, setPassForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [myInfo, setMyInfo] = useState(null);
    const fileRef = useRef();
    const { startCall, isCallBusy } = useCall();

    const handleUpdate = async () => {
        try {
            const res = await api.post('/users/update', {
                username: currentUser.username,
                displayName: editForm.displayName,
                phone: editForm.phone,
                bio: editForm.bio,
                address: editForm.address,
                avatar: editForm.avatar,
            });
            alert('Cập nhật thành công!');
            setViewingUser(res.data);
            setActiveTab('view');
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi cập nhật!');
        }
    };

    const handleChangePass = async () => {
        const { oldPassword, newPassword, confirmPassword } = passForm;
        if (!oldPassword || !newPassword || !confirmPassword) return alert('Vui lòng nhập đầy đủ mật khẩu!');
        if (newPassword !== confirmPassword) return alert('Mật khẩu xác nhận không khớp!');
        if (newPassword.length < 6) return alert('Mật khẩu mới phải từ 6 ký tự trở lên!');

        try {
            await api.post('/auth/change-password', { username: currentUser.username, oldPassword, newPassword });
            alert('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
            localStorage.removeItem('user_session');
            window.location.reload();
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi đổi mật khẩu!');
        }
    };

    const fetchActiveSessions = async () => {
        setLoadingSessions(true);
        try {
            const res = await api.get('/users/active-sessions');
            setSessions(res.data || []);
        } catch (err) {
            console.error("Lỗi lấy danh sách phiên:", err);
        } finally {
            setLoadingSessions(false);
        }
    };

    const handleTerminateSession = async (sessId) => {
        if (!window.confirm("Bạn có chắc chắn muốn đăng xuất thiết bị này từ xa?")) return;
        try {
            await api.post('/users/terminate-session', { sessionId: sessId });
            setSessions(prev => prev.filter(s => s.sessionId !== sessId));
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi khi đăng xuất thiết bị!");
        }
    };

    const handleTerminateOtherSessions = async () => {
        if (!window.confirm("Đăng xuất khỏi tất cả các thiết bị khác?")) return;
        try {
            const currentSess = JSON.parse(localStorage.getItem('user_session') || '{}');
            const otherSessions = sessions.filter(s => s.sessionId !== currentSess?.sessionId);
            for (const s of otherSessions) {
                await api.post('/users/terminate-session', { sessionId: s.sessionId });
            }
            alert("Đã đăng xuất thành công tất cả các thiết bị khác!");
            fetchActiveSessions();
        } catch (err) {
            alert("Lỗi khi đăng xuất các thiết bị!");
        }
    };

    const handleToggle2FA = async (enabled) => {
        try {
            await api.post('/users/toggle-2fa', { username: currentUser.username, enabled });
            setViewingUser(prev => ({ ...prev, is2FAEnabled: enabled }));
            alert(`Đã ${enabled ? 'bật' : 'tắt'} bảo mật 2 lớp thành công!`);
        } catch (err) {
            alert('Lỗi khi thiết lập 2FA');
        }
    };

    useEffect(() => {
        if (isOpen && targetUsername) {
            setActiveTab('view');
            setSessions([]);
            const fetchData = async () => {
                try {
                    const [targetRes, meRes] = await Promise.all([
                        api.get(`/users/${targetUsername}`),
                        api.get(`/users/${currentUser.username}`)
                    ]);
                    setViewingUser(targetRes.data); setEditForm(targetRes.data); setMyInfo(meRes.data);
                } catch (err) { console.error(err); onClose(); }
            };
            fetchData();
        }
    }, [isOpen, targetUsername, currentUser.username, onClose]);

    useEffect(() => {
        if (activeTab === 'sessions') {
            fetchActiveSessions();
        }
    }, [activeTab]);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 250;
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                setEditForm(prev => ({ ...prev, avatar: canvas.toDataURL('image/jpeg', 0.8) }));
            };
        };
    };

    const handleFriendAction = async (action) => {
        try {
            if (action === "request") {
                await api.post("/friends/request", { fromUser: currentUser.username, toUser: targetUsername });
                alert("Đã gửi yêu cầu kết bạn!");
            } else if (action === "unfriend") {
                if (!window.confirm("Xác nhận hủy kết bạn?")) return;
                await api.post("/friends/unfriend", { me: currentUser.username, friendUname: targetUsername });
                alert("Đã hủy kết bạn!");
            } else if (action === "block") {
                if (!window.confirm(`Chặn @${targetUsername}? Họ sẽ không thể nhắn tin, gọi điện hoặc kết bạn với bạn.`)) return;
                await api.post("/friends/block", { me: currentUser.username, targetUsername });
                alert("Đã chặn người dùng!");
            } else if (action === "unblock") {
                await api.post("/friends/unblock", { me: currentUser.username, targetUsername });
                alert("Đã bỏ chặn người dùng!");
            }
            onClose();
        } catch (err) {
            alert(err.response?.data?.error || "Thao tác thất bại!");
        }
    };

    if (!isOpen) return null;
    const isMe = currentUser?.username === targetUsername;
    const isFriend = myInfo?.friends?.includes(targetUsername);
    const isBlocked = (myInfo?.blockedUsers || []).includes(targetUsername);
    const hasSentRequest = viewingUser?.friendRequests?.includes(currentUser.username);
    const dmRoomId = currentUser?.username && viewingUser?.username ? `dm_${[currentUser.username, viewingUser.username].sort().join('_')}` : null;

    return (
        <div className={`flex-1 h-full w-full overflow-y-auto ${darkMode ? 'bg-[#0f172a]' : 'bg-slate-50'}`}>
            {!viewingUser ? (
                <div className="flex items-center justify-center h-full">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="w-full h-full flex flex-col">
                    {/* Full Width Cover Header */}
                    <div className="w-full h-64 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative shrink-0">
                        {/* Removed Back Button per user request */}
                    </div>

                    <div className="max-w-6xl w-full mx-auto px-8 pb-12 flex-1 flex flex-col lg:flex-row gap-10">
                        
                        {/* Left Column: Avatar & Basic Info */}
                        <div className="lg:w-1/3 flex flex-col items-center lg:items-start relative -top-20 z-10 shrink-0">
                            <div className="relative group mb-4">
                                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-pink-500 rounded-[2rem] blur-xl opacity-30 group-hover:opacity-60 transition-opacity"></div>
                                <img 
                                    src={(activeTab === 'edit' ? editForm.avatar : viewingUser.avatar) || `https://ui-avatars.com/api/?name=${viewingUser.username}`} 
                                    className={`w-40 h-40 rounded-[2rem] border-[6px] ${darkMode ? 'border-[#0f172a] bg-slate-800' : 'border-slate-50 bg-slate-100'} object-cover relative shadow-2xl`} 
                                    alt="avt" 
                                />
                                {activeTab === 'edit' && (
                                    <div onClick={() => fileRef.current.click()} className="absolute inset-0 z-20 bg-black/50 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-all border-2 border-white/20 text-white backdrop-blur-sm">
                                        <FaCamera size={28}/>
                                        <span className="text-xs font-medium mt-2">Thay ảnh</span>
                                        <input type="file" ref={fileRef} hidden onChange={handleAvatarChange} accept="image/*" />
                                    </div>
                                )}
                            </div>

                            <div className="text-center lg:text-left w-full mt-2">
                                <h2 className={`text-3xl font-bold flex items-center justify-center lg:justify-start gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    {viewingUser.displayName} 
                                    {viewingUser.role === 'admin' && <FaShieldAlt className="text-rose-500" title="Admin hệ thống"/>}
                                </h2>
                                <p className="text-indigo-500 font-medium text-base mt-1 opacity-90">@{viewingUser.username}</p>
                            </div>

                            {/* Action Buttons for Other Users */}
                            {!isMe && (
                                <div className="w-full mt-6 space-y-3">
                                    <button onClick={() => { onStartDM(viewingUser.username); onClose(); }} className="w-full py-3 rounded-2xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg transition-all flex items-center justify-center gap-2">
                                        <FaCommentDots size={16}/> Gửi tin nhắn
                                    </button>
                                    <button onClick={() => { if (dmRoomId && onStartDM) onStartDM(viewingUser.username); startCall(viewingUser.username, dmRoomId); onClose(); }} disabled={isCallBusy} className={`w-full py-3 rounded-2xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${isCallBusy ? (darkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-200 text-slate-400') : 'bg-cyan-500/10 text-cyan-600 hover:bg-cyan-500/20'}`}>
                                        <FaVideo size={16}/> Gọi Video
                                    </button>
                                    {isFriend ? (
                                        <button onClick={() => handleFriendAction('unfriend')} className="w-full py-3 rounded-2xl text-sm font-semibold bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2">
                                            <FaUserMinus/> Hủy kết bạn
                                        </button>
                                    ) : (
                                        <button onClick={() => handleFriendAction('request')} className="w-full py-3 rounded-2xl text-sm font-semibold bg-slate-800 text-white hover:bg-slate-700 transition-all flex items-center justify-center gap-2">
                                            <FaUserPlus/> {hasSentRequest ? 'Đã gửi lời mời' : 'Kết bạn'}
                                        </button>
                                    )}
                                    <button onClick={() => handleFriendAction(isBlocked ? 'unblock' : 'block')} className={`w-full py-3 rounded-2xl text-sm font-semibold transition-all ${isBlocked ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white' : (darkMode ? 'text-slate-400 hover:text-rose-500' : 'text-slate-500 hover:text-rose-600')}`}>
                                        {isBlocked ? 'Bỏ chặn người dùng' : 'Chặn người dùng'}
                                    </button>
                                </div>
                            )}

                            {/* About / Bio Card for Left Sidebar */}
                            {viewingUser.bio && (
                                <div className={`w-full mt-6 p-5 rounded-3xl border ${darkMode ? 'bg-[#1e293b] border-slate-700/50' : 'bg-white border-slate-200'} shadow-xl`}>
                                    <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}><FaUserCircle/> Giới thiệu</h3>
                                    <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>"{viewingUser.bio}"</p>
                                </div>
                            )}
                        </div>

                        {/* Right Column: Tab Navigation & Content */}
                        <div className="lg:w-2/3 flex-1 flex flex-col pt-8">
                            
                            {/* Modern Tabs */}
                            <div className={`flex items-center gap-2 mb-8 border-b ${darkMode ? 'border-slate-800' : 'border-slate-200'} pb-4 overflow-x-auto scrollbar-hide`}>
                                <button onClick={() => setActiveTab('view')} className={`px-5 py-2.5 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all ${activeTab === 'view' ? 'bg-indigo-600 text-white shadow-md' : (darkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100')}`}>Thông tin chung</button>
                                {isMe && (
                                    <>
                                        <button onClick={() => setActiveTab('edit')} className={`px-5 py-2.5 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all ${activeTab === 'edit' ? 'bg-indigo-600 text-white shadow-md' : (darkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100')}`}>Chỉnh sửa hồ sơ</button>
                                        <button onClick={() => setActiveTab('security')} className={`px-5 py-2.5 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all ${activeTab === 'security' ? 'bg-indigo-600 text-white shadow-md' : (darkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100')}`}>Bảo mật</button>
                                        <button onClick={() => setActiveTab('sessions')} className={`px-5 py-2.5 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === 'sessions' ? 'bg-indigo-600 text-white shadow-md' : (darkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100')}`}>
                                            <FaHistory/> Quản lý thiết bị
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Tab Contents */}
                            <div className={`w-full p-8 rounded-[2rem] border ${darkMode ? 'bg-[#1e293b]/80 border-slate-700/50 backdrop-blur-xl' : 'bg-white border-slate-200'} shadow-2xl`}>
                                {activeTab === 'view' && <ProfileView viewingUser={viewingUser} darkMode={darkMode} />}
                                {activeTab === 'edit' && isMe && <ProfileEdit editForm={editForm} setEditForm={setEditForm} setIsEditing={() => setActiveTab('view')} handleUpdate={handleUpdate} darkMode={darkMode} />}
                                {activeTab === 'security' && isMe && (
                                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                                        {/* 2FA Card */}
                                        <div className={`p-6 rounded-3xl border flex items-center justify-between ${darkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                                            <div>
                                                <div className={`text-base font-semibold flex items-center gap-2 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                                    <FaShieldAlt className={darkMode ? 'text-indigo-400' : 'text-indigo-600'} size={20}/> Bảo mật 2 lớp (2FA)
                                                </div>
                                                <div className={`text-sm mt-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Yêu cầu nhập mã OTP gửi qua Email mỗi khi đăng nhập.</div>
                                            </div>
                                            <button 
                                                onClick={() => handleToggle2FA(!viewingUser.is2FAEnabled)}
                                                className={`w-14 h-7 rounded-full transition-colors relative shrink-0 ${viewingUser.is2FAEnabled ? 'bg-indigo-600' : (darkMode ? 'bg-slate-600' : 'bg-slate-300')}`}
                                            >
                                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${viewingUser.is2FAEnabled ? 'right-1' : 'left-1'}`}></div>
                                            </button>
                                        </div>
                                        <hr className={`border-t ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}/>
                                        <ChangePassword setPassForm={setPassForm} passForm={passForm} setIsChangingPass={() => setActiveTab('view')} handleChangePass={handleChangePass} darkMode={darkMode} />
                                    </div>
                                )}
                                {activeTab === 'sessions' && isMe && (
                                    <div className="animate-in slide-in-from-bottom-4 duration-500">
                                        <div className="flex items-center justify-between mb-6">
                                            <div>
                                                <h3 className={`text-lg font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Thiết bị đang đăng nhập ({sessions.length})</h3>
                                                <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Quản lý các thiết bị đang sử dụng tài khoản của bạn.</p>
                                            </div>
                                            {sessions.filter(s => s.sessionId !== JSON.parse(localStorage.getItem('user_session') || '{}')?.sessionId).length > 0 && (
                                                <button onClick={handleTerminateOtherSessions} className="text-sm font-semibold bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white px-5 py-2.5 rounded-2xl transition-all">
                                                    Đăng xuất thiết bị khác
                                                </button>
                                            )}
                                        </div>

                                        {loadingSessions ? (
                                            <div className="flex justify-center py-12"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
                                        ) : (
                                            <div className="space-y-4">
                                                {sessions.map(sess => {
                                                    const isCurrent = sess.sessionId === JSON.parse(localStorage.getItem('user_session') || '{}')?.sessionId;
                                                    return (
                                                        <div key={sess.sessionId} className={`flex items-center justify-between p-5 rounded-3xl border transition-all ${isCurrent ? (darkMode ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200') : (darkMode ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800' : 'bg-white border-slate-200 hover:bg-slate-50')} shadow-sm`}>
                                                            <div className="flex items-center gap-5 min-w-0">
                                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isCurrent ? 'bg-indigo-600 text-white' : (darkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500')}`}>
                                                                    {sess.device.includes("Windows") || sess.device.includes("Mac") || sess.device.includes("Linux") ? <FaDesktop size={24} /> : <FaMobileAlt size={24} />}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className={`text-base font-semibold truncate flex items-center gap-3 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                                                        {sess.device}
                                                                        {isCurrent && <span className="text-[10px] bg-emerald-500 text-white px-2.5 py-1 rounded-md font-bold uppercase tracking-wide">Thiết bị này</span>}
                                                                    </p>
                                                                    <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>IP: {sess.ip} • {new Date(sess.loginAt).toLocaleString()}</p>
                                                                </div>
                                                            </div>
                                                            {!isCurrent && (
                                                                <button onClick={() => handleTerminateSession(sess.sessionId)} className={`p-3.5 rounded-2xl transition-all ${darkMode ? 'bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10' : 'bg-slate-100 text-slate-500 hover:text-rose-500 hover:bg-rose-50'}`} title="Đăng xuất thiết bị">
                                                                    <FaTrash size={16}/>
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfileModal;