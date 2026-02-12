import React, { useState } from 'react';
import { X, Upload, Link as LinkIcon, FileText } from 'lucide-react';
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
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [dragActive, setDragActive] = useState(false);

    if (!isOpen) return null;

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('content', content);
            if (file) {
                formData.append('file', file);
            }

            await api.post(`/assignments/${assignmentId}/submit`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            onSubmitted();
            onClose();
            setContent('');
            setFile(null);
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

                    {/* File Upload */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Upload File (Optional)</label>
                        <div
                            className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${dragActive
                                ? 'border-primary bg-primary/5'
                                : 'border-white/10 hover:border-white/20'
                                }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <input
                                type="file"
                                id="file-upload"
                                className="hidden"
                                onChange={handleFileChange}
                                accept=".pdf,.doc,.docx,.txt,.zip,.png,.jpg,.jpeg"
                            />
                            <label htmlFor="file-upload" className="cursor-pointer">
                                {file ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <FileText className="w-5 h-5 text-primary" />
                                        <span className="text-sm text-white">{file.name}</span>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setFile(null);
                                            }}
                                            className="ml-2 text-red-400 hover:text-red-300"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <Upload className="w-8 h-8 mx-auto mb-2 text-text-secondary" />
                                        <p className="text-sm text-text-secondary">
                                            Drag and drop or <span className="text-primary">browse</span>
                                        </p>
                                        <p className="text-xs text-text-secondary mt-1">
                                            PDF, DOC, DOCX, TXT, ZIP, Images
                                        </p>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Text Content */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                            Submission Text/Link (Optional)
                        </label>
                        <div className="relative">
                            <LinkIcon className="absolute left-3 top-3 w-5 h-5 text-text-secondary" />
                            <textarea
                                rows={4}
                                className="w-full bg-bg-primary border border-white/10 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-gray-600 resize-none"
                                placeholder="Add a note, link, or additional info..."
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
                            disabled={loading || (!file && !content)}
                            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
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
