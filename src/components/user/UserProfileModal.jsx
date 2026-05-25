import React, { useState, useEffect, useRef } from 'react';
import {
    FaTimes, FaUserEdit, FaCamera, FaShieldAlt, FaCommentDots,
    FaUserPlus, FaUserMinus, FaLock, FaVideo, FaMobileAlt, FaDesktop,
    FaTrash, FaUserCircle, FaHistory, FaBan, FaChartBar
} from 'react-icons/fa';
import ProfileView from './ProfileView';
import ProfileEdit from './ProfileEdit';
import ChangePassword from './ChangePassword';
import UserStats from './UserStats';
import api from '../../services/api';
import useCall from '../../context/useCall';

const getCurrentSession = () => {
    try {
        return JSON.parse(localStorage.getItem('user_session') || '{}');
    } catch {
        return {};
    }
};

const isDesktopDevice = (device = '') => {
    return device.includes('Windows') || device.includes('Mac') || device.includes('Linux');
};

const UserProfileModal = ({
    isOpen,
    onClose,
    targetUsername,
    currentUser,
    onStartDM,
    onUpdateSuccess,
    darkMode = true,
}) => {
    const [viewingUser, setViewingUser] = useState(null);
    const [activeTab, setActiveTab] = useState('view');
    const [sessions, setSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [passForm, setPassForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [myInfo, setMyInfo] = useState(null);

    const fileRef = useRef(null);
    const { startCall, isCallBusy } = useCall();

    const fetchActiveSessions = async () => {
        setLoadingSessions(true);
        try {
            const res = await api.get('/users/active-sessions');
            setSessions(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Lỗi lấy danh sách phiên hoạt động:', err);
            setSessions([]);
        } finally {
            setLoadingSessions(false);
        }
    };

    const fetchData = async () => {
        try {
            const [targetRes, meRes] = await Promise.all([
                api.get(`/users/${targetUsername}`),
                api.get(`/users/${currentUser.username}`),
            ]);

            setViewingUser(targetRes.data);
            setEditForm(targetRes.data);
            setMyInfo(meRes.data);
        } catch (err) {
            console.error(err);
            onClose?.();
        }
    };

    useEffect(() => {
        if (isOpen && targetUsername && currentUser?.username) {
            setViewingUser(null);
            setActiveTab('view');
            setSessions([]);
            fetchData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, targetUsername, currentUser?.username]);

    useEffect(() => {
        if (activeTab === 'sessions') {
            fetchActiveSessions();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

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
            setEditForm(res.data);
            setActiveTab('view');
            onUpdateSuccess?.(res.data);
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi cập nhật!');
        }
    };

    const handleChangePass = async () => {
        const { oldPassword, newPassword, confirmPassword } = passForm;

        if (!oldPassword || !newPassword || !confirmPassword) {
            return alert('Vui lòng nhập đầy đủ mật khẩu!');
        }

        if (newPassword !== confirmPassword) {
            return alert('Mật khẩu xác nhận không khớp!');
        }

        if (newPassword.length < 6) {
            return alert('Mật khẩu mới phải từ 6 ký tự trở lên!');
        }

        try {
            await api.post('/auth/change-password', {
                username: currentUser.username,
                oldPassword,
                newPassword,
            });

            alert('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
            localStorage.removeItem('user_session');
            window.location.reload();
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi đổi mật khẩu!');
        }
    };

    const handleTerminateSession = async (sessId) => {
        if (!window.confirm('Bạn có chắc chắn muốn đăng xuất thiết bị này từ xa?')) return;

        try {
            await api.post('/users/terminate-session', { sessionId: sessId });
            setSessions(prev => prev.filter(s => s.sessionId !== sessId));
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi khi đăng xuất thiết bị!');
        }
    };

    const handleTerminateOtherSessions = async () => {
        if (!window.confirm('Đăng xuất khỏi tất cả các thiết bị khác?')) return;

        try {
            const currentSess = getCurrentSession();
            const otherSessions = sessions.filter(s => s.sessionId !== currentSess?.sessionId);

            for (const s of otherSessions) {
                await api.post('/users/terminate-session', { sessionId: s.sessionId });
            }

            alert('Đã đăng xuất thành công tất cả các thiết bị khác!');
            fetchActiveSessions();
        } catch (err) {
            alert('Lỗi khi đăng xuất các thiết bị!');
        }
    };

    const handleToggle2FA = async (enabled) => {
        try {
            await api.post('/users/toggle-2fa', {
                username: currentUser.username,
                enabled,
            });

            setViewingUser(prev => ({ ...prev, is2FAEnabled: enabled }));
            alert(`Đã ${enabled ? 'bật' : 'tắt'} bảo mật 2 lớp thành công!`);
        } catch (err) {
            alert('Lỗi khi thiết lập 2FA');
        }
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files?.[0];
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

                setEditForm(prev => ({
                    ...prev,
                    avatar: canvas.toDataURL('image/jpeg', 0.8),
                }));
            };
        };
    };

    const handleFriendAction = async (action) => {
        try {
            if (action === 'request') {
                await api.post('/friends/request', {
                    fromUser: currentUser.username,
                    toUser: targetUsername,
                });
                alert('Đã gửi yêu cầu kết bạn!');
            } else if (action === 'unfriend') {
                if (!window.confirm('Xác nhận hủy kết bạn?')) return;

                await api.post('/friends/unfriend', {
                    me: currentUser.username,
                    friendUname: targetUsername,
                });
                alert('Đã hủy kết bạn!');
            } else if (action === 'block') {
                if (!window.confirm(`Chặn @${targetUsername}? Họ sẽ không thể nhắn tin, gọi điện hoặc kết bạn với bạn.`)) return;

                await api.post('/friends/block', {
                    me: currentUser.username,
                    targetUsername,
                });
                alert('Đã chặn người dùng!');
            } else if (action === 'unblock') {
                await api.post('/friends/unblock', {
                    me: currentUser.username,
                    targetUsername,
                });
                alert('Đã bỏ chặn người dùng!');
            }

            onUpdateSuccess?.();
            onClose?.();
        } catch (err) {
            alert(err.response?.data?.error || err.response?.data?.message || 'Thao tác thất bại!');
        }
    };

    if (!isOpen) return null;

    const isMe = currentUser?.username === targetUsername;
    const isFriend = myInfo?.friends?.includes(targetUsername);
    const isBlocked = (myInfo?.blockedUsers || []).includes(targetUsername);
    const hasSentRequest = viewingUser?.friendRequests?.includes(currentUser?.username);
    const dmRoomId = currentUser?.username && viewingUser?.username
        ? `dm_${[currentUser.username, viewingUser.username].sort().join('_')}`
        : null;

    const currentSession = getCurrentSession();
    const otherSessions = sessions.filter(s => s.sessionId !== currentSession?.sessionId);

    const tabButtonClass = (tab) => (
        `px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase italic tracking-widest whitespace-nowrap transition-all ${
            activeTab === tab
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                : darkMode
                    ? 'text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
        }`
    );

    return (
        <div className={`w-full h-full flex flex-col overflow-y-auto ${darkMode ? 'bg-[#0f172a]' : 'bg-slate-50'}`}>
            {!viewingUser ? (
                <div className="flex items-center justify-center flex-1">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="w-full flex flex-col min-h-full">
                    <div className="w-full h-64 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 relative shrink-0 overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_35%)]"></div>
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 w-11 h-11 bg-black/30 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-all backdrop-blur-md border border-white/10 z-10"
                        >
                            <FaTimes />
                        </button>
                    </div>

                    <div className="max-w-6xl w-full mx-auto px-6 md:px-8 pb-12 flex-1 flex flex-col lg:flex-row gap-10">
                        <div className="lg:w-1/3 flex flex-col items-center lg:items-start relative -top-20 z-10 shrink-0">
                            <div className="relative group mb-4">
                                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-[2.25rem] blur-xl opacity-40 group-hover:opacity-80 transition-opacity"></div>
                                <img
                                    src={(activeTab === 'edit' ? editForm.avatar : viewingUser.avatar) || `https://ui-avatars.com/api/?name=${viewingUser.username}`}
                                    className={`w-40 h-40 rounded-[2rem] border-[6px] ${darkMode ? 'border-[#0f172a] bg-slate-800' : 'border-slate-50 bg-slate-100'} object-cover relative shadow-2xl transition-all group-hover:scale-[1.02]`}
                                    alt="avatar"
                                />

                                {activeTab === 'edit' && (
                                    <div
                                        onClick={() => fileRef.current?.click()}
                                        className="absolute inset-0 z-20 bg-black/60 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-all border-2 border-white/20 text-white backdrop-blur-sm"
                                    >
                                        <FaCamera size={28} />
                                        <span className="text-[10px] font-black uppercase tracking-widest mt-2">Thay ảnh</span>
                                        <input
                                            type="file"
                                            ref={fileRef}
                                            hidden
                                            onChange={handleAvatarChange}
                                            accept="image/*"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="text-center lg:text-left w-full mt-2">
                                <h2 className={`text-3xl font-black uppercase italic tracking-tighter flex items-center justify-center lg:justify-start gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    {viewingUser.displayName || viewingUser.username}
                                    {viewingUser.role === 'admin' && (
                                        <FaShieldAlt className="text-rose-500 animate-pulse" title="Admin hệ thống" />
                                    )}
                                </h2>
                                <p className="text-purple-400 font-black text-[11px] tracking-[3px] mt-1 opacity-90">
                                    @{viewingUser.username}
                                </p>
                            </div>

                            {!isMe && (
                                <div className="w-full mt-6 space-y-3">
                                    <button
                                        onClick={() => {
                                            onStartDM?.(viewingUser.username);
                                            onClose?.();
                                        }}
                                        className="w-full py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                                    >
                                        <FaCommentDots size={15} />
                                        Nhắn tin
                                    </button>

                                    <button
                                        onClick={() => {
                                            if (dmRoomId && onStartDM) {
                                                onStartDM(viewingUser.username);
                                            }
                                            startCall(viewingUser.username, dmRoomId);
                                            onClose?.();
                                        }}
                                        disabled={isCallBusy}
                                        className={`w-full py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border ${
                                            isCallBusy
                                                ? 'bg-white/5 text-gray-500 border-white/5 cursor-not-allowed'
                                                : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/20 hover:bg-cyan-500/25 active:scale-95'
                                        }`}
                                    >
                                        <FaVideo size={15} />
                                        Gọi video
                                    </button>

                                    {isFriend ? (
                                        <button
                                            onClick={() => handleFriendAction('unfriend')}
                                            className="w-full py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 transition-all flex items-center justify-center gap-2"
                                        >
                                            <FaUserMinus />
                                            Hủy bạn
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleFriendAction('request')}
                                            disabled={hasSentRequest}
                                            className={`w-full py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                                                hasSentRequest
                                                    ? 'bg-white/5 text-gray-500 border border-white/5 cursor-default'
                                                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20 hover:scale-[1.02]'
                                            }`}
                                        >
                                            <FaUserPlus />
                                            {hasSentRequest ? 'Đã gửi lời mời' : 'Kết bạn'}
                                        </button>
                                    )}

                                    <button
                                        onClick={() => handleFriendAction(isBlocked ? 'unblock' : 'block')}
                                        className={`w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${
                                            isBlocked
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500 hover:text-white'
                                                : darkMode
                                                    ? 'bg-white/5 text-gray-500 border-white/5 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30'
                                                    : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                                        }`}
                                    >
                                        <FaBan />
                                        {isBlocked ? 'Bỏ chặn người dùng' : 'Chặn người dùng'}
                                    </button>
                                </div>
                            )}

                            {viewingUser.bio && (
                                <div className={`w-full mt-6 p-5 rounded-3xl border ${darkMode ? 'bg-[#1e293b]/80 border-slate-700/50 text-white' : 'bg-white border-slate-200 text-slate-900'} shadow-xl`}>
                                    <h3 className="text-[11px] font-black uppercase italic tracking-widest mb-3 flex items-center gap-2 text-indigo-400">
                                        <FaUserCircle />
                                        Giới thiệu
                                    </h3>
                                    <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                        “{viewingUser.bio}”
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="lg:w-2/3 flex-1 flex flex-col pt-8">
                            <div className={`flex items-center gap-2 mb-8 border-b ${darkMode ? 'border-slate-800' : 'border-slate-200'} pb-4 overflow-x-auto scrollbar-hide`}>
                                <button onClick={() => setActiveTab('view')} className={tabButtonClass('view')}>
                                    Thông tin chung
                                </button>

                                {isMe && (
                                    <>
                                        <button onClick={() => setActiveTab('edit')} className={tabButtonClass('edit')}>
                                            Chỉnh sửa hồ sơ
                                        </button>
                                        <button onClick={() => setActiveTab('stats')} className={`${tabButtonClass('stats')} flex items-center gap-2`}>
                                            <FaChartBar />
                                            Thống kê
                                        </button>
                                        <button onClick={() => setActiveTab('security')} className={tabButtonClass('security')}>
                                            Bảo mật
                                        </button>
                                        <button onClick={() => setActiveTab('sessions')} className={`${tabButtonClass('sessions')} flex items-center gap-2`}>
                                            <FaHistory />
                                            Thiết bị
                                        </button>
                                    </>
                                )}
                            </div>

                            <div className={`w-full p-6 md:p-8 rounded-[2rem] border ${darkMode ? 'bg-[#1e293b]/80 border-slate-700/50 backdrop-blur-xl text-white' : 'bg-white border-slate-200 text-slate-900'} shadow-2xl`}>
                                {activeTab === 'view' && (
                                    <ProfileView viewingUser={viewingUser} darkMode={darkMode} />
                                )}

                                {activeTab === 'edit' && isMe && (
                                    <ProfileEdit
                                        editForm={editForm}
                                        setEditForm={setEditForm}
                                        setIsEditing={() => setActiveTab('view')}
                                        handleUpdate={handleUpdate}
                                        darkMode={darkMode}
                                    />
                                )}

                                {activeTab === 'stats' && isMe && (
                                    <UserStats username={currentUser.username} darkMode={darkMode} />
                                )}

                                {activeTab === 'security' && isMe && (
                                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                                        <div className={`p-5 md:p-6 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${darkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                                            <div>
                                                <div className={`text-sm md:text-base font-black uppercase italic tracking-wider flex items-center gap-2 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                                    <FaShieldAlt className={darkMode ? 'text-indigo-400' : 'text-indigo-600'} size={20} />
                                                    Bảo mật 2 lớp
                                                </div>
                                                <div className={`text-xs md:text-sm mt-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                    Yêu cầu nhập mã OTP gửi qua Email mỗi khi đăng nhập.
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleToggle2FA(!viewingUser.is2FAEnabled)}
                                                className={`w-14 h-7 rounded-full transition-colors relative shrink-0 ${viewingUser.is2FAEnabled ? 'bg-indigo-600' : (darkMode ? 'bg-slate-600' : 'bg-slate-300')}`}
                                            >
                                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${viewingUser.is2FAEnabled ? 'right-1' : 'left-1'}`}></div>
                                            </button>
                                        </div>

                                        <hr className={`border-t ${darkMode ? 'border-slate-800' : 'border-slate-200'}`} />

                                        <ChangePassword
                                            setPassForm={setPassForm}
                                            passForm={passForm}
                                            setIsChangingPass={() => setActiveTab('view')}
                                            handleChangePass={handleChangePass}
                                            darkMode={darkMode}
                                        />
                                    </div>
                                )}

                                {activeTab === 'sessions' && isMe && (
                                    <div className="animate-in slide-in-from-bottom-4 duration-500">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                            <div>
                                                <h3 className={`text-lg font-black uppercase italic tracking-tighter ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                                    Thiết bị đang đăng nhập ({sessions.length})
                                                </h3>
                                                <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                    Quản lý các thiết bị đang sử dụng tài khoản của bạn.
                                                </p>
                                            </div>

                                            {otherSessions.length > 0 && (
                                                <button
                                                    onClick={handleTerminateOtherSessions}
                                                    className="text-[10px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white px-5 py-2.5 rounded-2xl transition-all"
                                                >
                                                    Đăng xuất thiết bị khác
                                                </button>
                                            )}
                                        </div>

                                        {loadingSessions ? (
                                            <div className="flex justify-center py-12">
                                                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {sessions.map(sess => {
                                                    const isCurrent = sess.sessionId === currentSession?.sessionId;

                                                    return (
                                                        <div
                                                            key={sess.sessionId}
                                                            className={`flex items-center justify-between p-5 rounded-3xl border transition-all ${
                                                                isCurrent
                                                                    ? darkMode
                                                                        ? 'bg-indigo-500/10 border-indigo-500/30'
                                                                        : 'bg-indigo-50 border-indigo-200'
                                                                    : darkMode
                                                                        ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800'
                                                                        : 'bg-white border-slate-200 hover:bg-slate-50'
                                                            } shadow-sm`}
                                                        >
                                                            <div className="flex items-center gap-5 min-w-0">
                                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                                                                    isCurrent
                                                                        ? 'bg-indigo-600 text-white'
                                                                        : darkMode
                                                                            ? 'bg-slate-700 text-slate-400'
                                                                            : 'bg-slate-100 text-slate-500'
                                                                }`}>
                                                                    {isDesktopDevice(sess.device) ? <FaDesktop size={24} /> : <FaMobileAlt size={24} />}
                                                                </div>

                                                                <div className="min-w-0">
                                                                    <p className={`text-sm md:text-base font-black truncate flex items-center gap-3 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                                                        {sess.device || 'Thiết bị không xác định'}
                                                                        {isCurrent && (
                                                                            <span className="text-[9px] bg-emerald-500 text-white px-2.5 py-1 rounded-md font-black uppercase tracking-wide">
                                                                                Hiện tại
                                                                            </span>
                                                                        )}
                                                                    </p>
                                                                    <p className={`text-xs md:text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                                        IP: {sess.ip || 'unknown'} • {sess.loginAt ? new Date(sess.loginAt).toLocaleString() : 'Không rõ thời gian'}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {!isCurrent && (
                                                                <button
                                                                    onClick={() => handleTerminateSession(sess.sessionId)}
                                                                    className={`p-3.5 rounded-2xl transition-all ${darkMode ? 'bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10' : 'bg-slate-100 text-slate-500 hover:text-rose-500 hover:bg-rose-50'}`}
                                                                    title="Đăng xuất thiết bị"
                                                                >
                                                                    <FaTrash size={16} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}

                                                {sessions.length === 0 && (
                                                    <p className="text-center text-gray-500 py-8 text-xs italic">
                                                        Không tìm thấy phiên hoạt động nào
                                                    </p>
                                                )}
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