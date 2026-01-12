import React, { useState, useEffect } from 'react';
import { X, BookOpen, Loader2 } from 'lucide-react';
import api from '../services/api';

interface Lesson {
    id: number;
    title: string;
    content: string;
    order: number;
    course_id: number;
}

interface EditLessonModalProps {
    isOpen: boolean;
    onClose: () => void;
    lesson: Lesson | null;
    onLessonUpdated: () => void;
    courseId: string | undefined;
}

const EditLessonModal = ({ isOpen, onClose, lesson, onLessonUpdated, courseId }: EditLessonModalProps) => {
    const [formData, setFormData] = useState({
        title: '',
        content: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (lesson) {
            setFormData({
                title: lesson.title,
                content: lesson.content,
            });
        }
    }, [lesson]);

    if (!isOpen || !lesson) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.put(`/courses/${courseId}/lessons/${lesson.id}`, formData);
            onLessonUpdated();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to update lesson');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-[#1a1f2e] border border-white/10 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        Edit Lesson
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
                            <label className="block text-sm font-medium text-text-secondary mb-1.5">Lesson Title</label>
                            <input
                                type="text"
                                required
                                className="w-full bg-bg-secondary border border-white/10 rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all placeholder:text-gray-600"
                                placeholder="e.g. Introduction to State"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1.5">Content</label>
                            <textarea
                                required
                                rows={10}
                                className="w-full bg-bg-secondary border border-white/10 rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all placeholder:text-gray-600 resize-none font-mono text-sm"
                                placeholder="Lesson content goes here..."
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            />
                        </div>

                        <div className="pt-2 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary px-6 py-2 shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                            >
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditLessonModal;
