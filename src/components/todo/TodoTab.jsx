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
            case 'Work': return { label: 'Công việc', bg: 'bg-blue-500/10 text-blue-500 border border-blue-500/20', icon: <FaBriefcase size={10} /> };
            case 'Study': return { label: 'Học tập', bg: 'bg-purple-500/10 text-purple-500 border border-purple-500/20', icon: <FaBook size={10} /> };
            case 'Urgent': return { label: 'Quan trọng', bg: 'bg-red-500/10 text-red-500 border border-red-500/20', icon: <FaStar size={10} /> };
            default: return { label: 'Cá nhân', bg: 'bg-green-500/10 text-green-500 border border-green-500/20', icon: <FaUser size={10} /> };
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className={`p-6 border-b shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${darkMode ? 'border-white/5 bg-slate-900/40' : 'border-gray-200 bg-white shadow-sm'}`}>
                <div>
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                        <FaCalendarCheck className="text-indigo-500 text-3xl" /> Lập Lịch & Nhắc Nhở Công Việc
                    </h2>
                    <p className="text-xs text-gray-500 font-medium">Bản kế hoạch công việc cá nhân của @{user?.username}</p>
                </div>

                {/* Progress bar */}
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

            {/* Main Area */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                
                {/* Left Area: Add task panel */}
                <div className={`w-full lg:w-[350px] p-6 border-b lg:border-b-0 lg:border-r overflow-y-auto shrink-0 ${darkMode ? 'border-white/5 bg-slate-900/20' : 'border-gray-200 bg-slate-50/50'}`}>
                    <form onSubmit={handleAddTask} className="space-y-5">
                        <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400">Tạo công việc mới</h3>
                        
                        {/* Title */}
                        <div>
                            <label className="block text-[10px] font-black uppercase mb-1.5 opacity-70">Nội dung công việc</label>
                            <input
                                type="text"
                                value={taskTitle}
                                onChange={(e) => setTaskTitle(e.target.value)}
                                placeholder="Gõ việc cần làm..."
                                className={`w-full p-4 text-sm rounded-2xl outline-none border focus:border-indigo-500 font-bold transition-all ${darkMode ? 'bg-slate-800/50 border-slate-700 placeholder:text-slate-500 text-white' : 'bg-white border-gray-200 placeholder:text-slate-400 text-slate-800'}`}
                                required
                            />
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-[10px] font-black uppercase mb-1.5 opacity-70">Ghi chú / Chi tiết</label>
                            <textarea
                                value={taskNotes}
                                onChange={(e) => setTaskNotes(e.target.value)}
                                placeholder="Mô tả cụ thể (nếu có)..."
                                rows="3"
                                className={`w-full p-4 text-sm rounded-2xl outline-none border focus:border-indigo-500 font-semibold transition-all ${darkMode ? 'bg-slate-800/50 border-slate-700 placeholder:text-slate-500 text-white' : 'bg-white border-gray-200 placeholder:text-slate-400 text-slate-800'}`}
                            />
                        </div>

                        {/* Category & Priority Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase mb-1.5 opacity-70">Phân loại</label>
                                <select
                                    value={taskCategory}
                                    onChange={(e) => setTaskCategory(e.target.value)}
                                    className={`w-full p-3.5 text-xs rounded-xl outline-none border focus:border-indigo-500 font-bold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200 text-slate-800'}`}
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

                        {/* Date & Time Grid */}
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

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-black text-xs uppercase tracking-[3px] rounded-2xl transition-all hover:scale-[1.02] shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                        >
                            <FaPlus /> Thêm công việc
                        </button>
                    </form>
                </div>

                {/* Right Area: List and Filters */}
                <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
                    {/* Tool Bar: Filters, Search, Sorting */}
                    <div className={`p-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 ${darkMode ? 'border-white/5' : 'border-gray-200'}`}>
                        {/* Status Filters */}
                        <div className="flex bg-slate-800/10 dark:bg-black/20 p-1 rounded-xl self-start gap-1">
                            {['all', 'active', 'completed'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${filter === f ? 'bg-indigo-500 text-white shadow-md' : (darkMode ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')}`}
                                >
                                    {f === 'all' ? 'Tất cả' : f === 'active' ? 'Chưa xong' : 'Đã xong'}
                                </button>
                            ))}
                        </div>

                        {/* Search & Sort Panel */}
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Search */}
                            <div className="relative">
                                <span className="absolute left-3.5 top-3 text-gray-500"><FaSearch size={14} /></span>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Tìm kiếm công việc..."
                                    className={`pl-10 pr-4 py-2.5 w-60 text-xs rounded-xl outline-none border focus:border-indigo-500 font-semibold ${darkMode ? 'bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500' : 'bg-white border-gray-200 text-slate-800 placeholder:text-gray-400'}`}
                                />
                            </div>

                            {/* Sort */}
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500"><FaSortAmountDown size={14} /></span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className={`p-2.5 text-xs rounded-xl border outline-none font-bold focus:border-indigo-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200 text-slate-800'}`}
                                >
                                    <option value="dateAdded">Mới nhất</option>
                                    <option value="dueDate">Hạn chót gần nhất</option>
                                    <option value="priority">Độ ưu tiên cao nhất</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Task Board Scrollable */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                        {processedTasks.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-30">
                                <FaCalendarCheck size={64} className="mb-4 text-indigo-400" />
                                <p className="font-black text-lg">Hôm nay của bạn thật thanh thản!</p>
                                <p className="text-xs max-w-sm mt-1">Không tìm thấy công việc nào phù hợp với bộ lọc hiện tại.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                                {/* Check Box */}
                                                <button 
                                                    onClick={() => handleToggleComplete(t.id)}
                                                    className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all ${t.completed ? 'bg-green-500 border-green-500 text-white' : (darkMode ? 'border-slate-600 hover:border-indigo-400' : 'border-gray-300 hover:border-indigo-500')}`}
                                                >
                                                    {t.completed && <FaCheck size={10} />}
                                                </button>

                                                {/* Text Details */}
                                                <div 
                                                    onClick={() => handleToggleComplete(t.id)}
                                                    className="flex-1 min-w-0 cursor-pointer select-none"
                                                >
                                                    <h4 className={`font-black text-sm break-words ${t.completed ? 'line-through opacity-70' : ''}`}>{t.title}</h4>
                                                    
                                                    {/* Badges Grid */}
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {/* Category Badge */}
                                                        <span className={`flex items-center gap-1 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${catInfo.bg}`}>
                                                            {catInfo.icon}
                                                            {catInfo.label}
                                                        </span>

                                                        {/* Priority Badge */}
                                                        <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                                            t.priority === 'high' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                                            t.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                                                            'bg-green-500/10 text-green-500 border border-green-500/20'
                                                        }`}>
                                                            {t.priority === 'high' ? 'Khẩn cấp' : t.priority === 'medium' ? 'Trung bình' : 'Thường'}
                                                        </span>

                                                        {/* Due Date Badge */}
                                                        {t.dueDate && (
                                                            <span className={`flex items-center gap-1 text-[9px] font-black px-2.5 py-0.5 rounded-full ${overdue ? 'bg-red-500/20 text-red-500 border border-red-500/30 animate-pulse' : (darkMode ? 'bg-slate-700/50 text-slate-400 border border-slate-700' : 'bg-slate-200 text-slate-600 border border-slate-300')}`}>
                                                                {overdue ? <FaExclamationTriangle size={8} /> : <FaClock size={8} />}
                                                                {t.dueDate} {t.dueTime && `@ ${t.dueTime}`}
                                                                {overdue && ' (Quá hạn)'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button
                                                        onClick={() => handleToggleComplete(t.id)}
                                                        className={`p-2.5 rounded-xl transition-all ${t.completed ? 'text-amber-500 hover:bg-amber-500/10' : 'text-green-500 hover:bg-green-500/10'}`}
                                                        title={t.completed ? "Đánh dấu chưa xong" : "Hoàn thành công việc"}
                                                    >
                                                        <FaCheck size={12} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteTask(t.id)}
                                                        className="p-2.5 rounded-xl text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all"
                                                        title="Xóa công việc"
                                                    >
                                                        <FaTrash size={12} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Notes / Details Toggle */}
                                            {t.notes && (
                                                <div className={`mt-2 pt-2 border-t ${darkMode ? 'border-slate-700/60' : 'border-gray-100'}`}>
                                                    <button 
                                                        onClick={() => toggleExpand(t.id)}
                                                        className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-500"
                                                    >
                                                        <FaInfoCircle size={10} /> Chi tiết {isExpanded ? <FaChevronUp size={8}/> : <FaChevronDown size={8}/>}
                                                    </button>
                                                    
                                                    {isExpanded && (
                                                        <p className={`mt-2 text-xs font-medium leading-relaxed p-3 rounded-2xl whitespace-pre-wrap ${darkMode ? 'bg-slate-900/60 text-gray-300' : 'bg-slate-50 text-slate-600'}`}>
                                                            {t.notes}
                                                        </p>
                                                    )}
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
