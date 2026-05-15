// import React, { useState, useEffect, useRef } from "react";
// import {
//   FaTimes,
//   FaUserEdit,
//   FaCamera,
//   FaShieldAlt,
//   FaCommentDots,
//   FaUserPlus,
//   FaUserMinus,
//   FaClock,
//   FaLock,
// } from "react-icons/fa";
// import axios from "axios";
// import ProfileView from "./ProfileView";
// import ProfileEdit from "./ProfileEdit";
// import ChangePassword from "./ChangePassword";

// // Modal thông tin người dùng
// const UserProfileModal = ({
//   isOpen,
//   onClose,
//   targetUsername,
//   currentUser,
//   onUpdateSuccess,
//   onStartDM,
// }) => {
//   const [viewingUser, setViewingUser] = useState(null);
//   const [isEditing, setIsEditing] = useState(false);
//   const [isChangingPass, setIsChangingPass] = useState(false);
//   const [editForm, setEditForm] = useState({});
//   const [passForm, setPassForm] = useState({
//     oldPassword: "",
//     newPassword: "",
//     confirmPassword: "",
//   });
//   const [myInfo, setMyInfo] = useState(null);
//   const fileRef = useRef();

//   const fetchData = async () => {
//     try {
//       const [targetRes, meRes] = await Promise.all([
//         axios.get(`http://localhost:3001/api/users/${targetUsername}`),
//         axios.get(`http://localhost:3001/api/users/${currentUser.username}`),
//       ]);
//       setViewingUser(targetRes.data);
//       setEditForm(targetRes.data);
//       setMyInfo(meRes.data);
//     } catch (err) {
//       console.error(err);
//       onClose();
//     }
//   };

//   useEffect(() => {
//     if (isOpen && targetUsername) {
//       setViewingUser(null);
//       setIsEditing(false);
//       setIsChangingPass(false);
//       fetchData();
//     }
//   }, [isOpen, targetUsername]);

//   const handleUpdate = async () => {
//     try {
//       const res = await axios.post("http://localhost:3001/api/users/update", {
//         username: currentUser.username,
//         displayName: editForm.displayName,
//         phone: editForm.phone,
//         bio: editForm.bio,
//         address: editForm.address,
//         avatar: editForm.avatar,
//       });
//       alert("Cập nhật thành công!");
//       setIsEditing(false);
//       setViewingUser(res.data);
//       if (onUpdateSuccess) onUpdateSuccess(res.data);
//     } catch (err) {
//       alert(err.response?.data?.message || "Lỗi cập nhật!");
//     }
//   };

//   const handleChangePass = async () => {
//     const { oldPassword, newPassword, confirmPassword } = passForm;
//     if (!oldPassword || !newPassword || !confirmPassword)
//       return alert("Vui lòng nhập đầy đủ mật khẩu!");
//     if (newPassword !== confirmPassword)
//       return alert("Mật khẩu xác nhận không khớp!");
//     if (newPassword.length < 6)
//       return alert("Mật khẩu mới phải từ 6 ký tự trở lên!");

//     try {
//       await axios.post("http://localhost:3001/api/users/change-password", {
//         username: currentUser.username,
//         oldPassword,
//         newPassword,
//       });
//       alert("Đổi mật khẩu thành công!");
//       setIsChangingPass(false);
//       setPassForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
//     } catch (err) {
//       alert(err.response?.data?.message || "Lỗi đổi mật khẩu!");
//     }
//   };

//   const handleFriendAction = async (action) => {
//     try {
//       if (action === "request") {
//         await axios.post("http://localhost:3001/api/friends/request", {
//           fromUser: currentUser.username,
//           toUser: targetUsername,
//         });
//         alert("Đã gửi yêu cầu kết bạn!");
//       } else if (action === "unfriend") {
//         if (!window.confirm("Xác nhận hủy kết bạn?")) return;
//         await axios.post("http://localhost:3001/api/friends/unfriend", {
//           me: currentUser.username,
//           friendUname: targetUsername,
//         });
//         alert("Đã hủy kết bạn!");
//       }
//       if (onUpdateSuccess) onUpdateSuccess();
//       onClose();
//     } catch (err) {
//       alert(err.response?.data?.message || "Thao tác thất bại!");
//     }
//   };

