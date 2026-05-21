import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';

const SoundSettingsModal = ({ isOpen, onClose, darkMode, playNotificationSound }) => {
    const [notificationSound, setNotificationSound] = useState(localStorage.getItem('alertSound') || 'telegram');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[999] backdrop-blur-md p-4 animate-in zoom-in-95" onClick={onClose}>
            <div
                className={`w-[360px] rounded-3xl p-6 shadow-2xl border transition-all duration-300 ${darkMode ? 'bg-slate-900 border-white/10 text-white shadow-[0_0_50px_rgba(99,102,241,0.15)]' : 'bg-white border-gray-100 text-slate-800'}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <div className="flex flex-col text-left">
                        <span className="text-xs font-black uppercase text-indigo-500 tracking-wider">Tùy chọn hệ thống</span>
                        <h2 className="text-lg font-black uppercase tracking-tighter italic flex items-center gap-2">Nhạc chuông báo ♪</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition-colors p-1.5 bg-white/5 rounded-xl"><FaTimes size={16} /></button>
                </div>
                <p className={`text-[10px] font-medium mb-4 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Chọn nhạc chuông yêu thích được tổng hợp trực tiếp từ Web Audio API:</p>

                <div className="space-y-2">
                    {[
                        { id: 'telegram', label: 'Telegram Bell', desc: 'Âm chuông cao vút, thanh lịch' },
                        { id: 'zalo', label: 'Zalo Chirp', desc: 'Tiếng kêu kép nhịp điệu sinh động' },
                        { id: 'discord', label: 'Discord Beep', desc: 'Âm báo đúp đôi đặc trưng' },
                        { id: 'retro', label: 'Retro Laser', desc: 'Phong cách máy game thùng 8-bit' },
                        { id: 'nokia', label: 'Nokia Tune', desc: 'Giai điệu monophonic cổ điển' }
                    ].map(sound => (
                        <button
                            key={sound.id}
                            onClick={() => {
                                setNotificationSound(sound.id);
                                localStorage.setItem('alertSound', sound.id);
                                playNotificationSound(sound.id);
                            }}
                            className={`w-full p-3 rounded-2xl border text-left transition-all duration-200 flex flex-col gap-0.5 ${notificationSound === sound.id
                                ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400 font-bold scale-[1.02] shadow-lg shadow-indigo-500/5'
                                : 'bg-white/5 border-white/5 hover:border-white/10 text-gray-400 hover:text-white'
                                }`}
                        >
                            <div className="flex justify-between items-center w-full">
                                <span className="text-xs font-black uppercase tracking-wider">{sound.label}</span>
                                {notificationSound === sound.id && <span className="text-[10px] font-black uppercase bg-indigo-500 text-white px-2 py-0.5 rounded-lg shadow-md animate-pulse">Đang chọn</span>}
                            </div>
                            <span className="text-[9px] opacity-75 font-serif italic">{sound.desc}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SoundSettingsModal;