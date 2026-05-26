import { useEffect, useRef } from "react";

const DEBUG_PREFIX = "[GroupCallUI][ParticipantVideo]";
const RENDER_PREFIX = "[GroupCallUI]";

function describeStream(stream) {
  if (!stream) {
    return {
      exists: false,
      id: null,
      audioTracks: 0,
      videoTracks: 0,
      tracks: [],
    };
  }

  return {
    exists: true,
    id: stream.id || null,
    active: stream.active,
    audioTracks: stream.getAudioTracks().length,
    videoTracks: stream.getVideoTracks().length,
    tracks: stream.getTracks().map((track) => ({
      id: track.id,
      kind: track.kind,
      enabled: track.enabled,
      muted: track.muted,
      readyState: track.readyState,
    })),
  };
}

export default function ParticipantVideo({
  username,
  stream,
  isLocal = false,
  audioEnabled = true,
  videoEnabled = true,
}) {
  const videoRef = useRef(null);
  const trackSignature = stream
    ? stream
        .getTracks()
        .map((track) => `${track.kind}:${track.id}:${track.enabled}:${track.muted}:${track.readyState}`)
        .join("|")
    : "no-stream";
  const hasLiveVideoTrack = Boolean(
    stream?.getVideoTracks?.().some((track) => track.readyState === "live")
  );
  const shouldShowVideo = Boolean(stream && hasLiveVideoTrack && videoEnabled);

  useEffect(() => {
    const videoElement = videoRef.current;

    if (!stream) {
      if (videoElement) {
        videoElement.srcObject = null;
      }
      return;
    }

    if (!shouldShowVideo) {
      console.debug(DEBUG_PREFIX, "Render avatar because video is not available", {
        username,
        isLocal,
        videoEnabled,
        hasLiveVideoTrack,
        stream: describeStream(stream),
      });
      return;
    }

    if (!videoElement) return;

    if (videoElement.srcObject !== stream) {
      console.debug(DEBUG_PREFIX, "Attach stream to video", {
        username,
        isLocal,
        streamId: stream.id,
        tracks: stream.getTracks().map((track) => ({
          id: track.id,
          kind: track.kind,
          enabled: track.enabled,
          readyState: track.readyState,
        })),
      });

      videoElement.srcObject = stream;
    }

    videoElement.muted = isLocal;
    console.debug(RENDER_PREFIX, "render remote video stream", {
      username,
      isLocal,
      stream: describeStream(stream),
    });

    const playVideo = async () => {
      try {
        await videoElement.play();
      } catch (error) {
        console.warn(DEBUG_PREFIX, "Video play blocked or failed", {
          username,
          isLocal,
          message: error?.message,
        });
      }
    };

    playVideo();
  }, [stream, trackSignature, username, isLocal, shouldShowVideo, videoEnabled, hasLiveVideoTrack]);

  return (
    <div
      style={{
        position: "relative",
        background: "#111827",
        borderRadius: "14px",
        overflow: "hidden",
        minHeight: "180px",
        border: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      {shouldShowVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          style={{
            width: "100%",
            height: "100%",
            minHeight: "180px",
            objectFit: "cover",
            transform: isLocal ? "scaleX(-1)" : "none",
            display: "block",
          }}
        />
      ) : (
        <div
          style={{
            minHeight: "180px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: "42px",
            fontWeight: 700,
            background:
              "linear-gradient(135deg, rgba(37,99,235,0.95), rgba(124,58,237,0.95))",
          }}
        >
          {(username || "?").slice(0, 1).toUpperCase()}
        </div>
      )}

      <div
        style={{
          position: "absolute",
          left: "10px",
          bottom: "10px",
          display: "flex",
          gap: "8px",
          alignItems: "center",
          padding: "6px 10px",
          borderRadius: "999px",
          background: "rgba(0,0,0,0.55)",
          color: "#fff",
          fontSize: "13px",
          maxWidth: "calc(100% - 20px)",
        }}
      >
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "140px",
          }}
        >
          {isLocal ? "Bạn" : username || "Unknown"}
        </span>

        <span title={audioEnabled ? "Mic bật" : "Mic tắt"}>
          {audioEnabled ? "🎙️" : "🔇"}
        </span>

        <span title={videoEnabled ? "Camera bật" : "Camera tắt"}>
          {videoEnabled ? "📹" : "🚫"}
        </span>
      </div>

      {isLocal && (
        <div
          style={{
            position: "absolute",
            right: "10px",
            top: "10px",
            padding: "4px 8px",
            borderRadius: "999px",
            background: "rgba(255,255,255,0.85)",
            color: "#111827",
            fontSize: "12px",
            fontWeight: 600,
          }}
        >
          Local
        </div>
      )}
    </div>
  );
}
