import { useCallback, useEffect, useRef, useState } from "react";

const DEBUG_PREFIX = "[GroupWebRTC]";

const rtcConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

function log(...args) {
  console.log(DEBUG_PREFIX, ...args);
}

function warn(...args) {
  console.warn(DEBUG_PREFIX, ...args);
}

function errorLog(...args) {
  console.error(DEBUG_PREFIX, ...args);
}

function normalizeSessionDescription(description) {
  if (!description) return null;

  if (description instanceof RTCSessionDescription) {
    return description;
  }

  return new RTCSessionDescription(description);
}

function normalizeIceCandidate(candidate) {
  if (!candidate) return null;

  if (candidate instanceof RTCIceCandidate) {
    return candidate;
  }

  return new RTCIceCandidate(candidate);
}

export default function useGroupWebRTC(options = {}) {
  const {
    onSendOffer,
    onSendAnswer,
    onSendIceCandidate,
    onRemoteStream,
    onPeerRemoved,
    onError,
  } = options;

  const peerConnectionsRef = useRef({});
  const remoteStreamsRef = useRef({});
  const localStreamRef = useRef(null);
  const isCleaningUpRef = useRef(false);

  const callbacksRef = useRef({
    onSendOffer,
    onSendAnswer,
    onSendIceCandidate,
    onRemoteStream,
    onPeerRemoved,
    onError,
  });

  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    callbacksRef.current = {
      onSendOffer,
      onSendAnswer,
      onSendIceCandidate,
      onRemoteStream,
      onPeerRemoved,
      onError,
    };
  }, [
    onSendOffer,
    onSendAnswer,
    onSendIceCandidate,
    onRemoteStream,
    onPeerRemoved,
    onError,
  ]);

  const reportError = useCallback((message, err, meta = {}) => {
    const finalError = err || new Error(message);

    errorLog(message, finalError, meta);
    setError(message);

    if (callbacksRef.current.onError) {
      callbacksRef.current.onError({
        message,
        error: finalError,
        meta,
      });
    }
  }, []);

  const setRemoteStreamForUser = useCallback((username, stream) => {
    remoteStreamsRef.current[username] = stream;

    setRemoteStreams((prev) => ({
      ...prev,
      [username]: stream,
    }));

    if (callbacksRef.current.onRemoteStream) {
      callbacksRef.current.onRemoteStream({
        username,
        stream,
      });
    }
  }, []);

  const initLocalStream = useCallback(async () => {
    try {
      if (localStreamRef.current) {
        log("Local stream already initialized", {
          tracks: localStreamRef.current.getTracks().map((track) => ({
            kind: track.kind,
            enabled: track.enabled,
            readyState: track.readyState,
          })),
        });

        return localStreamRef.current;
      }

      log("Requesting local camera/microphone...");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsInitialized(true);
      setError(null);

      const audioTracks = stream.getAudioTracks();
      const videoTracks = stream.getVideoTracks();

      setAudioEnabled(audioTracks.length > 0 ? audioTracks[0].enabled : false);
      setVideoEnabled(videoTracks.length > 0 ? videoTracks[0].enabled : false);

      log("Local stream initialized", {
        streamId: stream.id,
        audioTracks: audioTracks.length,
        videoTracks: videoTracks.length,
        tracks: stream.getTracks().map((track) => ({
          id: track.id,
          kind: track.kind,
          label: track.label,
          enabled: track.enabled,
          readyState: track.readyState,
        })),
      });

      return stream;
    } catch (err) {
      reportError("Không thể mở camera/micro cho group call", err);
      throw err;
    }
  }, [reportError]);

  const addLocalTracksToPeer = useCallback((peerConnection, username) => {
    const currentLocalStream = localStreamRef.current;

    if (!currentLocalStream) {
      warn("Cannot add local tracks because localStream is null", {
        username,
      });
      return;
    }

    const existingSenders = peerConnection.getSenders();

    currentLocalStream.getTracks().forEach((track) => {
      const alreadyAdded = existingSenders.some(
        (sender) => sender.track && sender.track.id === track.id
      );

      if (alreadyAdded) {
        log("Skip duplicate local track", {
          username,
          trackId: track.id,
          kind: track.kind,
        });
        return;
      }

      peerConnection.addTrack(track, currentLocalStream);

      log("Added local track to peer", {
        username,
        trackId: track.id,
        kind: track.kind,
        enabled: track.enabled,
        readyState: track.readyState,
      });
    });
  }, []);

  const createPeerConnection = useCallback(
    (username) => {
      try {
        if (!username) {
          throw new Error("createPeerConnection thiếu username");
        }

        if (peerConnectionsRef.current[username]) {
          log("Reusing existing peer connection", { username });
          return peerConnectionsRef.current[username];
        }

        log("Creating peer connection", { username });

        const peerConnection = new RTCPeerConnection(rtcConfig);

        peerConnection.onicecandidate = (event) => {
          if (!event.candidate) {
            log("ICE gathering complete", { username });
            return;
          }

          log("New local ICE candidate", {
            targetUsername: username,
            candidateType: event.candidate.type,
            candidateProtocol: event.candidate.protocol,
          });

          if (callbacksRef.current.onSendIceCandidate) {
            callbacksRef.current.onSendIceCandidate({
              targetUsername: username,
              candidate: event.candidate,
            });
          }
        };

        peerConnection.ontrack = (event) => {
          log("Remote track received", {
            username,
            trackId: event.track?.id,
            kind: event.track?.kind,
            streamCount: event.streams?.length || 0,
          });

          let stream = remoteStreamsRef.current[username];

          if (!stream) {
            stream = new MediaStream();
          }

          if (event.streams && event.streams[0]) {
            stream = event.streams[0];
          } else if (event.track) {
            const alreadyExists = stream
              .getTracks()
              .some((track) => track.id === event.track.id);

            if (!alreadyExists) {
              stream.addTrack(event.track);
            }
          }

          setRemoteStreamForUser(username, stream);
        };

        peerConnection.onconnectionstatechange = () => {
          log("Connection state changed", {
            username,
            connectionState: peerConnection.connectionState,
            iceConnectionState: peerConnection.iceConnectionState,
            signalingState: peerConnection.signalingState,
          });

          if (
            peerConnection.connectionState === "failed" ||
            peerConnection.connectionState === "disconnected" ||
            peerConnection.connectionState === "closed"
          ) {
            warn("Peer connection is not healthy", {
              username,
              connectionState: peerConnection.connectionState,
            });
          }
        };

        peerConnection.oniceconnectionstatechange = () => {
          log("ICE connection state changed", {
            username,
            iceConnectionState: peerConnection.iceConnectionState,
          });
        };

        peerConnection.onsignalingstatechange = () => {
          log("Signaling state changed", {
            username,
            signalingState: peerConnection.signalingState,
          });
        };

        peerConnection.onnegotiationneeded = () => {
          log("Negotiation needed", { username });
        };

        peerConnectionsRef.current[username] = peerConnection;

        addLocalTracksToPeer(peerConnection, username);

        return peerConnection;
      } catch (err) {
        reportError("Không thể tạo peer connection cho group call", err, {
          username,
        });
        throw err;
      }
    },
    [addLocalTracksToPeer, reportError, setRemoteStreamForUser]
  );

  const createOfferForUser = useCallback(
    async (username) => {
      try {
        if (!username) {
          throw new Error("createOfferForUser thiếu username");
        }

        log("Creating offer for user", { username });
        console.groupCollapsed("[GroupWebRTC] CREATE OFFER FLOW");
        console.debug("target username:", username);
        console.debug("has localStream:", Boolean(localStreamRef.current));
        console.debug("existing peers:", Object.keys(peerConnectionsRef.current));
        console.groupEnd();

        await initLocalStream();

        const peerConnection = createPeerConnection(username);

        addLocalTracksToPeer(peerConnection, username);

        const offer = await peerConnection.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });

        await peerConnection.setLocalDescription(offer);

        log("Offer created and setLocalDescription done", {
          targetUsername: username,
          signalingState: peerConnection.signalingState,
          sdpType: offer.type,
        });

        if (callbacksRef.current.onSendOffer) {
          callbacksRef.current.onSendOffer({
            targetUsername: username,
            offer,
          });
        }

        return offer;
      } catch (err) {
        reportError("Không thể tạo offer group call", err, {
          username,
        });
        throw err;
      }
    },
    [addLocalTracksToPeer, createPeerConnection, initLocalStream, reportError]
  );

  const handleOffer = useCallback(
    async ({ fromUsername, offer }) => {
      try {
        if (!fromUsername || !offer) {
          throw new Error("handleOffer thiếu fromUsername hoặc offer");
        }

        log("Handling remote offer", {
          fromUsername,
          offerType: offer.type,
        });
        console.groupCollapsed("[GroupWebRTC] HANDLE OFFER FLOW");
        console.debug("fromUsername:", fromUsername);
        console.debug("offer:", offer);
        console.debug("has localStream:", Boolean(localStreamRef.current));
        console.debug("existing peers:", Object.keys(peerConnectionsRef.current));
        console.groupEnd();

        await initLocalStream();

        const peerConnection = createPeerConnection(fromUsername);

        addLocalTracksToPeer(peerConnection, fromUsername);

        const remoteDescription = normalizeSessionDescription(offer);

        await peerConnection.setRemoteDescription(remoteDescription);

        log("Remote offer set", {
          fromUsername,
          signalingState: peerConnection.signalingState,
        });

        const answer = await peerConnection.createAnswer();

        await peerConnection.setLocalDescription(answer);

        log("Answer created and setLocalDescription done", {
          targetUsername: fromUsername,
          signalingState: peerConnection.signalingState,
          sdpType: answer.type,
        });

        if (callbacksRef.current.onSendAnswer) {
          callbacksRef.current.onSendAnswer({
            targetUsername: fromUsername,
            answer,
          });
        }

        return answer;
      } catch (err) {
        reportError("Không thể xử lý offer group call", err, {
          fromUsername,
        });
        throw err;
      }
    },
    [addLocalTracksToPeer, createPeerConnection, initLocalStream, reportError]
  );

  const handleAnswer = useCallback(
    async ({ fromUsername, answer }) => {
      try {
        if (!fromUsername || !answer) {
          throw new Error("handleAnswer thiếu fromUsername hoặc answer");
        }

        log("Handling remote answer", {
          fromUsername,
          answerType: answer.type,
        });
        console.groupCollapsed("[GroupWebRTC] HANDLE ANSWER FLOW");
        console.debug("fromUsername:", fromUsername);
        console.debug("answer:", answer);
        console.debug("existing peers:", Object.keys(peerConnectionsRef.current));
        console.groupEnd();

        const peerConnection = peerConnectionsRef.current[fromUsername];

        if (!peerConnection) {
          warn("No peer connection found for answer", {
            fromUsername,
          });
          return;
        }

        if (peerConnection.signalingState === "stable") {
          warn("Skip setRemoteDescription(answer) because signalingState is stable", {
            fromUsername,
            signalingState: peerConnection.signalingState,
          });
          return;
        }

        const remoteDescription = normalizeSessionDescription(answer);

        await peerConnection.setRemoteDescription(remoteDescription);

        log("Remote answer set", {
          fromUsername,
          signalingState: peerConnection.signalingState,
          connectionState: peerConnection.connectionState,
        });
      } catch (err) {
        reportError("Không thể xử lý answer group call", err, {
          fromUsername,
        });
        throw err;
      }
    },
    [reportError]
  );

  const handleIceCandidate = useCallback(
    async ({ fromUsername, candidate }) => {
      try {
        console.groupCollapsed("[GroupWebRTC] HANDLE ICE FLOW");
        console.debug("fromUsername:", fromUsername);
        console.debug("candidate:", candidate);
        console.debug("existing peers:", Object.keys(peerConnectionsRef.current));
        console.groupEnd();
        if (!fromUsername || !candidate) {
          warn("Skip ICE because fromUsername or candidate is missing", {
            fromUsername,
            hasCandidate: Boolean(candidate),
          });
          return;
        }

        const peerConnection = peerConnectionsRef.current[fromUsername];

        if (!peerConnection) {
          warn("No peer connection found for ICE candidate", {
            fromUsername,
          });
          return;
        }

        const iceCandidate = normalizeIceCandidate(candidate);

        await peerConnection.addIceCandidate(iceCandidate);

        log("Remote ICE candidate added", {
          fromUsername,
          candidateType: iceCandidate.type,
          candidateProtocol: iceCandidate.protocol,
          iceConnectionState: peerConnection.iceConnectionState,
        });
      } catch (err) {
        reportError("Không thể thêm ICE candidate group call", err, {
          fromUsername,
        });
      }
    },
    [reportError]
  );

  const removePeer = useCallback((username) => {
    try {
      if (!username) return;

      log("Removing peer", { username });

      const peerConnection = peerConnectionsRef.current[username];

      if (peerConnection) {
        peerConnection.onicecandidate = null;
        peerConnection.ontrack = null;
        peerConnection.onconnectionstatechange = null;
        peerConnection.oniceconnectionstatechange = null;
        peerConnection.onsignalingstatechange = null;
        peerConnection.onnegotiationneeded = null;
        peerConnection.close();

        delete peerConnectionsRef.current[username];
      }

      const remoteStream = remoteStreamsRef.current[username];

      if (remoteStream) {
        remoteStream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (err) {
            warn("Failed to stop remote track", {
              username,
              trackId: track.id,
              kind: track.kind,
              error: err,
            });
          }
        });

        delete remoteStreamsRef.current[username];
      }

      setRemoteStreams((prev) => {
        const next = { ...prev };
        delete next[username];
        return next;
      });

      if (callbacksRef.current.onPeerRemoved) {
        callbacksRef.current.onPeerRemoved({ username });
      }

      log("Peer removed", { username });
    } catch (err) {
      reportError("Không thể remove peer group call", err, {
        username,
      });
    }
  }, [reportError]);

  const cleanupAllPeers = useCallback(() => {
    try {
      if (isCleaningUpRef.current) return;

      isCleaningUpRef.current = true;

      log("Cleaning up all group WebRTC resources");

      Object.keys(peerConnectionsRef.current).forEach((username) => {
        const peerConnection = peerConnectionsRef.current[username];

        if (peerConnection) {
          peerConnection.onicecandidate = null;
          peerConnection.ontrack = null;
          peerConnection.onconnectionstatechange = null;
          peerConnection.oniceconnectionstatechange = null;
          peerConnection.onsignalingstatechange = null;
          peerConnection.onnegotiationneeded = null;
          peerConnection.close();
        }
      });

      peerConnectionsRef.current = {};

      Object.keys(remoteStreamsRef.current).forEach((username) => {
        const stream = remoteStreamsRef.current[username];

        if (stream) {
          stream.getTracks().forEach((track) => {
            try {
              track.stop();
            } catch (err) {
              warn("Failed to stop remote stream track during cleanup", {
                username,
                trackId: track.id,
                kind: track.kind,
                error: err,
              });
            }
          });
        }
      });

      remoteStreamsRef.current = {};
      setRemoteStreams({});

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();

            log("Stopped local track", {
              trackId: track.id,
              kind: track.kind,
            });
          } catch (err) {
            warn("Failed to stop local track", {
              trackId: track.id,
              kind: track.kind,
              error: err,
            });
          }
        });
      }

      localStreamRef.current = null;
      setLocalStream(null);
      setIsInitialized(false);
      setAudioEnabled(true);
      setVideoEnabled(true);
      setError(null);

      log("Cleanup completed");
    } catch (err) {
      reportError("Không thể cleanup group WebRTC", err);
    } finally {
      isCleaningUpRef.current = false;
    }
  }, [reportError]);

  const toggleAudio = useCallback(() => {
    try {
      const stream = localStreamRef.current;

      if (!stream) {
        warn("Cannot toggle audio because localStream is null");
        return false;
      }

      const audioTracks = stream.getAudioTracks();

      if (audioTracks.length === 0) {
        warn("No audio tracks to toggle");
        setAudioEnabled(false);
        return false;
      }

      const nextEnabled = !audioTracks[0].enabled;

      audioTracks.forEach((track) => {
        track.enabled = nextEnabled;
      });

      setAudioEnabled(nextEnabled);

      log("Audio toggled", {
        audioEnabled: nextEnabled,
        trackCount: audioTracks.length,
      });

      return nextEnabled;
    } catch (err) {
      reportError("Không thể bật/tắt mic group call", err);
      return false;
    }
  }, [reportError]);

  const toggleVideo = useCallback(() => {
    try {
      const stream = localStreamRef.current;

      if (!stream) {
        warn("Cannot toggle video because localStream is null");
        return false;
      }

      const videoTracks = stream.getVideoTracks();

      if (videoTracks.length === 0) {
        warn("No video tracks to toggle");
        setVideoEnabled(false);
        return false;
      }

      const nextEnabled = !videoTracks[0].enabled;

      videoTracks.forEach((track) => {
        track.enabled = nextEnabled;
      });

      setVideoEnabled(nextEnabled);

      log("Video toggled", {
        videoEnabled: nextEnabled,
        trackCount: videoTracks.length,
      });

      return nextEnabled;
    } catch (err) {
      reportError("Không thể bật/tắt camera group call", err);
      return false;
    }
  }, [reportError]);

  const replaceLocalStreamTracks = useCallback(
    async (newStream) => {
      try {
        if (!newStream) {
          throw new Error("replaceLocalStreamTracks thiếu newStream");
        }

        log("Replacing local stream tracks", {
          newStreamId: newStream.id,
          peerCount: Object.keys(peerConnectionsRef.current).length,
        });

        const oldStream = localStreamRef.current;

        localStreamRef.current = newStream;
        setLocalStream(newStream);

        const newAudioTrack = newStream.getAudioTracks()[0] || null;
        const newVideoTrack = newStream.getVideoTracks()[0] || null;

        await Promise.all(
          Object.entries(peerConnectionsRef.current).map(
            async ([username, peerConnection]) => {
              const senders = peerConnection.getSenders();

              await Promise.all(
                senders.map(async (sender) => {
                  if (!sender.track) return;

                  if (sender.track.kind === "audio" && newAudioTrack) {
                    await sender.replaceTrack(newAudioTrack);
                    log("Replaced audio track", { username });
                  }

                  if (sender.track.kind === "video" && newVideoTrack) {
                    await sender.replaceTrack(newVideoTrack);
                    log("Replaced video track", { username });
                  }
                })
              );
            }
          )
        );

        if (oldStream && oldStream !== newStream) {
          oldStream.getTracks().forEach((track) => track.stop());
        }

        setAudioEnabled(newAudioTrack ? newAudioTrack.enabled : false);
        setVideoEnabled(newVideoTrack ? newVideoTrack.enabled : false);

        log("Local stream tracks replaced successfully");

        return newStream;
      } catch (err) {
        reportError("Không thể thay local stream tracks group call", err);
        throw err;
      }
    },
    [reportError]
  );

  const getRemoteStream = useCallback((username) => {
    return remoteStreamsRef.current[username] || null;
  }, []);

  const getPeerConnection = useCallback((username) => {
    return peerConnectionsRef.current[username] || null;
  }, []);

  const getDebugState = useCallback(() => {
    const peerUsernames = Object.keys(peerConnectionsRef.current);

    return {
      isInitialized,
      hasLocalStream: Boolean(localStreamRef.current),
      localTracks: localStreamRef.current
        ? localStreamRef.current.getTracks().map((track) => ({
            id: track.id,
            kind: track.kind,
            label: track.label,
            enabled: track.enabled,
            readyState: track.readyState,
          }))
        : [],
      peerCount: peerUsernames.length,
      peers: peerUsernames.map((username) => {
        const peerConnection = peerConnectionsRef.current[username];

        return {
          username,
          connectionState: peerConnection.connectionState,
          iceConnectionState: peerConnection.iceConnectionState,
          signalingState: peerConnection.signalingState,
          senderCount: peerConnection.getSenders().length,
          receiverCount: peerConnection.getReceivers().length,
        };
      }),
      remoteStreamUsernames: Object.keys(remoteStreamsRef.current),
      audioEnabled,
      videoEnabled,
      error,
    };
  }, [audioEnabled, error, isInitialized, videoEnabled]);

  useEffect(() => {
    return () => {
      cleanupAllPeers();
    };
  }, [cleanupAllPeers]);

  return {
    localStream,
    remoteStreams,
    audioEnabled,
    videoEnabled,
    isInitialized,
    error,

    initLocalStream,
    createPeerConnection,
    createOfferForUser,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    removePeer,
    cleanupAllPeers,
    toggleAudio,
    toggleVideo,
    replaceLocalStreamTracks,
    getRemoteStream,
    getPeerConnection,
    getDebugState,
  };
}