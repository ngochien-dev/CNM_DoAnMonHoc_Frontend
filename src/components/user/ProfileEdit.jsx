const ProfileEdit = ({ editForm, setEditForm, setIsEditing }) => (
    <div className="space-y-4 animate-in slide-in-from-right duration-500">
        <div className="space-y-1.5">
            <label className="text-[10px] font-black text-purple-400 uppercase ml-2 tracking-widest">Tên hiển thị</label>
            <input className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-sm font-bold focus:border-purple-500 outline-none text-white transition-all" 
                   value={editForm.displayName || ''} onChange={e => setEditForm({...editForm, displayName: e.target.value})} />
        </div>
        <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Email (🔒 Khóa)</label>
            <div className="p-4 bg-black/20 text-gray-500 rounded-2xl text-sm font-bold border border-white/5">{editForm.email}</div>
        </div>
        <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
                <label className="text-[10px] font-black text-purple-400 uppercase ml-2 tracking-widest">Số điện thoại</label>
                <input className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-sm font-bold focus:border-purple-500 outline-none text-white" 
                       value={editForm.phone || ''} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
            </div>
            <div className="space-y-1.5">
                <label className="text-[10px] font-black text-purple-400 uppercase ml-2 tracking-widest">Tiểu sử</label>
                <textarea className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-sm font-bold h-24 resize-none focus:border-purple-500 outline-none text-white" 
                          value={editForm.bio || ''} onChange={e => setEditForm({...editForm, bio: e.target.value})} />
            </div>
        </div>
        <div className="flex gap-3 pt-4">
            <button onClick={() => {/* handleUpdate */}} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-[2px] transition-all shadow-lg shadow-purple-500/20">Lưu dữ liệu</button>
            <button onClick={() => setIsEditing(false)} className="px-8 bg-white/5 hover:bg-white/10 text-gray-400 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all">Hủy</button>
        </div>
    </div>
);
export default ProfileEdit;