import React, { useState, useEffect, useMemo } from "react";
import {
  FaUserFriends, FaUserCheck, FaCommentDots, FaCircle, FaUserPlus,
  FaGhost, FaUserShield, FaSearch, FaTimes, FaSortAlphaDown,
  FaSortAlphaUp, FaTags, FaPaperPlane, FaUserTag, FaSave,
  FaTrashAlt, FaEdit, FaCheck, FaUserMinus, FaVideo,
} from "react-icons/fa";
import api from "../../services/api";

const FriendsTab = ({
  user,
  friends,
  friendRequests,
  loadData,
  onlineUsers,
  handleStartDM,
  handleOpenProfile,
  startCall,
  isCallBusy,
  darkMode,
}) => {
  // --- 1. STATES ---
  const [globalSearch, setGlobalSearch] = useState("");
  const [globalResults, setGlobalResults] = useState([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);

  const [localSearch, setLocalSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedTag, setSelectedTag] = useState("All");

  const [availableTags, setAvailableTags] = useState(user.availableTags || ["All", "Gia đình", "Công việc"]);
  const [tagInput, setTagInput] = useState("");
  const [friendTags, setFriendTags] = useState(user.friendTags || {});

  const [editingTag, setEditingTag] = useState(null);
  const [detailsCache, setDetailsCache] = useState({});

  // --- 2. ĐỒNG BỘ DỮ LIỆU ---
  useEffect(() => {
    if (user.availableTags) setAvailableTags(user.availableTags);
    if (user.friendTags) setFriendTags(user.friendTags);
  }, [user]);

  useEffect(() => {
    const fetchMissing = async () => {
      const needs = [...(user.sentRequests || []), ...(friendRequests || [])];
      const missing = needs.filter((u) => !detailsCache[u] && !onlineUsers[u]);
      if (missing.length === 0) return;
      const newCache = { ...detailsCache };
      for (const uname of missing) {
        try {
          const res = await api.get(`/users/${uname}`);
          if (res.data) newCache[uname] = res.data;
        } catch (e) {}
      }
      setDetailsCache(newCache);
    };
    fetchMissing();
  }, [user.sentRequests, friendRequests]);

  // --- 3. LOGIC TÌM KIẾM ĐÍCH DANH & KẾT BẠN ---
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      const q = globalSearch.trim();
      if (q.length < 2) {
        setGlobalResults([]);
        return;
      }
      setIsSearchingGlobal(true);
      try {
        const res = await api.get(`/users/${q}`);
        if (res.data && res.data.username) {
          setGlobalResults([res.data]);
        } else {
          setGlobalResults([]);
        }
      } catch (err) {
        setGlobalResults([]);
      } finally {
        setIsSearchingGlobal(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [globalSearch]);

  const sendFriendRequest = async (targetUname) => {
    try {
      await api.post("/friends/request", {
        fromUser: user.username, 
        toUser: targetUname
      });
      alert("Đã gửi lời mời kết bạn!");
      setGlobalSearch("");
      setGlobalResults([]);
      loadData();
    } catch (err) {
      alert("Lỗi kết bạn!");
    }
  };

  // --- 4. LOGIC NGHIỆP VỤ ---
  const syncWithAWS = async (newTags, newAssigned) => {
    try {
      await api.post("/users/sync-tags", {
        username: user.username, availableTags: newTags, friendTags: newAssigned,
      });
      loadData();
    } catch (err) { console.error(err); }
  };

  const handleSaveTag = () => {
    if (!tagInput.trim() || tagInput === "All") return;
    let newTags = [...availableTags];
    let newFriendTags = { ...friendTags };
    if (editingTag) {
      newTags = newTags.map((t) => (t === editingTag ? tagInput.trim() : t));
      Object.keys(newFriendTags).forEach((un) => { if (newFriendTags[un] === editingTag) newFriendTags[un] = tagInput.trim(); });
      setEditingTag(null);
    } else {
      if (availableTags.includes(tagInput.trim())) return alert("Thẻ đã tồn tại!");
      newTags.push(tagInput.trim());
    }
    setAvailableTags(newTags); setFriendTags(newFriendTags); setTagInput("");
    syncWithAWS(newTags, newFriendTags);
  };

  const deleteTag = (tagName) => {
    if (tagName === "All") return;
    if (!window.confirm(`Xóa thẻ "${tagName}"?`)) return;
    const newTags = availableTags.filter((t) => t !== tagName);
    const newFriendTags = { ...friendTags };
    Object.keys(newFriendTags).forEach((un) => { if (newFriendTags[un] === tagName) delete newFriendTags[un]; });
    if (selectedTag === tagName) setSelectedTag("All");
    setAvailableTags(newTags); setFriendTags(newFriendTags);
    syncWithAWS(newTags, newFriendTags);
  };

  const assignTag = (fName, tagName) => {
    const newAssigned = { ...friendTags, [fName]: tagName };
    if (tagName === null) delete newAssigned[fName];
    setFriendTags(newAssigned); syncWithAWS(availableTags, newAssigned);
  };

  const acceptFriend = async (friendUname) => {
    try {
      await api.post("/friends/accept", { me: user.username, friendUname });
      loadData();
    } catch (err) { alert("Lỗi!"); }
  };

  const rejectFriend = async (friendUname) => {
    try {
      await api.post("/friends/reject", { me: user.username, friendUname });
      loadData();
    } catch (err) { alert("Lỗi!"); }
  };

  const processedFriends = useMemo(() => {
    let result = (friends || []).map((fName) => {
      const uname = typeof fName === 'string' ? fName : fName.S;
      const info = onlineUsers[uname] || detailsCache[uname];
      return { username: uname, displayName: info?.displayName || uname, avatar: info?.avatar, isOnline: !!onlineUsers[uname] };
    });
    if (localSearch) {
      const low = localSearch.toLowerCase();
      result = result.filter(f => f.displayName.toLowerCase().includes(low) || f.username.toLowerCase().includes(low));
    }
    if (selectedTag !== "All") result = result.filter(f => friendTags[f.username] === selectedTag);
    result.sort((a, b) => sortOrder === "asc" ? a.displayName.localeCompare(b.displayName) : b.displayName.localeCompare(a.displayName));
    return result;
  }, [friends, localSearch, selectedTag, friendTags, sortOrder, onlineUsers, detailsCache]);

  const startFriendCall = (friendUsername) => {
    if (!startCall || isCallBusy) return;
    const dmRoomId = `dm_${[user.username, friendUsername].sort().join("_")}`;
    startCall(friendUsername, dmRoomId);
  };

  const renderMiniUser = (u, status, incoming = false) => {
    const uname = typeof u === 'string' ? u : u.S;
    const info = onlineUsers[uname] || detailsCache[uname];
    return (
      <div key={uname} className={`flex items-center justify-between p-3 rounded-2xl mb-2 group transition-all border ${darkMode ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-white border-gray-100 hover:bg-slate-50 shadow-sm'}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs text-white font-bold overflow-hidden shrink-0 ${darkMode ? 'bg-slate-700' : 'bg-slate-300'}`}>
            {info?.avatar ? <img src={info.avatar} className="w-full h-full object-cover" /> : uname[0].toUpperCase()}
          </div>
          <div className="flex flex-col truncate">
            <span className={`text-sm font-semibold truncate ${darkMode ? 'text-white' : 'text-slate-800'}`}>{info?.displayName || uname}</span>
            <span className={`text-[10px] font-medium uppercase tracking-wider ${incoming ? "text-indigo-400" : "text-yellow-600"}`}>{status}</span>
          </div>
        </div>
        {incoming && (
          <div className="flex gap-2">
            <button onClick={() => acceptFriend(uname)} className="p-2 bg-emerald-500 rounded-xl text-white hover:bg-emerald-400 transition-colors" title="Chấp nhận"><FaCheck size={12} /></button>
            <button onClick={() => rejectFriend(uname)} className="p-2 bg-red-500 rounded-xl text-white hover:bg-red-400 transition-colors" title="Từ chối"><FaTimes size={12} /></button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden font-sans ${darkMode ? 'bg-[#0f172a]' : 'bg-white'}`}>
      {/* TOP SEARCH - GLOBAL SEARCH */}
      <div className={`p-6 border-b relative z-[1000] shrink-0 ${darkMode ? 'bg-[#0f172a] border-white/10' : 'bg-white border-gray-200'}`}>
        <div className="max-w-4xl mx-auto relative group">
          <div className={`flex items-center rounded-2xl px-6 py-4 transition-all shadow-sm border focus-within:border-indigo-500 focus-within:shadow-md ${darkMode ? 'bg-black/40 border-white/10' : 'bg-white border-gray-200'}`}>
            <FaSearch className={`text-indigo-500 text-lg ${isSearchingGlobal ? "animate-spin" : ""}`} />
            <input
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Nhập username để tìm kiếm mọi người..."
              className={`bg-transparent border-none outline-none ml-4 w-full text-sm font-medium ${darkMode ? 'text-white placeholder:text-gray-500' : 'text-slate-800 placeholder:text-gray-400'}`}
            />
            {globalSearch && <FaTimes onClick={() => setGlobalSearch("")} className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" />}
          </div>

          {globalResults.length > 0 && (
            <div className={`absolute top-full left-0 right-0 mt-2 border rounded-2xl p-2 z-[1001] shadow-lg ${darkMode ? 'bg-[#1e293b] border-white/10' : 'bg-white border-gray-100'}`}>
              {globalResults.map(u => (
                <div key={u.username} className={`flex items-center justify-between p-3 rounded-xl transition-colors ${darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center overflow-hidden text-white font-bold">
                        {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : u.username[0].toUpperCase()}
                    </div>
                    <div>
                        <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{u.displayName || u.username}</p>
                        <p className={`text-xs text-gray-500`}>@{u.username}</p>
                    </div>
                  </div>
                  <button onClick={() => sendFriendRequest(u.username)} className="bg-indigo-600 p-2.5 rounded-xl text-white hover:bg-indigo-500 transition-colors shadow-sm flex items-center gap-2 text-xs font-semibold">
                    <FaUserPlus size={14} /> Thêm bạn
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* PANEL TRÁI */}
        <div className={`w-80 border-r p-6 space-y-8 overflow-y-auto shrink-0 scrollbar-hide ${darkMode ? 'border-white/5 bg-[#0f172a]' : 'border-gray-200 bg-gray-50/50'}`}>
          {/* QUẢN LÝ THẺ */}
          <section className="space-y-3">
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Danh mục thẻ</p>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <div key={tag} className="group/tag relative flex items-center">
                  <button onClick={() => setSelectedTag(selectedTag === tag ? "All" : tag)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${selectedTag === tag ? "bg-indigo-600 text-white shadow-md" : (darkMode ? "bg-white/5 text-gray-300 hover:bg-white/10" : "bg-white border border-gray-200 text-slate-600 hover:bg-slate-50")}`}>
                    {tag}
                    {selectedTag === tag && <FaCheck size={10} className="opacity-80"/>}
                  </button>
                  {tag !== "All" && (
                    <div className="absolute -top-2 -right-2 hidden group-hover/tag:flex gap-0.5 shadow-md rounded-md p-0.5 border z-10 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}">
                      <button onClick={() => { setEditingTag(tag); setTagInput(tag); }} className="p-1 text-blue-500 hover:bg-blue-50 rounded transition-colors"><FaEdit size={10} /></button>
                      <button onClick={() => deleteTag(tag)} className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"><FaTrashAlt size={10} /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className={`p-1.5 rounded-lg border mt-2 flex gap-2 shadow-sm focus-within:border-indigo-500 transition-colors ${darkMode ? 'bg-black/20 border-white/5' : 'bg-white border-gray-100'}`}>
                <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Tên thẻ mới..." className={`flex-1 bg-transparent border-none px-2 text-xs outline-none ${darkMode ? 'text-white placeholder:text-gray-500' : 'text-slate-800 placeholder:text-gray-400'}`} />
                <button onClick={handleSaveTag} className="p-1.5 bg-indigo-600 rounded-md text-white hover:bg-indigo-500 transition-colors"><FaSave size={12}/></button>
            </div>
          </section>

          {/* ĐÃ GỬI & YÊU CẦU ĐẾN */}
          <section className="space-y-4">
            <p className="text-xs font-bold text-yellow-500 uppercase tracking-wider">Đã gửi yêu cầu</p>
            <div className="space-y-2">
              {user.sentRequests?.length > 0 ? (user.sentRequests.map((u) => renderMiniUser(u, "Đang chờ"))) : (<p className="text-xs text-gray-500 py-2">Chưa có yêu cầu nào gửi đi.</p>)}
            </div>
          </section>

          {friendRequests.length > 0 && (
            <section className="space-y-4 pt-4 border-t border-gray-200/50">
              <p className="text-xs font-bold text-red-500 uppercase tracking-wider flex items-center gap-2">Yêu cầu kết bạn <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span></p>
              <div className="space-y-2">
                {friendRequests.map((u) => renderMiniUser(u, "Mới", true))}
              </div>
            </section>
          )}
        </div>

        {/* PANEL CHÍNH */}
        <div className={`flex-1 p-8 overflow-y-auto scrollbar-hide flex flex-col ${darkMode ? 'bg-[#0f172a]' : 'bg-white'}`}>
          <div className="flex justify-between items-center gap-4 mb-8 shrink-0">
            <div className="relative w-full max-w-md">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} placeholder="Tìm kiếm bạn bè..." className={`w-full border py-3 pl-11 pr-4 rounded-xl text-sm outline-none transition-colors focus:border-indigo-500 ${darkMode ? 'bg-white/5 border-white/10 text-white focus:bg-white/10' : 'bg-gray-50 border-gray-200 text-slate-800 focus:bg-white'}`} />
            </div>
            <div className={`flex items-center gap-2 p-1 rounded-xl border shrink-0 ${darkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-200'}`}>
              <button onClick={() => setSortOrder("asc")} className={`p-2 rounded-lg transition-all ${sortOrder === "asc" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`} title="Từ A đến Z"><FaSortAlphaDown size={16} /></button>
              <button onClick={() => setSortOrder("desc")} className={`p-2 rounded-lg transition-all ${sortOrder === "desc" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`} title="Từ Z đến A"><FaSortAlphaUp size={16} /></button>
            </div>
          </div>

          <div className="flex-1 pb-10">
            {processedFriends.length === 0 ? (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center opacity-40">
                  <FaUserFriends size={80} className="mb-4 text-gray-400"/>
                  <p className="text-lg font-semibold text-gray-500">Danh sách trống</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                {processedFriends.map((f) => (
                    <div key={f.username} className={`group border p-4 rounded-2xl hover:border-indigo-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md ${darkMode ? 'bg-[#1e293b] border-white/10' : 'bg-white border-gray-200'}`}>
                      <div className="flex items-center gap-4 min-w-0">
                          <div className="relative cursor-pointer shrink-0" onClick={() => handleOpenProfile(f.username)}>
                            <div className={`w-14 h-14 rounded-full border-2 p-0.5 transition-colors ${f.isOnline ? "border-emerald-500" : (darkMode ? "border-white/10" : "border-gray-200")}`}>
                                <div className="w-full h-full rounded-full bg-indigo-100 flex items-center justify-center text-xl font-bold text-indigo-600 overflow-hidden">
                                {f.avatar ? <img src={f.avatar} className="w-full h-full object-cover" /> : f.displayName[0].toUpperCase()}
                                </div>
                            </div>
                            <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 ${darkMode ? 'border-[#1e293b]' : 'border-white'} ${f.isOnline ? "bg-emerald-500" : "bg-gray-400"}`}></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className={`text-base font-bold truncate group-hover:text-indigo-500 transition-colors ${darkMode ? 'text-white' : 'text-slate-800'}`}>{f.displayName}</h3>
                            <p className={`text-xs text-gray-500 truncate mb-1`}>@{f.username}</p>
                            
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-1.5 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 shrink-0">
                                  <FaUserTag size={10} className="text-indigo-500" />
                                  <span className="text-[10px] font-semibold text-indigo-600">{friendTags[f.username] || "Chưa gắn thẻ"}</span>
                                </div>
                                
                                <div className="hidden group-hover:flex flex-wrap items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {availableTags.filter(t => t !== "All" && t !== friendTags[f.username]).map(tag => (
                                      <button key={tag} onClick={() => assignTag(f.username, tag)} className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors ${darkMode ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-slate-700'}`}>
                                          {tag}
                                      </button>
                                  ))}
                                  {friendTags[f.username] && (
                                     <button onClick={() => assignTag(f.username, null)} className="px-1.5 py-0.5 text-[10px] text-red-400 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"><FaTimes/></button>
                                  )}
                                </div>
                            </div>
                          </div>
                      </div>
                      
                      <div className="flex items-center gap-2 sm:shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-white/5 mt-2 sm:mt-0">
                          <button onClick={() => handleStartDM(f.username)} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm"><FaCommentDots size={14} /> Nhắn tin</button>
                          <button onClick={() => startFriendCall(f.username)} disabled={isCallBusy} className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors border ${isCallBusy ? 'bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed dark:bg-white/5 dark:border-white/5' : 'bg-white hover:bg-cyan-50 text-cyan-600 border-cyan-200 dark:bg-transparent dark:text-cyan-400 dark:border-cyan-500/30 dark:hover:bg-cyan-500/10'}`} title="Gọi Video"><FaVideo size={14}/></button>
                          <button onClick={() => handleOpenProfile(f.username)} className={`p-2.5 rounded-xl transition-colors border ${darkMode ? 'border-white/10 text-gray-400 hover:bg-white/10 hover:text-white' : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-slate-800'}`} title="Hồ sơ"><FaUserShield size={14}/></button>
                          <button onClick={async () => { if (!window.confirm(`Hủy kết bạn với @${f.username}?`)) return; try { await api.post('/friends/unfriend', { me: user.username, friendUname: f.username }); loadData(); } catch { alert('Lỗi!'); } }} className={`p-2.5 rounded-xl transition-colors border ${darkMode ? 'border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white' : 'border-red-200 text-red-500 hover:bg-red-50 hover:text-red-700'}`} title="Hủy kết bạn"><FaUserMinus size={14}/></button>
                      </div>
                    </div>
                ))}
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendsTab;
