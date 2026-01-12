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
import EditLessonModal from '../components/EditLessonModal';

// ... (existing interfaces)

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
            // ... (existing button)
            >
                {/* ... */}
            </button>

            {/* ... (existing jsx) ... */}

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
    )
}
{
    isExpanded ? (
        <ChevronUp className="w-5 h-5 text-primary" />
    ) : (
        <ChevronDown className="w-5 h-5 text-text-secondary group-hover:text-primary transition-colors" />
    )
}
                                        </div >
                                    </div >

    { isExpanded && (
        <div className="px-5 pb-5 pt-0 border-t border-white/5 animate-in slide-in-from-top-2 duration-200">
            <div className="mt-4 p-4 bg-bg-primary/50 rounded-lg">
                <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">
                    {lesson.content}
                </p>
            </div>
        </div>
    )}
                                </div >
                            );
                        })}
                    </div >
                )}
            </div >
        </div >
    );
};

export default CourseDetails;
