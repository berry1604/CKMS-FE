import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, Search, Filter, Mail, Store, Warehouse } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { UserModal } from './UserModal';
import type { UserResponse } from '../../types/user';
import { userService } from '../../services/user.service';
import { roleApi } from '../../services/role.api';
import type { RoleResponse } from '../../types/role';
import { toast } from 'react-hot-toast';

import { useNavigate } from 'react-router-dom';

export const UsersList = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [roles, setRoles] = useState<RoleResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('ALL');

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 10;

    const loadUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await userService.getUsers({
                page: currentPage,
                size: pageSize,
                role: roleFilter !== 'ALL' ? roleFilter : undefined,
                search: searchTerm || undefined,
            });
            const pageData = response.data;
            setUsers(pageData.content);
            setTotalPages(pageData.totalPages);
            setTotalElements(pageData.totalElements);
        } catch (error) {
            console.error(error);
            toast.error('Không thể tải danh sách người dùng');
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, roleFilter, searchTerm]);

    const loadRoles = async () => {
        try {
            const fetchedRoles = await roleApi.getAllRoles();
            setRoles(fetchedRoles);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        loadRoles();
    }, []);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(0);
    }, [roleFilter, searchTerm]);

    const handleCreate = () => {
        navigate('/users/create');
    };

    const handleEdit = (user: UserResponse) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleDelete = (id: number) => {
        setUserToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;
        setIsDeleting(true);
        try {
            await userService.deleteUser(userToDelete);
            toast.success('Đã xóa người dùng thành công');
            loadUsers();
            setIsDeleteModalOpen(false);
        } catch (error) {
            console.error(error);
            toast.error('Xóa người dùng thất bại');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSubmit = async (_data: any) => {
        if (selectedUser) {
            try {
                await userService.updateUser(selectedUser.userId, _data);
                toast.success('Cập nhật người dùng thành công');
                loadUsers();
            } catch (error) {
                console.error(error);
                toast.error('Cập nhật người dùng thất bại');
            }
        }
    };


    const startItem = currentPage * pageSize + 1;
    const endItem = Math.min((currentPage + 1) * pageSize, totalElements);

    return (
        <div className="min-h-screen bg-[#0a0a0a] pb-20">
            {/* Cinematic Header */}
            <div className="relative h-[300px] w-full overflow-hidden">
                <img
                    src="/Users/phunghuyphuoc/.gemini/antigravity/brain/5ad3745d-382e-481d-8167-b732c447a69b/systems_management_bg_1773028301109.png"
                    className="w-full h-full object-cover scale-105"
                    alt="Systems Management Background"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-[#0a0a0a] backdrop-blur-[2px]" />

                <div className="absolute inset-0 flex flex-col justify-end px-8 pb-12 max-w-7xl mx-auto w-full">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-px w-12 bg-blue-500/50" />
                        <span className="text-blue-500 font-medium tracking-widest text-xs uppercase">System Administration</span>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                        <div>
                            <h1 className="text-5xl font-bold text-white tracking-tighter mb-2">
                                THÀNH VIÊN <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">HỆ THỐNG</span>
                            </h1>
                            <p className="text-gray-400 max-w-xl text-lg font-light leading-relaxed">
                                Quản lý nhân sự, phân quyền và giám sát hoạt động truy cập của toàn bộ đội ngũ vận hành.
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="px-6 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl">
                                <span className="text-gray-500 text-xs uppercase tracking-widest block mb-1">Tổng cộng</span>
                                <span className="text-2xl font-bold text-white leading-none">{totalElements}</span>
                            </div>
                            <Button onClick={handleCreate} className="h-14 px-8 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]">
                                <Plus className="mr-2 h-5 w-5" /> Thêm thành viên
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 -mt-8 relative z-10 space-y-6">
                {/* Toolbar */}
                <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-3xl p-4 shadow-2xl overflow-hidden relative">
                    <div className="flex flex-col md:flex-row gap-6 items-center justify-between relative z-10">
                        <div className="relative w-full md:w-[450px] group">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none transition-transform group-focus-within:scale-110">
                                <Search size={18} className="text-gray-400 group-focus-within:text-blue-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tên hoặc email..."
                                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all placeholder:text-gray-600 hover:bg-white/[0.07]"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar scroll-smooth">
                            <div className="p-2 bg-white/5 rounded-xl text-gray-400 mr-2">
                                <Filter size={18} />
                            </div>
                            {['ALL', ...roles.map(r => r.roleName).filter(Boolean)].map((role) => (
                                <button
                                    key={role}
                                    onClick={() => setRoleFilter(role)}
                                    className={`px-6 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all whitespace-nowrap border ${roleFilter === role
                                        ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                                        : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:border-white/10'
                                        }`}
                                >
                                    {role === 'ALL' ? 'Tất cả vai trò' : role?.replace(/_/g, ' ') || 'Chưa xác định'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/[0.02] border-b border-white/10 text-[10px] uppercase text-gray-500 font-bold tracking-[0.2em]">
                                    <th className="px-8 py-6">Thành viên</th>
                                    <th className="px-8 py-6">Vai trò OS</th>
                                    <th className="px-8 py-6">Trạng thái</th>
                                    <th className="px-8 py-6">Ngày tham gia</th>
                                    <th className="px-8 py-6 text-right">Điều khiển</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-24 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
                                                <span className="text-gray-400 text-sm font-light tracking-widest uppercase">Initializing Interface...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-24 text-center text-gray-500 font-light italic">
                                            Không tìm thấy thành viên nào phù hợp với yêu cầu.
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user, idx) => (
                                        <tr
                                            key={user.userId}
                                            className="hover:bg-white/[0.04] transition-all group animate-in fade-in slide-in-from-left-4 duration-500 ease-out"
                                            style={{ animationDelay: `${idx * 50}ms` }}
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                                                            {(user.fullName || user.username || '?').charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-4 border-[#0a0a0a] ${user.status === 'ACTIVE' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' :
                                                            user.status === 'PENDING_VERIFICATION' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' :
                                                                'bg-gray-600'
                                                            }`} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-white text-base tracking-tight">{user.fullName || user.username}</div>
                                                        <div className="text-gray-500 text-xs flex items-center mt-0.5">
                                                            <Mail size={12} className="mr-1.5 text-blue-500/50" />
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`h-1.5 w-1.5 rounded-full ${user.roleName === 'ADMIN' ? 'bg-blue-500' :
                                                            user.roleName === 'MANAGER' ? 'bg-indigo-500' :
                                                                user.roleName === 'STORE_STAFF' ? 'bg-green-500' :
                                                                    'bg-amber-500'
                                                            }`} />
                                                        <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">
                                                            {user.roleName?.replace(/_/g, ' ') || 'N/A'}
                                                        </span>
                                                    </div>
                                                    {(user.storeName || user.kitchenName) && (
                                                        <div className="text-[10px] text-gray-500 flex items-center gap-1.5 ml-3">
                                                            {user.storeName ? <Store size={10} className="text-blue-400" /> : <Warehouse size={10} className="text-indigo-400" />}
                                                            {user.storeName || user.kitchenName}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                {user.status === 'ACTIVE' ? (
                                                    <div className="flex items-center text-[10px] font-bold uppercase tracking-widest text-green-400 bg-green-500/5 border border-green-500/20 px-3 py-1.5 rounded-lg w-fit">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 animate-pulse" />
                                                        Online
                                                    </div>
                                                ) : user.status === 'PENDING_VERIFICATION' ? (
                                                    <div className="flex items-center text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/5 border border-amber-500/20 px-3 py-1.5 rounded-lg w-fit">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-2" />
                                                        Pending
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center text-[10px] font-bold uppercase tracking-widest text-red-400 bg-red-500/5 border border-red-500/20 px-3 py-1.5 rounded-lg w-fit">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2" />
                                                        Offline
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-8 py-6 text-sm text-gray-500 font-light">
                                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(user)}
                                                        className="h-9 w-9 p-0 bg-white/5 border border-white/10 hover:bg-blue-600 hover:border-blue-500 hover:text-white rounded-xl transition-all"
                                                    >
                                                        <Edit2 size={14} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(user.userId)}
                                                        className="h-9 w-9 p-0 bg-white/5 border border-white/10 hover:bg-red-600 hover:border-red-500 hover:text-white rounded-xl transition-all"
                                                    >
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination OS */}
                    <div className="bg-white/[0.02] px-8 py-6 border-t border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="text-xs text-gray-500 font-light tracking-wide italic">
                                {totalElements > 0 ? (
                                    <>Hiển thị records <span className="text-blue-400 font-bold">{startItem}-{endItem}</span> / <span className="text-white font-bold">{totalElements}</span></>
                                ) : (
                                    'Empty Resultset'
                                )}
                            </span>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === 0}
                                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                                className="border-white/10 bg-white/5 text-gray-400 hover:text-white rounded-xl px-6 h-10"
                            >
                                Trước
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage >= totalPages - 1}
                                onClick={() => setCurrentPage((p) => p + 1)}
                                className="border-white/10 bg-white/5 text-gray-400 hover:text-white rounded-xl px-6 h-10"
                            >
                                Tiếp
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <UserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                user={selectedUser}
            />

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Xóa Quyền Truy Cập"
                message="Bạn có chắc chắn muốn thu hồi toàn bộ quyền truy cập của thành viên này? Hành động này không thể hoàn tác."
                confirmText="Xác nhận Thu hồi"
                cancelText="Giữ lại"
                isLoading={isDeleting}
                variant="danger"
            />
        </div>
    );
};
