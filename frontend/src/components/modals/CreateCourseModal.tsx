import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../../services/api';

interface Department {
    id: number;
    name: string;
}

interface CreateCourseModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

const CreateCourseModal = ({ onClose, onSuccess }: CreateCourseModalProps) => {
    const [formData, setFormData] = useState({
        title: '',
        code: '',
        credit_hours: '3',
        department_id: '',
        description: '',
    });
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            const response = await api.get('/academic/departments');
            setDepartments(response.data);
        } catch (error) {
            console.error('Failed to fetch departments:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = {
                title: formData.title,
                code: formData.code.toUpperCase(),
                credit_hours: parseInt(formData.credit_hours),
                department_id: parseInt(formData.department_id),
                description: formData.description || null,
                is_approved: true, // Admin-created courses are auto-approved
                is_published: false, // Admin can publish later
            };

            await api.post('/admin/courses', data);
            onSuccess();
            onClose();
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to create course');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-bg-secondary rounded-xl border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white">Create New Course</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">
                                Course Title *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g., Introduction to Programming"
                                className="w-full px-4 py-3 bg-bg-primary border border-white/10 rounded-lg focus:outline-none focus:border-primary transition-colors text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">
                                Course Code *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                placeholder="e.g., CS-101"
                                className="w-full px-4 py-3 bg-bg-primary border border-white/10 rounded-lg focus:outline-none focus:border-primary transition-colors text-white uppercase"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">
                                Department *
                            </label>
                            <select
                                required
                                value={formData.department_id}
                                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                                className="w-full px-4 py-3 bg-bg-primary border border-white/10 rounded-lg focus:outline-none focus:border-primary transition-colors text-white"
                            >
                                <option value="">Select Department</option>
                                {departments.map(dept => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">
                                Credit Hours *
                            </label>
                            <input
                                type="number"
                                required
                                min="1"
                                max="6"
                                value={formData.credit_hours}
                                onChange={(e) => setFormData({ ...formData, credit_hours: e.target.value })}
                                className="w-full px-4 py-3 bg-bg-primary border border-white/10 rounded-lg focus:outline-none focus:border-primary transition-colors text-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Course description..."
                            rows={4}
                            className="w-full px-4 py-3 bg-bg-primary border border-white/10 rounded-lg focus:outline-none focus:border-primary transition-colors text-white resize-none"
                        />
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-blue-300">
                        <p className="font-medium mb-1">📝 Note:</p>
                        <p>Admin-created courses are auto-approved but not published. You can publish them later from the course list.</p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-blue-500 text-white rounded-lg hover:shadow-lg hover:shadow-primary/50 transition-shadow font-medium disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Course'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateCourseModal;
