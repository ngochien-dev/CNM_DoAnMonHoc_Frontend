import React from 'react';
import { FaTimes } from 'react-icons/fa';

const STICKER_PACKS = [
    {
        name: "Corgi",
        stickers: [
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHY5bnp4YnN4YnN4YnN4YnN4YnN4YnN4YnN4YnN4YnN4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1z/3o7TKVUn7iM8FMEU24/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHY5bnp4YnN4YnN4YnN4YnN4YnN4YnN4YnN4YnN4YnN4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1z/3o7TKMGpxr9V3pQo76/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHY5bnp4YnN4YnN4YnN4YnN4YnN4YnN4YnN4YnN4YnN4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1z/3o7TKVXvFfFfFfFfFf/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHY5bnp4YnN4YnN4YnN4YnN4YnN4YnN4YnN4YnN4YnN4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1z/3o7TKVUn7iM8FMEU24/giphy.gif"
        ]
    },
    {
        name: "Meow",
        stickers: [
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHY5bnp4YnN4YnN4YnN4YnN4YnN4YnN4YnN4YnN4YnN4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1z/3o7TKMGpxr9V3pQo76/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHY5bnp4YnN4YnN4YnN4YnN4YnN4YnN4YnN4YnN4YnN4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1z/3o7TKVXvFfFfFfFfFf/giphy.gif"
        ]
    }
];

const StickerPicker = ({ onSelect, darkMode, onClose }) => {
    return (
        <div className={`w-[320px] h-[400px] flex flex-col rounded-[30px] shadow-2xl overflow-hidden border animate-in zoom-in-95 ${darkMode ? 'bg-[#0f172a] border-white/10' : 'bg-white border-gray-200'}`}>
            <div className={`p-4 border-b flex justify-between items-center ${darkMode ? 'border-white/5' : 'border-gray-100'}`}>
                <h3 className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Stickers</h3>
                <button onClick={onClose} className="text-gray-500 hover:text-red-500"><FaTimes/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
                {STICKER_PACKS.map(pack => (
                    <div key={pack.name}>
                        <h4 className="text-[10px] font-bold uppercase opacity-40 mb-3">{pack.name}</h4>
                        <div className="grid grid-cols-3 gap-3">
                            {pack.stickers.map((url, i) => (
                                <div 
                                    key={i} 
                                    onClick={() => onSelect(url)}
                                    className={`aspect-square rounded-xl cursor-pointer transition-all hover:scale-110 active:scale-95 flex items-center justify-center p-2 ${darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                                >
                                    <img src={url} alt="sticker" className="max-w-full max-h-full object-contain" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StickerPicker;
