import { useState } from 'react';
import { X, Upload, File as FileIcon } from 'lucide-react';
import api from '../../services/api';

interface Assignment {
    id: number;
    title: string;
    description: string;
    due_date: string;
    max_points: number;
}

interface SubmitAssignmentModalProps {
    assignment: Assignment;
    onClose: () => void;
    onSuccess: () => void;
}

const SubmitAssignmentModal = ({ assignment, onClose, onSuccess }: SubmitAssignmentModalProps) => {
    const [content, setContent] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
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

        if (!file && !content.trim()) {
            alert('Please provide either a file or written content');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('content', content);
            if (file) {
                formData.append('file', file);
            }

            await api.post(`/assignments/${assignment.id}/submit`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            onSuccess();
        } catch (error: any) {
            console.error('Failed to submit assignment:', error);
            alert(error.response?.data?.detail || 'Failed to submit assignment');
        } finally {
            setLoading(false);
        }
    };

    const isOverdue = new Date() > new Date(assignment.due_date);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-bg-secondary rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
                {/* Header */}
                <div className="sticky top-0 bg-bg-secondary border-b border-white/10 p-6 flex items-start justify-between z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">Submit Assignment</h2>
                        <p className="text-text-secondary">{assignment.title}</p>
                        {isOverdue && (
                            <p className="text-red-400 text-sm mt-1">⚠️ This assignment is overdue</p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-text-secondary" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Assignment Details */}
                    <div className="p-4 bg-bg-primary rounded-lg border border-white/5">
                        <h3 className="text-sm font-medium text-white mb-2">Assignment Details</h3>
                        <p className="text-sm text-text-secondary mb-3">{assignment.description}</p>
                        <div className="flex items-center gap-4 text-sm">
                            <span className="text-text-secondary">
                                Due: {new Date(assignment.due_date).toLocaleString()}
                            </span>
                            <span className="text-text-secondary">
                                Worth: {assignment.max_points} points
                            </span>
                        </div>
                    </div>

                    {/* Written Content */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            Written Response (Optional)
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Enter your response or notes here..."
                            rows={4}
                            className="w-full px-4 py-3 bg-bg-primary border border-white/10 rounded-lg text-white placeholder-text-secondary focus:outline-none focus:border-primary resize-none"
                        />
                    </div>

                    {/* File Upload */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            Attach File {!content.trim() && '(Required if no written content)'}
                        </label>
                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive
                                    ? 'border-primary bg-primary/10'
                                    : 'border-white/20 hover:border-white/40'
                                }`}
                        >
                            {file ? (
                                <div className="flex items-center justify-center gap-3">
                                    <FileIcon className="w-8 h-8 text-primary" />
                                    <div className="text-left">
                                        <p className="text-white font-medium">{file.name}</p>
                                        <p className="text-sm text-text-secondary">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFile(null)}
                                        className="ml-4 px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <Upload className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                                    <p className="text-white mb-2">
                                        Drag and drop your file here or
                                    </p>
                                    <label className="inline-block px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg cursor-pointer transition-colors">
                                        <input
                                            type="file"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            accept=".pdf,.doc,.docx,.txt,.zip,.rar"
                                        />
                                        Browse Files
                                    </label>
                                    <p className="text-sm text-text-secondary mt-2">
                                        Supported: PDF, DOC, DOCX, TXT, ZIP, RAR (Max 50MB)
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-bg-primary hover:bg-white/10 text-white rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || (!file && !content.trim())}
                            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${loading || (!file && !content.trim())
                                    ? 'bg-gray-500 cursor-not-allowed text-gray-300'
                                    : isOverdue
                                        ? 'bg-red-500 hover:bg-red-600 text-white'
                                        : 'bg-primary hover:bg-primary/90 text-white'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-5 h-5" />
                                    {isOverdue ? 'Submit Late' : 'Submit Assignment'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SubmitAssignmentModal;
