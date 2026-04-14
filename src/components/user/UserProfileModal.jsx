import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaUserEdit, FaCamera, FaShieldAlt, FaCommentDots, FaUserPlus, FaUserMinus, FaLock, FaVideo } from 'react-icons/fa';
import ProfileView from './ProfileView';
import ProfileEdit from './ProfileEdit';
import ChangePassword from './ChangePassword';
import api from '../../services/api';
import useCall from '../../context/useCall';
 
const UserProfileModal = ({ isOpen, onClose, targetUsername, currentUser, onStartDM }) => {
    const [viewingUser, setViewingUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPass, setIsChangingPass] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [passForm, setPassForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [myInfo, setMyInfo] = useState(null);
    const fileRef = useRef();
    const { startCall, isCallBusy } = useCall();

    useEffect(() => {
        if (isOpen && targetUsername) {
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
    }, [currentUser.username, isOpen, onClose, targetUsername]);

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
                const MAX_WIDTH = 200;
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                setEditForm(prev => ({ ...prev, avatar: canvas.toDataURL('image/jpeg', 0.8) }));
            };
        };
    };

    if (!isOpen) return null;
    const isMe = currentUser?.username === targetUsername;
    const isFriend = myInfo?.friends?.includes(targetUsername);
    const hasSentRequest = viewingUser?.friendRequests?.includes(currentUser.username);
    const dmRoomId =
        currentUser?.username && viewingUser?.username
            ? `dm_${[currentUser.username, viewingUser.username].sort().join('_')}`
            : null;

    return (
        <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-md flex items-center justify-center z-[1000] p-4">
            {!viewingUser ? (
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
                <div className="w-full max-w-[420px] bg-slate-900/90 border border-white/10 rounded-[40px] overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.6)] animate-in zoom-in duration-300 text-white">
                    {/* Header với Gradient xịn */}
                    <div className="h-32 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 relative">
                        <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center transition-all backdrop-blur-md"><FaTimes/></button>
                    </div>

                    <div className="px-8 pb-10">
                        {/* Avatar 3D Style */}
                        <div className="relative -top-16 mb-[-45px] flex justify-center">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-[38px] blur-lg opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                <img src={(isEditing ? editForm.avatar : viewingUser.avatar) || `https://ui-avatars.com/api/?name=${viewingUser.username}`} 
                                     className="w-32 h-32 rounded-[35px] border-[5px] border-slate-900 object-cover relative z-10 shadow-2xl bg-slate-800" alt="avt" />
                                {isEditing && (
                                    <div onClick={() => fileRef.current.click()} className="absolute inset-0 z-20 bg-black/50 rounded-[35px] flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-all border-2 border-white/20">
                                        <FaCamera size={24}/>
                                        <input type="file" ref={fileRef} hidden onChange={handleAvatarChange} accept="image/*" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="text-center mt-4">
                            <h2 className="text-2xl font-black flex items-center justify-center gap-2 tracking-tight uppercase">
                                {viewingUser.displayName} 
                                {viewingUser.role === 'admin' && <FaShieldAlt className="text-red-500 animate-pulse" title="Admin hệ thống"/>}
                            </h2>
                            <p className="text-purple-400 font-bold text-xs tracking-[2px] mb-8 opacity-80">@{viewingUser.username}</p>
                            
                            {!isMe && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                                    <button onClick={() => { onStartDM(viewingUser.username); onClose(); }} className="bg-white/10 hover:bg-white/20 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border border-white/5"><FaCommentDots className="inline mr-2" size={14}/> Nhắn tin</button>
                                    <button
                                        onClick={() => {
                                            if (dmRoomId && onStartDM) {
                                                onStartDM(viewingUser.username);
                                            }
                                            startCall(viewingUser.username, dmRoomId);
                                            onClose();
                                        }}
                                        disabled={isCallBusy}
                                        className={`py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                            isCallBusy
                                                ? 'bg-white/5 text-gray-500 border-white/5 cursor-not-allowed'
                                                : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/20 hover:bg-cyan-500/25 active:scale-95'
                                        }`}
                                    >
                                        <FaVideo className="inline mr-2" size={14}/> Gọi video
                                    </button>
                                    {isFriend ? (
                                        <button onClick={() => {/* handleFriendAction unfriend */}} className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-500/20 transition-all"><FaUserMinus className="inline mr-2"/> Hủy bạn</button>
                                    ) : (
                                        <button onClick={() => {/* handleFriendAction request */}} className="bg-gradient-to-r from-purple-600 to-indigo-600 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-500/20 hover:scale-105 transition-all"><FaUserPlus className="inline mr-2"/> {hasSentRequest ? 'Đã gửi lời mời' : 'Kết bạn'}</button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="mt-2">
                            {isEditing ? (
                                <ProfileEdit editForm={editForm} setEditForm={setEditForm} setIsEditing={setIsEditing} />
                            ) : isChangingPass ? (
                                <ChangePassword setPassForm={setPassForm} passForm={passForm} setIsChangingPass={setIsChangingPass} />
                            ) : (
                                <>
                                    <ProfileView viewingUser={viewingUser} />
                                    {isMe && (
                                        <div className="pt-8 space-y-3">
                                            <button onClick={() => setIsEditing(true)} className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-purple-400 hover:text-white transition-all transform active:scale-95 shadow-xl"><FaUserEdit className="inline mr-2" size={14}/> Cập nhật hồ sơ</button>
                                            <button onClick={() => setIsChangingPass(true)} className="w-full py-3.5 bg-white/5 border border-white/10 text-gray-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:text-white hover:bg-white/10 transition-all"><FaLock className="inline mr-2"/> Đổi mật khẩu</button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfileModal;
