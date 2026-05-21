import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FaChartBar, FaUsers, FaComments, FaLayerGroup, FaSignal, FaBan, FaUnlock, FaKey, FaShieldAlt, FaTrash, FaCheck, FaInfoCircle, FaTimes } from 'react-icons/fa';
import api from '../../services/api';

const COLORS = ['#5865F2', '#23A559', '#FEE75C', '#EB459E', '#ED4245'];

const AdminStats = ({ stats, darkMode }) => {
    const [activeTab, setActiveTab] = useState('stats');
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    
    // Reported messages states
    const [reports, setReports] = useState([]);
    const [loadingReports, setLoadingReports] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers();
        } else if (activeTab === 'reports') {
            fetchReports();
        }
    }, [activeTab]);

    const fetchUsers = async () => {
        try {
            setLoadingUsers(true);
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch (err) {
            console.error("Lỗi khi lấy danh sách user:", err);
            alert("Lỗi khi lấy danh sách user");
        } finally {
            setLoadingUsers(false);
        }
    };

    const fetchReports = async () => {
        try {
            setLoadingReports(true);
            const res = await api.get('/admin/reports');
            setReports(res.data);
        } catch (err) {
            console.error("Lỗi khi lấy danh sách báo cáo:", err);
            alert("Lỗi khi lấy danh sách báo cáo");
        } finally {
            setLoadingReports(false);
        }
    };

    const handleToggleStatus = async (username, currentStatus) => {
        const isBanned = !currentStatus;
        const confirmMsg = isBanned ? `Khóa tài khoản ${username}?` : `Mở khóa tài khoản ${username}?`;
        if (window.confirm(confirmMsg)) {
            try {
                await api.post('/admin/users/toggle-status', { targetUsername: username, isBanned });
                setUsers(prev => prev.map(u => u.username === username ? { ...u, isBanned } : u));
                alert("Đã cập nhật trạng thái thành công!");
            } catch (err) {
                alert("Lỗi: " + (err.response?.data?.error || err.message));
            }
        }
    };

    const handleResetPassword = async (username) => {
        if (window.confirm(`Reset mật khẩu cho ${username} thành mặc định?`)) {
            try {
                const res = await api.post('/admin/users/reset-password', { targetUsername: username });
                alert(`Mật khẩu mới của ${username} là: ${res.data.newPassword}`);
            } catch (err) {
                alert("Lỗi: " + (err.response?.data?.error || err.message));
            }
        }
    };

    const handleResolveReport = async (report, action) => {
        const { reportId, messageSender, messageId, reportType } = report;
        let confirmMsg = '';
        if (action === 'dismiss') {
            confirmMsg = 'Bỏ qua báo cáo này?';
        } else if (action === 'delete_message') {
            confirmMsg = messageId 
                ? 'Ẩn tin nhắn này trên hệ thống do vi phạm tiêu chuẩn cộng đồng?' 
                : 'Vô hiệu hóa (khóa) phòng chat này trên hệ thống?';
        } else if (action === 'ban_sender') {
            confirmMsg = messageId
                ? `Khóa tài khoản @${messageSender} và ẩn tin nhắn này ngay lập tức?`
                : `Khóa tài khoản @${messageSender} và vô hiệu hóa phòng chat tương ứng?`;
        }

        if (window.confirm(confirmMsg)) {
            try {
                await api.post(`/admin/reports/${reportId}/resolve`, { action });
                
                // Cập nhật trạng thái cục bộ
                setReports(prev => prev.map(r => r.reportId === reportId ? { 
                    ...r, 
                    status: action === 'dismiss' ? 'resolved_dismissed' : (action === 'delete_message' ? 'resolved_deleted' : 'resolved_banned') 
                } : r));
                
                alert("Đã xử lý báo cáo thành công!");
            } catch (err) {
                alert("Lỗi: " + (err.response?.data?.error || err.message));
            }
        }
    };

    const getReasonLabel = (reason) => {
        switch(reason) {
            case 'Abuse': return 'Quấy rối / Xúc phạm';
            case 'Spam': return 'Quảng cáo rác / Spam';
            case 'Dangerous': return 'Nội dung độc hại';
            default: return reason || 'Khác';
        }
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'pending': 
                return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">Chờ xử lý</span>;
            case 'resolved_dismissed': 
                return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-500/20 text-slate-400 border border-slate-500/25">Đã bỏ qua</span>;
            case 'resolved_deleted': 
                return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/25">Đã ẩn tin</span>;
            case 'resolved_banned': 
                return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white border border-rose-500/30">Đã khóa gửi</span>;
            default: 
                return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-400">{status}</span>;
        }
    };

    if (!stats) return (
        <div className="flex-1 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className={`flex-1 p-8 overflow-y-auto animate-in fade-in duration-500 ${darkMode ? 'bg-[#0f172a]' : 'bg-[#f8fafc]'}`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <h1 className="text-3xl font-black text-indigo-500 uppercase italic flex items-center gap-4 tracking-tighter">
                    <FaChartBar/> Quản trị hệ thống
                </h1>
                <div className="flex flex-wrap gap-3">
                    <button 
                        onClick={() => setActiveTab('stats')}
                        className={`px-5 py-2 rounded-xl font-bold transition-all text-sm ${activeTab === 'stats' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : (darkMode ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200')}`}
                    >
                        Thống kê
                    </button>
                    <button 
                        onClick={() => setActiveTab('users')}
                        className={`px-5 py-2 rounded-xl font-bold transition-all text-sm ${activeTab === 'users' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : (darkMode ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200')}`}
                    >
                        Người dùng
                    </button>
                    <button 
                        onClick={() => setActiveTab('reports')}
                        className={`px-5 py-2 rounded-xl font-bold transition-all text-sm flex items-center gap-2 ${activeTab === 'reports' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : (darkMode ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200')}`}
                    >
                        <FaShieldAlt/> Kiểm duyệt {reports.filter(r => r.status === 'pending').length > 0 && <span className="bg-white text-rose-600 rounded-full px-1.5 py-0.5 text-[10px] font-black">{reports.filter(r => r.status === 'pending').length}</span>}
                    </button>
                </div>
            </div>

            {activeTab === 'stats' ? (
                <>
                    {/* Thẻ thống kê nhanh */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 font-black">
                        <div className="bg-indigo-600 p-6 rounded-[32px] text-white shadow-xl shadow-indigo-600/20">
                            <h4 className="text-[10px] opacity-60 uppercase tracking-widest mb-1 font-black">Người dùng</h4>
                            <p className="text-4xl tracking-tighter flex items-center gap-3"><FaUsers size={24} className="opacity-40"/> {stats.totalUsers || 0}</p>
                        </div>
                        <div className="bg-emerald-600 p-6 rounded-[32px] text-white shadow-xl shadow-emerald-600/20">
                            <h4 className="text-[10px] opacity-60 uppercase tracking-widest mb-1 font-black">Tin nhắn</h4>
                            <p className="text-4xl tracking-tighter flex items-center gap-3"><FaComments size={24} className="opacity-40"/> {stats.totalMessages || 0}</p>
                        </div>
                        <div className="bg-purple-600 p-6 rounded-[32px] text-white shadow-xl shadow-purple-600/20">
                            <h4 className="text-[10px] opacity-60 uppercase tracking-widest mb-1 font-black">Phòng chat</h4>
                            <p className="text-4xl tracking-tighter flex items-center gap-3"><FaLayerGroup size={24} className="opacity-40"/> {stats.totalGroups || 0}</p>
                        </div>
                        <div className="bg-red-600 p-6 rounded-[32px] text-white shadow-xl shadow-red-600/20 animate-pulse">
                            <h4 className="text-[10px] opacity-60 uppercase tracking-widest mb-1 font-black">Đang Online</h4>
                            <p className="text-4xl tracking-tighter flex items-center gap-3"><FaSignal size={24} className="opacity-40"/> {stats.onlineNow || 0}</p>
                        </div>
                    </div>

                    {/* Biểu đồ & Top hoạt động */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        <div className={`p-8 rounded-[40px] shadow-sm border ${darkMode ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100'}`}>
                            <h3 className="font-black uppercase italic mb-6 text-gray-400 text-xs tracking-widest">Phân bổ dữ liệu</h3>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={stats.chartData || []} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value">
                                            {(stats.chartData || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />)}
                                        </Pie>
                                        <Tooltip contentStyle={{borderRadius:'20px', border:'none'}} />
                                        <Legend verticalAlign="bottom" height={36}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className={`p-8 rounded-[40px] shadow-sm border ${darkMode ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100'}`}>
                            <h3 className="font-black uppercase italic mb-6 text-green-500 text-xs tracking-widest">Thành viên tích cực</h3>
                            <div className="space-y-6">
                                {(stats.topUsers || []).map((u, i) => (
                                    <div key={i} className="group">
                                        <div className={`flex justify-between mb-2 items-center ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                                            <span className="font-black italic text-sm">@{u.name}</span>
                                            <span className="text-[10px] font-black px-3 py-1 bg-indigo-500/10 text-indigo-500 rounded-full">{u.count} messages</span>
                                        </div>
                                        <div className="w-full bg-black/10 rounded-full h-2 overflow-hidden">
                                            <div className="bg-gradient-to-r from-indigo-500 to-blue-400 h-full transition-all duration-1000" 
                                                 style={{ width: `${Math.min((u.count / (stats.totalMessages || 1)) * 100 * 5, 100)}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            ) : activeTab === 'users' ? (
                <div className={`p-8 rounded-[40px] shadow-sm border ${darkMode ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100'}`}>
                    <h3 className="font-black uppercase italic mb-6 text-indigo-500 text-xs tracking-widest">Quản lý tài khoản</h3>
                    {loadingUsers ? (
                        <div className="text-center py-10">Đang tải dữ liệu...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className={`w-full text-left border-collapse ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                                <thead>
                                    <tr className={`border-b ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
                                        <th className="py-3 px-4 text-xs font-black uppercase opacity-60">Username</th>
                                        <th className="py-3 px-4 text-xs font-black uppercase opacity-60">Tên hiển thị</th>
                                        <th className="py-3 px-4 text-xs font-black uppercase opacity-60">Email</th>
                                        <th className="py-3 px-4 text-xs font-black uppercase opacity-60">Vai trò</th>
                                        <th className="py-3 px-4 text-xs font-black uppercase opacity-60">Trạng thái</th>
                                        <th className="py-3 px-4 text-xs font-black uppercase opacity-60">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => (
                                        <tr key={u.username} className={`border-b transition-colors ${darkMode ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-slate-50'}`}>
                                            <td className="py-3 px-4 font-bold">@{u.username}</td>
                                            <td className="py-3 px-4">{u.displayName}</td>
                                            <td className="py-3 px-4">{u.email}</td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${u.role === 'admin' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                                    {u.role || 'user'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${u.isBanned ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
                                                    {u.isBanned ? 'Đã khóa' : 'Hoạt động'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                {u.role !== 'admin' && (
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={() => handleToggleStatus(u.username, u.isBanned)}
                                                            className={`p-2 rounded-lg text-white transition-all hover:scale-110 shadow-lg ${u.isBanned ? 'bg-emerald-500' : 'bg-red-500'}`}
                                                            title={u.isBanned ? 'Mở khóa' : 'Khóa'}
                                                        >
                                                            {u.isBanned ? <FaUnlock size={14} /> : <FaBan size={14} />}
                                                        </button>
                                                        <button 
                                                            onClick={() => handleResetPassword(u.username)}
                                                            className="p-2 rounded-lg bg-orange-500 text-white transition-all hover:scale-110 shadow-lg"
                                                            title="Reset mật khẩu"
                                                        >
                                                            <FaKey size={14} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                <div className={`p-8 rounded-[40px] shadow-sm border ${darkMode ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100'}`}>
                    <h3 className="font-black uppercase italic mb-6 text-rose-500 text-xs tracking-widest flex items-center gap-2">
                        <FaShieldAlt/> Trung tâm kiểm duyệt tin nhắn
                    </h3>
                    
                    {loadingReports ? (
                        <div className="text-center py-10">Đang tải danh sách báo cáo...</div>
                    ) : reports.length === 0 ? (
                        <div className={`text-center py-12 rounded-2xl border-2 border-dashed ${darkMode ? 'border-white/5 text-gray-500' : 'border-gray-200 text-gray-400'}`}>
                            <FaInfoCircle size={32} className="mx-auto mb-3 opacity-40"/>
                            <p className="font-bold">Tuyệt vời! Hiện tại không có tin nhắn nào bị báo cáo vi phạm.</p>
                            <p className="text-xs mt-1">Hệ thống của bạn đang hoạt động cực kỳ trong sạch và an toàn.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className={`w-full text-left border-collapse ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                                <thead>
                                    <tr className={`border-b ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
                                        <th className="py-3 px-4 text-xs font-black uppercase opacity-60">Người gửi / Đối tượng</th>
                                        <th className="py-3 px-4 text-xs font-black uppercase opacity-60">Nội dung vi phạm</th>
                                        <th className="py-3 px-4 text-xs font-black uppercase opacity-60">Lý do</th>
                                        <th className="py-3 px-4 text-xs font-black uppercase opacity-60">Người báo cáo</th>
                                        <th className="py-3 px-4 text-xs font-black uppercase opacity-60">Trạng thái</th>
                                        <th className="py-3 px-4 text-xs font-black uppercase opacity-60">Hành động xử lý</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.map((r) => (
                                        <tr key={r.reportId} className={`border-b transition-colors ${darkMode ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-slate-50'}`}>
                                            <td className="py-3 px-4 font-bold text-rose-400">
                                                {r.reportType === 'general' ? (
                                                    <div>
                                                        <span className="text-[9px] font-black uppercase tracking-wider block text-slate-500 mb-0.5">Bị báo cáo</span>
                                                        @{r.messageSender || r.targetUsername}
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <span className="text-[9px] font-black uppercase tracking-wider block text-slate-500 mb-0.5">Người gửi tin</span>
                                                        @{r.messageSender}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 max-w-[280px]">
                                                <div className={`p-3 rounded-xl text-sm ${darkMode ? 'bg-white/5 text-slate-200' : 'bg-slate-100 text-slate-700'} border ${darkMode ? 'border-white/5' : 'border-gray-200'} break-all`}>
                                                    {r.messageText}
                                                </div>
                                                {r.reportType === 'general' ? (
                                                    <div className="mt-1 flex flex-wrap gap-2 items-center">
                                                        <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[9px] font-bold">Báo cáo chung</span>
                                                        {r.targetRoomName && (
                                                            <span className="text-[10px] text-gray-500 font-medium">Phòng: {r.targetRoomName}</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-gray-500 mt-1 block">Tin nhắn ID: {r.messageId}</span>
                                                )}

                                                {/* Render screenshot if available */}
                                                {r.imageUrl && (
                                                    <div className="mt-2">
                                                        <span className="text-[9px] font-black uppercase tracking-wider text-gray-500 block mb-1">Hình ảnh minh chứng:</span>
                                                        <div className="relative w-24 h-16 rounded-lg overflow-hidden border border-white/10 cursor-zoom-in group hover:border-indigo-500/50 transition-all bg-black/20">
                                                            <img 
                                                                src={r.imageUrl} 
                                                                alt="proof screenshot" 
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-all"
                                                                onClick={() => setSelectedImage(r.imageUrl)}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="px-2.5 py-1 rounded bg-red-500/10 text-red-500 text-xs font-bold">
                                                    {getReasonLabel(r.reason)}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-sm font-semibold opacity-85">@{r.reporterUsername}</td>
                                            <td className="py-3 px-4">
                                                {getStatusBadge(r.status)}
                                            </td>
                                            <td className="py-3 px-4">
                                                {r.status === 'pending' ? (
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={() => handleResolveReport(r, 'dismiss')}
                                                            className="p-2 rounded-lg bg-slate-500 text-white transition-all hover:scale-110 shadow-md flex items-center justify-center"
                                                            title="Bỏ qua báo cáo"
                                                        >
                                                            <FaCheck size={12} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleResolveReport(r, 'delete_message')}
                                                            className="p-2 rounded-lg bg-orange-500 text-white transition-all hover:scale-110 shadow-md flex items-center justify-center"
                                                            title={r.messageId ? "Ẩn tin nhắn vi phạm" : "Vô hiệu hóa phòng chat"}
                                                        >
                                                            <FaTrash size={12} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleResolveReport(r, 'ban_sender')}
                                                            className="p-2 rounded-lg bg-red-600 text-white transition-all hover:scale-110 shadow-md flex items-center justify-center"
                                                            title="Khóa tài khoản người vi phạm"
                                                        >
                                                            <FaBan size={12} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-500 italic">Đã giải quyết</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Image Lightbox Modal */}
            {selectedImage && (
                <div 
                    onClick={() => setSelectedImage(null)}
                    className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200"
                >
                    <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl flex flex-col items-center">
                        <button 
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/75 rounded-full text-white transition-colors z-10 border border-white/5"
                        >
                            <FaTimes size={16} />
                        </button>
                        <img 
                            src={selectedImage} 
                            alt="violation proof full" 
                            className="max-w-full max-h-[85vh] object-contain rounded-xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminStats;