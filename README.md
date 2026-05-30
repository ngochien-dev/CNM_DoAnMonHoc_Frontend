# 🌐 OTT Project — Frontend Architecture & Documentation

**Version**: 7.0 | **Last Updated**: 2026-05-24 | **Status**: Production-Ready

Tài liệu này cung cấp chi tiết về kiến trúc giao diện, chức năng của từng thư mục, khối thành phần (Component) và hướng dẫn triển khai phía Frontend của nền tảng OTT (One-to-One Messaging, Social & Video Call Platform).

---

Link sản phẩm: https://ngochien-ott.duckdns.org/chat

---

## 🎯 Tổng quan Kiến trúc (Overview)

Ứng dụng phía Client được xây dựng trên nền tảng **React.js** kết hợp với bộ công cụ đóng gói siêu tốc **Vite** và phong cách thiết kế giao diện hiện đại **Tailwind CSS**. Hệ thống hỗ trợ đa nền tảng, thiết kế Responsive, Dark/Light mode và mã hóa đầu cuối (E2EE).

**Tech Stack**: 
- **Core Framework**: React 19 + Vite
- **Styling**: Tailwind CSS + Framer Motion (Animations)
- **Real-time**: Socket.IO Client + WebRTC
- **State Management**: React Hooks + Context API
- **Data Visualization**: Recharts
- **Icons & Emoji**: React-Icons (Fi & Fa) + Emoji Picker React
- **Cloud/Backend Integration**: Firebase + Axios

---

## 📂 Cấu trúc Thư mục (Directory Structure)

Dưới đây là chi tiết vai trò của từng thư mục trong `src/components/`, được phân chia theo logic nghiệp vụ rõ ràng:

### 1. 🔐 `auth/` (Xác thực & Tài khoản)
Quản lý toàn bộ luồng đăng nhập, đăng ký và bảo mật.

| Component | Chức năng chính |
|-----------|----------------|
| **`AuthPage.jsx`** | Màn hình bọc toàn bộ luồng giao diện đăng ký, đăng nhập và xác thực. |
| **`LoginPage.jsx`** | Giao diện đăng nhập với cơ chế hiển thị lỗi rõ ràng. |
| **`Register.jsx`** | Giao diện đăng ký tài khoản mới hỗ trợ tải lên ảnh đại diện. |
| **`OTPVerify.jsx`** | Giao diện nhập và xác thực mã OTP qua Email khi quên mật khẩu. |

### 2. 💬 `chat/` (Hệ thống Nhắn tin Cốt lõi)
Nơi chứa các Component khổng lồ và quan trọng nhất của ứng dụng nhắn tin.

| Component | Chức năng chính |
|-----------|----------------|
| **`Home.jsx`** | Bảng điều khiển trung tâm (Dashboard) với phong cách Glassmorphism thanh lịch. |
| **`Sidebar.jsx`** & **`SidebarNav.jsx`** | Thanh điều hướng bên trái và thanh tính năng (Menu icons). |
| **`RightSidebar.jsx`** | Thanh thông tin bên phải (quản lý nhóm, tin nhắn tự hủy, ẩn cuộc trò chuyện). |
| **`MessageItem.jsx`** | Khối hiển thị tin nhắn đa định dạng (Text, Hình ảnh, Video, Tài liệu, Polls). |
| **`ChatInput.jsx`** | Khung soạn thảo tin nhắn, đính kèm file, chọn Emoji và thả Sticker. |
| **`MessageSearch.jsx`** & **`GlobalSearch.jsx`** | Công cụ tìm kiếm nội dung tin nhắn và tìm kiếm người dùng toàn cục. |
| **`E2EEDecryptor.jsx`** | Khối giao diện chuyên dụng để giải mã tin nhắn (Mã hóa đầu cuối). |
| **`LinkPreview.jsx`** | Khối preview hiển thị tiêu đề và ảnh thu nhỏ khi gửi một URL (Rich Link). |
| **`WaveformVoicePlayer.jsx`** | Trình phát tin nhắn thoại (Audio) dạng sóng âm thanh trực quan. |
| **`ThreadSidebar.jsx`**| Hỗ trợ tính năng trả lời tin nhắn rẽ nhánh (Thread) tương tự Slack. |
| **`CloudDriveTab.jsx`** | Tính năng lưu trữ đám mây cá nhân để lưu/tải tài liệu. |
| **`ArchivedChatsTab.jsx`**| Quản lý danh sách các phòng chat đã được Lưu trữ (Archived). |

### 3. 📞 `call/` & `group-call/` (WebRTC Calls)
Hệ thống gọi thoại và gọi hình ảnh ngang hàng P2P không độ trễ.

| Component | Chức năng chính |
|-----------|----------------|
| **`CallControls.jsx`** | Thanh công cụ điều khiển (Mở/Tắt Micro, Camera, Chia sẻ Màn hình - Screen Share). |
| **`CallOverlay.jsx`** | Giao diện hiển thị luồng Video/Audio của các thành viên. |
| **`IncomingCallModal.jsx`**| Hộp thoại thông báo khi có cuộc gọi đến kèm âm thanh chuông báo. |
| **`CallHistoryTab.jsx`**| Thẻ hiển thị lịch sử các cuộc gọi gần đây (Missed, Incoming, Outgoing, Thời lượng gọi). |

