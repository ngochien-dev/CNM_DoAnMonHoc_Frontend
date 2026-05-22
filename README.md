# 🌐 OTT Project — Frontend Application & Architecture Documentation

**Version**: 7.0 | **Status**: Production-Ready

Tài liệu này cung cấp chi tiết về kiến trúc giao diện, chức năng của từng thư mục, khối thành phần (Component) và hướng dẫn triển khai phía Frontend của nền tảng OTT (One-to-One Messaging & Video Call Platform).

---

## 🎨 Tổng quan Kiến trúc (Frontend Architecture)

Ứng dụng phía Client được xây dựng trên nền tảng **React.js** kết hợp với bộ công cụ đóng gói siêu tốc **Vite** và phong cách thiết kế giao diện hiện đại, linh hoạt sử dụng **Tailwind CSS**. 
Hệ thống kết nối thời gian thực qua **Socket.IO** và xử lý gọi video/audio ngang hàng qua **WebRTC**.

**Tech Stack**: React 19 + Vite + Tailwind CSS + Socket.IO Client + Firebase + Recharts

---

## 📂 Cấu trúc Thư mục Chi tiết (Directory Breakdown)

### `src/components/`
Thư mục lõi chứa toàn bộ các khối giao diện (UI Components), tổ chức theo phân hệ chức năng:

#### 🔐 `auth/` (Xác thực & Tài khoản)
- **`AuthPage.jsx`**: Layout bọc luồng xác thực.
- **`LoginPage.jsx`**: Giao diện đăng nhập.
- **`Register.jsx`**: Giao diện đăng ký & tải avatar.
- **`OTPVerify.jsx`**: Xác thực mã OTP.

#### 📞 `call/` & `calls/` (Cuộc gọi thoại & Video)
- **`CallControls.jsx`**: Thanh công cụ điều khiển (Mic, Cam, Share Screen, End).
- **`CallOverlay.jsx`**: Giao diện chính hiển thị luồng Video/Audio.
- **`IncomingCallModal.jsx` / `OutgoingCallModal.jsx`**: Modal thông báo cuộc gọi đến/đi.

#### 💬 `chat/` (Hệ thống Nhắn tin)
- **`Home.jsx`**: Giao diện chính của ứng dụng.
- **`Sidebar.jsx` / `RightSidebar.jsx`**: Thanh điều hướng trái (bạn bè, chat gần đây) và thanh chi tiết phải.
- **`MessageSearch.jsx` / `SearchBar.jsx`**: Tìm kiếm tin nhắn và tìm kiếm toàn cục.

#### 👥 `friends/` (Quản lý Bạn bè)
- **`FriendsTab.jsx`**: Quản lý danh sách bạn bè, trạng thái Online/Offline, lời mời kết bạn.

#### 🌟 `social/` (Mạng xã hội - Posts & Stories)
- **`SocialFeed.jsx`**: Bảng tin hiển thị các bài viết, tương tác (Like, Comment).
- **`StoryBar.jsx` / `StoryViewer.jsx`**: Quản lý và hiển thị tin (Stories) tự hủy sau 24h.

#### 🎮 `games/` & `todo/` (Tiện ích Mở rộng)
- **`GameCenter.jsx`**: Trung tâm mini-games giải trí tích hợp ngay trong app.
- **`TodoTab.jsx`**: Quản lý công việc và ghi chú cá nhân.

#### 📊 `statistics/` (Admin Dashboard)
- **`AdminStats.jsx`**: Bảng điều khiển cho Quản trị viên (Thống kê biểu đồ bằng `recharts`, quản lý người dùng).

#### 👤 `user/` (Hồ sơ Người dùng)
- **`ProfileEdit.jsx` / `ProfileView.jsx`**: Xem và cập nhật thông tin cá nhân.
- **`ChangePassword.jsx`**: Thay đổi mật khẩu.

#### 🤖 Giao diện Cấp cao (Core Views)
- **`ChatPage.jsx`**: Layout gốc bọc toàn bộ luồng hoạt động sau khi đăng nhập, quản lý Socket.IO events (`force_logout`, tin nhắn mới,...).
- **`ChatbotWidget.jsx`**: Tiện ích AI Chatbot nổi ở góc màn hình.

### `src/context/` & `src/hooks/`
- **`CallContext.jsx` / `useWebRTC.js`**: Quản lý state luồng gọi Video/Audio P2P, kết nối tín hiệu qua WebRTC.

### `src/services/`
- **`api.js`**: Cấu hình Axios chặn token, tự động gắn header.
- **`socket.js`**: Khởi tạo kết nối Socket.IO duy nhất toàn cục.

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy

### 1. Yêu cầu hệ thống
- **Node.js**: Phiên bản 18.x trở lên.

### 2. Cài đặt các gói phụ thuộc
```bash
cd frontend
npm install
```

### 3. Cấu hình Biến môi trường
Tạo tệp `.env` tại thư mục gốc của `frontend`:
```env
VITE_API_URL=http://localhost:3001
# Bổ sung các cấu hình API Keys (Firebase) nếu có
```

### 4. Khởi chạy Ứng dụng
- **Chế độ Phát triển (HMR)**:
```bash
npm run dev
```
Trình duyệt sẽ tự động chạy tại: `http://localhost:5173`

- **Đóng gói Sản phẩm**:
```bash
npm run build
```

---

## 💎 Điểm nhấn Trải nghiệm (UI/UX Highlights)

> [!TIP]
> - **Giao diện Tối/Sáng (Dark/Light Mode)**: Hỗ trợ chuyển đổi mượt mà.
> - **Đồ họa Trực quan Cao cấp**: Sự kết hợp giữa `recharts`, `react-icons` mang lại một thiết kế đẳng cấp.
> - **Phản hồi Thời gian thực**: Tự động thông báo (Toast) mỗi khi có tin nhắn, lời mời kết bạn hoặc cuộc gọi đến.
> - **Tích hợp Đa Tiện ích**: Không chỉ nhắn tin, app có cả mạng xã hội (Stories, Posts), GameCenter và AI Chatbot.
