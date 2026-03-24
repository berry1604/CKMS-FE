import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Shield, Settings } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { roleApi } from '../../services/role.api';
import type { RoleResponse } from '../../types/role';
import { toast } from 'react-hot-toast';

export const RolesList = () => {
    const navigate = useNavigate();
    const [roles, setRoles] = useState<RoleResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadRoles = async () => {
        setIsLoading(true);
        try {
            const data = await roleApi.getAllRoles();
            setRoles(data);
        } catch (error) {
            console.error(error);
            toast.error('Không thể tải danh sách vai trò');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadRoles();
    }, []);

    const handleCreate = () => {
        navigate('/users/roles/create');
    };

    const handleEdit = (role: RoleResponse) => {
        navigate(`/users/roles/${role.roleId}/edit`, { state: { role, isViewOnly: false } });
    };

    const handleView = (role: RoleResponse) => {
        navigate(`/users/roles/${role.roleId}/view`, { state: { role, isViewOnly: true } });
    };

    const handleDelete = (id: number) => {
        setRoleToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (roleToDelete) {
            setIsDeleting(true);
            try {
                await roleApi.deleteRole(roleToDelete);
                toast.success('Đã xóa vai trò thành công');
                loadRoles();
                setIsDeleteModalOpen(false);
            } catch (error) {
                console.error(error);
                toast.error('Xóa vai trò thất bại');
            } finally {
                setIsDeleting(false);
            }
        }
    };



    return (
        <div className="space-y-10 max-w-7xl mx-auto pb-20 px-4">
            {/* Cinematic Header Section */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800/50 p-10 shadow-3xl">
                    {/* Background Decorative Elements */}
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-orange-600/5 rounded-full blur-[100px] pointer-events-none"></div>
                    
                    <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] font-bold uppercase tracking-widest">
                                <Shield size={12} className="animate-pulse" /> Security Infrastructure
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight">
                                Quản lý <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Vai trò & Quyền</span>
                            </h1>
                            <p className="text-zinc-400 max-w-2xl text-lg font-medium leading-relaxed">
                                Cấu hình ma trận đặc quyền bảo mật và phân cấp truy cập để bảo vệ tài nguyên hệ thống trên toàn bộ mạng lưới chi nhánh.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 w-full lg:w-auto">
                            <div className="flex items-center gap-6 bg-zinc-950/60 backdrop-blur-md p-5 rounded-2xl border border-zinc-800/50 shadow-inner">
                                <div className="text-center px-4 border-r border-zinc-800/80">
                                    <div className="text-3xl font-black text-white">{roles.length}</div>
                                    <div className="text-[10px] uppercase tracking-tighter text-zinc-500 font-bold">Vai trò</div>
                                </div>
                                <div className="text-center px-4">
                                    <div className="text-3xl font-black text-amber-500">
                                        {roles.reduce((acc, curr) => acc + (curr.privileges?.length || 0), 0)}
                                    </div>
                                    <div className="text-[10px] uppercase tracking-tighter text-zinc-500 font-bold">Quyền hạn</div>
                                </div>
                            </div>
                            
                            <Button
                                onClick={handleCreate}
                                className="group/btn relative overflow-hidden bg-amber-600 hover:bg-amber-500 text-white shadow-2xl shadow-amber-900/20 px-8 py-7 rounded-2xl transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite] pointer-events-none"></div>
                                <span className="relative flex items-center gap-2 text-base font-bold">
                                    <Plus className="h-5 w-5" /> Khởi tạo vai trò mới
                                </span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* List Section */}
            <div className="relative">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                        <div className="relative">
                            <div className="h-20 w-20 rounded-full border-t-4 border-amber-500 animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Shield className="text-amber-500 h-8 w-8 animate-pulse" />
                            </div>
                        </div>
                        <p className="text-zinc-400 font-bold tracking-widest text-sm uppercase">Đang đồng bộ cấu hình bảo mật...</p>
                    </div>
                ) : roles.length === 0 ? (
                    <div className="text-center py-32 bg-zinc-900/20 backdrop-blur-sm border-2 border-dashed border-zinc-800/50 rounded-3xl group">
                        <div className="mx-auto h-20 w-20 bg-zinc-800/50 rounded-2xl flex items-center justify-center mb-6 border border-zinc-700/50 group-hover:border-amber-500/50 transition-colors">
                            <Shield className="h-10 w-10 text-zinc-600 group-hover:text-amber-500 transition-colors" />
                        </div>
                        <h3 className="text-2xl font-bold text-zinc-300">Nhân thức hệ rỗng</h3>
                        <p className="text-zinc-500 mt-2 max-w-sm mx-auto">Hệ thống chưa thiết lập vai trò vận hành. Hãy bắt đầu bằng cách khởi tạo vai trò quản trị đầu tiên.</p>
                        <Button 
                            onClick={handleCreate}
                            variant="ghost" 
                            className="mt-8 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 font-bold"
                        >
                            Thiết lập ngay
                        </Button>
                    </div>
                ) : (
                    <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-3xl overflow-hidden shadow-2xl">
                        <div className="overflow-x-auto overflow-y-hidden">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead>
                                    <tr className="bg-zinc-950/40 border-b border-zinc-800/80">
                                        <th className="px-8 py-6 font-black text-zinc-500 text-[11px] uppercase tracking-[0.2em] w-[40%]">Tên định danh</th>
                                        <th className="px-8 py-6 font-black text-zinc-500 text-[11px] uppercase tracking-[0.2em] w-[20%]">Mã định tuý</th>
                                        <th className="px-8 py-6 font-black text-zinc-500 text-[11px] uppercase tracking-[0.2em] text-center w-[15%]">Ma trận quyền</th>
                                        <th className="px-8 py-6 font-black text-zinc-500 text-[11px] uppercase tracking-[0.2em] text-right w-[25%]">Vận hành</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/30">
                                    {roles.map((role) => (
                                        <tr key={role.roleId} className="hover:bg-zinc-800/30 transition-all duration-500 group/row">
                                            <td className="px-8 py-7">
                                                <div className="flex items-center gap-5">
                                                    <div className="relative">
                                                        <div className="absolute inset-0 bg-amber-500/20 blur-md opacity-0 group-hover/row:opacity-100 transition-opacity"></div>
                                                        <div className="relative w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center group-hover/row:border-amber-500/50 group-hover/row:scale-110 transition-all duration-500">
                                                            <Settings size={20} className="text-zinc-600 group-hover/row:text-amber-500 transition-colors" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="block font-black text-white text-lg tracking-tight group-hover/row:text-amber-500 transition-colors">
                                                            {role.roleName?.replace(/_/g, ' ')}
                                                        </span>
                                                        <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Global Identity</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-7">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50"></div>
                                                    <span className="text-zinc-400 font-mono text-xs tabular-nums bg-zinc-950/50 px-3 py-1.5 rounded-lg border border-zinc-800/80">
                                                        ID_{role.roleId.toString().padStart(4, '0')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-7 text-center">
                                                <div className="inline-flex items-center gap-3">
                                                    <div className="h-1 w-12 bg-zinc-800 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-gradient-to-r from-amber-600 to-orange-500 transition-all duration-1000 group-hover/row:scale-x-110" 
                                                            style={{ width: `${Math.min(100, (role.privileges?.length || 0) * 10)}%` }}
                                                        ></div>
                                                    </div>
                                                    <Badge variant="secondary" className="bg-zinc-950 text-amber-500 font-black border border-amber-500/10 px-3 py-1 rounded-lg">
                                                        {role.privileges?.length || 0}
                                                    </Badge>
                                                </div>
                                            </td>
                                            <td className="px-8 py-7 text-right">
                                                <div className="flex justify-end items-center gap-3">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-10 px-4 text-zinc-500 hover:text-white hover:bg-zinc-800 border border-transparent hover:border-zinc-700/50 rounded-xl flex items-center gap-2 font-bold text-xs"
                                                        onClick={() => handleView(role)}
                                                    >
                                                        <Shield size={14} className="text-amber-500" /> CHI TIẾT
                                                    </Button>
                                                    <div className="w-px h-6 bg-zinc-800 mx-1"></div>
                                                    <button
                                                        onClick={() => handleEdit(role)}
                                                        className="p-2.5 text-zinc-500 hover:text-amber-500 hover:bg-amber-500/10 rounded-xl transition-all duration-300 hover:scale-110 border border-transparent hover:border-amber-500/20"
                                                        title="Chỉnh sửa cơ cấu"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(role.roleId)}
                                                        className="p-2.5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all duration-300 hover:scale-110 border border-transparent hover:border-red-500/20"
                                                        title="Gỡ bỏ thực thể"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="bg-zinc-950/60 p-6 border-t border-zinc-800/50 flex justify-between items-center">
                            <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.3em]">
                                Giao thức mã hóa: AES-256 đang bật
                            </div>
                            <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.3em]">
                                Đồng bộ lần cuối: {new Date().toLocaleTimeString()}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Xác nhận gỡ bỏ"
                message="Bạn sắp thực hiện gỡ bỏ một vai trò hệ thống. Toàn bộ các tài khoản liên kết sẽ mất quyền truy cập tương ứng. Đây là hành động không thể hoàn tác."
                confirmText="XÁC NHẬN GỠ BỎ"
                cancelText="HỦY BỎ"
                isLoading={isDeleting}
                variant="danger"
            />

            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
};
