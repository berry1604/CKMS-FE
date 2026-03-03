import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, Search, Filter, MoreVertical, Mail, Calendar, CheckCircle, XCircle, Store, Warehouse } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
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
    const [activeMenu, setActiveMenu] = useState<number | null>(null);

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
        setActiveMenu(null);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
            try {
                await userService.deleteUser(id);
                toast.success('Đã xóa người dùng thành công');
                loadUsers();
            } catch (error) {
                console.error(error);
                toast.error('Xóa người dùng thất bại');
            }
        }
        setActiveMenu(null);
    };

    const handleSubmit = async (_data: any) => {
        if (selectedUser) {
            try {
                await userService.updateUser(selectedUser.id, _data);
                toast.success('Cập nhật người dùng thành công');
                loadUsers();
            } catch (error) {
                console.error(error);
                toast.error('Cập nhật người dùng thất bại');
            }
        }
    };

    const getRoleColor = (role: string) => {
        const colors: Record<string, any> = {
            ADMIN: 'primary',
            MANAGER: 'info',
            STAFF: 'danger',
            COORDINATOR: 'warning',
            STORE_STAFF: 'success'
        };
        return colors[role] || 'secondary';
    };

    const startItem = currentPage * pageSize + 1;
    const endItem = Math.min((currentPage + 1) * pageSize, totalElements);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-200 tracking-tight">Thành viên Hệ thống</h1>
                    <p className="text-sm text-gray-400 mt-1">Quản lý nhân sự và quyền truy cập vào hệ thống.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-zinc-900/50 px-3 py-1.5 rounded-md border border-zinc-800 text-sm font-medium text-gray-400 shadow-sm">
                        Tổng cộng: <span className="font-bold text-gray-200">{totalElements}</span>
                    </div>
                    <Button onClick={handleCreate} className="shadow-sm">
                        <Plus className="mr-2 h-4 w-4" /> Thêm thành viên
                    </Button>
                </div>
            </div>

            {/* Toolbar */}
            <Card className="p-4 border-zinc-800 bg-zinc-900/50">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={18} className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên hoặc email..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-700 bg-zinc-900/50 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        <Filter size={16} className="text-gray-500 hidden md:block" />
                        <span className="text-sm text-gray-400 whitespace-nowrap hidden md:block">Lọc theo:</span>
                        {['ALL', ...roles.map(r => r.roleName).filter(Boolean)].map((role) => (
                            <button
                                key={role}
                                onClick={() => setRoleFilter(role)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${roleFilter === role
                                    ? 'bg-amber-500/10 text-amber-500'
                                    : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                                    }`}
                            >
                                {role === 'ALL' ? 'Tất cả vai trò' : role?.replace(/_/g, ' ') || 'Chưa xác định'}
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Enhanced Table (Desktop) */}
            <div className="hidden md:block">
                <Card className="overflow-hidden shadow-sm border-zinc-800 bg-zinc-900/50 p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-900/80 border-b border-zinc-800 text-xs uppercase text-gray-400 font-semibold tracking-wider">
                                    <th className="px-6 py-4">Thành viên</th>
                                    <th className="px-6 py-4">Vai trò & Gán</th>
                                    <th className="px-6 py-4">Trạng thái</th>
                                    <th className="px-6 py-4">Ngày tham gia</th>
                                    <th className="px-6 py-4 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mb-2"></div>
                                                Đang tải danh sách...
                                            </div>
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                            Không tìm thấy thành viên nào phù hợp.
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.id} className="hover:bg-zinc-800/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="relative">
                                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-zinc-800 shadow-sm">
                                                            {(user.fullName || user.username || '?').charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className={`absolute bottom-0 right-0 h-2.5 w-2.5 ${user.isActive ? 'bg-green-500' : 'bg-gray-500'} border-2 border-zinc-800 rounded-full`}></div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="font-semibold text-gray-200">{user.fullName || user.username}</div>
                                                        <div className="text-gray-400 text-xs flex items-center mt-0.5">
                                                            <Mail size={10} className="mr-1" />
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <Badge variant={getRoleColor(user.roleName)} className="shadow-sm">
                                                        {user.roleName?.replace(/_/g, ' ') || 'N/A'}
                                                    </Badge>
                                                    {(user.storeName || user.kitchenName) && (
                                                        <div className="text-[10px] text-gray-400 flex items-center gap-1">
                                                            {user.storeName ? <Store size={10} /> : <Warehouse size={10} />}
                                                            {user.storeName || user.kitchenName}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.isActive ? (
                                                    <div className="flex items-center text-sm font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded-md w-fit">
                                                        <CheckCircle size={12} className="mr-1.5" />
                                                        Đang hoạt động
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center text-sm font-medium text-red-400 bg-red-500/10 px-2 py-1 rounded-md w-fit">
                                                        <XCircle size={12} className="mr-1.5" />
                                                        Ngừng hoạt động
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center text-sm text-gray-400">
                                                    <Calendar size={14} className="mr-2 text-gray-500" />
                                                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(user)} className="text-amber-500 hover:text-amber-400 hover:bg-zinc-800">
                                                        <Edit2 size={16} />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(user.id)} className="text-red-500 hover:text-red-400 hover:bg-zinc-800">
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="bg-zinc-900/80 px-6 py-4 border-t border-zinc-800 flex items-center justify-between">
                        <span className="text-sm text-gray-400">
                            {totalElements > 0 ? (
                                <>Hiển thị <span className="font-medium text-gray-200">{startItem}</span> đến <span className="font-medium text-gray-200">{endItem}</span> trong tổng số <span className="font-medium text-gray-200">{totalElements}</span> thành viên</>
                            ) : (
                                'Không tìm thấy kết quả'
                            )}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === 0}
                                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                            >
                                Trước
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage >= totalPages - 1}
                                onClick={() => setCurrentPage((p) => p + 1)}
                            >
                                Sau
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Mobile Grid View */}
            <div className="md:hidden grid grid-cols-1 gap-4">
                {isLoading ? (
                    <div className="text-center py-10 text-gray-500">Đang tải...</div>
                ) : users.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">Không tìm thấy thành viên nào.</div>
                ) : (
                    users.map((user) => (
                        <Card key={user.id} className="p-4 relative border-zinc-800 bg-zinc-900/50">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-base ring-2 ring-zinc-800">
                                        {(user.fullName || user.username || '?').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold text-gray-200">{user.fullName || user.username}</h3>
                                        <div className="text-sm text-gray-400 flex items-center">
                                            <Mail size={12} className="mr-1" />
                                            {user.email}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setActiveMenu(activeMenu === user.id ? null : user.id)}
                                    className="text-gray-400 p-1"
                                >
                                    <MoreVertical size={20} />
                                </button>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2 items-center">
                                <Badge variant={getRoleColor(user.roleName)} className="shadow-none">
                                    {user.roleName?.replace(/_/g, ' ') || 'N/A'}
                                </Badge>
                                {user.isActive ? (
                                    <div className="flex items-center text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded-md">
                                        <CheckCircle size={10} className="mr-1" /> Đang hoạt động
                                    </div>
                                ) : (
                                    <div className="flex items-center text-xs font-medium text-red-400 bg-red-500/10 px-2 py-1 rounded-md">
                                        <XCircle size={10} className="mr-1" /> Ngừng hoạt động
                                    </div>
                                )}
                            </div>

                            {/* Mobile Dropdown Menu */}
                            {activeMenu === user.id && (
                                <div className="absolute right-4 top-12 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-10 py-1 animate-in fade-in zoom-in-95 duration-200">
                                    <button
                                        onClick={() => handleEdit(user)}
                                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                                    >
                                        <Edit2 size={16} className="mr-3 text-blue-500" /> Chỉnh sửa thông tin
                                    </button>
                                    <div className="h-px bg-gray-100 my-1"></div>
                                    <button
                                        onClick={() => handleDelete(user.id)}
                                        className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center"
                                    >
                                        <Trash2 size={16} className="mr-3" /> Xóa quyền truy cập
                                    </button>
                                </div>
                            )}
                            {/* Click outside to close mobile menu */}
                            {activeMenu === user.id && (
                                <div className="fixed inset-0 z-0 cursor-default" onClick={() => setActiveMenu(null)}></div>
                            )}
                        </Card>
                    ))
                )}
            </div>

            <UserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                user={selectedUser}
            />
        </div>
    );
};
