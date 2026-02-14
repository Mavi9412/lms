import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../../services/api';

interface Announcement {
    id: number;
    course_id: number;
    title: string;
    content: string;
    is_pinned: boolean;
}

interface Props {
    courseId: number;
    courseName: string;
    announcement?: Announcement | null;
    onClose: () => void;
    onSuccess: () => void;
}

const CreateAnnouncementModal = ({ courseId, courseName, announcement, onClose, onSuccess }: Props) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isPinned, setIsPinned] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (announcement) {
            setTitle(announcement.title);
            setContent(announcement.content);
            setIsPinned(announcement.is_pinned);
        }
    }, [announcement]);

    const handleSubmit = async () => {
        if (!title.trim()) {
            setError('Please enter a title');
            return;
        }

        if (!content.trim()) {
            setError('Please enter content');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const data = {
                course_id: courseId,
                title: title.trim(),
                content: content.trim(),
                is_pinned: isPinned
            };

            if (announcement) {
                await api.put(`/announcements/${announcement.id}`, data);
            } else {
                await api.post('/announcements/', data);
            }

            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to save announcement');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-bg-secondary rounded-xl border border-white/10 max-w-3xl w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            {announcement ? 'Edit Announcement' : 'New Announcement'}
                        </h2>
                        <p className="text-text-secondary text-sm mt-1">{courseName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        disabled={loading}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    {error && (
                        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
                            {error}
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Title *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 bg-bg-primary border border-white/10 rounded-lg focus:outline-none focus:border-primary transition-colors text-white"
                            placeholder="e.g., Important: Class Cancelled Tomorrow"
                            maxLength={200}
                            disabled={loading}
                        />
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Content *
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full px-4 py-3 bg-bg-primary border border-white/10 rounded-lg focus:outline-none focus:border-primary transition-colors text-white min-h-[200px]"
                            placeholder="Write your announcement here..."
                            disabled={loading}
                        />
                        <p className="text-xs text-text-secondary mt-1">
                            {content.length} characters
                        </p>
                    </div>

                    {/* Pin Option */}
                    <div className="flex items-center gap-3 p-4 bg-bg-primary rounded-lg border border-white/10">
                        <input
                            type="checkbox"
                            id="isPinned"
                            checked={isPinned}
                            onChange={(e) => setIsPinned(e.target.checked)}
                            className="w-5 h-5 rounded border-white/20 bg-bg-secondary text-primary focus:ring-primary focus:ring-offset-0"
                            disabled={loading}
                        />
                        <label htmlFor="isPinned" className="flex-1 cursor-pointer">
                            <span className="text-white font-medium">Pin this announcement</span>
                            <p className="text-sm text-text-secondary">Pinned announcements appear at the top</p>
                        </label>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                                Saving...
                            </>
                        ) : (
                            <>{announcement ? 'Update' : 'Post'} Announcement</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateAnnouncementModal;
