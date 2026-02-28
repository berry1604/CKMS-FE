import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Shield, Settings } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { roleApi } from '../../services/role.api';
import type { RoleResponse } from '../../types/role';
import { RoleModal } from './RoleModal';
import { toast } from 'react-hot-toast';

export const RolesList = () => {
    const [roles, setRoles] = useState<RoleResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<RoleResponse | null>(null);
    const [isViewMode, setIsViewMode] = useState(false);

    const loadRoles = async () => {
        setIsLoading(true);
        try {
            const data = await roleApi.getAllRoles();
            setRoles(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load roles');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadRoles();
    }, []);

    const handleCreate = () => {
        setSelectedRole(null);
        setIsViewMode(false);
        setIsModalOpen(true);
    };

    const handleEdit = (role: RoleResponse) => {
        setSelectedRole(role);
        setIsViewMode(false);
        setIsModalOpen(true);
    };

    const handleView = (role: RoleResponse) => {
        setSelectedRole(role);
        setIsViewMode(true);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this role?')) {
            try {
                await roleApi.deleteRole(id);
                toast.success('Role deleted successfully');
                loadRoles();
            } catch (error) {
                console.error(error);
                toast.error('Failed to delete role');
            }
        }
    };

    const handleSubmitComplete = () => {
        loadRoles();
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-10">
            {/* Header section with gradient and glow */}
            <div className="relative overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 p-8 shadow-2xl">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-medium mb-4">
                            <Shield size={14} /> System Security
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">
                            Role & Access Control
                        </h1>
                        <p className="text-zinc-400 max-w-xl">
                            Configure security roles and assign granular privileges to manage what users can see and do across the Central Kitchen and Franchise network.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                        <div className="flex items-center gap-4 bg-zinc-950/50 p-3 rounded-xl border border-zinc-800 w-full sm:w-auto">
                            <div className="text-center px-4 border-r border-zinc-800">
                                <div className="text-2xl font-bold text-white">{roles.length}</div>
                                <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Active Roles</div>
                            </div>
                            <div className="text-center px-4">
                                <div className="text-2xl font-bold text-amber-500">
                                    {roles.reduce((acc, curr) => acc + (curr.privileges?.length || 0), 0)}
                                </div>
                                <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Total Privileges</div>
                            </div>
                        </div>
                        <Button
                            onClick={handleCreate}
                            className="bg-amber-600 hover:bg-amber-700 text-white shadow-lg focus:ring-amber-500 w-full sm:w-auto py-6 rounded-xl"
                        >
                            <Plus className="mr-2 h-5 w-5" /> Create New Role
                        </Button>
                    </div>
                </div>
            </div>

            {/* Table of Roles */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mb-4"></div>
                    <p className="text-zinc-500 animate-pulse">Loading security configurations...</p>
                </div>
            ) : roles.length === 0 ? (
                <div className="text-center py-20 bg-zinc-900/30 border border-zinc-800 border-dashed rounded-2xl">
                    <Shield className="mx-auto h-12 w-12 text-zinc-600 mb-4" />
                    <h3 className="text-lg font-medium text-zinc-300">No roles found</h3>
                    <p className="text-zinc-500 mt-1">Get started by creating your first system role.</p>
                </div>
            ) : (
                <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-zinc-900/80 border-b border-zinc-800/80 text-zinc-400">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Role Name</th>
                                    <th className="px-6 py-4 font-semibold">Role ID</th>
                                    <th className="px-6 py-4 font-semibold text-center">Privileges Count</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                {roles.map((role) => (
                                    <tr key={role.roleId} className="hover:bg-zinc-900/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 flex items-center justify-center">
                                                    <Settings className="text-amber-500 w-4 h-4" />
                                                </div>
                                                <span className="font-bold text-white tracking-tight">{role.roleName?.replace(/_/g, ' ')}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-500 font-mono">
                                            {role.roleId}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge variant="secondary" className="bg-zinc-800 text-amber-500 font-semibold pointer-events-none">
                                                {role.privileges?.length || 0}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 px-3 text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center gap-1.5"
                                                    onClick={() => handleView(role)}
                                                >
                                                    <Shield size={14} /> View Details
                                                </Button>
                                                <button
                                                    onClick={() => handleEdit(role)}
                                                    className="p-1.5 text-zinc-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-md transition-colors"
                                                    title="Edit configuration"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(role.roleId)}
                                                    className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                                                    title="Revoke role"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <RoleModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmitComplete={handleSubmitComplete}
                role={selectedRole}
                allRoles={roles}
                isViewOnly={isViewMode}
            />
        </div>
    );
};
