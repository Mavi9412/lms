import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    BookOpen,
    Clock,
    Users,
    ArrowLeft,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Plus,
    Edit,
    Trash2,
    UserCheck,
    FileText,
    GraduationCap,
    Upload,
    File,
    Download
} from 'lucide-react';
import EditLessonModal from '../components/EditLessonModal';
import CreateAssignmentModal from '../components/CreateAssignmentModal';
import SubmitAssignmentModal from '../components/SubmitAssignmentModal';
import GradeSubmissionModal from '../components/GradeSubmissionModal';
import UploadMaterialModal from '../components/UploadMaterialModal';

interface Teacher {
    id: number;
    full_name: string;
    email: string;
}

interface Lesson {
    id: number;
    title: string;
    content: string;
    order: number;
    course_id: number;
    created_at: string;
}

interface Assignment {
    id: number;
    title: string;
    description: string;
    due_date: string;
    max_points: number;
}

interface CourseDetail {
    id: number;
    title: string;
    description: string;
    teacher_id: number;
    created_at: string;
    teacher: Teacher;
    lessons: Lesson[];
    is_enrolled: boolean;
    enrollment_count: number;
}

const CourseDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedLessons, setExpandedLessons] = useState<Set<number>>(new Set());
    const [enrolling, setEnrolling] = useState(false);

    // Tabs
    const [activeTab, setActiveTab] = useState<'lessons' | 'assignments' | 'materials' | 'grades'>('lessons');

    // Edit Modal State
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Assignment Modals
    const [isCreateAssignModalOpen, setIsCreateAssignModalOpen] = useState(false);
    const [isSubmitAssignModalOpen, setIsSubmitAssignModalOpen] = useState(false);
    const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

    // Materials
    const [materials, setMaterials] = useState<any[]>([]);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    useEffect(() => {
        fetchCourseDetails();
        fetchAssignments();
        fetchMaterials();
    }, [id]);

    const fetchCourseDetails = async () => {
        try {
            const response = await api.get(`/courses/${id}/details`);
            setCourse(response.data);
        } catch (error) {
            console.error('Failed to fetch course details', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAssignments = async () => {
        try {
            const response = await api.get(`/assignments/course/${id}`);
            setAssignments(response.data);
        } catch (error) {
            console.error('Failed to fetch assignments', error);
        }
    };

    const fetchMaterials = async () => {
        try {
            const response = await api.get(`/courses/${id}/materials`);
            setMaterials(response.data);
        } catch (error) {
            console.error('Failed to fetch materials', error);
        }
    };

    const handleDeleteMaterial = async (materialId: number) => {
        if (!confirm('Are you sure you want to delete this file?')) return;
        try {
            await api.delete(`/courses/${id}/materials/${materialId}`);
            fetchMaterials();
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to delete material');
        }
    };

    const toggleLesson = (lessonId: number) => {
        setExpandedLessons(prev => {
            const newSet = new Set(prev);
            if (newSet.has(lessonId)) {
                newSet.delete(lessonId);
            } else {
                newSet.add(lessonId);
            }
            return newSet;
        });
    };

    const handleEnroll = async () => {
        setEnrolling(true);
        try {
            await api.post(`/courses/${id}/enroll`);
            await fetchCourseDetails();
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to enroll');
        } finally {
            setEnrolling(false);
        }
    };

    const handleUnenroll = async () => {
        if (!confirm('Are you sure you want to unenroll from this course?')) return;

        setEnrolling(true);
        try {
            await api.delete(`/courses/${id}/enroll`);
            await fetchCourseDetails();
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to unenroll');
        } finally {
            setEnrolling(false);
        }
    };

    const handleDeleteLesson = async (lessonId: number) => {
        if (!confirm('Are you sure you want to delete this lesson?')) return;
        try {
            await api.delete(`/courses/${id}/lessons/${lessonId}`);
            setCourse(prev => prev ? {
                ...prev,
                lessons: prev.lessons.filter(l => l.id !== lessonId)
            } : null);
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to delete lesson');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-10 text-center">
                <h2 className="text-2xl font-bold mb-4">Course Not Found</h2>
                <button onClick={() => navigate('/courses')} className="btn btn-primary">
                    Back to Courses
                </button>
            </div>
        );
    }

    const isOwner = user?.role === 'admin' || (user?.role === 'teacher' && course.teacher_id === user.id);
    const isStudent = user?.role === 'student';

    return (
        <div className="max-w-7xl mx-auto px-6 py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Edit Lesson Modal */}
            <EditLessonModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingLesson(null);
                }}
                lesson={editingLesson}
                courseId={id}
                onLessonUpdated={fetchCourseDetails}
            />

            {/* Create Assignment Modal */}
            {id && (
                <CreateAssignmentModal
                    isOpen={isCreateAssignModalOpen}
                    onClose={() => setIsCreateAssignModalOpen(false)}
                    courseId={id}
                    onAssignmentCreated={fetchAssignments}
                />
            )}

            {/* Grade Submission Modal */}
            {selectedAssignment && (
                <GradeSubmissionModal
                    isOpen={isGradeModalOpen}
                    onClose={() => {
                        setIsGradeModalOpen(false);
                        setSelectedAssignment(null);
                    }}
                    assignmentId={selectedAssignment.id}
                    assignmentTitle={selectedAssignment.title}
                />
            )}

            {/* Submit Assignment Modal */}
            {selectedAssignment && (
                <SubmitAssignmentModal
                    isOpen={isSubmitAssignModalOpen}
                    onClose={() => {
                        setIsSubmitAssignModalOpen(false);
                        setSelectedAssignment(null);
                    }}
                    assignmentId={selectedAssignment.id}
                    assignmentTitle={selectedAssignment.title}
                    onSubmitted={() => alert('Assignment submitted successfully!')}
                />
            )}

            {/* Upload Material Modal */}
            {id && (
                <UploadMaterialModal
                    isOpen={isUploadModalOpen}
                    onClose={() => setIsUploadModalOpen(false)}
                    courseId={parseInt(id)}
                    onMaterialUploaded={fetchMaterials}
                />
            )}

            {/* Back Button */}
            <button
                onClick={() => navigate('/courses')}
                className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors mb-6 group"
            >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Courses</span>
            </button>

            {/* Course Header */}
            <div className="glass rounded-2xl p-8 mb-8 border border-white/5">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    <div className="flex-1">
                        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                            {course.title}
                        </h1>
                        <p className="text-text-secondary text-lg mb-6 leading-relaxed">
                            {course.description}
                        </p>

                        {/* Course Meta */}
                        <div className="flex flex-wrap gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                    <UserCheck className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-text-secondary text-xs">Instructor</p>
                                    <p className="font-semibold">{course.teacher.full_name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-secondary" />
                                </div>
                                <div>
                                    <p className="text-text-secondary text-xs">Enrolled</p>
                                    <p className="font-semibold">{course.enrollment_count}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Enrollment Actions */}
                    <div className="flex flex-col gap-3">
                        {isStudent && (
                            <>
                                {course.is_enrolled ? (
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-2 bg-green-500/10 text-green-500 px-4 py-3 rounded-lg border border-green-500/20">
                                            <CheckCircle className="w-5 h-5" />
                                            <span className="font-medium">Enrolled</span>
                                        </div>
                                        <button onClick={handleUnenroll} disabled={enrolling} className="btn bg-red-500/10 text-red-500 border border-red-500/20">
                                            {enrolling ? 'Processing...' : 'Unenroll'}
                                        </button>
                                    </div>
                                ) : (
                                    <button onClick={handleEnroll} disabled={enrolling} className="btn btn-primary shadow-lg shadow-primary/25">
                                        {enrolling ? 'Enrolling...' : 'Enroll Now'}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-4 border-b border-white/10 mb-8 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('lessons')}
                    className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'lessons' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-white'}`}
                >
                    <BookOpen className="w-4 h-4" />
                    Lessons
                </button>
                <button
                    onClick={() => setActiveTab('assignments')}
                    className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'assignments' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-white'}`}
                >
                    <FileText className="w-4 h-4" />
                    Assignments
                </button>
                <button
                    onClick={() => setActiveTab('materials')}
                    className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'materials' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-white'}`}
                >
                    <FileText className="w-4 h-4" />
                    Materials
                </button>
                {isStudent && (
                    <button
                        onClick={() => setActiveTab('grades')}
                        className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'grades' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-white'}`}
                    >
                        <GraduationCap className="w-4 h-4" />
                        Grades
                    </button>
                )}
            </div>

            {/* Tab Content */}
            <div className="min-h-[300px]">
                {activeTab === 'lessons' && (
                    <div className="glass rounded-2xl p-8 border border-white/5">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <BookOpen className="w-7 h-7 text-primary" />
                                Course Lessons
                            </h2>
                            {isOwner && (
                                <button className="btn btn-primary flex items-center gap-2 text-sm">
                                    <Plus className="w-4 h-4" />
                                    Add Lesson
                                </button>
                            )}
                        </div>
                        {course.lessons.length === 0 ? (
                            <div className="text-center py-12 text-text-secondary">
                                <p>No lessons available yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {course.lessons.map((lesson, index) => (
                                    <div key={lesson.id} className="bg-bg-secondary/30 border border-white/5 rounded-xl p-5">
                                        <div onClick={() => toggleLesson(lesson.id)} className="flex items-center justify-between cursor-pointer">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">{index + 1}</div>
                                                <h3 className="font-semibold text-lg">{lesson.title}</h3>
                                            </div>
                                            {expandedLessons.has(lesson.id) ? <ChevronUp /> : <ChevronDown />}
                                        </div>
                                        {expandedLessons.has(lesson.id) && (
                                            <div className="mt-4 p-4 bg-bg-primary/50 rounded-lg text-text-secondary">
                                                {lesson.content}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'assignments' && (
                    <div className="glass rounded-2xl p-8 border border-white/5">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <FileText className="w-7 h-7 text-primary" />
                                Assignments
                            </h2>
                            {isOwner && (
                                <button
                                    onClick={() => setIsCreateAssignModalOpen(true)}
                                    className="btn btn-primary flex items-center gap-2 text-sm"
                                >
                                    <Plus className="w-4 h-4" />
                                    Create Assignment
                                </button>
                            )}
                        </div>
                        {assignments.length === 0 ? (
                            <div className="text-center py-12 text-text-secondary">
                                <p>No assignments posted yet.</p>
                            </div>
                        ) : (
                            <div className="grid gap-6">
                                {assignments.map(assignment => (
                                    <div key={assignment.id} className="bg-bg-secondary/30 border border-white/5 rounded-xl p-6 hover:border-primary/30 transition-colors">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-xl font-bold mb-2">{assignment.title}</h3>
                                                <p className="text-text-secondary mb-4">{assignment.description}</p>
                                                <div className="flex items-center gap-4 text-sm text-text-secondary">
                                                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                                                    <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Points: {assignment.max_points}</span>
                                                </div>
                                            </div>
                                            {isOwner && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedAssignment(assignment);
                                                        setIsGradeModalOpen(true);
                                                    }}
                                                    className="btn bg-white/5 hover:bg-white/10 text-white border border-white/10 flex items-center gap-2 text-sm"
                                                >
                                                    <Users className="w-4 h-4" />
                                                    View Submissions
                                                </button>
                                            )}
                                            {course.is_enrolled && isStudent && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedAssignment(assignment);
                                                        setIsSubmitAssignModalOpen(true);
                                                    }}
                                                    className="btn btn-secondary flex items-center gap-2 text-sm"
                                                >
                                                    <Upload className="w-4 h-4" />
                                                    Submit Work
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                )}

                {activeTab === 'materials' && (
                    <div className="glass rounded-2xl p-8 border border-white/5">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <FileText className="w-7 h-7 text-primary" />
                                Course Materials
                            </h2>
                            {isOwner && (
                                <button
                                    onClick={() => setIsUploadModalOpen(true)}
                                    className="btn btn-primary flex items-center gap-2 text-sm"
                                >
                                    <Upload className="w-4 h-4" />
                                    Upload Material
                                </button>
                            )}
                        </div>
                        {materials.length === 0 ? (
                            <div className="text-center py-12 text-text-secondary">
                                <p>No specific course materials uploaded yet.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {materials.map((material) => (
                                    <div key={material.id} className="bg-bg-secondary/30 border border-white/5 rounded-xl p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                <File className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">{material.title}</h3>
                                                <p className="text-xs text-text-secondary">Uploaded: {new Date(material.uploaded_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <a
                                                href={`http://localhost:8000/${material.file_path}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="btn bg-white/5 hover:bg-white/10 text-white border border-white/10 p-2 rounded-lg"
                                                title="Download"
                                            >
                                                <Download className="w-4 h-4" />
                                            </a>
                                            {isOwner && (
                                                <button
                                                    onClick={() => handleDeleteMaterial(material.id)}
                                                    className="btn bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/10 p-2 rounded-lg"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'grades' && (
                    <div className="glass rounded-2xl p-8 border border-white/5">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                            <GraduationCap className="w-7 h-7 text-primary" />
                            My Grades
                        </h2>
                        <div className="text-center py-8 text-text-secondary">
                            <p>No grades available yet.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourseDetails;
