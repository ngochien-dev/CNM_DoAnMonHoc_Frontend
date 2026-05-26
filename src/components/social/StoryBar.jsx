import React, { useState, useEffect } from 'react';
import { FaPlus, FaCircle } from 'react-icons/fa';
import api from '../../services/api';
import { getSocket } from '../../services/socket';

const socket = getSocket();

const StoryBar = ({ user, friends, onlineUsers, onOpenStory, onUploadStory, darkMode }) => {
    const [stories, setStories] = useState({});

    // Dùng string key thay vì array để tránh re-fetch loop do reference thay đổi
    const friendsKey = Array.isArray(friends) ? friends.join(',') : '';

    useEffect(() => {
        const fetchStories = async () => {
            // Guard: không gọi API khi friends rỗng → tránh ?friends= gây 500
            if (!friendsKey) return;
            try {
                const res = await api.get(`/stories/list?friends=${friendsKey}`);
                setStories(res.data);
            } catch (e) {
                console.error("Story fetch error", e);
            }
        };
        if (user) fetchStories();

        if (socket) {
            socket.on('stories_updated', fetchStories);
            return () => socket.off('stories_updated', fetchStories);
        }
    }, [user, friendsKey]); // eslint-disable-line react-hooks/exhaustive-deps

    const storyUsers = Object.keys(stories);

    return (
        <div className={`flex gap-4 p-4 overflow-x-auto scrollbar-hide border-b ${darkMode ? 'border-white/5 bg-[#1e293b]/20' : 'border-gray-100 bg-gray-50/50'}`}>
            {/* My Story / Add button */}
            <div className="flex flex-col items-center gap-2 shrink-0 group">
                <div 
                    onClick={onUploadStory}
                    className="w-14 h-14 rounded-[22px] border-2 border-dashed border-indigo-500/50 flex items-center justify-center cursor-pointer group-hover:border-indigo-500 group-hover:bg-indigo-500/10 transition-all relative overflow-hidden"
                >
                    <img 
                        src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}`} 
                        className="w-full h-full object-cover opacity-40 group-hover:opacity-100 transition-opacity" 
                        alt=""
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-indigo-500 group-hover:text-white transition-colors">
                        <FaPlus size={20} className="drop-shadow-lg"/>
                    </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-tighter opacity-60">Bạn</span>
            </div>

            {/* Friends' Stories */}
            {storyUsers.map(uname => {
                const userStories = stories[uname];
                const online = onlineUsers[uname];
                return (
                    <div 
                        key={uname} 
                        onClick={() => userStories && userStories.length > 0 && onOpenStory(uname, userStories, stories)}
                        className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group"
                    >
                        <div className="w-14 h-14 p-0.5 rounded-[22px] border-2 border-indigo-500 group-hover:scale-105 transition-all">
                            <img 
                                src={online?.avatar || `https://ui-avatars.com/api/?name=${uname}`} 
                                className="w-full h-full object-cover rounded-[20px]" 
                                alt=""
                            />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-tighter truncate w-14 text-center">
                            @{uname}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

export default StoryBar;
