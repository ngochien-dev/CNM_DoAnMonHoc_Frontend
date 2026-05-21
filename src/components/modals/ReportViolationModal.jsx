import React, { useState, useRef } from 'react';
import { FaShieldAlt, FaTimes, FaUpload, FaTrash, FaImage } from 'react-icons/fa';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const ReportViolationModal = ({ isOpen, onClose, activeRoom, allGroups, user, darkMode }) => {
    const [reportReason, setReportReason] = useState('Abuse');
    const [reasonDetail, setReasonDetail] = useState('');
    const [screenshot, setScreenshot] = useState(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    if (!isOpen || !activeRoom) return null;

    const isDM = activeRoom.isDM;
    const currentGroup = allGroups?.find((g) => g.groupId === activeRoom.id);
    
    // Display name of reported target
    const targetName = isDM 
        ? `@${activeRoom.name}` 
        : `Nhóm: ${activeRoom.name || currentGroup?.groupName || 'Chưa đặt tên'}`;

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error("Vui lòng chọn một file hình ảnh hợp lệ!");
            return;
        }

        // Limit local check before processing
        if (file.size > 10 * 1024 * 1024) {
            toast.error("Hình ảnh quá lớn (vui lòng chọn ảnh < 10MB)!");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                // Resize image to maximum 1000px width/height to save DB space
                const MAX_WIDTH = 1000;
                const MAX_HEIGHT = 1000;
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH || height > MAX_HEIGHT) {
                    if (width > height) {
                        height = Math.round((height * MAX_WIDTH) / width);
                        width = MAX_WIDTH;
                    } else {
                        width = Math.round((width * MAX_HEIGHT) / height);
                        height = MAX_HEIGHT;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Export to high-quality compressed JPEG (0.7 quality)
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                setScreenshot(dataUrl);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        setScreenshot(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmitReport = async () => {
        if (!reasonDetail.trim()) {
            toast.error("Vui lòng nhập mô tả chi tiết hành vi vi phạm!");
            return;
        }

        try {
            setLoading(false);
            setLoading(true);

            // Determine target username if possible
            let targetUsername = 'unknown';
            if (isDM) {
                targetUsername = activeRoom.name;
            } else if (currentGroup) {
                targetUsername = currentGroup.owner || 'unknown';
            }

            await api.post('/v1/messages/report', {
                targetRoomId: activeRoom.id,
                targetUsername,
                reason: reportReason,
                reasonDetail: reasonDetail.trim(),
                screenshot: screenshot // base64 string
            });

            toast.success('Đã gửi báo cáo vi phạm thành công! Cảm ơn bạn đã phản hồi.', {
                icon: '🛡️',
                style: { borderRadius: '12px', background: '#333', color: '#fff' }
            });

            // Reset states
            setReasonDetail('');
            setScreenshot(null);
            setReportReason('Abuse');
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Không thể gửi báo cáo vi phạm');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[600] backdrop-blur-md animate-in fade-in duration-200 p-4">
            <div className={`w-full max-w-lg rounded-[28px] shadow-2xl overflow-hidden border transition-all duration-300 ${darkMode ? 'bg-[#0f172a] border-white/10 text-white' : 'bg-white border-gray-200 text-slate-800'}`}>
                
                {/* Header */}
                <div className="p-6 bg-gradient-to-r from-red-500 to-rose-600 text-white flex justify-between items-center shadow-lg">
                    <h3 className="font-black uppercase tracking-wider text-xs flex items-center gap-2">
                        <FaShieldAlt size={18} /> Báo cáo vi phạm cuộc trò chuyện
                    </h3>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/15 text-white transition-colors">
                        <FaTimes size={16} />
                    </button>
                </div>

                <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto scrollbar-thin">
                    
                    {/* Target Information */}
                    <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-gray-150'}`}>
                        <h4 className="text-[9px] uppercase font-black tracking-widest text-gray-400 mb-1">Đối tượng bị báo cáo</h4>
                        <p className="text-sm font-extrabold text-indigo-400">
                            {targetName}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                            Báo cáo sẽ được chuyển trực tiếp đến Quản trị viên để kiểm duyệt và xử lý.
                        </p>
                    </div>

                    {/* Report Category */}
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">Lý do báo cáo</label>
                        <select
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            className={`w-full px-4 py-3 rounded-2xl border font-bold text-sm outline-none transition-all ${darkMode ? 'bg-slate-800 border-white/5 text-white focus:border-red-500' : 'bg-slate-50 border-gray-200 text-slate-700 focus:border-red-500 focus:bg-white'}`}
                        >
                            <option value="Abuse">Quấy rối, công kích, xúc phạm cá nhân</option>
                            <option value="Spam">Quảng cáo rác, lừa đảo, Spam</option>
                            <option value="Dangerous">Nội dung đồi trụy, độc hại, bạo lực</option>
                            <option value="Other">Lý do vi phạm khác</option>
                        </select>
                    </div>

                    {/* Description Textarea */}
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">Mô tả chi tiết hành vi</label>
                        <textarea
                            value={reasonDetail}
                            onChange={(e) => setReasonDetail(e.target.value)}
                            rows={3}
                            placeholder="Mô tả cụ thể lời nói hoặc hành vi vi phạm chuẩn mực cộng đồng..."
                            maxLength={500}
                            className={`w-full px-4 py-3 rounded-2xl border font-semibold text-sm outline-none resize-none transition-all ${darkMode ? 'bg-slate-800 border-white/5 text-white focus:border-red-500' : 'bg-slate-50 border-gray-200 text-slate-700 focus:border-red-500 focus:bg-white'}`}
                        />
                        <span className="text-[9px] text-gray-500 float-right mt-1">{reasonDetail.length}/500 ký tự</span>
                    </div>

                    {/* Screenshot Upload */}
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">Hình ảnh minh chứng (Tùy chọn)</label>
                        
                        {!screenshot ? (
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${darkMode ? 'border-white/10 hover:border-indigo-500/50 hover:bg-white/5' : 'border-gray-300 hover:border-indigo-500 hover:bg-slate-50'}`}
                            >
                                <FaUpload className="text-gray-400 mb-2" size={20} />
                                <span className="text-xs font-bold text-gray-400">Chọn hoặc kéo thả ảnh chụp màn hình</span>
                                <span className="text-[9px] text-gray-500 mt-1">Định dạng JPG, PNG dưới 10MB</span>
                                <input 
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </div>
                        ) : (
                            <div className="relative rounded-2xl overflow-hidden border border-indigo-500/30 max-h-[160px] bg-slate-900 flex justify-center items-center group">
                                <img 
                                    src={screenshot} 
                                    alt="screenshot preview" 
                                    className="max-h-[160px] w-full object-contain"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <button 
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-2.5 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 transition-all shadow-lg"
                                        title="Thay đổi ảnh"
                                    >
                                        <FaImage size={14} />
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="p-2.5 rounded-full bg-red-600 text-white hover:bg-red-700 hover:scale-105 transition-all shadow-lg"
                                        title="Xóa ảnh"
                                    >
                                        <FaTrash size={14} />
                                    </button>
                                </div>
                                <input 
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-2">
                        <button 
                            type="button"
                            onClick={onClose} 
                            disabled={loading}
                            className={`flex-1 py-3.5 rounded-2xl font-bold transition-all text-sm border ${darkMode ? 'bg-white/5 hover:bg-white/10 border-white/5 text-white' : 'bg-slate-100 hover:bg-slate-200 border-gray-200 text-slate-650'}`}
                        >
                            Hủy bỏ
                        </button>
                        <button 
                            type="button"
                            onClick={handleSubmitReport} 
                            disabled={loading}
                            className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold transition-all hover:opacity-90 disabled:opacity-50 shadow-lg shadow-rose-500/20 text-sm flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                "Gửi báo cáo"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportViolationModal;
