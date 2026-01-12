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
    UserCheck
} from 'lucide-react';
import EditLessonModal from '../components/EditLessonModal';

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
    const [loading, setLoading] = useState(true);
    const [expandedLessons, setExpandedLessons] = useState<Set<number>>(new Set());
    const [enrolling, setEnrolling] = useState(false);

    // Edit Modal State
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    useEffect(() => {
        fetchCourseDetails();
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

    const isOwner = user?.role === 'admin';
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
                                    <p className="text-text-secondary text-xs">Enrolled Students</p>
                                    <p className="font-semibold">{course.enrollment_count}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <BookOpen className="w-5 h-5 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-text-secondary text-xs">Total Lessons</p>
                                    <p className="font-semibold">{course.lessons.length}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-text-secondary text-xs">Created</p>
                                    <p className="font-semibold">
                                        {new Date(course.created_at).toLocaleDateString()}
                                    </p>
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
                                        <button
                                            onClick={handleUnenroll}
                                            disabled={enrolling}
                                            className="btn bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20"
                                        >
                                            {enrolling ? 'Processing...' : 'Unenroll'}
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleEnroll}
                                        disabled={enrolling}
                                        className="btn btn-primary shadow-lg shadow-primary/25"
                                    >
                                        {enrolling ? 'Enrolling...' : 'Enroll Now'}
                                    </button>
                                )}
                            </>
                        )}

                        {isOwner && (
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-3 rounded-lg border border-primary/20">
                                    <UserCheck className="w-5 h-5" />
                                    <span className="font-medium">You Own This Course</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Lessons Section */}
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
                        <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-medium">No lessons available yet</p>
                        {isOwner && <p className="text-sm mt-2">Click "Add Lesson" to create the first lesson</p>}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {course.lessons.map((lesson, index) => {
                            const isExpanded = expandedLessons.has(lesson.id);
                            return (
                                <div
                                    key={lesson.id}
                                    className="bg-bg-secondary/30 border border-white/5 rounded-xl overflow-hidden transition-all hover:border-primary/30"
                                >
                                    <div
                                        onClick={() => toggleLesson(lesson.id)}
                                        className="flex items-center justify-between p-5 cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                                                    {lesson.title}
                                                </h3>
                                                <p className="text-xs text-text-secondary mt-1">
                                                    Created {new Date(lesson.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {isOwner && (
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingLesson(lesson);
                                                            setIsEditModalOpen(true);
                                                        }}
                                                        className="p-2 hover:bg-blue-500/20 rounded-lg text-blue-500 transition-colors"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteLesson(lesson.id);
                                                        }}
                                                        className="p-2 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                            {isExpanded ? (
                                                <ChevronUp className="w-5 h-5 text-primary" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-text-secondary group-hover:text-primary transition-colors" />
                                            )}
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="px-5 pb-5 pt-0 border-t border-white/5 animate-in slide-in-from-top-2 duration-200">
                                            <div className="mt-4 p-4 bg-bg-primary/50 rounded-lg">
                                                <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">
                                                    {lesson.content}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourseDetails;
