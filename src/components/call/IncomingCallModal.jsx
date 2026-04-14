import { FaPhoneSlash, FaVideo } from 'react-icons/fa';

const IncomingCallModal = ({ visible, peer, countdownSec, onAccept, onReject }) => {
    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <div className="w-full max-w-md rounded-[32px] bg-slate-950/95 border border-white/10 text-white p-8 shadow-[0_25px_80px_rgba(0,0,0,0.55)]">
                <div className="text-center">
                    <div className="w-24 h-24 rounded-[28px] bg-gradient-to-br from-cyan-500 to-blue-600 mx-auto mb-6 flex items-center justify-center text-3xl font-black uppercase shadow-xl overflow-hidden">
                        {peer?.avatar ? (
                            <img src={peer.avatar} alt={peer.displayName} className="w-full h-full object-cover" />
                        ) : (
                            <span>{(peer?.displayName || peer?.username || '?').slice(0, 2)}</span>
                        )}
                    </div>
                    <p className="text-xs uppercase tracking-[0.35em] text-cyan-300 mb-3 font-black">Cuoc goi den</p>
                    <h2 className="text-3xl font-black tracking-tight">{peer?.displayName || peer?.username}</h2>
                    <p className="text-sm text-slate-300 mt-3">Dang goi video cho ban</p>
                    {countdownSec > 0 && (
                        <p className="text-xs text-slate-400 mt-3 uppercase tracking-[0.25em]">
                            Tu dong tat sau {countdownSec}s
                        </p>
                    )}
                </div>

                <div className="mt-8 flex items-center justify-center gap-5">
                    <button
                        type="button"
                        onClick={onReject}
                        className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg active:scale-95"
                        title="Tu choi cuoc goi"
                    >
                        <FaPhoneSlash size={20} />
                    </button>
                    <button
                        type="button"
                        onClick={onAccept}
                        className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg active:scale-95"
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
