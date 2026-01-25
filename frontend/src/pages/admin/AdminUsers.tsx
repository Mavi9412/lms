import { useEffect, useState } from 'react';
import { Trash2, User, Shield, GraduationCap, Search } from 'lucide-react';
import api from '../../services/api';

interface UserData {
    id: number;
    email: string;
    full_name: string;
    role: string;
    is_active: boolean;
}

const AdminUsers = () => {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState<'all' | 'student' | 'teacher' | 'admin'>('all');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/admin/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (userId: number) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

        try {
            await api.delete(`/admin/users/${userId}`);
            setUsers(users.filter(u => u.id !== userId));
        } catch (error) {
            alert('Failed to delete user');
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        return matchesSearch && matchesRole;
    });

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin':
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1 w-fit"><Shield className="w-3 h-3" /> Admin</span>;
            case 'teacher':
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1 w-fit"><User className="w-3 h-3" /> Teacher</span>;
            default:
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1 w-fit"><GraduationCap className="w-3 h-3" /> Student</span>;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">User Management</h1>
                    <p className="text-text-secondary">Manage system access and roles.</p>
                </div>
                {/* <button className="btn btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add User
                </button> */}
            </div>

            {/* Filters */}
            <div className="glass rounded-xl p-4 mb-6 border border-white/5 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="w-full bg-bg-primary/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 focus:ring-1 ring-primary outline-none text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    {(['all', 'student', 'teacher', 'admin'] as const).map(role => (
                        <button
                            key={role}
                            onClick={() => setFilterRole(role)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterRole === role
                                    ? 'bg-primary text-white'
                                    : 'bg-white/5 text-text-secondary hover:bg-white/10'
                                }`}
                        >
                            {role.charAt(0).toUpperCase() + role.slice(1)}s
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="glass rounded-xl border border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left bg-bg-secondary/30">
                        <thead className="text-text-secondary text-xs uppercase bg-black/20">
                            <tr>
                                <th className="px-6 py-4 font-medium">User</th>
                                <th className="px-6 py-4 font-medium">Role</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-xs">
                                                {user.full_name[0]}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm text-white">{user.full_name}</p>
                                                <p className="text-xs text-text-secondary">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getRoleBadge(user.role)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs px-2 py-1 rounded-md ${user.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="p-2 hover:bg-red-500/20 text-text-secondary hover:text-red-400 rounded-lg transition-colors"
                                            title="Delete User"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredUsers.length === 0 && (
                    <div className="p-8 text-center text-text-secondary">
                        No users found matching your filters.
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUsers;
