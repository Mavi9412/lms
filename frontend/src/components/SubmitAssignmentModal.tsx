import React, { useState } from 'react';
import { X, Upload, Link } from 'lucide-react';
import api from '../services/api';

interface SubmitAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    assignmentId: number;
    assignmentTitle: string;
    onSubmitted: () => void;
}

const SubmitAssignmentModal = ({ isOpen, onClose, assignmentId, assignmentTitle, onSubmitted }: SubmitAssignmentModalProps) => {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.post(`/assignments/${assignmentId}/submit`, {
                content
            });
            onSubmitted();
            onClose();
            setContent('');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to submit assignment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-bg-secondary border border-white/10 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Upload className="w-5 h-5 text-primary" />
                        Submit Assignment
                    </h2>
                    <button onClick={onClose} className="text-text-secondary hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <p className="text-text-secondary text-sm">
                        Submit work for: <span className="font-semibold text-white">{assignmentTitle}</span>
                    </p>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Submission Content (URL or Text)</label>
                        <div className="relative">
                            <Link className="absolute left-3 top-3 w-5 h-5 text-text-secondary" />
                            <textarea
                                required
                                rows={4}
                                className="w-full bg-bg-primary border border-white/10 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-gray-600 resize-none"
                                placeholder="Paste your Google Doc link, GitHub repo, or answer text here..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
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
                            {loading ? 'Submitting...' : 'Submit Work'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SubmitAssignmentModal;
