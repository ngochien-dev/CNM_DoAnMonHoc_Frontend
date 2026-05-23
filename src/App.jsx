import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AuthPage from './components/auth/AuthPage';
import ChatPage from './components/ChatPage';
import JoinGroupPage from './components/chat/JoinGroupPage';
import { CallProvider } from './context/CallContext';
import { GroupCallProvider } from './context/GroupCallContext';
import IncomingGroupCallModal from './components/group-call/IncomingGroupCallModal';
import GroupCallOverlay from './components/group-call/GroupCallOverlay';

function normalizeUserSession(session) {
    if (!session) return null;
    return {
        ...session,
        id: session.id || session.userId || session.username,
    };
}

function App() {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user_session');
        try {
            return savedUser ? normalizeUserSession(JSON.parse(savedUser)) : null;
        } catch (error) {
            localStorage.removeItem('user_session');
            return null;
        }
    });

    const handleLogin = (session) => {
        setUser(normalizeUserSession(session));
    };

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
                {user ? (
                    <GroupCallProvider user={user}>
                        <Routes>
                            <Route path="/" element={<Navigate to="/chat" />} />
                            <Route path="/chat" element={<ChatPage user={user} setUser={setUser} />} />
                            <Route path="/join/:token" element={<JoinGroupPage user={user} />} />
                        </Routes>
                        <IncomingGroupCallModal />
                        <GroupCallOverlay />
                    </GroupCallProvider>
                ) : (
                    <Routes>
                        <Route path="/" element={<AuthPage onLogin={handleLogin} />} />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                )}
            </Router>
        </CallProvider>
    );
}

export default App;
