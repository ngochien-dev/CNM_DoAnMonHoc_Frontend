import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FaUserFriends, FaUsers, FaPaperPlane, FaImages, FaFileAlt, FaFont } from 'react-icons/fa';
import api from '../../services/api';

const StatCard = ({ icon: Icon, label, value, color, darkMode }) => (
    <div className={`p-5 rounded-3xl border flex items-center gap-4 transition-all hover:scale-105 ${darkMode ? 'bg-[#1e293b]/50 border-slate-700/50' : 'bg-white border-slate-200'} shadow-lg`}>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br ${color} shadow-lg shrink-0`}>
            <Icon size={24} />
        </div>
        <div>
            <p className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
            <p className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{value}</p>
        </div>
    </div>
);

const UserStats = ({ username, darkMode }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get(`/users/${username}/stats`);
                setStats(res.data);
            } catch (err) {
                console.error('Lỗi lấy thống kê:', err);
            } finally {
                setLoading(false);
            }
        };

        if (username) {
            fetchStats();
        }
    }, [username]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!stats) return <div className="text-center p-5 text-gray-500">Không thể tải dữ liệu thống kê.</div>;

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'} shadow-2xl`}>
                    <p className="font-black text-sm mb-1">{label}</p>
                    <p className="text-indigo-500 font-bold text-xs">
                        Tin nhắn: {payload[0].value}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard 
                    icon={FaPaperPlane} 
                    label="Tổng tin nhắn" 
                    value={stats.totalMessagesSent} 
                    color="from-indigo-500 to-purple-600" 
                    darkMode={darkMode} 
                />
                <StatCard 
                    icon={FaUserFriends} 
                    label="Bạn bè" 
                    value={stats.totalFriends} 
                    color="from-pink-500 to-rose-500" 
                    darkMode={darkMode} 
                />
                <StatCard 
                    icon={FaUsers} 
                    label="Nhóm tham gia" 
                    value={stats.totalGroups} 
                    color="from-emerald-400 to-teal-500" 
                    darkMode={darkMode} 
                />
            </div>

            {/* Media Distribution */}
            <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-[#1e293b]/50 border-slate-700/50' : 'bg-white border-slate-200'} shadow-lg`}>
                <h3 className={`text-sm font-black uppercase italic tracking-widest mb-4 flex items-center gap-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                    <FaImages className="text-pink-500" />
                    Phân loại tin nhắn
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div className={`p-4 rounded-2xl ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                        <FaFont className="mx-auto mb-2 text-indigo-400" size={20} />
                        <div className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{stats.mediaStats.text}</div>
                        <div className={`text-[10px] uppercase tracking-widest mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Văn bản</div>
                    </div>
                    <div className={`p-4 rounded-2xl ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                        <FaImages className="mx-auto mb-2 text-rose-400" size={20} />
                        <div className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{stats.mediaStats.images}</div>
                        <div className={`text-[10px] uppercase tracking-widest mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Hình ảnh</div>
                    </div>
                    <div className={`p-4 rounded-2xl ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                        <FaFileAlt className="mx-auto mb-2 text-teal-400" size={20} />
                        <div className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{stats.mediaStats.files}</div>
                        <div className={`text-[10px] uppercase tracking-widest mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Tập tin</div>
                    </div>
                </div>
            </div>

            {/* Activity Chart */}
            <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-[#1e293b]/50 border-slate-700/50' : 'bg-white border-slate-200'} shadow-lg`}>
                <h3 className={`text-sm font-black uppercase italic tracking-widest mb-6 flex items-center gap-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                    Năng suất 30 ngày qua
                </h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.activityTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                            <XAxis 
                                dataKey="date" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 10 }}
                                minTickGap={20}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 10 }} 
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area 
                                type="monotone" 
                                dataKey="count" 
                                stroke="#6366f1" 
                                strokeWidth={3}
                                fillOpacity={1} 
                                fill="url(#colorCount)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default UserStats;
