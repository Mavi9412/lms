import React, { useState } from 'react';
import { X, BookOpen, Loader2 } from 'lucide-react';
import api from '../services/api';

interface CreateCourseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCourseCreated: () => void;
}

const CreateCourseModal = ({ isOpen, onClose, onCourseCreated }: CreateCourseModalProps) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        level: 'Beginner'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/courses/', formData);
            onCourseCreated();
            onClose();
            setFormData({ title: '', description: '', level: 'Beginner' });
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to create course');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-[#1a1f2e] border border-white/10 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        Create New Course
                    </h2>
                    <button onClick={onClose} className="text-text-secondary hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1.5">Course Title</label>
                            <input
                                type="text"
                                required
                                className="w-full bg-bg-secondary border border-white/10 rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all placeholder:text-gray-600"
                                placeholder="e.g. Advanced React Patterns"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1.5">Description</label>
                            <textarea
                                required
                                rows={4}
                                className="w-full bg-bg-secondary border border-white/10 rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all placeholder:text-gray-600 resize-none"
                                placeholder="What will students learn in this course?"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1.5">Difficulty Level</label>
                            <div className="relative">
                                <select
                                    className="w-full bg-bg-secondary border border-white/10 rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all appearance-none cursor-pointer"
                                    value={formData.level}
                                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                >
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn btn-primary py-2.5 font-medium shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                            >
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                {loading ? 'Creating...' : 'Create Course'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateCourseModal;