//   const handleAvatarChange = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;
//     const reader = new FileReader();
//     reader.readAsDataURL(file);
//     reader.onload = (event) => {
//       const img = new Image();
//       img.src = event.target.result;
//       img.onload = () => {
//         const canvas = document.createElement("canvas");
//         const MAX_WIDTH = 250;
//         const scaleSize = MAX_WIDTH / img.width;
//         canvas.width = MAX_WIDTH;
//         canvas.height = img.height * scaleSize;
//         const ctx = canvas.getContext("2d");
//         ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
//         setEditForm((prev) => ({
//           ...prev,
//           avatar: canvas.toDataURL("image/jpeg", 0.7),
//         }));
//       };
//     };
//   };

//   if (!isOpen) return null;
//   const isMe = currentUser?.username === targetUsername;
//   const isFriend = myInfo?.friends?.includes(targetUsername);
//   const hasSentRequest = viewingUser?.friendRequests?.includes(
//     currentUser.username,
//   );

//   return (
//     <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-md flex items-center justify-center z-[1000] p-4 font-sans uppercase italic">
//       {!viewingUser ? (
//         <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
//       ) : (
//         <div className="w-full max-w-[420px] bg-slate-900/90 border border-white/10 rounded-[40px] overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.6)] animate-in zoom-in duration-300 text-white font-black tracking-tighter">
//           <div className="h-32 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 relative">
//             <button
//               onClick={onClose}
//               className="absolute top-6 right-6 w-10 h-10 bg-black/20 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-all backdrop-blur-md"
//             >
//               <FaTimes />
//             </button>
//           </div>

//           <div className="px-8 pb-10">
//             <div className="relative -top-16 mb-[-45px] flex justify-center">
//               <div className="relative group">
//                 <div className="absolute inset-0 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-[38px] blur-lg opacity-50 group-hover:opacity-100 transition-opacity"></div>
//                 <img
//                   src={
//                     (isEditing ? editForm.avatar : viewingUser.avatar) ||
//                     `https://ui-avatars.com/api/?name=${viewingUser.username}`
//                   }
//                   className="w-32 h-32 rounded-[35px] border-[5px] border-slate-900 object-cover relative z-10 shadow-2xl bg-slate-800 transition-all group-hover:scale-105"
//                   alt="avt"
//                 />
//                 {isEditing && (
//                   <div
//                     onClick={() => fileRef.current.click()}
//                     className="absolute inset-0 z-20 bg-black/60 rounded-[35px] flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-all border-2 border-white/20"
//                   >
//                     <FaCamera size={24} className="animate-bounce" />
//                     <input
//                       type="file"
//                       ref={fileRef}
//                       hidden
//                       onChange={handleAvatarChange}
//                       accept="image/*"
//                     />
//                   </div>
//                 )}
//               </div>
//             </div>

//             <div className="text-center mt-4 space-y-1">
//               <h2 className="text-2xl font-black flex items-center justify-center gap-2 uppercase italic">
//                 {viewingUser.displayName}{" "}
//                 {viewingUser.role === "admin" && (
//                   <FaShieldAlt className="text-red-500 animate-pulse" />
//                 )}
//               </h2>
//               <p className="text-purple-400 font-bold text-[10px] tracking-[3px] mb-8 opacity-60">
//                 @{viewingUser.username}
//               </p>

//               {!isMe && (
//                 <div className="flex justify-center gap-3 mb-8 pt-4">
//                   <button
//                     onClick={() => {
//                       onStartDM(viewingUser.username);
//                       onClose();
//                     }}
//                     className="flex-1 bg-white/10 hover:bg-indigo-600 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 border border-white/5"
//                   >
//                     <FaCommentDots className="inline mr-2" size={14} /> Nhắn tin
//                   </button>
//                   {isFriend ? (
//                     <button
//                       onClick={() => handleFriendAction("unfriend")}
//                       className="flex-1 bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-red-500/20 transition-all"
//                     >
//                       <FaUserMinus className="inline mr-2" /> Hủy bạn
//                     </button>
//                   ) : hasSentRequest ? (
//                     <button className="flex-1 bg-white/5 text-gray-500 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-white/5 cursor-default opacity-50">
//                       <FaClock className="inline mr-2" /> Chờ duyệt
//                     </button>
//                   ) : (
//                     <button
//                       onClick={() => handleFriendAction("request")}
//                       className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-purple-500/20 hover:scale-105 transition-all"
//                     >
//                       <FaUserPlus className="inline mr-2" /> Kết bạn
//                     </button>
//                   )}
//                 </div>
//               )}
//             </div>

