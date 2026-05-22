import React, { useState, useEffect, useRef } from 'react';
import {
    FaImage, FaPaperPlane, FaHeart, FaComment, FaShare, FaHistory,
    FaTrash, FaSmile, FaRegHeart, FaChevronRight, FaTimes, FaGlobe, FaLock, FaEdit,
    FaUserFriends
} from 'react-icons/fa';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { toast } from 'react-hot-toast';
import StickerPicker from '../chat/StickerPicker';

const SocialFeed = ({ user, darkMode }) => {
    const [posts, setPosts] = useState([]);
    const [postText, setPostText] = useState("");
    const [postImage, setPostImage] = useState(null);
    const [postPrivacy, setPostPrivacy] = useState("friends"); // 'public' | 'friends' | 'private'
    const [loading, setLoading] = useState(false);
    const [showArchive, setShowArchive] = useState(false);
    const [archivedStories, setArchivedStories] = useState([]);

    // UI Interaction States
    const [expandedComments, setExpandedComments] = useState({}); // { postId: boolean }
    const [commentInputs, setCommentInputs] = useState({}); // { postId: string }
    const [activeReactionPostId, setActiveReactionPostId] = useState(null); // Click to open reaction menu
    const [sharePost, setSharePost] = useState(null); // Post object currently being shared
    const [myRooms, setMyRooms] = useState([]); // List of rooms to share to

    // Edit Post States
    const [editingPostId, setEditingPostId] = useState(null);
    const [editingText, setEditingText] = useState("");

    // Edit Comment States
    const [editingCommentId, setEditingCommentId] = useState(null); // commentId
    const [editingCommentText, setEditingCommentText] = useState("");
    const [editingCommentPostId, setEditingCommentPostId] = useState(null); // postId

    // Reaction Details Modal State
    const [showReactionsModal, setShowReactionsModal] = useState(false);
    const [selectedReactionsPost, setSelectedReactionsPost] = useState(null);

    // Comment Attachments and Sticker States
    const [commentImage, setCommentImage] = useState({}); // { postId: base64 }
    const [activeStickerPickerPostId, setActiveStickerPickerPostId] = useState(null); // postId

    // Comment Reaction & Reply States
    const [activeReactionCommentId, setActiveReactionCommentId] = useState(null); // commentId
    const [activeReplyCommentId, setActiveReplyCommentId] = useState(null); // commentId
    const [replyInputs, setReplyInputs] = useState({}); // { commentId: string }

    const reactionMenuRef = useRef(null);
    const socket = getSocket();

    useEffect(() => {
        fetchPosts();
        fetchRooms();

        // Listen for real-time post updates
        socket.on('posts_updated', fetchPosts);

        // Click outside listener to close reaction menu
        const handleClickOutside = (event) => {
            if (reactionMenuRef.current && !reactionMenuRef.current.contains(event.target)) {
                setActiveReactionPostId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            socket.off('posts_updated', fetchPosts);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const fetchPosts = async () => {
        try {
            const res = await api.get(`/posts/list?friends=${user.friends?.join(',') || ''}`);
            setPosts(res.data);
        } catch (err) {
            console.error("Fetch posts error", err);
        }
    };

    const fetchRooms = async () => {
        try {
            // Get all groups
            const groupsRes = await api.get('/groups/all');
            const groups = groupsRes.data || [];

            // Format DMs and Groups for sharing
            const myGroups = groups.filter(g => g.members?.includes(user.username) || g.owner === user.username);
            const list = myGroups.map(g => ({
                id: g.groupId,
                name: g.groupName,
                isDM: false
            }));

            // Add DMs for friends
            if (user.friends) {
                user.friends.forEach(friend => {
                    const dmRoomId = `dm_${[user.username, friend].sort().join("_")}`;
                    list.push({
                        id: dmRoomId,
                        name: `@${friend}`,
                        isDM: true
                    });
                });
            }
            setMyRooms(list);
        } catch (err) {
            console.error("Fetch rooms for sharing error", err);
        }
    };

    const handleCreatePost = async () => {
        if (!postText.trim() && !postImage) return;
        setLoading(true);
        try {
            await api.post('/posts/create', {
                text: postText,
                mediaData: postImage,
                username: user.username,
                privacy: postPrivacy
            });
            setPostText("");
            setPostImage(null);
            setPostPrivacy("friends");
            fetchPosts();
            toast.success("Đã đăng bài viết mới!");
        } catch (err) {
            toast.error("Lỗi khi đăng bài");
        } finally {
            setLoading(false);
        }
    };

    // Optimistic Update for editing post
    const handleEditPostSubmit = async (postId) => {
        if (!editingText.trim()) return;

        const previousPosts = [...posts];

        // Optimistically update locally
        setPosts(prevPosts => prevPosts.map(p => {
            if (p.postId !== postId) return p;
            return { ...p, text: editingText.trim(), isEdited: true };
        }));

        setEditingPostId(null);

        try {
            await api.post('/posts/edit', { postId, text: editingText.trim() });
            toast.success("Đã cập nhật bài viết!");
        } catch (err) {
            setPosts(previousPosts);
            toast.error("Không thể chỉnh sửa bài viết");
        }
    };

    // Optimistic Update for deleting post
    const handleDeletePost = async (postId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này vĩnh viễn?")) return;

        const previousPosts = [...posts];

        // Optimistically remove from state
        setPosts(prevPosts => prevPosts.filter(p => p.postId !== postId));

        try {
            await api.post('/posts/delete', { postId });
            toast.success("Đã xóa bài viết!");
        } catch (err) {
            setPosts(previousPosts);
            toast.error("Không thể xóa bài viết");
        }
    };

    // Optimistic Update for Reactions (0ms lag!)
    const handleReact = async (postId, emoji) => {
        const previousPosts = [...posts];

        // Optimistically update the local React state immediately
        setPosts(prevPosts => prevPosts.map(post => {
            if (post.postId !== postId) return post;
            const reactions = [...(post.reactions || [])];
            const existingIdx = reactions.findIndex(r => r.username === user.username);
            if (existingIdx > -1) {
                if (reactions[existingIdx].emoji === emoji) {
                    reactions.splice(existingIdx, 1);
                } else {
                    reactions[existingIdx].emoji = emoji;
                }
            } else {
                reactions.push({ username: user.username, emoji });
            }
            return { ...post, reactions };
        }));

        setActiveReactionPostId(null); // Close popup immediately

        try {
            await api.post('/posts/react', { postId, username: user.username, emoji });
        } catch (err) {
            // Rollback if server fails
            setPosts(previousPosts);
            toast.error("Không thể thả cảm xúc");
        }
    };

    // Optimistic Update for comments (supports stickers, images, and text!)
    const handleCommentSubmit = async (postId, stickerUrl = null) => {
        const text = commentInputs[postId] || "";
        const attachedImg = commentImage[postId] || null;

        if (!text.trim() && !attachedImg && !stickerUrl) return;

        const previousPosts = [...posts];
        const tempCommentId = `temp_c_${Date.now()}`;
        const newComment = {
            commentId: tempCommentId,
            username: user.username,
            text: text.trim(),
            mediaUrl: attachedImg || "",
            stickerUrl: stickerUrl || "",
            reactions: [],
            replies: [],
            createdAt: new Date().toISOString()
        };

        // Update UI state instantly
        setPosts(prevPosts => prevPosts.map(post => {
            if (post.postId !== postId) return post;
            return {
                ...post,
                comments: [...(post.comments || []), newComment]
            };
        }));

        // FIX: corrected ReferenceError where post was not defined (using postId now!)
        setCommentInputs(prev => ({ ...prev, [postId]: "" }));
        setCommentImage(prev => ({ ...prev, [postId]: null }));
        setActiveStickerPickerPostId(null);

        try {
            await api.post('/posts/comment', {
                postId,
                username: user.username,
                text: text.trim(),
                mediaData: attachedImg,
                stickerUrl
            });
        } catch (err) {
            // Rollback on error
            setPosts(previousPosts);
            toast.error("Không thể gửi bình luận");
        }
    };

    // Optimistic Update for Comment Reactions
    const handleCommentReact = async (postId, commentId, emoji) => {
        const previousPosts = [...posts];

        setPosts(prevPosts => prevPosts.map(post => {
            if (post.postId !== postId) return post;
            return {
                ...post,
                comments: (post.comments || []).map(comment => {
                    if (comment.commentId !== commentId) return comment;
                    const reactions = [...(comment.reactions || [])];
                    const existingIdx = reactions.findIndex(r => r.username === user.username);
                    if (existingIdx > -1) {
                        if (reactions[existingIdx].emoji === emoji) {
                            reactions.splice(existingIdx, 1);
                        } else {
                            reactions[existingIdx].emoji = emoji;
                        }
                    } else {
                        reactions.push({ username: user.username, emoji });
                    }
                    return { ...comment, reactions };
                })
            };
        }));

        setActiveReactionCommentId(null);

        try {
            await api.post('/posts/comment/react', { postId, commentId, username: user.username, emoji });
        } catch (err) {
            setPosts(previousPosts);
            toast.error("Không thể thả cảm xúc bình luận");
        }
    };

    // Optimistic Update for Comment Reply
    const handleReplySubmit = async (postId, commentId) => {
        const text = replyInputs[commentId];
        if (!text || !text.trim()) return;

        const previousPosts = [...posts];
        const tempReplyId = `temp_reply_${Date.now()}`;
        const newReply = {
            replyId: tempReplyId,
            username: user.username,
            text: text.trim(),
            createdAt: new Date().toISOString()
        };

        setPosts(prevPosts => prevPosts.map(post => {
            if (post.postId !== postId) return post;
            return {
                ...post,
                comments: (post.comments || []).map(comment => {
                    if (comment.commentId !== commentId) return comment;
                    return {
                        ...comment,
                        replies: [...(comment.replies || []), newReply]
                    };
                })
            };
        }));

        setReplyInputs(prev => ({ ...prev, [commentId]: "" }));
        setActiveReplyCommentId(null);

        try {
            await api.post('/posts/comment/reply', { postId, commentId, username: user.username, text });
        } catch (err) {
            setPosts(previousPosts);
            toast.error("Không thể gửi phản hồi");
        }
    };

    // Optimistic Update for editing comment
    const handleEditCommentSubmit = async (postId, commentId) => {
        if (!editingCommentText.trim()) return;

        const previousPosts = [...posts];

        setPosts(prevPosts => prevPosts.map(post => {
            if (post.postId !== postId) return post;
            return {
                ...post,
                comments: (post.comments || []).map(c => {
                    if (c.commentId !== commentId) return c;
                    return { ...c, text: editingCommentText.trim(), isEdited: true };
                })
            };
        }));

        setEditingCommentId(null);
        setEditingCommentPostId(null);

        try {
            await api.post('/posts/comment/edit', { postId, commentId, text: editingCommentText.trim(), username: user.username });
            toast.success("Đã sửa bình luận!");
        } catch (err) {
            setPosts(previousPosts);
            toast.error("Không thể sửa bình luận");
        }
    };

    // Optimistic Update for comment deletion
    const handleDeleteComment = async (postId, commentId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa bình luận này?")) return;

        const previousPosts = [...posts];

        setPosts(prevPosts => prevPosts.map(post => {
            if (post.postId !== postId) return post;
            return {
                ...post,
                comments: (post.comments || []).filter(c => c.commentId !== commentId)
            };
        }));

        try {
            await api.post('/posts/comment/delete', { postId, commentId, username: user.username });
            toast.success("Đã xóa bình luận");
        } catch (err) {
            setPosts(previousPosts);
            toast.error("Không thể xóa bình luận");
        }
    };

    const toggleComments = (postId) => {
        setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
    };

    const fetchArchive = async () => {
        try {
            const res = await api.get('/stories/archive');
            setArchivedStories(res.data);
            setShowArchive(true);
        } catch (err) {
            toast.error("Lỗi khi tải kho lưu trữ");
        }
    };

    const sharePostToRoom = (room) => {
        if (!sharePost) return;
        try {
            const shareText = `📢 [Bài Viết Mới] @${sharePost.username}:\n"${sharePost.text.substring(0, 100)}${sharePost.text.length > 100 ? '...' : ''}"\n\n👉 Mở Bảng tin để xem chi tiết!`;

            socket.emit('send_message', {
                roomId: room.id,
                text: shareText,
                fileData: sharePost.mediaUrl || null,
                fileName: sharePost.mediaUrl ? 'SharedPostImage.jpg' : null,
                fileType: sharePost.mediaUrl ? 'image' : null,
                sender: user.displayName || user.username
            });

            toast.success(`Đã chia sẻ bài viết tới ${room.name}!`);
            setSharePost(null);
        } catch (err) {
            toast.error("Lỗi khi chia sẻ bài viết");
        }
    };

    const getReactionStats = (reactions = []) => {
        const counts = {};
        reactions.forEach(r => {
            counts[r.emoji] = (counts[r.emoji] || 0) + 1;
        });
        return Object.entries(counts).map(([emoji, count]) => ({ emoji, count }));
    };

    const getUserCurrentEmoji = (reactions = []) => {
        const match = reactions.find(r => r.username === user.username);
        return match ? match.emoji : null;
    };

    return (
        <div className={`flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scrollbar-hide ${darkMode ? 'bg-transparent text-white' : 'bg-gray-50 text-slate-900'}`}>
            <div className="max-w-2xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">Bảng tin</h1>
                    <button
                        onClick={fetchArchive}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-500 hover:text-white rounded-2xl transition-all font-black uppercase text-[10px] tracking-widest shadow-sm hover:shadow-indigo-500/25"
                    >
                        <FaHistory /> Kho lưu trữ
                    </button>
                </div>

                {/* Create Post */}
                <div className={`p-6 rounded-[32px] border shadow-2xl transition-all ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                    <div className="flex gap-4">
                        <img src={`https://ui-avatars.com/api/?name=${user.username}`} className="w-12 h-12 rounded-2xl border border-indigo-500/20" alt="" />
                        <div className="flex-1">
                            <textarea
                                value={postText}
                                onChange={e => setPostText(e.target.value)}
                                placeholder="Bạn đang nghĩ gì thế?"
                                className="w-full bg-transparent border-none outline-none resize-none text-lg font-medium placeholder-gray-500 min-h-[80px]"
                            />
                        </div>
                    </div>

                    {postImage && (
                        <div className="relative mt-4 mb-4 group overflow-hidden rounded-2xl border border-white/10 shadow-lg max-h-[300px]">
                            <img src={postImage} className="w-full h-full object-cover" alt="" />
                            <button
                                onClick={() => setPostImage(null)}
                                className="absolute top-3 right-3 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-all opacity-0 group-hover:opacity-100 shadow-md"
                            >
                                <FaTrash size={12} />
                            </button>
                        </div>
                    )}

                    <div className="flex items-center justify-between border-t border-slate-500/10 pt-4 mt-2">
                        <div
                            onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.onchange = (e) => {
                                    const file = e.target.files[0];
                                    const reader = new FileReader();
                                    reader.onloadend = () => setPostImage(reader.result);
                                    reader.readAsDataURL(file);
                                };
                                input.click();
                            }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-500 hover:text-indigo-500 hover:bg-indigo-500/5 cursor-pointer transition-all font-bold text-sm"
                        >
                            <FaImage size={20} /> <span>Ảnh/Video</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider hidden sm:inline">Quyền riêng tư:</span>
                            <select
                                value={postPrivacy}
                                onChange={e => setPostPrivacy(e.target.value)}
                                className={`text-xs font-bold rounded-xl px-2.5 py-1.5 outline-none cursor-pointer border transition-all ${darkMode ? 'bg-slate-800 border-white/10 text-indigo-400 focus:border-indigo-500' : 'bg-white border-gray-200 text-indigo-600 focus:border-indigo-500'}`}
                            >
                                <option value="friends">👥 Bạn bè</option>
                                <option value="public">🌐 Công khai</option>
                                <option value="private">🔒 Chỉ mình tôi</option>
                            </select>
                        </div>

                        <button
                            onClick={handleCreatePost}
                            disabled={loading}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {loading ? "Đang đăng..." : "Đăng bài"}
                        </button>
                    </div>
                </div>

                {/* Posts List */}
                <div className="space-y-6">
                    {posts.length === 0 ? (
                        <div className="text-center py-20 opacity-40">
                            <FaSmile size={48} className="mx-auto mb-4 animate-bounce text-indigo-500" />
                            <p className="font-black uppercase italic tracking-widest text-xs">Chưa có bài đăng nào. Hãy là người đầu tiên!</p>
                        </div>
                    ) : (
                        posts.map(post => {
                            const reactionsList = post.reactions || [];
                            const commentsList = post.comments || [];
                            const userEmoji = getUserCurrentEmoji(reactionsList);
                            const reactionStats = getReactionStats(reactionsList);
                            const showComments = expandedComments[post.postId];

                            // Fix Authorization Bug on frontend (Case-Insensitive Strict Check)
                            const postAuthor = String(post.username || '').trim().toLowerCase();
                            const currentUser = String(user?.username || '').trim().toLowerCase();
                            const isPostOwner = postAuthor === currentUser && currentUser !== '';
                            const isAdmin = String(user?.role || '').trim().toLowerCase() === 'admin';

                            return (
                                <div
                                    key={post.postId}
                                    className={`p-6 rounded-[32px] border transition-all animate-in fade-in slide-in-from-bottom-4 hover:shadow-2xl relative ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}
                                >
                                    {/* Author & Timestamp */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <img src={`https://ui-avatars.com/api/?name=${post.username}`} className="w-10 h-10 rounded-xl border border-indigo-500/20" alt="" />
                                            <div>
                                                <div className="font-black text-sm uppercase italic tracking-tight">@{post.username}</div>
                                                <div className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1.5 mt-0.5">
                                                    <span>{new Date(post.createdAt).toLocaleString()}</span>
                                                    {post.isEdited && <span className="text-[8px] bg-indigo-500/10 text-indigo-500 px-1 py-0.5 rounded font-black">Đã sửa</span>}
                                                    <span className="opacity-70 flex items-center" title={post.privacy === 'public' ? 'Công khai' : post.privacy === 'private' ? 'Chỉ mình tôi' : 'Bạn bè'}>
                                                        {post.privacy === 'public' && <FaGlobe size={10} className="text-indigo-500" />}
                                                        {post.privacy === 'private' && <FaLock size={10} className="text-red-500" />}
                                                        {(post.privacy === 'friends' || !post.privacy) && <FaUserFriends size={10} className="text-green-500" />}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Edit / Delete Options (ONLY for owner / admin) */}
                                        {(isPostOwner || isAdmin) && (
                                            <div className="flex items-center gap-2">
                                                {isPostOwner && (
                                                    <button
                                                        onClick={() => {
                                                            setEditingPostId(post.postId);
                                                            setEditingText(post.text);
                                                        }}
                                                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${darkMode ? 'bg-white/5 hover:bg-indigo-600/20 text-gray-400 hover:text-indigo-400' : 'bg-slate-100 hover:bg-indigo-50 text-gray-500 hover:text-indigo-600'}`}
                                                        title="Sửa bài viết"
                                                    >
                                                        <FaEdit size={13} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeletePost(post.postId)}
                                                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${darkMode ? 'bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400' : 'bg-slate-100 hover:bg-red-50 text-gray-500 hover:text-red-600'}`}
                                                    title="Xóa bài viết"
                                                >
                                                    <FaTrash size={11} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Text content or Inline Edit Mode */}
                                    {editingPostId === post.postId ? (
                                        <div className="mb-4 space-y-2">
                                            <textarea
                                                value={editingText}
                                                onChange={e => setEditingText(e.target.value)}
                                                className={`w-full p-4 rounded-2xl outline-none font-medium border resize-none min-h-[100px] ${darkMode ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-indigo-500/50' : 'bg-slate-100 border-gray-200 text-slate-900 focus:border-indigo-500'}`}
                                            />
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setEditingPostId(null)}
                                                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-slate-500/5 transition-all"
                                                >
                                                    Hủy
                                                </button>
                                                <button
                                                    onClick={() => handleEditPostSubmit(post.postId)}
                                                    className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all"
                                                >
                                                    Lưu thay đổi
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-lg font-medium mb-4 whitespace-pre-wrap leading-relaxed">{post.text}</p>
                                    )}

                                    {/* Media Attachment */}
                                    {post.mediaUrl && (
                                        <div className="rounded-2xl border border-white/10 mb-4 overflow-hidden shadow-xl max-h-[450px] bg-black/10">
                                            <img src={post.mediaUrl} className="w-full h-full object-contain" alt="" />
                                        </div>
                                    )}

                                    {/* Reactions and Comments count bar (Clickable to view detailed list of reactions) */}
                                    {(reactionsList.length > 0 || commentsList.length > 0) && (
                                        <div className="flex items-center justify-between text-xs text-gray-500 border-b border-slate-500/10 pb-3 mb-3 font-semibold">
                                            <div
                                                onClick={() => {
                                                    if (reactionsList.length > 0) {
                                                        setSelectedReactionsPost(post);
                                                        setShowReactionsModal(true);
                                                    }
                                                }}
                                                className="flex items-center gap-1.5 cursor-pointer hover:underline"
                                                title="Xem chi tiết những người đã thả cảm xúc"
                                            >
                                                <div className="flex -space-x-1">
                                                    {reactionStats.map((st, i) => (
                                                        <span key={i} className="text-sm drop-shadow-md">{st.emoji}</span>
                                                    ))}
                                                </div>
                                                <span>{reactionsList.length} lượt cảm xúc</span>
                                            </div>
                                            <button onClick={() => toggleComments(post.postId)} className="hover:underline">
                                                {commentsList.length} bình luận
                                            </button>
                                        </div>
                                    )}

                                    {/* Actions Row */}
                                    <div className="flex items-center gap-2 border-t border-slate-500/10 pt-2 relative">

                                        {/* Click-to-open Reaction Zone */}
                                        <div className="flex-1 relative">
                                            {/* Reactions floating popup */}
                                            {activeReactionPostId === post.postId && (
                                                <div
                                                    ref={reactionMenuRef}
                                                    className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md border border-white/10 p-2.5 rounded-2xl flex gap-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100"
                                                >
                                                    {['❤️', '🔥', '😂', '😮', '😢'].map(emoji => (
                                                        <button
                                                            key={emoji}
                                                            onClick={() => handleReact(post.postId, emoji)}
                                                            className="text-2xl hover:scale-125 transition-transform active:scale-90 duration-100"
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            <button
                                                onClick={() => setActiveReactionPostId(prev => prev === post.postId ? null : post.postId)}
                                                className={`w-full py-2.5 rounded-2xl flex items-center justify-center gap-2 transition-all font-black text-[11px] uppercase tracking-wider ${userEmoji ? 'text-indigo-400 bg-indigo-500/5' : 'text-gray-500 hover:text-indigo-400 hover:bg-slate-500/5'}`}
                                            >
                                                {userEmoji ? <span className="text-lg">{userEmoji}</span> : <FaRegHeart size={16} />}
                                                <span>{userEmoji ? 'Đã cảm xúc' : 'Cảm xúc'}</span>
                                            </button>
                                        </div>

                                        {/* Comments Toggle Button */}
                                        <button
                                            onClick={() => toggleComments(post.postId)}
                                            className={`flex-1 py-2.5 rounded-2xl flex items-center justify-center gap-2 transition-all font-black text-[11px] uppercase tracking-wider ${showComments ? 'text-indigo-400 bg-indigo-500/5' : 'text-gray-500 hover:text-indigo-400 hover:bg-slate-500/5'}`}
                                        >
                                            <FaComment size={16} />
                                            <span>Bình luận</span>
                                        </button>

                                        {/* Share Button */}
                                        <button
                                            onClick={() => setSharePost(post)}
                                            className="flex-1 py-2.5 rounded-2xl flex items-center justify-center gap-2 text-gray-500 hover:text-green-500 hover:bg-slate-500/5 transition-all font-black text-[11px] uppercase tracking-wider"
                                        >
                                            <FaShare size={15} />
                                            <span>Chia sẻ</span>
                                        </button>
                                    </div>

                                    {/* Expanded Comments Section */}
                                    {showComments && (
                                        <div className="mt-4 pt-4 border-t border-slate-500/10 space-y-4 animate-in fade-in duration-200">
                                            {/* List of Comments */}
                                            <div className="space-y-4 max-h-[400px] overflow-y-auto scrollbar-hide pr-1">
                                                {commentsList.map(comment => {
                                                    const isCommentOwner = String(comment.username || '').trim().toLowerCase() === currentUser;
                                                    const isCommentPostOwner = isPostOwner; // Only post owner or comment owner can delete
                                                    const isEditingThisComment = editingCommentId === comment.commentId && editingCommentPostId === post.postId;

                                                    const commentReactions = comment.reactions || [];
                                                    const userCommentReact = commentReactions.find(cr => cr.username === user.username)?.emoji;
                                                    const hasCommentReactions = commentReactions.length > 0;
                                                    const isReplyOpen = activeReplyCommentId === comment.commentId;

                                                    return (
                                                        <div key={comment.commentId} className="space-y-2">
                                                            {/* Main Comment Bubble Layout */}
                                                            <div className="flex gap-3 items-start group relative">
                                                                <img src={`https://ui-avatars.com/api/?name=${comment.username}`} className="w-8 h-8 rounded-xl border border-indigo-500/10 shrink-0" alt="" />

                                                                <div className="flex-1 min-w-0">
                                                                    <div className={`p-3 rounded-2xl border relative ${darkMode ? 'bg-slate-800/60 border-white/5' : 'bg-slate-100 border-gray-100'}`}>
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className="font-black text-xs uppercase italic">@{comment.username}</span>
                                                                            <span className="text-[8px] text-gray-500 font-bold uppercase">
                                                                                {new Date(comment.createdAt).toLocaleTimeString()}
                                                                                {comment.isEdited && <span className="ml-1 text-[7px] text-indigo-400 font-bold bg-indigo-500/10 px-1 py-0.2 rounded">Đã sửa</span>}
                                                                            </span>
                                                                        </div>

                                                                        {/* Comment Text or Comment Edit Mode */}
                                                                        {isEditingThisComment ? (
                                                                            <div className="mt-1 space-y-2">
                                                                                <input
                                                                                    type="text"
                                                                                    value={editingCommentText}
                                                                                    onChange={e => setEditingCommentText(e.target.value)}
                                                                                    className={`w-full px-3 py-1.5 rounded-xl border outline-none text-xs ${darkMode ? 'bg-[#0f172a] border-white/10 text-white focus:border-indigo-500/50' : 'bg-white border-gray-200 text-slate-900 focus:border-indigo-500'}`}
                                                                                    onKeyDown={e => e.key === 'Enter' && handleEditCommentSubmit(post.postId, comment.commentId)}
                                                                                />
                                                                                <div className="flex gap-2 justify-end">
                                                                                    <button
                                                                                        onClick={() => { setEditingCommentId(null); setEditingCommentPostId(null); }}
                                                                                        className="text-[9px] font-bold text-gray-500 hover:underline"
                                                                                    >
                                                                                        Hủy
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => handleEditCommentSubmit(post.postId, comment.commentId)}
                                                                                        className="text-[9px] font-black text-indigo-500 hover:underline uppercase"
                                                                                    >
                                                                                        Lưu
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="space-y-2">
                                                                                {comment.text && <p className="text-sm font-medium leading-relaxed break-words">{comment.text}</p>}

                                                                                {/* Comment Image Attachment */}
                                                                                {comment.mediaUrl && (
                                                                                    <div className="max-w-[200px] max-h-36 overflow-hidden rounded-xl border border-white/10 shadow-sm mt-1 bg-black/10">
                                                                                        <img src={comment.mediaUrl} className="w-full h-full object-contain" alt="" />
                                                                                    </div>
                                                                                )}

                                                                                {/* Comment Sticker Attachment */}
                                                                                {comment.stickerUrl && (
                                                                                    <div className="w-24 h-24 my-1 select-none animate-pulse">
                                                                                        <img src={comment.stickerUrl} className="w-full h-full object-contain" alt="sticker" />
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}

                                                                        {/* Comment Reactions Badge Pill */}
                                                                        {hasCommentReactions && (
                                                                            <div className={`absolute bottom-[-10px] right-3 px-2 py-0.5 rounded-full flex items-center gap-1 text-[9px] font-bold shadow-md border ${darkMode ? 'bg-[#0f172a] border-white/10 text-gray-400' : 'bg-white border-gray-200 text-slate-500'}`}>
                                                                                <span>{commentReactions.map(r => r.emoji).filter((val, id, self) => self.indexOf(val) === id).join('')}</span>
                                                                                <span>{commentReactions.length}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Comment Footer Interaction Row */}
                                                                    <div className="flex items-center gap-4 mt-1 px-1.5 text-[10px] font-bold text-gray-500 relative">

                                                                        {/* Comment Reaction Button */}
                                                                        <div className="relative">
                                                                            <button
                                                                                onClick={() => setActiveReactionCommentId(prev => prev === comment.commentId ? null : comment.commentId)}
                                                                                className={`hover:underline cursor-pointer ${userCommentReact ? 'text-indigo-400 font-black' : ''}`}
                                                                            >
                                                                                {userCommentReact ? `Cảm xúc (${userCommentReact})` : 'Cảm xúc'}
                                                                            </button>

                                                                            {/* Micro Comment Reaction Popup */}
                                                                            {activeReactionCommentId === comment.commentId && (
                                                                                <div className="absolute bottom-full left-0 mb-2 bg-slate-900 border border-white/10 p-1.5 rounded-xl flex gap-2 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-100">
                                                                                    {['❤️', '🔥', '😂'].map(emoji => (
                                                                                        <button
                                                                                            key={emoji}
                                                                                            onClick={() => handleCommentReact(post.postId, comment.commentId, emoji)}
                                                                                            className="text-lg hover:scale-125 transition-transform"
                                                                                        >
                                                                                            {emoji}
                                                                                        </button>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Comment Reply Toggle Button */}
                                                                        <button
                                                                            onClick={() => setActiveReplyCommentId(prev => prev === comment.commentId ? null : comment.commentId)}
                                                                            className="hover:underline cursor-pointer"
                                                                        >
                                                                            Phản hồi
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {/* Edit/Delete comment triggers */}
                                                                {!isEditingThisComment && (
                                                                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity self-center shrink-0">
                                                                        {isCommentOwner && (
                                                                            <button
                                                                                onClick={() => {
                                                                                    setEditingCommentId(comment.commentId);
                                                                                    setEditingCommentPostId(post.postId);
                                                                                    setEditingCommentText(comment.text);
                                                                                }}
                                                                                className="text-gray-500 hover:text-indigo-400 p-1"
                                                                                title="Sửa bình luận"
                                                                            >
                                                                                <FaEdit size={11} />
                                                                            </button>
                                                                        )}
                                                                        {(isCommentOwner || isCommentPostOwner) && (
                                                                            <button
                                                                                onClick={() => handleDeleteComment(post.postId, comment.commentId)}
                                                                                className="text-gray-500 hover:text-red-500 p-1"
                                                                                title="Xóa bình luận"
                                                                            >
                                                                                <FaTrash size={10} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Indented Replies List */}
                                                            {((comment.replies || []).length > 0 || isReplyOpen) && (
                                                                <div className="ml-10 pl-4 border-l border-slate-500/10 space-y-3 mt-2">
                                                                    {/* Render existing replies */}
                                                                    {(comment.replies || []).map(reply => (
                                                                        <div key={reply.replyId} className="flex gap-2.5 items-start">
                                                                            <img src={`https://ui-avatars.com/api/?name=${reply.username}`} className="w-6 h-6 rounded-lg border border-indigo-500/10 shrink-0" alt="" />
                                                                            <div className={`p-2.5 rounded-xl border flex-1 min-w-0 ${darkMode ? 'bg-slate-800/40 border-white/5' : 'bg-slate-50 border-gray-100'}`}>
                                                                                <div className="flex items-center gap-2 mb-0.5">
                                                                                    <span className="font-black text-[10px] uppercase italic">@{reply.username}</span>
                                                                                    <span className="text-[7px] text-gray-500 font-bold uppercase">{new Date(reply.createdAt).toLocaleTimeString()}</span>
                                                                                </div>
                                                                                <p className="text-xs font-medium text-slate-300 break-words leading-relaxed">{reply.text}</p>
                                                                            </div>
                                                                        </div>
                                                                    ))}

                                                                    {/* Inline Reply Input Field */}
                                                                    {isReplyOpen && (
                                                                        <div className="flex items-center gap-2 mt-2">
                                                                            <input
                                                                                type="text"
                                                                                value={replyInputs[comment.commentId] || ""}
                                                                                onChange={e => setReplyInputs(prev => ({ ...prev, [comment.commentId]: e.target.value }))}
                                                                                onKeyDown={e => e.key === 'Enter' && handleReplySubmit(post.postId, comment.commentId)}
                                                                                placeholder={`Phản hồi @${comment.username}...`}
                                                                                className={`flex-1 px-3 py-2 rounded-xl outline-none text-xs border ${darkMode ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-indigo-500/50' : 'bg-slate-100 border-gray-200 text-slate-900 focus:border-indigo-500'}`}
                                                                            />
                                                                            <button
                                                                                onClick={() => handleReplySubmit(post.postId, comment.commentId)}
                                                                                className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-all shrink-0"
                                                                            >
                                                                                <FaPaperPlane size={10} />
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Comment attached image thumbnail preview */}
                                            {commentImage[post.postId] && (
                                                <div className="relative inline-block mt-2 mb-1 group overflow-hidden rounded-xl border border-white/10 max-h-[80px]">
                                                    <img src={commentImage[post.postId]} className="h-full object-cover max-h-[85px] rounded-xl" alt="" />
                                                    <button
                                                        onClick={() => setCommentImage(prev => ({ ...prev, [post.postId]: null }))}
                                                        className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-all opacity-80"
                                                    >
                                                        <FaTimes size={8} />
                                                    </button>
                                                </div>
                                            )}

                                            {/* Sticker Picker Popup */}
                                            {activeStickerPickerPostId === post.postId && (
                                                <div className="absolute right-0 bottom-full mb-3 z-[2000] shadow-2xl">
                                                    <StickerPicker
                                                        onSelect={(url) => handleCommentSubmit(post.postId, url)}
                                                        darkMode={darkMode}
                                                        onClose={() => setActiveStickerPickerPostId(null)}
                                                    />
                                                </div>
                                            )}

                                            {/* Comment Input */}
                                            <div className="flex items-center gap-2 mt-2 relative">
                                                <input
                                                    type="text"
                                                    value={commentInputs[post.postId] || ""}
                                                    onChange={e => setCommentInputs(prev => ({ ...prev, [post.postId]: e.target.value }))}
                                                    onKeyDown={e => e.key === 'Enter' && handleCommentSubmit(post.postId)}
                                                    placeholder="Viết bình luận của bạn..."
                                                    className={`flex-1 px-4 py-3 rounded-2xl outline-none text-sm transition-all border ${darkMode ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-indigo-500/50' : 'bg-slate-100 border-gray-200 text-slate-900 focus:border-indigo-500'}`}
                                                />

                                                {/* Sticker Picker Button */}
                                                <button
                                                    onClick={() => setActiveStickerPickerPostId(prev => prev === post.postId ? null : post.postId)}
                                                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${activeStickerPickerPostId === post.postId ? 'bg-indigo-600/20 text-indigo-400' : 'bg-slate-500/5 text-gray-500 hover:text-indigo-400'}`}
                                                    title="Gửi sticker"
                                                >
                                                    <FaSmile size={18} />
                                                </button>

                                                {/* Image attachment button */}
                                                <button
                                                    onClick={() => {
                                                        const input = document.createElement('input');
                                                        input.type = 'file';
                                                        input.accept = 'image/*';
                                                        input.onchange = (e) => {
                                                            const file = e.target.files[0];
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => setCommentImage(prev => ({ ...prev, [post.postId]: reader.result }));
                                                            reader.readAsDataURL(file);
                                                        };
                                                        input.click();
                                                    }}
                                                    className="w-10 h-10 rounded-2xl bg-slate-500/5 text-gray-500 hover:text-indigo-400 flex items-center justify-center transition-all"
                                                    title="Đính kèm hình ảnh"
                                                >
                                                    <FaImage size={17} />
                                                </button>

                                                <button
                                                    onClick={() => handleCommentSubmit(post.postId)}
                                                    className="w-10 h-10 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-all shadow-md shrink-0"
                                                >
                                                    <FaPaperPlane size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Archive Modal */}
            {showArchive && (
                <div className="fixed inset-0 bg-black/90 z-[3000] flex items-center justify-center p-4 backdrop-blur-2xl">
                    <div className={`w-full max-w-4xl max-h-[80vh] rounded-[40px] border shadow-2xl overflow-hidden flex flex-col ${darkMode ? 'bg-[#1e293b] border-white/10' : 'bg-white border-gray-200'}`}>
                        <div className="p-8 border-b border-white/5 flex items-center justify-between">
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3"><FaHistory className="text-indigo-500" /> Kho lưu trữ khoảnh khắc</h2>
                            <button onClick={() => setShowArchive(false)} className="w-12 h-12 bg-white/5 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-all font-black text-xl">×</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-2 md:grid-cols-4 gap-6 scrollbar-hide">
                            {archivedStories.length === 0 ? (
                                <div className="col-span-full py-20 text-center opacity-40 font-black uppercase text-xs italic tracking-widest">Không có khoảnh khắc nào được lưu trữ</div>
                            ) : (
                                archivedStories.map(story => (
                                    <div key={story.storyId} className="group relative aspect-[9/16] rounded-3xl overflow-hidden border border-white/10 shadow-xl bg-black/20 hover:scale-105 transition-all cursor-pointer">
                                        <img src={story.mediaUrl} className="w-full h-full object-cover" alt="" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                                            <p className="text-[10px] text-white font-black uppercase italic">{new Date(story.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Share to Chat Modal */}
            {sharePost && (
                <div className="fixed inset-0 bg-black/80 z-[3000] flex items-center justify-center p-4 backdrop-blur-md">
                    <div className={`w-full max-w-md rounded-[32px] border shadow-2xl p-6 relative ${darkMode ? 'bg-[#1e293b] border-white/10' : 'bg-white border-gray-200'}`}>
                        <button
                            onClick={() => setSharePost(null)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-red-500 p-1"
                        >
                            <FaTimes size={18} />
                        </button>
                        <h3 className="text-xl font-black uppercase italic tracking-tighter mb-4 text-indigo-500">Chia sẻ tới cuộc hội thoại</h3>
                        <p className="text-xs text-gray-500 font-semibold mb-4 uppercase">Chọn một phòng chat hoặc bạn bè để chia sẻ bài viết này:</p>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-hide pr-1">
                            {myRooms.length === 0 ? (
                                <p className="text-center py-6 text-sm text-gray-500 font-bold italic">Chưa tìm thấy phòng hội thoại nào</p>
                            ) : (
                                myRooms.map(room => (
                                    <div
                                        key={room.id}
                                        onClick={() => sharePostToRoom(room)}
                                        className={`p-3 rounded-2xl flex items-center justify-between cursor-pointer border hover:scale-[1.02] transition-all ${darkMode ? 'bg-white/5 border-white/5 hover:bg-indigo-600/20 hover:border-indigo-600/30' : 'bg-slate-50 border-slate-200 hover:bg-indigo-50 hover:border-indigo-300'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${room.isDM ? 'bg-indigo-600/10 text-indigo-500' : 'bg-emerald-600/10 text-emerald-500'}`}>
                                                {room.isDM ? <FaLock size={12} /> : <FaGlobe size={13} />}
                                            </div>
                                            <span className="font-bold text-sm truncate max-w-[200px]">{room.name}</span>
                                        </div>
                                        <FaChevronRight size={12} className="text-gray-500" />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Reactions Details Modal */}
            {showReactionsModal && selectedReactionsPost && (
                <div className="fixed inset-0 bg-black/80 z-[3000] flex items-center justify-center p-4 backdrop-blur-md">
                    <div className={`w-full max-w-sm rounded-[32px] border shadow-2xl p-6 relative ${darkMode ? 'bg-[#1e293b] border-white/10 text-white' : 'bg-white border-gray-200 text-slate-800'}`}>
                        <button
                            onClick={() => { setShowReactionsModal(false); setSelectedReactionsPost(null); }}
                            className="absolute top-4 right-4 text-gray-500 hover:text-red-500 p-1"
                        >
                            <FaTimes size={18} />
                        </button>
                        <h3 className="text-xl font-black uppercase italic tracking-tighter mb-4 text-indigo-500 flex items-center gap-2">
                            ❤️ Lượt cảm xúc ({selectedReactionsPost.reactions?.length || 0})
                        </h3>

                        <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-hide">
                            {(selectedReactionsPost.reactions || []).map((reaction, index) => (
                                <div
                                    key={index}
                                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${darkMode ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={`https://ui-avatars.com/api/?name=${reaction.username}`}
                                            className="w-9 h-9 rounded-xl border border-indigo-500/20"
                                            alt=""
                                        />
                                        <span className="font-black text-sm uppercase italic">@{reaction.username}</span>
                                    </div>
                                    <span className="text-2xl drop-shadow-md">{reaction.emoji}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SocialFeed;
