import { useState } from 'react';
import { X } from 'lucide-react';
import api from '../../services/api';

interface Props {
    courseId: string;
    onClose: () => void;
    onSuccess: () => void;
}

const CreateLessonModal = ({ courseId, onClose, onSuccess }: Props) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!title.trim() || !content.trim()) {
            setError('Title and content are required');
            return;
        }
        setLoading(true);
        try {
            await api.post(`/courses/${courseId}/lessons`, {
                title: title.trim(),
                content: content.trim(),
                order: 0,
                course_id: Number(courseId),
            });
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to create lesson');
        } finally {
            setLoading(false);
        }
    };

    const inputClass =
        'w-full px-4 py-2.5 bg-bg-primary border border-white/10 rounded-lg focus:outline-none focus:border-primary transition-colors text-white text-sm';

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
            <div className="bg-bg-secondary rounded-xl border border-white/10 max-w-xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-2xl font-bold text-white">Add Lesson</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Title *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className={inputClass}
                            placeholder="Lesson title"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Content *</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className={`${inputClass} min-h-[160px]`}
                            placeholder="Lesson content..."
                        />
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                        >
                            {loading ? 'Adding...' : 'Add Lesson'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateLessonModal;
