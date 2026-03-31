import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, ShieldCheck, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '../../components/ui/Button';
import { roleApi } from '../../services/role.api';
import type { RoleResponse, Privilege } from '../../types/role';
import { cn } from '../../utils/classNames';
import securityAuthBg from '../../assets/security_auth.png';

const roleSchema = z.object({
    roleName: z.string().min(2, 'Tên vai trò là bắt buộc'),
});

type RoleFormData = z.infer<typeof roleSchema>;

export const CreateRolePage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const locationState = location.state as { role?: RoleResponse, isViewOnly?: boolean } | null;
    const existingRole = locationState?.role;
    const isViewOnly = locationState?.isViewOnly || false;
    const isEditMode = !!existingRole && !isViewOnly;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [availablePrivileges, setAvailablePrivileges] = useState<Privilege[]>([]);
    const [selectedPrivilegeIds, setSelectedPrivilegeIds] = useState<number[]>([]);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<RoleFormData>({
        resolver: zodResolver(roleSchema),
        defaultValues: { roleName: '' }
    });

    useEffect(() => {
        const fetchPrivilegesAndData = async () => {
            try {
                const allRoles = await roleApi.getAllRoles();

                const uniquePrivs = new Map<number, Privilege>();
                allRoles.forEach(r => {
                    r.privileges?.forEach((p: any) => {
                        const id = p.id || p.privilegeId;
                        if (id !== undefined && !uniquePrivs.has(id)) {
                            uniquePrivs.set(id, p);
                        }
                    });
                });
                setAvailablePrivileges(Array.from(uniquePrivs.values()).sort((a: any, b: any) => {
                    const nameA = a.name || a.privilegeName || '';
                    const nameB = b.name || b.privilegeName || '';
                    return nameA.localeCompare(nameB);
                }));

                if (existingRole) {
                    reset({ roleName: existingRole.roleName });
                    setSelectedPrivilegeIds(existingRole.privileges?.map((p: any) => p.id || p.privilegeId) || []);
                }
            } catch (error) {
                console.error("Failed to fetch initial data", error);
                toast.error("Không thể tải dữ liệu cần thiết.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchPrivilegesAndData();
    }, [existingRole, reset]);

    const groupedPrivileges = useMemo(() => {
        const groups: Record<string, Privilege[]> = {};
        availablePrivileges.forEach((p: any) => {
            const privName = p.name || p.privilegeName || '';
            const parts = privName.split('_');
            const entity = parts.length > 1 ? parts.slice(1).join(' ') : 'GENERAL';
            if (!groups[entity]) groups[entity] = [];
            groups[entity].push(p);
        });
        return groups;
    }, [availablePrivileges]);

    const togglePrivilege = (id: number) => {
        if (selectedPrivilegeIds.includes(id)) {
            setSelectedPrivilegeIds(prev => prev.filter(pId => pId !== id));
        } else {
            setSelectedPrivilegeIds(prev => [...prev, id]);
        }
    };

    const toggleGroup = (privilegeIds: number[]) => {
        const allSelected = privilegeIds.every(id => selectedPrivilegeIds.includes(id));
        if (allSelected) {
            setSelectedPrivilegeIds(prev => prev.filter(id => !privilegeIds.includes(id)));
        } else {
            const newIds = privilegeIds.filter(id => !selectedPrivilegeIds.includes(id));
            setSelectedPrivilegeIds(prev => [...prev, ...newIds]);
        }
    };

    const onSubmit = async (data: RoleFormData) => {
        if (isViewOnly) return;

        setIsSubmitting(true);
        try {
            if (existingRole) {
                await roleApi.updateRole(existingRole.roleId, {
                    roleName: data.roleName,
                    privilegeIds: selectedPrivilegeIds
                });

                const oldPrivIds = existingRole.privileges?.map((p: any) => p.id || p.privilegeId) || [];
                const privsToAdd = selectedPrivilegeIds.filter(id => !oldPrivIds.includes(id));
                const privsToRemove = oldPrivIds.filter(id => !selectedPrivilegeIds.includes(id));

                if (privsToAdd.length > 0) {
                    await roleApi.assignPrivilegesToRole(existingRole.roleId, privsToAdd);
                }
                if (privsToRemove.length > 0) {
                    await roleApi.removePrivilegesFromRole(existingRole.roleId, privsToRemove);
                }

                toast.success('Đã cập nhật vai trò thành công');
            } else {
                await roleApi.createRole({
                    roleName: data.roleName,
                    privilegeIds: selectedPrivilegeIds
                });
                toast.success('Đã tạo vai trò thành công');
            }
            navigate('/users/roles');
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Thao tác thất bại');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-amber-500 opacity-20"></div>
            </div>
        );
    }

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
                    <button
                        onClick={() => navigate('/users/roles')}
                        className="group flex items-center gap-3 text-amber-500 hover:text-amber-400 transition-all mb-8 w-fit bg-amber-500/5 px-6 py-3 rounded-2xl border border-amber-500/10 backdrop-blur-md"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-black tracking-[0.3em] uppercase italic">Quay lại</span>
                    </button>

                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-[2px] w-16 bg-amber-500/50" />
                        <span className="text-amber-500 font-black tracking-[0.4em] text-[10px] uppercase italic">Cấu hình Phân quyền</span>
                    </div>

                    <h1 className="text-6xl md:text-7xl font-black text-[var(--text-primary)] tracking-tighter mb-4 italic uppercase leading-none">
                        {isEditMode ? 'HIỆU CHỈNH' : isViewOnly ? 'HỒ SƠ' : 'THIẾT LẬP'} <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">VAI TRÒ</span>
                    </h1>
                    <p className="text-[var(--text-secondary)]/60 max-w-2xl text-lg font-medium leading-relaxed italic uppercase tracking-wider">
                        {existingRole
                            ? `Thiết lập quyền cho vai trò ${existingRole.roleName.replace(/_/g, ' ')}`
                            : 'Thiết lập quyền truy cập cho toàn hệ thống'}
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 -mt-16 relative z-10">
                <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Left Column: Basic Info */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="bg-[var(--bg-card)]/60 backdrop-blur-3xl border border-[var(--border-primary)] rounded-3xl p-10 space-y-10 shadow-2xl">
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 pb-4 border-b border-[var(--border-primary)]/10">
                                    <div className="p-3 bg-amber-500/10 rounded-xl">
                                        <Info size={20} className="text-amber-500" />
                                    </div>
                                    <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight italic uppercase">Thông tin Vai trò</h3>
                                </div>

                                <div className="space-y-3 group/field">
                                    <label className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] ml-2 italic">Mã vai trò</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none transition-transform group-focus-within/field:scale-110">
                                            <ShieldCheck size={18} className="text-[var(--text-secondary)]/30 group-focus-within/field:text-amber-500" />
                                        </div>
                                        <input
                                            {...register('roleName')}
                                            placeholder="VD: ADMIN, MANAGER..."
                                            disabled={isViewOnly}
                                            className={cn(
                                                "w-full pl-16 pr-6 py-5 bg-[var(--bg-root)]/50 border rounded-2xl text-[var(--text-primary)] font-bold placeholder:text-[var(--text-secondary)]/20 focus:outline-none focus:ring-4 transition-all italic text-sm",
                                                errors.roleName
                                                    ? 'border-red-500/40 focus:ring-red-500/5'
                                                    : 'border-[var(--border-primary)] focus:ring-amber-500/5 focus:border-amber-500/30'
                                            )}
                                        />
                                    </div>
                                    {errors.roleName && (
                                        <p className="text-red-500 text-[9px] font-black uppercase tracking-widest mt-2 ml-4 italic">{errors.roleName.message}</p>
                                    )}
                                </div>

                                <p className="text-[10px] text-[var(--text-secondary)]/40 leading-relaxed font-bold uppercase tracking-tight italic mt-6 bg-[var(--bg-root)]/50 p-4 rounded-2xl border border-[var(--border-primary)]/10">
                                    Sử dụng chữ in hoa, không dấu (VD: ADMIN_MANAGER)
                                </p>
                            </div>

                            {!isViewOnly && (
                                <div className="pt-10 border-t border-[var(--border-primary)]/10 flex flex-col gap-4">
                                    <Button
                                        type="submit"
                                        className={cn(
                                            "h-16 px-8 rounded-2xl font-black tracking-widest uppercase text-[10px] shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] italic",
                                            isSubmitting
                                                ? 'bg-[var(--bg-card)] text-[var(--text-secondary)]/30 border border-[var(--border-primary)] cursor-not-allowed opacity-50'
                                                : 'bg-amber-500 hover:bg-amber-600 text-black border-none shadow-amber-500/20'
                                        )}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <div className="flex items-center gap-3">
                                                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                                <span>Đang lưu...</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <Save size={18} />
                                                <span>{isEditMode ? 'Lưu vai trò' : 'Tạo vai trò'}</span>
                                            </div>
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => navigate('/users/roles')}
                                        disabled={isSubmitting}
                                        className="h-14 px-8 rounded-2xl bg-[var(--bg-root)]/50 border border-[var(--border-primary)]/80 text-[var(--text-secondary)]/40 hover:text-amber-500 hover:border-amber-500/20 transition-all font-black uppercase text-[10px] tracking-widest italic"
                                    >
                                        Hủy
                                    </Button>
                                </div>
                            )}

                            {isViewOnly && (
                                <Button
                                    type="button"
                                    onClick={() => navigate('/users/roles')}
                                    className="h-16 w-full px-8 rounded-2xl bg-amber-500 hover:bg-amber-600 text-black font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-amber-500/20 transition-all italic flex items-center justify-center gap-3"
                                >
                                    <ArrowLeft size={16} /> Quay lại danh sách
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Privileges Console */}
                    <div className="lg:col-span-8 space-y-10">
                        <div className="flex items-center justify-between bg-[var(--bg-card)]/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-[var(--border-primary)] shadow-xl">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight italic uppercase">Phân quyền</h3>
                                <p className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest italic opacity-40 leading-none">Chọn quyền cho vai trò</p>
                            </div>
                            <div className="bg-amber-500/5 border border-amber-500/20 px-6 py-3 rounded-2xl">
                                <span className="text-amber-500 text-sm font-black tracking-[0.2em] italic uppercase">
                                    {selectedPrivilegeIds.length} <span className="text-[9px] opacity-60 ml-2">quyền được chọn</span>
                                </span>
                            </div>
                        </div>

                        <div className="space-y-8 h-[calc(100vh-450px)] pr-4 custom-scrollbar overflow-y-auto">
                            {availablePrivileges.length === 0 ? (
                                <div className="bg-[var(--bg-card)]/20 border-2 border-dashed border-[var(--border-primary)] rounded-3xl py-32 text-center">
                                    <ShieldCheck className="mx-auto h-20 w-20 text-[var(--text-secondary)]/10 mb-8" />
                                    <p className="text-[var(--text-secondary)]/30 font-black uppercase tracking-[0.3em] text-[10px] italic">Hệ thống chưa nạp dữ liệu đặc quyền</p>
                                </div>
                            ) : (
                                Object.entries(groupedPrivileges).map(([group, privs]) => {
                                    const privIds = privs.map((p: any) => p.id || p.privilegeId);
                                    const isAllSelected = privIds.every((id: number) => selectedPrivilegeIds.includes(id));

                                    return (
                                        <div key={group} className="bg-[var(--bg-card)]/40 backdrop-blur-3xl border border-[var(--border-primary)] rounded-3xl overflow-hidden shadow-xl hover:border-amber-500/20 transition-all duration-700 group/section">
                                            <div className="px-10 py-6 bg-[var(--text-primary)]/[0.02] border-b border-[var(--border-primary)]/10 flex justify-between items-center">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)]"></div>
                                                    <h4 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-[0.3em] italic">{group === 'GENERAL' ? 'QUYỀN CHUNG' : group}</h4>
                                                </div>
                                                {!isViewOnly && (
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleGroup(privIds)}
                                                        className="text-[9px] font-black text-amber-500/60 hover:text-amber-500 uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-amber-500/5 transition-all italic border border-transparent hover:border-amber-500/10"
                                                    >
                                                        {isAllSelected ? "Hủy chọn tất cả" : "Chọn tất cả"}
                                                    </button>
                                                )}
                                            </div>
                                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {privs.map((privilege: any) => {
                                                    const privId = privilege.id || privilege.privilegeId;
                                                    const privName = privilege.name || privilege.privilegeName || '';
                                                    const isChecked = selectedPrivilegeIds.includes(privId);
                                                    return (
                                                        <label
                                                            key={privId}
                                                            className={cn(
                                                                "relative flex items-center gap-5 p-5 rounded-2xl transition-all duration-500 border overflow-hidden group/item",
                                                                isChecked
                                                                    ? "bg-amber-500/[0.03] border-amber-500/20 shadow-lg shadow-amber-500/5 scale-[1.02]"
                                                                    : "bg-[var(--bg-root)]/50 border-[var(--border-primary)]/60 hover:border-amber-500/20 hover:scale-[1.01]",
                                                                isViewOnly ? "cursor-default" : "cursor-pointer active:scale-[0.98]"
                                                            )}
                                                        >
                                                            {isChecked && (
                                                                <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-40"></div>
                                                            )}
                                                            <div className="relative flex items-center">
                                                                <input
                                                                    type="checkbox"
                                                                    className="peer h-6 w-6 rounded-lg border-[var(--border-primary)] bg-[var(--bg-root)] text-amber-500 focus:ring-0 focus:ring-offset-0 transition-all checked:bg-amber-500 cursor-pointer"
                                                                    checked={isChecked}
                                                                    disabled={isViewOnly}
                                                                    onChange={() => !isViewOnly && togglePrivilege(privId)}
                                                                />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <span className={cn(
                                                                    "text-sm font-black block leading-none transition-all duration-300 italic uppercase tracking-tight",
                                                                    isChecked ? "text-amber-500 scale-105 origin-left" : "text-[var(--text-secondary)]/50 group-hover/item:text-amber-500/60"
                                                                )}>
                                                                    {privName.replace(/CÓ_THỂ_/g, '').replace(/CÓ THỂ /g, '').replace(/_/g, ' ')}
                                                                </span>
                                                                {privilege.description && (
                                                                    <span className="text-[9px] text-[var(--text-secondary)]/30 font-bold uppercase mt-2 block truncate tracking-tighter italic">
                                                                        {privilege.description}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {isChecked && (
                                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,1)] animate-pulse"></div>
                                                            )}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </form>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: var(--border-primary);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: var(--amber-500);
                }
            `}</style>
        </div>
    );
};
