import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AuthPage from './components/auth/AuthPage';
import ChatPage from './components/ChatPage';
import { CallProvider } from './context/CallContext';



//VITE_API_URL=http://localhost:3001
//VITE_SOCKET_URL=http://localhost:3001

function App() {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user_session');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    useEffect(() => {
        if (user) {
            localStorage.setItem('user_session', JSON.stringify(user));
        } else {
            localStorage.removeItem('user_session');
        }
    }, [user]);

    return (
        <CallProvider user={user}>
            <Router>
                <Routes>
                    <Route path="/" element={!user ? <AuthPage onLogin={setUser} /> : <Navigate to="/chat" />} />
                    <Route path="/chat" element={user ? <ChatPage user={user} setUser={setUser} /> : <Navigate to="/" />} />
                </Routes>
            </Router>
        </CallProvider>
    );
}

export default App;
