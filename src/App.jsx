// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AuthPage from './components/auth/AuthPage'; 
import ChatPage from './components/ChatPage';

function App() {
  // Khởi tạo user từ localStorage nếu có
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user_session');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Mỗi khi user thay đổi, cập nhật vào localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('user_session', JSON.stringify(user));
    } else {
      localStorage.removeItem('user_session');
    }
  }, [user]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={!user ? <AuthPage onLogin={setUser} /> : <Navigate to="/chat" />} />
        {/* Truyền thêm setUser vào ChatPage để làm tính năng Logout */}
        <Route path="/chat" element={user ? <ChatPage user={user} setUser={setUser} /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;