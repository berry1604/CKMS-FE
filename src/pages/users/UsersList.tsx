import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Search, Filter, MoreVertical, Mail, Calendar, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { UserModal } from './UserModal';
import type { User, UserRole } from '../../types/user';

import { useNavigate } from 'react-router-dom';

export const UsersList = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            // Placeholder: Call API get users
            setUsers([]);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const handleCreate = () => {
        navigate('/users/create');
    };

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setIsModalOpen(true);
        setActiveMenu(null);
    };

    const handleDelete = async (_id: string) => {
        if (confirm('Are you sure you want to delete this user?')) {
            // await deleteUser(_id);
            loadUsers();
        }
        setActiveMenu(null);
    };

    const handleSubmit = async (_data: any) => {
        if (selectedUser) {
            // await updateUser(selectedUser.id, _data);
        } else {
            // await createUser(_data);
        }
        loadUsers();
    };

    const getRoleColor = (role: UserRole) => {
        const colors: Record<UserRole, any> = {
            ADMIN: 'primary',
            MANAGER: 'info',
            SUPPLY_COORDINATOR: 'warning',
            KITCHEN_STAFF: 'danger',
            STORE_STAFF: 'success',
            SYSTEM: 'default'
        };
        return colors[role];
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Team Members</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage your team's access and roles.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white px-3 py-1.5 rounded-md border border-gray-200 text-sm font-medium text-gray-600 shadow-sm">
                        <span className="text-gray-900 font-bold">{users.length}</span> Total Users
                    </div>
                    <Button onClick={handleCreate} className="shadow-sm">
                        <Plus className="mr-2 h-4 w-4" /> Add Member
                    </Button>
                </div>
            </div>

            {/* Toolbar */}
            <Card className="p-4">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={18} className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        <Filter size={16} className="text-gray-400 hidden md:block" />
                        <span className="text-sm text-gray-500 whitespace-nowrap hidden md:block">Filter by:</span>
                        {(['ALL', 'ADMIN', 'MANAGER', 'KITCHEN_STAFF', 'SUPPLY_COORDINATOR', 'STORE_STAFF'] as const).map((role) => (
                            <button
                                key={role}
                                onClick={() => setRoleFilter(role)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${roleFilter === role
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {role === 'ALL' ? 'All Roles' : role.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Enhanced Table (Desktop) */}
            <div className="hidden md:block">
                <Card className="overflow-hidden shadow-sm border-gray-200 p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                    <th className="px-6 py-4">Member</th>
                                    <th className="px-6 py-4">Role & Access</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Joined</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                                                Loading team members...
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            No members found matching your criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="relative">
                                                        <img
                                                            src={user.avatarUrl}
                                                            alt=""
                                                            className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                                                        />
                                                        <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="font-semibold text-gray-900">{user.name}</div>
                                                        <div className="text-gray-500 text-xs flex items-center mt-0.5">
                                                            <Mail size={10} className="mr-1" />
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant={getRoleColor(user.role)} className="shadow-sm">
                                                    {user.role.replace('_', ' ')}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center text-sm font-medium text-green-700 bg-green-50 px-2 py-1 rounded-md w-fit">
                                                    <CheckCircle size={12} className="mr-1.5" />
                                                    Active
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <Calendar size={14} className="mr-2 text-gray-400" />
                                                    {user.joinDate || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(user)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                        <Edit2 size={16} />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
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
                    <div className="bg-gray-50/50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <span className="text-sm text-gray-500">Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredUsers.length}</span> of <span className="font-medium">{filteredUsers.length}</span> members</span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled>Previous</Button>
                            <Button variant="outline" size="sm" disabled>Next</Button>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Mobile Grid View */}
            <div className="md:hidden grid grid-cols-1 gap-4">
                {isLoading ? (
                    <div className="text-center py-10 text-gray-500">Loading...</div>
                ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">No members found.</div>
                ) : (
                    filteredUsers.map((user) => (
                        <Card key={user.id} className="p-4 relative">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-3">
                                    <img
                                        src={user.avatarUrl}
                                        alt=""
                                        className="h-12 w-12 rounded-full object-cover ring-2 ring-gray-100"
                                    />
                                    <div>
                                        <h3 className="text-base font-semibold text-gray-900">{user.name}</h3>
                                        <div className="text-sm text-gray-500 flex items-center">
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
                                <Badge variant={getRoleColor(user.role)} className="shadow-none">
                                    {user.role.replace('_', ' ')}
                                </Badge>
                                <div className="flex items-center text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-md">
                                    <CheckCircle size={10} className="mr-1" /> Active
                                </div>
                            </div>

                            {/* Mobile Dropdown Menu */}
                            {activeMenu === user.id && (
                                <div className="absolute right-4 top-12 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-10 py-1 animate-in fade-in zoom-in-95 duration-200">
                                    <button
                                        onClick={() => handleEdit(user)}
                                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                                    >
                                        <Edit2 size={16} className="mr-3 text-blue-500" /> Edit Details
                                    </button>
                                    <div className="h-px bg-gray-100 my-1"></div>
                                    <button
                                        onClick={() => handleDelete(user.id)}
                                        className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center"
                                    >
                                        <Trash2 size={16} className="mr-3" /> Revoke Access
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
