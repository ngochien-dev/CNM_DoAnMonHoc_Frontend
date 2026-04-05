import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaUserEdit, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCamera, FaShieldAlt, FaCommentDots, FaUserPlus, FaUserMinus, FaClock } from 'react-icons/fa';
import axios from 'axios';

const UserProfileModal = ({ isOpen, onClose, targetUsername, currentUser, onUpdateSuccess, onStartDM }) => {
    const [viewingUser, setViewingUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ 
        username: '', displayName: '', email: '', bio: '', phone: '', address: '', avatar: '' 
    });
    const [myInfo, setMyInfo] = useState(null);
    const fileRef = useRef();

    useEffect(() => {
        if (isOpen && targetUsername) {
            setViewingUser(null); // RESET CACHE NGAY LẬP TỨC ĐỂ HẾT LAG
            setIsEditing(false);

            const fetchData = async () => {
                try {
                    const [targetRes, meRes] = await Promise.all([
                        axios.get(`http://localhost:3001/api/users/${targetUsername}`),
                        axios.get(`http://localhost:3001/api/users/${currentUser.username}`)
                    ]);
                    const data = targetRes.data;
                    const cleanData = {
                        username: data.username || targetUsername,
                        displayName: data.displayName || '',
                        email: data.email || '',
                        bio: data.bio || '',
                        phone: data.phone || '',
                        address: data.address || '',
                        avatar: data.avatar || '',
                        role: data.role || 'user',
                        friendRequests: data.friendRequests || []
                    };
                    setViewingUser(cleanData);
                    setEditForm(cleanData);
                    setMyInfo(meRes.data);
                } catch (err) {
                    console.error("Lỗi lấy profile:", err);
                    onClose();
                }
            };
            fetchData();
        }
    }, [isOpen, targetUsername]);

    const handleFriendAction = async (action) => {
        try {
            if (action === 'request') {
                await axios.post('http://localhost:3001/api/friends/request', { fromUser: currentUser.username, toUser: targetUsername });
                alert("Đã gửi lời mời!");
            } else if (action === 'unfriend') {
                if (!window.confirm("Hủy kết bạn?")) return;
                await axios.post('http://localhost:3001/api/friends/unfriend', { me: currentUser.username, friendUname: targetUsername });
            }
            onUpdateSuccess();
            onClose(); 
        } catch (err) { alert("Lỗi thao tác!"); }
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 1000000) return alert("Ảnh quá lớn (>1MB)!");
            const reader = new FileReader();
            reader.onloadend = () => setEditForm(prev => ({ ...prev, avatar: reader.result }));
            reader.readAsDataURL(file);
        }
    };

    const handleUpdate = async () => {
        try {
            const res = await axios.post('http://localhost:3001/api/users/update', editForm);
            onUpdateSuccess(res.data);
            setViewingUser(res.data);
            setIsEditing(false);
            alert("Cập nhật hồ sơ thành công!");
        } catch (err) { alert("Lỗi server!"); }
    };

    if (!isOpen) return null;
    const isMe = currentUser && viewingUser && String(currentUser.username) === String(viewingUser.username);
    const isFriend = myInfo?.friends?.includes(targetUsername);
    const hasSentRequest = viewingUser?.friendRequests?.includes(currentUser.username);

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] backdrop-blur-sm p-4">
            {!viewingUser ? (
                <div className="bg-white p-10 rounded-[32px] flex flex-col items-center shadow-2xl">
                    <div className="w-10 h-10 border-4 border-[#5865f2] border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-400 font-bold text-xs uppercase tracking-widest">Đang tải...</p>
                </div>
            ) : (
                <div className="bg-white w-full max-w-[400px] rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
                    <div className="h-24 bg-gradient-to-r from-[#5865f2] to-[#4752c4] relative">
                        <button onClick={onClose} className="absolute top-4 right-4 text-white p-2 hover:bg-black/20 rounded-full transition-all"><FaTimes/></button>
                    </div>

                    <div className="px-8 pb-8 text-center">
                        <div className="relative -top-12 mb-[-35px] flex justify-center">
                            <div className="relative group">
                                <img src={isEditing ? editForm.avatar : (viewingUser.avatar || `https://ui-avatars.com/api/?name=${viewingUser.username}`)} className="w-28 h-28 rounded-full border-8 border-white object-cover shadow-lg" alt="avatar" />
                                {isEditing && (
                                    <div onClick={() => fileRef.current.click()} className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white cursor-pointer opacity-100 transition-opacity">
                                        <FaCamera size={24}/><input type="file" ref={fileRef} hidden onChange={handleAvatarChange} accept="image/*" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-2">
                            <h2 className="text-2xl font-black text-gray-800 flex items-center justify-center gap-2 italic tracking-tighter uppercase">
                                {viewingUser.displayName} 
                                {viewingUser.role === 'admin' && <FaShieldAlt className="text-red-500" size={16}/>}
                            </h2>
                            <p className="text-gray-400 font-medium italic text-sm mb-4">@{viewingUser.username}</p>
                            
                            {!isMe && (
                                <div className="flex justify-center gap-2 mb-2">
                                    <button onClick={() => { onStartDM(viewingUser.username); onClose(); }} className="flex items-center gap-2 bg-green-500 text-white px-5 py-2 rounded-full text-xs font-black uppercase hover:scale-105 shadow-lg transition-all"><FaCommentDots/> Nhắn tin</button>
                                    {isFriend ? (
                                        <button onClick={() => handleFriendAction('unfriend')} className="flex items-center gap-2 bg-gray-100 text-red-500 px-5 py-2 rounded-full text-xs font-black uppercase border hover:bg-red-500 hover:text-white transition-all"><FaUserMinus/> Hủy kết bạn</button>
                                    ) : hasSentRequest ? (
                                        <button className="bg-gray-100 text-gray-400 px-5 py-2 rounded-full text-xs font-black uppercase border cursor-default"><FaClock/> Chờ duyệt</button>
                                    ) : (
                                        <button onClick={() => handleFriendAction('request')} className="flex items-center gap-2 bg-[#5865f2] text-white px-5 py-2 rounded-full text-xs font-black uppercase hover:scale-105 shadow-lg transition-all"><FaUserPlus/> Kết bạn</button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="mt-6 space-y-4 text-left">
                            {isEditing ? (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                    <div><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Tên hiển thị</label><input className="w-full border-2 border-gray-100 bg-gray-50 p-2.5 rounded-2xl text-sm font-bold outline-none focus:border-[#5865f2]" value={editForm.displayName} onChange={e => setEditForm({...editForm, displayName: e.target.value})} /></div>
                                    <div><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Bio</label><textarea className="w-full border-2 border-gray-100 bg-gray-50 p-2.5 rounded-2xl text-sm h-16 resize-none font-medium" value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} /></div>
                                    <button onClick={handleUpdate} className="w-full bg-[#5865f2] text-white py-4 rounded-2xl font-black uppercase text-[10px]">Lưu thay đổi</button>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-in slide-in-from-bottom-2 font-bold text-gray-700">
                                    <div className="bg-gray-50 p-4 rounded-3xl text-sm text-gray-600 leading-relaxed italic">"{viewingUser.bio || "Thành viên này chưa có tiểu sử."}"</div>
                                    <div className="space-y-3 px-1">
                                        <div className="flex items-center gap-4 text-sm"><FaEnvelope className="text-[#5865f2] w-4"/> {viewingUser.email}</div>
                                        <div className="flex items-center gap-4 text-sm"><FaPhone className="text-[#23a559] w-4"/> {viewingUser.phone || "N/A"}</div>
                                        <div className="flex items-center gap-4 text-sm"><FaMapMarkerAlt className="text-red-500 w-4"/> {viewingUser.address || "Việt Nam"}</div>
                                    </div>
                                    {isMe && <button onClick={() => setIsEditing(true)} className="w-full mt-4 bg-gray-800 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] shadow-lg hover:bg-black transition-all"><FaUserEdit/> Sửa hồ sơ</button>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfileModal;