import React, { useState, useRef, useEffect } from 'react';
import { FaTimes, FaPaperPlane } from 'react-icons/fa';

const PaintPadModal = ({ isOpen, onClose, darkMode, onSendSketch }) => {
    const [paintColor, setPaintColor] = useState('#6366f1');
    const [paintBrushSize, setPaintBrushSize] = useState(5);
    const [isDrawing, setIsDrawing] = useState(false);

    const paintCanvasRef = useRef(null);
    const lastX = useRef(0);
    const lastY = useRef(0);

    // Tự động clear canvas khi mở modal
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                clearPaintCanvas();
            }, 100);
        }
    }, [isOpen]);

    const startDrawing = (e) => {
        const canvas = paintCanvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        lastX.current = e.clientX - rect.left;
        lastY.current = e.clientY - rect.top;
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const canvas = paintCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.beginPath();
        ctx.strokeStyle = paintColor;
        ctx.lineWidth = paintBrushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(lastX.current, lastY.current);
        ctx.lineTo(x, y);
        ctx.stroke();

        lastX.current = x;
        lastY.current = y;
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearPaintCanvas = () => {
        const canvas = paintCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = darkMode ? '#1e293b' : '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const handleSend = () => {
        const canvas = paintCanvasRef.current;
        if (!canvas) return;
        const dataUrl = canvas.toDataURL('image/png');
        onSendSketch(dataUrl); // Trả hình ảnh về cho ChatPage xử lý gửi
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[999] backdrop-blur-md p-4 animate-in zoom-in-95" onClick={onClose}>
            <div
                className={`w-[450px] rounded-3xl p-6 shadow-2xl border transition-all duration-300 flex flex-col gap-4 ${darkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-gray-100 text-slate-800'}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center">
                    <div className="flex flex-col text-left">
                        <span className="text-xs font-black uppercase text-indigo-500 tracking-wider">Studio vẽ phác thảo</span>
                        <h2 className="text-lg font-black uppercase tracking-tighter italic">Vẽ phác thảo trực tuyến 🎨</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition-colors p-1.5 bg-white/5 rounded-xl"><FaTimes size={16} /></button>
                </div>

                <div className="border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative bg-white">
                    <canvas
                        ref={paintCanvasRef}
                        width={400}
                        height={300}
                        className="w-full h-[300px] cursor-crosshair block"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                    />
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-1.5">
                            {['#6366f1', '#10b981', '#ef4444', '#f59e0b', '#ec4899', '#000000'].map(color => (
                                <button
                                    key={color}
                                    onClick={() => setPaintColor(color)}
                                    className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${paintColor === color ? 'border-white scale-105 shadow-lg' : 'border-transparent opacity-80'}`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>

                        <div className="flex items-center gap-2 flex-1 max-w-[120px]">
                            <span className="text-[10px] font-black uppercase tracking-wider opacity-75">Nét:</span>
                            <input
                                type="range"
                                min={1}
                                max={20}
                                value={paintBrushSize}
                                onChange={e => setPaintBrushSize(parseInt(e.target.value))}
                                className="w-full accent-indigo-500 h-1 bg-white/10 rounded-lg outline-none cursor-pointer"
                            />
                            <span className="text-[10px] font-black text-indigo-400 w-4 text-center">{paintBrushSize}</span>
                        </div>
                    </div>

                    <div className="flex gap-2 text-xs">
                        <button
                            onClick={clearPaintCanvas}
                            className="flex-1 py-3 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-2xl font-black uppercase tracking-wider border border-red-500/10 transition-all"
                        >
                            Xóa hết
                        </button>
                        <button
                            onClick={handleSend}
                            className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-wider shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            <FaPaperPlane size={12} /> Gửi phác thảo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaintPadModal;