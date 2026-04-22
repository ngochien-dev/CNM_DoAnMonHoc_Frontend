import { forwardRef } from "react";
import { Search } from "lucide-react";

// dùng forwardRef để ChatPage có thể gán ref trực tiếp vào <input>
// → SearchDropdown.getBoundingClientRect() mới định vị đúng
const SearchBar = forwardRef(function SearchBar({ value, onChange, onFocus, darkMode = true }, ref) {
  return (
    <div className="relative flex items-center">
      <Search className={`absolute left-2 w-3.5 h-3.5 pointer-events-none ${
        darkMode ? 'text-[#949BA4]' : 'text-gray-400'
      }`} />
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder="Tìm kiếm..."
        className={`rounded pl-7 pr-2 h-7 w-[144px] focus:w-[240px]
                   transition-all duration-200 text-xs outline-none ${
                     darkMode
                       ? 'bg-[#1e1f22] text-[#dbdee1] placeholder:text-[#949BA4]'
                       : 'bg-gray-100 text-gray-900 placeholder:text-gray-500 border border-gray-300'
                   }`}
      />
    </div>
  );
});

export default SearchBar;