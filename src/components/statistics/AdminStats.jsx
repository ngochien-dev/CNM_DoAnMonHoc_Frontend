import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FaChartBar, FaUsers, FaComments, FaLayerGroup, FaSignal, FaBan, FaUnlock, FaKey } from 'react-icons/fa';
import api from '../../services/api';

const COLORS = ['#5865F2', '#23A559', '#FEE75C', '#EB459E', '#ED4245'];

const AdminStats = ({ stats, darkMode }) => {
    const [activeTab, setActiveTab] = useState('stats');
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers();
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

    if (!stats) return (
        <div className="flex-1 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className={`flex-1 p-8 overflow-y-auto animate-in fade-in duration-500 ${darkMode ? 'bg-[#0f172a]' : 'bg-[#f8fafc]'}`}>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-black text-indigo-500 uppercase italic flex items-center gap-4 tracking-tighter">
                    <FaChartBar/> Quản trị hệ thống
                </h1>
                <div className="flex gap-4">
                    <button 
                        onClick={() => setActiveTab('stats')}
                        className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'stats' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : (darkMode ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200')}`}
                    >
                        Thống kê
                    </button>
                    <button 
                        onClick={() => setActiveTab('users')}
                        className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'users' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : (darkMode ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200')}`}
                    >
                        Người dùng
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
            ) : (
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
            )}
        </div>
    );
};

export default AdminStats;