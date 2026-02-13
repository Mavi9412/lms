import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../services/api';

interface AddUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUserAdded: () => void;
}

interface Program {
    id: number;
    name: string;
}

export default function AddUserModal({ isOpen, onClose, onUserAdded }: AddUserModalProps) {
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');
    const [programId, setProgramId] = useState<number | null>(null);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchPrograms();
        }
    }, [isOpen]);

    const fetchPrograms = async () => {
        try {
            const response = await api.get('/academic/programs');
            setPrograms(response.data);
        } catch (error) {
            console.error('Failed to fetch programs', error);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.post('/admin/users', {
                email,
                full_name: fullName,
                password,
                role,
                program_id: role === 'student' ? programId : null
            });

            onUserAdded();
            onClose();

            // Reset form
            setEmail('');
            setFullName('');
            setPassword('');
            setRole('student');
            setProgramId(null);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-xl shadow-2xl">
                <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">Add New User</h2>
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
                            required
                            minLength={6}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            placeholder="••••••••"
                        />
                        <p className="text-xs text-gray-400 mt-1">Minimum 6 characters</p>
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
                            {loading ? 'Creating...' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
