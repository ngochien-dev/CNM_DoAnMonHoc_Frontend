import React, { useState, useRef, useEffect } from 'react';
import { FaRobot, FaTimes } from 'react-icons/fa';

const BLURPLE = '#5865F2';

const SYSTEM_PROMPT = `Bạn là Trợ lý Cộng đồng tự động của ứng dụng OTT Community.
Nhiệm vụ của bạn là giải đáp các câu hỏi thường gặp, hướng dẫn thao tác giao diện và cung cấp thông tin cộng đồng một cách nhanh chóng.

QUY ĐỊNH TRÌNH BÀY BẮT BUỘC:
- Chỉ trả lời bằng văn bản thuần túy (Plain Text).
- Tuyệt đối không sử dụng các ký tự Markdown như dấu sao (*), dấu thăng (#), dấu gạch dưới (_), hoặc các ký tự đặc biệt để trang trí.
- Không in đậm, không in nghiêng.
- Sử dụng xuống dòng để phân chia các ý rõ ràng.
- Với các hướng dẫn thao tác, hãy trình bày theo dạng Bước 1, Bước 2, Bước 3.

NỘI DUNG HỖ TRỢ CHÍNH:
1. Hướng dẫn thao tác: Chỉ dẫn vị trí các nút bấm như tạo kênh (dấu cộng), cài đặt (bánh răng), phân quyền hoặc đổi thông tin cá nhân.
2. Thông tin chung: Giải thích nội quy cộng đồng (văn minh, không spam) và các tính năng cơ bản của ứng dụng.
3. Phản hồi nhanh: Giải quyết các tình huống cơ bản người dùng hay gặp phải khi mới tham gia.

PHONG CÁCH PHỤC VỤ:
- Thân thiện, lịch sự và ngắn gọn.
- Luôn đi thẳng vào vấn đề người dùng hỏi.
- Nếu vấn đề nằm ngoài khả năng hoặc quá phức tạp, hãy trả lời: Hiện tại mình chưa có thông tin cụ thể về vấn đề này, bạn vui lòng liên hệ trực tiếp với Quản trị viên để được hỗ trợ tốt nhất nhé.`;

function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Xin chào! Tôi là Trợ lý Cộng đồng. Bạn cần hỗ trợ gì?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages((msgs) => [...msgs, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages,
            userMsg
          ]
        })
      });
      const data = await res.json();
      setMessages((msgs) => [...msgs, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages((msgs) => [...msgs, { role: 'assistant', content: 'Xin lỗi, có lỗi xảy ra.' }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
      {!open && (
        <button
          aria-label="Mở chatbot"
          onClick={() => setOpen(true)}
          style={{
            background: BLURPLE,
            border: 'none',
            borderRadius: '50%',
            width: 64,
            height: 64,
            boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s',
          }}
        >
          <FaRobot color="#fff" size={32} />
        </button>
      )}
      {open && (
        <div
          style={{
            width: 350,
            height: 480,
            background: '#23272A',
            borderRadius: 18,
            boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
            display: 'flex',
            flexDirection: 'column',
            animation: 'scaleIn 0.25s cubic-bezier(.4,2,.6,1)',
          }}
        >
          <div style={{
            background: BLURPLE,
            color: '#fff',
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontWeight: 600,
            fontSize: 18
          }}>
            Chatbot Hỗ Trợ
            <button
              aria-label="Đóng chatbot"
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
            >
              <FaTimes size={20} />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, background: '#2C2F33' }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: 12,
                  textAlign: msg.role === 'user' ? 'right' : 'left',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    background: msg.role === 'user' ? BLURPLE : '#23272A',
                    color: '#fff',
                    borderRadius: 12,
                    padding: '8px 14px',
                    maxWidth: '80%',
                    fontSize: 15,
                  }}
                >
                  {msg.content}
                </span>
              </div>
            ))}
            {loading && (
              <div style={{ marginBottom: 12, textAlign: 'left' }}>
                <span
                  style={{
                    display: 'inline-block',
                    background: '#23272A',
                    color: '#fff',
                    borderRadius: 12,
                    padding: '8px 14px',
                    fontSize: 15,
                  }}
                >
                  Đang suy nghĩ...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSend} style={{ display: 'flex', padding: 12, borderTop: '1px solid #36393F', background: '#23272A', borderBottomLeftRadius: 18, borderBottomRightRadius: 18 }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Nhập câu hỏi..."
              style={{
                flex: 1,
                border: 'none',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: 15,
                outline: 'none',
                background: '#2C2F33',
                color: '#fff',
                marginRight: 8
              }}
              disabled={loading}
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                background: BLURPLE,
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '0 18px',
                fontWeight: 600,
                fontSize: 15,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}
            >
              Gửi
            </button>
          </form>
        </div>
      )}
      <style>{`
        @keyframes scaleIn {
          0% { transform: scale(0.7); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default ChatbotWidget;