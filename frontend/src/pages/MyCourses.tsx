import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, User, Calendar, Download, FileText } from 'lucide-react';
import api from '../services/api';

interface Enrollment {
    id: number;
    course_id: number;
    course_title: string;
    course_code: string;
    course_description: string;
    section_name: string;
    section_id: number;
    teacher_name: string;
    teacher_email: string;
}

interface Material {
    id: number;
    title: string;
    file_path: string;
    uploaded_at: string;
}

const MyCourses = () => {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [materials, setMaterials] = useState<{ [key: number]: Material[] }>({});

    useEffect(() => {
        fetchEnrollments();
    }, []);

    const fetchEnrollments = async () => {
        setLoading(true);
        try {
            const userResponse = await api.get('/auth/me');
            const response = await api.get(`/users/${userResponse.data.id}/enrollments`);
            setEnrollments(response.data || []);

            // Fetch materials for each course
            response.data?.forEach((enrollment: Enrollment) => {
                fetchMaterials(enrollment.course_id);
            });
        } catch (error) {
            console.error('Failed to fetch enrollments:', error);
            setEnrollments([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchMaterials = async (courseId: number) => {
        try {
            const response = await api.get(`/courses/${courseId}/materials`);
            setMaterials(prev => ({
                ...prev,
                [courseId]: response.data || []
            }));
        } catch (error) {
            console.error(`Failed to fetch materials for course ${courseId}:`, error);
        }
    };

    const handleDownload = (filePath: string) => {
        const baseURL = 'http://localhost:8000';
        window.open(`${baseURL}/${filePath}`, '_blank');
    };

    const getFileType = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'pdf':
                return { label: 'PDF', color: 'text-red-400 bg-red-500/20' };
            case 'ppt':
            case 'pptx':
                return { label: 'PPT', color: 'text-orange-400 bg-orange-500/20' };
            case 'mp4':
            case 'mov':
            case 'avi':
            case 'mkv':
                return { label: 'Video', color: 'text-purple-400 bg-purple-500/20' };
            default:
                return { label: 'File', color: 'text-blue-400 bg-blue-500/20' };
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (enrollments.length === 0) {
        return (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                        My Courses
                    </h1>
                    <p className="text-text-secondary mt-1">Your enrolled courses</p>
                </div>

                <div className="bg-bg-secondary rounded-xl p-12 text-center">
                    <BookOpen className="w-16 h-16 text-text-secondary mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Courses Yet</h3>
                    <p className="text-text-secondary mb-6">You haven't enrolled in any courses</p>
                    <Link
                        to="/courses"
                        className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium inline-flex items-center gap-2"
                    >
                        <BookOpen className="w-5 h-5" />
                        Browse Courses
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                    My Courses
                </h1>
                <p className="text-text-secondary mt-1">
                    {enrollments.length} {enrollments.length === 1 ? 'Course' : 'Courses'} Enrolled
                </p>
            </div>

            {/* Courses Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {enrollments.map((enrollment) => (
                    <div
                        key={enrollment.id}
                        className="bg-bg-secondary rounded-xl border border-white/5 overflow-hidden hover:border-primary/30 transition-all duration-300"
                    >
                        {/* Course Header */}
                        <div className="p-6 border-b border-white/5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-primary/20 rounded-lg">
                                            <BookOpen className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-semibold text-white">
                                                {enrollment.course_title}
                                            </h2>
                                            <p className="text-sm text-text-secondary">{enrollment.course_code}</p>
                                        </div>
                                    </div>
                                    <p className="text-text-secondary text-sm line-clamp-2 mt-2">
                                        {enrollment.course_description}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Course Info */}
                        <div className="p-6 bg-bg-primary/50 space-y-4">
                            {/* Teacher Info */}
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                    <User className="w-4 h-4 text-blue-400" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-medium text-white">Instructor</h3>
                                    <p className="text-sm text-text-secondary">{enrollment.teacher_name}</p>
                                    <a
                                        href={`mailto:${enrollment.teacher_email}`}
                                        className="text-xs text-primary hover:underline"
                                    >
                                        {enrollment.teacher_email}
                                    </a>
                                </div>
                            </div>

                            {/* Section Info */}
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-green-500/20 rounded-lg">
                                    <Calendar className="w-4 h-4 text-green-400" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-medium text-white">Section</h3>
                                    <p className="text-sm text-text-secondary">{enrollment.section_name}</p>
                                </div>
                            </div>

                            {/* Materials */}
                            {materials[enrollment.course_id] && materials[enrollment.course_id].length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileText className="w-4 h-4 text-text-secondary" />
                                        <h3 className="text-sm font-medium text-white">
                                            Course Materials ({materials[enrollment.course_id].length})
                                        </h3>
                                    </div>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {materials[enrollment.course_id].slice(0, 3).map((material) => (
                                            <button
                                                key={material.id}
                                                onClick={() => handleDownload(material.file_path)}
                                                className="w-full flex items-center justify-between gap-3 p-2 bg-bg-secondary rounded-lg hover:bg-bg-primary transition-colors text-left"
                                            >
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                                                    <span className="text-sm text-white truncate">{material.title}</span>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getFileType(material.title).color}`}>
                                                        {getFileType(material.title).label}
                                                    </span>
                                                    <Download className="w-4 h-4 text-primary" />
                                                </div>
                                            </button>
                                        ))}
                                        {materials[enrollment.course_id].length > 3 && (
                                            <Link
                                                to={`/courses/${enrollment.course_id}`}
                                                className="text-sm text-primary hover:underline"
                                            >
                                                View all {materials[enrollment.course_id].length} materials
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="p-6 border-t border-white/5">
                            <Link
                                to={`/courses/${enrollment.course_id}`}
                                className="w-full px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-2"
                            >
                                <BookOpen className="w-4 h-4" />
                                View Course Details
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MyCourses;
