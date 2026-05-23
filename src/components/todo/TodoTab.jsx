import React, { useState, useEffect } from 'react';
import {
    FaCalendarCheck,
    FaPlus,
    FaCheck,
    FaTrash,
    FaClock,
    FaExclamationTriangle,
    FaSearch,
    FaSortAmountDown,
    FaChevronDown,
    FaChevronUp,
    FaBook,
    FaBriefcase,
    FaUser,
    FaStar,
    FaInfoCircle,
} from 'react-icons/fa';

const TodoTab = ({ user, darkMode }) => {
    const [tasks, setTasks] = useState([]);
    const [taskTitle, setTaskTitle] = useState('');
    const [taskNotes, setTaskNotes] = useState('');
    const [taskCategory, setTaskCategory] = useState('Personal');
    const [dueDate, setDueDate] = useState('');
    const [dueTime, setDueTime] = useState('');
    const [priority, setPriority] = useState('medium');
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('dateAdded');
    const [expandedTaskId, setExpandedTaskId] = useState(null);

    useEffect(() => {
        if (user?.username) {
            const savedTasks = localStorage.getItem(`todos_${user.username}`);
            if (savedTasks) {
                try {
                    const parsedTasks = JSON.parse(savedTasks);
                    setTasks(Array.isArray(parsedTasks) ? parsedTasks : []);
                } catch (err) {
                    console.error('Lỗi khi đọc danh sách todo:', err);
                    setTasks([]);
                }
            }
        }
    }, [user]);

    const saveTasks = (newTasks) => {
        setTasks(newTasks);

        if (user?.username) {
            localStorage.setItem(`todos_${user.username}`, JSON.stringify(newTasks));
        }
    };

    const handleAddTask = (e) => {
        e.preventDefault();
        if (!taskTitle.trim()) return;

        const newTask = {
            id: Date.now().toString(),
            title: taskTitle.trim(),
            notes: taskNotes.trim(),
            category: taskCategory,
            dueDate,
            dueTime,
            priority,
            completed: false,
            createdAt: new Date().toISOString(),
        };

        saveTasks([newTask, ...tasks]);

        setTaskTitle('');
        setTaskNotes('');
        setTaskCategory('Personal');
        setDueDate('');
        setDueTime('');
        setPriority('medium');
    };

    const handleToggleComplete = (taskId) => {
        const updatedTasks = tasks.map(t =>
            t.id === taskId ? { ...t, completed: !t.completed } : t
        );
        saveTasks(updatedTasks);
    };

    const handleDeleteTask = (taskId) => {
        if (!window.confirm('Xóa công việc này?')) return;

        const updatedTasks = tasks.filter(t => t.id !== taskId);
        saveTasks(updatedTasks);
    };

    const isOverdue = (task) => {
        if (task.completed || !task.dueDate) return false;

        const now = new Date();
        const deadlineStr = task.dueTime ? `${task.dueDate}T${task.dueTime}` : `${task.dueDate}T23:59:59`;
        const deadline = new Date(deadlineStr);

        return now > deadline;
    };

    const toggleExpand = (taskId) => {
        setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
    };

    const totalCount = tasks.length;
    const completedCount = tasks.filter(t => t.completed).length;
    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const processedTasks = tasks
        .filter(t => {
            if (filter === 'active') return !t.completed;
            if (filter === 'completed') return t.completed;
            return true;
        })
        .filter(t => {
            const query = searchQuery.toLowerCase().trim();
            if (!query) return true;

            return (
                (t.title || '').toLowerCase().includes(query) ||
                (t.notes || '').toLowerCase().includes(query) ||
                (t.category || '').toLowerCase().includes(query)
            );
        })
        .sort((a, b) => {
            if (sortBy === 'dueDate') {
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;

                const aTime = a.dueTime ? `${a.dueDate}T${a.dueTime}` : `${a.dueDate}T23:59:59`;
                const bTime = b.dueTime ? `${b.dueDate}T${b.dueTime}` : `${b.dueDate}T23:59:59`;

                return new Date(aTime) - new Date(bTime);
            }

            if (sortBy === 'priority') {
                const priorityWeight = { high: 3, medium: 2, low: 1 };
                return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
            }

            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });

    const getCategoryStyles = (cat) => {
        switch (cat) {
            case 'Work':
                return {
                    label: 'Công việc',
                    bg: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
                    icon: <FaBriefcase size={10} />,
                };
            case 'Study':
                return {
                    label: 'Học tập',
                    bg: 'bg-purple-500/10 text-purple-500 border border-purple-500/20',
                    icon: <FaBook size={10} />,
                };
            case 'Urgent':
                return {
                    label: 'Quan trọng',
                    bg: 'bg-red-500/10 text-red-500 border border-red-500/20',
                    icon: <FaStar size={10} />,
                };
            default:
                return {
                    label: 'Cá nhân',
                    bg: 'bg-green-500/10 text-green-500 border border-green-500/20',
                    icon: <FaUser size={10} />,
                };
        }
    };

    return (
        <div className={`flex-1 flex flex-col h-full overflow-hidden ${darkMode ? 'bg-[#0f172a]' : 'bg-white'}`}>
            <div className={`p-6 border-b shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${darkMode ? 'border-white/5 bg-slate-900/40' : 'border-gray-200 bg-white shadow-sm'}`}>
                <div>
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                        <FaCalendarCheck className="text-indigo-500 text-3xl" />
                        Lập Lịch & Nhắc Nhở Công Việc
                    </h2>
                    <p className="text-xs text-gray-500 font-medium">
                        Bản kế hoạch công việc cá nhân của @{user?.username || 'người dùng'}
                    </p>
                </div>

                <div className={`w-full sm:w-64 p-3 rounded-2xl border flex flex-col gap-1.5 ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-gray-200'}`}>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                        <span>Tiến độ hoàn thành</span>
                        <span className="text-indigo-500">{completedCount}/{totalCount} ({completionRate}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-700/30 dark:bg-black/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                            style={{ width: `${completionRate}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                <div className={`w-full lg:w-[350px] p-6 border-b lg:border-b-0 lg:border-r overflow-y-auto shrink-0 custom-scrollbar ${darkMode ? 'border-white/5 bg-slate-900/20' : 'border-gray-200 bg-slate-50/50'}`}>
                    <form onSubmit={handleAddTask} className="space-y-5">
                        <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400">Tạo công việc mới</h3>

                        <div>
                            <label className="block text-[10px] font-black uppercase mb-1.5 opacity-70">
                                Nội dung công việc <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={taskTitle}
                                onChange={(e) => setTaskTitle(e.target.value)}
                                placeholder="Gõ việc cần làm..."
                                className={`w-full p-4 text-sm rounded-2xl outline-none border focus:border-indigo-500 font-bold transition-all ${darkMode ? 'bg-slate-800/50 border-slate-700 placeholder:text-slate-500 text-white' : 'bg-white border-gray-200 placeholder:text-slate-400 text-slate-800'}`}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase mb-1.5 opacity-70">Ghi chú / Chi tiết</label>
                            <textarea
                                value={taskNotes}
                                onChange={(e) => setTaskNotes(e.target.value)}
                                placeholder="Mô tả cụ thể (nếu có)..."
                                rows="3"
                                className={`w-full p-4 text-sm rounded-2xl outline-none border focus:border-indigo-500 font-semibold transition-all resize-none ${darkMode ? 'bg-slate-800/50 border-slate-700 placeholder:text-slate-500 text-white' : 'bg-white border-gray-200 placeholder:text-slate-400 text-slate-800'}`}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase mb-1.5 opacity-70">Phân loại</label>
                                <select
                                    value={taskCategory}
                                    onChange={(e) => setTaskCategory(e.target.value)}
                                    className={`w-full p-3.5 text-xs rounded-xl outline-none border focus:border-indigo-500 font-bold cursor-pointer ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200 text-slate-800'}`}
                                >
                                    <option value="Personal">Cá nhân</option>
                                    <option value="Work">Công việc</option>
                                    <option value="Study">Học tập</option>
                                    <option value="Urgent">Quan trọng</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase mb-1.5 opacity-70">Mức độ ưu tiên</label>
                                <div className="flex gap-2">
                                    {['low', 'medium', 'high'].map(p => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setPriority(p)}
                                            className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl border transition-all ${priority === p ? (
                                                p === 'high' ? 'bg-red-500/20 border-red-500 text-red-500' :
                                                    p === 'medium' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' :
                                                        'bg-green-500/20 border-green-500 text-green-500'
                                            ) : (darkMode ? 'border-slate-800 text-slate-400 bg-slate-800/30' : 'border-gray-200 text-slate-400 bg-white')}`}
                                        >
                                            {p === 'low' ? 'Thấp' : p === 'medium' ? 'Trung' : 'Cao'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-black uppercase mb-1.5 opacity-70">Hạn chót</label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className={`w-full p-3.5 text-xs rounded-xl outline-none border focus:border-indigo-500 font-bold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200 text-slate-800'}`}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase mb-1.5 opacity-70">Giờ</label>
                                <input
                                    type="time"
                                    value={dueTime}
                                    onChange={(e) => setDueTime(e.target.value)}
                                    className={`w-full p-3.5 text-xs rounded-xl outline-none border focus:border-indigo-500 font-bold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200 text-slate-800'}`}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!taskTitle.trim()}
                            className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-[3px] rounded-2xl transition-all hover:scale-[1.02] shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                        >
                            <FaPlus />
                            Thêm công việc
                        </button>
                    </form>
                </div>

                <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
                    <div className={`p-4 border-b flex flex-col xl:flex-row xl:items-center justify-between gap-4 shrink-0 ${darkMode ? 'border-white/5' : 'border-gray-200'}`}>
                        <div className="flex bg-slate-800/10 dark:bg-black/20 p-1 rounded-xl self-start gap-1">
                            {['all', 'active', 'completed'].map(f => (
                                <button
                                    key={f}
                                    type="button"
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${filter === f ? 'bg-indigo-500 text-white shadow-md' : (darkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-white')}`}
                                >
                                    {f === 'all' ? 'Tất cả' : f === 'active' ? 'Chưa xong' : 'Đã xong'}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                            <div className="relative w-full sm:w-auto">
                                <span className="absolute left-3.5 top-3 text-gray-500">
                                    <FaSearch size={14} />
                                </span>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Tìm kiếm công việc..."
                                    className={`pl-10 pr-4 py-2.5 w-full sm:w-64 text-xs rounded-xl outline-none border focus:border-indigo-500 font-semibold ${darkMode ? 'bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500' : 'bg-white border-gray-200 text-slate-800 placeholder:text-gray-400'}`}
                                />
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <span className="text-gray-500 hidden sm:block">
                                    <FaSortAmountDown size={14} />
                                </span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className={`p-2.5 text-xs rounded-xl border outline-none font-bold focus:border-indigo-500 cursor-pointer w-full sm:w-auto ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200 text-slate-800'}`}
                                >
                                    <option value="dateAdded">Mới nhất</option>
                                    <option value="dueDate">Hạn chót gần nhất</option>
                                    <option value="priority">Độ ưu tiên cao nhất</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                        {processedTasks.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-40 min-h-[300px]">
                                <FaCalendarCheck size={64} className="mb-4 text-indigo-400" />
                                <p className="font-black text-lg">Hôm nay của bạn thật thanh thản!</p>
                                <p className="text-xs max-w-sm mt-1">Không tìm thấy công việc nào phù hợp với bộ lọc hiện tại.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
                                {processedTasks.map(t => {
                                    const overdue = isOverdue(t);
                                    const catInfo = getCategoryStyles(t.category);
                                    const isExpanded = expandedTaskId === t.id;

                                    return (
                                        <div
                                            key={t.id}
                                            className={`p-4 rounded-3xl border flex flex-col gap-3 transition-all hover:scale-[1.01] ${t.completed ? 'opacity-50' : ''} ${darkMode ? 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/60' : 'bg-white border-gray-200 hover:bg-slate-50'} shadow-sm`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleComplete(t.id)}
                                                    className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all mt-0.5 ${t.completed ? 'bg-green-500 border-green-500 text-white' : (darkMode ? 'border-slate-600 hover:border-indigo-400' : 'border-gray-300 hover:border-indigo-500')}`}
                                                    title={t.completed ? 'Đánh dấu chưa xong' : 'Hoàn thành công việc'}
                                                >
                                                    {t.completed && <FaCheck size={10} />}
                                                </button>

                                                <div
                                                    onClick={() => handleToggleComplete(t.id)}
                                                    className="flex-1 min-w-0 cursor-pointer select-none"
                                                >
                                                    <h4 className={`font-black text-sm break-words ${t.completed ? 'line-through opacity-70' : ''}`}>
                                                        {t.title}
                                                    </h4>

                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        <span className={`flex items-center gap-1 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${catInfo.bg}`}>
                                                            {catInfo.icon}
                                                            {catInfo.label}
                                                        </span>

                                                        <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                                            t.priority === 'high' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                                                t.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                                                                    'bg-green-500/10 text-green-500 border border-green-500/20'
                                                        }`}>
                                                            {t.priority === 'high' ? 'Khẩn cấp' : t.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                                                        </span>

                                                        {t.dueDate && (
                                                            <span className={`flex items-center gap-1 text-[9px] font-black px-2.5 py-0.5 rounded-full ${overdue ? 'bg-red-500/20 text-red-500 border border-red-500/30 animate-pulse' : (darkMode ? 'bg-slate-700/50 text-slate-400 border border-slate-700' : 'bg-slate-200 text-slate-600 border border-slate-300')}`}>
                                                                {overdue ? <FaExclamationTriangle size={8} /> : <FaClock size={8} />}
                                                                {t.dueDate} {t.dueTime && `@ ${t.dueTime}`}
                                                                {overdue && ' (Quá hạn)'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0">
                                                    {(t.notes || '').trim() && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleExpand(t.id);
                                                            }}
                                                            className={`p-2.5 rounded-xl transition-all ${darkMode ? 'text-gray-400 hover:bg-white/10 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-slate-800'}`}
                                                            title="Chi tiết"
                                                        >
                                                            {isExpanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                                                        </button>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteTask(t.id);
                                                        }}
                                                        className="p-2.5 rounded-xl text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all"
                                                        title="Xóa công việc"
                                                    >
                                                        <FaTrash size={12} />
                                                    </button>
                                                </div>
                                            </div>

                                            {isExpanded && (t.notes || '').trim() && (
                                                <div className={`mt-2 pt-2 border-t ${darkMode ? 'border-slate-700/60' : 'border-gray-100'}`}>
                                                    <p className={`mt-2 text-xs font-medium leading-relaxed p-3 rounded-2xl whitespace-pre-wrap ${darkMode ? 'bg-slate-900/60 text-gray-300' : 'bg-slate-50 text-slate-600'}`}>
                                                        {t.notes}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TodoTab;