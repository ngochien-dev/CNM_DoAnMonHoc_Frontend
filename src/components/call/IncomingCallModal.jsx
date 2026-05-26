import { useEffect } from 'react';
import { FaPhoneSlash, FaVideo } from 'react-icons/fa';

const CALL_DEBUG_ENABLED =
    import.meta.env.VITE_CALL_DEBUG === 'true' ||
    (import.meta.env.DEV && import.meta.env.VITE_CALL_DEBUG !== 'false');

const IncomingCallModal = ({ visible, peer, countdownSec, onAccept, onReject, accepting }) => {
    useEffect(() => {
        if (!visible || !CALL_DEBUG_ENABLED) return;
        console.debug('[CALL][FRONTEND]', 'IncomingCallModal visible.', {
            peerUsername: peer?.username || null,
            peerDisplayName: peer?.displayName || null,
            countdownSec,
            accepting,
        });
    }, [visible, peer?.username, peer?.displayName, countdownSec, accepting]);

    if (!visible) return null;

    const handleAccept = () => {
        if (accepting) return;
        if (CALL_DEBUG_ENABLED) {
            console.debug('[CALL][FRONTEND]', 'IncomingCallModal accept clicked.', {
                peerUsername: peer?.username || null,
                countdownSec,
            });
        }
        onAccept();
    };

    const handleReject = () => {
        if (accepting) return;
        if (CALL_DEBUG_ENABLED) {
            console.debug('[CALL][FRONTEND]', 'IncomingCallModal reject clicked.', {
                peerUsername: peer?.username || null,
                countdownSec,
            });
        }
        onReject();
    };

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <div className="w-full max-w-md rounded-[32px] bg-slate-950/95 border border-white/10 text-white p-8 shadow-[0_25px_80px_rgba(0,0,0,0.55)]">
                <div className="text-center">
                    <div className={`w-24 h-24 rounded-[28px] bg-gradient-to-br from-cyan-500 to-blue-600 mx-auto mb-6 flex items-center justify-center text-3xl font-black uppercase shadow-xl overflow-hidden ${accepting ? 'animate-pulse' : ''}`}>
                        {peer?.avatar ? (
                            <img src={peer.avatar} alt={peer.displayName} className="w-full h-full object-cover" />
                        ) : (
                            <span>{(peer?.displayName || peer?.username || '?').slice(0, 2)}</span>
                        )}
                    </div>
                    <p className="text-xs uppercase tracking-[0.35em] text-cyan-300 mb-3 font-black">
                        {accepting ? 'Yêu cầu quyền truy cập' : 'Cuoc goi den'}
                    </p>
                    <h2 className="text-3xl font-black tracking-tight">{peer?.displayName || peer?.username}</h2>
                    <p className="text-sm text-slate-300 mt-3">
                        {accepting ? 'Vui lòng cho phép quyền Camera/Micro để nghe cuộc gọi' : 'Dang goi video cho ban'}
                    </p>
                    {accepting ? (
                        <div className="mt-4 text-cyan-400 text-xs font-bold animate-pulse uppercase tracking-[0.10em]">
                            Đang chờ cấp quyền camera/micro...
                        </div>
                    ) : countdownSec > 0 && (
                        <p className="text-xs text-slate-400 mt-3 uppercase tracking-[0.25em]">
                            Tu dong tat sau {countdownSec}s
                        </p>
                    )}
                </div>

                <div className="mt-8 flex items-center justify-center gap-5">
                    <button
                        type="button"
                        onClick={handleReject}
                        disabled={accepting}
                        className={`w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all ${
                            accepting ? 'opacity-30 cursor-not-allowed' : 'hover:bg-red-600'
                        }`}
                        title="Tu choi cuoc goi"
                    >
                        <FaPhoneSlash size={20} />
                    </button>
                    <button
                        type="button"
                        onClick={handleAccept}
                        disabled={accepting}
                        className={`w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all ${
                            accepting ? 'opacity-30 cursor-not-allowed animate-pulse' : 'hover:bg-emerald-600'
                        }`}
                        title="Nhan cuoc goi"
                    >
                        <FaVideo size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IncomingCallModal;
