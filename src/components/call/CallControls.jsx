import { FaDesktop, FaMicrophone, FaMicrophoneSlash, FaPhoneSlash, FaVideo, FaVideoSlash } from 'react-icons/fa';

const baseButtonClass =
    'w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95';

const CallControls = ({
    isMicEnabled,
    isCameraEnabled,
    isScreenSharing,
    onToggleMic,
    onToggleCamera,
    onStartScreenShare,
    onStopScreenShare,
    onEndCall,
}) => (
    <div className="flex items-center justify-center gap-4 flex-wrap">
        <button
            type="button"
            onClick={onToggleMic}
            className={`${baseButtonClass} ${isMicEnabled ? 'bg-white/15 text-white' : 'bg-amber-500 text-white'}`}
            title={isMicEnabled ? 'Tat micro' : 'Bat micro'}
        >
            {isMicEnabled ? <FaMicrophone size={18} /> : <FaMicrophoneSlash size={18} />}
        </button>

        <button
            type="button"
            onClick={onToggleCamera}
            className={`${baseButtonClass} ${isCameraEnabled ? 'bg-white/15 text-white' : 'bg-orange-500 text-white'}`}
            title={isCameraEnabled ? 'Tat camera' : 'Bat camera'}
        >
            {isCameraEnabled ? <FaVideo size={18} /> : <FaVideoSlash size={18} />}
        </button>

        <button
            type="button"
            onClick={isScreenSharing ? onStopScreenShare : onStartScreenShare}
            className={`${baseButtonClass} ${isScreenSharing ? 'bg-cyan-500 text-white ring-2 ring-cyan-300' : 'bg-white/15 text-white'}`}
            title={isScreenSharing ? 'Dung chia se' : 'Chia se man hinh'}
        >
            <FaDesktop size={18} />
        </button>

        <button
            type="button"
            onClick={onEndCall}
            className={`${baseButtonClass} bg-red-500 text-white`}
            title="Ket thuc cuoc goi"
        >
            <FaPhoneSlash size={18} />
        </button>
    </div>
);

export default CallControls;
