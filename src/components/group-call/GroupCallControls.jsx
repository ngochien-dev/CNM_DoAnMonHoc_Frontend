export default function GroupCallControls({
  audioEnabled,
  videoEnabled,
  onToggleAudio,
  onToggleVideo,
  onLeave,
  onEnd,
  canEnd = false,
}) {
  const buttonStyle = {
    border: "none",
    borderRadius: "999px",
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 700,
    color: "#fff",
    background: "rgba(255,255,255,0.16)",
  };

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        bottom: "24px",
        transform: "translateX(-50%)",
        display: "flex",
        gap: "12px",
        padding: "12px",
        borderRadius: "999px",
        background: "rgba(17,24,39,0.82)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.12)",
        zIndex: 10002,
      }}
    >
      <button
        type="button"
        onClick={onToggleAudio}
        style={{
          ...buttonStyle,
          background: audioEnabled ? "rgba(255,255,255,0.16)" : "#f97316",
        }}
        title={audioEnabled ? "Tắt mic" : "Bật mic"}
      >
        {audioEnabled ? "🎙️ Mic" : "🔇 Mic"}
      </button>

      <button
        type="button"
        onClick={onToggleVideo}
        style={{
          ...buttonStyle,
          background: videoEnabled ? "rgba(255,255,255,0.16)" : "#f97316",
        }}
        title={videoEnabled ? "Tắt camera" : "Bật camera"}
      >
        {videoEnabled ? "📹 Camera" : "🚫 Camera"}
      </button>

      <button
        type="button"
        onClick={onLeave}
        style={{
          ...buttonStyle,
          background: "#dc2626",
        }}
        title="Rời cuộc gọi"
      >
        Rời
      </button>

      {canEnd && (
        <button
          type="button"
          onClick={onEnd}
          style={{
            ...buttonStyle,
            background: "#991b1b",
          }}
          title="Kết thúc cuộc gọi cho tất cả"
        >
          Kết thúc
        </button>
      )}
    </div>
  );
}