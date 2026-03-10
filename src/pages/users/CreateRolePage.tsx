import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, ShieldCheck, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { roleApi } from '../../services/role.api';
import type { RoleResponse, Privilege } from '../../types/role';
import { cn } from '../../utils/classNames';

const roleSchema = z.object({
    roleName: z.string().min(2, 'Role name is required'),
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
                toast.error("Failed to load required data.");
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

                toast.success('Role updated successfully');
            } else {
                await roleApi.createRole({
                    roleName: data.roleName,
                    privilegeIds: selectedPrivilegeIds
                });
                toast.success('Role created successfully');
            }
            navigate('/users/roles');
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Action failed');
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
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/users/roles')}
                    className="hover:bg-zinc-800/80 rounded-full p-2 h-auto"
                >
                    <ArrowLeft size={20} className="text-gray-400" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-200 tracking-tight flex items-center gap-2">
                        <ShieldCheck size={24} className="text-amber-500" />
                        {isViewOnly ? 'View Role Details' : isEditMode ? 'Edit Role Configuration' : 'Create System Role'}
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                        {existingRole
                            ? `Managing access and permissions for ${existingRole.roleName}`
                            : 'Define a new secure role and assign administrative access rights.'}
                    </p>
                </div>
            </div>

            <Card className="p-6 md:p-8 border-0 shadow-sm ring-1 ring-zinc-700 bg-zinc-900/50">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    <div className="space-y-8">
                        {/* Role Name Section */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 block">
                                Role Identifier <span className="text-amber-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <ShieldCheck size={16} className="text-gray-400" />
                                </div>
                                <input
                                    {...register('roleName')}
                                    placeholder="e.g. STORE_MANAGER"
                                    disabled={isViewOnly}
                                    className={cn(
                                        "w-full pl-10 pr-3 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-zinc-950/50 text-gray-200 transition-all",
                                        errors.roleName ? "border-red-500/50 focus:ring-red-500" : "border-zinc-700/80 focus:ring-amber-500"
                                    )}
                                />
                            </div>
                            {errors.roleName && (
                                <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                                    <Info size={14} /> {errors.roleName.message}
                                </p>
                            )}
                        </div>

                        {/* Privileges Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-white">Access Privileges</h3>
                                    <p className="text-sm text-zinc-400">Select the modular permissions this role provides.</p>
                                </div>
                                <div className="text-xs bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full border border-amber-500/20 font-medium shrink-0">
                                    {selectedPrivilegeIds.length} Selected
                                </div>
                            </div>

                            {availablePrivileges.length === 0 ? (
                                <div className="bg-zinc-900/50 border border-zinc-800 border-dashed rounded-xl p-8 text-center">
                                    <ShieldCheck className="mx-auto h-12 w-12 text-zinc-700 mb-3" />
                                    <p className="text-zinc-400">No privileges found in the system registry.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {Object.entries(groupedPrivileges).map(([group, privs]) => {
                                        const privIds = privs.map((p: any) => p.id || p.privilegeId);
                                        const isAllSelected = privIds.every((id: number) => selectedPrivilegeIds.includes(id));

                                        return (
                                            <div key={group} className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl overflow-hidden shadow-sm">
                                                <div className="px-4 py-3 bg-zinc-900/80 border-b border-zinc-800/80 flex justify-between items-center">
                                                    <h4 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">{group}</h4>
                                                    {!isViewOnly && (
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleGroup(privIds)}
                                                            className="text-xs font-semibold text-amber-500 hover:text-amber-400 focus:outline-none"
                                                        >
                                                            {isAllSelected ? "Deselect All" : "Select All"}
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="p-2 space-y-1">
                                                    {privs.map((privilege: any) => {
                                                        const privId = privilege.id || privilege.privilegeId;
                                                        const privName = privilege.name || privilege.privilegeName || '';
                                                        const isChecked = selectedPrivilegeIds.includes(privId);
                                                        return (
                                                            <label
                                                                key={privId}
                                                                className={cn(
                                                                    "flex items-center gap-3 p-2.5 rounded-lg transition-colors border border-transparent",
                                                                    isChecked ? "bg-amber-500/5 border-amber-500/20" : "hover:bg-zinc-800/50",
                                                                    isViewOnly ? "cursor-default opacity-80" : "cursor-pointer"
                                                                )}
                                                            >
                                                                <div className="relative flex items-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="peer h-4 w-4 shrink-0 rounded border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-amber-500/30 focus:ring-offset-0 focus:ring-offset-zinc-950"
                                                                        checked={isChecked}
                                                                        disabled={isViewOnly}
                                                                        onChange={() => !isViewOnly && togglePrivilege(privId)}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <span className={cn("font-medium block leading-none text-sm", isChecked ? "text-amber-500" : "text-zinc-300")}>
                                                                        {privName.split('_')[0]}
                                                                    </span>
                                                                    {privilege.description && (
                                                                        <span className="text-[11px] text-zinc-500 mt-1 block leading-tight">{privilege.description}</span>
                                                                    )}
                                                                </div>
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
                    </div>

                    <div className="pt-6 border-t border-zinc-800 flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/users/roles')}
                            disabled={isSubmitting}
                        >
                            {isViewOnly ? 'Back to Roles' : 'Cancel'}
                        </Button>
                        {!isViewOnly && (
                            <Button
                                type="submit"
                                className="bg-amber-600 hover:bg-amber-700 text-white min-w-[160px]"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center gap-2">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Saving...
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Save size={18} />
                                        Save Configuration
                                    </div>
                                )}
                            </Button>
                        )}
                    </div>
                </form>
            </Card>
        </div>
    );
};
