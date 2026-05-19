import React, { useState, useEffect } from 'react';
import { FaTimes, FaPlus, FaCheck, FaTrash, FaCalendarCheck, FaClock, FaExclamationTriangle } from 'react-icons/fa';

const TodoModal = ({ user, isOpen, onClose, darkMode }) => {
    const [tasks, setTasks] = useState([]);
    const [taskTitle, setTaskTitle] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [dueTime, setDueTime] = useState('');
    const [priority, setPriority] = useState('medium');
    const [filter, setFilter] = useState('all'); // all, active, completed

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

    // Filter tasks
    const filteredTasks = tasks.filter(t => {
        if (filter === 'active') return !t.completed;
        if (filter === 'completed') return t.completed;
        return true;
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#020617]/85 backdrop-blur-md z-[500] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
            <div className={`w-full max-w-2xl h-[650px] rounded-3xl shadow-2xl overflow-hidden flex flex-col border transition-colors ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
                
                {/* Header */}
                <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                    <div className="flex items-center gap-3">
                        <FaCalendarCheck className="text-2xl" />
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-wide">Nhắc Nhở & Công Việc</h2>
                            <p className="text-[10px] text-indigo-100 font-medium">Lên lịch công việc, nhắc nhở deadline cá nhân</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-10 h-10 bg-black/10 hover:bg-black/20 text-white rounded-full flex items-center justify-center transition-colors"
                    >
                        <FaTimes size={18} />
                    </button>
                </div>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* Left: Input Form */}
                    <div className={`w-full md:w-72 p-5 border-r shrink-0 flex flex-col justify-between ${darkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
                        <form onSubmit={handleAddTask} className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400">Tạo việc cần làm</h3>
                            
                            <div>
                                <label className="block text-[10px] font-black uppercase mb-1 opacity-70">Nội dung công việc</label>
                                <textarea
                                    value={taskTitle}
                                    onChange={(e) => setTaskTitle(e.target.value)}
                                    placeholder="Cần làm gì..."
                                    rows="2"
                                    className={`w-full p-3 text-sm rounded-xl outline-none border focus:border-indigo-500 font-bold ${darkMode ? 'bg-slate-800 border-slate-700 placeholder:text-slate-500 text-white' : 'bg-white border-slate-200 placeholder:text-slate-400 text-slate-800'}`}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-[10px] font-black uppercase mb-1 opacity-70">Hạn chót</label>
                                    <input 
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className={`w-full p-2.5 text-xs rounded-xl outline-none border focus:border-indigo-500 font-bold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase mb-1 opacity-70">Giờ</label>
                                    <input 
                                        type="time"
                                        value={dueTime}
                                        onChange={(e) => setDueTime(e.target.value)}
                                        className={`w-full p-2.5 text-xs rounded-xl outline-none border focus:border-indigo-500 font-bold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase mb-1 opacity-70">Mức độ ưu tiên</label>
                                <div className="flex gap-2">
                                    {['low', 'medium', 'high'].map(p => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setPriority(p)}
                                            className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg border transition-all ${priority === p ? (
                                                p === 'high' ? 'bg-red-500/20 border-red-500 text-red-500' :
                                                p === 'medium' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' :
                                                'bg-green-500/20 border-green-500 text-green-500'
                                            ) : (darkMode ? 'border-slate-800 text-slate-400 bg-slate-800/30' : 'border-slate-200 text-slate-400 bg-white')}`}
                                        >
                                            {p === 'low' ? 'Thấp' : p === 'medium' ? 'Trung' : 'Cao'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
                            >
                                <FaPlus /> Thêm công việc
                            </button>
                        </form>

                        <div className="text-[10px] opacity-40 mt-4 font-bold text-center">
                            Lịch làm việc tự động lưu trữ trên trình duyệt
                        </div>
                    </div>

                    {/* Right: Task List */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Filters */}
                        <div className={`p-4 border-b flex gap-2 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                            {['all', 'active', 'completed'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${filter === f ? 'bg-indigo-500 text-white shadow' : (darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600')}`}
                                >
                                    {f === 'all' ? 'Tất cả' : f === 'active' ? 'Đang làm' : 'Đã xong'}
                                </button>
                            ))}
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {filteredTasks.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                    <FaCalendarCheck size={48} className="mb-3 text-indigo-400" />
                                    <p className="font-bold text-sm">Chưa có công việc nào!</p>
                                    <p className="text-xs">Hãy thêm công việc mới bên cột trái.</p>
                                </div>
                            ) : (
                                filteredTasks.map(t => {
                                    const overdue = isOverdue(t);
                                    return (
                                        <div 
                                            key={t.id}
                                            className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${t.completed ? 'opacity-50' : ''} ${darkMode ? 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/60' : 'bg-slate-50 border-slate-200 hover:bg-slate-100/50'}`}
                                        >
                                            {/* Check Box */}
                                            <button 
                                                onClick={() => handleToggleComplete(t.id)}
                                                className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all ${t.completed ? 'bg-green-500 border-green-500 text-white' : (darkMode ? 'border-slate-600 hover:border-indigo-400' : 'border-slate-300 hover:border-indigo-500')}`}
                                            >
                                                {t.completed && <FaCheck size={10} />}
                                            </button>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className={`font-bold text-sm truncate ${t.completed ? 'line-through opacity-70' : ''}`}>{t.title}</h4>
                                                
                                                <div className="flex flex-wrap gap-2 mt-1.5">
                                                    {/* Due Date Badge */}
                                                    {t.dueDate && (
                                                        <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${overdue ? 'bg-red-500/20 text-red-400 animate-pulse' : (darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600')}`}>
                                                            {overdue ? <FaExclamationTriangle size={8} /> : <FaClock size={8} />}
                                                            {t.dueDate} {t.dueTime && `@ ${t.dueTime}`}
                                                            {overdue && ' (Quá hạn)'}
                                                        </span>
                                                    )}

                                                    {/* Priority Badge */}
                                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                        t.priority === 'high' ? 'bg-red-500/10 text-red-500' :
                                                        t.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-500' :
                                                        'bg-green-500/10 text-green-500'
                                                    }`}>
                                                        {t.priority === 'high' ? 'Khẩn cấp' : t.priority === 'medium' ? 'Trung bình' : 'Thường'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <button
                                                onClick={() => handleDeleteTask(t.id)}
                                                className={`p-2 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all shrink-0`}
                                            >
                                                <FaTrash size={12} />
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TodoModal;
