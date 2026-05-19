import React from 'react';
import { FaUserFriends, FaGlobe, FaSun, FaMoon, FaShieldAlt, FaPlusCircle, FaGamepad } from 'react-icons/fa';

const ServerSidebar = ({ 
    activeRoom, showFriendsTab, showDiscoveryTab, isAdminMode, user, 
    onNavigate, darkMode, setDarkMode, setShowGroupCreator 
}) => {
    return (
        <div className={`w-[72px] flex flex-col items-center py-3 space-y-4 shrink-0 shadow-inner z-20 ${darkMode ? 'bg-[#020617]' : 'bg-[#e3e5e8]'}`}>
            
            {/* Logo OTT / Home */}
            <div 
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black cursor-pointer hover:rounded-xl transition-all shadow-md ${(!activeRoom && !showFriendsTab && !showDiscoveryTab && !isAdminMode) ? 'bg-indigo-600 scale-110 shadow-indigo-500/50' : 'bg-gradient-to-tr from-indigo-500 to-purple-600 opacity-60 hover:opacity-100'}`} 
                onClick={() => onNavigate('home')}
            >
                OTT
            </div>

            {/* Friends Icon */}
            <div 
                onClick={() => onNavigate('friends')} 
                className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all relative ${showFriendsTab ? 'bg-[#5865f2] text-white shadow-lg' : 'bg-white/5 text-gray-500 hover:bg-[#5865f2] hover:text-white'}`}
            >
                <FaUserFriends size={22}/>
                {user.friendRequests?.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#1e1f22] font-black animate-bounce">
                        {user.friendRequests.length}
                    </span>
                )}
            </div>

            {/* Discovery Icon */}
            <div 
                onClick={() => onNavigate('discovery')} 
                className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all relative ${showDiscoveryTab ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white/5 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}
            >
                <FaGlobe size={22}/>
            </div>

            {/* Games Icon */}
            <div 
                onClick={() => onNavigate('games')} 
                className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all relative bg-white/5 text-pink-500 hover:bg-pink-500 hover:text-white`}
            >
                <FaGamepad size={24}/>
            </div>

            <div className="w-8 h-[2px] bg-gray-600 rounded-full opacity-20"></div>

            {/* Theme Toggle */}
            <div 
                onClick={() => { localStorage.setItem('theme', !darkMode ? 'dark' : 'light'); setDarkMode(!darkMode); }} 
                className="w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer bg-white/10 hover:bg-white/20 transition-all text-gray-400"
            >
                {darkMode ? <FaSun className="text-yellow-400"/> : <FaMoon/>}
            </div>

            {/* Admin Shield */}
            {user.role === 'admin' && (
                <div 
                    onClick={() => onNavigate('admin')} 
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all ${isAdminMode ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-red-500 shadow-lg'}`}
                >
                    <FaShieldAlt size={22} />
                </div>
            )}

            {/* Plus Icon */}
            <div onClick={() => setShowGroupCreator(true)} className="w-12 h-12 bg-[#23a559] text-white rounded-2xl flex items-center justify-center cursor-pointer hover:rounded-xl transition-all shadow-md group relative">
                <FaPlusCircle size={22}/>
            </div>
        </div>
    );
};

export default ServerSidebar;