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
Thư mục lõi chứa toàn bộ các khối giao diện (UI Components) của ứng dụng, được tổ chức theo các phân hệ chức năng:

#### 🔐 `auth/` (Xác thực & Tài khoản)
- **`AuthPage.jsx`**: Màn hình bọc toàn bộ luồng giao diện đăng ký, đăng nhập và xác thực.
- **`LoginPage.jsx`**: Giao diện đăng nhập với cơ chế hiển thị lỗi rõ ràng.
- **`Register.jsx`**: Giao diện đăng ký tài khoản mới hỗ trợ tải lên ảnh đại diện.
- **`OTPVerify.jsx`**: Giao diện nhập và xác thực mã OTP khi người dùng quên mật khẩu.

#### 📞 `call/` & `calls/` (Cuộc gọi thoại & Video WebRTC)
- **`CallControls.jsx`**: Thanh công cụ điều khiển cuộc gọi (Tắt micro, Tắt camera, Chia sẻ màn hình, Kết thúc cuộc gọi).
- **`CallOverlay.jsx`**: Giao diện hiển thị luồng Video/Audio của các thành viên trong cuộc gọi.
- **`IncomingCallModal.jsx` / `OutgoingCallModal.jsx`**: Hộp thoại thông báo khi có cuộc gọi đến/đi kèm chuông báo (Cho phép Nhận/Từ chối hoặc hiển thị trạng thái chờ).
- **`CallHistoryTab.jsx`**: Thẻ hiển thị lịch sử các cuộc gọi thoại/video gần đây.

#### 💬 `chat/` (Hệ thống Nhắn tin)
- **`Home.jsx`**: Giao diện trung tâm chào mừng sau khi đăng nhập thành công.
- **`Sidebar.jsx`**: Thanh bên trái quản lý danh sách bạn bè và các cuộc trò chuyện cá nhân gần đây.
- **`RightSidebar.jsx`**: Thanh thông tin bên phải hiển thị chi tiết về nhóm hoặc hồ sơ người đang chat, cùng các thiết lập tin nhắn tự hủy.
- **`RoomSidebar.jsx`**: Thanh danh sách các phòng/kênh chat con thuộc một Server nhóm.
- **`SearchBar.jsx`**: Thanh tìm kiếm chung ở khu vực trên cùng.
- **`MessageSearch.jsx`**: Khối giao diện tìm kiếm nội dung tin nhắn trong phòng trò chuyện.
- **`SearchDropdown.jsx`**: Khối danh sách thả xuống hiển thị kết quả tìm kiếm theo thời gian thực.
- **`ServerSidebar.jsx`**: Thanh menu biểu tượng cực trái liệt kê các Server nhóm mà người dùng tham gia.
- **`ArchivedChatsTab.jsx`**: Quản lý danh sách các phòng chat đã được lưu trữ (archived).
- **`CloudDriveTab.jsx`**: Tính năng lưu trữ đám mây cá nhân để lưu và tải tài liệu/phương tiện.

#### 👥 `friends/` (Quản lý Bạn bè)
- **`FriendsTab.jsx`**: Giao diện chuyên dụng quản lý danh sách bạn bè, hiển thị trạng thái hoạt động (Online/Offline) và danh sách lời mời kết bạn chờ duyệt, kết hợp hiển thị lịch sử cuộc gọi gần đây.

#### 🌟 `social/` (Mạng xã hội - Posts & Stories)
- **`SocialFeed.jsx`**: Bảng tin hiển thị các bài viết từ bạn bè/cộng đồng, hỗ trợ tương tác cảm xúc (Like), bình luận (Comment kèm ảnh), và hiển thị hình ảnh phóng to qua Lightbox.
- **`StoryBar.jsx` / `StoryViewer.jsx`**: Thanh danh sách và trình xem tin nhắn hình ảnh tự hủy (Stories) trong vòng 24h.

#### 🎮 `games/` & `todo/` (Tiện ích Mở rộng)
- **`GameCenter.jsx`**: Trung tâm chứa các trò chơi nhỏ (Mini-games) giải trí tích hợp trực tiếp trên nền tảng.
- **`TodoTab.jsx`**: Trình quản lý công việc (Todo List) và ghi chú cá nhân của người dùng với các tùy chọn phân loại, mức độ ưu tiên và hạn chót.

#### 📊 `statistics/` (Bảng điều khiển Quản trị - Admin Dashboard)
- **`AdminStats.jsx`**: Bảng điều khiển trực quan cao cấp dành riêng cho Quản trị viên. Trang bị các thẻ số liệu động, biểu đồ theo dõi lưu lượng tin nhắn (sử dụng `recharts`), quản lý người dùng (Khóa/Mở khóa, reset mật khẩu) và kiểm duyệt tin nhắn bị báo cáo (Dismiss, Delete, Ban).

#### 👤 `user/` (Hồ sơ Người dùng)
- **`ProfileView.jsx` / `ProfileEdit.jsx`**: Xem và cập nhật thông tin cá nhân (Tên hiển thị, điện thoại, bio, địa chỉ, ảnh đại diện).
- **`ChangePassword.jsx`**: Khối giao diện cập nhật mật khẩu mới.
- **`UserProfileModal.jsx`**: Hộp thoại/Trang xem thông tin chi tiết của người dùng khác kèm quản lý phiên đăng nhập và cài đặt bảo mật 2 lớp (2FA).

#### 🤖 Giao diện Cấp cao (Core Views)
- **`ChatPage.jsx`**: Giao diện gốc bọc toàn bộ luồng hoạt động sau khi đăng nhập. Quản lý kết nối Socket.IO toàn cục, lắng nghe các sự kiện thời gian thực (tin nhắn mới, trạng thái đang gõ, lời mời kết bạn) và đặc biệt là xử lý tín hiệu ngắt kết nối bắt buộc (`force_logout`).
- **`ChatbotWidget.jsx`**: Tiện ích dạng bong bóng nổi ở góc màn hình hỗ trợ người dùng trò chuyện nhanh với Trợ lý AI.

### `src/context/` & `src/hooks/`
- **`CallContext.jsx` / `useWebRTC.js`**: Context và Hook chịu trách nhiệm quản lý vòng đời của một cuộc gọi thoại/video WebRTC (khởi tạo `RTCPeerConnection`, xử lý luồng MediaStream âm thanh/hình ảnh, truyền phát tín hiệu kết nối).
- **`callContextShared.js`** & **`useCall.js`**: Hook và các cấu hình chia sẻ trạng thái cuộc gọi.

### `src/services/`
- **`api.js`**: Cấu hình đối tượng HTTP client bằng Axios, tự động đính kèm `Bearer Token` vào mọi truy vấn và xử lý lỗi xác thực (tự động đăng xuất khi token hết hạn).
- **`socket.js`**: Khởi tạo và chia sẻ phiên kết nối Socket.IO duy nhất toàn cục.
- **`offlineDB.js`**: Cấu hình cơ sở dữ liệu IndexedDB cho việc hoạt động và đồng bộ offline.

### `src/utils/`
- **`mediaError.js`**: Phân tích và đưa ra thông báo thân thiện cho các lỗi liên quan đến thiết bị phần cứng (Camera, Micro).

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy

### 1. Yêu cầu hệ thống
- **Node.js**: Phiên bản 18.x trở lên.

### 2. Cài đặt các gói phụ thuộc
Di chuyển vào thư mục frontend và tiến hành cài đặt:
```bash
cd frontend
npm install
```

### 3. Cấu hình Biến môi trường
Tạo tệp `.env` tại thư mục gốc của `frontend` để trỏ tới API Backend:
```env
VITE_API_URL=http://localhost:3001
# Bổ sung các cấu hình API Keys (Firebase) nếu có
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
```

---

## 💎 Điểm nhấn Trải nghiệm (UI/UX Highlights)

> [!TIP]
> - **Giao diện Tối/Sáng (Dark/Light Mode)**: Hỗ trợ chuyển đổi giao diện mượt mà, bảo vệ mắt người dùng.
> - **Đồ họa Trực quan Cao cấp**: Sự kết hợp giữa `recharts` cho thống kê và thư viện biểu tượng phong phú `react-icons` mang lại một thiết kế đẳng cấp, chuyên nghiệp.
> - **Phản hồi Thời gian thực**: Tự động thông báo (Toast) mỗi khi có tin nhắn, lời mời kết bạn hoặc cuộc gọi đến.
> - **Tích hợp Đa Tiện ích**: Không chỉ nhắn tin, app tích hợp cả mạng xã hội (Stories, Posts), GameCenter, TodoTab, và AI Chatbot mang lại trải nghiệm toàn diện.
