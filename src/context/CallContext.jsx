import { useEffect, useEffectEvent, useRef, useState } from 'react';
import IncomingCallModal from '../components/call/IncomingCallModal';
import OutgoingCallModal from '../components/call/OutgoingCallModal';
import CallOverlay from '../components/call/CallOverlay';
import { DEFAULT_WEBRTC_ICE_SERVERS } from '../config/appConfig';
import { connectSocket, disconnectSocket } from '../services/socket';
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
const RINGING_STATUSES = new Set(['outgoing_ringing', 'incoming_ringing']);
const INITIAL_NEGOTIATION_STATE = {
    callId: null,
    offerStarted: false,
    offerSent: false,
    offerReceived: false,
    answerStarted: false,
    answerSent: false,
    answerApplied: false,
};

function logCall(message, context = {}) {
    console.debug('[CALL]', message, context);
}

function logSocket(message, context = {}) {
    console.debug('[SOCKET]', message, context);
}

function logWebRTC(message, context = {}) {
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
        offer: payload.offer ? describeSessionDescription(payload.offer) : null,
        answer: payload.answer ? describeSessionDescription(payload.answer) : null,
        candidate: payload.candidate ? describeCandidate(payload.candidate) : null,
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

        logSocket(`Emitting ${eventName}.`, payloadSummary);

        socket.emit(eventName, payload, (response) => {
            logSocket(`Ack for ${eventName}.`, {
                ...payloadSummary,
                ok: response?.ok,
                status: response?.status || null,
                message: response?.message || null,
            });
            ack?.(response);
        });

        return socket;
    }

    function finalizeConnectionFailure(message, reason = 'connection_lost') {
        const activeCall = callStateRef.current.call;
        if (activeCall?.callId) {
            rememberLocallyFinalizedCall(activeCall.callId, 'failed');
            emitSocketEvent('call:end', { callId: activeCall.callId, reason }, () => {});
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
            reason = 'unknown',
        } = snapshot;

        logWebRTC('Peer state snapshot received in CallContext.', {
            callId,
            reason,
            connectionState: nextState,
            iceConnectionState: nextIceConnectionState,
            signalingState: nextSignalingState,
            callStatus: callStateRef.current.status,
        });

        if (['connected', 'connecting'].includes(nextState)) {
            clearDisconnectTimer();
        }

        if (nextState === 'connected') {
            setConnectionLabel('Da ket noi video');
            setCallState((previousState) =>
                previousState.call
                    ? {
                          ...previousState,
                          status: 'in_call',
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

        if (nextState === 'disconnected' && ['connecting', 'in_call'].includes(callStateRef.current.status)) {
            clearDisconnectTimer();
            disconnectTimerRef.current = setTimeout(() => {
                if (!['connecting', 'in_call'].includes(callStateRef.current.status)) {
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

        if (nextState === 'failed' && ['connecting', 'in_call'].includes(callStateRef.current.status)) {
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
        localStream,
        remoteStream,
        signalingState,
        toggleCamera,
        toggleMic,
    } = useWebRTC({
        iceServers,
        onConnectionStateChange: handlePeerConnectionStateChange,
    });

    useEffect(() => {
        callStateRef.current = callState;
    }, [callState]);

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

        if (callState.status !== 'in_call') {
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
            callId: activeCall?.callId || null,
            reason,
            status: callStateRef.current.status,
        });

        if (!activeCall) {
            if (reason === 'cancelled' && callStateRef.current.status === 'outgoing_ringing' && pendingInviteRef.current) {
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
        emitSocketEvent('call:end', { callId: activeCall.callId, reason }, (response) => {
            if (!response?.ok && response?.status !== 'not_found') {
                console.warn('[CallContext] call:end was not acknowledged:', response);
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

        const requestId = buildPendingInviteId();
        pendingInviteRef.current = {
            requestId,
            peerUsername,
            roomId,
            state: 'pending',
        };
        resetNegotiationState();

        logCall('Starting outgoing call.', {
            peerUsername,
            roomId: roomId || null,
            requestId,
        });

        setConnectionLabel('Dang do chuong...');
        setCallState({
            status: 'outgoing_ringing',
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

        emitSocketEvent('call:invite', { calleeUsername: peerUsername, roomId }, (response) => {
            const pendingInvite = pendingInviteRef.current;
            if (!pendingInvite || pendingInvite.requestId !== requestId) {
                logCall('Ignoring stale call:invite ack because pending invite no longer matches.', {
                    requestId,
                    ackCallId: response?.call?.callId || null,
                });
                return;
            }

            if (pendingInvite.state === 'cancelled') {
                clearPendingInvite();

                if (response?.ok && response.call?.callId) {
                    rememberLocallyFinalizedCall(response.call.callId, 'cancelled');
                    emitSocketEvent('call:end', { callId: response.call.callId, reason: 'cancelled' }, () => {});
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
                !['idle', 'outgoing_ringing'].includes(currentStatus)
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

            setCallState({
                status: 'outgoing_ringing',
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

        ensureNegotiationState(activeCall.callId);
        logCall('Accepting incoming call.', {
            callId: activeCall.callId,
            from: activeCall.callerUsername,
        });

        try {
            setConnectionLabel('Dang mo camera va micro...');
            await ensureLocalStream();
        } catch (error) {
            moveToTerminalState('failed', {
                call: activeCall,
                peer: callStateRef.current.peer,
                direction: 'incoming',
                message: getMediaErrorMessage(
                    error,
                    'Khong the mo camera va micro de nhan cuoc goi.',
                ),
            });
            return;
        }

        emitSocketEvent('call:accept', { callId: activeCall.callId }, (response) => {
            if (!response?.ok) {
                moveToTerminalState('failed', {
                    call: activeCall,
                    peer: callStateRef.current.peer,
                    direction: 'incoming',
                    message: response?.message || 'Khong the nhan cuoc goi.',
                });
                return;
            }

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
        });
        emitSocketEvent('call:reject', { callId: activeCall.callId }, (response) => {
            if (!response?.ok && response?.status !== 'not_found') {
                console.warn('[CallContext] call:reject was not acknowledged:', response);
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
        logSocket('Received call:incoming.', summarizeSocketPayload(payload));

        if (callStateRef.current.status !== 'idle') {
            // Fall back to rejecting on the client if another call UI is already active.
            logCall('Incoming call arrived while another call UI was active; rejecting automatically.', {
                callId: payload.call?.callId || null,
                currentStatus: callStateRef.current.status,
            });
            emitSocketEvent('call:reject', { callId: payload.call.callId }, () => {});
            return;
        }

        ensureNegotiationState(payload.call?.callId || null);
        setConnectionLabel('Cuoc goi den');
        setCallState({
            status: 'incoming_ringing',
            call: payload.call,
            peer: payload.peer || payload.caller,
            message: 'Cuoc goi video den',
            direction: 'incoming',
            timeoutMs: payload.timeoutMs || 0,
        });
    });

    const handleAcceptedCall = useEffectEvent(async (payload) => {
        logSocket('Received call:accepted.', summarizeSocketPayload(payload));

        if (wasLocallyFinalized(payload.call?.callId)) {
            logCall('Ignoring call:accepted because this call was already finalized locally.', {
                callId: payload.call?.callId || null,
            });
            return;
        }

        const callId = payload.call?.callId;
        const negotiationState = ensureNegotiationState(callId);

        setConnectionLabel('Dang thiet lap ket noi...');
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
            logCall('Ignoring duplicate call:accepted because offer creation already started.', {
                callId,
                offerStarted: negotiationState.offerStarted,
                offerSent: negotiationState.offerSent,
            });
            return;
        }

        negotiationState.offerStarted = true;

        try {
            await ensureLocalStream();
        } catch (error) {
            console.error('[CallContext] Could not access local media before creating offer:', error);
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
            emitSocketEvent('call:end', { callId: payload.call.callId, reason: 'media_error' }, () => {});
            return;
        }

        try {
            // Caller creates the SDP offer after the callee has accepted.
            const offer = await createOffer({
                callId,
                onIceCandidate: (candidate) => {
                    emitSocketEvent(
                        'webrtc:ice-candidate',
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
                'webrtc:offer',
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
                    emitSocketEvent('call:end', { callId, reason: 'signaling_error' }, () => {});
                },
            );
        } catch (error) {
            console.error('[CallContext] Could not create offer:', error);
            negotiationState.offerStarted = false;
            negotiationState.offerSent = false;
            rememberLocallyFinalizedCall(callId, 'failed');
            moveToTerminalState('failed', {
                call: payload.call,
                peer: payload.peer,
                direction: callStateRef.current.direction,
                message: 'Khong the tao ket noi WebRTC de bat dau cuoc goi.',
            });
            emitSocketEvent('call:end', { callId, reason: 'signaling_error' }, () => {});
        }
    });

    const handleOffer = useEffectEvent(async ({ callId, offer }) => {
        logSocket('Received webrtc:offer.', {
            ...summarizeSocketPayload({ callId, offer }),
            localCallId: callStateRef.current.call?.callId || null,
        });

        if (!callStateRef.current.call || callStateRef.current.call.callId !== callId) {
            logCall('Ignoring webrtc:offer because active call does not match.', {
                callId,
                activeCallId: callStateRef.current.call?.callId || null,
            });
            return;
        }
        if (wasLocallyFinalized(callId)) {
            logCall('Ignoring webrtc:offer because call was already finalized locally.', {
                callId,
            });
            return;
        }

        const negotiationState = ensureNegotiationState(callId);
        if (negotiationState.answerStarted || negotiationState.answerSent) {
            logCall('Ignoring duplicate webrtc:offer because answer creation already started.', {
                callId,
                answerStarted: negotiationState.answerStarted,
                answerSent: negotiationState.answerSent,
            });
            return;
        }

        negotiationState.offerReceived = true;
        negotiationState.answerStarted = true;

        try {
            await ensureLocalStream();
        } catch (error) {
            console.error('[CallContext] Could not access local media before creating answer:', error);
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
            emitSocketEvent('call:end', { callId, reason: 'media_error' }, () => {});
            return;
        }

        try {
            // Callee receives offer, applies it, then replies with SDP answer.
            const answer = await createAnswer({
                callId,
                offer,
                onIceCandidate: (candidate) => {
                    emitSocketEvent(
                        'webrtc:ice-candidate',
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
                'webrtc:answer',
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
                    emitSocketEvent('call:end', { callId, reason: 'signaling_error' }, () => {});
                },
            );
        } catch (error) {
            console.error('[CallContext] Could not create answer:', error);
            negotiationState.answerStarted = false;
            negotiationState.answerSent = false;
            rememberLocallyFinalizedCall(callId, 'failed');
            moveToTerminalState('failed', {
                call: callStateRef.current.call,
                peer: callStateRef.current.peer,
                direction: callStateRef.current.direction,
                message: 'Khong the hoan tat ket noi WebRTC.',
            });
            emitSocketEvent('call:end', { callId, reason: 'signaling_error' }, () => {});
        }
    });

    const handleAnswer = useEffectEvent(async ({ callId, answer }) => {
        logSocket('Received webrtc:answer.', {
            ...summarizeSocketPayload({ callId, answer }),
            activeCallId: callStateRef.current.call?.callId || null,
        });

        if (!callStateRef.current.call || callStateRef.current.call.callId !== callId) {
            logCall('Ignoring webrtc:answer because active call does not match.', {
                callId,
                activeCallId: callStateRef.current.call?.callId || null,
            });
            return;
        }
        if (wasLocallyFinalized(callId)) {
            logCall('Ignoring webrtc:answer because call was already finalized locally.', {
                callId,
            });
            return;
        }

        const negotiationState = ensureNegotiationState(callId);
        if (negotiationState.answerApplied) {
            logCall('Ignoring duplicate webrtc:answer because it was already applied.', {
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
            logWebRTC('Failed to apply remote SDP answer in CallContext.', {
                callId,
                error: error?.message || 'Unknown applyAnswer error',
                connectionState,
                iceConnectionState,
                signalingState,
            });
            console.error('[CallContext] Could not apply answer:', error);
            rememberLocallyFinalizedCall(callId, 'failed');
            moveToTerminalState('failed', {
                call: callStateRef.current.call,
                peer: callStateRef.current.peer,
                direction: callStateRef.current.direction,
                message: 'Khong the dong bo ket noi video.',
            });
            emitSocketEvent('call:end', { callId, reason: 'signaling_error' }, () => {});
        }
    });

    const handleIceCandidate = useEffectEvent(async ({ callId, candidate }) => {
        logSocket('Received webrtc:ice-candidate.', summarizeSocketPayload({ callId, candidate }));

        if (!callStateRef.current.call || callStateRef.current.call.callId !== callId) {
            logCall('Ignoring webrtc:ice-candidate because active call does not match.', {
                callId,
                activeCallId: callStateRef.current.call?.callId || null,
            });
            return;
        }
        if (wasLocallyFinalized(callId)) {
            logCall('Ignoring webrtc:ice-candidate because call was already finalized locally.', {
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
        logSocket('Received call:rejected.', summarizeSocketPayload(payload));

        if (wasLocallyFinalized(payload.call?.callId, 'rejected')) {
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

        moveToTerminalState(payload.status || 'failed', {
            call: payload.call || callStateRef.current.call,
            peer: payload.peer || callStateRef.current.peer,
            direction: callStateRef.current.direction || 'outgoing',
            message: payload.message || 'Khong the thuc hien cuoc goi.',
        });
    });

    const handleEnded = useEffectEvent((payload) => {
        logSocket('Received call:ended.', summarizeSocketPayload(payload));

        const activeCallId = callStateRef.current.call?.callId;
        if (activeCallId && payload.call?.callId && activeCallId !== payload.call.callId) {
            return;
        }

        if (wasLocallyFinalized(payload.call?.callId)) {
            return;
        }

        moveToTerminalState(payload.call?.status === 'cancelled' ? 'cancelled' : 'ended', {
            call: payload.call,
            peer: payload.peer || callStateRef.current.peer,
            direction: callStateRef.current.direction || 'outgoing',
            message:
                payload.reason === 'disconnect'
                    ? 'Cuoc goi ket thuc do mat ket noi.'
                    : payload.call?.status === 'cancelled'
                      ? 'Cuoc goi da bi huy.'
                      : 'Cuoc goi da ket thuc.',
        });
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

        const socket = connectSocket();

        socket.off('call:incoming', handleIncomingCall);
        socket.off('call:accepted', handleAcceptedCall);
        socket.off('call:busy', handleBusy);
        socket.off('call:rejected', handleRejected);
        socket.off('call:timeout', handleTimeout);
        socket.off('call:failed', handleFailed);
        socket.off('call:ended', handleEnded);
        socket.off('webrtc:offer', handleOffer);
        socket.off('webrtc:answer', handleAnswer);
        socket.off('webrtc:ice-candidate', handleIceCandidate);

        socket.on('call:incoming', handleIncomingCall);
        socket.on('call:accepted', handleAcceptedCall);
        socket.on('call:busy', handleBusy);
        socket.on('call:rejected', handleRejected);
        socket.on('call:timeout', handleTimeout);
        socket.on('call:failed', handleFailed);
        socket.on('call:ended', handleEnded);
        socket.on('webrtc:offer', handleOffer);
        socket.on('webrtc:answer', handleAnswer);
        socket.on('webrtc:ice-candidate', handleIceCandidate);

        logSocket('Registered call and WebRTC listeners on socket.', {
            socketId: socket.id || null,
        });

        return () => {
            socket.off('call:incoming', handleIncomingCall);
            socket.off('call:accepted', handleAcceptedCall);
            socket.off('call:busy', handleBusy);
            socket.off('call:rejected', handleRejected);
            socket.off('call:timeout', handleTimeout);
            socket.off('call:failed', handleFailed);
            socket.off('call:ended', handleEnded);
            socket.off('webrtc:offer', handleOffer);
            socket.off('webrtc:answer', handleAnswer);
            socket.off('webrtc:ice-candidate', handleIceCandidate);
            clearAllUiTimers();
            clearHistoryRefreshTimer();
        };
    }, [user]);

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
                incomingCall: callState.status === 'incoming_ringing' ? callState.call : null,
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
                visible={callState.status === 'incoming_ringing'}
                peer={callState.peer}
                countdownSec={ringCountdownSec}
                onAccept={acceptIncomingCall}
                onReject={rejectIncomingCall}
            />

            <OutgoingCallModal
                visible={callState.status === 'outgoing_ringing' || TERMINAL_STATUSES.has(callState.status)}
                status={callState.status}
                direction={callState.direction}
                peer={callState.peer}
                message={callState.message}
                countdownSec={ringCountdownSec}
                onCancel={() => endCall('cancelled')}
                onClose={resetCallUi}
            />

            <CallOverlay
                visible={['connecting', 'in_call'].includes(callState.status)}
                status={callState.status}
                peer={callState.peer}
                localStream={localStream}
                remoteStream={remoteStream}
                isMicEnabled={isMicEnabled}
                isCameraEnabled={isCameraEnabled}
                onToggleMic={toggleMic}
                onToggleCamera={toggleCamera}
                onEndCall={() => endCall('ended')}
                connectionLabel={callState.status === 'in_call' ? 'Da ket noi video' : connectionLabel}
                connectionState={connectionState}
                callDurationSec={callDurationSec}
            />
        </CallContext.Provider>
    );
}