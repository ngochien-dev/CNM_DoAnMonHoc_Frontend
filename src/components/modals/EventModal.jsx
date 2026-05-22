import React, { useState } from 'react';
import { FaCalendarAlt, FaTimes } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const EventModal = ({ isOpen, onClose, socket, user, activeRoom, darkMode }) => {
    const [eventTitle, setEventTitle] = useState("");
    const [eventDate, setEventDate] = useState("");
    const [eventTime, setEventTime] = useState("");

    if (!isOpen) return null;

    const handleCreateEvent = () => {
        if (!eventTitle.trim() || !eventDate || !eventTime) {
            toast.error("Vui lòng điền đủ thông tin sự kiện!");
            return;
        }
        socket.emit('send_message', { 
            sender: user.displayName, 
            senderUsername: user.username, 
            msgType: 'event',
            text: 'Lịch nhóm mới: ' + eventTitle,
            eventData: { title: eventTitle, date: eventDate, time: eventTime, attendees: [] },
            roomId: activeRoom.id, 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        });
        setEventTitle("");
        setEventDate("");
        setEventTime("");
        onClose();
        toast.success("Đã tạo lịch nhóm!");
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[500] backdrop-blur-sm animate-in zoom-in-95 p-4">
            <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${darkMode ? 'bg-slate-900 border border-white/10' : 'bg-white'}`}>
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-purple-600 text-white">
                    <h3 className="font-bold uppercase text-sm flex items-center gap-2"><FaCalendarAlt/> Tạo Lịch Nhóm</h3>
                    <button onClick={onClose} className="hover:text-red-300 transition-colors"><FaTimes /></button>
                </div>
                <div className="p-6 space-y-4">
                    <input 
                        value={eventTitle} 
                        onChange={e => setEventTitle(e.target.value)} 
                        placeholder="Tên sự kiện..." 
                        className={`w-full p-3 rounded-xl border font-bold ${darkMode ? 'bg-black/20 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-slate-800'}`} 
                    />
                    <div className="flex gap-4">
                        <input 
                            type="date" 
                            value={eventDate} 
                            onChange={e => setEventDate(e.target.value)} 
                            className={`w-full p-3 rounded-xl border text-sm ${darkMode ? 'bg-black/20 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-slate-800'}`} 
                        />
                        <input 
                            type="time" 
                            value={eventTime} 
                            onChange={e => setEventTime(e.target.value)} 
                            className={`w-full p-3 rounded-xl border text-sm ${darkMode ? 'bg-black/20 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-slate-800'}`} 
                        />
                    </div>
                    <button 
                        onClick={handleCreateEvent} 
                        className="w-full py-3 bg-purple-600 text-white font-black uppercase tracking-widest rounded-xl shadow-lg mt-4 hover:bg-purple-500 transition-all"
                    >
                        Tạo Lịch Nhóm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EventModal;
