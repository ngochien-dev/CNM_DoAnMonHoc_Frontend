import { useEffect, useEffectEvent, useRef, useState } from 'react';
import IncomingCallModal from '../components/call/IncomingCallModal';
import OutgoingCallModal from '../components/call/OutgoingCallModal';
import CallOverlay from '../components/call/CallOverlay';
import { DEFAULT_WEBRTC_ICE_SERVERS } from '../config/appConfig';
import { connectSocket, disconnectSocket, getSocketDebugSnapshot } from '../services/socket';
import api from '../services/api';
import useWebRTC from '../hooks/useWebRTC';
import { getMediaErrorMessage } from '../utils/mediaError';
import CallContext from './callContextShared';

const INITIAL_CALL_STATE = {
    status: 'idle',
    call: null,
    peer: null,
    message: '',
    direction: null,
    timeoutMs: 0,
};

const RESET_UI_AFTER_MS = 4000;
const HISTORY_REFRESH_DELAY_MS = 500;
const LOCAL_FINALIZATION_TTL_MS = 15000;
const DISCONNECTED_GRACE_MS = 5000;
const CALL_EVENTS = {
    invite: 'call-user',
    incoming: 'incoming-call',
    accept: 'accept-call',
    reject: 'reject-call',
    end: 'end-call',
    ended: 'call-ended',
    offer: 'offer',
    answer: 'answer',
    iceCandidate: 'ice-candidate',
};
const TERMINAL_STATUSES = new Set([
    'rejected',
    'timeout',
    'busy',
    'failed',
    'ended',
    'cancelled',
    'missed',
    'offline',
    'forbidden',
    'invalid',
    'not_found',
    'invalid_state',
]);
const RINGING_STATUSES = new Set(['outgoing', 'incoming']);
const INITIAL_NEGOTIATION_STATE = {
    callId: null,
    offerStarted: false,
    offerSent: false,
    offerReceived: false,
    answerStarted: false,
    answerSent: false,
    answerApplied: false,
};

const CALL_DEBUG_ENABLED =
    import.meta.env.VITE_CALL_DEBUG === 'true' ||
    (import.meta.env.DEV && import.meta.env.VITE_CALL_DEBUG !== 'false');

function logCall(message, context = {}) {
    if (!CALL_DEBUG_ENABLED) return;
    console.debug('[CALL][FRONTEND]', message, context);
}

function warnCall(message, context = {}) {
    if (!CALL_DEBUG_ENABLED) return;
    console.warn('[CALL][FRONTEND]', message, context);
}

function errorCall(message, error, context = {}) {
    console.error('[CALL][FRONTEND]', message, {
        ...context,
        error: {
            name: error?.name || null,
            message: error?.message || null,
            code: error?.code || null,
            constraint: error?.constraint || error?.constraintName || null,
            stack: error?.stack || null,
            userMessage: error?.userMessage || null,
            mediaDebug: error?.mediaDebug || null,
        },
    });
}

function logSocket(message, context = {}) {
    if (!CALL_DEBUG_ENABLED) return;
    console.debug('[SOCKET][FRONTEND]', message, context);
}

function logWebRTC(message, context = {}) {
    if (!CALL_DEBUG_ENABLED) return;
    console.debug('[WEBRTC]', message, context);
}

function describeSessionDescription(description) {
    if (!description) return null;

    return {
        type: description.type || null,
        sdpLength: description.sdp?.length || 0,
    };
}

function describeCandidate(candidate) {
    if (!candidate) return null;

    const candidateLine = candidate.candidate || '';
    const typeMatch = candidateLine.match(/ typ ([^ ]+)/);

    return {
        type: typeMatch?.[1] || 'unknown',
        sdpMid: candidate.sdpMid ?? null,
        sdpMLineIndex: candidate.sdpMLineIndex ?? null,
    };
}

function summarizeSocketPayload(payload = {}) {
    return {
        callId: payload.callId ?? payload.call?.callId ?? null,
        status: payload.status ?? payload.call?.status ?? null,
        reason: payload.reason ?? payload.call?.endReason ?? null,
        from: payload.from || payload.caller?.username || payload.call?.callerUsername || null,
        to: payload.to || payload.callee?.username || payload.call?.calleeUsername || null,
        offer: payload.offer ? describeSessionDescription(payload.offer) : null,
        answer: payload.answer ? describeSessionDescription(payload.answer) : null,
        candidate: payload.candidate ? describeCandidate(payload.candidate) : null,
        mediaError: payload.mediaError
            ? {
                  error: payload.mediaError.error || null,
                  environment: payload.mediaError.environment || null,
                  deviceCounts: payload.mediaError.mediaDebug
                      ? {
                            before: {
                                audioinput: payload.mediaError.mediaDebug.devicesBefore?.audioinput,
                                videoinput: payload.mediaError.mediaDebug.devicesBefore?.videoinput,
                                audiooutput: payload.mediaError.mediaDebug.devicesBefore?.audiooutput,
                            },
                            afterFailure: {
                                audioinput: payload.mediaError.mediaDebug.devicesAfterFailure?.audioinput,
                                videoinput: payload.mediaError.mediaDebug.devicesAfterFailure?.videoinput,
                                audiooutput: payload.mediaError.mediaDebug.devicesAfterFailure?.audiooutput,
                            },
                        }
                      : null,
              }
            : null,
    };
}

function parseTimestamp(value) {
    if (!value) return null;

    const parsedValue = new Date(value).getTime();
    return Number.isNaN(parsedValue) ? null : parsedValue;
}

function computeCallDurationSec(call) {
    if (!call?.answeredAt) return 0;

    const answeredAt = parseTimestamp(call.answeredAt);
    const endedAt = parseTimestamp(call.endedAt) || Date.now();
    if (!answeredAt) return 0;

    return Math.max(0, Math.floor((endedAt - answeredAt) / 1000));
}

function computeRingCountdownSec(call, timeoutMs) {
    const timeoutAt = parseTimestamp(call?.timeoutAt);
    const fallbackTimeoutAt = timeoutMs ? Date.now() + timeoutMs : null;
    const deadline = timeoutAt || fallbackTimeoutAt;

    if (!deadline) return 0;
    return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
}

function getRemoteTrackSummary(remoteStreamSnapshot = null) {
    const audioTracks = remoteStreamSnapshot?.audioTracks || 0;
    const videoTracks = remoteStreamSnapshot?.videoTracks || 0;

    return {
        audioTracks,
        videoTracks,
        hasRemoteAudioTrack: audioTracks > 0,
        hasRemoteVideoTrack: videoTracks > 0,
        hasRemoteMediaTrack: audioTracks > 0 || videoTracks > 0,
    };
}

