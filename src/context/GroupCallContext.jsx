import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { connectSocket, disconnectSocket, getSocketDebugSnapshot, buildSocketAuth, describeAuth } from "../services/socket";
import { getStoredSession } from "../services/api";
import useGroupWebRTC from "../hooks/useGroupWebRTC";

const GroupCallContext = createContext(null);

const DEBUG_PREFIX = "[GroupCallContext]";

function log(...args) {
  console.log(DEBUG_PREFIX, ...args);
}

function warn(...args) {
  console.warn(DEBUG_PREFIX, ...args);
}

function errorLog(...args) {
  console.error(DEBUG_PREFIX, ...args);
}

function safeJson(value) {
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return `[Cannot stringify: ${error?.message || "unknown"}]`;
  }
}

function debugGroup(label, data = {}) {
  console.groupCollapsed(`${DEBUG_PREFIX} ${label}`);
  Object.entries(data).forEach(([key, value]) => {
    console.debug(key, value);
  });
  if (Object.prototype.hasOwnProperty.call(data, "json")) {
    console.debug("json:", safeJson(data.json));
  }
  console.groupEnd();
}

function getSocketSnapshot(socket) {
  return {
    exists: Boolean(socket),
    connected: Boolean(socket?.connected),
    active: Boolean(socket?.active),
    id: socket?.id || null,
    auth: socket?.auth || null,
  };
}

function safeEmit(socket, eventName, payload = {}, ack) {
  const snapshot = getSocketSnapshot(socket);

  console.groupCollapsed(`${DEBUG_PREFIX} EMIT ${eventName}`);
  console.debug("socketSnapshot:", snapshot);
  console.debug("payload:", payload);
  console.debug("payload JSON:", safeJson(payload));
  console.groupEnd();

  if (!socket) {
    warn("Cannot emit because socket is null", { eventName, payload });
    return false;
  }

  if (!socket.connected) {
    warn("Socket is not connected when emitting", {
      eventName,
      payload,
      socketSnapshot: snapshot,
    });
  }

  socket.emit(eventName, payload, ack);
  return true;
}

function waitForSocketConnected(socket, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error("Socket is null"));
      return;
    }

    if (socket.connected) {
      console.debug(`${DEBUG_PREFIX} Socket already connected`, {
        socketId: socket.id,
        active: socket.active,
      });
      resolve(socket);
      return;
    }

    console.warn(`${DEBUG_PREFIX} Socket not connected. Reconnecting before emit...`, {
      socketId: socket.id || null,
      connected: socket.connected,
      active: socket.active,
      auth: socket.auth || null,
    });

    let finished = false;

    const cleanup = () => {
      clearTimeout(timer);
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      socket.off("disconnect", handleDisconnect);
    };

    const finishResolve = () => {
      if (finished) return;
      finished = true;
      cleanup();

      console.debug(`${DEBUG_PREFIX} Socket connected before emit`, {
        socketId: socket.id,
        connected: socket.connected,
        active: socket.active,
      });

      resolve(socket);
    };

    const finishReject = (error) => {
      if (finished) return;
      finished = true;
      cleanup();

      console.error(`${DEBUG_PREFIX} Socket reconnect failed before emit`, {
        message: error?.message || String(error),
        socketId: socket.id || null,
        connected: socket.connected,
        active: socket.active,
      });

      reject(error);
    };

    const handleConnect = () => finishResolve();

    const handleConnectError = (error) => {
      finishReject(error || new Error("Socket connect_error"));
    };

    const handleDisconnect = (reason) => {
      console.warn(`${DEBUG_PREFIX} Socket disconnected while waiting connect`, {
        reason,
        socketId: socket.id || null,
      });
    };

    const timer = setTimeout(() => {
      finishReject(
        new Error(
          `Socket connect timeout after ${timeoutMs}ms. socketId=${socket.id || "null"} active=${Boolean(socket.active)}`
        )
      );
    }, timeoutMs);

    socket.once("connect", handleConnect);
    socket.once("connect_error", handleConnectError);
    socket.on("disconnect", handleDisconnect);

    socket.auth = buildSocketAuth();

    console.debug(`${DEBUG_PREFIX} Calling socket.connect() on waited socket`, {
      socketId: socket.id || null,
      connected: socket.connected,
      active: socket.active,
      auth: getSocketSnapshot(socket).auth,
    });

    socket.connect();
  });
}

function getCurrentUsername() {
  const session = getStoredSession?.();

  return (
    session?.username ||
    session?.user?.username ||
    session?.userInfo?.username ||
    session?.account?.username ||
    localStorage.getItem("username") ||
    localStorage.getItem("currentUsername") ||
    localStorage.getItem("userName") ||
    ""
  );
}

function normalizeUsername(value) {
  if (!value) return "";

  if (typeof value === "string") return value;

  return (
    value.username ||
    value.userName ||
    value.name ||
    value.id ||
    value.userId ||
    ""
  );
}

