import React, { useState, useEffect, useMemo } from "react";
import {
  FaUserFriends, FaUserCheck, FaCommentDots, FaCircle, FaUserPlus,
  FaGhost, FaUserShield, FaSearch, FaTimes, FaSortAlphaDown,
  FaSortAlphaUp, FaTags, FaPaperPlane, FaUserTag, FaSave,
  FaTrashAlt, FaEdit, FaCheck,
} from "react-icons/fa";
import api from "../../services/api";

const FriendsTab = ({ user, friends, friendRequests, loadData, onlineUsers, handleStartDM, handleOpenProfile, darkMode }) => {
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
      alert("Đã phát tín hiệu kết nối!");
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

  const renderMiniUser = (u, status, incoming = false) => {
    const uname = typeof u === 'string' ? u : u.S;
    const info = onlineUsers[uname] || detailsCache[uname];
    return (
      <div key={uname} className={`flex items-center justify-between p-3 rounded-2xl mb-2 group transition-all border ${darkMode ? 'bg-white/2 border-white/5 hover:bg-white/5' : 'bg-white border-gray-100 hover:bg-slate-50 shadow-sm'}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] text-white font-black overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-slate-300'}`}>
            {info?.avatar ? <img src={info.avatar} className="w-full h-full object-cover" /> : uname[0]}
          </div>
          <div className="flex flex-col truncate">
            <span className={`text-[11px] font-black truncate ${darkMode ? 'text-white' : 'text-slate-800'}`}>{info?.displayName || uname}</span>
            <span className={`text-[7px] font-black uppercase ${incoming ? "text-indigo-400" : "text-yellow-600"}`}>{status}</span>
          </div>
        </div>
        {incoming && <div className="flex gap-1"><button onClick={() => acceptFriend(uname)} className="p-1.5 bg-emerald-500 rounded-lg text-white hover:scale-110 transition-transform" title="Chấp nhận"><FaCheck size={10} /></button><button onClick={() => rejectFriend(uname)} className="p-1.5 bg-red-500 rounded-lg text-white hover:scale-110 transition-transform" title="Từ chối"><FaTimes size={10} /></button></div>}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-hidden font-black italic tracking-tighter uppercase">
      {/* TOP SEARCH - GLOBAL SEARCH */}
      <div className={`p-6 border-b relative z-[1000] ${darkMode ? 'bg-white/5 backdrop-blur-2xl border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="max-w-4xl mx-auto relative group">
          <div className={`flex items-center rounded-2xl px-6 py-4 focus-within:border-indigo-500 transition-all shadow-2xl border ${darkMode ? 'bg-black/40 border-white/10' : 'bg-white border-gray-200'}`}>
            <FaSearch className={`text-indigo-500 text-xl ${isSearchingGlobal ? "animate-spin" : "animate-pulse"}`} />
            <input
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="GÕ ĐÚNG USERNAME ĐỂ TRUY QUÉT..."
              className={`bg-transparent border-none outline-none ml-4 w-full text-sm font-black ${darkMode ? 'text-white placeholder:text-gray-700' : 'text-slate-800 placeholder:text-gray-400'}`}
            />
            {globalSearch && <FaTimes onClick={() => setGlobalSearch("")} className="text-gray-500 cursor-pointer" />}
          </div>

          {globalResults.length > 0 && (
            <div className={`absolute top-full left-0 right-0 mt-2 border rounded-[25px] p-4 z-[1001] shadow-[0_20px_50px_rgba(0,0,0,0.1)] ${darkMode ? 'bg-[#0f172a] border-white/10' : 'bg-white border-gray-100'}`}>
              {globalResults.map(u => (
                <div key={u.username} className={`flex items-center justify-between p-4 rounded-2xl ${darkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center overflow-hidden text-white font-black">
                        {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : u.username[0]}
                    </div>
                    <div>
                        <p className={`text-sm font-black uppercase ${darkMode ? 'text-white' : 'text-slate-800'}`}>{u.displayName || u.username}</p>
                        <p className={`text-[10px] italic lowercase tracking-normal font-sans ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>@{u.username}</p>
                    </div>
                  </div>
                  <button onClick={() => sendFriendRequest(u.username)} className="bg-indigo-600 p-3 rounded-xl text-white hover:bg-indigo-500 transition-all shadow-xl">
                    <FaUserPlus size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* PANEL TRÁI */}
        <div className={`w-80 border-r p-6 space-y-10 overflow-y-auto shrink-0 scrollbar-hide ${darkMode ? 'border-white/5 bg-black/10' : 'border-gray-200 bg-white'}`}>
          {/* QUẢN LÝ THẺ */}
          <section className="space-y-5">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[4px] border-l-2 border-indigo-500 pl-3 uppercase">Kho thẻ</p>
            <div className="space-y-2">
              {availableTags.map((tag) => (
                <div key={tag} className="group/tag flex items-center gap-2">
                  <button onClick={() => setSelectedTag(selectedTag === tag ? "All" : tag)} className={`flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase text-left transition-all ${selectedTag === tag ? "bg-indigo-600 text-white shadow-lg scale-105" : (darkMode ? "bg-white/5 text-gray-500 hover:bg-white/10" : "bg-slate-50 text-slate-500 hover:bg-slate-100")}`}>{tag}</button>
                  {tag !== "All" && (
                    <div className="hidden group-hover/tag:flex gap-1">
                      <button onClick={() => { setEditingTag(tag); setTagInput(tag); }} className={`p-2 rounded-lg hover:bg-blue-500 hover:text-white ${darkMode ? 'bg-white/5 text-blue-400' : 'bg-blue-50 text-blue-500'}`}><FaEdit size={10} /></button>
                      <button onClick={() => deleteTag(tag)} className={`p-2 rounded-lg hover:bg-red-500 hover:text-white ${darkMode ? 'bg-white/5 text-red-400' : 'bg-red-50 text-red-500'}`}><FaTrashAlt size={10} /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className={`p-4 rounded-2xl border mt-2 ${darkMode ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-gray-100'}`}>
              <div className="flex gap-2">
                <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="..." className={`flex-1 border p-2.5 rounded-xl text-[10px] outline-none focus:border-indigo-500 ${darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200 text-slate-800'}`} />
                <button onClick={handleSaveTag} className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg"><FaSave /></button>
              </div>
            </div>
          </section>

          {/* ĐÃ PHÁT TÍN HIỆU */}
          <section className="space-y-4">
            <p className="text-[10px] font-black text-yellow-500 tracking-[4px] border-l-2 border-yellow-500 pl-3 uppercase">Đã gửi</p>
            <div className="space-y-2">
              {user.sentRequests?.length > 0 ? (user.sentRequests.map((u) => renderMiniUser(u, "Pending"))) : (<p className="text-[9px] text-gray-700 text-center py-4">Trống</p>)}
            </div>
          </section>

          {/* YÊU CẦU ĐẾN */}
          {friendRequests.length > 0 && (
            <section className="space-y-4">
              <p className="text-[10px] font-black text-red-500 tracking-[4px] border-l-2 border-red-500 pl-3 animate-pulse uppercase">Yêu cầu đến</p>
              {friendRequests.map((u) => renderMiniUser(u, "New Signal", true))}
            </section>
          )}
        </div>

        {/* PANEL CHÍNH */}
        <div className={`flex-1 p-8 overflow-hidden flex flex-col ${darkMode ? 'bg-white/2' : 'bg-slate-50'}`}>
          <div className="flex justify-between items-center gap-6 mb-10">
            <div className="relative w-full max-w-md">
              <FaSearch className="absolute left-4 top-4 text-gray-400" />
              <input value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} placeholder="LỌC TRONG VÙNG ĐẤT..." className={`w-full border p-4 pl-12 rounded-2xl text-xs outline-none focus:border-indigo-500 uppercase ${darkMode ? 'bg-black/40 border-white/10 text-white' : 'bg-white border-gray-200 text-slate-800'}`} />
            </div>
            <div className={`flex items-center gap-4 p-2 rounded-2xl border shrink-0 ${darkMode ? 'bg-black/20 border-white/5' : 'bg-white border-gray-200'}`}>
              <button onClick={() => setSortOrder("asc")} className={`p-3 rounded-xl transition-all ${sortOrder === "asc" ? "bg-indigo-600 text-white shadow-lg" : "text-gray-500 hover:text-white"}`}><FaSortAlphaDown size={18} /></button>
              <button onClick={() => setSortOrder("desc")} className={`p-3 rounded-xl transition-all ${sortOrder === "desc" ? "bg-indigo-600 text-white shadow-lg" : "text-gray-500 hover:text-white"}`}><FaSortAlphaUp size={18} /></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide pb-20">
            {processedFriends.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-10 grayscale"><FaGhost size={100} className="mb-6"/><p className="text-2xl font-black tracking-[10px]">TRỐNG TRẢI</p></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
                {processedFriends.map((f) => (
                    <div key={f.username} className={`group border p-6 rounded-[45px] hover:border-indigo-500/50 transition-all shadow-2xl relative overflow-hidden ${darkMode ? 'bg-[#1e293b] border-white/5' : 'bg-white border-gray-100'}`}>
                    <div className="flex items-center gap-6">
                        <div className="relative cursor-pointer" onClick={() => handleOpenProfile(f.username)}>
                        <div className={`w-20 h-20 rounded-[30px] border-4 p-1.5 transition-all duration-500 ${f.isOnline ? "border-emerald-500" : (darkMode ? "border-white/10" : "border-gray-100")}`}>
                            <div className="w-full h-full rounded-[20px] bg-slate-800 flex items-center justify-center text-3xl font-black text-white overflow-hidden shadow-inner uppercase">
                            {f.avatar ? <img src={f.avatar} className="w-full h-full object-cover" /> : f.displayName[0]}
                            </div>
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-[5px] ${darkMode ? 'border-[#1e293b]' : 'border-white'} ${f.isOnline ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`}></div>
                        </div>
                        <div className="flex-1 min-w-0">
                        <h3 className={`text-xl font-black truncate group-hover:text-indigo-400 transition-colors uppercase ${darkMode ? 'text-white' : 'text-slate-800'}`}>{f.displayName}</h3>
                        <p className={`text-[10px] lowercase opacity-40 font-sans tracking-normal ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>@{f.username}</p>
                        <div className="flex items-center gap-2 mt-2 bg-indigo-500/10 w-fit px-3 py-1 rounded-full border border-indigo-500/20">
                            <FaUserTag size={10} className="text-indigo-500" /><span className="text-[9px] font-black uppercase text-indigo-400">{friendTags[f.username] || "NO TAG"}</span>
                        </div>
                        </div>
                    </div>
                    <div className={`mt-8 space-y-3 p-4 rounded-[25px] border ${darkMode ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-gray-100'}`}>
                        <p className="text-[9px] font-black text-gray-400 tracking-[4px] ml-1 uppercase">Gán thẻ nhanh</p>
                        <div className="flex flex-wrap gap-2">
                        {availableTags.filter((t) => t !== "All").map((tag) => (
                            <button key={tag} onClick={() => assignTag(f.username, tag)} className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${friendTags[f.username] === tag ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/40" : (darkMode ? "border-white/10 text-gray-500 hover:border-white/30 hover:text-white" : "border-gray-200 text-slate-500 hover:bg-slate-200 hover:text-slate-800")}`}>{tag}</button>
                        ))}
                        <button onClick={() => assignTag(f.username, null)} className="p-2 rounded-xl text-gray-400 hover:text-red-500 transition-all"><FaTrashAlt size={14} /></button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-8">
                        <button onClick={() => handleStartDM(f.username)} className="bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-[20px] text-[10px] font-black transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 shadow-indigo-500/20"><FaCommentDots size={14} /> CHAT</button>
                        <button onClick={() => handleOpenProfile(f.username)} className={`py-4 rounded-[20px] text-[10px] font-black transition-all border active:scale-95 shadow-sm uppercase flex items-center justify-center ${darkMode ? 'bg-white/5 hover:bg-white/10 text-gray-400 border-white/5' : 'bg-white hover:bg-slate-50 text-slate-500 border-gray-200'}`}>PROFILE</button>
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