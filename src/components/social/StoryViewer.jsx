import React, { useState, useEffect } from 'react';
import { FaTimes, FaHeart, FaChevronLeft, FaChevronRight, FaTrash } from 'react-icons/fa';

const StoryViewer = ({ stories, username, currentUser, onClose, onReact, onDelete, onNext, darkMode }) => {
    const [index, setIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    const current = stories[index];
    const isOwner = currentUser?.username === username;

    useEffect(() => {
        const duration = 5000; // 5s per story
        const step = 100 / (duration / 50);
        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    if (index < stories.length - 1) {
                        setIndex(i => i + 1);
                        return 0;
                    }
                    return 100;
                }
                return prev + step;
            });
        }, 50);
        return () => clearInterval(timer);
    }, [index, stories.length]);

    useEffect(() => {
        if (!current) {
            onClose();
        } else if (index === stories.length - 1 && progress >= 100) {
            if (onNext) onNext();
            else onClose();
        }
    }, [current, index, progress, stories.length, onClose, onNext]);

    if (!current) return null;

    return (
        <div className="fixed inset-0 bg-black/95 z-[2000] flex items-center justify-center backdrop-blur-3xl animate-in fade-in duration-300">
            {/* Progress Bars */}
            <div className="absolute top-6 left-6 right-6 flex gap-2 z-50">
                {stories.map((_, i) => (
                    <div key={i} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-indigo-500 transition-all duration-75 ease-linear"
                            style={{ width: i < index ? '100%' : i === index ? `${progress}%` : '0%' }}
                        ></div>
                    </div>
                ))}
            </div>

            {/* Header */}
            <div className="absolute top-12 left-8 right-8 flex justify-between items-center z-50">
                <div className="flex items-center gap-3">
                    <img src={`https://ui-avatars.com/api/?name=${username}`} className="w-10 h-10 rounded-xl border border-white/20" alt=""/>
                    <div>
                        <div className="font-black text-white text-sm uppercase italic">@{username}</div>
                        <div className="text-[10px] text-white/60 font-bold uppercase">{new Date(current.createdAt).toLocaleTimeString()}</div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {isOwner && (
                        <button 
                            onClick={() => onDelete(current.storyId)}
                            className="w-10 h-10 rounded-full bg-red-500/20 hover:bg-red-500 flex items-center justify-center text-white transition-all shadow-lg"
                            title="Xóa khoảnh khắc"
                        >
                            <FaTrash size={14}/>
                        </button>
                    )}
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"><FaTimes/></button>
                </div>
            </div>

            {/* Content */}
            <div className="relative w-full max-w-lg h-full md:h-[80vh] flex items-center justify-center group">
                <img src={current.mediaUrl} className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl" alt=""/>
                
                {current.caption && (
                    <div className="absolute bottom-20 left-10 right-10 p-6 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 text-center">
                        <p className="text-white font-medium text-lg italic tracking-tight">{current.caption}</p>
                    </div>
                )}

                {/* Navigation */}
                <button 
                    onClick={() => { if(index > 0) { setIndex(index-1); setProgress(0); } }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <FaChevronLeft/>
                </button>
                <button 
                    onClick={() => { if(index < stories.length - 1) { setIndex(index+1); setProgress(0); } else if(onNext) onNext(); else onClose(); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <FaChevronRight/>
                </button>
            </div>

            {/* Reactions */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-6 z-50 w-full px-10">
                {/* Reactions Count */}
                {current.reactions && current.reactions.length > 0 && (
                    <div className="flex gap-2 flex-wrap justify-center">
                        {current.reactions.map((r, i) => (
                            <div key={i} className="flex items-center gap-1 bg-white/10 backdrop-blur-md px-2 py-1 rounded-full text-[10px] text-white">
                                <span>{r.emoji}</span>
                                <span className="font-black">@{r.username}</span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex gap-4">
                    {['❤️', '🔥', '😂', '😮', '😢'].map(emoji => (
                        <button 
                            key={emoji} 
                            onClick={() => onReact(current.storyId, emoji)}
                            className="text-3xl hover:scale-125 transition-transform drop-shadow-lg"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StoryViewer;
