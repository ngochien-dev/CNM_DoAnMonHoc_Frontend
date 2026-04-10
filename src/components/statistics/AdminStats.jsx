import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FaChartBar, FaUsers, FaComments, FaLayerGroup, FaSignal } from 'react-icons/fa';

const COLORS = ['#5865F2', '#23A559', '#FEE75C', '#EB459E', '#ED4245'];

const AdminStats = ({ stats, darkMode }) => {
    if (!stats) return (
        <div className="flex-1 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className={`flex-1 p-8 overflow-y-auto animate-in fade-in duration-500 ${darkMode ? 'bg-[#313338]' : 'bg-gray-50'}`}>
            <h1 className="text-3xl font-black text-indigo-500 mb-8 uppercase italic flex items-center gap-4 tracking-tighter">
                <FaChartBar/> Quản trị hệ thống
            </h1>

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
                <div className={`${darkMode ? 'bg-white/5' : 'bg-white'} p-8 rounded-[40px] shadow-sm border border-white/5`}>
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

                <div className={`${darkMode ? 'bg-white/5' : 'bg-white'} p-8 rounded-[40px] shadow-sm border border-white/5`}>
                    <h3 className="font-black uppercase italic mb-6 text-green-500 text-xs tracking-widest">Thành viên tích cực</h3>
                    <div className="space-y-6">
                        {(stats.topUsers || []).map((u, i) => (
                            <div key={i} className="group">
                                <div className="flex justify-between mb-2 items-center">
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
        </div>
    );
};

export default AdminStats;