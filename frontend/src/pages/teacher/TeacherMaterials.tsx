import { useEffect, useState } from 'react';
import { Plus, FileText, FileVideo, File, Download, Trash2, Upload } from 'lucide-react';
import api from '../../services/api';
import UploadMaterialModal from '../../components/modals/UploadMaterialModal';

interface Section {
    id: number;
    name: string;
    course_id: number;
    course_title: string;
    course_code: string;
}

interface Material {
    id: number;
    title: string;
    file_path: string;
    uploaded_at: string;
    course_id: number;
}

const TeacherMaterials = () => {
    const [sections, setSections] = useState<Section[]>([]);
    const [selectedSection, setSelectedSection] = useState<Section | null>(null);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);

    useEffect(() => {
        fetchSections();
    }, []);

    useEffect(() => {
        if (selectedSection) {
            fetchMaterials();
        }
    }, [selectedSection]);

    const fetchSections = async () => {
        try {
            const response = await api.get('/teacher/sections');
            setSections(response.data);
            if (response.data.length > 0) {
                setSelectedSection(response.data[0]);
            }
        } catch (error) {
            console.error('Failed to fetch sections:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMaterials = async () => {
        if (!selectedSection) return;

        setLoading(true);
        try {
            const response = await api.get(`/courses/${selectedSection.course_id}/materials`);
            setMaterials(response.data);
        } catch (error) {
            console.error('Failed to fetch materials:', error);
            setMaterials([]);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadSuccess = () => {
        setShowUploadModal(false);
        fetchMaterials();
    };

    const handleDelete = async (materialId: number) => {
        if (!selectedSection) return;
        if (!confirm('Are you sure you want to delete this material?')) return;

        try {
            await api.delete(`/courses/${selectedSection.course_id}/materials/${materialId}`);
            fetchMaterials();
        } catch (error) {
            console.error('Failed to delete material:', error);
            alert('Failed to delete material');
        }
    };

    const handleDownload = (material: Material) => {
        window.open(`http://localhost:8000/${material.file_path}`, '_blank');
    };

    const getFileIcon = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'pdf':
                return <File className="w-8 h-8 text-red-400" />;
            case 'ppt':
            case 'pptx':
                return <FileText className="w-8 h-8 text-orange-400" />;
            case 'mp4':
            case 'mov':
            case 'avi':
            case 'mkv':
                return <FileVideo className="w-8 h-8 text-purple-400" />;
            default:
                return <FileText className="w-8 h-8 text-blue-400" />;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getFileSize = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') return 'PDF';
        if (ext === 'ppt' || ext === 'pptx') return 'PPT';
        if (ext === 'mp4' || ext === 'mov' || ext === 'avi' || ext === 'mkv') return 'Video';
        return ext?.toUpperCase() || 'File';
    };

    if (loading && sections.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                        Course Materials
                    </h1>
                    <p className="text-text-secondary mt-1">Upload and manage course materials</p>
                </div>
                {selectedSection && (
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium flex items-center gap-2 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Upload Material
                    </button>
                )}
            </div>

            {/* Section Selector */}
            <div className="bg-bg-secondary rounded-xl p-6 mb-6">
                <label className="block text-sm font-medium text-text-secondary mb-2">
                    Select Section
                </label>
                <select
                    value={selectedSection?.id || ''}
                    onChange={(e) => {
                        const section = sections.find(s => s.id === parseInt(e.target.value));
                        setSelectedSection(section || null);
                    }}
                    className="w-full md:w-1/2 px-4 py-3 bg-bg-primary border border-white/10 rounded-lg focus:outline-none focus:border-primary transition-colors text-white"
                >
                    {sections.map(section => (
                        <option key={section.id} value={section.id}>
                            {section.course_code} - {section.name} ({section.course_title})
                        </option>
                    ))}
                </select>
            </div>

            {/* Materials List */}
            {loading ? (
                <div className="bg-bg-secondary rounded-xl p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                    <p className="text-text-secondary mt-4">Loading materials...</p>
                </div>
            ) : materials.length === 0 ? (
                <div className="bg-bg-secondary rounded-xl p-12 text-center">
                    <Upload className="w-16 h-16 text-text-secondary mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Materials Yet</h3>
                    <p className="text-text-secondary mb-6">Upload your first course material to get started</p>
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium inline-flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Upload Material
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {materials.map((material) => (
                        <div
                            key={material.id}
                            className="bg-bg-secondary rounded-xl border border-white/5 p-6 hover:border-primary/50 transition-all duration-300"
                        >
                            <div className="flex items-start gap-4">
                                {/* File Icon */}
                                <div className="flex-shrink-0">
                                    {getFileIcon(material.title)}
                                </div>

                                {/* Material Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-semibold text-white mb-1 truncate">
                                        {material.title}
                                    </h3>
                                    <div className="flex items-center gap-4 text-sm text-text-secondary">
                                        <span className="px-2 py-0.5 bg-primary/20 text-primary rounded text-xs font-medium">
                                            {getFileSize(material.title)}
                                        </span>
                                        <span>Uploaded {formatDate(material.uploaded_at)}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => handleDownload(material)}
                                        className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors font-medium flex items-center gap-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download
                                    </button>
                                    <button
                                        onClick={() => handleDelete(material.id)}
                                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && selectedSection && (
                <UploadMaterialModal
                    courseId={selectedSection.course_id}
                    courseName={`${selectedSection.course_code} - ${selectedSection.name}`}
                    onClose={() => setShowUploadModal(false)}
                    onSuccess={handleUploadSuccess}
                />
            )}
        </div>
    );
};

export default TeacherMaterials;
