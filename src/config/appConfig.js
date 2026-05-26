function parseUrlList(rawValue = '') {
    return rawValue
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
}

function trimTrailingSlash(rawValue = '') {
    return rawValue.replace(/\/+$/, '');
}

function buildApiBaseUrl(rawValue) {
    const normalizedOrigin = trimTrailingSlash(rawValue);
    if (!normalizedOrigin) {
        return 'http://localhost:3001/api';
    }

    return normalizedOrigin.endsWith('/api') ? normalizedOrigin : `${normalizedOrigin}/api`;
}

const rawStunServers =
    import.meta.env.VITE_WEBRTC_STUN_URLS ||
    import.meta.env.VITE_STUN_URLS ||
    import.meta.env.VITE_STUN_SERVERS ||
    'stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302';
const rawTurnUrls =
    import.meta.env.VITE_WEBRTC_TURN_URLS ||
    import.meta.env.VITE_TURN_URL ||
    import.meta.env.VITE_WEBRTC_TURN_URL ||
    '';

const stunServers = parseUrlList(rawStunServers).map((url) => ({ urls: url }));
const turnUrls = parseUrlList(rawTurnUrls);

const rawApiOrigin =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:3001';

export const API_BASE_URL = buildApiBaseUrl(rawApiOrigin);
export const SOCKET_URL = trimTrailingSlash(
    import.meta.env.VITE_SOCKET_URL || rawApiOrigin || 'http://localhost:3001',
);

export const DEFAULT_WEBRTC_ICE_SERVERS = [
    ...stunServers,
    ...(turnUrls.length
        ? [
              {
                  urls: turnUrls,
                  username:
                      import.meta.env.VITE_WEBRTC_TURN_USERNAME ||
                      import.meta.env.VITE_TURN_USERNAME ||
                      '',
                  credential:
                      import.meta.env.VITE_WEBRTC_TURN_CREDENTIAL ||
                      import.meta.env.VITE_TURN_CREDENTIAL ||
                      '',
              },
          ]
        : []),
];

export const WEBRTC_ICE_SERVERS = DEFAULT_WEBRTC_ICE_SERVERS;
