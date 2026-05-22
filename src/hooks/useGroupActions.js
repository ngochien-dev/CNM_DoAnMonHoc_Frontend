import { toast } from 'react-hot-toast';
import api from '../services/api';

const useGroupActions = (user, activeRoom, loadData, handleSwitchRoom, setShowGroupCreator, setShowGroupSettings, setShowFolderModal) => {

    const handleCreateGroup = async (name, isPublic, isChannel = false, members = [], description = '') => {
        const publicStatus = user.role === 'admin' ? isPublic : false;
        await api.post('/groups/create', { groupName: name, owner: user.username, isPublic: publicStatus, isChannel, members, description });
        setShowGroupCreator(false);
        loadData();
    };

    const handleRequestJoin = async (groupId) => {
        const res = await api.post('/groups/request', { groupId, username: user.username });
        if (res.data.joined) {
            toast.success("Đã gia nhập vũ trụ thành công!");
        } else {
            toast("Đã gửi tín hiệu chờ phê duyệt!");
        }
        loadData();
    };

    const handleApprove = async (groupId, targetUsername, action) => {
        await api.post('/groups/approve', { groupId, targetUsername, action });
        loadData();
    };

    const handleManageGroup = async (action) => {
        if (window.confirm(`Xác nhận thực hiện hành động: ${action}?`)) {
            await api.post('/groups/manage', { groupId: activeRoom.id, action });
            if (action === 'delete') { handleSwitchRoom(null); setShowGroupSettings(false); }
            loadData();
        }
    };

    const handleLeaveGroup = async () => {
        if (window.confirm(`Bạn có chắc chắn muốn rời khỏi vũ trụ này?`)) {
            await api.post('/groups/remove-member', { groupId: activeRoom.id, targetUsername: user.username });
            handleSwitchRoom(null);
            loadData();
        }
    };

    const handleKick = async (target) => {
        if (window.confirm(`Kích @${target}?`)) {
            await api.post('/groups/remove-member', { groupId: activeRoom.id, targetUsername: target });
            loadData();
        }
    };

    const handleToggleRole = async (targetUsername, action) => {
        if (window.confirm(`${action === 'grant' ? 'Thăng cấp' : 'Giáng chức'} @${targetUsername}?`)) {
            await api.post('/groups/role', { groupId: activeRoom.id, targetUsername, action });
            loadData();
        }
    };

    const clearChatHistory = async (roomId) => {
        if (!user?.username || !roomId) return;
        if (window.confirm(`Xóa toàn bộ lịch sử trò chuyện tại đây?`)) {
            await api.post('/v1/messages/clear-history', { username: user.username, roomId });
            loadData();
            return true; // Trả về để ChatPage cập nhật UI nếu cần
        }
        return false;
    };

    return {
        handleCreateGroup, handleRequestJoin, handleApprove, handleManageGroup,
        handleLeaveGroup, handleKick, handleToggleRole, clearChatHistory
    };
};

export default useGroupActions;