import { useGroupCall } from "../../context/GroupCallContext";

export default function IncomingGroupCallModal() {
  const { incomingGroupCall, joinGroupCall, declineGroupCall } = useGroupCall();

  if (!incomingGroupCall) {
    console.debug("[GroupCallUI][IncomingModal] No incoming group call");
    return null;
  }

  console.groupCollapsed("[GroupCallUI][IncomingModal] SHOW incoming group call");
  console.debug("incomingGroupCall:", incomingGroupCall);
  try {
    console.debug("incomingGroupCall JSON:", JSON.stringify(incomingGroupCall, null, 2));
  } catch (error) {
    console.debug("incomingGroupCall JSON failed:", error);
  }
  console.groupEnd();

  const caller =
    incomingGroupCall.fromUsername ||
    incomingGroupCall.createdBy ||
    incomingGroupCall.creatorUsername ||
    incomingGroupCall.callerUsername ||
    "Ai đó";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10003,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          borderRadius: "18px",
          background: "#fff",
          color: "#111827",
          padding: "24px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "999px",
            background:
              "linear-gradient(135deg, rgba(37,99,235,1), rgba(124,58,237,1))",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "28px",
            margin: "0 auto 16px",
          }}
        >
          📹
        </div>

        <h2
          style={{
            margin: "0 0 8px",
            textAlign: "center",
            fontSize: "22px",
          }}
        >
          Cuộc gọi video nhóm
        </h2>

        <p
          style={{
            margin: "0 0 20px",
            textAlign: "center",
            color: "#4b5563",
            lineHeight: 1.5,
          }}
        >
          <strong>{caller}</strong> đang gọi video nhóm.
        </p>

        <div
          style={{
            display: "flex",
            gap: "12px",
          }}
        >
          <button
            type="button"
            onClick={declineGroupCall}
            style={{
              flex: 1,
              border: "none",
              borderRadius: "12px",
              padding: "12px",
              cursor: "pointer",
              background: "#e5e7eb",
              color: "#111827",
              fontWeight: 700,
            }}
          >
            Từ chối
          </button>

          <button
            type="button"
            onClick={() => joinGroupCall(incomingGroupCall.callId)}
            style={{
              flex: 1,
              border: "none",
              borderRadius: "12px",
              padding: "12px",
              cursor: "pointer",
              background: "#16a34a",
              color: "#fff",
              fontWeight: 700,
            }}
          >
            Tham gia
          </button>
        </div>
      </div>
    </div>
  );
}