function normalizeParticipants(participants = []) {
  if (!Array.isArray(participants)) return [];

  return participants
    .map((item) => {
      if (typeof item === "string") {
        return {
          username: item,
          raw: item,
        };
      }

      const username = normalizeUsername(item);

      return {
        ...item,
        username,
        raw: item,
      };
    })
    .filter((item) => Boolean(item.username));
}

function getPayloadCallId(payload = {}) {
  return (
    payload.callId ||
    payload.groupCallId ||
    payload.activeCallId ||
    payload.call?.callId ||
    payload.call?.id ||
    payload.activeGroupCall?.callId ||
    payload.activeGroupCall?.id ||
    null
  );
}

function getPayloadGroupId(payload = {}) {
  return (
    payload.groupId ||
    payload.conversationId ||
    payload.chatId ||
    payload.group?.groupId ||
    payload.group?.id ||
    payload.call?.groupId ||
    payload.activeGroupCall?.groupId ||
    null
  );
}

function getPayloadFromUsername(payload = {}) {
  return (
    payload.fromUsername ||
    payload.senderUsername ||
    payload.callerUsername ||
    payload.username ||
    payload.from ||
    normalizeUsername(payload.sender) ||
    normalizeUsername(payload.caller) ||
    ""
  );
}

function getPayloadTargetUsername(payload = {}) {
  return (
    payload.targetUsername ||
    payload.toUsername ||
    payload.receiverUsername ||
    payload.target ||
    payload.to ||
    normalizeUsername(payload.receiver) ||
    ""
  );
}

function shouldInitiateRenegotiation(currentUsername, peerUsername, isRejoin = false) {
  if (!currentUsername || !peerUsername) return false;
  if (!isRejoin) return true;

  return currentUsername.localeCompare(peerUsername) < 0;
}

function isSocketConnectFailure(err) {
  const message = err?.message || String(err || "");

  return (
    message.includes("Socket connect timeout") ||
    message.includes("xhr poll error") ||
    message.includes("websocket error") ||
    message.includes("TransportError") ||
    message.includes("Socket reconnect failed")
  );
}

function buildCallObject(payload = {}) {
  const call = payload.call || payload.activeGroupCall || payload;

  return {
    ...call,
    callId: getPayloadCallId(payload) || call.callId || call.id || null,
    groupId: getPayloadGroupId(payload) || call.groupId || null,
    createdBy:
      call.createdBy ||
      call.creatorUsername ||
      call.callerUsername ||
      payload.createdBy ||
      payload.creatorUsername ||
      payload.callerUsername ||
      "",
    participants: normalizeParticipants(
      call.participants ||
        payload.participants ||
        call.members ||
        payload.members ||
        []
    ),
  };
}

