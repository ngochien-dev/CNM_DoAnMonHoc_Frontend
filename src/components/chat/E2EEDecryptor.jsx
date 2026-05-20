import React, { useState, useEffect } from 'react';
import { decryptText } from '../../utils/crypto';

const E2EEDecryptor = ({ msg, sharedKey, isMe, searchQuery }) => {
    const [decryptedText, setDecryptedText] = useState(msg.isEncrypted ? "[Đang giải mã E2EE...]" : (msg.text || ''));

    useEffect(() => {
        if (!msg.isEncrypted) {
            setDecryptedText(msg.text || '');
            return;
        }

        if (!sharedKey) {
            setDecryptedText("[Tin nhắn mã hóa E2EE - Đối phương chưa online để đồng bộ khóa]");
            return;
        }

        let isMounted = true;
        const decrypt = async () => {
            try {
                const plain = await decryptText(msg.text, msg.iv, sharedKey);
                if (isMounted) setDecryptedText(plain);
            } catch (err) {
                if (isMounted) setDecryptedText("[Lỗi giải mã E2EE - Khóa không hợp lệ]");
            }
        };

        decrypt();
        return () => { isMounted = false; };
    }, [msg.text, msg.iv, msg.isEncrypted, sharedKey]);

    const emojiMap = { ':)': '😊', ':D': '😃', ':(': '😢', ';)': '😉', ':P': '😛', '<3': '❤️', ':o': '😮', 'B)': '😎', ':*': '😘', 'xD': '🤣', 'XD': '🤣', ':3': '😺', 'o_O': '😳', '-_-': '😑' };
    const urlRegex = /((?:https?:\/\/|www\.)[^\s]+|[a-zA-Z0-9.-]+\.(?:com|net|org|vn|edu|gov|io)[^\s]*)/g;
    const parts = decryptedText.split(urlRegex);

    return (
        <>
            {parts.map((part, i) => {
                if (urlRegex.test(part)) {
                    urlRegex.lastIndex = 0;
                    return (
                        <a 
                            key={i} 
                            href={part} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className={`underline font-bold break-all ${isMe ? 'text-blue-200 hover:text-white' : 'text-indigo-400 hover:text-indigo-300'}`}
                        >
                            {part.length > 60 ? part.substring(0, 57) + '...' : part}
                        </a>
                    );
                }
                let converted = part;
                Object.entries(emojiMap).forEach(([code, emoji]) => {
                    converted = converted.split(code).join(emoji);
                });
                
                // Tag Mention formatting
                const mentionRegex = /(@[a-zA-Z0-9_]+)/g;
                const textParts = converted.split(mentionRegex);
                return (
                    <span key={i}>
                        {textParts.map((tPart, j) => {
                            if (mentionRegex.test(tPart)) {
                                mentionRegex.lastIndex = 0; // reset
                                return (
                                    <span 
                                        key={j} 
                                        className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-extrabold cursor-pointer hover:bg-indigo-500 hover:text-white transition-all shadow-sm mx-0.5"
                                        title={`Thành viên: ${tPart}`}
                                    >
                                        {tPart}
                                    </span>
                                );
                            }
                            
                            // Highlight text matching search query (glowing yellow highlight)
                            if (searchQuery && searchQuery.trim().length >= 2 && tPart.toLowerCase().includes(searchQuery.toLowerCase())) {
                                const highlightRegex = new RegExp(`(${searchQuery.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')})`, 'gi');
                                const subParts = tPart.split(highlightRegex);
                                return (
                                    <span key={j}>
                                        {subParts.map((subPart, k) => {
                                            if (highlightRegex.test(subPart)) {
                                                highlightRegex.lastIndex = 0;
                                                return <mark key={k} className="bg-yellow-350 dark:bg-yellow-400 text-black px-0.5 rounded font-black shadow-sm animate-pulse">{subPart}</mark>;
                                            }
                                            return subPart;
                                        })}
                                    </span>
                                );
                            }
                            return tPart;
                        })}
                    </span>
                );
            })}
        </>
    );
};

export default E2EEDecryptor;