### 4. 🌟 `social/` (Mạng xã hội & Tương tác)
Hệ sinh thái Mạng xã hội thu nhỏ tương tự Zalo Nhật Ký / Facebook.

| Component | Chức năng chính |
|-----------|----------------|
| **`SocialFeed.jsx`** | Bảng tin (Timeline) hiển thị bài viết, thả cảm xúc, bình luận kèm ảnh tĩnh/động. |
| **`StoryBar.jsx`** | Thanh danh sách hiển thị các Story (tin 24h) ở đầu trang. |
| **`StoryViewer.jsx`** | Trình xem Story toàn màn hình hỗ trợ tự động nhảy sang story kế tiếp. |

### 5. 🤖 `function/`, `games/` & `todo/` (Tiện ích Mở rộng)
Các tính năng nâng cao giữ chân người dùng (Retention).

| Component | Chức năng chính |
|-----------|----------------|
| **`AIAssistantsTab.jsx`**| Quản lý danh sách các Bot trợ lý AI thông minh (Tích hợp Gemini). |
| **`InChatAIPanel.jsx`** | Tích hợp AI thẳng vào khung chat nhóm để hỗ trợ dịch thuật, phân tích. |
| **`GameCenter.jsx`** | Trung tâm Mini-games giải trí trực tiếp mà không cần rời ứng dụng. |
| **`TodoTab.jsx`** | Trình quản lý công việc (Todo List) có đánh dấu mức độ ưu tiên và hạn chót. |

### 6. 📊 `statistics/` & `user/` (Quản trị & Hồ sơ)
| Component | Chức năng chính |
|-----------|----------------|
| **`AdminStats.jsx`** | Dashboard Quản trị viên sử dụng `recharts` (Biểu đồ lưu lượng 7 ngày, Phân bổ data, Banning). |
| **`ProfileView.jsx`** | Giao diện hiển thị hồ sơ cá nhân và trạng thái hoạt động (Online/Offline/Last Seen). |
| **`ProfileEdit.jsx`** | Form cập nhật thông tin cá nhân (Tên, Bio, Avatar). |
| **`ChangePassword.jsx`**| Giao diện đổi mật khẩu an toàn. |

---

## 🧩 Context & Services (State Management)

Hệ thống quản lý trạng thái phân tán không dùng Redux mà dùng Context API siêu nhẹ.

| Thư mục | Tệp tin | Vai trò |
|---------|---------|---------|
| **`src/context/`** | `CallContext.jsx` | Quản lý vòng đời `RTCPeerConnection`, `MediaStream` (Camera/Mic) và luồng tín hiệu WebRTC. |
| **`src/services/`** | `api.js` | Cấu hình Axios, tự động chèn `Bearer Token`, tự động văng lỗi khi 401 Unauthorized. |
| **`src/services/`** | `socket.js` | Khởi tạo phiên kết nối Socket.IO duy nhất toàn cục (Singleton pattern) để tối ưu RAM. |
| **`src/services/`** | `offlineDB.js`| Cấu hình `IndexedDB` cho tính năng caching dữ liệu hoạt động ngoại tuyến. |

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy

### 1. Yêu cầu hệ thống
- **Node.js**: Phiên bản 18.x trở lên.
- **Trình duyệt**: Khuyến nghị Chrome, Edge, Safari bản mới nhất (Bắt buộc để hỗ trợ chuẩn WebRTC).

### 2. Cài đặt các gói phụ thuộc
Di chuyển vào thư mục frontend và tiến hành cài đặt:
```bash
cd CNM_DoAnMonHoc_Frontend
npm install
```

### 3. Cấu hình Biến môi trường
Tạo tệp `.env` tại thư mục gốc của `frontend` để trỏ tới API Backend. Hãy sao chép từ `.env.example`:
```env
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001

# Cấu hình Firebase (Nếu tích hợp tính năng Notification Push)
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx
```

### 4. Khởi chạy Ứng dụng
- **Chế độ Phát triển (Dev Mode kèm HMR)**:
```bash
npm run dev
```
Trình duyệt sẽ tự động chạy tại: `http://localhost:5173`

- **Đóng gói Sản phẩm (Build for Production)**:
```bash
npm run build
# Sau đó copy thư mục 'dist' vào server Nginx hoặc Apache.
```

---

## 💎 Điểm nhấn Trải nghiệm (UI/UX Highlights)

> [!TIP]
> - **Giao diện Tối/Sáng (Dark/Light Mode)**: Hỗ trợ chuyển đổi giao diện cực mượt mà, lưu trạng thái bằng LocalStorage.
> - **Đồ họa Trực quan Cao cấp**: Sử dụng bộ **Feather Icons** thanh lịch và **Glassmorphism** tạo cảm giác không gian đa chiều (3D).
> - **Real-time Feedback**: Hiển thị Toast mượt mà mỗi khi có tin nhắn tới và thanh tiến trình (Loading Skeleton) che giấu độ trễ của API.
> - **Bảo mật tối thượng (E2EE)**: Tích hợp hiệu ứng giải mã tin nhắn hiển thị trực quan cho người dùng về sự an toàn của dữ liệu.
> - **Rich Text & Waveform**: Cho phép bôi đậm, thả biểu tượng cảm xúc, và đặc biệt là phát âm thanh Voice Message với đồ thị hình sin đẹp mắt.
