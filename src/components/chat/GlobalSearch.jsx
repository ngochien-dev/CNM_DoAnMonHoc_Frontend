import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  FaSearch, FaTimes, FaUser, FaUsers, FaCommentDots, FaChevronRight
} from 'react-icons/fa';

const GlobalSearch = ({ darkMode, onClose, onSelectResult }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ users: [], groups: [], messages: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.length >= 2) {
        handleSearch();
      } else {
        setResults({ users: [], groups: [], messages: [] });
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/search/global?q=${query}`);
      setResults(res.data);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const textClass = darkMode ? 'text-white' : 'text-slate-800';
  const secondaryTextClass = darkMode ? 'text-gray-400' : 'text-slate-500';
  const inputBgClass = darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200 text-slate-800 shadow-sm';

  return (
    <div className={`w-full max-w-md border-l h-full flex flex-col animate-in slide-in-from-right ${darkMode ? 'border-white/10 bg-[#020617]' : 'border-gray-200 bg-white'}`}>
      <div className={`p-4 border-b flex items-center justify-between shrink-0 ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
        <h2 className={`text-sm font-black uppercase tracking-widest ${textClass}`}>
          <FaSearch className="inline mr-2" />
          Tìm Kiếm Toàn Cầu
        </h2>
        <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-200'}`}>
          <FaTimes className={`text-lg ${textClass}`} />
        </button>
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto scrollbar-hide">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${inputBgClass} focus-within:border-indigo-500`}>
          <FaSearch className={`${secondaryTextClass} text-sm`} />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm người, nhóm hoặc tin nhắn..."
            className={`flex-1 bg-transparent outline-none text-sm placeholder:${secondaryTextClass}`}
          />
          {loading && <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>}
        </div>

        {query.length < 2 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
            <FaSearch size={40} className="mb-4 text-indigo-500" />
            <p className="text-sm font-bold">Nhập ít nhất 2 ký tự</p>
          </div>
        ) : (
          <div className="space-y-6 pb-20">
            {/* Users Section */}
            {results.users.length > 0 && (
              <section>
                <h3 className={`text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                  <FaUser size={10}/> Người dùng
                </h3>
                <div className="space-y-2">
                  {results.users.map(u => (
                    <div key={u.username} onClick={() => onSelectResult({ type: 'user', data: u })} className={`p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all ${darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-50 hover:bg-slate-100'}`}>
                      <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold overflow-hidden">
                        {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : u.username[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${textClass}`}>{u.displayName || u.username}</p>
                        <p className={`text-xs ${secondaryTextClass}`}>@{u.username}</p>
                      </div>
                      <FaChevronRight size={12} className="opacity-30" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Groups Section */}
            {results.groups.length > 0 && (
              <section>
                <h3 className={`text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                  <FaUsers size={10}/> Nhóm
                </h3>
                <div className="space-y-2">
                  {results.groups.map(g => (
                    <div key={g.groupId} onClick={() => onSelectResult({ type: 'group', data: g })} className={`p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all ${darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-50 hover:bg-slate-100'}`}>
                      <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold">
                        {g.groupName[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${textClass}`}>{g.groupName}</p>
                        <p className={`text-xs ${secondaryTextClass}`}>{g.isPublic ? 'Nhóm công khai' : 'Nhóm riêng tư'}</p>
                      </div>
                      <FaChevronRight size={12} className="opacity-30" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Messages Section */}
            {results.messages.length > 0 && (
              <section>
                <h3 className={`text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                  <FaCommentDots size={10}/> Tin nhắn
                </h3>
                <div className="space-y-2">
                  {results.messages.map(m => (
                    <div key={m.messageId} onClick={() => onSelectResult({ type: 'message', data: m })} className={`p-3 rounded-xl cursor-pointer transition-all ${darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-50 hover:bg-slate-100'}`}>
                      <div className="flex justify-between mb-1">
                        <span className={`text-[10px] font-black uppercase text-indigo-500`}>@{m.senderUsername}</span>
                        <span className={`text-[9px] ${secondaryTextClass}`}>{new Date(m.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className={`text-xs line-clamp-2 ${textClass}`}>{m.text}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {!loading && results.users.length === 0 && results.groups.length === 0 && results.messages.length === 0 && (
              <div className="text-center py-10 opacity-50">
                <p className="text-sm">Không tìm thấy kết quả nào cho "{query}"</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalSearch;
