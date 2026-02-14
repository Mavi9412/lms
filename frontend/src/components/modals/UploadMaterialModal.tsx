import { useState, useRef } from 'react';
import { X, Upload, FileText, Check } from 'lucide-react';
import api from '../../services/api';

interface Props {
    courseId: number;
    courseName: string;
    onClose: () => void;
    onSuccess: () => void;
}

const UploadMaterialModal = ({ courseId, courseName, onClose, onSuccess }: Props) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check file size (50MB limit)
        if (file.size > 50 * 1024 * 1024) {
            setError('File size must be less than 50MB');
            return;
        }

        setSelectedFile(file);
        setError('');
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (!file) return;

        // Check file size
        if (file.size > 50 * 1024 * 1024) {
            setError('File size must be less than 50MB');
            return;
        }

        setSelectedFile(file);
        setError('');
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Please select a file');
            return;
        }

        setUploading(true);
        setError('');
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            // Simulate upload progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) return prev;
                    return prev + 10;
                });
            }, 200);

            await api.post(`/courses/${courseId}/materials`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            clearInterval(progressInterval);
            setUploadProgress(100);

            setTimeout(() => {
                onSuccess();
            }, 500);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to upload file');
            setUploadProgress(0);
        } finally {
            setUploading(false);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const getFileType = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'pdf':
                return { color: 'text-red-400', bg: 'bg-red-500/20', label: 'PDF' };
            case 'ppt':
            case 'pptx':
                return { color: 'text-orange-400', bg: 'bg-orange-500/20', label: 'PPT' };
            case 'mp4':
            case 'mov':
            case 'avi':
            case 'mkv':
                return { color: 'text-purple-400', bg: 'bg-purple-500/20', label: 'Video' };
            case 'doc':
            case 'docx':
                return { color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'DOC' };
            default:
                return { color: 'text-gray-400', bg: 'bg-gray-500/20', label: ext?.toUpperCase() || 'File' };
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-bg-secondary rounded-xl border border-white/10 max-w-2xl w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Upload Material</h2>
                        <p className="text-text-secondary text-sm mt-1">{courseName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        disabled={uploading}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
                            {error}
                        </div>
                    )}

                    {/* Upload Area */}
                    {!selectedFile ? (
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="w-16 h-16 text-text-secondary mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-white mb-2">
                                Drop your file here or click to browse
                            </h3>
                            <p className="text-text-secondary text-sm mb-4">
                                Supports: PDF, PPT, Video, Documents (Max 50MB)
                            </p>
                            <button
                                type="button"
                                className="px-6 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors font-medium"
                            >
                                Select File
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                onChange={handleFileSelect}
                                className="hidden"
                                accept=".pdf,.ppt,.pptx,.mp4,.mov,.avi,.mkv,.doc,.docx"
                            />
                        </div>
                    ) : (
                        /* Selected File Display */
                        <div className="space-y-4">
                            <div className="bg-bg-primary rounded-lg p-4 border border-white/10">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-lg ${getFileType(selectedFile.name).bg}`}>
                                        <FileText className={`w-6 h-6 ${getFileType(selectedFile.name).color}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-white truncate mb-1">
                                            {selectedFile.name}
                                        </h4>
                                        <div className="flex items-center gap-3 text-sm text-text-secondary">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getFileType(selectedFile.name).bg} ${getFileType(selectedFile.name).color}`}>
                                                {getFileType(selectedFile.name).label}
                                            </span>
                                            <span>{formatFileSize(selectedFile.size)}</span>
                                        </div>
                                    </div>
                                    {!uploading && (
                                        <button
                                            onClick={() => setSelectedFile(null)}
                                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Upload Progress */}
                            {uploading && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-text-secondary">Uploading...</span>
                                        <span className="text-primary font-medium">{uploadProgress}%</span>
                                    </div>
                                    <div className="h-2 bg-bg-primary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Success Message */}
                            {uploadProgress === 100 && (
                                <div className="flex items-center gap-2 text-green-400 bg-green-500/20 p-3 rounded-lg">
                                    <Check className="w-5 h-5" />
                                    <span className="font-medium">Upload complete!</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={uploading}
                        className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!selectedFile || uploading}
                        className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
                    >
                        {uploading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4" />
                                Upload
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UploadMaterialModal;
