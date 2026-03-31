import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, Search, Filter, Mail, Store, Warehouse } from 'lucide-react';
import { cn } from '../../utils/classNames';
import { Button } from '../../components/ui/Button';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { UserModal } from './UserModal';
import type { UserResponse } from '../../types/user';
import { userService } from '../../services/user.service';
import { roleApi } from '../../services/role.api';
import type { RoleResponse } from '../../types/role';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';

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
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative pt-12 pb-4">
                {/* Decorative background glow */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" />
                
                <div className="space-y-4 max-w-2xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-amber-500/20 to-orange-600/10 rounded-2xl border border-amber-500/20 backdrop-blur-xl shadow-inner">
                            <Plus className="w-6 h-6 text-amber-500" />
                        </div>
                        <Badge
                            className="text-[10px] font-black tracking-[0.3em] px-4 py-1.5 border-amber-500/20 uppercase bg-amber-500/5 text-amber-600 italic"
                        >
                            Hệ thống Quản trị
                        </Badge>
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-5xl font-black text-[var(--text-primary)] uppercase tracking-tighter italic">
                            Quản lý <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">Người dùng</span>
                        </h1>
                        <p className="text-[var(--text-secondary)]/60 text-sm font-medium tracking-wide leading-relaxed italic uppercase max-w-lg">
                            Quản lý danh sách thành viên và phân quyền truy cập hệ thống.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="px-8 py-5 bg-[var(--bg-card)]/40 backdrop-blur-xl border border-[var(--border-primary)] rounded-2xl shadow-xl group/stat hover:border-amber-500/30 transition-all duration-500">
                        <span className="text-[var(--text-secondary)]/40 text-[9px] font-black uppercase tracking-[0.3em] block mb-1 italic">Tổng số người dùng</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-[var(--text-primary)] group-hover:text-amber-500 transition-colors leading-none">{totalElements}</span>
                            <span className="text-[10px] font-black text-[var(--text-secondary)]/30 uppercase italic">Thành viên</span>
                        </div>
                    </div>
                    <Button 
                        onClick={handleCreate} 
                        className="h-16 px-10 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl shadow-2xl shadow-amber-500/10 transition-all hover:-translate-y-1 active:scale-95 italic"
                    >
                        <Plus size={18} className="mr-3" /> Thêm người dùng
                    </Button>
                </div>
            </div>

                {/* Main Content Area */}
                <div className="bg-[var(--bg-card)]/40 backdrop-blur-3xl rounded-3xl border border-[var(--border-primary)] overflow-hidden shadow-2xl relative">
                    {/* Toolbar */}
                    <div className="p-10 border-b border-[var(--border-primary)] bg-[var(--text-primary)]/[0.02]">
                        <div className="flex flex-col xl:flex-row gap-10 items-center justify-between">
                            <div className="relative w-full xl:w-[500px] group">
                                <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]/30 group-focus-within:text-amber-500 transition-colors z-10" />
                                <Input
                                    type="text"
                                    placeholder="Tìm kiếm tên hoặc email..."
                                    className="pl-16 h-16 w-full bg-[var(--bg-root)]/50 border-[var(--border-primary)] focus:border-amber-500/50 rounded-2xl font-bold text-sm tracking-tight italic"
                                    value={searchTerm}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                                <div className="p-3 bg-amber-500/5 rounded-xl text-amber-500/50 mr-2 hidden sm:block border border-amber-500/10">
                                    <Filter size={18} />
                                </div>
                                {['ALL', ...roles.map(r => r.roleName).filter(Boolean)].map((role) => (
                                    <button
                                        key={role}
                                        onClick={() => setRoleFilter(role)}
                                        className={cn(
                                            "px-6 py-3 rounded-2xl text-[10px] font-black tracking-widest transition-all whitespace-nowrap border uppercase italic",
                                            roleFilter === role
                                                ? "bg-amber-500 border-amber-500 text-black shadow-[0_10px_30px_rgba(245,158,11,0.3)]"
                                                : "bg-[var(--bg-root)]/40 border-[var(--border-primary)] text-[var(--text-secondary)]/60 hover:text-[var(--text-primary)] hover:border-amber-500/30"
                                        )}
                                    >
                                        {role === 'ALL' ? 'Tất cả vị trí' : role?.replace(/_/g, ' ') || 'Chưa xác định'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[var(--text-primary)]/[0.03] border-b border-[var(--border-primary)] text-[9px] uppercase text-[var(--text-secondary)]/40 font-black tracking-[0.4em] italic">
                                    <th className="px-10 py-7">Họ và tên</th>
                                    <th className="px-10 py-7">Vai trò</th>
                                    <th className="px-10 py-7">Trạng thái</th>
                                    <th className="px-10 py-7 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-primary)]/20">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-24 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4" />
                                                <span className="text-[var(--text-secondary)] text-[10px] font-black tracking-widest uppercase">Đang truy xuất...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-24 text-center text-[var(--text-secondary)]/60 font-medium italic">
                                            Không có dữ liệu người dùng.
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user, idx) => (
                                        <tr
                                            key={user.userId}
                                            className="hover:bg-[var(--text-primary)]/[0.02] transition-all group animate-in fade-in slide-in-from-left-4 duration-500 ease-out"
                                            style={{ animationDelay: `${idx * 50}ms` }}
                                        >
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-5">
                                                    <div className="relative group/avatar">
                                                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-black font-black text-xl shadow-lg transition-transform duration-500 group-hover/avatar:scale-110 italic border border-amber-400/20">
                                                            {(user.fullName || user.username || '?').charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-[var(--bg-card)] ${user.status === 'ACTIVE' ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' :
                                                            user.status === 'PENDING_VERIFICATION' ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]' :
                                                                'bg-[var(--text-secondary)]/20'
                                                            }`} />
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-[var(--text-primary)] text-lg tracking-tight italic uppercase group-hover:text-amber-500 transition-colors leading-tight">{user.fullName || user.username || 'N/A'}</div>
                                                        <div className="text-[var(--text-secondary)]/50 text-[10px] flex items-center mt-1 font-black uppercase tracking-widest italic leading-none">
                                                            <Mail size={12} className="mr-2 text-amber-500/40" />
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={`h-1.5 w-1.5 rounded-full ${user.roleName === 'ADMIN' ? 'bg-amber-500' :
                                                            user.roleName === 'MANAGER' ? 'bg-orange-500' :
                                                                user.roleName === 'STORE_STAFF' ? 'bg-emerald-500' :
                                                                    'bg-amber-500'
                                                            }`} />
                                                        <span className="text-[10px] font-black text-[var(--text-primary)]/80 uppercase tracking-widest italic group-hover:text-amber-500 transition-colors">
                                                            {(() => {
                                                                const rName = user.roleName || (user as any).role || 'N/A';
                                                                if (rName === 'N/A') return 'N/A';
                                                                const formatted = rName.replace('ROLE_', '').replace(/_/g, ' ');
                                                                if (formatted === 'ADMIN') return 'TỔNG QUẢN TRỊ';
                                                                if (formatted === 'MANAGER') return 'QUẢN LÝ CHI NHÁNH';
                                                                if (formatted === 'STORE STAFF') return 'NHÂN VIÊN ĐIỂM BÁN';
                                                                if (formatted === 'KITCHEN STAFF') return 'CHUYÊN VIÊN BẾP';
                                                                if (formatted === 'COORDINATOR') return 'ĐIỀU PHỐI VIÊN';
                                                                return formatted;
                                                            })()}
                                                        </span>
                                                    </div>
                                                    {(user.storeName || user.kitchenName) && (
                                                        <div className="text-[9px] text-[var(--text-secondary)]/40 font-black flex items-center gap-2 ml-4 italic uppercase tracking-tighter">
                                                            {user.storeName ? <Store size={10} className="text-amber-500/50" /> : <Warehouse size={10} className="text-orange-500/50" />}
                                                            {user.storeName || user.kitchenName}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                {user.status === 'ACTIVE' ? (
                                                    <div className="flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 bg-emerald-500/5 border border-emerald-500/10 px-4 py-2 rounded-xl w-fit italic">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-3 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                        Hoạt động
                                                    </div>
                                                ) : user.status === 'PENDING_VERIFICATION' ? (
                                                    <div className="flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 bg-amber-500/5 border border-amber-500/10 px-4 py-2 rounded-xl w-fit italic">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-3 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                                        Chờ xác minh
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]/40 bg-[var(--bg-root)] border border-[var(--border-primary)] px-4 py-2 rounded-xl w-fit italic">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)]/30 mr-3" />
                                                        Vô hiệu hóa
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(user)}
                                                        className="h-9 w-9 p-0 bg-[var(--bg-root)] border border-[var(--border-primary)] hover:bg-amber-600 hover:border-amber-500 hover:text-white rounded-xl transition-all"
                                                    >
                                                        <Edit2 size={14} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(user.userId)}
                                                        className="h-9 w-9 p-0 bg-[var(--bg-root)] border border-[var(--border-primary)] hover:bg-red-600 hover:border-red-500 hover:text-white rounded-xl transition-all"
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

                    {/* Pagination */}
                    <div className="bg-[var(--text-primary)]/[0.02] px-10 py-8 border-t border-[var(--border-primary)] flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4 order-2 md:order-1">
                            <span className="text-[10px] text-[var(--text-secondary)]/40 font-black uppercase tracking-[0.3em] italic leading-none">
                                {totalElements > 0 ? (
                                    <>Hiển thị <span className="text-amber-500 font-black">{startItem}-{endItem}</span> trên tổng số <span className="text-[var(--text-primary)] font-black">{totalElements}</span> người dùng</>
                                ) : (
                                    'Dữ liệu trống'
                                )}
                            </span>
                        </div>
                        <div className="flex gap-4 order-1 md:order-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === 0}
                                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                                className="border-[var(--border-primary)] bg-[var(--bg-root)]/50 text-[var(--text-secondary)] hover:text-amber-500 hover:border-amber-500/30 rounded-2xl px-8 h-12 font-black uppercase text-[10px] tracking-widest transition-all italic disabled:opacity-20"
                            >
                                Trang trước
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage >= totalPages - 1}
                                onClick={() => setCurrentPage((p) => p + 1)}
                                className="border-[var(--border-primary)] bg-[var(--bg-root)]/50 text-[var(--text-secondary)] hover:text-amber-500 hover:border-amber-500/30 rounded-2xl px-8 h-12 font-black uppercase text-[10px] tracking-widest transition-all italic disabled:opacity-20"
                            >
                                Trang tiếp
                            </Button>
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
                    title="Vô hiệu hóa tài khoản"
                    message="Bạn có chắc chắn muốn vô hiệu hóa tài khoản này? Người dùng sẽ không thể truy cập vào hệ thống."
                    confirmText="Xác nhận"
                    cancelText="Hủy bỏ"
                    isLoading={isDeleting}
                    variant="danger"
                />
            </div>
        </div>
    );
};
