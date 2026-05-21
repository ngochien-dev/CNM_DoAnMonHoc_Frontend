import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { generateE2EEKeyPair, deriveSharedKey } from '../utils/crypto';

const useE2EE = (user, activeRoom) => {
    const [sharedE2EEKey, setSharedE2EEKey] = useState(null);

    // 1. Khởi tạo và đồng bộ Key Pair cho user đang đăng nhập
    useEffect(() => {
        if (!user?.username) return;

        const initUserE2EE = async () => {
            const storageKey = `e2ee_private_key_${user.username}`;
            let ownPrivateKeyJwk = localStorage.getItem(storageKey);

            if (!ownPrivateKeyJwk) {
                console.log("Generating E2EE key pair for", user.username);
                try {
                    const { publicKeyJwk, privateKeyJwk } = await generateE2EEKeyPair();
                    localStorage.setItem(storageKey, JSON.stringify(privateKeyJwk));
                    // Cập nhật Public Key lên Server
                    await api.post('/users/update-e2ee-key', {
                        username: user.username,
                        e2eePublicKey: publicKeyJwk
                    });
                    toast.success("Đã kích hoạt Mã hóa Đầu cuối (E2EE) thành công!");
                } catch (err) {
                    console.error("Failed to initialize E2EE keys:", err);
                }
            } else {
                // Nếu server mất Public Key, tự động khôi phục từ Private Key ở LocalStorage
                if (!user.e2eePublicKey) {
                    try {
                        const ownPrivKeyParsed = JSON.parse(ownPrivateKeyJwk);
                        const { d, ...publicKeyJwk } = ownPrivKeyParsed;
                        publicKeyJwk.key_ops = [];
                        await api.post('/users/update-e2ee-key', {
                            username: user.username,
                            e2eePublicKey: publicKeyJwk
                        });
                        console.log("Re-uploaded E2EE public key to server");
                    } catch (err) {
                        console.error("Failed to re-upload E2EE public key:", err);
                    }
                }
            }
        };

        initUserE2EE();
    }, [user?.username, user?.e2eePublicKey]);

    // 2. Tính toán Khóa chung (Shared Key) khi chuyển phòng chat (DM)
    useEffect(() => {
        if (!user?.username || !activeRoom || !activeRoom.id?.startsWith('dm_')) {
            setSharedE2EEKey(null);
            return;
        }

        const deriveKey = async () => {
            try {
                const peerUsername = activeRoom.name;
                const res = await api.get(`/users/${peerUsername}`);
                const peerPubKey = res.data.e2eePublicKey;

                if (peerPubKey) {
                    const storageKey = `e2ee_private_key_${user.username}`;
                    const ownPrivateKeyJwk = localStorage.getItem(storageKey);
                    if (ownPrivateKeyJwk) {
                        const sharedKey = await deriveSharedKey(JSON.parse(ownPrivateKeyJwk), peerPubKey);
                        setSharedE2EEKey(sharedKey);
                        console.log("Derived E2EE shared key with", peerUsername);
                    }
                } else {
                    setSharedE2EEKey(null);
                    console.log("Peer has no E2EE public key");
                }
            } catch (err) {
                console.error("Failed to derive shared E2EE key:", err);
                setSharedE2EEKey(null);
            }
        };

        deriveKey();
    }, [activeRoom, user?.username]);

    return sharedE2EEKey; // Chỉ cần trả ra khóa chung để ChatPage sử dụng mã hóa/giải mã
};

export default useE2EE;