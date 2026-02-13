import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../services/api';

interface EditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUserUpdated: () => void;
    user: {
        id: number;
        email: string;
        full_name: string;
        role: string;
        program_id?: number;
    } | null;
}

interface Program {
    id: number;
    name: string;
}

export default function EditUserModal({ isOpen, onClose, onUserUpdated, user }: EditUserModalProps) {
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');
    const [programId, setProgramId] = useState<number | null>(null);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && user) {
            setEmail(user.email);
            setFullName(user.full_name);
            setRole(user.role as 'student' | 'teacher' | 'admin');
            setProgramId(user.program_id || null);
            setPassword(''); // Reset password field
            fetchPrograms();
        }
    }, [isOpen, user]);

    const fetchPrograms = async () => {
        try {
            const response = await api.get('/academic/programs');
            setPrograms(response.data);
        } catch (error) {
            console.error('Failed to fetch programs', error);
        }
    };

    if (!isOpen || !user) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.patch(`/admin/users/${user.id}`, {
                email,
                full_name: fullName,
                password: password || undefined, // Only send if password is provided
                role,
                program_id: role === 'student' ? programId : null
            });

            onUserUpdated();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to update user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-xl shadow-2xl">
                <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">Edit User</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            placeholder="John Doe"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            placeholder="john@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={6}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            placeholder="Leave blank to keep current password"
                        />
                        <p className="text-xs text-gray-400 mt-1">Leave blank to keep current password</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as 'student' | 'teacher' | 'admin')}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        >
                            <option value="student">Student</option>
                            <option value="teacher">Teacher</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    {role === 'student' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Program</label>
                            <select
                                value={programId || ''}
                                onChange={(e) => setProgramId(e.target.value ? parseInt(e.target.value) : null)}
                                required
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            >
                                <option value="">Select a program</option>
                                {programs.map((program) => (
                                    <option key={program.id} value={program.id}>
                                        {program.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg font-semibold hover:from-teal-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Updating...' : 'Update User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
