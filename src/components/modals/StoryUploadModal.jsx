import React, { useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import api from '../../services/api';

const StoryUploadModal = ({ isOpen, onClose, user }) => {
    const [storyForm, setStoryForm] = useState({ mediaData: '', caption: '' });

    const handleStoryUpload = async () => {
        if (!storyForm.mediaData) return;
        try {
            await api.post('/stories/upload', {
                username: user.username,
                mediaData: storyForm.mediaData,
                caption: storyForm.caption,
                mediaType: 'image'
            });
            onClose();
            setStoryForm({ mediaData: '', caption: '' });
            alert("Khoảnh khắc đã được chia sẻ!");
        } catch (error) {
            alert("Đã xảy ra lỗi khi tải lên khoảnh khắc.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[2000] backdrop-blur-md p-4">
            <div className="w-full max-w-md bg-[#1e293b] rounded-[40px] border border-white/10 p-8 shadow-2xl">
                <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-6 flex items-center gap-2">
                    <FaPlus className="text-indigo-500" /> Đăng khoảnh khắc
                </h2>
                <div className="space-y-6">
                    <div
                        onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e) => {
                                const file = e.target.files[0];
                                const reader = new FileReader();
                                reader.onloadend = () => setStoryForm(p => ({ ...p, mediaData: reader.result }));
                                reader.readAsDataURL(file);
                            };
                            input.click();
                        }}
                        className="w-full aspect-video rounded-3xl border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer hover:border-indigo-500 transition-all overflow-hidden"
                    >
                        {storyForm.mediaData ? (
                            <img src={storyForm.mediaData} className="w-full h-full object-cover" alt="" />
                        ) : (
                            <span className="text-gray-500 text-xs font-bold uppercase">Chọn ảnh từ thiết bị</span>
                        )}
                    </div>
                    <input
                        value={storyForm.caption}
                        onChange={e => setStoryForm(p => ({ ...p, caption: e.target.value }))}
                        placeholder="Thêm mô tả..."
                        className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white text-sm outline-none focus:border-indigo-500"
                    />
                    <div className="flex gap-4">
                        <button onClick={onClose} className="flex-1 py-4 bg-white/5 text-gray-400 font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-white/10 transition-colors">Hủy</button>
                        <button onClick={handleStoryUpload} className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all">Chia sẻ ngay</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StoryUploadModal;