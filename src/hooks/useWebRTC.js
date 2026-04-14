import { useEffect, useRef, useState } from 'react';
import { DEFAULT_WEBRTC_ICE_SERVERS } from '../config/appConfig';
import { getMediaPrerequisiteError, normalizeGetUserMediaError } from '../utils/mediaError';

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

    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [connectionState, setConnectionState] = useState('new');
    const [signalingState, setSignalingState] = useState('stable');
    const [iceConnectionState, setIceConnectionState] = useState('new');
    const [isMicEnabled, setIsMicEnabled] = useState(true);
    const [isCameraEnabled, setIsCameraEnabled] = useState(true);

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
            reason,
        };

        setPeerStateSnapshot(snapshot);
        connectionStateCallbackRef.current?.(snapshot);

        return snapshot;
    }

    function createRemoteStream() {
        const stream = new MediaStream();
        remoteStreamRef.current = stream;
        setRemoteStream(stream);
        logWebRTC('Created remote media stream container.', {
            callId: currentCallIdRef.current,
        });
        return stream;
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
                connectionState: peerConnection.connectionState,
                signalingState: peerConnection.signalingState,
                iceConnectionState: peerConnection.iceConnectionState,
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
            remoteStreamRef.current.getTracks().forEach((track) => track.stop());
            remoteStreamRef.current = null;
        }

        setRemoteStream(null);
        peerRoleRef.current = null;

        if (clearCallContext) {
            currentCallIdRef.current = null;
        }
    }

    function destroyLocalStream() {
        if (!localStreamRef.current) return;

        logWebRTC('Stopping local media tracks.', {
            callId: currentCallIdRef.current,
            audioTracks: localStreamRef.current.getAudioTracks().length,
            videoTracks: localStreamRef.current.getVideoTracks().length,
        });

        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
        setLocalStream(null);
        setIsMicEnabled(true);
        setIsCameraEnabled(true);
    }

    async function ensureLocalStream() {
        if (localStreamRef.current) {
            logWebRTC('Reusing existing local media stream.', {
                callId: currentCallIdRef.current,
            });
            return localStreamRef.current;
        }

        const prerequisiteError = getMediaPrerequisiteError();
        if (prerequisiteError) {
            throw prerequisiteError;
        }

        let stream;
        try {
            logWebRTC('Requesting camera and microphone access.', {
                callId: currentCallIdRef.current,
            });

            stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true,
            });
        } catch (error) {
            throw normalizeGetUserMediaError(error);
        }

        localStreamRef.current = stream;
        setLocalStream(stream);
        setIsMicEnabled(true);
        setIsCameraEnabled(true);

        logWebRTC('Local media stream is ready.', {
            callId: currentCallIdRef.current,
            audioTracks: stream.getAudioTracks().length,
            videoTracks: stream.getVideoTracks().length,
        });

        return stream;
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
            iceServersCount: Array.isArray(iceServers) ? iceServers.length : 0,
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
            });
            onIceCandidate?.(candidate);
        };

        peerConnection.ontrack = (event) => {
            const stream = event.streams?.[0];
            const remoteMediaStream = remoteStreamRef.current || createRemoteStream();

            if (!stream) {
                logWebRTC('Received ontrack event without media stream.', {
                    callId: currentCallIdRef.current,
                    role: peerRoleRef.current,
                    trackKind: event.track?.kind || 'unknown',
                });
                return;
            }

            stream.getTracks().forEach((track) => {
                const hasTrack = remoteMediaStream.getTracks().some((existingTrack) => existingTrack.id === track.id);
                if (!hasTrack) {
                    remoteMediaStream.addTrack(track);
                }
            });

            logWebRTC('Remote track attached.', {
                callId: currentCallIdRef.current,
                role: peerRoleRef.current,
                trackKind: event.track?.kind || 'unknown',
                remoteTrackCount: remoteMediaStream.getTracks().length,
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
                peerConnection.addTrack(track, localStreamRef.current);
            });

            logWebRTC('Attached local tracks to peer connection.', {
                callId: currentCallIdRef.current,
                role: peerRoleRef.current,
                trackCount: localStreamRef.current.getTracks().length,
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
                logWebRTC('Applied queued remote ICE candidate.', {
                    callId: currentCallIdRef.current,
                    candidate: describeCandidate(candidate),
                    remainingPendingCount: pendingCandidatesRef.current.length,
                });
            } catch (error) {
                logWebRTC('Could not apply queued remote ICE candidate.', {
                    callId: currentCallIdRef.current,
                    candidate: describeCandidate(candidate),
                    error: error?.message || 'Unknown ICE candidate error',
                });
                console.error('[WEBRTC] Could not add queued ICE candidate:', error);
            }
        }
    }

    async function createOffer({ callId, onIceCandidate } = {}) {
        setActiveCallContext(callId, 'create-offer');
        await ensureLocalStream();

        const peerConnection = createPeerConnection({
            callId,
            onIceCandidate,
            role: 'caller',
        });

        logWebRTC('Creating SDP offer.', {
            callId: currentCallIdRef.current,
        });

        const offer = await peerConnection.createOffer();
        logWebRTC('SDP offer created.', {
            callId: currentCallIdRef.current,
            offer: describeSessionDescription(offer),
        });

        await peerConnection.setLocalDescription(offer);
        logWebRTC('Local description set with SDP offer.', {
            callId: currentCallIdRef.current,
            localDescription: describeSessionDescription(peerConnection.localDescription),
            signalingState: peerConnection.signalingState,
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

        logWebRTC('Applying remote offer.', {
            callId: currentCallIdRef.current,
            offer: describeSessionDescription(offer),
        });

        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        logWebRTC('Remote offer applied.', {
            callId: currentCallIdRef.current,
            signalingState: peerConnection.signalingState,
        });

        await flushPendingCandidates({ reason: 'after-remote-offer' });

        logWebRTC('Creating SDP answer.', {
            callId: currentCallIdRef.current,
        });

        const answer = await peerConnection.createAnswer();
        logWebRTC('SDP answer created.', {
            callId: currentCallIdRef.current,
            answer: describeSessionDescription(answer),
        });

        await peerConnection.setLocalDescription(answer);
        logWebRTC('Local description set with SDP answer.', {
            callId: currentCallIdRef.current,
            localDescription: describeSessionDescription(peerConnection.localDescription),
            signalingState: peerConnection.signalingState,
        });

        return toDescriptionInit(peerConnection.localDescription || answer);
    }

    async function applyAnswer(answer, { callId } = {}) {
        setActiveCallContext(callId, 'apply-answer');

        const peerConnection = peerConnectionRef.current;
        if (!peerConnection) {
            const error = new Error('Peer connection is not available when applying the remote answer.');
            logWebRTC('Cannot apply remote answer because peer connection is missing.', {
                callId: currentCallIdRef.current,
            });
            throw error;
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

            logWebRTC('Rejected remote answer because signaling state is unexpected.', {
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
            signalingState: peerConnection.signalingState,
        });

        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        logWebRTC('Remote answer applied.', {
            callId: currentCallIdRef.current,
            signalingState: peerConnection.signalingState,
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

        const peerConnection = peerConnectionRef.current;
        if (!peerConnection || !peerConnection.remoteDescription) {
            pendingCandidatesRef.current.push(candidate);
            logWebRTC('Queued remote ICE candidate because remoteDescription is not ready.', {
                callId: currentCallIdRef.current,
                hasPeerConnection: Boolean(peerConnection),
                remoteDescriptionReady: Boolean(peerConnection?.remoteDescription),
                pendingCount: pendingCandidatesRef.current.length,
                candidate: describeCandidate(candidate),
            });
            return;
        }

        try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            logWebRTC('Applied remote ICE candidate.', {
                callId: currentCallIdRef.current,
                candidate: describeCandidate(candidate),
                signalingState: peerConnection.signalingState,
            });
        } catch (error) {
            logWebRTC('Could not add remote ICE candidate.', {
                callId: currentCallIdRef.current,
                candidate: describeCandidate(candidate),
                error: error?.message || 'Unknown ICE candidate error',
            });
            console.error('[WEBRTC] Could not add ICE candidate:', error);
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
    }

    function cleanupSession(reason = 'cleanup-session') {
        logWebRTC('Cleaning up WebRTC session.', {
            callId: currentCallIdRef.current,
            reason,
        });

        resetPeerConnection({
            reason,
            clearPendingCandidates: true,
            clearCallContext: true,
        });
        destroyLocalStream();
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
        localStream,
        remoteStream,
        signalingState,
        toggleCamera,
        toggleMic,
    };
}
