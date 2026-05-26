import { useEffect, useRef, useState } from 'react';
import { DEFAULT_WEBRTC_ICE_SERVERS } from '../config/appConfig';
import { getMediaPrerequisiteError, normalizeGetUserMediaError } from '../utils/mediaError';

const CALL_DEBUG_ENABLED =
    import.meta.env.VITE_CALL_DEBUG === 'true' ||
    (import.meta.env.DEV && import.meta.env.VITE_CALL_DEBUG !== 'false');

function logWebRTC(message, context = {}) {
    if (!CALL_DEBUG_ENABLED) return;
    console.debug('[WEBRTC]', message, context);
}

function warnWebRTC(message, context = {}) {
    if (!CALL_DEBUG_ENABLED) return;
    console.warn('[WEBRTC]', message, context);
}

function errorWebRTC(message, error, context = {}) {
    console.error('[WEBRTC]', message, {
        ...context,
        error: describeError(error),
    });
}

function logMedia(message, context = {}) {
    if (!CALL_DEBUG_ENABLED) return;
    console.debug('[MEDIA]', message, context);
}

function warnMedia(message, context = {}) {
    if (!CALL_DEBUG_ENABLED) return;
    console.warn('[MEDIA]', message, context);
}

function errorMedia(message, error, context = {}) {
    console.error('[MEDIA]', message, {
        ...context,
        error: describeError(error),
    });
}

function describeSessionDescription(description) {
    if (!description) return null;

    return {
        type: description.type || null,
        sdpLength: description.sdp?.length || 0,
    };
}

function sanitizeIceServers(iceServers = []) {
    if (!Array.isArray(iceServers)) return [];
    return iceServers.map((server) => ({
        urls: server?.urls || null,
        hasUsername: Boolean(server?.username),
        hasCredential: Boolean(server?.credential),
    }));
}

function describeError(error) {
    if (!error) return null;
    return {
        name: error.name || null,
        message: error.message || null,
        code: error.code || null,
        constraint: error.constraint || error.constraintName || null,
        stack: error.stack || null,
        userMessage: error.userMessage || null,
        mediaDebug: error.mediaDebug || null,
    };
}

function mapMediaErrorToVietnamese(error) {
    switch (error?.name) {
        case 'NotAllowedError':
        case 'PermissionDeniedError':
            return 'Nguoi dung, trinh duyet hoac he dieu hanh dang chan quyen camera/micro.';
        case 'NotFoundError':
        case 'DevicesNotFoundError':
            return 'Khong tim thay camera hoac micro.';
        case 'NotReadableError':
        case 'TrackStartError':
            return 'Camera hoac micro dang bi ung dung khac su dung, hoac he dieu hanh dang chan truy cap.';
        case 'OverconstrainedError':
        case 'ConstraintNotSatisfiedError':
            return 'Rang buoc media khong phu hop voi thiet bi hien co.';
        case 'SecurityError':
            return 'Ngu canh hien tai khong duoc phep truy cap media do khong phai secure context.';
        case 'AbortError':
            return 'Thiet bi media gap loi bat thuong hoac yeu cau bi huy.';
        default:
            return 'Khong the mo camera hoac micro.';
    }
}

function describeTrack(track) {
    if (!track) return null;
    return {
        id: track.id || null,
        kind: track.kind || null,
        label: track.label || '',
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState,
    };
}

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
        tracks: stream.getTracks().map(describeTrack),
    };
}

function describePeerConnection(peerConnection) {
    if (!peerConnection) {
        return {
            exists: false,
            connectionState: null,
            iceConnectionState: null,
            signalingState: null,
        };
    }

    return {
        exists: true,
        connectionState: peerConnection.connectionState,
        iceConnectionState: peerConnection.iceConnectionState,
        signalingState: peerConnection.signalingState,
        localDescription: describeSessionDescription(peerConnection.localDescription),
        remoteDescription: describeSessionDescription(peerConnection.remoteDescription),
    };
}

function buildMediaEnvironmentSnapshot(constraints = null) {
    return {
        constraints,
        hasMediaDevices: Boolean(globalThis.navigator?.mediaDevices),
        hasGetUserMedia: Boolean(globalThis.navigator?.mediaDevices?.getUserMedia),
        hasEnumerateDevices: Boolean(globalThis.navigator?.mediaDevices?.enumerateDevices),
        isSecureContext: Boolean(globalThis.isSecureContext),
        protocol: globalThis.location?.protocol || '',
        hostname: globalThis.location?.hostname || '',
        userAgent: globalThis.navigator?.userAgent || '',
    };
}