export function GroupCallProvider({ children, user }) {
  const socketRef = useRef(null);
  const activeGroupCallRef = useRef(null);
  const currentUsernameRef = useRef(getCurrentUsername());
  const pendingSignalsRef = useRef([]);
  const participantsRef = useRef([]);
  const isInGroupCallRef = useRef(false);

  const [isInGroupCall, setIsInGroupCall] = useState(false);
  const [activeGroupCall, setActiveGroupCall] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [incomingGroupCall, setIncomingGroupCall] = useState(null);
  const [mediaStates, setMediaStates] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  useEffect(() => {
    isInGroupCallRef.current = isInGroupCall;
  }, [isInGroupCall]);

  const setActiveCallState = useCallback((call) => {
    activeGroupCallRef.current = call;
    setActiveGroupCall(call);

    if (call?.participants) {
      const normalizedParticipants = normalizeParticipants(call.participants);
      participantsRef.current = normalizedParticipants;
      setParticipants(normalizedParticipants);
    }
  }, []);

  const updateParticipant = useCallback((username, extra = {}) => {
    if (!username) return;

    setParticipants((prev) => {
      const exists = prev.some((item) => item.username === username);

      if (exists) {
        return prev.map((item) =>
          item.username === username ? { ...item, ...extra } : item
        );
      }

      return [
        ...prev,
        {
          username,
          ...extra,
        },
      ];
    });
  }, []);

  const removeParticipant = useCallback((username) => {
    if (!username) return;

    setParticipants((prev) => prev.filter((item) => item.username !== username));

    setMediaStates((prev) => {
      const next = { ...prev };
      delete next[username];
      return next;
    });
  }, []);

  const queueGroupSignal = useCallback((eventName, payload = {}, reason = "socket-disconnected") => {
    const queuedSignal = {
      eventName,
      payload,
      reason,
      queuedAt: Date.now(),
    };

    pendingSignalsRef.current.push(queuedSignal);

    log("[GroupCall] Queue signal because socket disconnected", {
      eventName,
      reason,
      callId: payload.callId || null,
      groupId: payload.groupId || null,
      targetUsername: payload.targetUsername || null,
      pendingCount: pendingSignalsRef.current.length,
    });
  }, []);

  const emitGroupSignal = useCallback(
    (eventName, payload = {}, reason = "emit-group-signal") => {
      const socket = socketRef.current || connectSocket();
      socketRef.current = socket;

      if (!socket.connected) {
        queueGroupSignal(eventName, payload, reason);
        socket.auth = buildSocketAuth();
        if (!socket.active) {
          socket.connect();
        }
        return false;
      }

      safeEmit(socket, eventName, payload, (response = {}) => {
        if (response.ok === false) {
          warn("Group signal ack failed", {
            eventName,
            payload,
            response,
          });
        }
      });

      return true;
    },
    [queueGroupSignal]
  );

  const flushPendingSignals = useCallback((reason = "flush-pending-signals") => {
    const socket = socketRef.current || connectSocket();
    socketRef.current = socket;

    if (!socket.connected) {
      log("[GroupCall] Cannot flush pending signals because socket disconnected", {
        reason,
        pendingCount: pendingSignalsRef.current.length,
        socketSnapshot: getSocketSnapshot(socket),
      });
      return false;
    }

    if (pendingSignalsRef.current.length === 0) {
      return true;
    }

    const pendingSignals = pendingSignalsRef.current.splice(0);

    pendingSignals.forEach((signal) => {
      safeEmit(socket, signal.eventName, signal.payload, (response = {}) => {
        log("[GroupCall] Flushed pending signal", {
          reason,
          eventName: signal.eventName,
          targetUsername: signal.payload?.targetUsername || null,
          callId: signal.payload?.callId || null,
          queuedForMs: Date.now() - signal.queuedAt,
          response,
        });

        if (response.ok === false) {
          warn("Flushed pending signal ack failed", {
            signal,
            response,
          });
        }
      });
    });

    return true;
  }, []);

  const sendOffer = useCallback(({ targetUsername, offer }) => {
    const call = activeGroupCallRef.current;

    log("SEND OFFER", {
      targetUsername,
      callId: call?.callId || call?.id || null,
      groupId: call?.groupId || null,
      socketSnapshot: getSocketSnapshot(socketRef.current),
    });

    emitGroupSignal("group-call:offer", {
      callId: call?.callId || call?.id || null,
      groupId: call?.groupId || null,
      targetUsername,
      offer,
    }, "send-offer");
  }, [emitGroupSignal]);

  const sendAnswer = useCallback(({ targetUsername, answer }) => {
    const call = activeGroupCallRef.current;

    log("SEND ANSWER", {
      targetUsername,
      callId: call?.callId || call?.id || null,
      groupId: call?.groupId || null,
      socketSnapshot: getSocketSnapshot(socketRef.current),
    });

    emitGroupSignal("group-call:answer", {
      callId: call?.callId || call?.id || null,
      groupId: call?.groupId || null,
      targetUsername,
      answer,
    }, "send-answer");
  }, [emitGroupSignal]);

  const sendIceCandidate = useCallback(({ targetUsername, candidate }) => {
    const call = activeGroupCallRef.current;

    log("SEND ICE", {
      targetUsername,
      callId: call?.callId || call?.id || null,
      groupId: call?.groupId || null,
      candidateType: candidate?.type || null,
      candidateProtocol: candidate?.protocol || null,
      socketSnapshot: getSocketSnapshot(socketRef.current),
    });

    emitGroupSignal("group-call:ice-candidate", {
      callId: call?.callId || call?.id || null,
      groupId: call?.groupId || null,
      targetUsername,
      candidate,
    }, "send-ice-candidate");
  }, [emitGroupSignal]);

  const {
    localStream,
    remoteStreams,
    audioEnabled,
    videoEnabled,
    isInitialized,
    isScreenSharing,
    error: webRTCError,

    initLocalStream,
    createOfferForUser,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    removePeer,
    cleanupAllPeers,
    toggleAudio: toggleWebRTCAudio,
    toggleVideo: toggleWebRTCVideo,
    startScreenShare,
    stopScreenShare,
    getDebugState,
  } = useGroupWebRTC({
    onSendOffer: sendOffer,
    onSendAnswer: sendAnswer,
    onSendIceCandidate: sendIceCandidate,
    onRemoteStream: ({ username, stream }) => {
      log("Remote stream updated", {
        username,
        streamId: stream?.id,
        tracks: stream?.getTracks?.().map((track) => ({
          id: track.id,
          kind: track.kind,
          enabled: track.enabled,
          readyState: track.readyState,
        })),
      });
    },
    onPeerRemoved: ({ username }) => {
      log("Peer removed from WebRTC hook", { username });
    },
    onError: ({ message, error: hookError, meta }) => {
      errorLog("WebRTC hook error", {
        message,
        hookError,
        meta,
      });

      setError(message);
    },
  });

  const resetGroupCallState = useCallback(
    ({ stopMedia = false } = {}) => {
      if (stopMedia) {
        cleanupAllPeers();
      }

      setIsInGroupCall(false);
      setActiveCallState(null);
      setParticipants([]);
      setIncomingGroupCall(null);
      setMediaStates({});
      pendingSignalsRef.current = [];
    },
    [cleanupAllPeers, setActiveCallState]
  );

  const renegotiateActiveParticipants = useCallback(
    async (reason = "renegotiate-active-participants") => {
      const currentUsername = currentUsernameRef.current;
      const participantUsernames = participantsRef.current
        .map((participant) => participant.username)
        .filter(
          (username) =>
            username &&
            username !== currentUsername &&
            shouldInitiateRenegotiation(currentUsername, username, true)
        );

      if (participantUsernames.length === 0) {
        log("No peers selected for reconnect renegotiation", {
          reason,
          currentUsername,
          participants: participantsRef.current.map((participant) => participant.username),
        });
        return;
      }

      log("Renegotiate peers after group call reconnect", {
        reason,
        currentUsername,
        participantUsernames,
      });

      for (const username of participantUsernames) {
        try {
          await createOfferForUser(username);
        } catch (err) {
          errorLog("Failed to renegotiate peer after reconnect", {
            reason,
            username,
            err,
          });
        }
      }
    },
    [createOfferForUser]
  );

  const rejoinActiveGroupCall = useCallback(
    (reason = "socket-connect") => {
      const socket = socketRef.current || connectSocket();
      socketRef.current = socket;

      const call = activeGroupCallRef.current;
      const callId = call?.callId || call?.id || null;
      const groupId = call?.groupId || null;

      if (!socket.connected) {
        log("Cannot rejoin group call because socket is disconnected", {
          reason,
          callId,
          groupId,
          socketSnapshot: getSocketSnapshot(socket),
        });
        return false;
      }

      if (!callId) {
        flushPendingSignals(`${reason}:no-active-call`);
        return false;
      }

      log("[GroupCallContext] Rejoin group call after socket reconnect", {
        reason,
        callId,
        groupId,
        currentUsername: currentUsernameRef.current,
        pendingSignals: pendingSignalsRef.current.length,
      });

      safeEmit(
        socket,
        "group-call:rejoin",
        {
          callId,
          groupId,
        },
        async (response = {}) => {
          log("Ack group-call:rejoin", {
            reason,
            callId,
            groupId,
            response,
          });

          if (response.ok === false) {
            setError(response.message || "Khong the ket noi lai group call");
            return;
          }

          const nextCall = buildCallObject(response);
          if (nextCall.callId) {
            setActiveCallState(nextCall);
            setIsInGroupCall(true);
            setIncomingGroupCall(null);
          }

          flushPendingSignals("after-group-call-rejoin");
          await renegotiateActiveParticipants("after-group-call-rejoin");
          log("Rejoin completed; pending signals flushed and peers renegotiated if selected", {
            callId,
            groupId,
          });
        }
      );

      return true;
    },
    [flushPendingSignals, renegotiateActiveParticipants, setActiveCallState]
  );

  const startGroupCall = useCallback(
    async (groupId, rawParticipants = []) => {
      try {
        const socket = socketRef.current || connectSocket();
        socketRef.current = socket;

        await waitForSocketConnected(socket, 5000);

        currentUsernameRef.current = user?.username || getCurrentUsername();

        if (!groupId) {
          throw new Error("Thiếu groupId khi bắt đầu group call");
        }

        const normalizedParticipants = normalizeParticipants(rawParticipants);
        const invitedParticipants = normalizedParticipants.filter(
          (item) => item.username !== currentUsernameRef.current
        );

        log("Starting group call", {
          groupId,
          currentUsername: currentUsernameRef.current,
          participants: normalizedParticipants.map((item) => item.username),
          invitedParticipants: invitedParticipants.map((item) => item.username),
        });

        await initLocalStream();

        const draftCall = {
          callId: null,
          groupId,
          createdBy: currentUsernameRef.current,
          participants: normalizedParticipants,
        };

        setActiveCallState(draftCall);
        setParticipants(normalizedParticipants);
        setIsInGroupCall(true);
        setIncomingGroupCall(null);
        setError(null);

        const participantUsernames = normalizedParticipants.map((item) => item.username);
        const invitedUsernames = invitedParticipants.map((item) => item.username);

        const startPayload = {
          groupId,

          participants: invitedUsernames,
          invitedParticipants: invitedUsernames,

          members: invitedUsernames,
          targetUsernames: invitedUsernames,
          participantUsernames: invitedUsernames,
          calleeUsernames: invitedUsernames,

          allParticipants: participantUsernames,
          callerUsername: currentUsernameRef.current,
          fromUsername: currentUsernameRef.current,
        };

        console.groupCollapsed(`${DEBUG_PREFIX} START_GROUP_CALL payload`);
        console.debug("groupId:", groupId);
        console.debug("participantUsernames:", participantUsernames);
        console.debug("invitedUsernames:", invitedUsernames);
        console.debug("payload:", startPayload);
        console.debug("payload JSON:", safeJson(startPayload));
        console.groupEnd();

        safeEmit(socket, "group-call:start", startPayload, (response = {}) => {
          log("Ack group-call:start", {
            response,
            groupId,
            invitedUsernames,
          });

          if (response.ok === false) {
            resetGroupCallState({ stopMedia: true });
            setError(response.message || "Khong the bat dau group call");
          }
        });

        return true;
      } catch (err) {
        errorLog("startGroupCall failed", err);
        resetGroupCallState({ stopMedia: true });
        setError(
          isSocketConnectFailure(err)
            ? "Không thể kết nối server cuộc gọi. Vui lòng kiểm tra backend."
            : err?.message || "Không thể bắt đầu group call"
        );
        return false;
      }
    },
    [initLocalStream, resetGroupCallState, setActiveCallState, user?.username]
  );

  const joinGroupCall = useCallback(
    async (callIdFromArg = null) => {
      try {
        const socket = socketRef.current || connectSocket();
        socketRef.current = socket;

        await waitForSocketConnected(socket, 5000);

        currentUsernameRef.current = user?.username || getCurrentUsername();

        const call = incomingGroupCall || activeGroupCallRef.current;
        const callId = callIdFromArg || call?.callId || call?.id || null;
        const groupId = call?.groupId || null;

        if (!callId) {
          throw new Error("Thiếu callId khi join group call");
        }

        log("Joining group call", {
          callId,
          groupId,
          currentUsername: currentUsernameRef.current,
        });

        await initLocalStream();

        setActiveCallState({
          ...call,
          callId,
          groupId,
        });

        setIsInGroupCall(true);
        setIncomingGroupCall(null);
        setError(null);

        safeEmit(socket, "group-call:join", {
          callId,
          groupId,
        }, (response = {}) => {
          log("Ack group-call:join", {
            response,
            callId,
            groupId,
          });

          if (response.ok === false) {
            resetGroupCallState({ stopMedia: true });
            setError(response.message || "Khong the tham gia group call");
          }
        });

        return true;
      } catch (err) {
        errorLog("joinGroupCall failed", err);
        resetGroupCallState({ stopMedia: true });
        setError(
          isSocketConnectFailure(err)
            ? "Không thể kết nối server cuộc gọi. Vui lòng kiểm tra backend."
            : err?.message || "Không thể tham gia group call"
        );
        return false;
      }
    },
    [incomingGroupCall, initLocalStream, resetGroupCallState, setActiveCallState, user?.username]
  );

  const declineGroupCall = useCallback(() => {
    const socket = socketRef.current || connectSocket();
    const call = incomingGroupCall;

    log("Declining group call", {
      callId: call?.callId,
      groupId: call?.groupId,
    });

    if (call?.callId) {
      safeEmit(socket, "group-call:decline", {
        callId: call.callId,
        groupId: call.groupId || null,
      });
    }

    setIncomingGroupCall(null);
  }, [incomingGroupCall]);

  const leaveGroupCall = useCallback(() => {
    const socket = socketRef.current || connectSocket();
    const call = activeGroupCallRef.current;

    log("Leaving group call", {
      callId: call?.callId,
      groupId: call?.groupId,
    });

    if (call?.callId) {
      safeEmit(socket, "group-call:leave", {
        callId: call.callId,
        groupId: call.groupId || null,
      });
    }

    cleanupAllPeers();
    setIsInGroupCall(false);
    setActiveCallState(null);
    setParticipants([]);
    setIncomingGroupCall(null);
    setMediaStates({});
    setError(null);
  }, [cleanupAllPeers, setActiveCallState]);

  const endGroupCall = useCallback(() => {
    const socket = socketRef.current || connectSocket();
    const call = activeGroupCallRef.current;

    log("Ending group call", {
      callId: call?.callId,
      groupId: call?.groupId,
    });

    if (call?.callId) {
      safeEmit(socket, "group-call:end", {
        callId: call.callId,
        groupId: call.groupId || null,
      });
    }

    cleanupAllPeers();
    setIsInGroupCall(false);
    setActiveCallState(null);
    setParticipants([]);
    setIncomingGroupCall(null);
    setMediaStates({});
    setError(null);
  }, [cleanupAllPeers, setActiveCallState]);

  const toggleAudio = useCallback(() => {
    const nextEnabled = toggleWebRTCAudio();
    const socket = socketRef.current || connectSocket();
    const call = activeGroupCallRef.current;

    safeEmit(socket, "group-call:media-state", {
      callId: call?.callId || call?.id || null,
      groupId: call?.groupId || null,
      audioEnabled: nextEnabled,
      videoEnabled,
    });

    return nextEnabled;
  }, [toggleWebRTCAudio, videoEnabled]);

  const toggleVideo = useCallback(() => {
    const nextEnabled = toggleWebRTCVideo();
    const socket = socketRef.current || connectSocket();
    const call = activeGroupCallRef.current;

    safeEmit(socket, "group-call:media-state", {
      callId: call?.callId || call?.id || null,
      groupId: call?.groupId || null,
      audioEnabled,
      videoEnabled: nextEnabled,
    });

    return nextEnabled;
  }, [audioEnabled, toggleWebRTCVideo]);

  // ─── handlersRef: bridge ổn định để socket effect không phụ thuộc vào callback references ───
  const handlersRef = useRef({});

  // Effect 1: Cập nhật handlersRef khi callbacks thay đổi (KHÔNG bind socket, không gây re-bind)
  useEffect(() => {
    handlersRef.current = {
      cleanupAllPeers,
      createOfferForUser,
      handleAnswer,
      handleIceCandidate,
      handleOffer,
      flushPendingSignals,
      renegotiateActiveParticipants,
      rejoinActiveGroupCall,
      removeParticipant,
      removePeer,
      setActiveCallState,
      updateParticipant,
    };
  }, [
    cleanupAllPeers,
    createOfferForUser,
    handleAnswer,
    handleIceCandidate,
    handleOffer,
    flushPendingSignals,
    renegotiateActiveParticipants,
    rejoinActiveGroupCall,
    removeParticipant,
    removePeer,
    setActiveCallState,
    updateParticipant,
  ]);

  // Effect 2: Bind/unbind socket listeners — CHỈ depend on [user] để tránh re-bind
  useEffect(() => {
    // Guard: chỉ bind khi user/token/sessionId sẵn sàng
    const auth = buildSocketAuth();
    const authDesc = describeAuth(auth);
    if (!user || !authDesc.hasToken || !authDesc.hasSessionId) {
      log("Skip socket bind because user/session not ready", {
        hasUser: Boolean(user),
        ...authDesc,
      });
      return;
    }

    const socket = connectSocket();
    socketRef.current = socket;
    currentUsernameRef.current = user?.username || getCurrentUsername();

    const debugAnyGroupCallEvent = (eventName, ...args) => {
      if (String(eventName).startsWith("group-call:")) {
        console.groupCollapsed(`${DEBUG_PREFIX} ON_ANY ${eventName}`);
        console.debug("args:", args);
        console.debug("args JSON:", safeJson(args));
        console.debug("socketSnapshot:", getSocketSnapshot(socket));
        console.groupEnd();
      }
    };

    socket.onAny(debugAnyGroupCallEvent);

    log("Binding group call socket listeners", {
      socketSnapshot: getSocketDebugSnapshot(),
      currentUsername: currentUsernameRef.current,
      auth: authDesc,
    });

    const onStarted = (payload = {}) => {
      const call = buildCallObject(payload);

      log("Socket group-call:started", {
        payload,
        call,
      });

      setActiveCallState(call);
      setIsInGroupCall(true);
      setIncomingGroupCall(null);
      setError(null);
    };

    const onIncoming = (payload = {}) => {
      const call = buildCallObject(payload);
      const fromUsername = getPayloadFromUsername(payload);

      log("Socket group-call:incoming", {
        payload,
        call,
        fromUsername,
      });

      setIncomingGroupCall({
        ...call,
        fromUsername,
      });

      setError(null);
    };

    const onJoined = (payload = {}) => {
      const call = buildCallObject(payload);

      log("Socket group-call:joined", {
        payload,
        call,
      });

      setActiveCallState(call);
      setIsInGroupCall(true);
      setIncomingGroupCall(null);
      setError(null);

      if (call.participants?.length) {
        setParticipants(call.participants);
      }
    };

    const onUserJoined = async (payload = {}) => {
      const username =
        payload.username ||
        payload.joinedUsername ||
        payload.user?.username ||
        payload.participant?.username ||
        getPayloadFromUsername(payload);

      log("Socket group-call:user-joined", {
        payload,
        username,
        currentUsername: currentUsernameRef.current,
      });

      if (!username || username === currentUsernameRef.current) {
        return;
      }

      handlersRef.current.updateParticipant(username, { joined: true });

      try {
        if (
          !shouldInitiateRenegotiation(
            currentUsernameRef.current,
            username,
            Boolean(payload.rejoined)
          )
        ) {
          log("Skip offer for rejoined peer because peer will initiate", {
            username,
            currentUsername: currentUsernameRef.current,
            rejoined: Boolean(payload.rejoined),
          });
          return;
        }

        await handlersRef.current.createOfferForUser(username);
      } catch (err) {
        errorLog("Failed to create offer for joined user", {
          username,
          err,
        });
      }
    };

    const onUserLeft = (payload = {}) => {
      const username =
        payload.username ||
        payload.leftUsername ||
        payload.user?.username ||
        payload.participant?.username ||
        getPayloadFromUsername(payload);

      log("Socket group-call:user-left", {
        payload,
        username,
      });

      if (!username) return;

      handlersRef.current.removePeer(username);
      handlersRef.current.removeParticipant(username);
    };

    const onEnded = (payload = {}) => {
      log("Socket group-call:ended", {
        payload,
      });

      handlersRef.current.cleanupAllPeers();
      setIsInGroupCall(false);
      handlersRef.current.setActiveCallState(null);
      setParticipants([]);
      setIncomingGroupCall(null);
      setMediaStates({});
      setError(null);
    };

    const onError = (payload = {}) => {
      console.groupCollapsed(`${DEBUG_PREFIX} SOCKET ERROR group-call:error`);
      console.error("payload:", payload);
      console.error("payload JSON:", safeJson(payload));
      console.error("activeGroupCall:", activeGroupCallRef.current);
      console.error("currentUsername:", currentUsernameRef.current);
      console.error("socketSnapshot:", getSocketSnapshot(socketRef.current));
      console.groupEnd();

      setError(
        payload.message ||
          payload.error ||
          payload.reason ||
          payload.detail ||
          "Có lỗi xảy ra trong group video call"
      );
    };

    const onOffer = async (payload = {}) => {
      const fromUsername = getPayloadFromUsername(payload);
      const targetUsername = getPayloadTargetUsername(payload);
      const offer = payload.offer || payload.sdp || payload.description;

      log("Socket group-call:offer", {
        payload,
        fromUsername,
        targetUsername,
        currentUsername: currentUsernameRef.current,
      });
      log("RECEIVE OFFER", {
        fromUsername,
        targetUsername,
        callId: payload.callId || null,
        offerType: offer?.type || null,
      });

      if (
        targetUsername &&
        currentUsernameRef.current &&
        targetUsername !== currentUsernameRef.current
      ) {
        log("Skip offer because it targets another user", {
          targetUsername,
          currentUsername: currentUsernameRef.current,
        });
        return;
      }

      if (!fromUsername || !offer) {
        warn("Invalid offer payload", payload);
        return;
      }

      try {
        await handlersRef.current.handleOffer({
          fromUsername,
          offer,
        });

        handlersRef.current.updateParticipant(fromUsername, { joined: true });
      } catch (err) {
        errorLog("Failed to handle group offer", {
          fromUsername,
          err,
        });
      }
    };

    const onAnswer = async (payload = {}) => {
      const fromUsername = getPayloadFromUsername(payload);
      const targetUsername = getPayloadTargetUsername(payload);
      const answer = payload.answer || payload.sdp || payload.description;

      log("Socket group-call:answer", {
        payload,
        fromUsername,
        targetUsername,
        currentUsername: currentUsernameRef.current,
      });
      log("RECEIVE ANSWER", {
        fromUsername,
        targetUsername,
        callId: payload.callId || null,
        answerType: answer?.type || null,
      });

      if (
        targetUsername &&
        currentUsernameRef.current &&
        targetUsername !== currentUsernameRef.current
      ) {
        log("Skip answer because it targets another user", {
          targetUsername,
          currentUsername: currentUsernameRef.current,
        });
        return;
      }

      if (!fromUsername || !answer) {
        warn("Invalid answer payload", payload);
        return;
      }

      try {
        await handlersRef.current.handleAnswer({
          fromUsername,
          answer,
        });

        handlersRef.current.updateParticipant(fromUsername, { joined: true });
      } catch (err) {
        errorLog("Failed to handle group answer", {
          fromUsername,
          err,
        });
      }
    };

    const onIceCandidate = async (payload = {}) => {
      const fromUsername = getPayloadFromUsername(payload);
      const targetUsername = getPayloadTargetUsername(payload);
      const candidate = payload.candidate || payload.iceCandidate;

      log("Socket group-call:ice-candidate", {
        payload,
        fromUsername,
        targetUsername,
        currentUsername: currentUsernameRef.current,
      });
      log("RECEIVE ICE", {
        fromUsername,
        targetUsername,
        callId: payload.callId || null,
        hasCandidate: Boolean(candidate),
      });

      if (
        targetUsername &&
        currentUsernameRef.current &&
        targetUsername !== currentUsernameRef.current
      ) {
        log("Skip ICE because it targets another user", {
          targetUsername,
          currentUsername: currentUsernameRef.current,
        });
        return;
      }

      if (!fromUsername || !candidate) {
        warn("Invalid ICE payload", payload);
        return;
      }

      await handlersRef.current.handleIceCandidate({
        fromUsername,
        candidate,
      });
    };

    const onMediaState = (payload = {}) => {
      const username = getPayloadFromUsername(payload) || payload.username;

      log("Socket group-call:media-state", {
        payload,
        username,
      });

      if (!username) return;

      setMediaStates((prev) => ({
        ...prev,
        [username]: {
          audioEnabled:
            typeof payload.audioEnabled === "boolean"
              ? payload.audioEnabled
              : prev[username]?.audioEnabled,
          videoEnabled:
            typeof payload.videoEnabled === "boolean"
              ? payload.videoEnabled
              : prev[username]?.videoEnabled,
        },
      }));
    };

    const onSocketConnect = () => {
      log("Socket connected for group call signaling", {
        socketId: socket.id,
        active: socket.active,
        connected: socket.connected,
        activeCall: activeGroupCallRef.current,
        isInGroupCall: isInGroupCallRef.current,
        pendingSignals: pendingSignalsRef.current.length,
      });

      if (activeGroupCallRef.current?.callId || isInGroupCallRef.current) {
        handlersRef.current.rejoinActiveGroupCall?.("socket-connect");
        return;
      }

      handlersRef.current.flushPendingSignals?.("socket-connect");
    };

    const onSocketDisconnect = (reason) => {
      log("Socket disconnected during group call signaling", {
        reason,
        socketId: socket.id || null,
        activeCall: activeGroupCallRef.current,
        isInGroupCall: isInGroupCallRef.current,
        pendingSignals: pendingSignalsRef.current.length,
      });
    };

    const onRejoined = (payload = {}) => {
      const call = buildCallObject(payload);

      log("Socket group-call:rejoined", {
        payload,
        call,
      });

      if (call.callId) {
        setActiveCallState(call);
        setIsInGroupCall(true);
        setIncomingGroupCall(null);
        setError(null);
      }

      handlersRef.current.flushPendingSignals?.("after-group-call-rejoined-event");
    };

    log("[GroupCall][Socket] bind listeners", {
      socketId: socket.id,
      connected: socket.connected,
      currentUsername: currentUsernameRef.current,
    });

    socket.on("connect", onSocketConnect);
    socket.on("disconnect", onSocketDisconnect);
    socket.on("group-call:started", onStarted);
    socket.on("group-call:incoming", onIncoming);
    socket.on("group-call:invite", onIncoming);
    socket.on("group-call:joined", onJoined);
    socket.on("group-call:rejoined", onRejoined);
    socket.on("group-call:user-joined", onUserJoined);
    socket.on("group-call:user-left", onUserLeft);
    socket.on("group-call:ended", onEnded);
    socket.on("group-call:error", onError);
    socket.on("group-call:offer", onOffer);
    socket.on("group-call:answer", onAnswer);
    socket.on("group-call:ice-candidate", onIceCandidate);
    socket.on("group-call:media-state", onMediaState);

    return () => {
      log("[GroupCall][Socket] unbind listeners", {
        socketId: socket.id,
        currentUsername: currentUsernameRef.current,
      });

      socket.offAny(debugAnyGroupCallEvent);
      socket.off("connect", onSocketConnect);
      socket.off("disconnect", onSocketDisconnect);
      socket.off("group-call:started", onStarted);
      socket.off("group-call:incoming", onIncoming);
      socket.off("group-call:invite", onIncoming);
      socket.off("group-call:joined", onJoined);
      socket.off("group-call:rejoined", onRejoined);
      socket.off("group-call:user-joined", onUserJoined);
      socket.off("group-call:user-left", onUserLeft);
      socket.off("group-call:ended", onEnded);
      socket.off("group-call:error", onError);
      socket.off("group-call:offer", onOffer);
      socket.off("group-call:answer", onAnswer);
      socket.off("group-call:ice-candidate", onIceCandidate);
      socket.off("group-call:media-state", onMediaState);
    };
  }, [user?.username]); // Rebind only when login user changes; handlers are read via handlersRef.

  const canEnd = useMemo(() => {
    const currentUsername = currentUsernameRef.current;
    const creator =
      activeGroupCall?.createdBy ||
      activeGroupCall?.creatorUsername ||
      activeGroupCall?.callerUsername ||
      "";

    return Boolean(currentUsername && creator && currentUsername === creator);
  }, [activeGroupCall]);

  const value = useMemo(
    () => ({
      isInGroupCall,
      activeGroupCall,
      participants,
      incomingGroupCall,
      mediaStates,

      localStream,
      remoteStreams,
      audioEnabled,
      videoEnabled,
      isInitialized,
      isScreenSharing,

      error: error || webRTCError,

      canEnd,
      currentUsername: currentUsernameRef.current,

      startGroupCall,
      joinGroupCall,
      declineGroupCall,
      leaveGroupCall,
      endGroupCall,
      toggleAudio,
      toggleVideo,
      startScreenShare,
      stopScreenShare,

      getDebugState,
    }),
    [
      isInGroupCall,
      activeGroupCall,
      participants,
      incomingGroupCall,
      mediaStates,
      localStream,
      remoteStreams,
      audioEnabled,
      videoEnabled,
      isInitialized,
      isScreenSharing,
      error,
      webRTCError,
      canEnd,
      startGroupCall,
      joinGroupCall,
      declineGroupCall,
      leaveGroupCall,
      endGroupCall,
      toggleAudio,
      toggleVideo,
      startScreenShare,
      stopScreenShare,
      getDebugState,
    ]
  );

  return (
    <GroupCallContext.Provider value={value}>
      {children}
    </GroupCallContext.Provider>
  );
}

export function useGroupCall() {
  const context = useContext(GroupCallContext);

  if (!context) {
    throw new Error("useGroupCall must be used inside GroupCallProvider");
  }

  return context;
}

export default GroupCallContext;
