import React from 'react';
import { FaPalette, FaTimes } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const WallpaperModal = ({
    isOpen,
    onClose,
    activeRoom,
    user,
    darkMode,
    currentWallpaper,
    setCurrentWallpaper,
    customWallpaperUrl,
    setCustomWallpaperUrl
}) => {
    if (!isOpen || !activeRoom) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[500] backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className={`w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border transition-all duration-300 ${darkMode ? 'bg-[#0f172a] border-white/10 text-white' : 'bg-white border-gray-200 text-slate-800'}`}>
                <div className="p-5 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-pink-500 to-indigo-600 text-white">
                    <h3 className="font-black uppercase tracking-widest text-[10px] flex items-center gap-2"><FaPalette size={14}/> Hình nền phòng chat</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"><FaTimes size={14}/></button>
                </div>
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide">
                    {/* Khung xem trước nhỏ (Mini Preview) */}
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-3 italic">Xem trước (Preview)</p>
                        <div 
                            className="h-28 rounded-2xl border border-white/10 shadow-inner flex items-end p-4 relative overflow-hidden bg-black/10"
                            style={currentWallpaper ? (
                                currentWallpaper.startsWith('http') || currentWallpaper.startsWith('data:image') || currentWallpaper.startsWith('/assets') || currentWallpaper.startsWith('blob:')
                                ? { backgroundImage: `url(${currentWallpaper})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }
                                : { background: currentWallpaper }
                            ) : undefined}
                        >
                            <div className="absolute inset-0 bg-black/10"></div>
                            <div className="bg-indigo-600 text-white text-[10px] px-3 py-1.5 rounded-xl font-bold max-w-[75%] shadow-lg relative z-10 leading-tight">
                                Hình nền phòng chat này sẽ được lưu riêng cho phòng này! ✨
                            </div>
                        </div>
                    </div>

                    {/* Màu sắc tối giản */}
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-3 italic">Màu sắc tinh tế (Solid Colors)</p>
                        <div className="grid grid-cols-5 gap-2">
                            {[
                                { name: 'Slate Gray', value: '#1e293b' },
                                { name: 'Midnight Blue', value: '#0f172a' },
                                { name: 'Dark Teal', value: '#064e3b' },
                                { name: 'Deep Burgundy', value: '#4c0519' },
                                { name: 'Plum Purple', value: '#2e1065' },
                            ].map(color => (
                                <button 
                                    key={color.value}
                                    onClick={() => {
                                        setCurrentWallpaper(color.value);
                                        localStorage.setItem(`chat_wallpaper_${user.username}_${activeRoom.id}`, color.value);
                                        toast.success("Đã áp dụng màu nền!");
                                    }}
                                    className="w-full aspect-square rounded-xl border border-white/10 hover:scale-105 active:scale-95 transition-all shadow-md"
                                    style={{ backgroundColor: color.value }}
                                    title={color.name}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Hiệu ứng Gradients */}
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-3 italic">Gradients Thời Thượng</p>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { name: 'Nordic Aurora', value: 'linear-gradient(135deg, #0f172a 0%, #115e59 100%)' },
                                { name: 'Sunset Velvet', value: 'linear-gradient(135deg, #31103f 0%, #742a2a 100%)' },
                                { name: 'Cyberpunk Dusk', value: 'linear-gradient(135deg, #1e1b4b 0%, #3b0764 100%)' },
                                { name: 'Deep Ocean', value: 'linear-gradient(135deg, #0f172a 0%, #0369a1 100%)' },
                                { name: 'Velvet Forest', value: 'linear-gradient(135deg, #022c22 0%, #047857 100%)' },
                                { name: 'Lavender Dusk', value: 'linear-gradient(135deg, #2d1b4e 0%, #581c87 100%)' },
                            ].map(grad => (
                                <button 
                                    key={grad.name}
                                    onClick={() => {
                                        setCurrentWallpaper(grad.value);
                                        localStorage.setItem(`chat_wallpaper_${user.username}_${activeRoom.id}`, grad.value);
                                        toast.success("Đã áp dụng hình nền Gradient!");
                                    }}
                                    className="w-full h-12 rounded-xl border border-white/10 hover:scale-105 active:scale-95 transition-all shadow-md"
                                    style={{ background: grad.value }}
                                    title={grad.name}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Link ảnh tùy chỉnh */}
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-3 italic">Link ảnh tùy chọn (Custom Image URL)</p>
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                placeholder="Dán URL hình ảnh từ Unsplash/Google..."
                                value={customWallpaperUrl}
                                onChange={(e) => setCustomWallpaperUrl(e.target.value)}
                                className={`flex-1 p-2.5 rounded-xl border text-xs font-bold outline-none transition-all ${darkMode ? 'bg-white/5 border-white/10 focus:border-indigo-500 text-white' : 'bg-slate-50 border-gray-200 focus:border-indigo-500'}`}
                            />
                            <button 
                                onClick={() => {
                                    if (customWallpaperUrl.trim()) {
                                        setCurrentWallpaper(customWallpaperUrl);
                                        localStorage.setItem(`chat_wallpaper_${user.username}_${activeRoom.id}`, customWallpaperUrl);
                                        toast.success("Đã áp dụng ảnh nền tùy chỉnh!");
                                    } else {
                                        toast.error("Vui lòng nhập URL hợp lệ");
                                    }
                                }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 shrink-0"
                            >
                                Áp dụng
                            </button>
                        </div>
                        <span className="text-[8px] text-gray-500 block mt-1.5">Gợi ý: Tìm ảnh đẹp trên Unsplash và copy link ảnh dán vào đây!</span>
                    </div>

                    {/* Reset Wallpaper */}
                    <div className="flex gap-3 border-t border-white/5 pt-4">
                        <button 
                            onClick={() => {
                                setCurrentWallpaper('');
                                setCustomWallpaperUrl('');
                                localStorage.removeItem(`chat_wallpaper_${user.username}_${activeRoom.id}`);
                                toast.success("Đã gỡ bỏ hình nền phòng chat!");
                            }}
                            className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-black uppercase tracking-wider py-3 rounded-xl transition-all active:scale-95"
                        >
                            Gỡ bỏ hình nền
                        </button>
                        <button 
                            onClick={onClose}
                            className={`flex-1 text-xs font-black uppercase tracking-wider py-3 rounded-xl transition-all active:scale-95 border ${darkMode ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10' : 'bg-slate-50 border-gray-200 text-slate-700 hover:bg-slate-100'}`}
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WallpaperModal;
