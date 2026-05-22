import React, { useRef, useState, useEffect, useMemo } from 'react';
import { FaPauseCircle, FaPlayCircle } from 'react-icons/fa';

const WaveformVoicePlayer = ({ src, darkMode }) => {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);

    // Generate consistent visual peaks based on the audio source string
    const peaks = useMemo(() => {
        let hash = 0;
        for (let i = 0; i < src.length; i++) {
            hash = src.charCodeAt(i) + ((hash << 5) - hash);
        }
        const generatedPeaks = [];
        for (let i = 0; i < 28; i++) {
            const peakHeight = Math.abs(Math.sin(hash + i) * 20) + 6; // Height between 6px and 26px
            generatedPeaks.push(peakHeight);
        }
        return generatedPeaks;
    }, [src]);

    useEffect(() => {
        const audio = new Audio(src);
        audioRef.current = audio;

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleLoadedMetadata = () => setDuration(audio.duration || 0);
        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
            audio.currentTime = 0;
        };

        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);

        // Preload metadata
        audio.load();

        return () => {
            audio.pause();
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [src]);

    const togglePlaybackRate = () => {
        let nextRate = 1;
        if (playbackRate === 1) nextRate = 1.5;
        else if (playbackRate === 1.5) nextRate = 2;
        
        setPlaybackRate(nextRate);
        if (audioRef.current) {
            audioRef.current.playbackRate = nextRate;
        }
    };

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.playbackRate = playbackRate;
            audioRef.current.play().catch(err => console.log("Audio play error", err));
        }
    };

    const handleWaveformClick = (e) => {
        if (!audioRef.current || duration === 0) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickPercent = Math.max(0, Math.min(1, clickX / rect.width));
        audioRef.current.currentTime = clickPercent * duration;
        setCurrentTime(clickPercent * duration);
    };

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    const formatTime = (time) => {
        if (isNaN(time)) return '0:00';
        const m = Math.floor(time / 60);
        const s = Math.floor(time % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className={`p-3 rounded-2xl flex items-center gap-3 border transition-all ${
            darkMode 
                ? 'bg-slate-900/50 border-white/5 text-slate-100' 
                : 'bg-slate-50 border-slate-200 text-slate-700'
        } max-w-[280px]`}>
            {/* Play/Pause Button */}
            <button 
                onClick={togglePlay}
                className="w-9 h-9 rounded-full bg-indigo-500 hover:bg-indigo-600 flex items-center justify-center text-white transition-all shadow-md active:scale-95 shrink-0"
            >
                {isPlaying ? <FaPauseCircle size={18}/> : <FaPlayCircle size={18} className="translate-x-[1px]"/>}
            </button>

            {/* Waveform visual bars */}
            <div className="flex flex-col flex-1 min-w-0">
                <div 
                    className="flex items-end gap-[3px] h-7 cursor-pointer relative"
                    onClick={handleWaveformClick}
                >
                    {peaks.map((height, idx) => {
                        const barPercent = (idx / peaks.length) * 100;
                        const isActive = progressPercent >= barPercent;
                        return (
                            <div 
                                key={idx}
                                style={{ height: `${height}px` }}
                                className={`w-[3px] rounded-full transition-all duration-150 ${
                                    isActive 
                                        ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' 
                                        : (darkMode ? 'bg-white/10' : 'bg-slate-300')
                                }`}
                            />
                        );
                    })}
                </div>
                {/* Time Indicator */}
                <div className="flex justify-between items-center text-[10px] text-gray-500 mt-1 font-bold">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {/* Playback speed trigger */}
            <button 
                onClick={togglePlaybackRate}
                className={`px-2 py-1 rounded-lg text-[10px] font-black tracking-wider transition-all active:scale-95 uppercase shrink-0 ${
                    playbackRate > 1 
                        ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' 
                        : (darkMode ? 'bg-white/5 border border-white/5 text-gray-400' : 'bg-slate-200 border border-slate-200 text-slate-500')
                }`}
                title="Tốc độ phát âm thanh"
            >
                {playbackRate}x
            </button>
        </div>
    );
};

export default WaveformVoicePlayer;
