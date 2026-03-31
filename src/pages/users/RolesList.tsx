import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Shield, Settings } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { roleApi } from '../../services/role.api';
import type { RoleResponse } from '../../types/role';
import { toast } from 'react-hot-toast';
import securityAuthBg from '../../assets/security_auth.png';

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
        <div className="min-h-screen bg-[var(--bg-root)] animate-in fade-in duration-700 pb-20">
            {/* Cinematic Header Area */}
            <div className="relative h-[400px] w-full overflow-hidden">
                <img
                    src={securityAuthBg}
                    className="w-full h-full object-cover scale-105 motion-safe:animate-[pulse_10s_ease-in-out_infinite] opacity-40 dark:opacity-60"
                    alt="Security Infrastructure Background"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-card)]/80 via-[var(--bg-card)]/20 to-[var(--bg-root)] backdrop-blur-[2px]" />

                <div className="absolute inset-0 flex flex-col justify-end px-8 pb-16 max-w-7xl mx-auto w-full">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="h-[2px] w-16 bg-amber-500/50" />
                                <span className="text-amber-500 font-black tracking-[0.4em] text-[10px] uppercase italic">Hệ thống Phân quyền</span>
                            </div>

                            <h1 className="text-6xl md:text-7xl font-black text-[var(--text-primary)] tracking-tighter mb-4 italic uppercase leading-none">
                                QUẢN LÝ <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">VAI TRÒ</span>
                            </h1>
                            <p className="text-[var(--text-secondary)]/60 max-w-2xl text-lg font-medium leading-relaxed italic uppercase tracking-wider">
                                Thiết lập và kiểm soát quyền truy cập trong toàn bộ hệ thống
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 w-full lg:w-auto pb-2">
                            <div className="flex items-center gap-6 bg-[var(--bg-card)]/40 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-amber-500/10 shadow-2xl">
                                <div className="text-center px-6 border-r border-[var(--border-primary)]/20">
                                    <div className="text-4xl font-black text-[var(--text-primary)] tracking-tighter italic leading-none">{roles.length}</div>
                                    <div className="text-[9px] uppercase tracking-[0.2em] text-[var(--text-secondary)]/40 font-black mt-1 italic">Vai trò</div>
                                </div>
                                <div className="text-center px-6">
                                    <div className="text-4xl font-black text-amber-500 tracking-tighter italic leading-none">
                                        {roles.reduce((acc, curr) => acc + (curr.privileges?.length || 0), 0)}
                                    </div>
                                    <div className="text-[9px] uppercase tracking-[0.2em] text-[var(--text-secondary)]/40 font-black mt-1 italic">Quyền</div>
                                </div>
                            </div>

                            <Button
                                onClick={handleCreate}
                                className="bg-amber-500 hover:bg-amber-600 text-black font-black uppercase text-[10px] tracking-widest px-10 h-16 shadow-[0_20px_40px_rgba(245,158,11,0.2)] hover:shadow-[0_25px_50px_rgba(245,158,11,0.3)] border-0 flex items-center gap-3 rounded-2xl transition-all duration-300 transform hover:-translate-y-1 italic"
                            >
                                <Plus size={18} /> Tạo vai trò mới
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* List Section */}
            <div className="max-w-7xl mx-auto px-8 -mt-10 relative z-10">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-40 space-y-6 bg-[var(--bg-card)]/40 backdrop-blur-3xl border border-[var(--border-primary)] rounded-[3rem]">
                        <div className="relative">
                            <div className="h-24 w-24 rounded-full border-t-2 border-amber-500 animate-spin opacity-20"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Shield className="text-amber-500 h-10 w-10 animate-pulse" />
                            </div>
                        </div>
                        <p className="text-[var(--text-secondary)] font-black tracking-[0.3em] text-[10px] uppercase italic">Đang đồng bộ ma trận đặc quyền...</p>
                    </div>
                ) : roles.length === 0 ? (
                    <div className="text-center py-40 bg-[var(--bg-card)]/40 backdrop-blur-3xl border border-[var(--border-primary)] rounded-[3rem] group">
                        <div className="mx-auto h-24 w-24 bg-[var(--bg-root)]/50 rounded-[2rem] flex items-center justify-center mb-8 border border-[var(--border-primary)] group-hover:border-amber-500/30 transition-all duration-700">
                            <Shield className="h-10 w-10 text-[var(--text-secondary)]/20 group-hover:text-amber-500 transition-colors" />
                        </div>
                        <h3 className="text-3xl font-black text-[var(--text-primary)] uppercase tracking-tighter italic">Cơ cấu rỗng</h3>
                        <p className="text-[var(--text-secondary)]/40 mt-4 max-w-sm mx-auto font-medium italic uppercase text-xs tracking-wider">Hệ thống chưa thiết lập vai trò vận hành. Hãy bắt đầu bằng cách khởi tạo vai trò quản trị đầu tiên.</p>
                        <Button
                            onClick={handleCreate}
                            className="mt-10 bg-transparent text-amber-500 hover:text-amber-400 border border-amber-500/20 hover:border-amber-500/40 px-8 py-4 rounded-xl font-black text-[10px] tracking-widest uppercase italic transition-all"
                        >
                            Thiết lập ngay
                        </Button>
                    </div>
                ) : (
                    <div className="bg-[var(--bg-card)]/60 backdrop-blur-3xl border border-[var(--border-primary)] rounded-[3rem] overflow-hidden shadow-2xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead>
                                    <tr className="bg-[var(--text-primary)]/[0.03] border-b border-[var(--border-primary)]">
                                        <th className="px-10 py-8 font-black text-[var(--text-secondary)]/40 text-[10px] uppercase tracking-[0.3em] italic">Vai trò</th>
                                        <th className="px-10 py-8 font-black text-[var(--text-secondary)]/40 text-[10px] uppercase tracking-[0.3em] italic">Mã</th>
                                        <th className="px-10 py-8 font-black text-[var(--text-secondary)]/40 text-[10px] uppercase tracking-[0.3em] italic text-center">Quyền</th>
                                        <th className="px-10 py-8 font-black text-[var(--text-secondary)]/40 text-[10px] uppercase tracking-[0.3em] italic text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-primary)]/10">
                                    {roles.map((role) => (
                                        <tr key={role.roleId} className="hover:bg-[var(--text-primary)]/[0.02] transition-all duration-500 group/row">
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-6">
                                                    <div className="relative">
                                                        <div className="absolute inset-0 bg-amber-500/20 blur-xl opacity-0 group-hover/row:opacity-100 transition-opacity duration-700"></div>
                                                        <div className="relative w-14 h-14 rounded-2xl bg-[var(--bg-root)]/80 border border-[var(--border-primary)] flex items-center justify-center group-hover/row:border-amber-500/30 group-hover/row:scale-110 transition-all duration-500">
                                                            <Settings size={22} className="text-[var(--text-secondary)]/30 group-hover/row:text-amber-500 transition-colors" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="block font-black text-[var(--text-primary)] text-xl tracking-tighter group-hover/row:text-amber-500 transition-colors uppercase italic">
                                                            {role.roleName?.replace(/_/g, ' ')}
                                                        </span>
                                                        <span className="block text-[10px] text-[var(--text-secondary)]/30 font-black uppercase tracking-[0.2em] italic">Hồ sơ hệ thống</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40"></div>
                                                    <span className="text-[var(--text-secondary)] font-mono text-[11px] tabular-nums bg-emerald-500/5 px-3 py-1.5 rounded-lg border border-emerald-500/10 text-emerald-600/70">
                                                        ID_{role.roleId.toString().padStart(4, '0')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                <div className="inline-flex items-center gap-4">
                                                    <div className="h-1.5 w-16 bg-[var(--bg-root)] rounded-full overflow-hidden border border-[var(--border-primary)]/40">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-amber-600 to-orange-500 transition-all duration-1000 group-hover/row:scale-x-110"
                                                            style={{ width: `${Math.min(100, (role.privileges?.length || 0) * 10)}%` }}
                                                        ></div>
                                                    </div>
                                                    <Badge className="bg-amber-500/5 text-amber-500 font-black border border-amber-500/20 px-4 py-1.5 rounded-xl text-[10px] tracking-widest italic">
                                                        {role.privileges?.length || 0}
                                                    </Badge>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <div className="flex justify-end items-center gap-4">
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => handleView(role)}
                                                        className="h-12 px-6 text-[var(--text-secondary)]/40 hover:text-amber-500 hover:bg-amber-500/5 border border-transparent hover:border-amber-500/20 rounded-xl flex items-center gap-3 font-black text-[9px] tracking-widest uppercase italic transition-all"
                                                    >
                                                        <Shield size={14} className="text-amber-500/50" /> Xem chi tiết
                                                    </Button>
                                                    <div className="w-px h-6 bg-[var(--border-primary)]/20 mx-1"></div>
                                                    <button
                                                        onClick={() => handleEdit(role)}
                                                        className="p-3 text-[var(--text-secondary)]/30 hover:text-amber-500 hover:bg-amber-500/10 rounded-xl transition-all duration-300 hover:scale-110 border border-transparent hover:border-amber-500/20"
                                                        title="Chỉnh sửa cơ cấu"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(role.roleId)}
                                                        className="p-3 text-[var(--text-secondary)]/30 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all duration-300 hover:scale-110 border border-transparent hover:border-red-500/20"
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
                        <div className="bg-[var(--text-primary)]/[0.02] px-10 py-8 border-t border-[var(--border-primary)]/10 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <div className="text-[10px] text-[var(--text-secondary)]/30 font-black uppercase tracking-[0.3em] italic">
                                    Giao thức bảo mật: AES-256 (High Priority)
                                </div>
                            </div>
                            <div className="text-[10px] text-[var(--text-secondary)]/30 font-black uppercase tracking-[0.3em] italic">
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
                title="XÁC NHẬN GỠ BỎ THỰC THỂ"
                message="Bạn sắp thực hiện gỡ bỏ một vai trò hệ thống. Toàn bộ các tài khoản liên kết sẽ mất quyền truy cập tương ứng. Đây là một quyết định quan trọng và không thể hoàn tác."
                confirmText="XÁC NHẬN TRUY QUÉT"
                cancelText="HỦY BỎ"
                isLoading={isDeleting}
                variant="danger"
            />
        </div>
    );
};
