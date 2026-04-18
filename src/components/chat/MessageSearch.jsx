import React, { useState } from 'react';
import axios from 'axios';
import {
  FaSearch, FaTimes, FaCalendarAlt, FaPaperclip,
  FaLink, FaChevronDown
} from 'react-icons/fa';

const MessageSearch = ({ darkMode, messages, activeRoom, user, onClose }) => {
  const [searchContent, setSearchContent] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, file, link
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = () => {
    if (!searchContent.trim() && filterType === 'all') {
      setSearchResults([]);
      return;
    }

    // Filter tin nhắn từ active room hoặc tất cả nếu không có active room
    let filtered = messages.filter(msg => {
      const messageRoom = msg.roomId || 'chung';
      const targetRoom = activeRoom?.id || 'chung';
      
      if (messageRoom !== targetRoom) return false;

      // Filter theo nội dung
      if (searchContent && !msg.text?.toLowerCase().includes(searchContent.toLowerCase())) {
        return false;
      }

      // Filter theo người gửi
      if (filterUser && msg.senderUsername !== filterUser) {
        return false;
      }

      // Filter theo ngày
      if (filterDate) {
        const msgDate = new Date(msg.sentAt || msg.time).toLocaleDateString('vi-VN');
        const filterDateObj = new Date(filterDate).toLocaleDateString('vi-VN');
        if (msgDate !== filterDateObj) return false;
      }

      // Filter theo loại (file, link, hoặc all)
      if (filterType === 'file' && !msg.fileData) {
        return false;
      }

      if (filterType === 'link' && (!msg.text?.includes('http://') && !msg.text?.includes('https://'))) {
        return false;
      }

      return true;
    });

    setSearchResults(filtered);
  };

  // Auto search when filters change
  React.useEffect(() => {
    handleSearch();
  }, [searchContent, filterUser, filterDate, filterType]);

  // Get unique senders from current room
  const uniqueSenders = [...new Set(messages
    .filter(m => (m.roomId || 'chung') === (activeRoom?.id || 'chung'))
    .map(m => m.senderUsername))];

  const bgClass = darkMode ? 'bg-discord-darker border-white/10' : 'bg-white border-gray-200';
  const textClass = darkMode ? 'text-white' : 'text-gray-900';
  const inputBgClass = darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-300 text-gray-900';
  const secondaryTextClass = darkMode ? 'text-gray-400' : 'text-gray-600';

  return (
    <div className={`w-full max-w-sm border-l ${darkMode ? 'border-white/10 bg-discord-darker' : 'border-gray-200 bg-white'} h-full flex flex-col animate-in slide-in-from-right`}>
      {/* Header */}
      <div className={`p-4 border-b ${darkMode ? 'border-white/10' : 'border-gray-200'} flex items-center justify-between shrink-0`}>
        <h2 className={`text-sm font-black uppercase tracking-widest ${textClass}`}>
          <FaSearch className="inline mr-2" />
          Tìm Kiếm
        </h2>
        <button
          onClick={onClose}
          className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-200'}`}
        >
          <FaTimes className={`text-lg ${textClass}`} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {/* Search Input */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${inputBgClass} focus-within:border-indigo-500`}>
          <FaSearch className={`${secondaryTextClass} text-sm`} />
          <input
            type="text"
            value={searchContent}
            onChange={(e) => setSearchContent(e.target.value)}
            placeholder="Nhập từ khóa để tìm kiếm"
            className={`flex-1 bg-transparent outline-none text-sm placeholder:${secondaryTextClass}`}
          />
        </div>

        {/* Filters - Vertical Layout */}
        <div className="space-y-3 pb-4 border-b ${darkMode ? 'border-white/10' : 'border-gray-200'}">
          <p className={`text-xs font-bold uppercase tracking-wider ${secondaryTextClass}`}>
            Lọc Theo:
          </p>

          {/* Filter by User */}
          <div className="relative">
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} text-sm font-semibold appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            >
              <option value="">👤 Người Gửi</option>
              {uniqueSenders.map(sender => (
                <option key={sender} value={sender}>@{sender}</option>
              ))}
            </select>
            <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Filter by Date */}
          <div>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            />
          </div>

          {/* Filter by Type */}
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${inputBgClass} text-sm font-semibold appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            >
              <option value="all">📄 Loại</option>
              <option value="file">📎 Có File</option>
              <option value="link">🔗 Có Link</option>
            </select>
            <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Results */}
        {searchResults.length > 0 ? (
          <div className="space-y-3">
            <p className={`text-sm font-bold ${secondaryTextClass}`}>
              Tìm Thấy <span className={`${darkMode ? 'text-indigo-400' : 'text-indigo-600'} font-black`}>{searchResults.length}</span> kết quả
            </p>
            <div className="space-y-3">
              {searchResults.map((result, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${darkMode ? 'bg-white/5 border-white/5 hover:border-indigo-500/50 hover:bg-white/10' : 'bg-gray-50 border-gray-200 hover:border-indigo-500 hover:bg-gray-100'}`}
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm shrink-0">
                      {result.senderUsername[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        @{result.senderUsername}
                      </p>
                      <p className={`text-xs ${secondaryTextClass}`}>
                        {new Date(result.sentAt || result.time).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  </div>
                  <p className={`text-sm ${textClass} break-words mb-2 line-clamp-3`}>
                    {result.text}
                  </p>
                  {(result.fileData || result.text?.includes('http://') || result.text?.includes('https://')) && (
                    <div className="flex gap-2">
                      {result.fileData && (
                        <div className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 ${darkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700'}`}>
                          <FaPaperclip size={10} /> File
                        </div>
                      )}
                      {result.text?.includes('http://') || result.text?.includes('https://') ? (
                        <div className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 ${darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                          <FaLink size={10} /> Link
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-500/20 flex items-center justify-center mb-4">
              <FaSearch className={`text-3xl ${secondaryTextClass}`} />
            </div>
            <p className={`text-sm font-medium ${secondaryTextClass}`}>
              Không có kết quả tìm kiếm
            </p>
            <p className={`text-xs ${secondaryTextClass} mt-1`}>
              Nhập từ khóa và chọn bộ lọc để tìm kiếm
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageSearch;