import React, { useEffect, useState, useMemo } from 'react';
import { X, Save, ShieldCheck, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '../../components/ui/Button';
import { roleApi } from '../../services/role.api';
import type { RoleResponse, Privilege } from '../../types/role';
import { cn } from '../../utils/classNames';

interface RoleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmitComplete: () => void;
    role: RoleResponse | null;
    allRoles: RoleResponse[];
    isViewOnly?: boolean;
}

const roleSchema = z.object({
    roleName: z.string().min(2, 'Role name is required'),
});

type RoleFormData = z.infer<typeof roleSchema>;

export const RoleModal: React.FC<RoleModalProps> = ({ isOpen, onClose, onSubmitComplete, role, allRoles, isViewOnly = false }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
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
    }, [allRoles]);

    useEffect(() => {
        if (role) {
            reset({ roleName: role.roleName });
            setSelectedPrivilegeIds(role.privileges?.map((p: any) => p.id || p.privilegeId) || []);
        } else {
            reset({ roleName: '' });
            setSelectedPrivilegeIds([]);
        }
    }, [role, reset]);

    const groupedPrivileges = useMemo(() => {
        const groups: Record<string, Privilege[]> = {};
        availablePrivileges.forEach((p: any) => {
            const privName = p.name || p.privilegeName || '';
            const parts = privName.split('_');
            // Typical format: VERB_ENTITY_NAME
            const entity = parts.length > 1 ? parts.slice(1).join(' ') : 'GENERAL';
            if (!groups[entity]) groups[entity] = [];
            groups[entity].push(p);
        });
        return groups;
    }, [availablePrivileges]);

    if (!isOpen) return null;

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
        setIsSubmitting(true);
        try {
            if (role) {
                await roleApi.updateRole(role.roleId, {
                    roleName: data.roleName,
                    privilegeIds: selectedPrivilegeIds
                });

                const oldPrivIds = role.privileges?.map((p: any) => p.id || p.privilegeId) || [];
                const privsToAdd = selectedPrivilegeIds.filter(id => !oldPrivIds.includes(id));
                const privsToRemove = oldPrivIds.filter(id => !selectedPrivilegeIds.includes(id));

                if (privsToAdd.length > 0) {
                    await roleApi.assignPrivilegesToRole(role.roleId, privsToAdd);
                }
                if (privsToRemove.length > 0) {
                    await roleApi.removePrivilegesFromRole(role.roleId, privsToRemove);
                }

                toast.success('Role updated successfully');
            } else {
                await roleApi.createRole({
                    roleName: data.roleName,
                    privilegeIds: selectedPrivilegeIds
                });
                toast.success('Role created successfully');
            }
            onSubmitComplete();
            onClose();
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Action failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-zinc-950 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-zinc-800 animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex justify-between items-start p-6 border-b border-zinc-800 bg-zinc-900/50">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                            <ShieldCheck className="text-amber-500" />
                            {role ? 'Edit Role Configuration' : 'Create System Role'}
                        </h2>
                        <p className="text-zinc-400 text-sm mt-1">
                            {role ? `Managing access and permissions for ${role.roleName}` : 'Define a new secure role and assign administrative access rights.'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-zinc-500 hover:text-white hover:bg-zinc-800 p-2 rounded-xl transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="overflow-hidden flex flex-col flex-1">
                    <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">
                        <div className="space-y-8">

                            {/* Role Name Section */}
                            <div className="space-y-3 bg-zinc-900/50 p-5 rounded-xl border border-zinc-800/50">
                                <label className="text-sm font-semibold text-zinc-300">
                                    Role Identifier <span className="text-amber-500">*</span>
                                </label>
                                <input
                                    {...register('roleName')}
                                    placeholder="e.g. STORE_MANAGER"
                                    className={cn(
                                        "w-full px-4 py-3 bg-zinc-950 border rounded-lg text-white text-base focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all shadow-inner",
                                        errors.roleName ? "border-red-500/50 focus:border-red-500" : "border-zinc-800 focus:border-amber-500"
                                    )}
                                />
                                {errors.roleName && (
                                    <p className="text-red-500 text-sm flex items-center gap-1 mt-1">
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
                                    <div className="text-xs bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full border border-amber-500/20 font-medium">
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
                    </div>

                    <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3 shrink-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800 px-6"
                        >
                            {isViewOnly ? 'Close' : 'Cancel'}
                        </Button>
                        {!isViewOnly && (
                            <Button
                                type="submit"
                                className="bg-amber-600 hover:bg-amber-700 text-white min-w-[140px] shadow-lg"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Saving...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Save size={16} />
                                        Save Configuration
                                    </span>
                                )}
                            </Button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};
