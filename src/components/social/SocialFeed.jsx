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
        <div className={`flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scrollbar-hide font-sans ${darkMode ? 'bg-transparent text-white' : 'bg-gray-50 text-slate-900'}`}>
            <div className="max-w-2xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className={`text-2xl font-bold flex items-center gap-3 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                        Bảng tin
                    </h1>
                    <button
                        onClick={fetchArchive}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all text-sm font-semibold shadow-sm ${darkMode ? 'bg-white/10 text-gray-300 hover:bg-white/20' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                    >
                        <FaHistory /> Kho lưu trữ
                    </button>
                </div>

                {/* Create Post */}
                <div className={`p-6 rounded-2xl border shadow-sm transition-all ${darkMode ? 'bg-[#1e293b] border-white/10' : 'bg-white border-gray-200'}`}>
                    <div className="flex gap-4">
                        <img src={`https://ui-avatars.com/api/?name=${user.username}`} className="w-10 h-10 rounded-full border border-gray-200 dark:border-white/10" alt="" />
                        <div className="flex-1 mt-1">
                            <textarea
                                value={postText}
                                onChange={e => setPostText(e.target.value)}
                                placeholder="Bạn đang nghĩ gì thế?"
                                className={`w-full bg-transparent border-none outline-none resize-none text-base font-medium min-h-[60px] ${darkMode ? 'text-white placeholder-gray-500' : 'text-slate-800 placeholder-gray-400'}`}
                            />
                        </div>
                    </div>

                    {postImage && (
                        <div className="relative mt-4 mb-4 group overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 max-h-[300px]">
                            <img src={postImage} className="w-full h-full object-cover" alt="" />
                            <button
                                onClick={() => setPostImage(null)}
                                className="absolute top-3 right-3 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-all opacity-0 group-hover:opacity-100 shadow-md"
                            >
                                <FaTrash size={12} />
                            </button>
                        </div>
                    )}

                    <div className={`flex flex-col sm:flex-row sm:items-center justify-between border-t pt-4 mt-2 gap-4 ${darkMode ? 'border-white/10' : 'border-gray-100'}`}>
                        <div className="flex items-center gap-4">
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
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm font-semibold ${darkMode ? 'text-gray-400 hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'}`}
                            >
                                <FaImage size={18} className={darkMode ? 'text-emerald-400' : 'text-emerald-500'} /> <span>Ảnh/Video</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-medium hidden sm:inline ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Quyền riêng tư:</span>
                                <select
                                    value={postPrivacy}
                                    onChange={e => setPostPrivacy(e.target.value)}
                                    className={`text-sm font-semibold rounded-lg px-2 py-1.5 outline-none cursor-pointer border transition-all ${darkMode ? 'bg-[#0f172a] border-white/10 text-gray-300 focus:border-indigo-500' : 'bg-gray-50 border-gray-200 text-slate-700 focus:border-indigo-500'}`}
                                >
                                    <option value="friends">👥 Bạn bè</option>
                                    <option value="public">🌐 Công khai</option>
                                    <option value="private">🔒 Chỉ mình tôi</option>
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={handleCreatePost}
                            disabled={loading || (!postText.trim() && !postImage)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                        >
                            {loading ? "Đang đăng..." : "Đăng bài"}
                        </button>
                    </div>
                </div>

                {/* Posts List */}
                <div className="space-y-6 pb-20">
                    {posts.length === 0 ? (
                        <div className="text-center py-20 opacity-50">
                            <FaSmile size={48} className="mx-auto mb-4 text-gray-400" />
                            <p className={`font-semibold text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Chưa có bài đăng nào. Hãy là người đầu tiên!</p>
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
                                    className={`p-5 md:p-6 rounded-2xl border transition-all hover:shadow-md relative ${darkMode ? 'bg-[#1e293b] border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}
                                >
                                    {/* Author & Timestamp */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <img src={`https://ui-avatars.com/api/?name=${post.username}`} className="w-10 h-10 rounded-full border border-gray-200 dark:border-white/10" alt="" />
                                            <div>
                                                <div className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>{post.username}</div>
                                                <div className={`text-xs flex items-center gap-1.5 mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    <span>{new Date(post.createdAt).toLocaleString()}</span>
                                                    {post.isEdited && <span className="text-[10px] bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded font-medium">Đã sửa</span>}
                                                    <span className="opacity-80 flex items-center ml-1" title={post.privacy === 'public' ? 'Công khai' : post.privacy === 'private' ? 'Chỉ mình tôi' : 'Bạn bè'}>
                                                        {post.privacy === 'public' && <FaGlobe size={10} />}
                                                        {post.privacy === 'private' && <FaLock size={10} />}
                                                        {(post.privacy === 'friends' || !post.privacy) && <FaUserFriends size={10} />}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Edit / Delete Options (ONLY for owner / admin) */}
                                        {(isPostOwner || isAdmin) && (
                                            <div className="flex items-center gap-1">
                                                {isPostOwner && (
                                                    <button
                                                        onClick={() => {
                                                            setEditingPostId(post.postId);
                                                            setEditingText(post.text);
                                                        }}
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${darkMode ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-slate-800'}`}
                                                        title="Sửa bài viết"
                                                    >
                                                        <FaEdit size={14} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeletePost(post.postId)}
                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${darkMode ? 'hover:bg-red-500/20 text-gray-400 hover:text-red-400' : 'hover:bg-red-50 text-gray-500 hover:text-red-600'}`}
                                                    title="Xóa bài viết"
                                                >
                                                    <FaTrash size={12} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Text content or Inline Edit Mode */}
                                    {editingPostId === post.postId ? (
                                        <div className="mb-4 space-y-3">
                                            <textarea
                                                value={editingText}
                                                onChange={e => setEditingText(e.target.value)}
                                                className={`w-full p-4 rounded-xl outline-none font-medium border resize-none min-h-[100px] text-sm ${darkMode ? 'bg-[#0f172a] border-white/10 text-white placeholder-gray-500 focus:border-indigo-500' : 'bg-gray-50 border-gray-200 text-slate-800 focus:border-indigo-500'}`}
                                            />
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setEditingPostId(null)}
                                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${darkMode ? 'text-gray-400 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'}`}
                                                >
                                                    Hủy
                                                </button>
                                                <button
                                                    onClick={() => handleEditPostSubmit(post.postId)}
                                                    className="px-5 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm"
                                                >
                                                    Lưu
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className={`text-sm md:text-base font-normal mb-4 whitespace-pre-wrap leading-relaxed ${darkMode ? 'text-gray-100' : 'text-slate-800'}`}>{post.text}</p>
                                    )}

                                    {/* Media Attachment */}
                                    {post.mediaUrl && (
                                        <div className={`rounded-xl border mb-4 overflow-hidden max-h-[500px] ${darkMode ? 'bg-black/40 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                                            <img src={post.mediaUrl} className="w-full h-full object-contain" alt="" />
                                        </div>
                                    )}

                                    {/* Reactions and Comments count bar */}
                                    {(reactionsList.length > 0 || commentsList.length > 0) && (
                                        <div className={`flex items-center justify-between text-xs py-3 border-b ${darkMode ? 'text-gray-400 border-white/10' : 'text-gray-500 border-gray-100'}`}>
                                            <div
                                                onClick={() => {
                                                    if (reactionsList.length > 0) {
                                                        setSelectedReactionsPost(post);
                                                        setShowReactionsModal(true);
                                                    }
                                                }}
                                                className="flex items-center gap-1.5 cursor-pointer hover:underline"
                                            >
                                                <div className="flex -space-x-1">
                                                    {reactionStats.map((st, i) => (
                                                        <span key={i} className="text-sm drop-shadow-sm">{st.emoji}</span>
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
                                    <div className="flex items-center gap-2 pt-2 relative mt-1">

                                        {/* Click-to-open Reaction Zone */}
                                        <div className="flex-1 relative">
                                            {/* Reactions floating popup */}
                                            {activeReactionPostId === post.postId && (
                                                <div
                                                    ref={reactionMenuRef}
                                                    className={`absolute bottom-full mb-3 left-1/2 -translate-x-1/2 p-2 rounded-full flex gap-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100 border ${darkMode ? 'bg-slate-800 border-white/10' : 'bg-white border-gray-200'}`}
                                                >
                                                    {['❤️', '👍', '😂', '😮', '😢'].map(emoji => (
                                                        <button
                                                            key={emoji}
                                                            onClick={() => handleReact(post.postId, emoji)}
                                                            className="text-2xl hover:scale-125 hover:-translate-y-1 transition-all active:scale-90"
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            <button
                                                onClick={() => setActiveReactionPostId(prev => prev === post.postId ? null : post.postId)}
                                                className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 transition-colors font-semibold text-sm ${userEmoji ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10' : (darkMode ? 'text-gray-400 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100')}`}
                                            >
                                                {userEmoji ? <span className="text-lg leading-none">{userEmoji}</span> : <FaRegHeart size={18} />}
                                                <span className="hidden sm:inline">{userEmoji ? 'Thích' : 'Thích'}</span>
                                            </button>
                                        </div>

                                        {/* Comments Toggle Button */}
                                        <button
                                            onClick={() => toggleComments(post.postId)}
                                            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors font-semibold text-sm ${showComments ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10' : (darkMode ? 'text-gray-400 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100')}`}
                                        >
                                            <FaComment size={18} />
                                            <span className="hidden sm:inline">Bình luận</span>
                                        </button>

                                        {/* Share Button */}
                                        <button
                                            onClick={() => setSharePost(post)}
                                            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors font-semibold text-sm ${darkMode ? 'text-gray-400 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'}`}
                                        >
                                            <FaShare size={18} />
                                            <span className="hidden sm:inline">Chia sẻ</span>
                                        </button>
                                    </div>

                                    {/* Expanded Comments Section */}
                                    {showComments && (
                                        <div className={`mt-3 pt-4 border-t space-y-4 ${darkMode ? 'border-white/10' : 'border-gray-100'}`}>
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
                                                        <div key={comment.commentId} className="space-y-1.5">
                                                            {/* Main Comment Bubble Layout */}
                                                            <div className="flex gap-2.5 items-start group relative">
                                                                <img src={`https://ui-avatars.com/api/?name=${comment.username}`} className="w-8 h-8 rounded-full shrink-0" alt="" />

                                                                <div className="flex-1 min-w-0">
                                                                    <div className={`px-4 py-2.5 rounded-2xl relative inline-block max-w-full ${darkMode ? 'bg-white/10' : 'bg-gray-100'}`}>
                                                                        <div className="flex items-center gap-2 mb-0.5">
                                                                            <span className={`font-bold text-xs ${darkMode ? 'text-white' : 'text-slate-800'}`}>{comment.username}</span>
                                                                        </div>

                                                                        {/* Comment Text or Comment Edit Mode */}
                                                                        {isEditingThisComment ? (
                                                                            <div className="mt-1 space-y-2">
                                                                                <input
                                                                                    type="text"
                                                                                    value={editingCommentText}
                                                                                    onChange={e => setEditingCommentText(e.target.value)}
                                                                                    className={`w-full px-3 py-1.5 rounded-lg border outline-none text-sm ${darkMode ? 'bg-[#0f172a] border-white/10 text-white focus:border-indigo-500' : 'bg-white border-gray-200 text-slate-900 focus:border-indigo-500'}`}
                                                                                    onKeyDown={e => e.key === 'Enter' && handleEditCommentSubmit(post.postId, comment.commentId)}
                                                                                />
                                                                                <div className="flex gap-2 justify-end">
                                                                                    <button
                                                                                        onClick={() => { setEditingCommentId(null); setEditingCommentPostId(null); }}
                                                                                        className="text-xs font-medium text-gray-500 hover:underline"
                                                                                    >
                                                                                        Hủy
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => handleEditCommentSubmit(post.postId, comment.commentId)}
                                                                                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                                                                    >
                                                                                        Lưu
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="space-y-1">
                                                                                {comment.text && <p className={`text-sm leading-relaxed break-words ${darkMode ? 'text-gray-200' : 'text-slate-800'}`}>{comment.text}</p>}

                                                                                {/* Comment Image Attachment */}
                                                                                {comment.mediaUrl && (
                                                                                    <div className="max-w-[200px] max-h-36 overflow-hidden rounded-xl mt-2">
                                                                                        <img src={comment.mediaUrl} className="w-full h-full object-contain" alt="" />
                                                                                    </div>
                                                                                )}

                                                                                {/* Comment Sticker Attachment */}
                                                                                {comment.stickerUrl && (
                                                                                    <div className="w-24 h-24 my-1 select-none">
                                                                                        <img src={comment.stickerUrl} className="w-full h-full object-contain" alt="sticker" />
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}

                                                                        {/* Comment Reactions Badge Pill */}
                                                                        {hasCommentReactions && (
                                                                            <div className={`absolute bottom-[-8px] right-2 px-1.5 py-0.5 rounded-full flex items-center gap-1 text-[10px] font-bold shadow-sm border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200 text-slate-600'}`}>
                                                                                <span className="flex -space-x-1">{commentReactions.map(r => r.emoji).filter((val, id, self) => self.indexOf(val) === id).map((emoji, i) => <span key={i} className="z-10 bg-white dark:bg-slate-700 rounded-full">{emoji}</span>)}</span>
                                                                                <span className="ml-0.5">{commentReactions.length}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Comment Footer Interaction Row */}
                                                                    <div className={`flex items-center gap-4 mt-1 px-2 text-xs font-semibold relative ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                        <span className="text-[10px] font-normal">{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

                                                                        {/* Comment Reaction Button */}
                                                                        <div className="relative">
                                                                            <button
                                                                                onClick={() => setActiveReactionCommentId(prev => prev === comment.commentId ? null : comment.commentId)}
                                                                                className={`hover:underline cursor-pointer ${userCommentReact ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''}`}
                                                                            >
                                                                                Thích
                                                                            </button>

                                                                            {/* Micro Comment Reaction Popup */}
                                                                            {activeReactionCommentId === comment.commentId && (
                                                                                <div className={`absolute bottom-full left-0 mb-2 p-1.5 rounded-full flex gap-1 shadow-lg z-50 border ${darkMode ? 'bg-slate-800 border-white/10' : 'bg-white border-gray-200'}`}>
                                                                                    {['❤️', '👍', '😂'].map(emoji => (
                                                                                        <button
                                                                                            key={emoji}
                                                                                            onClick={() => handleCommentReact(post.postId, comment.commentId, emoji)}
                                                                                            className="text-lg hover:scale-125 hover:-translate-y-1 transition-all active:scale-90"
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
                                                                    <div className="opacity-0 group-hover:opacity-100 flex items-center transition-opacity self-center shrink-0 -ml-1">
                                                                        {isCommentOwner && (
                                                                            <button
                                                                                onClick={() => {
                                                                                    setEditingCommentId(comment.commentId);
                                                                                    setEditingCommentPostId(post.postId);
                                                                                    setEditingCommentText(comment.text);
                                                                                }}
                                                                                className={`p-1.5 rounded-full transition-colors ${darkMode ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-slate-800 hover:bg-gray-100'}`}
                                                                                title="Sửa bình luận"
                                                                            >
                                                                                <FaEdit size={12} />
                                                                            </button>
                                                                        )}
                                                                        {(isCommentOwner || isCommentPostOwner) && (
                                                                            <button
                                                                                onClick={() => handleDeleteComment(post.postId, comment.commentId)}
                                                                                className={`p-1.5 rounded-full transition-colors ${darkMode ? 'text-gray-400 hover:text-red-400 hover:bg-white/10' : 'text-gray-400 hover:text-red-600 hover:bg-gray-100'}`}
                                                                                title="Xóa bình luận"
                                                                            >
                                                                                <FaTrash size={12} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Indented Replies List */}
                                                            {((comment.replies || []).length > 0 || isReplyOpen) && (
                                                                <div className={`ml-11 pl-2 border-l-2 space-y-2 mt-1 ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
                                                                    {/* Render existing replies */}
                                                                    {(comment.replies || []).map(reply => (
                                                                        <div key={reply.replyId} className="flex gap-2 items-start">
                                                                            <img src={`https://ui-avatars.com/api/?name=${reply.username}`} className="w-6 h-6 rounded-full shrink-0" alt="" />
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className={`px-3 py-2 rounded-2xl inline-block max-w-full ${darkMode ? 'bg-white/10' : 'bg-gray-100'}`}>
                                                                                    <span className={`font-bold text-xs mr-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>{reply.username}</span>
                                                                                    <span className={`text-xs break-words ${darkMode ? 'text-gray-200' : 'text-slate-800'}`}>{reply.text}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}

                                                                    {/* Inline Reply Input Field */}
                                                                    {isReplyOpen && (
                                                                        <div className="flex items-center gap-2 mt-2">
                                                                            <img src={`https://ui-avatars.com/api/?name=${user.username}`} className="w-6 h-6 rounded-full shrink-0" alt="" />
                                                                            <div className={`flex-1 flex items-center rounded-full px-3 py-1 border ${darkMode ? 'bg-[#0f172a] border-white/10' : 'bg-white border-gray-200'}`}>
                                                                                <input
                                                                                    type="text"
                                                                                    value={replyInputs[comment.commentId] || ""}
                                                                                    onChange={e => setReplyInputs(prev => ({ ...prev, [comment.commentId]: e.target.value }))}
                                                                                    onKeyDown={e => e.key === 'Enter' && handleReplySubmit(post.postId, comment.commentId)}
                                                                                    placeholder={`Phản hồi ${comment.username}...`}
                                                                                    className={`flex-1 bg-transparent border-none outline-none text-xs py-1 ${darkMode ? 'text-white placeholder-gray-500' : 'text-slate-800 placeholder-gray-400'}`}
                                                                                />
                                                                                <button
                                                                                    onClick={() => handleReplySubmit(post.postId, comment.commentId)}
                                                                                    className="text-indigo-500 hover:text-indigo-600 transition-colors p-1"
                                                                                >
                                                                                    <FaPaperPlane size={12} />
                                                                                </button>
                                                                            </div>
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
                                                <div className="relative inline-block mt-2 mb-1 group overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 max-h-[80px]">
                                                    <img src={commentImage[post.postId]} className="h-full object-cover max-h-[85px] rounded-xl" alt="" />
                                                    <button
                                                        onClick={() => setCommentImage(prev => ({ ...prev, [post.postId]: null }))}
                                                        className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors"
                                                    >
                                                        <FaTimes size={10} />
                                                    </button>
                                                </div>
                                            )}

                                            {/* Sticker Picker Popup */}
                                            {activeStickerPickerPostId === post.postId && (
                                                <div className="absolute right-0 bottom-full mb-3 z-[2000] shadow-xl">
                                                    <StickerPicker
                                                        onSelect={(url) => handleCommentSubmit(post.postId, url)}
                                                        darkMode={darkMode}
                                                        onClose={() => setActiveStickerPickerPostId(null)}
                                                    />
                                                </div>
                                            )}

                                            {/* Comment Input */}
                                            <div className="flex items-center gap-2 mt-2 relative">
                                                <img src={`https://ui-avatars.com/api/?name=${user.username}`} className="w-8 h-8 rounded-full hidden sm:block" alt="" />
                                                <div className={`flex-1 flex items-center rounded-full border px-2 ${darkMode ? 'bg-[#0f172a] border-white/10' : 'bg-gray-100 border-gray-200'}`}>
                                                    <input
                                                        type="text"
                                                        value={commentInputs[post.postId] || ""}
                                                        onChange={e => setCommentInputs(prev => ({ ...prev, [post.postId]: e.target.value }))}
                                                        onKeyDown={e => e.key === 'Enter' && handleCommentSubmit(post.postId)}
                                                        placeholder="Viết bình luận..."
                                                        className="flex-1 bg-transparent px-3 py-2 outline-none text-sm"
                                                    />

                                                    <div className="flex items-center gap-1">
                                                        {/* Sticker Picker Button */}
                                                        <button
                                                            onClick={() => setActiveStickerPickerPostId(prev => prev === post.postId ? null : post.postId)}
                                                            className={`p-2 rounded-full transition-colors ${activeStickerPickerPostId === post.postId ? 'text-indigo-500' : 'text-gray-400 hover:text-indigo-500 hover:bg-black/5 dark:hover:bg-white/5'}`}
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
                                                            className="p-2 rounded-full text-gray-400 hover:text-indigo-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                                            title="Đính kèm hình ảnh"
                                                        >
                                                            <FaImage size={18} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleCommentSubmit(post.postId)}
                                                    className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-colors shrink-0"
                                                >
                                                    <FaPaperPlane size={14} />
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
                <div className="fixed inset-0 bg-black/60 z-[3000] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className={`w-full max-w-4xl max-h-[80vh] rounded-2xl border shadow-xl overflow-hidden flex flex-col ${darkMode ? 'bg-[#1e293b] border-white/10' : 'bg-white border-gray-200'}`}>
                        <div className={`p-6 flex items-center justify-between border-b ${darkMode ? 'border-white/10' : 'border-gray-100'}`}>
                            <h2 className={`text-xl font-bold flex items-center gap-3 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                                <FaHistory className="text-indigo-600" /> Kho lưu trữ
                            </h2>
                            <button onClick={() => setShowArchive(false)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${darkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                                <FaTimes size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 md:grid-cols-4 gap-4 scrollbar-hide">
                            {archivedStories.length === 0 ? (
                                <div className={`col-span-full py-20 text-center font-medium text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                    Không có bài viết nào trong kho lưu trữ.
                                </div>
                            ) : (
                                archivedStories.map(story => (
                                    <div key={story.storyId} className={`group relative aspect-[9/16] rounded-xl overflow-hidden border transition-transform hover:-translate-y-1 cursor-pointer ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
                                        <img src={story.mediaUrl} className="w-full h-full object-cover" alt="" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                                            <p className="text-xs text-white font-semibold">{new Date(story.createdAt).toLocaleDateString()}</p>
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
                <div className="fixed inset-0 bg-black/60 z-[3000] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className={`w-full max-w-sm rounded-2xl border shadow-xl p-6 relative flex flex-col max-h-[80vh] ${darkMode ? 'bg-[#1e293b] border-white/10' : 'bg-white border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Chia sẻ bài viết</h3>
                            <button
                                onClick={() => setSharePost(null)}
                                className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'text-gray-400 hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'}`}
                            >
                                <FaTimes size={16} />
                            </button>
                        </div>
                        <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Chọn phòng chat hoặc bạn bè:</p>

                        <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide pr-1">
                            {myRooms.length === 0 ? (
                                <p className={`text-center py-6 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Chưa có phòng hội thoại nào</p>
                            ) : (
                                myRooms.map(room => (
                                    <div
                                        key={room.id}
                                        onClick={() => sharePostToRoom(room)}
                                        className={`p-3 rounded-xl flex items-center justify-between cursor-pointer border transition-colors ${darkMode ? 'bg-white/5 border-transparent hover:border-indigo-500/50 hover:bg-white/10' : 'bg-gray-50 border-transparent hover:border-indigo-200 hover:bg-indigo-50'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm ${room.isDM ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'}`}>
                                                {room.isDM ? <FaLock size={14} /> : <FaGlobe size={14} />}
                                            </div>
                                            <span className={`font-semibold text-sm truncate max-w-[200px] ${darkMode ? 'text-gray-200' : 'text-slate-700'}`}>{room.name}</span>
                                        </div>
                                        <FaChevronRight size={12} className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Reactions Details Modal */}
            {showReactionsModal && selectedReactionsPost && (
                <div className="fixed inset-0 bg-black/60 z-[3000] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className={`w-full max-w-sm rounded-2xl border shadow-xl p-6 relative flex flex-col max-h-[80vh] ${darkMode ? 'bg-[#1e293b] border-white/10' : 'bg-white border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                                Lượt cảm xúc ({selectedReactionsPost.reactions?.length || 0})
                            </h3>
                            <button
                                onClick={() => { setShowReactionsModal(false); setSelectedReactionsPost(null); }}
                                className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'text-gray-400 hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'}`}
                            >
                                <FaTimes size={16} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide">
                            {(selectedReactionsPost.reactions || []).map((reaction, index) => (
                                <div
                                    key={index}
                                    className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${darkMode ? 'bg-white/5 border-transparent hover:bg-white/10' : 'bg-gray-50 border-transparent hover:bg-gray-100'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={`https://ui-avatars.com/api/?name=${reaction.username}`}
                                            className="w-10 h-10 rounded-full border border-gray-200 dark:border-white/10"
                                            alt=""
                                        />
                                        <span className={`font-semibold text-sm ${darkMode ? 'text-gray-200' : 'text-slate-700'}`}>{reaction.username}</span>
                                    </div>
                                    <span className="text-xl">{reaction.emoji}</span>
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
