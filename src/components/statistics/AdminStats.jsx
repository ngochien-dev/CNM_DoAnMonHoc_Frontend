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
        switch (reason) {
            case 'Abuse': return 'Quấy rối / Xúc phạm';
            case 'Spam': return 'Quảng cáo rác / Spam';
            case 'Dangerous': return 'Nội dung độc hại';
            default: return reason || 'Khác';
        }
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'pending': 
                return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">Chờ xử lý</span>;
            case 'resolved_dismissed': 
                return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-500 border border-slate-500/20">Đã bỏ qua</span>;
            case 'resolved_deleted': 
                return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">Đã ẩn tin</span>;
            case 'resolved_banned': 
                return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-500 border border-rose-500/20">Đã khóa gửi</span>;
            default: 
                return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">{status}</span>;
        }
    };

    if (!stats) return (
        <div className="flex-1 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className={`flex-1 p-8 overflow-y-auto font-sans animate-in fade-in duration-500 ${darkMode ? 'bg-[#0f172a]' : 'bg-[#f8fafc]'}`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <h1 className={`text-2xl font-bold flex items-center gap-3 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                        <FaChartBar />
                    </div>
                    Quản trị hệ thống
                </h1>
                <div className="flex flex-wrap gap-2 p-1 rounded-2xl bg-slate-100/80 backdrop-blur-sm" style={darkMode ? {backgroundColor: 'rgba(255,255,255,0.05)'} : {}}>
                    <button 
                        onClick={() => setActiveTab('stats')}
                        className={`px-4 py-2 rounded-xl font-medium transition-all text-sm ${activeTab === 'stats' ? (darkMode ? 'bg-slate-700 text-white shadow-sm' : 'bg-white text-indigo-600 shadow-sm') : (darkMode ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-700')}`}
                    >
                        Thống kê
                    </button>
                    <button 
                        onClick={() => setActiveTab('users')}
                        className={`px-4 py-2 rounded-xl font-medium transition-all text-sm ${activeTab === 'users' ? (darkMode ? 'bg-slate-700 text-white shadow-sm' : 'bg-white text-indigo-600 shadow-sm') : (darkMode ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-700')}`}
                    >
                        Người dùng
                    </button>
                    <button 
                        onClick={() => setActiveTab('reports')}
                        className={`px-4 py-2 rounded-xl font-medium transition-all text-sm flex items-center gap-2 ${activeTab === 'reports' ? (darkMode ? 'bg-slate-700 text-white shadow-sm' : 'bg-white text-indigo-600 shadow-sm') : (darkMode ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-700')}`}
                    >
                        Kiểm duyệt {reports.filter(r => r.status === 'pending').length > 0 && <span className="bg-rose-500 text-white rounded-full px-2 py-0.5 text-xs">{reports.filter(r => r.status === 'pending').length}</span>}
                    </button>
                </div>
            </div>

            {activeTab === 'stats' ? (
                <>
                    {/* Thẻ thống kê nhanh */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/20">
                            <div className="flex items-center gap-3 mb-2">
                                <FaUsers className="opacity-80"/>
                                <h4 className="text-sm font-medium opacity-90">Người dùng</h4>
                            </div>
                            <p className="text-3xl font-bold">{stats.totalUsers || 0}</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20">
                            <div className="flex items-center gap-3 mb-2">
                                <FaComments className="opacity-80"/>
                                <h4 className="text-sm font-medium opacity-90">Tin nhắn</h4>
                            </div>
                            <p className="text-3xl font-bold">{stats.totalMessages || 0}</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/20">
                            <div className="flex items-center gap-3 mb-2">
                                <FaLayerGroup className="opacity-80"/>
                                <h4 className="text-sm font-medium opacity-90">Phòng chat</h4>
                            </div>
                            <p className="text-3xl font-bold">{stats.totalGroups || 0}</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20">
                            <div className="flex items-center gap-3 mb-2">
                                <FaSignal className="opacity-80"/>
                                <h4 className="text-sm font-medium opacity-90">Đang Online</h4>
                            </div>
                            <p className="text-3xl font-bold">{stats.onlineNow || 0}</p>
                        </div>
                    </div>

                    {/* Biểu đồ & Top hoạt động */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                            <h3 className={`font-bold mb-6 text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>Phân bổ dữ liệu</h3>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={stats.chartData || []} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value">
                                            {(stats.chartData || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                            <h3 className={`font-bold mb-6 text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>Thành viên tích cực</h3>
                            <div className="space-y-5">
                                {(stats.topUsers || []).map((u, i) => (
                                    <div key={i} className="group">
                                        <div className={`flex justify-between mb-2 items-center ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                                            <span className="font-medium text-sm">@{u.name}</span>
                                            <span className="text-xs font-semibold text-indigo-500">{u.count} tin nhắn</span>
                                        </div>
                                        <div className={`w-full rounded-full h-1.5 overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                            <div className="bg-indigo-500 h-full transition-all duration-1000 rounded-full" 
                                                 style={{ width: `${Math.min((u.count / (stats.totalMessages || 1)) * 100 * 5, 100)}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            ) : activeTab === 'users' ? (
                <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <h3 className={`font-bold mb-6 text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>Quản lý tài khoản</h3>
                    {loadingUsers ? (
                        <div className="text-center py-10 text-sm text-gray-500">Đang tải dữ liệu...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className={`w-full text-left border-collapse text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                                <thead>
                                    <tr className={`border-b ${darkMode ? 'border-white/10 bg-white/5 text-gray-200' : 'border-gray-200 bg-slate-50 text-slate-700'}`}>
                                        <th className="py-3 px-4 font-semibold">Tên người dùng</th>
                                        <th className="py-3 px-4 font-semibold">Tên hiển thị</th>
                                        <th className="py-3 px-4 font-semibold">Email</th>
                                        <th className="py-3 px-4 font-semibold">Vai trò</th>
                                        <th className="py-3 px-4 font-semibold">Trạng thái</th>
                                        <th className="py-3 px-4 font-semibold text-right">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => (
                                        <tr key={u.username} className={`border-b transition-colors ${darkMode ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-slate-50'}`}>
                                            <td className="py-3 px-4 font-medium">@{u.username}</td>
                                            <td className={`py-3 px-4 font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{u.displayName || <span className="italic font-normal opacity-50">Chưa cập nhật</span>}</td>
                                            <td className={`py-3 px-4 font-medium ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>{u.email || <span className="italic font-normal opacity-50">Chưa cập nhật</span>}</td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${u.role === 'admin' ? (darkMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-700') : (darkMode ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-700')}`}>
                                                    {u.role === 'admin' ? 'Admin' : 'User'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${u.isBanned ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                                    {u.isBanned ? 'Đã khóa' : 'Hoạt động'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                {u.role !== 'admin' && (
                                                    <div className="flex gap-2 justify-end">
                                                        <button 
                                                            onClick={() => handleToggleStatus(u.username, u.isBanned)}
                                                            className={`p-2 rounded-lg transition-colors text-white shadow-sm ${u.isBanned ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}
                                                            title={u.isBanned ? 'Mở khóa' : 'Khóa'}
                                                        >
                                                            {u.isBanned ? <FaUnlock size={14} /> : <FaBan size={14} />}
                                                        </button>
                                                        <button 
                                                            onClick={() => handleResetPassword(u.username)}
                                                            className={`p-2 rounded-lg transition-colors shadow-sm ${darkMode ? 'bg-white/10 text-gray-300 hover:bg-white/20' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
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
                <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <h3 className={`font-bold mb-6 text-sm flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                        <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                            <FaShieldAlt/>
                        </div>
                        Trung tâm kiểm duyệt tin nhắn
                    </h3>
                    
                    {loadingReports ? (
                        <div className="text-center py-10 text-sm text-gray-500">Đang tải danh sách báo cáo...</div>
                    ) : reports.length === 0 ? (
                        <div className={`text-center py-12 rounded-xl border-2 border-dashed ${darkMode ? 'border-white/5 text-gray-500' : 'border-gray-200 text-gray-400'}`}>
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${darkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                                <FaCheck size={24} className="text-emerald-500"/>
                            </div>
                            <p className={`font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Tuyệt vời! Hiện tại không có tin nhắn vi phạm.</p>
                            <p className="text-sm mt-1">Hệ thống của bạn đang hoạt động trong sạch và an toàn.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className={`w-full text-left border-collapse text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                                <thead>
                                    <tr className={`border-b ${darkMode ? 'border-white/10 bg-white/5 text-gray-200' : 'border-gray-200 bg-slate-50 text-slate-700'}`}>
                                        <th className="py-3 px-4 font-semibold">Đối tượng</th>
                                        <th className="py-3 px-4 font-semibold">Nội dung vi phạm</th>
                                        <th className="py-3 px-4 font-semibold">Lý do</th>
                                        <th className="py-3 px-4 font-semibold">Người báo cáo</th>
                                        <th className="py-3 px-4 font-semibold">Trạng thái</th>
                                        <th className="py-3 px-4 font-semibold text-right">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.map((r) => (
                                        <tr key={r.reportId} className={`border-b transition-colors ${darkMode ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-slate-50'}`}>
                                            <td className="py-3 px-4 font-medium text-indigo-500">
                                                {r.reportType === 'general' ? (
                                                    <div>
                                                        <span className="text-[10px] font-medium block text-slate-500 mb-0.5">Bị báo cáo</span>
                                                        @{r.messageSender || r.targetUsername}
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <span className="text-[10px] font-medium block text-slate-500 mb-0.5">Người gửi tin</span>
                                                        @{r.messageSender}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 max-w-[280px]">
                                                <div className={`p-3 rounded-xl text-sm border break-words ${darkMode ? 'bg-white/5 text-slate-200 border-white/5' : 'bg-slate-50 text-slate-700 border-gray-200'}`}>
                                                    {r.messageText}
                                                </div>
                                                {r.reportType === 'general' ? (
                                                    <div className="mt-2 flex flex-wrap gap-2 items-center">
                                                        <span className="px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-500 text-[10px] font-medium">Báo cáo chung</span>
                                                        {r.targetRoomName && (
                                                            <span className="text-[10px] text-gray-500 font-medium">Phòng: {r.targetRoomName}</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-gray-500 mt-2 block">ID: {r.messageId}</span>
                                                )}

                                                {/* Render screenshot if available */}
                                                {r.imageUrl && (
                                                    <div className="mt-3">
                                                        <span className="text-[10px] font-medium text-gray-500 block mb-1">Hình ảnh đính kèm:</span>
                                                        <div className={`relative w-24 h-16 rounded-lg overflow-hidden border cursor-zoom-in group transition-all ${darkMode ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-slate-100'}`}>
                                                            <img 
                                                                src={r.imageUrl} 
                                                                alt="proof screenshot" 
                                                                className="w-full h-full object-cover group-hover:opacity-80 transition-all"
                                                                onClick={() => setSelectedImage(r.imageUrl)}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="px-2.5 py-1 rounded-md bg-red-500/10 text-red-500 text-xs font-medium">
                                                    {getReasonLabel(r.reason)}
                                                </span>
                                            </td>
                                            <td className={`py-3 px-4 text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>@{r.reporterUsername}</td>
                                            <td className="py-3 px-4">
                                                {getStatusBadge(r.status)}
                                            </td>
                                            <td className="py-3 px-4">
                                                {r.status === 'pending' ? (
                                                    <div className="flex gap-2 justify-end">
                                                        <button 
                                                            onClick={() => handleResolveReport(r, 'dismiss')}
                                                            className={`p-2 rounded-lg transition-colors shadow-sm flex items-center justify-center ${darkMode ? 'bg-white/10 text-gray-300 hover:bg-white/20' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                                                            title="Bỏ qua báo cáo"
                                                        >
                                                            <FaCheck size={14} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleResolveReport(r, 'delete_message')}
                                                            className="p-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors shadow-sm flex items-center justify-center"
                                                            title={r.messageId ? "Ẩn tin nhắn vi phạm" : "Vô hiệu hóa phòng chat"}
                                                        >
                                                            <FaTrash size={14} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleResolveReport(r, 'ban_sender')}
                                                            className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors shadow-sm flex items-center justify-center"
                                                            title="Khóa tài khoản người vi phạm"
                                                        >
                                                            <FaBan size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-end">
                                                        <span className="text-xs text-gray-500 italic">Đã giải quyết</span>
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
            )}

            {/* Image Lightbox Modal */}
            {selectedImage && (
                <div 
                    onClick={() => setSelectedImage(null)}
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200"
                >
                    <div className={`relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col items-center ${darkMode ? 'border border-white/10' : ''}`}>
                        <button 
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/75 rounded-full text-white transition-colors z-10 border border-white/10"
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