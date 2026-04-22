function isLocalHostname(hostname = '') {
    const normalizedHostname = String(hostname || '').trim().toLowerCase();
    return (
        normalizedHostname === 'localhost' ||
        normalizedHostname === '127.0.0.1' ||
        normalizedHostname === '::1' ||
        normalizedHostname.endsWith('.localhost')
    );
}

function isIosDevice(userAgent = '', navigatorObject = globalThis.navigator) {
    if (/(iPad|iPhone|iPod)/i.test(userAgent)) {
        return true;
    }

    return navigatorObject?.platform === 'MacIntel' && Number(navigatorObject?.maxTouchPoints || 0) > 1;
}

function isSafariBrowser(userAgent = '') {
    return /Safari/i.test(userAgent) && !/(CriOS|Chrome|FxiOS|Firefox|EdgiOS|EdgA|OPiOS|OPT)/i.test(userAgent);
}

function isIosSafariHttpOverLan() {
    const userAgent = globalThis.navigator?.userAgent || '';
    const protocol = globalThis.location?.protocol || '';
    const hostname = globalThis.location?.hostname || '';

    return isIosDevice(userAgent) && isSafariBrowser(userAgent) && protocol === 'http:' && !isLocalHostname(hostname);
}

function getSecureContextState() {
    if (typeof globalThis.isSecureContext === 'boolean') {
        return globalThis.isSecureContext;
    }

    const protocol = globalThis.location?.protocol || '';
    const hostname = globalThis.location?.hostname || '';
    return protocol === 'https:' || isLocalHostname(hostname);
}

function buildMediaError(code, userMessage, sourceError = null) {
    const normalizedError = new Error(userMessage);
    normalizedError.name = sourceError?.name || 'MediaAccessError';
    normalizedError.code = code;
    normalizedError.userMessage = userMessage;
    normalizedError.isMediaAccessError = true;
    normalizedError.cause = sourceError || undefined;
    return normalizedError;
}

function buildSecureContextMessage() {
    if (isIosSafariHttpOverLan()) {
        return 'Safari tren iPhone thuong yeu cau HTTPS de dung camera va micro. Hay mo app bang HTTPS thay vi IP LAN qua HTTP.';
    }

    return 'Trinh duyet dang chay tren ket noi khong an toan (HTTP), nen camera va micro bi chan. Hay mo app bang HTTPS, hoac chi dung localhost khi test tren cung may.';
}

const MEDIA_ERROR_NAMES = new Set([
    'AbortError',
    'ConstraintNotSatisfiedError',
    'DevicesNotFoundError',
    'NotAllowedError',
    'NotFoundError',
    'NotReadableError',
    'OverconstrainedError',
    'PermissionDeniedError',
    'TrackStartError',
]);

export function getMediaPrerequisiteError() {
    if (!getSecureContextState()) {
        return buildMediaError('secure_context', buildSecureContextMessage());
    }

    if (!globalThis.navigator?.mediaDevices?.getUserMedia) {
        return buildMediaError(
            'media_devices_unavailable',
            'Trinh duyet nay khong ho tro mediaDevices/getUserMedia, nen khong the dung camera va micro.',
        );
    }

    return null;
}

export function normalizeGetUserMediaError(error) {
    if (error?.isMediaAccessError) {
        return error;
    }

    const errorName = error?.name || '';
    const errorMessage = String(error?.message || '');
    const lowerCaseMessage = errorMessage.toLowerCase();

    if (
        !getSecureContextState() ||
        lowerCaseMessage.includes('secure context') ||
        lowerCaseMessage.includes('insecure') ||
        lowerCaseMessage.includes('current context')
    ) {
        return buildMediaError('secure_context', buildSecureContextMessage(), error);
    }

    if (
        errorName === 'NotAllowedError' ||
        errorName === 'PermissionDeniedError' ||
        lowerCaseMessage.includes('permission denied') ||
        lowerCaseMessage.includes('permission dismissed') ||
        lowerCaseMessage.includes('not allowed')
    ) {
        return buildMediaError(
            'permission_denied',
            'Ban da tu choi quyen camera/micro. Hay cap quyen lai trong trinh duyet roi thu lai.',
            error,
        );
    }

    if (
        errorName === 'NotFoundError' ||
        errorName === 'DevicesNotFoundError' ||
        lowerCaseMessage.includes('requested device not found') ||
        lowerCaseMessage.includes('device not found')
    ) {
        return buildMediaError(
            'device_not_found',
            'Khong tim thay camera hoac micro tren thiet bi nay.',
            error,
        );
    }

    if (
        errorName === 'NotReadableError' ||
        errorName === 'TrackStartError' ||
        lowerCaseMessage.includes('could not start video source') ||
        lowerCaseMessage.includes('device in use')
    ) {
        return buildMediaError(
            'device_unavailable',
            'Camera hoac micro dang bi ung dung khac su dung, hoac he dieu hanh dang chan truy cap.',
            error,
        );
    }

    if (errorName === 'OverconstrainedError' || errorName === 'ConstraintNotSatisfiedError') {
        return buildMediaError(
            'constraints_not_satisfied',
            'Khong tim duoc camera/micro phu hop voi cau hinh hien tai.',
            error,
        );
    }

    if (errorName === 'AbortError') {
        return buildMediaError(
            'media_request_aborted',
            'Trinh duyet da huy yeu cau mo camera/micro truoc khi hoan tat.',
            error,
        );
    }

    return buildMediaError('media_access_failed', 'Khong the mo camera va micro tren thiet bi nay.', error);
}

export function isLikelyGetUserMediaError(error) {
    if (error?.isMediaAccessError) {
        return true;
    }

    const errorName = error?.name || '';
    const lowerCaseMessage = String(error?.message || '').toLowerCase();

    return (
        MEDIA_ERROR_NAMES.has(errorName) ||
        lowerCaseMessage.includes('getusermedia') ||
        lowerCaseMessage.includes('camera') ||
        lowerCaseMessage.includes('micro') ||
        lowerCaseMessage.includes('microphone') ||
        lowerCaseMessage.includes('permission denied') ||
        lowerCaseMessage.includes('secure context') ||
        lowerCaseMessage.includes('device not found')
    );
}

export function getMediaErrorMessage(error, fallbackMessage) {
    if (!isLikelyGetUserMediaError(error)) {
        return fallbackMessage;
    }

    return normalizeGetUserMediaError(error)?.userMessage || fallbackMessage;
}