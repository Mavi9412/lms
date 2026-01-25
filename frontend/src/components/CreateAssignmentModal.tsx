import React, { useState } from 'react';
import { X, Calendar, FileText, CheckCircle } from 'lucide-react';
import api from '../services/api';

interface CreateAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    courseId: string;
    onAssignmentCreated: () => void;
}

const CreateAssignmentModal = ({ isOpen, onClose, courseId, onAssignmentCreated }: CreateAssignmentModalProps) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [maxPoints, setMaxPoints] = useState(100);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.post('/assignments/', {
                title,
                description,
                due_date: new Date(dueDate).toISOString(),
                max_points: maxPoints,
                course_id: parseInt(courseId)
            });
            onAssignmentCreated();
            onClose();
            // Reset form
            setTitle('');
            setDescription('');
            setDueDate('');
            setMaxPoints(100);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to create assignment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-bg-secondary border border-white/10 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        Create Assignment
                    </h2>
                    <button onClick={onClose} className="text-text-secondary hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Title</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-bg-primary border border-white/10 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-gray-600"
                            placeholder="e.g. Midterm Project"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                        <textarea
                            required
                            rows={4}
                            className="w-full bg-bg-primary border border-white/10 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-gray-600 resize-none"
                            placeholder="Describe the requirements..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Due Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                                <input
                                    type="datetime-local"
                                    required
                                    className="w-full bg-bg-primary border border-white/10 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-gray-600"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Max Points</label>
                            <div className="relative">
                                <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    className="w-full bg-bg-primary border border-white/10 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-gray-600"
                                    value={maxPoints}
                                    onChange={(e) => setMaxPoints(parseInt(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-text-secondary hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                        >
                            {loading ? 'Creating...' : 'Create Assignment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateAssignmentModal;
