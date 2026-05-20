import React, { useState, useEffect } from 'react';
import { FaTimes, FaChevronLeft, FaChevronRight, FaPalette, FaPaperPlane } from 'react-icons/fa';

const ImageLightbox = ({
    previewImage,
    setPreviewImage,
    lightboxImage,
    setLightboxImage
}) => {
    const [lightboxZoom, setLightboxZoom] = useState(1);
    const [lightboxRotation, setLightboxRotation] = useState(0);
    const [lightboxFilter, setLightboxFilter] = useState('none');

    // Reset settings when lightbox opens/closes
    useEffect(() => {
        if (lightboxImage) {
            setLightboxZoom(1);
            setLightboxRotation(0);
            setLightboxFilter('none');
        }
    }, [lightboxImage]);

    return (
        <>
            {/* Modal Xem Ảnh đơn giản */}
            {previewImage && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[1000] p-4 animate-in zoom-in-95 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
                    <button onClick={() => setPreviewImage(null)} className="absolute top-6 right-6 text-white bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all">
                        <FaTimes size={24}/>
                    </button>
                    <img src={previewImage} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" alt="Preview" onClick={(e) => e.stopPropagation()} />
                </div>
            )}

            {/* Immersive Image Lightbox & Studio */}
            {lightboxImage && (() => {
                const filterStyles = {
                    none: 'none',
                    grayscale: 'grayscale(100%)',
                    sepia: 'sepia(80%) contrast(90%)',
                    cinematic: 'contrast(125%) brightness(95%) saturate(120%)',
                    retroInvert: 'invert(100%) hue-rotate(180deg)',
                    warmDream: 'saturate(150%) sepia(20%) brightness(105%)',
                    softBlur: 'blur(2px) saturate(130%)'
                };
                return (
                    <div 
                        className="fixed inset-0 bg-black/95 z-[999] flex flex-col justify-between p-6 backdrop-blur-md font-sans select-none animate-in fade-in duration-300"
                        onClick={() => setLightboxImage(null)}
                    >
                        {/* Header bar */}
                        <div className="flex justify-between items-center bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 shadow-2xl z-[1001]" onClick={e => e.stopPropagation()}>
                            <div className="flex flex-col text-left">
                                <span className="text-xs font-black uppercase text-indigo-400 tracking-wider">Trình xem ảnh & Studio</span>
                                <span className="text-[10px] text-gray-400 font-medium">Gửi bởi @{lightboxImage.sender} vào {lightboxImage.time}</span>
                            </div>
                            
                            {/* Control actions */}
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => setLightboxZoom(prev => Math.max(1, prev - 0.25))}
                                    className="p-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition-all"
                                    title="Thu nhỏ"
                                >
                                    <FaChevronLeft size={16}/>
                                </button>
                                <span className="text-xs font-black text-white w-10 text-center">{Math.round(lightboxZoom * 100)}%</span>
                                <button 
                                    onClick={() => setLightboxZoom(prev => Math.min(3, prev + 0.25))}
                                    className="p-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition-all"
                                    title="Phóng to"
                                >
                                    <FaChevronRight size={16}/>
                                </button>
                                <div className="h-6 w-px bg-white/10"></div>
                                <button 
                                    onClick={() => setLightboxRotation(prev => (prev + 90) % 360)}
                                    className="p-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition-all"
                                    title="Xoay ảnh 90°"
                                >
                                    <FaPalette size={16} className="animate-spin" style={{ animationDuration: '6s' }} />
                                </button>
                                <a 
                                    href={lightboxImage.url} 
                                    download={`ott_attachment_${Date.now()}.png`}
                                    className="p-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition-all"
                                    title="Tải xuống ảnh gốc"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <FaPaperPlane size={16} className="rotate-45" />
                                </a>
                                <div className="h-6 w-px bg-white/10"></div>
                                <button 
                                    onClick={() => setLightboxImage(null)} 
                                    className="p-2 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-xl transition-all"
                                    title="Đóng"
                                >
                                    <FaTimes size={16}/>
                                </button>
                            </div>
                        </div>

                        {/* Main Image Viewport */}
                        <div className="flex-1 flex items-center justify-center overflow-hidden py-4">
                            <div 
                                className="relative transition-all duration-300 ease-out max-w-full max-h-[70vh] flex items-center justify-center"
                                style={{
                                    transform: `scale(${lightboxZoom}) rotate(${lightboxRotation}deg)`,
                                }}
                                onClick={e => e.stopPropagation()}
                            >
                                <img 
                                    src={lightboxImage.url} 
                                    className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-[0_0_80px_rgba(99,102,241,0.25)] border border-white/10 transition-all duration-300" 
                                    style={{
                                        filter: filterStyles[lightboxFilter] || 'none'
                                    }}
                                    alt="Studio Preview" 
                                />
                            </div>
                        </div>

                        {/* Bottom Studio Filter Selector */}
                        <div 
                            className="bg-black/60 backdrop-blur-xl p-4 rounded-3xl border border-white/5 shadow-2xl flex flex-col items-center gap-3 z-[1001] max-w-xl mx-auto w-full"
                            onClick={e => e.stopPropagation()}
                        >
                            <span className="text-[10px] font-black uppercase text-indigo-400 tracking-[3px]">Bộ lọc màu Studio nghệ thuật</span>
                            <div className="flex items-center gap-2 overflow-x-auto w-full justify-center py-1 scrollbar-hide">
                                {[
                                    { id: 'none', label: 'Bản gốc' },
                                    { id: 'grayscale', label: 'Cổ điển B&W' },
                                    { id: 'sepia', label: 'Hoài niệm' },
                                    { id: 'cinematic', label: 'Điện ảnh' },
                                    { id: 'retroInvert', label: 'Âm bản Retro' },
                                    { id: 'warmDream', label: 'Mơ mộng' },
                                    { id: 'softBlur', label: 'Ảo ảnh' }
                                ].map(filter => (
                                    <button
                                        key={filter.id}
                                        onClick={() => setLightboxFilter(filter.id)}
                                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wider uppercase border transition-all shrink-0 ${
                                            lightboxFilter === filter.id 
                                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25 scale-105 font-black' 
                                                : 'bg-white/5 border-white/5 hover:border-white/20 text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        {filter.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            })()}
        </>
    );
};

export default ImageLightbox;
