import { FaCircleNotch, FaPhoneSlash, FaTimes } from 'react-icons/fa';

const statusTextMap = {
    outgoing_ringing: 'Dang goi video...',
    rejected: 'Nguoi nhan da tu choi cuoc goi',
    busy: 'Nguoi nhan dang ban',
    missed: 'Ban da bo lo cuoc goi',
    timeout: 'Nguoi nhan khong bat may',
    failed: 'Khong the bat dau cuoc goi',
    cancelled: 'Ban da huy cuoc goi',
    ended: 'Cuoc goi da ket thuc',
    offline: 'Nguoi nhan dang offline',
    forbidden: 'Khong du dieu kien de goi video',
    invalid: 'Thong tin cuoc goi khong hop le',
    not_found: 'Cuoc goi khong con ton tai',
    invalid_state: 'Cuoc goi dang o trang thai khong hop le',
};

const directionTitleMap = {
    outgoing: 'Dang goi',
    incoming: 'Trang thai cuoc goi',
};

const OutgoingCallModal = ({ visible, status, direction, peer, message, countdownSec, onCancel, onClose }) => {
    if (!visible) return null;

    const isRinging = status === 'outgoing_ringing';
    const description = message || statusTextMap[status] || 'Dang xu ly cuoc goi';

    return (
        <div className="fixed inset-0 z-[1150] flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-[30px] bg-slate-950/95 border border-white/10 text-white px-8 py-10 shadow-[0_25px_80px_rgba(0,0,0,0.55)]">
                <div className="text-center">
                    <div className="w-24 h-24 rounded-[28px] bg-gradient-to-br from-indigo-500 to-cyan-500 mx-auto mb-6 flex items-center justify-center text-3xl font-black uppercase shadow-xl overflow-hidden">
                        {peer?.avatar ? (
                            <img src={peer.avatar} alt={peer.displayName} className="w-full h-full object-cover" />
                        ) : (
                            <span>{(peer?.displayName || peer?.username || '?').slice(0, 2)}</span>
                        )}
                    </div>

                    <p className="text-xs uppercase tracking-[0.35em] text-cyan-300 mb-3 font-black">
                        {directionTitleMap[direction] || 'Video Call'}
                    </p>
                    <h2 className="text-2xl font-black tracking-tight">{peer?.displayName || peer?.username}</h2>
                    <p className="text-sm text-slate-300 mt-4 min-h-[40px] leading-relaxed">{description}</p>
                    {isRinging && countdownSec > 0 && (
                        <p className="text-xs text-slate-400 mt-2 uppercase tracking-[0.25em]">
                            Timeout sau {countdownSec}s
                        </p>
                    )}
                </div>

                <div className="mt-8 flex items-center justify-center gap-4">
                    {isRinging ? (
                        <>
                            <div className="w-14 h-14 rounded-full bg-cyan-500/15 text-cyan-300 flex items-center justify-center animate-spin">
                                <FaCircleNotch size={20} />
                            </div>
                            <button
                                type="button"
                                onClick={onCancel}
                                className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg active:scale-95"
                                title="Huy cuoc goi"
                            >
                                <FaPhoneSlash size={18} />
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-14 h-14 rounded-full bg-white/10 text-white flex items-center justify-center shadow-lg active:scale-95"
                            title="Dong"
                        >
                            <FaTimes size={18} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OutgoingCallModal;