export function CallProvider({ children, user }) {
    const [callState, setCallState] = useState(INITIAL_CALL_STATE);
    const [callHistoryVersion, setCallHistoryVersion] = useState(0);
    const [connectionLabel, setConnectionLabel] = useState('Dang chuan bi thiet bi...');
    const [ringCountdownSec, setRingCountdownSec] = useState(0);
    const [callDurationSec, setCallDurationSec] = useState(0);
    const [iceServers, setIceServers] = useState(DEFAULT_WEBRTC_ICE_SERVERS);

    const callStateRef = useRef(INITIAL_CALL_STATE);
    const resetTimerRef = useRef(null);
    const ringCountdownTimerRef = useRef(null);
    const durationTimerRef = useRef(null);
    const historyRefreshTimerRef = useRef(null);
    const pendingInviteRef = useRef(null);
    const locallyFinalizedCallsRef = useRef(new Map());
    const disconnectTimerRef = useRef(null);
    const negotiationStateRef = useRef(INITIAL_NEGOTIATION_STATE);
    const acceptingCallIdsRef = useRef(new Set());

    function clearResetTimer() {
        if (!resetTimerRef.current) return;
        clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
    }

    function clearRingCountdownTimer() {
        if (!ringCountdownTimerRef.current) return;
        clearInterval(ringCountdownTimerRef.current);
        ringCountdownTimerRef.current = null;
    }

    function clearDurationTimer() {
        if (!durationTimerRef.current) return;
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
    }

    function clearHistoryRefreshTimer() {
        if (!historyRefreshTimerRef.current) return;
        clearTimeout(historyRefreshTimerRef.current);
        historyRefreshTimerRef.current = null;
    }

    function clearDisconnectTimer() {
        if (!disconnectTimerRef.current) return;
        clearTimeout(disconnectTimerRef.current);
        disconnectTimerRef.current = null;
    }

    function scheduleHistoryRefresh(delayMs = HISTORY_REFRESH_DELAY_MS) {
        clearHistoryRefreshTimer();
        historyRefreshTimerRef.current = setTimeout(() => {
            setCallHistoryVersion((value) => value + 1);
            historyRefreshTimerRef.current = null;
        }, delayMs);
    }

    function buildPendingInviteId() {
        if (globalThis.crypto?.randomUUID) {
            return globalThis.crypto.randomUUID();
        }

        return `invite_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    }

    function clearPendingInvite() {
        pendingInviteRef.current = null;
    }

    function resetNegotiationState(callId = null) {
        negotiationStateRef.current = {
            ...INITIAL_NEGOTIATION_STATE,
            callId,
        };
    }

    function ensureNegotiationState(callId) {
        if (!callId) {
            return negotiationStateRef.current;
        }

        if (negotiationStateRef.current.callId !== callId) {
            negotiationStateRef.current = {
                ...INITIAL_NEGOTIATION_STATE,
                callId,
            };
        }

        return negotiationStateRef.current;
    }

    function pruneLocalFinalizationCache() {
        const now = Date.now();
        for (const [callId, entry] of locallyFinalizedCallsRef.current.entries()) {
            if (entry.expiresAt <= now) {
                locallyFinalizedCallsRef.current.delete(callId);
            }
        }
    }

    function rememberLocallyFinalizedCall(callId, status) {
        if (!callId) return;
        pruneLocalFinalizationCache();
        locallyFinalizedCallsRef.current.set(callId, {
            status,
            expiresAt: Date.now() + LOCAL_FINALIZATION_TTL_MS,
        });
    }

    function wasLocallyFinalized(callId, expectedStatuses = null) {
        if (!callId) return false;

        pruneLocalFinalizationCache();
        const finalization = locallyFinalizedCallsRef.current.get(callId);
        if (!finalization) return false;
        if (!expectedStatuses) return true;

        const allowedStatuses = Array.isArray(expectedStatuses) ? expectedStatuses : [expectedStatuses];
        return allowedStatuses.includes(finalization.status);
    }

    function clearAllUiTimers() {
        clearResetTimer();
        clearRingCountdownTimer();
        clearDurationTimer();
        clearDisconnectTimer();
    }

    function resetEphemeralState() {
        setConnectionLabel('Dang chuan bi thiet bi...');
        setRingCountdownSec(0);
        setCallDurationSec(0);
    }

    function resetCallUi({ preservePendingInvite = pendingInviteRef.current?.state === 'cancelled' } = {}) {
        logCall('Resetting call UI and cleaning media/session.', {
            preservePendingInvite,
            ...getCallDebugSnapshot(),
        });
        acceptingCallIdsRef.current.clear();
        clearAllUiTimers();
        resetNegotiationState();
        cleanupSession('reset-call-ui');
        resetEphemeralState();
        if (!preservePendingInvite) {
            clearPendingInvite();
        }
        setCallState(INITIAL_CALL_STATE);
    }

    function moveToTerminalState(nextState, payload = {}, options = {}) {
        const { historyRefreshDelayMs = HISTORY_REFRESH_DELAY_MS, preservePendingInvite = false } = options;
        logCall('Moving call to terminal state.', {
            nextState,
            payload: summarizeSocketPayload(payload),
            preservePendingInvite,
            ...getCallDebugSnapshot(),
        });
        clearAllUiTimers();
        resetNegotiationState();
        cleanupSession(`terminal-${nextState}`);

        const finalCall = payload.call || callStateRef.current.call;
        resetEphemeralState();
        setCallDurationSec(computeCallDurationSec(finalCall));
        if (!preservePendingInvite) {
            clearPendingInvite();
        }

        setCallState((previousState) => ({
            ...previousState,
            ...payload,
            status: nextState,
        }));
        scheduleHistoryRefresh(historyRefreshDelayMs);

        resetTimerRef.current = setTimeout(() => {
            setCallState(INITIAL_CALL_STATE);
            resetEphemeralState();
        }, RESET_UI_AFTER_MS);
    }

    function emitSocketEvent(eventName, payload = {}, ack) {
        const socket = connectSocket();
        const payloadSummary = summarizeSocketPayload(payload);

        logSocket(`Emitting ${eventName}.`, {
            ...payloadSummary,
            currentUser: user?.username || null,
            callState: callStateRef.current.status,
            socketId: socket.id || null,
            socketConnected: socket.connected,
            peerUsername: callStateRef.current.peer?.username || null,
        });

        socket.emit(eventName, payload, (response) => {
            logSocket(`Ack for ${eventName}.`, {
                ...payloadSummary,
                ok: response?.ok,
                status: response?.status || null,
                message: response?.message || null,
                responseCallId: response?.call?.callId || null,
                callState: callStateRef.current.status,
                socketId: socket.id || null,
            });
            ack?.(response);
        });

        return socket;
    }

    function finalizeConnectionFailure(message, reason = 'connection_lost') {
        const activeCall = callStateRef.current.call;
        if (activeCall?.callId) {
            rememberLocallyFinalizedCall(activeCall.callId, 'failed');
            emitSocketEvent(CALL_EVENTS.end, { callId: activeCall.callId, reason }, () => {});
        }

        moveToTerminalState('failed', {
            call: activeCall,
            peer: callStateRef.current.peer,
            direction: callStateRef.current.direction,
            message,
        });
    }

    const handlePeerConnectionStateChange = (snapshot = {}) => {
        const {
            callId = callStateRef.current.call?.callId || null,
            connectionState: nextState = 'new',
            iceConnectionState: nextIceConnectionState = 'new',
            signalingState: nextSignalingState = 'stable',
            remoteStream: remoteStreamSnapshot = null,
            reason = 'unknown',
        } = snapshot;
        const remoteTrackSummary = getRemoteTrackSummary(remoteStreamSnapshot);
        const hasRemoteMediaTrack = snapshot.hasRemoteMediaTrack ?? remoteTrackSummary.hasRemoteMediaTrack;
        const hasRemoteVideoTrack = snapshot.hasRemoteVideoTrack ?? remoteTrackSummary.hasRemoteVideoTrack;
        const isTransportConnected =
            nextState === 'connected' ||
            nextIceConnectionState === 'connected' ||
            nextIceConnectionState === 'completed';

        logWebRTC('Peer state snapshot received in CallContext.', {
            callId,
            reason,
            connectionState: nextState,
            iceConnectionState: nextIceConnectionState,
            signalingState: nextSignalingState,
            remoteStream: remoteStreamSnapshot,
            callStatus: callStateRef.current.status,
        });
        logWebRTC('[CALL][State] peer connection state changed', {
            callId,
            reason,
            connectionState: nextState,
            signalingState: nextSignalingState,
            remoteStream: remoteStreamSnapshot,
        });
        logWebRTC('[CALL][State] ice connection state changed', {
            callId,
            reason,
            iceConnectionState: nextIceConnectionState,
            remoteStream: remoteStreamSnapshot,
        });

        if (['connected', 'connecting'].includes(nextState) || ['connected', 'completed'].includes(nextIceConnectionState)) {
            clearDisconnectTimer();
        }

        if (isTransportConnected) {
            if (!hasRemoteMediaTrack) {
                setConnectionLabel('Dang cho media tu nguoi ben kia...');
                warnCall('[CALL][State] connected but remote stream missing video track', {
                    callId,
                    reason,
                    connectionState: nextState,
                    iceConnectionState: nextIceConnectionState,
                    remoteStream: remoteStreamSnapshot,
                    hasRemoteMediaTrack,
                    hasRemoteVideoTrack,
                });
                return;
            }

            if (!hasRemoteVideoTrack) {
                warnCall('[CALL][State] connected but remote stream missing video track', {
                    callId,
                    reason,
                    connectionState: nextState,
                    iceConnectionState: nextIceConnectionState,
                    remoteStream: remoteStreamSnapshot,
                    hasRemoteMediaTrack,
                    hasRemoteVideoTrack,
                });
            }

            setConnectionLabel(hasRemoteVideoTrack ? 'Da ket noi video' : 'Da ket noi am thanh, dang cho video...');
            setCallState((previousState) =>
                previousState.call
                    ? {
                          ...previousState,
                          status: 'in-call',
                          message: 'Ket noi thanh cong.',
                      }
                    : previousState,
            );
            return;
        }

        if (nextState === 'connecting') {
            setConnectionLabel('Dang ket noi video...');
            return;
        }

        if (nextState === 'disconnected' && ['connecting', 'in-call'].includes(callStateRef.current.status)) {
            clearDisconnectTimer();
            disconnectTimerRef.current = setTimeout(() => {
                if (!['connecting', 'in-call'].includes(callStateRef.current.status)) {
                    return;
                }

                if (callStateRef.current.call?.callId !== callId) {
                    return;
                }

                logWebRTC('Peer connection stayed disconnected past grace period.', {
                    callId,
                    graceMs: DISCONNECTED_GRACE_MS,
                });

                finalizeConnectionFailure('Ket noi cuoc goi bi gian doan.', 'connection_lost');
            }, DISCONNECTED_GRACE_MS);

            return;
        }

        if (nextState === 'failed' && ['connecting', 'in-call'].includes(callStateRef.current.status)) {
            finalizeConnectionFailure('Ket noi cuoc goi bi gian doan.', 'connection_lost');
        }
    };

    const {
        addIceCandidate,
        applyAnswer,
        cleanupSession,
        connectionState,
        createAnswer,
        createOffer,
        ensureLocalStream,
        iceConnectionState,
        isCameraEnabled,
        isMicEnabled,
        getDebugSnapshot: getWebRTCDebugSnapshot,
        getMediaFailureDebugInfo,
        localStream,
        remoteStream,
        signalingState,
        toggleCamera,
        toggleMic,
    } = useWebRTC({
        iceServers,
        onConnectionStateChange: handlePeerConnectionStateChange,
    });

    function getCallDebugSnapshot(extra = {}) {
        return {
            currentUser: user?.username || null,
            callState: callStateRef.current.status,
            direction: callStateRef.current.direction,
            callId: callStateRef.current.call?.callId || null,
            callerUsername: callStateRef.current.call?.callerUsername || null,
            calleeUsername: callStateRef.current.call?.calleeUsername || null,
            peerUsername: callStateRef.current.peer?.username || null,
            socket: getSocketDebugSnapshot(),
            webrtc: getWebRTCDebugSnapshot?.() || null,
            ...extra,
        };
    }

    useEffect(() => {
        callStateRef.current = callState;
    }, [callState]);

    useEffect(() => {
        logCall('CallContext initialized or user changed.', {
            currentUser: user?.username || null,
            hasUser: Boolean(user),
            socket: getSocketDebugSnapshot(),
            callState: callStateRef.current.status,
        });
    }, [user?.username]);

    useEffect(() => {
        logCall('Call state updated.', {
            status: callState.status,
            direction: callState.direction,
            callId: callState.call?.callId || null,
            peerUsername: callState.peer?.username || null,
            message: callState.message || '',
            connectionState,
            iceConnectionState,
            signalingState,
        });
    }, [callState, connectionState, iceConnectionState, signalingState]);

    useEffect(() => {
        let isCancelled = false;

        if (!user) {
            setIceServers(DEFAULT_WEBRTC_ICE_SERVERS);
            return undefined;
        }

        api.get('/calls/config')
            .then((response) => {
                if (isCancelled) return;
                const nextIceServers = Array.isArray(response.data?.iceServers) ? response.data.iceServers : [];
                setIceServers(nextIceServers.length ? nextIceServers : DEFAULT_WEBRTC_ICE_SERVERS);
            })
            .catch(() => {
                if (!isCancelled) {
                    setIceServers(DEFAULT_WEBRTC_ICE_SERVERS);
                }
            });

        return () => {
            isCancelled = true;
        };
    }, [user]);

    useEffect(() => {
        clearRingCountdownTimer();

        if (!RINGING_STATUSES.has(callState.status)) {
            setRingCountdownSec(0);
            return undefined;
        }

        const updateCountdown = () => {
            setRingCountdownSec(computeRingCountdownSec(callState.call, callState.timeoutMs));
        };

        updateCountdown();
        ringCountdownTimerRef.current = setInterval(updateCountdown, 1000);

        return clearRingCountdownTimer;
    }, [callState]);

    useEffect(() => {
        clearDurationTimer();

        if (callState.status !== 'in-call') {
            if (!TERMINAL_STATUSES.has(callState.status)) {
                setCallDurationSec(0);
            }
            return undefined;
        }

        const updateDuration = () => {
            setCallDurationSec(computeCallDurationSec(callState.call));
        };

        updateDuration();
        durationTimerRef.current = setInterval(updateDuration, 1000);

        return clearDurationTimer;
    }, [callState]);

    async function endCall(reason = 'ended') {
        const activeCall = callStateRef.current.call;
        logCall('Ending call from local UI.', {
            reason,
            ...getCallDebugSnapshot({
                callId: activeCall?.callId || null,
            }),
        });

        if (!activeCall) {
            if (reason === 'cancelled' && callStateRef.current.status === 'outgoing' && pendingInviteRef.current) {
                pendingInviteRef.current = {
                    ...pendingInviteRef.current,
                    state: 'cancelled',
                };

                moveToTerminalState(
                    'cancelled',
                    {
                        peer: callStateRef.current.peer,
                        direction: 'outgoing',
                        message: 'Ban da huy cuoc goi.',
                    },
                    { preservePendingInvite: true },
                );
                return;
            }

            resetCallUi();
            return;
        }

        rememberLocallyFinalizedCall(activeCall.callId, reason === 'cancelled' ? 'cancelled' : 'ended');
        const payload = { callId: activeCall.callId, reason };
        logCall('Sending end-call.', {
            payload: summarizeSocketPayload(payload),
            ...getCallDebugSnapshot(),
        });
        emitSocketEvent(CALL_EVENTS.end, payload, (response) => {
            if (!response?.ok && response?.status !== 'not_found') {
                console.warn('[CallContext] end-call was not acknowledged:', response);
            }
        });

        moveToTerminalState(reason === 'cancelled' ? 'cancelled' : 'ended', {
            call: {
                ...activeCall,
                endedAt: new Date().toISOString(),
                endReason: reason,
            },
            peer: callStateRef.current.peer,
            direction: callStateRef.current.direction,
            message: reason === 'cancelled' ? 'Ban da huy cuoc goi.' : 'Cuoc goi da ket thuc.',
        });
    }

    async function startCall(peerUsername, roomId) {
        if (!user || !peerUsername || peerUsername === user.username) return;
        if (callStateRef.current.status !== 'idle') return;
        if (pendingInviteRef.current && pendingInviteRef.current.state === 'pending') {
            logCall('Ignore duplicate startCall click because another call is starting.', {
                peerUsername,
                roomId,
            });
            return;
        }

        const requestId = buildPendingInviteId();
        pendingInviteRef.current = {
            requestId,
            peerUsername,
            roomId,
            state: 'pending',
        };
        resetNegotiationState();

        logCall('Starting outgoing call.', {
            callerUsername: user.username,
            calleeUsername: peerUsername,
            peerUsername,
            roomId: roomId || null,
            requestId,
            callType: 'video',
            stateBefore: callStateRef.current.status,
            socket: getSocketDebugSnapshot(),
        });

        setConnectionLabel('Dang do chuong...');
        setCallState({
            status: 'outgoing',
            call: null,
            peer: {
                username: peerUsername,
                displayName: peerUsername,
                avatar: null,
            },
            message: 'Dang goi video...',
            direction: 'outgoing',
            timeoutMs: 0,
        });

        const invitePayload = { calleeUsername: peerUsername, roomId };
        logCall('Prepared call-user emit payload.', {
            eventName: CALL_EVENTS.invite,
            payload: invitePayload,
            stateBeforeEmit: callStateRef.current.status,
            callerUsername: user.username,
            calleeUsername: peerUsername,
        });

        emitSocketEvent(CALL_EVENTS.invite, invitePayload, (response) => {
            const pendingInvite = pendingInviteRef.current;
            if (!pendingInvite || pendingInvite.requestId !== requestId) {
                logCall('Ignoring stale call-user ack because pending invite no longer matches.', {
                    requestId,
                    ackCallId: response?.call?.callId || null,
                });
                return;
            }

            if (pendingInvite.state === 'cancelled') {
                clearPendingInvite();

                if (response?.ok && response.call?.callId) {
                    rememberLocallyFinalizedCall(response.call.callId, 'cancelled');
                    emitSocketEvent(CALL_EVENTS.end, { callId: response.call.callId, reason: 'cancelled' }, () => {});
                }
                return;
            }

            clearPendingInvite();

            if (!response?.ok) {
                moveToTerminalState(response?.status || 'failed', {
                    peer: {
                        username: peerUsername,
                        displayName: peerUsername,
                        avatar: null,
                    },
                    direction: 'outgoing',
                    message: response?.message || 'Khong the bat dau cuoc goi.',
                });
                return;
            }

            const currentCallId = callStateRef.current.call?.callId;
            const currentStatus = callStateRef.current.status;
            if (
                response.call?.callId &&
                currentCallId === response.call.callId &&
                !['idle', 'outgoing'].includes(currentStatus)
            ) {
                logCall('Invite ack arrived after call state had already advanced; preserving newer state.', {
                    callId: response.call.callId,
                    currentStatus,
                });
                setCallState((previousState) => ({
                    ...previousState,
                    call: previousState.call || response.call,
                    peer: previousState.peer || response.callee || previousState.peer,
                    timeoutMs: previousState.timeoutMs || response.timeoutMs || 0,
                }));
                return;
            }

            if (response.call?.callId) {
                ensureNegotiationState(response.call.callId);
            }

            logCall('call-user acknowledged with active ringing call.', {
                callId: response.call?.callId || null,
                callerUsername: response.call?.callerUsername || user.username,
                calleeUsername: response.call?.calleeUsername || peerUsername,
                timeoutMs: response.timeoutMs || 0,
                stateBeforeSet: callStateRef.current.status,
            });

            setCallState({
                status: 'outgoing',
                call: response.call,
                peer: response.callee || {
                    username: peerUsername,
                    displayName: peerUsername,
                    avatar: null,
                },
                message: 'Dang goi video...',
                direction: 'outgoing',
                timeoutMs: response.timeoutMs || 0,
            });
        });
    }

    async function acceptIncomingCall() {
        const activeCall = callStateRef.current.call;
        if (!activeCall) return;

        const callId = activeCall.callId;
        if (acceptingCallIdsRef.current.has(callId)) {
            logCall('Ignore duplicate accept click for callId:', { callId });
            return;
        }
        acceptingCallIdsRef.current.add(callId);

        ensureNegotiationState(callId);
        logCall('[CALL][Receiver] accept clicked', {
            callId,
            from: activeCall.callerUsername,
            to: activeCall.calleeUsername,
        });

        setConnectionLabel('Đang xin quyền camera/micro...');
        setCallState((previousState) => ({
            ...previousState,
            status: 'requesting-permission',
            message: 'Đang xin quyền camera/micro...',
        }));

        logCall('[CALL][Receiver] requesting media permission', { callId });

        // First notify the server that the receiver is accepting and requesting permissions
        emitSocketEvent('accepting-call', { callId }, () => {});

        try {
            logCall('[CALL][Media] getUserMedia pending', { callId });
            await ensureLocalStream();
            logCall('[CALL][Media] getUserMedia granted', { callId });
        } catch (error) {
            logCall('[CALL][Media] getUserMedia denied', { name: error?.name, message: error?.message });
            logCall('[CALL][Receiver] cannot answer because media permission denied', { callId });

            acceptingCallIdsRef.current.delete(callId);
            rememberLocallyFinalizedCall(callId, 'failed');

            const mediaFailure = getMediaFailureDebugInfo?.(error) || null;
            emitSocketEvent(
                CALL_EVENTS.end,
                {
                    callId,
                    reason: 'media_error',
                    mediaError: mediaFailure,
                },
                () => {},
            );

            moveToTerminalState('failed', {
                call: activeCall,
                peer: callStateRef.current.peer,
                direction: 'incoming',
                message: getMediaErrorMessage(
                    error,
                    'Bạn cần cấp quyền camera/micro để gọi video.',
                ),
            });
            return;
        }

        setConnectionLabel('Dang xac nhan cuoc goi...');
        const acceptPayload = { callId };
        logCall('Sending accept-call.', {
            payload: acceptPayload,
            ...getCallDebugSnapshot(),
        });
        emitSocketEvent(CALL_EVENTS.accept, acceptPayload, (response) => {
            acceptingCallIdsRef.current.delete(callId);
            if (!response?.ok) {
                moveToTerminalState('failed', {
                    call: activeCall,
                    peer: callStateRef.current.peer,
                    direction: 'incoming',
                    message: response?.message || 'Khong the nhan cuoc goi.',
                });
                return;
            }

            logCall('accept-call acknowledged; moving receiver to connecting.', {
                responseCallId: response.call?.callId || null,
                stateBeforeSet: callStateRef.current.status,
                callerUsername: response.call?.callerUsername || activeCall.callerUsername,
                calleeUsername: response.call?.calleeUsername || activeCall.calleeUsername,
            });
            setConnectionLabel('Dang cho tin hieu WebRTC...');
            setCallState((previousState) => ({
                ...previousState,
                status: 'connecting',
                call: response.call,
                message: 'Dang ket noi cuoc goi...',
            }));
        });
    }

    function rejectIncomingCall() {
        const activeCall = callStateRef.current.call;
        if (!activeCall) return;

        rememberLocallyFinalizedCall(activeCall.callId, 'rejected');
        logCall('Rejecting incoming call.', {
            callId: activeCall.callId,
            reason: 'rejected',
            callerUsername: activeCall.callerUsername,
            calleeUsername: activeCall.calleeUsername,
            stateBefore: callStateRef.current.status,
        });
        const rejectPayload = { callId: activeCall.callId, reason: 'rejected' };
        emitSocketEvent(CALL_EVENTS.reject, rejectPayload, (response) => {
            if (!response?.ok && response?.status !== 'not_found') {
                console.warn('[CallContext] reject-call was not acknowledged:', response);
            }
        });

        moveToTerminalState('rejected', {
            call: {
                ...activeCall,
                endedAt: new Date().toISOString(),
                endReason: 'rejected',
            },
            peer: callStateRef.current.peer,
            direction: 'incoming',
            message: 'Ban da tu choi cuoc goi.',
        });
    }

    const handleIncomingCall = useEffectEvent((payload) => {
        logSocket('Received incoming-call.', {
            ...summarizeSocketPayload(payload),
            currentUser: user?.username || null,
            currentState: callStateRef.current.status,
            socket: getSocketDebugSnapshot(),
        });

        if (!payload?.call?.callId) {
            logCall('Ignoring incoming-call because payload is missing callId.', summarizeSocketPayload(payload));
            return;
        }

        if (callStateRef.current.status !== 'idle') {
            // Fall back to rejecting on the client if another call UI is already active.
            logCall('Incoming call arrived while another call UI was active; rejecting automatically.', {
                callId: payload.call?.callId || null,
                currentStatus: callStateRef.current.status,
            });
            emitSocketEvent(CALL_EVENTS.reject, { callId: payload.call.callId }, () => {});
            return;
        }

        ensureNegotiationState(payload.call?.callId || null);
        setConnectionLabel('Cuoc goi den');
        const nextIncomingState = {
            status: 'incoming',
            call: payload.call,
            peer: payload.peer || payload.caller,
            message: 'Cuoc goi video den',
            direction: 'incoming',
            timeoutMs: payload.timeoutMs || 0,
        };
        setCallState((previousState) => {
            logCall('Setting incoming call state.', {
                stateBefore: previousState.status,
                stateAfter: nextIncomingState.status,
                callerUsername: payload.call?.callerUsername || payload.caller?.username || null,
                receiverUsername: user?.username || payload.call?.calleeUsername || null,
                callId: payload.call?.callId || null,
            });
            return nextIncomingState;
        });
    });

    const handleAcceptedCall = useEffectEvent(async (payload) => {
        logSocket('Received accept-call.', summarizeSocketPayload(payload));

        const callId = payload.call?.callId;
        const activeCallId = callStateRef.current.call?.callId || null;
        if (!callId) {
            logCall('Ignoring accept-call because payload is missing callId.', summarizeSocketPayload(payload));
            return;
        }

        if (!activeCallId || activeCallId !== callId) {
            logCall('Ignoring accept-call because active call does not match.', {
                callId,
                activeCallId,
                currentStatus: callStateRef.current.status,
            });
            return;
        }

        if (wasLocallyFinalized(callId)) {
            logCall('Ignoring accept-call because this call was already finalized locally.', {
                callId,
            });
            return;
        }

        const negotiationState = ensureNegotiationState(callId);

        setConnectionLabel('Dang thiet lap ket noi...');
        logCall('Processing accept-call event.', {
            ...getCallDebugSnapshot({
                incomingPayload: summarizeSocketPayload(payload),
            }),
            isCurrentUserCaller: payload.call.callerUsername === user?.username,
        });
        setCallState((previousState) => ({
            ...previousState,
            status: 'connecting',
            call: payload.call,
            peer: payload.peer || previousState.peer,
            message: 'Dang thiet lap WebRTC...',
        }));

        if (payload.call.callerUsername !== user?.username) {
            logCall('Callee acknowledged accepted state and is waiting for remote offer.', {
                callId,
            });
            return;
        }

        if (negotiationState.offerStarted || negotiationState.offerSent) {
            logCall('Ignoring duplicate accept-call because offer creation already started.', {
                callId,
                offerStarted: negotiationState.offerStarted,
                offerSent: negotiationState.offerSent,
            });
            return;
        }

        negotiationState.offerStarted = true;

        try {
            logCall('Caller accepted event received; preparing local media before WebRTC offer.', {
                callId,
                callerUsername: payload.call.callerUsername,
                calleeUsername: payload.call.calleeUsername,
                stateBeforeMedia: callStateRef.current.status,
            });
            await ensureLocalStream();
        } catch (error) {
            errorCall('Could not access local media before creating offer.', error, {
                callId,
                state: callStateRef.current.status,
                mediaFailure: getMediaFailureDebugInfo?.(error) || null,
            });
            negotiationState.offerStarted = false;
            rememberLocallyFinalizedCall(payload.call.callId, 'failed');
            moveToTerminalState('failed', {
                call: payload.call,
                peer: payload.peer,
                direction: callStateRef.current.direction,
                message: getMediaErrorMessage(
                    error,
                    'Khong the mo camera va micro de bat dau cuoc goi.',
                ),
            });
            emitSocketEvent(
                CALL_EVENTS.end,
                {
                    callId: payload.call.callId,
                    reason: 'media_error',
                    mediaError: getMediaFailureDebugInfo?.(error) || null,
                },
                () => {},
            );
            return;
        }

        try {
            logWebRTC('Starting WebRTC offer creation after accept-call.', {
                callId,
                callerUsername: payload.call.callerUsername,
                calleeUsername: payload.call.calleeUsername,
            });
            // Caller creates the SDP offer after the callee has accepted.
            const offer = await createOffer({
                callId,
                onIceCandidate: (candidate) => {
                    emitSocketEvent(
                        CALL_EVENTS.iceCandidate,
                        {
                            callId,
                            candidate,
                        },
                        () => {},
                    );
                },
            });

            negotiationState.offerSent = true;
            logCall('Created local SDP offer for caller.', {
                callId,
                offer: describeSessionDescription(offer),
                createdAt: new Date().toISOString(),
            });

            emitSocketEvent(
                CALL_EVENTS.offer,
                {
                    callId,
                    offer,
                },
                (response) => {
                    if (response?.ok) return;

                    rememberLocallyFinalizedCall(callId, 'failed');
                    moveToTerminalState('failed', {
                        call: payload.call,
                        peer: payload.peer || callStateRef.current.peer,
                        direction: callStateRef.current.direction,
                        message: response?.message || 'Khong the gui offer WebRTC.',
                    });
                    emitSocketEvent(CALL_EVENTS.end, { callId, reason: 'signaling_error' }, () => {});
                },
            );
        } catch (error) {
            errorCall('Could not create offer.', error, {
                callId,
                state: callStateRef.current.status,
                webrtc: getWebRTCDebugSnapshot?.() || null,
            });
            negotiationState.offerStarted = false;
            negotiationState.offerSent = false;
            rememberLocallyFinalizedCall(callId, 'failed');
            moveToTerminalState('failed', {
                call: payload.call,
                peer: payload.peer,
                direction: callStateRef.current.direction,
                message: 'Khong the tao ket noi WebRTC de bat dau cuoc goi.',
            });
            emitSocketEvent(CALL_EVENTS.end, { callId, reason: 'signaling_error' }, () => {});
        }
    });

    const handleOffer = useEffectEvent(async ({ callId, offer }) => {
        logSocket('Received offer.', {
            ...summarizeSocketPayload({ callId, offer }),
            localCallId: callStateRef.current.call?.callId || null,
        });

        if (!callStateRef.current.call || callStateRef.current.call.callId !== callId) {
            logCall('Ignoring offer because active call does not match.', {
                callId,
                activeCallId: callStateRef.current.call?.callId || null,
            });
            return;
        }
        if (wasLocallyFinalized(callId)) {
            logCall('Ignoring offer because call was already finalized locally.', {
                callId,
            });
            return;
        }

        const negotiationState = ensureNegotiationState(callId);
        if (negotiationState.answerStarted || negotiationState.answerSent) {
            logCall('Ignoring duplicate offer because answer creation already started.', {
                callId,
                answerStarted: negotiationState.answerStarted,
                answerSent: negotiationState.answerSent,
            });
            return;
        }

        negotiationState.offerReceived = true;
        negotiationState.answerStarted = true;

        try {
            logCall('Receiver got offer; preparing local media before WebRTC answer.', {
                callId,
                stateBeforeMedia: callStateRef.current.status,
                callerUsername: callStateRef.current.call?.callerUsername || null,
                calleeUsername: callStateRef.current.call?.calleeUsername || null,
            });
            await ensureLocalStream();
        } catch (error) {
            errorCall('Could not access local media before creating answer.', error, {
                callId,
                state: callStateRef.current.status,
                mediaFailure: getMediaFailureDebugInfo?.(error) || null,
            });
            negotiationState.answerStarted = false;
            rememberLocallyFinalizedCall(callId, 'failed');
            moveToTerminalState('failed', {
                call: callStateRef.current.call,
                peer: callStateRef.current.peer,
                direction: callStateRef.current.direction,
                message: getMediaErrorMessage(
                    error,
                    'Khong the mo camera va micro de nhan cuoc goi.',
                ),
            });
            emitSocketEvent(
                CALL_EVENTS.end,
                {
                    callId,
                    reason: 'media_error',
                    mediaError: getMediaFailureDebugInfo?.(error) || null,
                },
                () => {},
            );
            return;
        }

        try {
            logWebRTC('Starting WebRTC answer creation after receiving offer.', {
                callId,
                offer: describeSessionDescription(offer),
            });
            // Callee receives offer, applies it, then replies with SDP answer.
            const answer = await createAnswer({
                callId,
                offer,
                onIceCandidate: (candidate) => {
                    emitSocketEvent(
                        CALL_EVENTS.iceCandidate,
                        {
                            callId,
                            candidate,
                        },
                        () => {},
                    );
                },
            });

            negotiationState.answerSent = true;
            logCall('Created local SDP answer for callee.', {
                callId,
                answer: describeSessionDescription(answer),
                createdAt: new Date().toISOString(),
            });

            emitSocketEvent(
                CALL_EVENTS.answer,
                {
                    callId,
                    answer,
                },
                (response) => {
                    if (response?.ok) return;

                    rememberLocallyFinalizedCall(callId, 'failed');
                    moveToTerminalState('failed', {
                        call: callStateRef.current.call,
                        peer: callStateRef.current.peer,
                        direction: callStateRef.current.direction,
                        message: response?.message || 'Khong the gui answer WebRTC.',
                    });
                    emitSocketEvent(CALL_EVENTS.end, { callId, reason: 'signaling_error' }, () => {});
                },
            );
        } catch (error) {
            errorCall('Could not create answer.', error, {
                callId,
                state: callStateRef.current.status,
                webrtc: getWebRTCDebugSnapshot?.() || null,
            });
            negotiationState.answerStarted = false;
            negotiationState.answerSent = false;
            rememberLocallyFinalizedCall(callId, 'failed');
            moveToTerminalState('failed', {
                call: callStateRef.current.call,
                peer: callStateRef.current.peer,
                direction: callStateRef.current.direction,
                message: 'Khong the hoan tat ket noi WebRTC.',
            });
            emitSocketEvent(CALL_EVENTS.end, { callId, reason: 'signaling_error' }, () => {});
        }
    });

    const handleAnswer = useEffectEvent(async ({ callId, answer }) => {
        logSocket('Received answer.', {
            ...summarizeSocketPayload({ callId, answer }),
            activeCallId: callStateRef.current.call?.callId || null,
        });

        if (!callStateRef.current.call || callStateRef.current.call.callId !== callId) {
            logCall('Ignoring answer because active call does not match.', {
                callId,
                activeCallId: callStateRef.current.call?.callId || null,
            });
            return;
        }
        if (wasLocallyFinalized(callId)) {
            logCall('Ignoring answer because call was already finalized locally.', {
                callId,
            });
            return;
        }

        const negotiationState = ensureNegotiationState(callId);
        if (negotiationState.answerApplied) {
            logCall('Ignoring duplicate answer because it was already applied.', {
                callId,
            });
            return;
        }

        try {
            await applyAnswer(answer, { callId });
            negotiationState.answerApplied = true;
            setConnectionLabel('Dang dong bo ket noi video...');
            logCall('Remote SDP answer applied on caller.', {
                callId,
                answer: describeSessionDescription(answer),
                signalingState,
                iceConnectionState,
                connectionState,
                appliedAt: new Date().toISOString(),
            });
        } catch (error) {
            // Phân biệt: signalingState mismatch (ignore) vs lỗi thực sự (failed)
            const isSignalingStateError =
                error?.message?.includes('signalingState') ||
                error?.message?.includes('stable') ||
                error?.message?.includes('wrong state') ||
                error?.message?.includes('already cleaned up');

            if (isSignalingStateError) {
                // Stale answer hoặc call đã cleanup — chỉ log, không crash
                logCall('[CALL][WebRTC] Ignore answer: signalingState mismatch or call already ended.', {
                    callId,
                    error: error?.message || 'signalingState error',
                    currentStatus: callStateRef.current.status,
                });
                return;
            }

            logWebRTC('Failed to apply remote SDP answer in CallContext.', {
                callId,
                error: error?.message || 'Unknown applyAnswer error',
                connectionState,
                iceConnectionState,
                signalingState,
            });
            errorCall('Could not apply answer.', error, {
                callId,
                state: callStateRef.current.status,
                webrtc: getWebRTCDebugSnapshot?.() || null,
            });
            rememberLocallyFinalizedCall(callId, 'failed');
            moveToTerminalState('failed', {
                call: callStateRef.current.call,
                peer: callStateRef.current.peer,
                direction: callStateRef.current.direction,
                message: 'Khong the dong bo ket noi video.',
            });
            emitSocketEvent(CALL_EVENTS.end, { callId, reason: 'signaling_error' }, () => {});
        }
    });

    const handleIceCandidate = useEffectEvent(async ({ callId, candidate }) => {
        logSocket('Received ice-candidate.', summarizeSocketPayload({ callId, candidate }));

        if (!callStateRef.current.call || callStateRef.current.call.callId !== callId) {
            logCall('Ignoring ice-candidate because active call does not match.', {
                callId,
                activeCallId: callStateRef.current.call?.callId || null,
            });
            return;
        }
        if (wasLocallyFinalized(callId)) {
            logCall('Ignoring ice-candidate because call was already finalized locally.', {
                callId,
            });
            return;
        }

        await addIceCandidate(candidate, { callId });
    });

    const handleBusy = useEffectEvent((payload) => {
        logSocket('Received call:busy.', summarizeSocketPayload(payload));

        if (
            callStateRef.current.status === 'busy' &&
            callStateRef.current.peer?.username &&
            callStateRef.current.peer.username === payload.calleeUsername
        ) {
            return;
        }

        moveToTerminalState('busy', {
            peer: callStateRef.current.peer || {
                username: payload.calleeUsername,
                displayName: payload.calleeUsername,
                avatar: null,
            },
            direction: 'outgoing',
            message: payload.message || 'Nguoi nhan dang ban.',
        });
    });

    const handleRejected = useEffectEvent((payload) => {
        logSocket('Received reject-call.', summarizeSocketPayload(payload));

        if (wasLocallyFinalized(payload.call?.callId, 'rejected')) {
            return;
        }

        const activeCallId = callStateRef.current.call?.callId || null;
        if (!activeCallId || (payload.call?.callId && activeCallId !== payload.call.callId)) {
            logCall('Ignoring reject-call because active call does not match.', {
                callId: payload.call?.callId || null,
                activeCallId,
                currentStatus: callStateRef.current.status,
            });
            return;
        }

        moveToTerminalState('rejected', {
            call: payload.call,
            peer: payload.peer || callStateRef.current.peer,
            direction: callStateRef.current.direction || 'outgoing',
            message: payload.message || 'Cuoc goi da bi tu choi.',
        });
    });

    const handleTimeout = useEffectEvent((payload) => {
        logSocket('Received call:timeout.', summarizeSocketPayload(payload));

        if (wasLocallyFinalized(payload.call?.callId)) {
            return;
        }

        const activeCallId = callStateRef.current.call?.callId || null;
        if (!activeCallId || (payload.call?.callId && activeCallId !== payload.call.callId)) {
            logCall('Ignoring call:timeout because active call does not match.', {
                callId: payload.call?.callId || null,
                activeCallId,
                currentStatus: callStateRef.current.status,
            });
            return;
        }

        const isCaller = payload.call?.callerUsername === user?.username;
        const nextState = isCaller ? 'timeout' : 'missed';

        moveToTerminalState(nextState, {
            call: payload.call,
            peer: payload.peer || callStateRef.current.peer,
            direction: callStateRef.current.direction || (isCaller ? 'outgoing' : 'incoming'),
            message:
                payload.message ||
                (isCaller ? 'Nguoi nhan khong bat may.' : 'Ban da bo lo cuoc goi video nay.'),
        });
    });

    const handleFailed = useEffectEvent((payload) => {
        logSocket('Received call:failed.', summarizeSocketPayload(payload));

        if (payload.call?.callId && wasLocallyFinalized(payload.call.callId, 'failed')) {
            return;
        }

        const activeCallId = callStateRef.current.call?.callId || null;
        if (!activeCallId || (payload.call?.callId && activeCallId !== payload.call.callId)) {
            logCall('Ignoring call:failed because active call does not match.', {
                callId: payload.call?.callId || null,
                activeCallId,
                currentStatus: callStateRef.current.status,
            });
            return;
        }

        moveToTerminalState(payload.status || 'failed', {
            call: payload.call || callStateRef.current.call,
            peer: payload.peer || callStateRef.current.peer,
            direction: callStateRef.current.direction || 'outgoing',
            message: payload.message || 'Khong the thuc hien cuoc goi.',
        });
    });

    const handleEnded = useEffectEvent((payload) => {
        logSocket('Received call-ended.', summarizeSocketPayload(payload));

        const activeCallId = callStateRef.current.call?.callId || null;
        if (!activeCallId || (payload.call?.callId && activeCallId !== payload.call.callId)) {
            warnCall('ignored stale call-ended', {
                callId: payload.call?.callId || null,
                activeCallId,
                currentStatus: callStateRef.current.status,
            });
            return;
        }

        if (wasLocallyFinalized(payload.call?.callId)) {
            return;
        }

        const isCaller = payload.call?.callerUsername === user?.username;
        let endMessage = 'Cuoc goi da ket thuc.';
        if (payload.reason === 'media_error') {
            endMessage = isCaller 
                ? 'Đối phương gặp lỗi thiết bị hoặc không cấp quyền camera/micro.' 
                : 'Bạn không thể tham gia vì chưa cấp quyền camera/micro.';
        } else if (payload.reason === 'disconnect') {
            endMessage = 'Cuoc goi ket thuc do mat ket noi.';
        } else if (payload.call?.status === 'cancelled') {
            endMessage = 'Cuoc goi da bi huy.';
        }

        moveToTerminalState(payload.call?.status === 'cancelled' ? 'cancelled' : 'ended', {
            call: payload.call,
            peer: payload.peer || callStateRef.current.peer,
            direction: callStateRef.current.direction || 'outgoing',
            message: endMessage,
        });
    });

    const handleAcceptingCall = useEffectEvent((payload) => {
        logSocket('Received accepting-call.', summarizeSocketPayload(payload));

        const callId = payload.call?.callId || payload.callId;
        const activeCallId = callStateRef.current.call?.callId || null;
        if (!callId) {
            logCall('Ignoring accepting-call because payload is missing callId.', summarizeSocketPayload(payload));
            return;
        }

        if (!activeCallId || activeCallId !== callId) {
            logCall('Ignoring accepting-call because active call does not match.', {
                callId,
                activeCallId,
                currentStatus: callStateRef.current.status,
            });
            return;
        }

        logCall('[CALL][Caller] receiver is accepting / requesting permission', { callId });
        setConnectionLabel('Nguoi nhan dang cap quyen camera/micro...');
        setCallState((previousState) => ({
            ...previousState,
            message: 'Người nhận đang cấp quyền camera/micro...',
        }));
    });

    useEffect(() => {
        clearResetTimer();

        if (!user) {
            clearPendingInvite();
            locallyFinalizedCallsRef.current.clear();
            resetNegotiationState();
            clearHistoryRefreshTimer();
            setIceServers(DEFAULT_WEBRTC_ICE_SERVERS);
            disconnectSocket();
            resetCallUi();
            return undefined;
        }

        logCall('CallContext preparing socket listeners for active user.', {
            currentUser: user.username,
            socketBeforeConnect: getSocketDebugSnapshot(),
            callState: callStateRef.current.status,
        });
        const socket = connectSocket();

        socket.off(CALL_EVENTS.incoming, handleIncomingCall);
        socket.off(CALL_EVENTS.accept, handleAcceptedCall);
        socket.off('accepting-call', handleAcceptingCall);
        socket.off('call:busy', handleBusy);
        socket.off(CALL_EVENTS.reject, handleRejected);
        socket.off('call:timeout', handleTimeout);
        socket.off('call:failed', handleFailed);
        socket.off(CALL_EVENTS.ended, handleEnded);
        socket.off(CALL_EVENTS.offer, handleOffer);
        socket.off(CALL_EVENTS.answer, handleAnswer);
        socket.off(CALL_EVENTS.iceCandidate, handleIceCandidate);

        socket.on(CALL_EVENTS.incoming, handleIncomingCall);
        socket.on(CALL_EVENTS.accept, handleAcceptedCall);
        socket.on('accepting-call', handleAcceptingCall);
        socket.on('call:busy', handleBusy);
        socket.on(CALL_EVENTS.reject, handleRejected);
        socket.on('call:timeout', handleTimeout);
        socket.on('call:failed', handleFailed);
        socket.on(CALL_EVENTS.ended, handleEnded);
        socket.on(CALL_EVENTS.offer, handleOffer);
        socket.on(CALL_EVENTS.answer, handleAnswer);
        socket.on(CALL_EVENTS.iceCandidate, handleIceCandidate);

        logSocket('[CALL][Socket] bind listeners', {
            socketId: socket.id || null,
            connected: socket.connected,
            currentUser: user.username,
            events: [
                CALL_EVENTS.incoming,
                CALL_EVENTS.accept,
                CALL_EVENTS.reject,
                CALL_EVENTS.ended,
                CALL_EVENTS.offer,
                CALL_EVENTS.answer,
                CALL_EVENTS.iceCandidate,
            ],
        });

        return () => {
            logSocket('[CALL][Socket] unbind listeners', {
                currentUser: user.username,
                socket: getSocketDebugSnapshot(),
            });
            socket.off(CALL_EVENTS.incoming, handleIncomingCall);
            socket.off(CALL_EVENTS.accept, handleAcceptedCall);
            socket.off('accepting-call', handleAcceptingCall);
            socket.off('call:busy', handleBusy);
            socket.off(CALL_EVENTS.reject, handleRejected);
            socket.off('call:timeout', handleTimeout);
            socket.off('call:failed', handleFailed);
            socket.off(CALL_EVENTS.ended, handleEnded);
            socket.off(CALL_EVENTS.offer, handleOffer);
            socket.off(CALL_EVENTS.answer, handleAnswer);
            socket.off(CALL_EVENTS.iceCandidate, handleIceCandidate);
            clearAllUiTimers();
            clearHistoryRefreshTimer();
        };
    }, [user?.username]);

    return (
        <CallContext.Provider
            value={{
                acceptIncomingCall,
                callDurationSec,
                callError: TERMINAL_STATUSES.has(callState.status) ? callState.message : '',
                callHistoryVersion,
                callState,
                connectionLabel,
                connectionState,
                currentCall: callState.call,
                dismissCallUi: resetCallUi,
                endCall,
                incomingCall: callState.status === 'incoming' ? callState.call : null,
                isCallBusy: callState.status !== 'idle',
                isCameraEnabled,
                isMicEnabled,
                localStream,
                remoteStream,
                rejectIncomingCall,
                ringCountdownSec,
                startCall,
                toggleCamera,
                toggleMic,
            }}
        >
            {children}

            <IncomingCallModal
                visible={callState.status === 'incoming' || callState.status === 'requesting-permission'}
                peer={callState.peer}
                countdownSec={ringCountdownSec}
                onAccept={acceptIncomingCall}
                onReject={rejectIncomingCall}
                accepting={callState.status === 'requesting-permission'}
            />

            <OutgoingCallModal
                visible={callState.status === 'outgoing' || TERMINAL_STATUSES.has(callState.status)}
                status={callState.status}
                direction={callState.direction}
                peer={callState.peer}
                message={callState.message}
                countdownSec={ringCountdownSec}
                onCancel={() => endCall('cancelled')}
                onClose={resetCallUi}
            />

            <CallOverlay
                visible={['connecting', 'in-call'].includes(callState.status)}
                status={callState.status}
                peer={callState.peer}
                localStream={localStream}
                remoteStream={remoteStream}
                isMicEnabled={isMicEnabled}
                isCameraEnabled={isCameraEnabled}
                onToggleMic={toggleMic}
                onToggleCamera={toggleCamera}
                onEndCall={() => endCall('ended')}
                connectionLabel={connectionLabel}
                connectionState={connectionState}
                callDurationSec={callDurationSec}
            />
        </CallContext.Provider>
    );
}
