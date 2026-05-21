import React, { useState } from 'react';
import { FaShieldAlt, FaTimes } from 'react-icons/fa';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const ReportMessageModal = ({ isOpen, onClose, reportingMessage, darkMode }) => {
    // State được chuyển từ ChatPage sang đây để tự quản lý
    const [reportReason, setReportReason] = useState('Abuse');

    if (!isOpen || !reportingMessage) return null;

    // Hàm gửi báo cáo cũng được chuyển sang đây
    const handleSubmitReport = async () => {
        try {
            await api.post('/v1/messages/report', {
                messageId: reportingMessage.messageId,
                reason: reportReason
            });
            toast.success('Báo cáo tin nhắn thành công! Đang chờ Admin xử lý.', {
                icon: '🛡️',
                style: { borderRadius: '12px', background: '#333', color: '#fff' }
            });
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Không thể gửi báo cáo tin nhắn');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[600] backdrop-blur-md animate-in fade-in duration-200 p-4">
            <div className={`w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border transition-all duration-300 ${darkMode ? 'bg-[#0f172a] border-white/10 text-white' : 'bg-white border-gray-200 text-slate-800'}`}>
                <div className="p-6 bg-gradient-to-r from-red-500 to-rose-600 text-white flex justify-between items-center">
                    <h3 className="font-black uppercase tracking-widest text-[11px] flex items-center gap-2">
                        <FaShieldAlt size={16} /> Báo cáo tin nhắn vi phạm
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-white transition-colors">
                        <FaTimes size={14} />
                    </button>
                </div>
                <div className="p-6 space-y-6">
                    <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-gray-100'}`}>
                        <h4 className="text-[10px] uppercase font-black tracking-wider text-gray-400 mb-1">Nội dung bị báo cáo</h4>
                        <p className={`text-sm italic font-medium leading-relaxed break-all ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                            "{reportingMessage.text || '[Tệp tin đính kèm]'}"
                        </p>
                        <span className="text-[9px] text-gray-500 mt-2 block">Gửi bởi: @{reportingMessage.senderUsername || reportingMessage.sender}</span>
                    </div>

                    <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-2">Lý do báo cáo</label>
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

                    <div className="flex gap-4">
                        <button onClick={onClose} className={`flex-1 py-3.5 rounded-2xl font-bold transition-all text-sm border ${darkMode ? 'bg-white/5 hover:bg-white/10 border-white/5 text-white' : 'bg-slate-100 hover:bg-slate-200 border-gray-200 text-slate-600'}`}>
                            Hủy bỏ
                        </button>
                        <button onClick={handleSubmitReport} className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold transition-all hover:opacity-90 shadow-lg shadow-rose-500/20 text-sm">
                            Gửi báo cáo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportMessageModal;