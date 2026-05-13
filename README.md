# 🌐 OTT Project — Frontend Application & Component Documentation

Tài liệu này cung cấp chi tiết về kiến trúc giao diện, vai trò của từng thư mục, khối thành phần (Component) và hướng dẫn triển khai phía Frontend của nền tảng OTT.

---

## 🎨 Tổng quan Kiến trúc (Frontend Architecture)

Ứng dụng phía Client được xây dựng trên nền tảng **React.js** kết hợp với bộ công cụ đóng gói siêu tốc **Vite** và phong cách thiết kế giao diện hiện đại, linh hoạt sử dụng **Tailwind CSS**.

---

## 📂 Cấu trúc Thư mục Chi tiết (Directory Breakdown)

### `src/components/`
Thư mục lõi chứa toàn bộ các khối giao diện (UI Components) của ứng dụng, được tổ chức theo các phân hệ chức năng:

#### `auth/` (Xác thực & Tài khoản)
- **`AuthPage.jsx`**: Màn hình bọc toàn bộ luồng giao diện đăng ký, đăng nhập và xác thực.
- **`LoginPage.jsx`**: Form đăng nhập với cơ chế hiển thị lỗi rõ ràng.
- **`Register.jsx`**: Form đăng ký tài khoản mới hỗ trợ tải lên ảnh đại diện.
- **`OTPVerify.jsx`**: Form nhập và xác thực mã OTP khi người dùng quên mật khẩu.

#### `call/` (Cuộc gọi thoại & Video WebRTC)
- **`CallControls.jsx`**: Thanh công cụ điều khiển cuộc gọi (Tắt micro, Tắt camera, Chia sẻ màn hình, Kết thúc cuộc gọi).
- **`CallOverlay.jsx`**: Màn hình chính hiển thị luồng Video/Audio của các thành viên trong cuộc gọi.
- **`IncomingCallModal.jsx`**: Hộp thoại thông báo khi có cuộc gọi đến kèm chuông báo (Cho phép Nhận/Từ chối).
- **`OutgoingCallModal.jsx`**: Hộp thoại hiển thị trạng thái chờ khi đang gọi điện cho đối tác.

#### `chat/` (Hệ thống Nhắn tin)
- **`Home.jsx`**: Giao diện trung tâm chào mừng sau khi đăng nhập thành công.
- **`MessageSearch.jsx`**: Khối giao diện tìm kiếm nội dung tin nhắn trong phòng trò chuyện.
- **`RightSidebar.jsx`**: Thanh thông tin bên phải hiển thị chi tiết về nhóm hoặc hồ sơ người đang chat.
- **`RoomSidebar.jsx`**: Thanh danh sách các phòng/kênh chat con thuộc một Server nhóm.
- **`SearchBar.jsx`**: Thanh tìm kiếm chung ở khu vực trên cùng.
- **`SearchDropdown.jsx`**: Khối danh sách thả xuống hiển thị kết quả tìm kiếm theo thời gian thực.
- **`ServerSidebar.jsx`**: Thanh menu biểu tượng cực trái liệt kê các Server nhóm mà người dùng tham gia.
- **`Sidebar.jsx`**: Thanh bên trái quản lý danh sách bạn bè và các cuộc trò chuyện cá nhân gần đây.

#### `friends/` (Quản lý Bạn bè)
- **`FriendsTab.jsx`**: Giao diện chuyên dụng quản lý danh sách bạn bè, hiển thị trạng thái hoạt động (Online/Offline) và danh sách lời mời kết bạn chờ duyệt.

#### `function/` (Chức năng Mở rộng)
- **`CreateChat.jsx`**: Khối giao diện hỗ trợ khởi tạo cuộc trò chuyện 1-1 hoặc nhóm mới.

#### `modals/` (Hộp thoại Khám phá)
- **`GroupDiscovery.jsx`**: Màn hình giúp người dùng tìm kiếm và tham gia các nhóm cộng đồng công khai trên hệ thống.

#### `statistics/` (Bảng điều khiển Quản trị - Admin Dashboard)
- **`AdminStats.jsx`**: Bảng điều khiển trực quan cao cấp dành riêng cho Quản trị viên. Trang bị các thẻ số liệu động, biểu đồ theo dõi lưu lượng tin nhắn trong 7 ngày gần nhất (sử dụng `recharts`), thống kê tệp đính kèm và bảng quản lý người dùng cho phép **Khóa/Mở khóa** hoặc **Đặt lại mật khẩu** tức thời.

#### `user/` (Hồ sơ Người dùng)
- **`ChangePassword.jsx`**: Khối giao diện cập nhật mật khẩu mới.
- **`ProfileEdit.jsx`**: Form cho phép chỉnh sửa thông tin cá nhân (Tên hiển thị, Avatar).
- **`ProfileView.jsx`**: Thẻ hiển thị nhanh thông tin cá nhân.
- **`UserProfileModal.jsx`**: Hộp thoại xem thông tin chi tiết của một người dùng bất kỳ khi nhấp vào ảnh đại diện của họ trong đoạn chat.

#### Giao diện Cấp cao Gốc
- **`ChatPage.jsx`**: Khối giao diện gốc bọc toàn bộ luồng hoạt động sau khi đăng nhập. Quản lý kết nối Socket.IO toàn cục, lắng nghe các sự kiện thời gian thực (tin nhắn mới, trạng thái đang gõ, lời mời kết bạn) và đặc biệt là xử lý tín hiệu ngắt kết nối bắt buộc (`force_logout`).
- **`ChatbotWidget.jsx`**: Tiện ích dạng bong bóng nổi ở góc màn hình hỗ trợ người dùng trò chuyện nhanh với Trợ lý AI.

### `src/context/`
Quản lý trạng thái chia sẻ toàn cục (Global State) bằng React Context API.
- **`CallContext.jsx`**: Context chịu trách nhiệm quản lý vòng đời của một cuộc gọi thoại/video WebRTC (khởi tạo `RTCPeerConnection`, xử lý luồng MediaStream âm thanh/hình ảnh, truyền phát tín hiệu kết nối).
- **`callContextShared.js`** & **`useCall.js`**: Hook và các cấu hình chia sẻ trạng thái cuộc gọi.

### `src/hooks/`
Các Custom Hook chứa logic tái sử dụng.
- **`useWebRTC.js`**: Đóng gói các logic nghiệp vụ phức tạp để thiết lập kết nối P2P WebRTC mượt mà.

### `src/services/`
Giao tiếp với hệ thống Backend.
- **`api.js`**: Cấu hình đối tượng HTTP client bằng Axios, tự động đính kèm `Bearer Token` vào mọi truy vấn và xử lý lỗi xác thực (tự động đăng xuất khi token hết hạn).
- **`socket.js`**: Khởi tạo và chia sẻ phiên kết nối Socket.IO duy nhất phía Client.

### `src/utils/`
Các tiện ích hỗ trợ luồng Client.
- **`mediaError.js`**: Phân tích và đưa ra thông báo thân thiện cho các lỗi liên quan đến thiết bị phần cứng (Camera, Micro).

### `src/assets/`
Thư mục lưu trữ các hình ảnh tĩnh và tài nguyên đồ họa.

### Tệp cấu hình gốc
- **`App.jsx`** & **`main.jsx`**: Tệp gốc nạp các Provider và gắn cây giao diện React vào DOM.
- **`index.css`** & **`App.css`**: Định nghĩa phong cách CSS toàn cục và tích hợp các lớp tiện ích của Tailwind CSS.
- **`vite.config.js`**: Cấu hình công cụ đóng gói Vite và các plugin hỗ trợ tối ưu hóa hiệu suất.
- **`tailwind.config.js`** & **`postcss.config.js`**: Tệp cấu hình giao diện, quy định các mã màu và lớp thiết kế của Tailwind.

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
VITE_API_URL=http://localhost:5000
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
> - **Phản hồi Thời gian thực**: Tự động phát âm thanh thông báo và bật khung Pop-up (Toast) bắt mắt mỗi khi có tin nhắn mới, lời mời kết bạn hoặc cuộc gọi đến.
