import React, { useState, useEffect } from 'react';
import { 
    FaCalendarCheck, FaPlus, FaCheck, FaTrash, FaClock, 
    FaExclamationTriangle, FaSearch, FaSortAmountDown, FaChevronDown, 
    FaChevronUp, FaBook, FaBriefcase, FaUser, FaStar, FaInfoCircle
} from 'react-icons/fa';

const TodoTab = ({ user, darkMode }) => {
    const [tasks, setTasks] = useState([]);
    const [taskTitle, setTaskTitle] = useState('');
    const [taskNotes, setTaskNotes] = useState('');
    const [taskCategory, setTaskCategory] = useState('Personal'); // Personal, Work, Study, Urgent
    const [dueDate, setDueDate] = useState('');
    const [dueTime, setDueTime] = useState('');
    const [priority, setPriority] = useState('medium');
    const [filter, setFilter] = useState('all'); // all, active, completed
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('dateAdded'); // dateAdded, dueDate, priority
    const [expandedTaskId, setExpandedTaskId] = useState(null);

    // Load tasks from localStorage
    useEffect(() => {
        if (user?.username) {
            const savedTasks = localStorage.getItem(`todos_${user.username}`);
            if (savedTasks) {
                setTasks(JSON.parse(savedTasks));
            }
        }
    }, [user]);

    // Save tasks to localStorage
    const saveTasks = (newTasks) => {
        setTasks(newTasks);
        localStorage.setItem(`todos_${user.username}`, JSON.stringify(newTasks));
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
            createdAt: new Date().toISOString()
        };

        const updatedTasks = [newTask, ...tasks];
        saveTasks(updatedTasks);

        // Reset form
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
        const updatedTasks = tasks.filter(t => t.id !== taskId);
        saveTasks(updatedTasks);
    };

    // Helper to check if task is overdue
    const isOverdue = (task) => {
        if (task.completed || !task.dueDate) return false;
        const now = new Date();
        const deadlineStr = task.dueTime ? `${task.dueDate}T${task.dueTime}` : `${task.dueDate}T23:59:59`;
        const deadline = new Date(deadlineStr);
        return now > deadline;
    };

    // Toggle expand note
    const toggleExpand = (taskId) => {
        setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
    };

    // Calculate progress stats
    const totalCount = tasks.length;
    const completedCount = tasks.filter(t => t.completed).length;
    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Filter and Search
    let processedTasks = tasks.filter(t => {
        // Filter by state
        if (filter === 'active') return !t.completed;
        if (filter === 'completed') return t.completed;
        return true;
    }).filter(t => {
        // Search
        const query = searchQuery.toLowerCase();
        return t.title.toLowerCase().includes(query) || t.notes.toLowerCase().includes(query);
    });

    // Sorting
    processedTasks.sort((a, b) => {
        if (sortBy === 'dueDate') {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            const aTime = a.dueTime ? `${a.dueDate}T${a.dueTime}` : `${a.dueDate}T23:59:59`;
            const bTime = b.dueTime ? `${b.dueDate}T${b.dueTime}` : `${b.dueDate}T23:59:59`;
            return new Date(aTime) - new Date(bTime);
        }
        if (sortBy === 'priority') {
            const priorityWeight = { high: 3, medium: 2, low: 1 };
            return priorityWeight[b.priority] - priorityWeight[a.priority];
        }
        // dateAdded - Default
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Category style helper
    const getCategoryStyles = (cat) => {
        switch (cat) {
            case 'Work': return { label: 'Công việc', bg: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400', icon: <FaBriefcase size={12} /> };
            case 'Study': return { label: 'Học tập', bg: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400', icon: <FaBook size={12} /> };
            case 'Urgent': return { label: 'Quan trọng', bg: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400', icon: <FaStar size={12} /> };
            default: return { label: 'Cá nhân', bg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400', icon: <FaUser size={12} /> };
        }
    };

    return (
        <div className={`flex-1 flex flex-col h-full overflow-hidden font-sans ${darkMode ? 'bg-[#0f172a]' : 'bg-white'}`}>
            {/* Header */}
            <div className={`p-8 border-b shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
                <div>
                    <h2 className={`text-2xl font-bold flex items-center gap-3 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                        <FaCalendarCheck className="text-indigo-600" /> Quản lý Công việc
                    </h2>
                    <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Bản kế hoạch công việc cá nhân của @{user?.username}</p>
                </div>

                {/* Progress bar */}
                <div className={`w-full sm:w-72 p-4 rounded-2xl border flex flex-col gap-2 ${darkMode ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                        <span>Tiến độ hoàn thành</span>
                        <span className="text-indigo-600">{completedCount}/{totalCount} ({completionRate}%)</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                            style={{ width: `${completionRate}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                
                {/* Left Area: Add task panel */}
                <div className={`w-full lg:w-[380px] p-8 border-b lg:border-b-0 lg:border-r overflow-y-auto shrink-0 custom-scrollbar ${darkMode ? 'border-white/10 bg-[#0f172a]' : 'border-gray-200 bg-gray-50/30'}`}>
                    <form onSubmit={handleAddTask} className="space-y-6">
                        <h3 className="text-sm font-bold text-indigo-600">Thêm công việc mới</h3>
                        
                        {/* Title */}
                        <div>
                            <label className={`block text-xs font-semibold mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Tên công việc <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={taskTitle}
                                onChange={(e) => setTaskTitle(e.target.value)}
                                placeholder="Nhập tên công việc..."
                                className={`w-full px-4 py-3 text-sm rounded-xl outline-none border focus:border-indigo-500 transition-colors ${darkMode ? 'bg-black/20 border-white/10 text-white placeholder:text-gray-500' : 'bg-white border-gray-200 text-slate-800 placeholder:text-gray-400'}`}
                                required
                            />
                        </div>

                        {/* Notes */}
                        <div>
                            <label className={`block text-xs font-semibold mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Ghi chú chi tiết</label>
                            <textarea
                                value={taskNotes}
                                onChange={(e) => setTaskNotes(e.target.value)}
                                placeholder="Thêm mô tả..."
                                rows="3"
                                className={`w-full px-4 py-3 text-sm rounded-xl outline-none border focus:border-indigo-500 transition-colors resize-none ${darkMode ? 'bg-black/20 border-white/10 text-white placeholder:text-gray-500' : 'bg-white border-gray-200 text-slate-800 placeholder:text-gray-400'}`}
                            />
                        </div>

                        {/* Category & Priority Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={`block text-xs font-semibold mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Phân loại</label>
                                <select
                                    value={taskCategory}
                                    onChange={(e) => setTaskCategory(e.target.value)}
                                    className={`w-full px-4 py-3 text-sm rounded-xl outline-none border focus:border-indigo-500 transition-colors cursor-pointer ${darkMode ? 'bg-black/20 border-white/10 text-white' : 'bg-white border-gray-200 text-slate-800'}`}
                                >
                                    <option value="Personal">Cá nhân</option>
                                    <option value="Work">Công việc</option>
                                    <option value="Study">Học tập</option>
                                    <option value="Urgent">Quan trọng</option>
                                </select>
                            </div>

                            <div>
                                <label className={`block text-xs font-semibold mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Mức độ ưu tiên</label>
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value)}
                                    className={`w-full px-4 py-3 text-sm rounded-xl outline-none border focus:border-indigo-500 transition-colors cursor-pointer ${darkMode ? 'bg-black/20 border-white/10 text-white' : 'bg-white border-gray-200 text-slate-800'}`}
                                >
                                    <option value="low">Thấp</option>
                                    <option value="medium">Trung bình</option>
                                    <option value="high">Cao</option>
                                </select>
                            </div>
                        </div>

                        {/* Date & Time Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={`block text-xs font-semibold mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Hạn chót</label>
                                <input 
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className={`w-full px-4 py-3 text-sm rounded-xl outline-none border focus:border-indigo-500 transition-colors ${darkMode ? 'bg-black/20 border-white/10 text-white' : 'bg-white border-gray-200 text-slate-800'}`}
                                />
                            </div>
                            <div>
                                <label className={`block text-xs font-semibold mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Giờ</label>
                                <input 
                                    type="time"
                                    value={dueTime}
                                    onChange={(e) => setDueTime(e.target.value)}
                                    className={`w-full px-4 py-3 text-sm rounded-xl outline-none border focus:border-indigo-500 transition-colors ${darkMode ? 'bg-black/20 border-white/10 text-white' : 'bg-white border-gray-200 text-slate-800'}`}
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 mt-4"
                        >
                            <FaPlus /> Lưu công việc
                        </button>
                    </form>
                </div>

                {/* Right Area: List and Filters */}
                <div className={`flex-1 flex flex-col overflow-hidden ${darkMode ? 'bg-[#0f172a]' : 'bg-white'}`}>
                    {/* Tool Bar: Filters, Search, Sorting */}
                    <div className={`p-6 border-b flex flex-col xl:flex-row xl:items-center justify-between gap-4 shrink-0 ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
                        {/* Status Filters */}
                        <div className={`flex p-1.5 rounded-xl self-start gap-1 ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                            {['all', 'active', 'completed'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${filter === f ? 'bg-indigo-600 text-white shadow-sm' : (darkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-slate-900 hover:bg-white')}`}
                                >
                                    {f === 'all' ? 'Tất cả' : f === 'active' ? 'Chưa xong' : 'Đã xong'}
                                </button>
                            ))}
                        </div>

                        {/* Search & Sort Panel */}
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            {/* Search */}
                            <div className="relative w-full sm:w-auto">
                                <span className="absolute left-4 top-3.5 text-gray-400"><FaSearch size={14} /></span>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Tìm kiếm công việc..."
                                    className={`pl-10 pr-4 py-2.5 w-full sm:w-64 text-sm rounded-xl outline-none border focus:border-indigo-500 transition-colors ${darkMode ? 'bg-black/20 border-white/10 text-white placeholder:text-gray-500' : 'bg-white border-gray-200 text-slate-800 placeholder:text-gray-400'}`}
                                />
                            </div>

                            {/* Sort */}
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <span className="text-gray-400 hidden sm:block"><FaSortAmountDown size={16} /></span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className={`p-2.5 text-sm rounded-xl border outline-none font-semibold focus:border-indigo-500 cursor-pointer w-full sm:w-auto ${darkMode ? 'bg-black/20 border-white/10 text-gray-300' : 'bg-white border-gray-200 text-slate-700'}`}
                                >
                                    <option value="dateAdded">Mới nhất</option>
                                    <option value="dueDate">Hạn chót gần nhất</option>
                                    <option value="priority">Độ ưu tiên cao nhất</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Task Board Scrollable */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        {processedTasks.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-50 min-h-[300px]">
                                <FaCalendarCheck size={64} className="mb-6 text-gray-400" />
                                <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Chưa có công việc nào!</p>
                                <p className={`text-sm mt-2 max-w-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Không tìm thấy công việc nào phù hợp với bộ lọc hiện tại.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4 max-w-7xl">
                                {processedTasks.map(t => {
                                    const overdue = isOverdue(t);
                                    const catInfo = getCategoryStyles(t.category);
                                    const isExpanded = expandedTaskId === t.id;

                                    return (
                                        <div 
                                            key={t.id}
                                            className={`p-5 rounded-2xl border flex flex-col gap-3 transition-all duration-300 hover:shadow-md ${t.completed ? 'opacity-60' : ''} ${darkMode ? 'bg-[#1e293b] border-white/10 hover:border-indigo-500/30' : 'bg-white border-gray-200 hover:border-indigo-200'} shadow-sm`}
                                        >
                                            <div className="flex items-start gap-4">
                                                {/* Check Box */}
                                                <button 
                                                    onClick={() => handleToggleComplete(t.id)}
                                                    className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors mt-0.5 ${t.completed ? 'bg-emerald-500 border-emerald-500 text-white' : (darkMode ? 'border-gray-500 hover:border-indigo-400' : 'border-gray-300 hover:border-indigo-500')}`}
                                                >
                                                    {t.completed && <FaCheck size={12} />}
                                                </button>

                                                {/* Text Details */}
                                                <div 
                                                    onClick={() => handleToggleComplete(t.id)}
                                                    className="flex-1 min-w-0 cursor-pointer select-none"
                                                >
                                                    <h4 className={`text-base font-bold break-words transition-colors ${t.completed ? 'line-through text-gray-500' : (darkMode ? 'text-white' : 'text-slate-800')}`}>{t.title}</h4>
                                                    
                                                    {/* Badges Grid */}
                                                    <div className="flex flex-wrap gap-2 mt-3">
                                                        {/* Category Badge */}
                                                        <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${catInfo.bg}`}>
                                                            {catInfo.icon}
                                                            {catInfo.label}
                                                        </span>

                                                        {/* Priority Badge */}
                                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                                                            t.priority === 'high' ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' :
                                                            t.priority === 'medium' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' :
                                                            'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                                                        }`}>
                                                            {t.priority === 'high' ? 'Khẩn cấp' : t.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                                                        </span>

                                                        {/* Due Date Badge */}
                                                        {t.dueDate && (
                                                            <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${overdue ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 animate-pulse' : (darkMode ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-600')}`}>
                                                                {overdue ? <FaExclamationTriangle size={12} /> : <FaClock size={12} />}
                                                                {t.dueDate} {t.dueTime && `@ ${t.dueTime}`}
                                                                {overdue && ' (Quá hạn)'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); toggleExpand(t.id); }}
                                                        className={`p-2 rounded-xl transition-colors ${darkMode ? 'text-gray-400 hover:bg-white/10 hover:text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-slate-800'}`}
                                                        title="Chi tiết"
                                                    >
                                                        <FaInfoCircle size={16} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteTask(t.id); }}
                                                        className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/20 transition-colors"
                                                        title="Xóa công việc"
                                                    >
                                                        <FaTrash size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Notes / Details Toggle */}
                                            {isExpanded && t.notes && (
                                                <div className={`mt-2 pt-4 border-t ${darkMode ? 'border-white/10' : 'border-gray-100'}`}>
                                                    <p className={`text-sm leading-relaxed p-4 rounded-xl whitespace-pre-wrap ${darkMode ? 'bg-black/20 text-gray-300' : 'bg-gray-50 text-slate-700'}`}>
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
