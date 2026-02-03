
import { useState } from 'react';
import api from '../services/api';
import { X, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface UploadMaterialModalProps {
    isOpen: boolean;
    onClose: () => void;
    courseId: number;
    onMaterialUploaded: () => void;
}

const UploadMaterialModal = ({ isOpen, onClose, courseId, onMaterialUploaded }: UploadMaterialModalProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file to upload');
            return;
        }

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            await api.post(`/courses/${courseId}/materials`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setSuccess(true);
            setTimeout(() => {
                onMaterialUploaded();
                onClose();
                setFile(null);
                setSuccess(false);
            }, 1500);
        } catch (err: any) {
            console.error('Upload failed', err);
            setError(err.response?.data?.detail || 'Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1e1e2d] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-text-secondary hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Upload className="w-5 h-5 text-primary" />
                    Upload Course Material
                </h3>

                <div className="space-y-6">
                    {/* File Drop Zone Visual */}
                    <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-primary/50 transition-colors bg-white/5">
                        <input
                            type="file"
                            id="file-upload"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-semibold text-white">
                                    {file ? file.name : "Click to browse"}
                                </p>
                                <p className="text-sm text-text-secondary mt-1">
                                    {file ? (file.size / 1024 / 1024).toFixed(2) + ' MB' : "Supports PDF, DOCX, TXT, Images"}
                                </p>
                            </div>
                        </label>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-3 rounded-lg text-sm">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="flex items-center gap-2 text-green-400 bg-green-400/10 p-3 rounded-lg text-sm">
                            <CheckCircle className="w-4 h-4" />
                            Upload successful!
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="btn hover:bg-white/5 text-text-secondary"
                            disabled={uploading}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpload}
                            disabled={!file || uploading || success}
                            className="btn btn-primary flex items-center gap-2"
                        >
                            {uploading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
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
        </div>
    );
};

export default UploadMaterialModal;
