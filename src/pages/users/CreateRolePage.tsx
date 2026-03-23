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

const roleSchema = z.object({
    roleName: z.string().min(2, 'Tên vai trò là bắt buộc'),
});

type RoleFormData = z.infer<typeof roleSchema>;

export const CreateRolePage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // The role data is passed via router state for Edit/View modes
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-10 max-w-6xl mx-auto pb-20 px-4">
            {/* Header with Glassmorphism */}
            <div className="relative p-1 rounded-3xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 shadow-2xl">
                <div className="relative bg-zinc-950/80 backdrop-blur-xl rounded-[22px] p-8 border border-white/5 overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none"></div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => navigate('/users/roles')}
                                className="group/back flex items-center justify-center w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 transition-all duration-300"
                            >
                                <ArrowLeft size={20} className="text-zinc-500 group-hover/back:text-amber-500 transition-colors" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                                    <ShieldCheck size={32} className="text-amber-500" />
                                    {isViewOnly ? 'Hồ sơ Cơ cấu' : isEditMode ? 'Hiệu chỉnh Đặc quyền' : 'Thiết lập Vai trò'}
                                </h1>
                                <p className="text-zinc-400 font-medium mt-1">
                                    {existingRole
                                        ? `Cấu hình ma trận đặc quyền cho thực thể ${existingRole.roleName}`
                                        : 'Xây dựng kiến trúc bảo mật mới cho hệ thống vận hành.'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 bg-zinc-900/50 p-2 rounded-2xl border border-zinc-800/80">
                            <div className="px-4 py-2 text-center">
                                <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Trạng thái</div>
                                <div className="flex items-center gap-2 justify-center">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span className="text-[10px] font-black text-emerald-500 uppercase">Live System</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left Column: Basic Info */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 rounded-3xl p-8 space-y-8 sticky top-10 overflow-hidden">
                        {/* Luxury Visual Element */}
                        <div className="relative -mx-8 -mt-8 mb-8 group/img">
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-zinc-900/90 z-10"></div>
                            <div className="absolute inset-0 bg-amber-500/10 blur-3xl rounded-full scale-150 group-hover/img:bg-amber-500/20 transition-all duration-700"></div>
                            <img 
                                src="/src/assets/security_auth.png" 
                                alt="Security Core" 
                                className="w-full h-48 object-cover opacity-60 group-hover/img:opacity-80 group-hover/img:scale-110 transition-all duration-1000"
                            />
                            <div className="absolute bottom-4 left-6 z-20">
                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-950/80 backdrop-blur-md border border-amber-500/30">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></div>
                                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em]">Core Protocol</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-black text-white flex items-center gap-2">
                                <Info size={18} className="text-amber-500" /> Thông tin cơ bản
                            </h3>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] block ml-1">
                                    Định danh hệ thống
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <ShieldCheck size={18} className="text-zinc-600 transition-colors group-focus-within:text-amber-500" />
                                    </div>
                                    <input
                                        {...register('roleName')}
                                        placeholder="VD: ADMIN_SUPERVISOR"
                                        disabled={isViewOnly}
                                        className={cn(
                                            "w-full pl-12 pr-4 py-4 bg-zinc-950 border rounded-2xl text-sm font-bold focus:outline-none transition-all duration-300",
                                            errors.roleName 
                                                ? "border-red-500/50 focus:ring-4 focus:ring-red-500/10" 
                                                : "border-zinc-800 focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 text-white placeholder:text-zinc-700"
                                        )}
                                    />
                                    {errors.roleName && (
                                        <p className="mt-2 text-red-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                            <div className="w-1 h-1 rounded-full bg-red-500"></div> {errors.roleName.message}
                                        </p>
                                    )}
                                </div>
                                <p className="text-[11px] text-zinc-500 leading-relaxed px-2 mt-4 italic">
                                    Lưu ý: Tên định danh nên sử dụng chữ hoa và gạch nối để đồng bộ với cơ sở dữ liệu.
                                </p>
                            </div>
                        </div>

                        {!isViewOnly && (
                            <div className="pt-8 border-t border-zinc-800/50 space-y-4">
                                <Button
                                    type="submit"
                                    className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black py-7 rounded-2xl shadow-xl shadow-amber-900/20 transform transition-all active:scale-95 disabled:opacity-50"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ĐANG ĐỒNG BỘ...
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Save size={20} /> XÁC NHẬN CẤU HÌNH
                                        </div>
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => navigate('/users/roles')}
                                    className="w-full text-zinc-500 hover:text-white font-bold h-14 rounded-2xl"
                                    disabled={isSubmitting}
                                >
                                    HỦY BỎ THAO TÁC
                                </Button>
                            </div>
                        )}
                        
                        {isViewOnly && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate('/users/roles')}
                                className="w-full border-zinc-800 text-zinc-400 hover:text-white font-bold h-14 rounded-2xl"
                            >
                                QUAY LẠI DANH SÁCH
                            </Button>
                        )}
                    </div>
                </div>

                {/* Right Column: Privileges Console */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="flex items-center justify-between mb-2">
                        <div className="space-y-1">
                            <h3 className="text-xl font-black text-white tracking-tight">Khu vực Đặc quyền</h3>
                            <p className="text-xs text-zinc-500 font-medium">Bật/Tắt các phân hệ truy xuất dữ liệu</p>
                        </div>
                        <div className="bg-amber-500/10 border border-amber-500/30 px-5 py-2.5 rounded-2xl">
                            <span className="text-amber-500 text-sm font-black tracking-widest uppercase">
                                {selectedPrivilegeIds.length} <span className="text-[10px] opacity-70">Privileges Active</span>
                            </span>
                        </div>
                    </div>

                    {availablePrivileges.length === 0 ? (
                        <div className="bg-zinc-900/20 border-2 border-dashed border-zinc-800 rounded-3xl p-20 text-center">
                            <ShieldCheck className="mx-auto h-20 w-20 text-zinc-800 mb-6" />
                            <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">Chưa có dữ liệu đặc quyền</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(groupedPrivileges).map(([group, privs]) => {
                                const privIds = privs.map((p: any) => p.id || p.privilegeId);
                                const isAllSelected = privIds.every((id: number) => selectedPrivilegeIds.includes(id));

                                return (
                                    <div key={group} className="group/group bg-zinc-900/30 border border-zinc-800/50 rounded-3xl overflow-hidden hover:border-zinc-700/50 transition-all duration-300">
                                        <div className="px-8 py-5 bg-zinc-900/60 border-b border-zinc-800/50 flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                                <h4 className="text-xs font-black text-zinc-300 uppercase tracking-[0.2em]">{group}</h4>
                                            </div>
                                            {!isViewOnly && (
                                                <button
                                                    type="button"
                                                    onClick={() => toggleGroup(privIds)}
                                                    className="text-[10px] font-black text-amber-500 hover:text-amber-400 uppercase tracking-widest px-3 py-1.5 rounded-lg hover:bg-amber-500/10 transition-all"
                                                >
                                                    {isAllSelected ? "Gỡ tất cả" : "Kích hoạt nhóm"}
                                                </button>
                                            )}
                                        </div>
                                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {privs.map((privilege: any) => {
                                                const privId = privilege.id || privilege.privilegeId;
                                                const privName = privilege.name || privilege.privilegeName || '';
                                                const isChecked = selectedPrivilegeIds.includes(privId);
                                                return (
                                                    <label
                                                        key={privId}
                                                        className={cn(
                                                            "relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 border",
                                                            isChecked 
                                                                ? "bg-amber-500/10 border-amber-500/30 shadow-[0_0_20px_-10px_rgba(245,158,11,0.3)]" 
                                                                : "bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700",
                                                            isViewOnly ? "cursor-default opacity-80" : "cursor-pointer active:scale-[0.98]"
                                                        )}
                                                    >
                                                        <div className="relative flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                className="peer h-5 w-5 rounded-lg border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-offset-0 focus:ring-amber-500/30 bg-transparent"
                                                                checked={isChecked}
                                                                disabled={isViewOnly}
                                                                onChange={() => !isViewOnly && togglePrivilege(privId)}
                                                            />
                                                            <div className="absolute inset-0 bg-amber-500 rounded-lg scale-0 peer-checked:scale-100 transition-transform duration-300 -z-10 blur-md opacity-20"></div>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <span className={cn(
                                                                "text-sm font-black block leading-none transition-colors truncate",
                                                                isChecked ? "text-amber-400" : "text-zinc-400"
                                                            )}>
                                                                {privName.split('_')[0]}
                                                            </span>
                                                            {privilege.description && (
                                                                <span className="text-[10px] text-zinc-600 font-bold uppercase mt-1.5 block truncate tracking-tighter transition-colors group-hover:text-zinc-500">
                                                                    {privilege.description}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {isChecked && (
                                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,1)]"></div>
                                                        )}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
};
