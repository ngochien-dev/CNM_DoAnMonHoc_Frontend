import { useMemo } from "react";
import { useGroupCall } from "../../context/GroupCallContext";
import ParticipantVideo from "./ParticipantVideo";
import GroupCallControls from "./GroupCallControls";

export default function GroupCallOverlay() {
  const {
    isInGroupCall,
    activeGroupCall,
    participants,
    mediaStates,
    localStream,
    remoteStreams,
    audioEnabled,
    videoEnabled,
    isScreenSharing,
    error,
    canEnd,
    currentUsername,
    leaveGroupCall,
    endGroupCall,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    getDebugState,
  } = useGroupCall();

  const remoteUsernames = useMemo(() => {
    const fromStreams = Object.keys(remoteStreams || {});
    const fromParticipants = (participants || [])
      .map((item) => item.username || item)
      .filter(Boolean)
      .filter((username) => username !== currentUsername);

    return Array.from(new Set([...fromParticipants, ...fromStreams]));
  }, [participants, remoteStreams, currentUsername]);

  if (!isInGroupCall) return null;

  const totalTiles = 1 + remoteUsernames.length;
  const gridColumns =
    totalTiles <= 1
      ? "1fr"
      : totalTiles === 2
      ? "repeat(2, minmax(0, 1fr))"
      : "repeat(auto-fit, minmax(240px, 1fr))";

  const debugState = getDebugState ? getDebugState() : null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10001,
        background: "rgba(3,7,18,0.96)",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        padding: "20px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "16px",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "22px",
            }}
          >
            Video call nhóm
          </h2>

          <p
            style={{
              margin: "4px 0 0",
              color: "#cbd5e1",
              fontSize: "14px",
            }}
          >
            Group: {activeGroupCall?.groupId || "unknown"} · Người tham gia:{" "}
            {totalTiles}
          </p>
        </div>

        {error && (
          <div
            style={{
              maxWidth: "420px",
              padding: "10px 12px",
              borderRadius: "12px",
              background: "rgba(220,38,38,0.18)",
              color: "#fecaca",
              border: "1px solid rgba(248,113,113,0.35)",
              fontSize: "13px",
            }}
          >
            {error}
          </div>
        )}
      </div>

      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: gridColumns,
          gap: "14px",
          alignContent: "center",
          paddingBottom: "92px",
        }}
      >
        <ParticipantVideo
          username={currentUsername || "Bạn"}
          stream={localStream}
          isLocal
          audioEnabled={audioEnabled}
          videoEnabled={videoEnabled}
        />

        {remoteUsernames.map((username) => {
          const remoteState = mediaStates?.[username] || {};

          return (
            <ParticipantVideo
              key={username}
              username={username}
              stream={remoteStreams?.[username]}
              isLocal={false}
              audioEnabled={remoteState.audioEnabled !== false}
              videoEnabled={remoteState.videoEnabled !== false}
            />
          );
        })}
      </div>

      {debugState && (
        <details
          style={{
            position: "absolute",
            right: "20px",
            bottom: "24px",
            maxWidth: "360px",
            background: "rgba(15,23,42,0.86)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "12px",
            padding: "10px",
            fontSize: "12px",
            color: "#cbd5e1",
            zIndex: 10002,
          }}
        >
          <summary style={{ cursor: "pointer", color: "#fff" }}>
            Debug group call
          </summary>
          <pre
            style={{
              margin: "10px 0 0",
              maxHeight: "220px",
              overflow: "auto",
              whiteSpace: "pre-wrap",
            }}
          >
            {JSON.stringify(debugState, null, 2)}
          </pre>
        </details>
      )}

      <GroupCallControls
        audioEnabled={audioEnabled}
        videoEnabled={videoEnabled}
        isScreenSharing={isScreenSharing}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onScreenShare={isScreenSharing ? stopScreenShare : startScreenShare}
        onLeave={leaveGroupCall}
        onEnd={endGroupCall}
        canEnd={canEnd}
      />
    </div>
  );
}