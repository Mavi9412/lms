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
    Download,
    Brain,
    PlayCircle,
    Megaphone,
    MessageSquare,
    Pin,
    ThumbsUp
} from 'lucide-react';
import EditLessonModal from '../components/EditLessonModal';
import CreateAssignmentModal from '../components/CreateAssignmentModal';
import SubmitAssignmentModal from '../components/SubmitAssignmentModal';
import GradeSubmissionModal from '../components/GradeSubmissionModal';
import UploadMaterialModal from '../components/UploadMaterialModal';
import CreateQuizModal from '../components/CreateQuizModal';
import CreateAnnouncementModal from '../components/CreateAnnouncementModal';
import CreateThreadModal from '../components/CreateThreadModal';

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
    const [activeTab, setActiveTab] = useState<'lessons' | 'assignments' | 'materials' | 'quizzes' | 'announcements' | 'discussions' | 'grades'>('lessons');

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

    // Quizzes
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [isCreateQuizModalOpen, setIsCreateQuizModalOpen] = useState(false);

    // Announcements
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [isCreateAnnouncementModalOpen, setIsCreateAnnouncementModalOpen] = useState(false);

    // Discussions
    const [threads, setThreads] = useState<any[]>([]);
    const [isCreateThreadModalOpen, setIsCreateThreadModalOpen] = useState(false);

    useEffect(() => {
        fetchCourseDetails();
        fetchAssignments();
        fetchMaterials();
        fetchQuizzes();
        fetchAnnouncements();
        fetchThreads();
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

    const fetchQuizzes = async () => {
        try {
            const response = await api.get(`/quizzes/course/${id}`);
            setQuizzes(response.data);
        } catch (error) {
            console.error('Failed to fetch quizzes', error);
        }
    };

    const fetchAnnouncements = async () => {
        try {
            const response = await api.get(`/announcements/course/${id}`);
            setAnnouncements(response.data);
        } catch (error) {
            console.error('Failed to fetch announcements', error);
        }
    };

    const fetchThreads = async () => {
        try {
            const response = await api.get(`/discussions/course/${id}`);
            setThreads(response.data);
        } catch (error) {
            console.error('Failed to fetch threads', error);
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

            {/* Create Quiz Modal */}
            {id && (
                <CreateQuizModal
                    isOpen={isCreateQuizModalOpen}
                    onClose={() => setIsCreateQuizModalOpen(false)}
                    courseId={parseInt(id)}
                    onCreated={fetchQuizzes}
                />
            )}

            {/* Create Announcement Modal */}
            {id && (
                <CreateAnnouncementModal
                    isOpen={isCreateAnnouncementModalOpen}
                    onClose={() => setIsCreateAnnouncementModalOpen(false)}
                    courseId={parseInt(id)}
                    onCreated={fetchAnnouncements}
                />
            )}

            {/* Create Discussion Thread Modal */}
            {id && (
                <CreateThreadModal
                    isOpen={isCreateThreadModalOpen}
                    onClose={() => setIsCreateThreadModalOpen(false)}
                    courseId={parseInt(id)}
                    onCreated={fetchThreads}
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
                <button
                    onClick={() => setActiveTab('quizzes')}
                    className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'quizzes' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-white'}`}
                >
                    <Brain className="w-4 h-4" />
                    Quizzes
                </button>
                <button
                    onClick={() => setActiveTab('announcements')}
                    className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'announcements' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-white'}`}
                >
                    <Megaphone className="w-4 h-4" />
                    Announcements
                </button>
                <button
                    onClick={() => setActiveTab('discussions')}
                    className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'discussions' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-white'}`}
                >
                    <MessageSquare className="w-4 h-4" />
                    Discussions
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

                {activeTab === 'quizzes' && (
                    <div className="glass rounded-2xl p-8 border border-white/5">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <Brain className="w-7 h-7 text-primary" />
                                Quizzes
                            </h2>
                            {isOwner && (
                                <button
                                    onClick={() => setIsCreateQuizModalOpen(true)}
                                    className="btn btn-primary flex items-center gap-2 text-sm"
                                >
                                    <Plus className="w-4 h-4" />
                                    Create Quiz
                                </button>
                            )}
                        </div>
                        {quizzes.length === 0 ? (
                            <div className="text-center py-12 text-text-secondary">
                                <p>No quizzes available yet.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {quizzes.map((quiz: any) => (
                                    <div key={quiz.id} className="bg-bg-secondary/30 border border-white/5 rounded-xl p-6 hover:border-primary/30 transition-colors">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold mb-2">{quiz.title}</h3>
                                                {quiz.description && (
                                                    <p className="text-text-secondary mb-3">{quiz.description}</p>
                                                )}
                                                <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
                                                    {quiz.time_limit && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-4 h-4" />
                                                            {quiz.time_limit} minutes
                                                        </span>
                                                    )}
                                                    {quiz.max_attempts && (
                                                        <span className="flex items-center gap-1">
                                                            <CheckCircle className="w-4 h-4" />
                                                            Max Attempts: {quiz.max_attempts}
                                                        </span>
                                                    )}
                                                    {quiz.passing_score && (
                                                        <span className="flex items-center gap-1">
                                                            <GraduationCap className="w-4 h-4" />
                                                            Passing: {quiz.passing_score}%
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {isOwner ? (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => navigate(`/quiz/${quiz.id}/take`)}
                                                        className="btn bg-white/5 hover:bg-white/10 text-white border border-white/10 flex items-center gap-2 text-sm"
                                                    >
                                                        <PlayCircle className="w-4 h-4" />
                                                        Preview
                                                    </button>
                                                </div>
                                            ) : course.is_enrolled && isStudent ? (
                                                <button
                                                    onClick={() => navigate(`/quiz/${quiz.id}/take`)}
                                                    className="btn btn-primary flex items-center gap-2 text-sm"
                                                >
                                                    <PlayCircle className="w-4 h-4" />
                                                    Take Quiz
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'announcements' && (
                    <div className="glass rounded-2xl p-8 border border-white/5">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <Megaphone className="w-7 h-7 text-primary" />
                                Announcements
                            </h2>
                            {isOwner && (
                                <button
                                    onClick={() => setIsCreateAnnouncementModalOpen(true)}
                                    className="btn btn-primary flex items-center gap-2 text-sm"
                                >
                                    <Plus className="w-4 h-4" />
                                    Post Announcement
                                </button>
                            )}
                        </div>
                        {announcements.length === 0 ? (
                            <div className="text-center py-12 text-text-secondary">
                                <p>No announcements yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {announcements.map((announcement: any) => (
                                    <div
                                        key={announcement.id}
                                        className={`bg-bg-secondary/30 border rounded-xl p-6 ${announcement.is_pinned
                                                ? 'border-primary/50'
                                                : 'border-white/5'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                {announcement.is_pinned && (
                                                    <Pin className="w-4 h-4 text-primary" />
                                                )}
                                                <h3 className="text-xl font-bold">{announcement.title}</h3>
                                            </div>
                                            <span className="text-sm text-text-secondary">
                                                {new Date(announcement.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-text-secondary mb-3">{announcement.content}</p>
                                        <div className="text-sm text-text-secondary">
                                            Posted by {announcement.creator_name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'discussions' && (
                    <div className="glass rounded-2xl p-8 border border-white/5">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <MessageSquare className="w-7 h-7 text-primary" />
                                Discussions
                            </h2>
                            <button
                                onClick={() => setIsCreateThreadModalOpen(true)}
                                className="btn btn-primary flex items-center gap-2 text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                New Thread
                            </button>
                        </div>
                        {threads.length === 0 ? (
                            <div className="text-center py-12 text-text-secondary">
                                <p>No discussion threads yet. Start a conversation!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {threads.map((thread: any) => (
                                    <div
                                        key={thread.id}
                                        className="bg-bg-secondary/30 border rounded-xl p-6 hover:border-primary/30 transition-colors border-white/5"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2 flex-1">
                                                {thread.is_pinned && (
                                                    <Pin className="w-4 h-4 text-primary flex-shrink-0" />
                                                )}
                                                <h3 className="text-xl font-bold">{thread.title}</h3>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-text-secondary">
                                                <span className="flex items-center gap-1">
                                                    <MessageSquare className="w-4 h-4" />
                                                    {thread.replies_count || 0} replies
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-text-secondary mb-3 line-clamp-2">{thread.content}</p>
                                        <div className="flex items-center justify-between text-sm text-text-secondary">
                                            <span>Posted by {thread.creator_name}</span>
                                            <span>{new Date(thread.created_at).toLocaleDateString()}</span>
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