async function enumerateMediaDevicesSnapshot(reason = 'media-device-snapshot') {
    if (!globalThis.navigator?.mediaDevices?.enumerateDevices) {
        const unavailable = {
            reason,
            supported: false,
            audioinput: 0,
            videoinput: 0,
            audiooutput: 0,
            devices: [],
        };
        warnMedia('enumerateDevices is not available.', unavailable);
        return unavailable;
    }

    try {
        const devices = await globalThis.navigator.mediaDevices.enumerateDevices();
        const summary = {
            reason,
            supported: true,
            audioinput: devices.filter((device) => device.kind === 'audioinput').length,
            videoinput: devices.filter((device) => device.kind === 'videoinput').length,
            audiooutput: devices.filter((device) => device.kind === 'audiooutput').length,
            devices: devices.slice(0, 12).map((device, index) => ({
                index,
                kind: device.kind,
                label: device.label || '(label hidden until permission is granted)',
            })),
        };
        logMedia('enumerateDevices snapshot.', summary);
        return summary;
    } catch (error) {
        errorMedia('enumerateDevices failed.', error, { reason });
        return {
            reason,
            supported: true,
            failed: true,
            error: describeError(error),
            audioinput: null,
            videoinput: null,
            audiooutput: null,
            devices: [],
        };
    }
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

function toDescriptionInit(description) {
    if (!description) return null;

    return {
        type: description.type,
        sdp: description.sdp,
    };
}

export default function useWebRTC({ iceServers = DEFAULT_WEBRTC_ICE_SERVERS, onConnectionStateChange } = {}) {
    const peerConnectionRef = useRef(null);
    const localStreamRef = useRef(null);
    const remoteStreamRef = useRef(null);
    const pendingCandidatesRef = useRef([]);
    const connectionStateCallbackRef = useRef(onConnectionStateChange);
    const currentCallIdRef = useRef(null);
    const peerRoleRef = useRef(null);
    const screenStreamRef = useRef(null);
    const localStreamPromiseRef = useRef(null);

    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [connectionState, setConnectionState] = useState('new');
    const [signalingState, setSignalingState] = useState('stable');
    const [iceConnectionState, setIceConnectionState] = useState('new');
    const [isMicEnabled, setIsMicEnabled] = useState(true);
    const [isCameraEnabled, setIsCameraEnabled] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const isCameraEnabledRef = useRef(true);

    useEffect(() => {
        connectionStateCallbackRef.current = onConnectionStateChange;
    }, [onConnectionStateChange]);

    function setPeerStateSnapshot({
        connectionState: nextConnectionState = 'new',
        signalingState: nextSignalingState = 'stable',
        iceConnectionState: nextIceConnectionState = 'new',
    } = {}) {
        setConnectionState(nextConnectionState);
        setSignalingState(nextSignalingState);
        setIceConnectionState(nextIceConnectionState);
    }

    function emitPeerState(reason, peerConnection = peerConnectionRef.current) {
        const snapshot = {
            callId: currentCallIdRef.current,
            role: peerRoleRef.current,
            connectionState: peerConnection?.connectionState || 'closed',
            signalingState: peerConnection?.signalingState || 'closed',
            iceConnectionState: peerConnection?.iceConnectionState || 'closed',
            remoteStream: describeStream(remoteStreamRef.current),
            hasRemoteMediaTrack: Boolean(remoteStreamRef.current?.getTracks().length),
            hasRemoteVideoTrack: Boolean(remoteStreamRef.current?.getVideoTracks().length),
            hasRemoteAudioTrack: Boolean(remoteStreamRef.current?.getAudioTracks().length),
            reason,
        };

        setPeerStateSnapshot(snapshot);
        connectionStateCallbackRef.current?.(snapshot);

        return snapshot;
    }

    function createRemoteStream() {
        const stream = new MediaStream();
        remoteStreamRef.current = stream;
        logWebRTC('Created remote media stream container.', {
            callId: currentCallIdRef.current,
        });
        return stream;
    }

    function publishRemoteStream(stream, reason = 'remote-stream-updated', peerConnection = peerConnectionRef.current) {
        remoteStreamRef.current = stream;

        const publishedStream = stream ? new MediaStream(stream.getTracks()) : null;
        setRemoteStream(publishedStream);

        logWebRTC('[CALL][WebRTC] remote stream updated', {
            callId: currentCallIdRef.current,
            role: peerRoleRef.current,
            reason,
            videoTracks: stream?.getVideoTracks().length || 0,
            audioTracks: stream?.getAudioTracks().length || 0,
            active: Boolean(stream?.active),
            remoteStream: describeStream(stream),
        });

        if (peerConnection) {
            emitPeerState(reason, peerConnection);
        }
    }

    function clearPendingCandidates(reason = 'clear-pending-candidates') {
        if (pendingCandidatesRef.current.length > 0) {
            logWebRTC('Clearing queued ICE candidates.', {
                callId: currentCallIdRef.current,
                pendingCount: pendingCandidatesRef.current.length,
                reason,
            });
        }

        pendingCandidatesRef.current = [];
    }

    function setActiveCallContext(callId, reason) {
        if (!callId) return;

        if (currentCallIdRef.current && currentCallIdRef.current !== callId) {
            logWebRTC('Switching WebRTC call context.', {
                fromCallId: currentCallIdRef.current,
                toCallId: callId,
                reason,
            });
            clearPendingCandidates('switch-call-context');
        }

        currentCallIdRef.current = callId;
    }

    function resetPeerConnection({
        reason = 'reset-peer-connection',
        clearPendingCandidates: shouldClearPendingCandidates = false,
        clearCallContext = false,
    } = {}) {
        if (peerConnectionRef.current) {
            const peerConnection = peerConnectionRef.current;

            logWebRTC('Closing RTCPeerConnection.', {
                callId: currentCallIdRef.current,
                role: peerRoleRef.current,
                reason,
                peerConnection: describePeerConnection(peerConnection),
            });

            peerConnection.onicecandidate = null;
            peerConnection.ontrack = null;
            peerConnection.onsignalingstatechange = null;
            peerConnection.oniceconnectionstatechange = null;
            peerConnection.onconnectionstatechange = null;
            peerConnection.close();
            peerConnectionRef.current = null;
        }

        if (shouldClearPendingCandidates) {
            clearPendingCandidates(reason);
        }

        setPeerStateSnapshot();

        if (remoteStreamRef.current) {
            logWebRTC('Stopping remote media tracks.', {
                callId: currentCallIdRef.current,
                reason,
                remoteStream: describeStream(remoteStreamRef.current),
            });
            remoteStreamRef.current.getTracks().forEach((track) => {
                logWebRTC('[CALL][Cleanup] stopped remote track', {
                    id: track.id,
                    kind: track.kind,
                    callId: currentCallIdRef.current,
                    reason,
                });
                track.stop();
            });
            remoteStreamRef.current = null;
        }

        setRemoteStream(null);
        peerRoleRef.current = null;

        if (clearCallContext) {
            currentCallIdRef.current = null;
        }
    }

    function destroyLocalStream() {
        localStreamPromiseRef.current = null;
        if (!localStreamRef.current) return;

        logWebRTC('Stopping local media tracks.', {
            callId: currentCallIdRef.current,
            localStream: describeStream(localStreamRef.current),
        });

        localStreamRef.current.getTracks().forEach((track) => {
            track.stop();
            logWebRTC('[CALL][Cleanup] stopped local track', {
                id: track.id,
                kind: track.kind,
                callId: currentCallIdRef.current,
            });
        });
        localStreamRef.current = null;
        setLocalStream(null);
        setIsMicEnabled(true);
        setIsCameraEnabled(true);
        isCameraEnabledRef.current = true;
    }

    async function ensureLocalStream() {
        if (localStreamRef.current && localStreamRef.current.active) {
            logMedia('Reusing existing active local media stream.', {
                callId: currentCallIdRef.current,
                localStream: describeStream(localStreamRef.current),
            });
            return localStreamRef.current;
        }

        if (localStreamPromiseRef.current) {
            logMedia('Awaiting existing pending local media stream promise.', {
                callId: currentCallIdRef.current,
            });
            return localStreamPromiseRef.current;
        }

        const constraints = {
            audio: true,
            video: true,
        };
        const environmentSnapshot = buildMediaEnvironmentSnapshot(constraints);

        logMedia('Preparing to call getUserMedia.', {
            callId: currentCallIdRef.current,
            ...environmentSnapshot,
        });
        const devicesBefore = await enumerateMediaDevicesSnapshot('before-getUserMedia');

        const prerequisiteError = getMediaPrerequisiteError();
        if (prerequisiteError) {
            prerequisiteError.mediaDebug = {
                environment: environmentSnapshot,
                devicesBefore,
                vietnameseReason: mapMediaErrorToVietnamese(prerequisiteError),
            };
            errorMedia('Media prerequisite check failed before getUserMedia.', prerequisiteError, {
                callId: currentCallIdRef.current,
            });
            throw prerequisiteError;
        }

        localStreamPromiseRef.current = (async () => {
            let stream;
            try {
                logMedia('Calling navigator.mediaDevices.getUserMedia.', {
                    callId: currentCallIdRef.current,
                    constraints,
                });

                stream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (error) {
                const normalizedError = normalizeGetUserMediaError(error);
                const devicesAfterFailure = await enumerateMediaDevicesSnapshot('after-getUserMedia-error');
                normalizedError.mediaDebug = {
                    environment: environmentSnapshot,
                    constraints,
                    devicesBefore,
                    devicesAfterFailure,
                    originalError: describeError(error),
                    vietnameseReason: mapMediaErrorToVietnamese(error),
                };
                errorMedia('getUserMedia failed.', normalizedError, {
                    callId: currentCallIdRef.current,
                });
                localStreamPromiseRef.current = null;
                throw normalizedError;
            }

            localStreamRef.current = stream;
            setLocalStream(stream);
            setIsMicEnabled(true);
            setIsCameraEnabled(true);
            isCameraEnabledRef.current = true;
            localStreamPromiseRef.current = null;

            const devicesAfterSuccess = await enumerateMediaDevicesSnapshot('after-getUserMedia-success');
            logMedia('Local media stream is ready.', {
                callId: currentCallIdRef.current,
                localStream: describeStream(stream),
                devicesAfterSuccess,
            });

            return stream;
        })();

        return localStreamPromiseRef.current;
    }

    function createPeerConnection({ callId, onIceCandidate, role } = {}) {
        setActiveCallContext(callId, `create-peer-${role || 'unknown'}`);
        resetPeerConnection({
            reason: `replace-peer-${role || 'unknown'}`,
            clearPendingCandidates: false,
            clearCallContext: false,
        });
        createRemoteStream();

        if (typeof RTCPeerConnection === 'undefined') {
            throw new Error('This browser does not support WebRTC peer connections.');
        }

        const peerConnection = new RTCPeerConnection({
            iceServers,
        });

        peerRoleRef.current = role || null;

        logWebRTC('Created RTCPeerConnection.', {
            callId: currentCallIdRef.current,
            role: peerRoleRef.current,
            iceServers: sanitizeIceServers(iceServers),
            peerConnection: describePeerConnection(peerConnection),
        });

        peerConnection.onicecandidate = (event) => {
            if (!event.candidate) {
                logWebRTC('ICE gathering finished for current peer connection.', {
                    callId: currentCallIdRef.current,
                    role: peerRoleRef.current,
                });
                return;
            }

            const candidate = event.candidate.toJSON ? event.candidate.toJSON() : event.candidate;
            logWebRTC('Generated local ICE candidate.', {
                callId: currentCallIdRef.current,
                role: peerRoleRef.current,
                candidate: describeCandidate(candidate),
                peerConnection: describePeerConnection(peerConnection),
            });
            onIceCandidate?.(candidate);
        };

        peerConnection.ontrack = (event) => {
            const streamCount = event.streams?.length || 0;
            const streamIds = Array.from(event.streams || []).map((streamItem) => streamItem.id);
            logWebRTC('[CALL][WebRTC] ontrack fired', {
                callId: currentCallIdRef.current,
                role: peerRoleRef.current,
                kind: event.track?.kind || null,
                trackId: event.track?.id || null,
                muted: event.track?.muted ?? null,
                readyState: event.track?.readyState || null,
                streamCount,
                streamIds,
            });

            const stream = event.streams?.[0];
            const remoteMediaStream = remoteStreamRef.current || createRemoteStream();
            const tracksToAttach = stream ? [...stream.getTracks()] : [];

            if (event.track && !tracksToAttach.some((track) => track.id === event.track.id)) {
                tracksToAttach.push(event.track);
            }

            if (tracksToAttach.length === 0) {
                logWebRTC('Received ontrack event without media stream.', {
                    callId: currentCallIdRef.current,
                    role: peerRoleRef.current,
                    trackKind: event.track?.kind || 'unknown',
                    track: describeTrack(event.track),
                    peerConnection: describePeerConnection(peerConnection),
                });
                return;
            }

            tracksToAttach.forEach((track) => {
                const hasTrack = remoteMediaStream.getTracks().some((existingTrack) => existingTrack.id === track.id);
                if (!hasTrack) {
                    remoteMediaStream.addTrack(track);
                }
            });

            publishRemoteStream(remoteMediaStream, 'remote-track-updated', peerConnection);

            logWebRTC('Remote track attached.', {
                callId: currentCallIdRef.current,
                role: peerRoleRef.current,
                trackKind: event.track?.kind || 'unknown',
                track: describeTrack(event.track),
                remoteStream: describeStream(remoteMediaStream),
                peerConnection: describePeerConnection(peerConnection),
            });
        };

        peerConnection.onnegotiationneeded = () => {
            logWebRTC('negotiationneeded fired.', {
                callId: currentCallIdRef.current,
                role: peerRoleRef.current,
                peerConnection: describePeerConnection(peerConnection),
            });
        };

        peerConnection.onsignalingstatechange = () => {
            const snapshot = emitPeerState('signaling-state-change', peerConnection);
            logWebRTC('signalingState changed.', snapshot);
        };

        peerConnection.oniceconnectionstatechange = () => {
            const snapshot = emitPeerState('ice-connection-state-change', peerConnection);
            logWebRTC('iceConnectionState changed.', snapshot);
        };

        peerConnection.onconnectionstatechange = () => {
            const snapshot = emitPeerState('connection-state-change', peerConnection);
            logWebRTC('connectionState changed.', snapshot);
        };

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => {
                logWebRTC('[CALL][WebRTC] adding local track', {
                    callId: currentCallIdRef.current,
                    role: peerRoleRef.current,
                    kind: track.kind,
                    id: track.id,
                    enabled: track.enabled,
                    readyState: track.readyState,
                });
                peerConnection.addTrack(track, localStreamRef.current);
            });

            logWebRTC('Attached local tracks to peer connection.', {
                callId: currentCallIdRef.current,
                role: peerRoleRef.current,
                localStream: describeStream(localStreamRef.current),
                peerConnection: describePeerConnection(peerConnection),
            });
        }

        peerConnectionRef.current = peerConnection;
        emitPeerState('peer-created', peerConnection);

        return peerConnection;
    }

    async function flushPendingCandidates({ reason = 'flush-pending-candidates' } = {}) {
        const peerConnection = peerConnectionRef.current;
        if (!peerConnection?.remoteDescription) {
            if (pendingCandidatesRef.current.length > 0) {
                logWebRTC('Remote description is not ready yet; keeping ICE queue intact.', {
                    callId: currentCallIdRef.current,
                    reason,
                    pendingCount: pendingCandidatesRef.current.length,
                });
            }
            return;
        }

        if (pendingCandidatesRef.current.length === 0) {
            return;
        }

        logWebRTC('Flushing queued remote ICE candidates.', {
            callId: currentCallIdRef.current,
            reason,
            pendingCount: pendingCandidatesRef.current.length,
        });

        while (pendingCandidatesRef.current.length > 0) {
            const candidate = pendingCandidatesRef.current.shift();

            try {
                await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                logWebRTC('[CALL][ICE] candidate added', {
                    callId: currentCallIdRef.current,
                    queued: true,
                    candidate: describeCandidate(candidate),
                });
                logWebRTC('Applied queued remote ICE candidate.', {
                    callId: currentCallIdRef.current,
                    candidate: describeCandidate(candidate),
                    remainingPendingCount: pendingCandidatesRef.current.length,
                });
            } catch (error) {
                warnWebRTC('Could not apply queued remote ICE candidate.', {
                    callId: currentCallIdRef.current,
                    candidate: describeCandidate(candidate),
                    error: error?.message || 'Unknown ICE candidate error',
                });
                errorWebRTC('Could not add queued ICE candidate.', error, {
                    callId: currentCallIdRef.current,
                    candidate: describeCandidate(candidate),
                    peerConnection: describePeerConnection(peerConnection),
                });
            }
        }

        logWebRTC('[CALL][ICE] flushed pending candidates', {
            callId: currentCallIdRef.current,
            reason,
            pendingCount: pendingCandidatesRef.current.length,
        });
    }

    async function createOffer({ callId, onIceCandidate } = {}) {
        setActiveCallContext(callId, 'create-offer');
        await ensureLocalStream();

        const peerConnection = createPeerConnection({
            callId,
            onIceCandidate,
            role: 'caller',
        });

        logWebRTC('[CALL][WebRTC] local tracks added before offer', {
            callId: currentCallIdRef.current,
            localStream: describeStream(localStreamRef.current),
            senderTracks: peerConnection.getSenders().filter((sender) => sender.track).map((sender) => describeTrack(sender.track)),
        });

        logWebRTC('Creating SDP offer.', {
            callId: currentCallIdRef.current,
            peerConnection: describePeerConnection(peerConnection),
        });

        const offer = await peerConnection.createOffer();
        logWebRTC('SDP offer created.', {
            callId: currentCallIdRef.current,
            offer: describeSessionDescription(offer),
            peerConnection: describePeerConnection(peerConnection),
        });

        await peerConnection.setLocalDescription(offer);
        logWebRTC('Local description set with SDP offer.', {
            callId: currentCallIdRef.current,
            localDescription: describeSessionDescription(peerConnection.localDescription),
            peerConnection: describePeerConnection(peerConnection),
        });

        return toDescriptionInit(peerConnection.localDescription || offer);
    }

    async function createAnswer({ callId, offer, onIceCandidate } = {}) {
        setActiveCallContext(callId, 'create-answer');
        await ensureLocalStream();

        const peerConnection = createPeerConnection({
            callId,
            onIceCandidate,
            role: 'callee',
        });

        logWebRTC('[CALL][WebRTC] local tracks added before answer', {
            callId: currentCallIdRef.current,
            localStream: describeStream(localStreamRef.current),
            senderTracks: peerConnection.getSenders().filter((sender) => sender.track).map((sender) => describeTrack(sender.track)),
        });

        logWebRTC('Applying remote offer.', {
            callId: currentCallIdRef.current,
            offer: describeSessionDescription(offer),
            peerConnection: describePeerConnection(peerConnection),
        });

        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        logWebRTC('Remote offer applied.', {
            callId: currentCallIdRef.current,
            peerConnection: describePeerConnection(peerConnection),
        });

        await flushPendingCandidates({ reason: 'after-remote-offer' });

        logWebRTC('Creating SDP answer.', {
            callId: currentCallIdRef.current,
            peerConnection: describePeerConnection(peerConnection),
        });

        const answer = await peerConnection.createAnswer();
        logWebRTC('SDP answer created.', {
            callId: currentCallIdRef.current,
            answer: describeSessionDescription(answer),
            peerConnection: describePeerConnection(peerConnection),
        });

        await peerConnection.setLocalDescription(answer);
        logWebRTC('Local description set with SDP answer.', {
            callId: currentCallIdRef.current,
            localDescription: describeSessionDescription(peerConnection.localDescription),
            peerConnection: describePeerConnection(peerConnection),
        });

        return toDescriptionInit(peerConnection.localDescription || answer);
    }

    async function applyAnswer(answer, { callId } = {}) {
        setActiveCallContext(callId, 'apply-answer');

        const peerConnection = peerConnectionRef.current;
        if (!peerConnection) {
            // Peer connection đã bị cleanup (call đã kết thúc) — ignore thay vì throw
            logWebRTC('Ignoring applyAnswer because peerConnection is null (call already cleaned up).', {
                callId: currentCallIdRef.current,
            });
            return;
        }

        if (peerConnection.remoteDescription?.type === 'answer' && peerConnection.signalingState === 'stable') {
            logWebRTC('Ignoring duplicate remote answer because it is already applied.', {
                callId: currentCallIdRef.current,
                remoteDescription: describeSessionDescription(peerConnection.remoteDescription),
            });
            return;
        }

        if (peerConnection.signalingState !== 'have-local-offer') {
            const error = new Error(
                `Cannot apply remote answer while signalingState is ${peerConnection.signalingState}.`,
            );

            logWebRTC('[CALL][WebRTC] Ignore answer because signalingState is not have-local-offer.', {
                callId: currentCallIdRef.current,
                signalingState: peerConnection.signalingState,
                localDescription: describeSessionDescription(peerConnection.localDescription),
                remoteDescription: describeSessionDescription(peerConnection.remoteDescription),
            });

            throw error;
        }

        logWebRTC('Applying remote answer.', {
            callId: currentCallIdRef.current,
            answer: describeSessionDescription(answer),
            peerConnection: describePeerConnection(peerConnection),
        });

        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        logWebRTC('Remote answer applied.', {
            callId: currentCallIdRef.current,
            peerConnection: describePeerConnection(peerConnection),
        });

        await flushPendingCandidates({ reason: 'after-remote-answer' });
    }

    async function addIceCandidate(candidate, { callId } = {}) {
        if (!candidate) {
            logWebRTC('Ignored empty ICE candidate payload.', {
                callId: callId || currentCallIdRef.current,
            });
            return;
        }

        setActiveCallContext(callId, 'incoming-ice-candidate');

        logWebRTC('[CALL][ICE] candidate received', {
            callId: currentCallIdRef.current,
            candidate: describeCandidate(candidate),
        });

        const peerConnection = peerConnectionRef.current;
        if (!peerConnection || !peerConnection.remoteDescription) {
            pendingCandidatesRef.current.push(candidate);
            logWebRTC('[CALL][ICE] queued candidate because remoteDescription missing', {
                callId: currentCallIdRef.current,
                hasPeerConnection: Boolean(peerConnection),
                remoteDescriptionReady: Boolean(peerConnection?.remoteDescription),
                pendingCount: pendingCandidatesRef.current.length,
                candidate: describeCandidate(candidate),
            });
            logWebRTC('Queued remote ICE candidate because remoteDescription is not ready.', {
                callId: currentCallIdRef.current,
                hasPeerConnection: Boolean(peerConnection),
                remoteDescriptionReady: Boolean(peerConnection?.remoteDescription),
                pendingCount: pendingCandidatesRef.current.length,
                candidate: describeCandidate(candidate),
                peerConnection: describePeerConnection(peerConnection),
            });
            return;
        }

        try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            logWebRTC('[CALL][ICE] candidate added', {
                callId: currentCallIdRef.current,
                queued: false,
                candidate: describeCandidate(candidate),
            });
            logWebRTC('Applied remote ICE candidate.', {
                callId: currentCallIdRef.current,
                candidate: describeCandidate(candidate),
                peerConnection: describePeerConnection(peerConnection),
            });
        } catch (error) {
            warnWebRTC('Could not add remote ICE candidate.', {
                callId: currentCallIdRef.current,
                candidate: describeCandidate(candidate),
                error: error?.message || 'Unknown ICE candidate error',
                peerConnection: describePeerConnection(peerConnection),
            });
            errorWebRTC('Could not add ICE candidate.', error, {
                callId: currentCallIdRef.current,
                candidate: describeCandidate(candidate),
            });
        }
    }

    function toggleMic() {
        if (!localStreamRef.current) return;

        const nextValue = !isMicEnabled;
        localStreamRef.current.getAudioTracks().forEach((track) => {
            track.enabled = nextValue;
        });

        setIsMicEnabled(nextValue);
    }

    function toggleCamera() {
        if (!localStreamRef.current) return;

        const nextValue = !isCameraEnabled;
        localStreamRef.current.getVideoTracks().forEach((track) => {
            track.enabled = nextValue;
        });

        setIsCameraEnabled(nextValue);
        isCameraEnabledRef.current = nextValue;
    }

    // ─── Screen Share helpers ────────────────────────────────────────────────

    async function replaceOutgoingVideoTrack(track) {
        const peerConnection = peerConnectionRef.current;
        if (!peerConnection || peerConnection.connectionState === 'closed') {
            if (CALL_DEBUG_ENABLED) {
                console.warn('[ScreenShare] replaceOutgoingVideoTrack: peerConnection not available or closed.');
            }
            return false;
        }

        const sender = peerConnection.getSenders().find(
            (s) => s.track && s.track.kind === 'video'
        );

        if (!sender) {
            if (CALL_DEBUG_ENABLED) {
                console.warn('[ScreenShare] replaceOutgoingVideoTrack: no video sender found.');
            }
            return false;
        }

        try {
            await sender.replaceTrack(track);
            if (CALL_DEBUG_ENABLED) {
                console.debug('[ScreenShare] replaceOutgoingVideoTrack: replaced successfully.', {
                    trackKind: track?.kind,
                    trackLabel: track?.label,
                });
            }
            return true;
        } catch (err) {
            console.error('[ScreenShare] replaceOutgoingVideoTrack failed:', err);
            return false;
        }
    }

    async function startScreenShare() {
        if (isScreenSharing) return;

        if (!navigator.mediaDevices?.getDisplayMedia) {
            console.warn('[ScreenShare] Trình duyệt không hỗ trợ chia sẻ màn hình.');
            return;
        }

        let screenStream;
        try {
            screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        } catch (err) {
            if (err.name === 'NotAllowedError' || err.name === 'AbortError') {
                if (CALL_DEBUG_ENABLED) {
                    console.debug('[ScreenShare] User cancelled screen share picker.', { errorName: err.name });
                }
                return;
            }
            console.error('[ScreenShare] getDisplayMedia failed:', err);
            return;
        }

        const screenTrack = screenStream.getVideoTracks()[0];
        if (!screenTrack) {
            console.warn('[ScreenShare] No video track in screen stream.');
            screenStream.getTracks().forEach((t) => t.stop());
            return;
        }

        screenStreamRef.current = screenStream;

        const ok = await replaceOutgoingVideoTrack(screenTrack);
        if (!ok) {
            screenStream.getTracks().forEach((t) => t.stop());
            screenStreamRef.current = null;
            setIsScreenSharing(false);
            return;
        }

        setIsScreenSharing(true);

        // Handle browser's native "Stop sharing" button
        screenTrack.onended = () => {
            stopScreenShare();
        };

        if (CALL_DEBUG_ENABLED) {
            console.debug('[ScreenShare] Screen sharing started.', {
                callId: currentCallIdRef.current,
                trackLabel: screenTrack.label,
            });
        }
    }

    async function stopScreenShare() {
        // Stop screen tracks
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach((t) => t.stop());
            screenStreamRef.current = null;
        }

        setIsScreenSharing(false);

        // Restore camera track
        const cameraTrack = localStreamRef.current?.getVideoTracks()?.[0];
        if (cameraTrack) {
            // Tôn trọng trạng thái camera hiện tại
            cameraTrack.enabled = isCameraEnabledRef.current;
            await replaceOutgoingVideoTrack(cameraTrack);

            if (CALL_DEBUG_ENABLED) {
                console.debug('[ScreenShare] Restored camera track.', {
                    callId: currentCallIdRef.current,
                    cameraEnabled: isCameraEnabledRef.current,
                    trackLabel: cameraTrack.label,
                });
            }
        } else {
            console.warn('[ScreenShare] stopScreenShare: no camera track to restore.');
        }
    }

    function stopScreenStreamIfActive() {
        if (!screenStreamRef.current) return;
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
        setIsScreenSharing(false);
    }

    function cleanupSession(reason = 'cleanup-session') {
        logWebRTC('Cleaning up WebRTC session.', {
            callId: currentCallIdRef.current,
            reason,
            peerConnection: describePeerConnection(peerConnectionRef.current),
            localStream: describeStream(localStreamRef.current),
            remoteStream: describeStream(remoteStreamRef.current),
            pendingIceCandidates: pendingCandidatesRef.current.length,
        });

        // Dừng screen stream nếu đang share màn hình trước khi cleanup
        stopScreenStreamIfActive();

        resetPeerConnection({
            reason,
            clearPendingCandidates: true,
            clearCallContext: true,
        });
        destroyLocalStream();
    }

    function getDebugSnapshot() {
        return {
            callId: currentCallIdRef.current,
            role: peerRoleRef.current,
            peerConnection: describePeerConnection(peerConnectionRef.current),
            localStream: describeStream(localStreamRef.current),
            remoteStream: describeStream(remoteStreamRef.current),
            pendingIceCandidates: pendingCandidatesRef.current.length,
        };
    }

    function getMediaFailureDebugInfo(error = null) {
        return {
            callId: currentCallIdRef.current,
            error: describeError(error),
            mediaDebug: error?.mediaDebug || null,
            snapshot: getDebugSnapshot(),
            environment: buildMediaEnvironmentSnapshot({
                audio: true,
                video: true,
            }),
        };
    }

    useEffect(() => () => cleanupSession('hook-unmount'), []);

    return {
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
        isScreenSharing,
        getDebugSnapshot,
        getMediaFailureDebugInfo,
        localStream,
        remoteStream,
        signalingState,
        startScreenShare,
        stopScreenShare,
        toggleCamera,
        toggleMic,
    };
}
