// Web Crypto API E2EE Helpers using ECDH and AES-GCM

// Generate ECDH Key Pair (P-256 Curve)
export async function generateE2EEKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true,
    ["deriveKey", "deriveBits"]
  );

  const publicKeyJwk = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const privateKeyJwk = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);

  return { publicKeyJwk, privateKeyJwk };
}

// Convert JWK to Key Object for Private Key
export async function importPrivateKey(privateKeyJwk) {
  return await window.crypto.subtle.importKey(
    "jwk",
    privateKeyJwk,
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true,
    ["deriveKey", "deriveBits"]
  );
}

// Convert JWK to Key Object for Public Key
export async function importPublicKey(publicKeyJwk) {
  return await window.crypto.subtle.importKey(
    "jwk",
    publicKeyJwk,
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true,
    []
  );
}

// Derive Shared AES-GCM 256 key from own Private Key and peer Public Key
export async function deriveSharedKey(ownPrivateKeyJwk, peerPublicKeyJwk) {
  const ownPrivKey = await importPrivateKey(ownPrivateKeyJwk);
  const peerPubKey = await importPublicKey(peerPublicKeyJwk);

  return await window.crypto.subtle.deriveKey(
    {
      name: "ECDH",
      public: peerPubKey,
    },
    ownPrivKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

// Encrypt plaintext with AES-GCM
export async function encryptText(plaintext, sharedKey) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    sharedKey,
    encoded
  );

  // Convert buffer to Base64 strings for transfer
  const ciphertextBase64 = btoa(String.fromCharCode(...new Uint8Array(ciphertextBuffer)));
  const ivBase64 = btoa(String.fromCharCode(...iv));

  return {
    ciphertext: ciphertextBase64,
    iv: ivBase64,
  };
}

// Decrypt ciphertext with AES-GCM
export async function decryptText(ciphertextBase64, ivBase64, sharedKey) {
  try {
    const ciphertextBytes = new Uint8Array(
      atob(ciphertextBase64)
        .split("")
        .map((c) => c.charCodeAt(0))
    );
    const ivBytes = new Uint8Array(
      atob(ivBase64)
        .split("")
        .map((c) => c.charCodeAt(0))
    );

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: ivBytes,
      },
      sharedKey,
      ciphertextBytes
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (err) {
    console.error("E2EE Decryption failed:", err);
    return "[Lỗi giải mã E2EE - Khóa bí mật không khớp hoặc bị hỏng]";
  }
}
