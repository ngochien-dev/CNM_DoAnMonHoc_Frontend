import React, { useState, useCallback, useEffect, useRef } from "react";

export default function SearchDropdown({
  isOpen,
  onClose,
  onMessageSelect,
  searchQuery,
  searchInputRef,
  darkMode = true,
}) {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, maxHeight: 0 });
  const dropdownRef = useRef(null);
  const pageSize = 10;
  const DROPDOWN_WIDTH = 480;

  // Tính vị trí dropdown dựa trên vị trí của input
  useEffect(() => {
    if (isOpen && searchInputRef?.current) {
      const rect = searchInputRef.current.getBoundingClientRect();
      
      // Prefer positioning to the right, but fallback left if needed
      let calculatedLeft = rect.right - DROPDOWN_WIDTH;
      if (calculatedLeft < 16) {
        calculatedLeft = 16; // Min left padding from screen edge
      }
      
      // Calculate max height: use available space below, or show above if needed
      const spaceBelow = window.innerHeight - rect.bottom - 40;
      const spaceAbove = rect.top - 40;
      
      let calculatedTop = rect.bottom + 8;
      let calculatedMaxHeight = Math.max(spaceBelow, 150);
      
      // If not enough space below, position above instead
      if (spaceBelow < 200 && spaceAbove > calculatedMaxHeight) {
        calculatedTop = rect.top - calculatedMaxHeight - 8;
      }
      
      setPosition({
        top: calculatedTop,
        left: calculatedLeft,
        width: DROPDOWN_WIDTH,
        maxHeight: calculatedMaxHeight,
      });
    }
  }, [isOpen, searchInputRef]);

  // FIX: tách performSearch ra ngoài useCallback có searchQuery
  // để tránh vòng lặp vô tận [searchQuery, performSearch] → trigger lại → loop
  const performSearch = useCallback(
    async (page = 0) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setTotalResults(0);
        setCurrentPage(0);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        let endpoint = "/api/messages/search";
        let params = {};
        let contentQuery = searchQuery;

        const fromMatch = searchQuery.match(/from:(\S+)/);
        if (fromMatch) {
          endpoint = "/api/messages/search/advanced";
          params.senderId = fromMatch[1];
          contentQuery = contentQuery.replace(/from:\S+/g, "").trim();
        }

        const inMatch = searchQuery.match(/in:(\S+)/);
        if (inMatch) {
          endpoint = "/api/messages/search/advanced";
          params.channelId = inMatch[1];
          contentQuery = contentQuery.replace(/in:\S+/g, "").trim();
        }

        const beforeMatch = searchQuery.match(/before:(\S+)/);
        if (beforeMatch) {
          endpoint = "/api/messages/search/advanced";
          params.beforeDate = beforeMatch[1];
          contentQuery = contentQuery.replace(/before:\S+/g, "").trim();
        }

        const afterMatch = searchQuery.match(/after:(\S+)/);
        if (afterMatch) {
          endpoint = "/api/messages/search/advanced";
          params.afterDate = afterMatch[1];
          contentQuery = contentQuery.replace(/after:\S+/g, "").trim();
        }

        const hasMatch = searchQuery.match(/has:(\S+)/);
        if (hasMatch) {
          endpoint = "/api/messages/search/with-attachments";
          params.content = contentQuery.replace(/has:\S+/g, "").trim();
          if (inMatch) params.channelId = inMatch[1];
        }

        const pinnedMatch = searchQuery.match(/pinned:(true|false)/i);
        if (pinnedMatch) {
          endpoint = "/api/messages/search/pinned";
          if (inMatch) params.channelId = inMatch[1];
        }

        // Nếu là search thường hoặc advanced, luôn truyền content
        if (!hasMatch && !pinnedMatch) {
          params.content = contentQuery.trim();
        }

        params.page = page;
        params.size = pageSize;

        const queryString = Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== "")
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
          .join("&");

        // FIX: Use full backend URL, not relative path!
        const backendUrl = 'http://localhost:3001';
        const response = await fetch(`${backendUrl}${endpoint}?${queryString}`, { method: "GET" });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        
        console.log("🔍 [SearchDropdown] API endpoint:", endpoint);
        console.log("🔍 [SearchDropdown] API query:", queryString);
        console.log("🔍 [SearchDropdown] API response:", data);

        // FIX: normalize fields từ DynamoDB (senderId, content, sentAt)
        // sang fields mà UI cần (userName, content, sentAt, messageId)
        let raw = [];
        let total = 0;

        if (Array.isArray(data)) {
          raw = data;
          total = data.length;
        } else if (data?.content) {
          raw = data.content;
          total = data.totalElements || data.content.length;
        } else if (data?.messages) {
          raw = data.messages;
          total = data.messages.length;
        }

        const normalized = raw.map((item) => ({
          ...item,
          // messageId: ưu tiên field messageId, fallback _id
          messageId: item.messageId || item._id || item.id,
          // userName: ưu tiên displayName, fallback senderId
          userName: item.displayName || item.userName || item.senderId || item.senderUsername,
          // channelId: ưu tiên channelId, fallback roomId
          channelId: item.channelId || item.roomId,
          // content: ưu tiên content, fallback text (tên field trong socket)
          content: item.content || item.text || "",
          // sentAt: giữ nguyên hoặc dùng sentAt
          sentAt: item.sentAt || item.time || null,
        }));

        setResults(normalized);
        setTotalResults(total);
        setCurrentPage(page);
      } catch (err) {
        console.error("❌ Search error:", err);
        
        // Check if response is HTML (backend error page)
        if (err.message.includes("not valid JSON")) {
          setError("Backend API lỗi - Kiểm tra network tab");
        } else {
          setError("Tìm kiếm thất bại. Thử lại sau.");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [searchQuery]
  );

  // FIX: chỉ depend vào searchQuery, KHÔNG đưa performSearch vào dep
  // để tránh infinite loop
  useEffect(() => {
    setCurrentPage(0);
    performSearch(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        searchInputRef?.current &&
        !searchInputRef.current.contains(event.target) &&
        !event.target.classList.contains("fixed")
      ) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, searchInputRef]);

  const totalPages = Math.ceil(totalResults / pageSize);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop to close dropdown when clicking outside */}
      <div
        className="fixed inset-0 z-99"
        onClick={onClose}
        style={{ background: "transparent" }}
      />
      {/* Dropdown container */}
      <div
        ref={dropdownRef}
        className={`fixed z-200 shadow-[0_16px_24px_rgba(0,0,0,0.3)] flex flex-col rounded-lg overflow-hidden border ${
          darkMode
            ? 'bg-[#2b2d31] border-[#1e1f22] shadow-lg'
            : 'bg-white border-gray-200 shadow-xl'
        }`}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          width: `${position.width}px`,
          maxHeight: `${position.maxHeight}px`,
        }}
      >
        {/* Header */}
        <div
          className={`p-4 flex items-center justify-between shrink-0 sticky top-0 z-10 ${
            darkMode
              ? 'bg-[#2b2d31] border-b border-[#1f2023]'
              : 'bg-white border-b border-gray-200'
          }`}
        >
          <span
            className={`text-xs font-bold uppercase tracking-wide ${
              darkMode ? 'text-[#949BA4]' : 'text-gray-500'
            }`}
          >
            {isLoading
              ? "Đang tìm..."
              : totalResults > 0
              ? `${totalResults} kết quả`
              : searchQuery.trim()
              ? "Không có kết quả"
              : "Tìm kiếm"}
          </span>

          {totalResults > 0 && (
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 0}
                onClick={() => performSearch(currentPage - 1)}
                className={`px-1 disabled:opacity-30 transition-colors ${
                  darkMode
                    ? 'text-[#b5bac1] hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {"<"}
              </button>
              <span
                className={`text-xs ${
                  darkMode ? 'text-[#949BA4]' : 'text-gray-500'
                }`}
              >
                {currentPage + 1} / {Math.max(1, totalPages)}
              </span>
              <button
                disabled={currentPage >= totalPages - 1}
                onClick={() => performSearch(currentPage + 1)}
                className={`px-1 disabled:opacity-30 transition-colors ${
                  darkMode
                    ? 'text-[#b5bac1] hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {">"}
              </button>
            </div>
          )}
        </div>

        {/* Body */}
        <div
          className={`overflow-y-auto flex-1 ${
            darkMode ? 'bg-[#2b2d31]' : 'bg-white'
          }`}
        >
          {isLoading ? (
            <div
              className={`p-8 text-center text-sm ${
                darkMode ? 'text-[#949BA4]' : 'text-gray-500'
              }`}
            >
              Đang tìm kiếm...
            </div>
          ) : error ? (
            <div
              className={`p-8 text-center text-sm ${
                darkMode ? 'text-red-400' : 'text-red-600'
              }`}
            >
              {error}
            </div>
          ) : results.length === 0 ? (
            <div
              className={`p-8 text-center text-sm ${
                darkMode ? 'text-[#949BA4]' : 'text-gray-500'
              }`}
            >
              {searchQuery.trim()
                ? "Không tìm thấy tin nhắn nào."
                : "Nhập từ khóa để tìm kiếm."}
            </div>
          ) : (
            <div className="flex flex-col">
              {results.map((msg) => (
                <div
                  key={msg.messageId}
                  onClick={() => {
                    onMessageSelect(msg.messageId, msg.channelId);
                    onClose();
                  }}
                  className={`group p-3 cursor-pointer border-b last:border-0 transition-colors relative ${
                    darkMode
                      ? 'hover:bg-[#35373c] border-[#1f2023]'
                      : 'hover:bg-gray-100 border-gray-200'
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Avatar */}
                    <div className="mt-1 shrink-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium uppercase ${
                          darkMode ? 'bg-[#5865F2]' : 'bg-blue-500'
                        }`}
                      >
                        {msg.userName?.[0] || "?"}
                      </div>
                    </div>

                    {/* Nội dung */}
                    <div className="flex-1 min-w-0">
                      <div
                        className={`flex items-center gap-2 mb-0.5 ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        <span className="font-medium text-sm">
                          {msg.userName || "Ẩn danh"}
                        </span>
                        <span
                          className={`text-[11px] ${
                            darkMode
                              ? 'text-[#949BA4]'
                              : 'text-gray-500'
                          }`}
                        >
                          {msg.sentAt
                            ? new Date(msg.sentAt).toLocaleDateString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                      </div>
                      <div
                        className={`text-[14px] leading-relaxed wrap-break-word line-clamp-2 ${
                          darkMode
                            ? 'text-[#dbdee1]'
                            : 'text-gray-700'
                        }`}
                        dangerouslySetInnerHTML={{
                          __html: highlightText(
                            msg.content,
                            searchQuery,
                            darkMode
                          ),
                        }}
                      />
                    </div>
                  </div>

                  {/* Nút Jump */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className={`px-3 py-1 text-xs text-white rounded transition-colors ${
                        darkMode
                          ? 'bg-[#3f4147] hover:bg-[#4e5058]'
                          : 'bg-blue-500 hover:bg-blue-600'
                      }`}
                    >
                      Jump
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Highlight từ khóa trong nội dung tin nhắn
function highlightText(text, query, darkMode = true) {
  if (!query || !text) return text || "";
  // Loại bỏ các operator đặc biệt, chỉ giữ lại từ khóa thực sự
  const keyword = query
    .replace(/from:\S+\s*/gi, "")
    .replace(/in:\S+\s*/gi, "")
    .replace(/before:\S+\s*/gi, "")
    .replace(/after:\S+\s*/gi, "")
    .replace(/has:\S+\s*/gi, "")
    .replace(/pinned:\S+\s*/gi, "")
    .trim();

  if (!keyword) return text;

  const safeKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${safeKeyword})`, "gi");

  const bgColor = darkMode ? 'rgba(250,166,26,0.15)' : 'rgba(255,193,7,0.2)';
  const textColor = darkMode ? '#faa61a' : '#f59e0b';

  return text.replace(
    regex,
    `<mark style="background:${bgColor};color:${textColor};border-radius:2px;padding:0 1px;">$1</mark>`
  );
}
