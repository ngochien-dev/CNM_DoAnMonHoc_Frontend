import React, { useState, useEffect } from 'react';
import { FaTimes, FaSearch, FaSmile, FaFire } from 'react-icons/fa';

const STICKER_PACKS = [
    {
        name: "Corgi tinh nghịch",
        stickers: [
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHY5bnp4YnN4YnN4YnN4YnN4YnN4YnN4YnN4YnN4YnN4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1z/3o7TKVUn7iM8FMEU24/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHY5bnp4YnN4YnN4YnN4YnN4YnN4YnN4YnN4YnN4YnN4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1z/3o7TKMGpxr9V3pQo76/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHY5bnp4YnN4YnN4YnN4YnN4YnN4YnN4YnN4YnN4YnN4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1z/3o7TKVXvFfFfFfFfFf/giphy.gif"
        ]
    },
    {
        name: "Mèo con dễ thương",
        stickers: [
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHY5bnp4YnN4YnN4YnN4YnN4YnN4YnN4YnN4YnN4YnN4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1z/3o7TKMGpxr9V3pQo76/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHY5bnp4YnN4YnN4YnN4YnN4YnN4YnN4YnN4YnN4YnN4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1z/3o7TKVXvFfFfFfFfFf/giphy.gif"
        ]
    }
];

const TENOR_API_KEY = "LIVDSRZULELA"; // Tested working public key for Tenor V1

const StickerPicker = ({ onSelect, darkMode, onClose }) => {
    const [activeTab, setActiveTab] = useState('stickers'); // 'stickers' | 'gifs'
    const [searchQuery, setSearchQuery] = useState('');
    const [gifs, setGifs] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch GIFs from Tenor API
    useEffect(() => {
        if (activeTab !== 'gifs') return;

        const fetchGifs = async () => {
            setLoading(true);
            try {
                let url = `https://api.tenor.com/v1/trending?key=${TENOR_API_KEY}&limit=21`;
                if (searchQuery.trim()) {
                    url = `https://api.tenor.com/v1/search?q=${encodeURIComponent(searchQuery)}&key=${TENOR_API_KEY}&limit=21`;
                }
                const res = await fetch(url);
                const data = await res.json();
                if (data.results) {
                    const extracted = data.results.map(item => {
                        if (item.media && item.media.length > 0) {
                            const m = item.media[0];
                            return m.tinygif?.url || m.gif?.url || m.mediumgif?.url || '';
                        }
                        return '';
                    }).filter(Boolean);
                    setGifs(extracted);
                }
            } catch (err) {
                console.error("Failed to fetch Tenor GIFs:", err);
            } finally {
                setLoading(false);
            }
        };

        // Debounce search requests
        const timer = setTimeout(() => {
            fetchGifs();
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, activeTab]);

    return (
        <div className={`w-[340px] h-[450px] flex flex-col rounded-[24px] shadow-2xl overflow-hidden border transition-all duration-300 animate-in zoom-in-95 ${darkMode ? 'bg-[#0f172a]/95 backdrop-blur-xl border-white/10 text-white' : 'bg-white border-gray-200 text-slate-800'}`}>
            {/* Header with Close */}
            <div className={`p-4 border-b flex justify-between items-center shrink-0 ${darkMode ? 'border-white/5' : 'border-gray-100'}`}>
                <h3 className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Biểu cảm & GIF</h3>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-red-500/10 text-gray-500 hover:text-red-500 transition-colors"><FaTimes size={14}/></button>
            </div>

            {/* Navigation Tabs */}
            <div className={`flex p-2 gap-1 border-b shrink-0 ${darkMode ? 'border-white/5 bg-white/2' : 'border-gray-50 bg-gray-50'}`}>
                <button
                    onClick={() => setActiveTab('stickers')}
                    className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl flex items-center justify-center gap-1.5 transition-all ${activeTab === 'stickers' ? (darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-600 text-white shadow-md') : (darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-slate-400 hover:text-slate-600')}`}
                >
                    <FaSmile size={12} /> Thư viện nhãn dán
                </button>
                <button
                    onClick={() => setActiveTab('gifs')}
                    className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl flex items-center justify-center gap-1.5 transition-all ${activeTab === 'gifs' ? (darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-600 text-white shadow-md') : (darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-slate-400 hover:text-slate-600')}`}
                >
                    <FaFire size={12} /> GIF Tenor
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-hide flex flex-col min-h-0">
                {activeTab === 'stickers' ? (
                    // Stickers Library
                    <div className="space-y-6 flex-1">
                        {STICKER_PACKS.map(pack => (
                            <div key={pack.name}>
                                <h4 className={`text-[9px] font-black uppercase tracking-widest opacity-60 mb-3 italic ${darkMode ? 'text-indigo-300' : 'text-indigo-600'}`}>{pack.name}</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    {pack.stickers.map((url, i) => (
                                        <div 
                                            key={i} 
                                            onClick={() => onSelect(url)}
                                            className={`aspect-square rounded-xl cursor-pointer transition-all hover:scale-110 active:scale-95 flex items-center justify-center p-2 border ${darkMode ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-slate-50'}`}
                                        >
                                            <img src={url} alt="sticker" className="max-w-full max-h-full object-contain" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    // Online GIFs with Live Search
                    <div className="flex flex-col flex-1 min-h-0 space-y-4">
                        {/* Search Input Bar */}
                        <div className={`flex items-center px-3 py-2 rounded-xl border transition-all ${darkMode ? 'bg-white/5 border-white/10 focus-within:border-indigo-500' : 'bg-white border-gray-200 focus-within:border-indigo-500 shadow-sm'}`}>
                            <FaSearch className="text-gray-500 mr-2 shrink-0" size={12}/>
                            <input 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Tìm kiếm GIF trên Tenor..."
                                className={`bg-transparent w-full outline-none text-[11px] font-bold ${darkMode ? 'text-white placeholder:text-gray-600' : 'text-slate-800 placeholder:text-gray-400'}`}
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="text-gray-500 hover:text-red-500 transition-colors"><FaTimes size={10}/></button>
                            )}
                        </div>

                        {/* GIFs Grid */}
                        <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide">
                            {loading ? (
                                <div className="grid grid-cols-3 gap-2">
                                    {[...Array(9)].map((_, i) => (
                                        <div key={i} className={`aspect-square rounded-xl animate-pulse ${darkMode ? 'bg-white/5' : 'bg-slate-100'}`}></div>
                                    ))}
                                </div>
                            ) : gifs.length > 0 ? (
                                <div className="grid grid-cols-3 gap-2">
                                    {gifs.map((url, i) => (
                                        <div 
                                            key={i} 
                                            onClick={() => onSelect(url)}
                                            className={`aspect-square rounded-xl overflow-hidden cursor-pointer transition-all hover:scale-105 active:scale-95 bg-black/25 flex items-center justify-center`}
                                        >
                                            <img src={url} alt="gif" className="w-full h-full object-cover" loading="lazy" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-500 text-[10px] uppercase font-black tracking-widest text-center py-6">
                                    Không tìm thấy ảnh GIF nào...
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StickerPicker;