//             <div className="mt-2">
//               {isEditing ? (
//                 <ProfileEdit
//                   editForm={editForm}
//                   setEditForm={setEditForm}
//                   setIsEditing={setIsEditing}
//                   handleUpdate={handleUpdate}
//                 />
//               ) : isChangingPass ? (
//                 /* ĐÃ FIX: Truyền handleChangePass vào return của modal */
//                 <ChangePassword
//                   setPassForm={setPassForm}
//                   passForm={passForm}
//                   setIsChangingPass={setIsChangingPass}
//                   handleChangePass={handleChangePass}
//                 />
//               ) : (
//                 <>
//                   <ProfileView viewingUser={viewingUser} />
//                   {isMe && (
//                     <div className="pt-8 space-y-3">
//                       <button
//                         onClick={() => setIsEditing(true)}
//                         className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase text-[10px] tracking-[3px] hover:bg-purple-500 hover:text-white transition-all transform active:scale-95 shadow-xl shadow-white/5"
//                       >
//                         <FaUserEdit className="inline mr-2" size={14} /> Cập
//                         nhật hồ sơ
//                       </button>
//                       <button
//                         onClick={() => setIsChangingPass(true)}
//                         className="w-full py-3.5 bg-white/5 border border-white/10 text-gray-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:text-white hover:bg-white/10 transition-all"
//                       >
//                         <FaLock className="inline mr-2" /> Đổi mật khẩu
//                       </button>
//                     </div>
//                   )}
//                 </>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default UserProfileModal;


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
            setIsEditing(false);
            setViewingUser(res.data);
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi cập nhật!');
        }
    };

    const handleChangePass = async () => {
        const { oldPassword, newPassword, confirmPassword } = passForm;
        if (!oldPassword || !newPassword || !confirmPassword)
            return alert('Vui lòng nhập đầy đủ mật khẩu!');
        if (newPassword !== confirmPassword)
            return alert('Mật khẩu xác nhận không khớp!');
        if (newPassword.length < 6)
            return alert('Mật khẩu mới phải từ 6 ký tự trở lên!');

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

    const handleFriendAction = async (action) => {
        try {
            if (action === "request") {
                await api.post("/friends/request", {
                    fromUser: currentUser.username,
                    toUser: targetUsername,
                });
                alert("Đã gửi yêu cầu kết bạn!");
            } else if (action === "unfriend") {
                if (!window.confirm("Xác nhận hủy kết bạn?")) return;
                await api.post("/friends/unfriend", {
                    me: currentUser.username,
                    friendUname: targetUsername,
                });
                alert("Đã hủy kết bạn!");
            } else if (action === "block") {
                if (!window.confirm(`Chặn @${targetUsername}? Họ sẽ không thể nhắn tin, gọi điện hoặc kết bạn với bạn.`)) return;
                await api.post("/friends/block", {
                    me: currentUser.username,
                    targetUsername: targetUsername,
                });
                alert("Đã chặn người dùng!");
            } else if (action === "unblock") {
                await api.post("/friends/unblock", {
                    me: currentUser.username,
                    targetUsername: targetUsername,
                });
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
                                <>
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
                                        <button onClick={() => handleFriendAction('unfriend')} className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-500/20 transition-all"><FaUserMinus className="inline mr-2"/> Hủy bạn</button>
                                    ) : (
                                        <button onClick={() => handleFriendAction('request')} className="bg-gradient-to-r from-purple-600 to-indigo-600 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-500/20 hover:scale-105 transition-all"><FaUserPlus className="inline mr-2"/> {hasSentRequest ? 'Đã gửi lời mời' : 'Kết bạn'}</button>
                                    )}
                                </div>
                                {/* P1: Block/Unblock button */}
                                <button 
                                    onClick={() => handleFriendAction(isBlocked ? 'unblock' : 'block')}
                                    className={`w-full py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border ${isBlocked ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500 hover:text-white' : 'bg-white/5 text-gray-500 border-white/5 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30'}`}
                                >
                                    {isBlocked ? 'Bỏ chặn người dùng' : 'Chặn người dùng'}
                                </button>
                                </>
                            )}
                        </div>

                        <div className="mt-2">
                            {isEditing ? (
                                <ProfileEdit editForm={editForm} setEditForm={setEditForm} setIsEditing={setIsEditing} handleUpdate={handleUpdate} />
                            ) : isChangingPass ? (
                                <ChangePassword setPassForm={setPassForm} passForm={passForm} setIsChangingPass={setIsChangingPass} handleChangePass={handleChangePass} />
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