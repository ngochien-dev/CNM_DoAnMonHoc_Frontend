import React, { useState } from 'react';
import { FaTimes, FaSun, FaMoon, FaVolumeUp, FaPalette } from 'react-icons/fa';

const SoundSettingsModal = ({ isOpen, onClose, darkMode, setDarkMode, playNotificationSound }) => {
    const [notificationSound, setNotificationSound] = useState(localStorage.getItem('alertSound') || 'telegram');

    if (!isOpen) return null;

    const handleThemeToggle = (isDark) => {
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        if (setDarkMode) setDarkMode(isDark);
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[999] backdrop-blur-sm p-4 animate-in zoom-in-95" onClick={onClose}>
            <div
                className={`w-[400px] max-h-[85vh] overflow-y-auto scrollbar-hide rounded-2xl p-6 shadow-2xl border transition-all duration-300 ${darkMode ? 'bg-[#0f172a] border-white/10 text-white' : 'bg-white border-gray-200 text-slate-800'}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                            <FaPalette size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Cài đặt ứng dụng</h2>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Tùy chỉnh trải nghiệm cá nhân</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-gray-500/10 rounded-xl"><FaTimes size={18} /></button>
                </div>

                {/* Giao diện */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <FaSun className="text-amber-500" />
                        <h3 className="font-semibold text-sm">Giao diện</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => handleThemeToggle(false)}
                            className={`p-4 rounded-2xl border flex flex-col items-center gap-3 transition-all ${!darkMode ? 'border-indigo-500 bg-indigo-50 text-indigo-600 shadow-sm' : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'}`}
                        >
                            <FaSun size={24} className={!darkMode ? 'text-amber-500' : ''} />
                            <span className="font-medium text-sm">Sáng</span>
                        </button>
                        <button
                            onClick={() => handleThemeToggle(true)}
                            className={`p-4 rounded-2xl border flex flex-col items-center gap-3 transition-all ${darkMode ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 shadow-sm' : 'border-gray-200 bg-gray-50 text-slate-500 hover:bg-gray-100'}`}
                        >
                            <FaMoon size={24} className={darkMode ? 'text-indigo-400' : ''} />
                            <span className="font-medium text-sm">Tối</span>
                        </button>
                    </div>
                </div>

                {/* Âm thanh */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <FaVolumeUp className="text-indigo-500" />
                        <h3 className="font-semibold text-sm">Nhạc chuông thông báo</h3>
                    </div>

                    <div className="space-y-2">
                        {[
                            { id: 'telegram', label: 'Telegram Bell', desc: 'Âm chuông cao vút, thanh lịch' },
                            { id: 'zalo', label: 'Zalo Chirp', desc: 'Tiếng kêu kép nhịp điệu sinh động' },
                            { id: 'discord', label: 'Discord Beep', desc: 'Âm báo đúp đôi đặc trưng' },
                            { id: 'retro', label: 'Retro Laser', desc: 'Phong cách máy game thùng 8-bit' },
                            { id: 'nokia', label: 'Nokia Tune', desc: 'Giai điệu điện thoại cổ điển' }
                        ].map(sound => (
                            <button
                                key={sound.id}
                                onClick={() => {
                                    setNotificationSound(sound.id);
                                    localStorage.setItem('alertSound', sound.id);
                                    playNotificationSound(sound.id);
                                }}
                                className={`w-full p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col gap-1 ${notificationSound === sound.id
                                    ? (darkMode ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 'bg-indigo-50 border-indigo-500 text-indigo-600')
                                    : (darkMode ? 'bg-white/5 border-white/5 hover:border-white/10 text-gray-400 hover:text-white' : 'bg-white border-gray-200 hover:border-gray-300 text-slate-600 hover:text-slate-800')
                                    }`}
                            >
                                <div className="flex justify-between items-center w-full">
                                    <span className="font-medium text-sm">{sound.label}</span>
                                    {notificationSound === sound.id && <span className="text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-lg shadow-sm">Đang chọn</span>}
                                </div>
                                <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>{sound.desc}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SoundSettingsModal;