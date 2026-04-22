import { useEffect, useRef } from 'react';
import CallControls from './CallControls';

function attachStream(videoElement, stream, muted = false) {
    if (!videoElement) return;
    if (videoElement.srcObject === stream) return;

    videoElement.srcObject = stream || null;
    videoElement.muted = muted;

    if (stream) {
        videoElement.play().catch(() => {});
    }
}

function formatDuration(durationSec) {
    const safeDuration = Math.max(0, durationSec || 0);
    const minutes = Math.floor(safeDuration / 60)
        .toString()
        .padStart(2, '0');
    const seconds = (safeDuration % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
}

const CallOverlay = ({
    visible,
    status,
    peer,
    localStream,
    remoteStream,
    isMicEnabled,
    isCameraEnabled,
    onToggleMic,
    onToggleCamera,
    onEndCall,
    connectionLabel,
    connectionState,
    callDurationSec,
}) => {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    useEffect(() => {
        attachStream(localVideoRef.current, localStream, true);
    }, [localStream]);

    useEffect(() => {
        attachStream(remoteVideoRef.current, remoteStream, false);
    }, [remoteStream]);

    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-[1250] bg-[#04070d] text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_45%),radial-gradient(circle_at_bottom,_rgba(14,165,233,0.18),_transparent_40%)]" />

            <div className="relative h-full flex flex-col">
                <div className="px-6 py-5 flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-cyan-300 font-black">
                            {status === 'connecting' ? 'Dang ket noi' : 'Dang goi video'}
                        </p>
                        <h2 className="text-2xl font-black mt-2">{peer?.displayName || peer?.username}</h2>
                        <p className="text-sm text-slate-300 mt-1">{connectionLabel}</p>
                    </div>

                    <div className="text-right">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-200">
                            <span>{connectionState}</span>
                            <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        </div>
                        <p className="mt-3 text-3xl font-black tracking-tight">{formatDuration(callDurationSec)}</p>
                    </div>
                </div>

                <div className="flex-1 px-6 pb-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                    <div className="relative rounded-[32px] overflow-hidden border border-white/10 bg-slate-950/80 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
                        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover bg-slate-900" />
                        {!remoteStream && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                                <div className="w-24 h-24 rounded-[28px] bg-cyan-500/10 text-cyan-300 flex items-center justify-center text-3xl font-black uppercase mb-6">
                                    {(peer?.displayName || peer?.username || '?').slice(0, 2)}
                                </div>
                                <h3 className="text-2xl font-black">{peer?.displayName || peer?.username}</h3>
                                <p className="text-slate-300 mt-3">
                                    {status === 'connecting'
                                        ? 'Dang cho ket noi video tu nguoi ben kia...'
                                        : 'Dang chuan bi cuoc goi'}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-5">
                        <div className="relative rounded-[28px] overflow-hidden border border-white/10 bg-slate-950/80 min-h-[260px] shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover bg-slate-900" />
                            {(!localStream || !isCameraEnabled) && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                                    <div className="w-20 h-20 rounded-[22px] bg-white/10 text-white flex items-center justify-center text-2xl font-black uppercase mb-4">
                                        Toi
                                    </div>
                                    <p className="text-sm text-slate-300">
                                        {!localStream ? 'Dang mo camera...' : 'Camera cua ban dang tat'}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
                            <div className="flex items-center justify-center gap-3 mb-5">
                                <span
                                    className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] ${
                                        isMicEnabled ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                                    }`}
                                >
                                    {isMicEnabled ? 'Mic on' : 'Mic off'}
                                </span>
                                <span
                                    className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] ${
                                        isCameraEnabled ? 'bg-cyan-500/15 text-cyan-300' : 'bg-orange-500/20 text-orange-300'
                                    }`}
                                >
                                    {isCameraEnabled ? 'Camera on' : 'Camera off'}
                                </span>
                            </div>

                            <CallControls
                                isMicEnabled={isMicEnabled}
                                isCameraEnabled={isCameraEnabled}
                                onToggleMic={onToggleMic}
                                onToggleCamera={onToggleCamera}
                                onEndCall={onEndCall}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CallOverlay;