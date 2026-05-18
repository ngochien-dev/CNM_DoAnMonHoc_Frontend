import React, { useState, useEffect, useRef } from 'react';
import { 
    FaImage, FaPaperPlane, FaHeart, FaComment, FaShare, FaHistory, 
    FaTrash, FaSmile, FaRegHeart, FaChevronRight, FaTimes, FaGlobe, FaLock
} from 'react-icons/fa';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { toast } from 'react-hot-toast';

const SocialFeed = ({ user, darkMode }) => {
    const [posts, setPosts] = useState([]);
    const [postText, setPostText] = useState("");
    const [postImage, setPostImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showArchive, setShowArchive] = useState(false);
    const [archivedStories, setArchivedStories] = useState([]);
    
    // UI Interaction States
    const [expandedComments, setExpandedComments] = useState({}); // { postId: boolean }
    const [commentInputs, setCommentInputs] = useState({}); // { postId: string }
    const [activeReactionPostId, setActiveReactionPostId] = useState(null); // Click to open reaction menu
    const [sharePost, setSharePost] = useState(null); // Post object currently being shared
    const [myRooms, setMyRooms] = useState([]); // List of rooms to share to

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
                username: user.username
            });
            setPostText("");
            setPostImage(null);
            fetchPosts();
            toast.success("Đã đăng bài viết mới!");
        } catch (err) {
            toast.error("Lỗi khi đăng bài");
        } finally {
            setLoading(false);
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

    // Optimistic Update for comments
    const handleCommentSubmit = async (postId) => {
        const text = commentInputs[postId];
        if (!text || !text.trim()) return;

        const previousPosts = [...posts];
        const tempCommentId = `temp_${Date.now()}`;
        const newComment = {
            commentId: tempCommentId,
            username: user.username,
            text: text.trim(),
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

        try {
            await api.post('/posts/comment', { postId, username: user.username, text });
        } catch (err) {
            // Rollback on error
            setPosts(previousPosts);
            toast.error("Không thể gửi bình luận");
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
                        <FaHistory/> Kho lưu trữ
                    </button>
                </div>

                {/* Create Post */}
                <div className={`p-6 rounded-[32px] border shadow-2xl transition-all ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                    <div className="flex gap-4">
                        <img src={`https://ui-avatars.com/api/?name=${user.username}`} className="w-12 h-12 rounded-2xl border border-indigo-500/20" alt=""/>
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
                            <img src={postImage} className="w-full h-full object-cover" alt=""/>
                            <button 
                                onClick={() => setPostImage(null)} 
                                className="absolute top-3 right-3 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-all opacity-0 group-hover:opacity-100 shadow-md"
                            >
                                <FaTrash size={12}/>
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
                            <FaImage size={20}/> <span>Ảnh/Video</span>
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
                            <FaSmile size={48} className="mx-auto mb-4 animate-bounce text-indigo-500"/>
                            <p className="font-black uppercase italic tracking-widest text-xs">Chưa có bài đăng nào. Hãy là người đầu tiên!</p>
                        </div>
                    ) : (
                        posts.map(post => {
                            const reactionsList = post.reactions || [];
                            const commentsList = post.comments || [];
                            const userEmoji = getUserCurrentEmoji(reactionsList);
                            const reactionStats = getReactionStats(reactionsList);
                            const showComments = expandedComments[post.postId];

                            return (
                                <div 
                                    key={post.postId} 
                                    className={`p-6 rounded-[32px] border transition-all animate-in fade-in slide-in-from-bottom-4 hover:shadow-2xl relative ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}
                                >
                                    {/* Author & Timestamp */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <img src={`https://ui-avatars.com/api/?name=${post.username}`} className="w-10 h-10 rounded-xl border border-indigo-500/20" alt=""/>
                                        <div>
                                            <div className="font-black text-sm uppercase italic tracking-tight">@{post.username}</div>
                                            <div className="text-[10px] text-gray-500 font-bold uppercase">{new Date(post.createdAt).toLocaleString()}</div>
                                        </div>
                                    </div>

                                    {/* Text content */}
                                    <p className="text-lg font-medium mb-4 whitespace-pre-wrap leading-relaxed">{post.text}</p>
                                    
                                    {/* Media Attachment */}
                                    {post.mediaUrl && (
                                        <div className="rounded-2xl border border-white/10 mb-4 overflow-hidden shadow-xl max-h-[450px] bg-black/10">
                                            <img src={post.mediaUrl} className="w-full h-full object-contain" alt=""/>
                                        </div>
                                    )}

                                    {/* Reactions and Comments count bar */}
                                    {(reactionsList.length > 0 || commentsList.length > 0) && (
                                        <div className="flex items-center justify-between text-xs text-gray-500 border-b border-slate-500/10 pb-3 mb-3 font-semibold">
                                            <div className="flex items-center gap-1.5">
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
                                                {userEmoji ? <span className="text-lg">{userEmoji}</span> : <FaRegHeart size={16}/>}
                                                <span>{userEmoji ? 'Đã cảm xúc' : 'Cảm xúc'}</span>
                                            </button>
                                        </div>

                                        {/* Comments Toggle Button */}
                                        <button 
                                            onClick={() => toggleComments(post.postId)}
                                            className={`flex-1 py-2.5 rounded-2xl flex items-center justify-center gap-2 transition-all font-black text-[11px] uppercase tracking-wider ${showComments ? 'text-indigo-400 bg-indigo-500/5' : 'text-gray-500 hover:text-indigo-400 hover:bg-slate-500/5'}`}
                                        >
                                            <FaComment size={16}/>
                                            <span>Bình luận</span>
                                        </button>

                                        {/* Share Button */}
                                        <button 
                                            onClick={() => setSharePost(post)}
                                            className="flex-1 py-2.5 rounded-2xl flex items-center justify-center gap-2 text-gray-500 hover:text-green-500 hover:bg-slate-500/5 transition-all font-black text-[11px] uppercase tracking-wider"
                                        >
                                            <FaShare size={15}/>
                                            <span>Chia sẻ</span>
                                        </button>
                                    </div>

                                    {/* Expanded Comments Section */}
                                    {showComments && (
                                        <div className="mt-4 pt-4 border-t border-slate-500/10 space-y-4 animate-in fade-in duration-200">
                                            {/* List of Comments */}
                                            <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-hide">
                                                {commentsList.map(comment => {
                                                    const isCommentOwner = comment.username === user.username;
                                                    const isPostOwner = post.username === user.username;

                                                    return (
                                                        <div key={comment.commentId} className="flex gap-3 items-start group relative bg-slate-500/5 p-3 rounded-2xl border border-white/5">
                                                            <img src={`https://ui-avatars.com/api/?name=${comment.username}`} className="w-8 h-8 rounded-xl border border-indigo-500/10" alt=""/>
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-0.5">
                                                                    <span className="font-black text-xs uppercase italic">@{comment.username}</span>
                                                                    <span className="text-[8px] text-gray-500 font-bold uppercase">{new Date(comment.createdAt).toLocaleTimeString()}</span>
                                                                </div>
                                                                <p className="text-sm font-medium text-slate-300 leading-relaxed">{comment.text}</p>
                                                            </div>
                                                            
                                                            {/* Delete Comment Button */}
                                                            {(isCommentOwner || isPostOwner) && (
                                                                <button 
                                                                    onClick={() => handleDeleteComment(post.postId, comment.commentId)}
                                                                    className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500 transition-opacity p-1"
                                                                    title="Xóa bình luận"
                                                                >
                                                                    <FaTrash size={10}/>
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Comment Input */}
                                            <div className="flex items-center gap-2 mt-2">
                                                <input 
                                                    type="text" 
                                                    value={commentInputs[post.postId] || ""}
                                                    onChange={e => setCommentInputs(prev => ({ ...prev, [post.postId]: e.target.value }))}
                                                    onKeyDown={e => e.key === 'Enter' && handleCommentSubmit(post.postId)}
                                                    placeholder="Viết bình luận của bạn..."
                                                    className={`flex-1 px-4 py-3 rounded-2xl outline-none text-sm transition-all border ${darkMode ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-indigo-500/50' : 'bg-slate-100 border-gray-200 text-slate-900 focus:border-indigo-500'}`}
                                                />
                                                <button 
                                                    onClick={() => handleCommentSubmit(post.postId)}
                                                    className="w-10 h-10 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-all shadow-md"
                                                >
                                                    <FaPaperPlane size={12}/>
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
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3"><FaHistory className="text-indigo-500"/> Kho lưu trữ khoảnh khắc</h2>
                            <button onClick={() => setShowArchive(false)} className="w-12 h-12 bg-white/5 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-all font-black text-xl">×</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-2 md:grid-cols-4 gap-6 scrollbar-hide">
                            {archivedStories.length === 0 ? (
                                <div className="col-span-full py-20 text-center opacity-40 font-black uppercase text-xs italic tracking-widest">Không có khoảnh khắc nào được lưu trữ</div>
                            ) : (
                                archivedStories.map(story => (
                                    <div key={story.storyId} className="group relative aspect-[9/16] rounded-3xl overflow-hidden border border-white/10 shadow-xl bg-black/20 hover:scale-105 transition-all cursor-pointer">
                                        <img src={story.mediaUrl} className="w-full h-full object-cover" alt=""/>
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
                            <FaTimes size={18}/>
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
                                                {room.isDM ? <FaLock size={12}/> : <FaGlobe size={13}/>}
                                            </div>
                                            <span className="font-bold text-sm truncate max-w-[200px]">{room.name}</span>
                                        </div>
                                        <FaChevronRight size={12} className="text-gray-500"/>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SocialFeed;
