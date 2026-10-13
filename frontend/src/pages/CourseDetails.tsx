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
    Award
} from 'lucide-react';
import EditLessonModal from '../components/EditLessonModal';
import CreateAssignmentModal from '../components/CreateAssignmentModal';
import SubmitAssignmentModal from '../components/SubmitAssignmentModal';
import GradeSubmissionModal from '../components/GradeSubmissionModal';
import UploadMaterialModal from '../components/UploadMaterialModal';
import CreateQuizModal from '../components/CreateQuizModal';
import CreateAnnouncementModal from '../components/CreateAnnouncementModal';
import CreateThreadModal from '../components/CreateThreadModal';
import CreateLessonModal from '../components/modals/CreateLessonModal';

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
    const [activeTab, setActiveTab] = useState<'lessons' | 'assignments' | 'materials' | 'quizzes' | 'announcements' | 'discussions' | 'grades' | 'rubrics'>('lessons');

    // Edit Modal State
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCreateLessonModalOpen, setIsCreateLessonModalOpen] = useState(false);

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

    // Lesson progress (students)
    const [progress, setProgress] = useState<{ completed_lesson_ids: number[]; total_lessons: number; percentage: number } | null>(null);

    // Modules
    const [modulesData, setModulesData] = useState<{ modules: any[]; unassigned_lessons: any[] } | null>(null);
    const [showModuleModal, setShowModuleModal] = useState(false);
    const [editingModule, setEditingModule] = useState<any>(null);
    const [moduleTitle, setModuleTitle] = useState('');
    const [moduleDesc, setModuleDesc] = useState('');

    // Rubrics (read-only for students)
    const [rubrics, setRubrics] = useState<any[]>([]);
    const [expandedRubric, setExpandedRubric] = useState<number | null>(null);
    const [rubricDetails, setRubricDetails] = useState<Record<number, any>>({});

    useEffect(() => {
        fetchCourseDetails();
        fetchAssignments();
        fetchMaterials();
        fetchQuizzes();
        fetchAnnouncements();
        fetchThreads();
        fetchRubrics();
        fetchProgress();
        fetchModules();
    }, [id]);

    const fetchModules = async () => {
        try {
            const response = await api.get(`/courses/${id}/modules`);
            setModulesData(response.data);
        } catch {
            setModulesData(null);
        }
    };

    const handleSaveModule = async () => {
        if (!moduleTitle.trim()) return;
        try {
            if (editingModule) {
                await api.put(`/courses/${id}/modules/${editingModule.id}`, {
                    title: moduleTitle.trim(),
                    description: moduleDesc.trim() || null,
                });
            } else {
                await api.post(`/courses/${id}/modules`, {
                    title: moduleTitle.trim(),
                    description: moduleDesc.trim() || null,
                    order: (modulesData?.modules.length || 0),
                });
            }
            setShowModuleModal(false);
            setEditingModule(null);
            setModuleTitle('');
            setModuleDesc('');
            fetchModules();
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to save module');
        }
    };

    const handleDeleteModule = async (moduleId: number) => {
        if (!confirm('Delete this module? Its lessons will be kept as unassigned.')) return;
        try {
            await api.delete(`/courses/${id}/modules/${moduleId}`);
            fetchModules();
            fetchCourseDetails();
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to delete module');
        }
    };

    const handleMoveLesson = async (lessonId: number, moduleId: string) => {
        try {
            await api.patch(`/courses/${id}/lessons/${lessonId}/move`, {
                module_id: moduleId === '' ? null : Number(moduleId),
            });
            fetchModules();
            fetchCourseDetails();
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to move lesson');
        }
    };

    const fetchProgress = async () => {
        try {
            const response = await api.get(`/courses/${id}/progress`);
            setProgress(response.data);
        } catch {
            setProgress(null); // not a student / not enrolled
        }
    };

    const toggleLessonComplete = async (lessonId: number, completed: boolean) => {
        try {
            if (completed) {
                await api.delete(`/courses/${id}/lessons/${lessonId}/complete`);
            } else {
                await api.post(`/courses/${id}/lessons/${lessonId}/complete`);
            }
            fetchProgress();
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to update progress');
        }
    };

    const resumeLessonId = (() => {
        if (!progress || !course) return null;
        const done = new Set(progress.completed_lesson_ids);
        const next = [...course.lessons].sort((a, b) => a.order - b.order).find(l => !done.has(l.id));
        return next ? next.id : null;
    })();

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

    const fetchRubrics = async () => {
        try {
            const response = await api.get(`/rubrics/course/${id}`);
            setRubrics(response.data);
        } catch (error) {
            console.error('Failed to fetch rubrics', error);
        }
    };

    const toggleRubric = async (rubricId: number) => {
        if (expandedRubric === rubricId) {
            setExpandedRubric(null);
            return;
        }
        setExpandedRubric(rubricId);
        if (!rubricDetails[rubricId]) {
            try {
                const response = await api.get(`/rubrics/${rubricId}`);
                setRubricDetails((prev) => ({ ...prev, [rubricId]: response.data }));
            } catch (error) {
                console.error('Failed to fetch rubric details', error);
            }
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

    const renderLessonCard = (lesson: any, index: number) => (
        <div key={lesson.id} id={`lesson-${lesson.id}`} className="bg-bg-secondary/30 border border-white/5 rounded-xl p-5">
            <div onClick={() => toggleLesson(lesson.id)} className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">{index + 1}</div>
                    <h3 className="font-semibold text-lg">{lesson.title}</h3>
                </div>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {isStudent && progress && (
                        <button
                            onClick={() => toggleLessonComplete(lesson.id, progress.completed_lesson_ids.includes(lesson.id))}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${progress.completed_lesson_ids.includes(lesson.id)
                                ? 'bg-green-500/15 text-green-400 hover:bg-green-500/25'
                                : 'bg-white/5 text-text-secondary hover:bg-white/10 hover:text-white'}`}
                            title={progress.completed_lesson_ids.includes(lesson.id) ? 'Mark as incomplete' : 'Mark as complete'}
                        >
                            <CheckCircle className="w-4 h-4" />
                            {progress.completed_lesson_ids.includes(lesson.id) ? 'Done' : 'Mark done'}
                        </button>
                    )}
                    {isOwner && modulesData && modulesData.modules.length > 0 && (
                        <select
                            value={lesson.module_id || ''}
                            onChange={(e) => handleMoveLesson(lesson.id, e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg text-xs px-2 py-1.5 text-text-secondary focus:outline-none"
                            title="Move to module"
                        >
                            <option value="">Unassigned</option>
                            {modulesData.modules.map((m: any) => (
                                <option key={m.id} value={m.id}>{m.title}</option>
                            ))}
                        </select>
                    )}
                    {isOwner && (
                        <>
                            <button
                                onClick={() => {
                                    setEditingLesson(lesson);
                                    setIsEditModalOpen(true);
                                }}
                                className="p-2 text-text-secondary hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                title="Edit lesson"
                            >
                                <Edit className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleDeleteLesson(lesson.id)}
                                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Delete lesson"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </>
                    )}
                    {expandedLessons.has(lesson.id) ? <ChevronUp /> : <ChevronDown />}
                </div>
            </div>
            {expandedLessons.has(lesson.id) && (
                <div className="mt-4 p-4 bg-bg-primary/50 rounded-lg text-text-secondary">
                    {lesson.content}
                </div>
            )}
        </div>
    );

    const moduleProgress = (module: any) => {
        if (!progress || !isStudent) return null;
        const done = new Set(progress.completed_lesson_ids);
        const total = module.lessons.length;
        const n = module.lessons.filter((l: any) => done.has(l.id)).length;
        return { n, total, pct: total ? Math.round(n / total * 100) : 0 };
    };

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

            {/* Module Modal */}
            {showModuleModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModuleModal(false)}>
                    <div className="glass rounded-2xl border border-white/10 w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-4">{editingModule ? 'Edit Module' : 'Add Module'}</h2>
                        <label className="text-sm text-text-secondary block mb-1">Title</label>
                        <input
                            value={moduleTitle}
                            onChange={(e) => setModuleTitle(e.target.value)}
                            placeholder="e.g. Week 1: Basics"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 mb-3 focus:outline-none focus:border-primary"
                        />
                        <label className="text-sm text-text-secondary block mb-1">Description (optional)</label>
                        <textarea
                            value={moduleDesc}
                            onChange={(e) => setModuleDesc(e.target.value)}
                            rows={3}
                            placeholder="What does this module cover?"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:border-primary"
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowModuleModal(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm">Cancel</button>
                            <button onClick={handleSaveModule} disabled={!moduleTitle.trim()} className="btn btn-primary px-4 text-sm disabled:opacity-50">
                                {editingModule ? 'Save' : 'Add Module'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Lesson Modal */}
            {isCreateLessonModalOpen && (
                <CreateLessonModal
                    courseId={id || ''}
                    onClose={() => setIsCreateLessonModalOpen(false)}
                    onSuccess={() => {
                        setIsCreateLessonModalOpen(false);
                        fetchCourseDetails();
                    }}
                />
            )}

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
                <button
                    onClick={() => setActiveTab('rubrics')}
                    className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'rubrics' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-white'}`}
                >
                    <Award className="w-4 h-4" />
                    Rubrics
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
                            <div className="flex gap-2">
                                {isOwner && (
                                    <>
                                        <button
                                            onClick={() => { setEditingModule(null); setModuleTitle(''); setModuleDesc(''); setShowModuleModal(true); }}
                                            className="btn bg-white/5 hover:bg-white/10 text-white border border-white/10 flex items-center gap-2 text-sm"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Module
                                        </button>
                                        <button
                                            onClick={() => setIsCreateLessonModalOpen(true)}
                                            className="btn btn-primary flex items-center gap-2 text-sm"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Lesson
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                        {isStudent && progress && progress.total_lessons > 0 && (
                            <div className="mb-6 p-4 bg-bg-secondary/30 border border-white/5 rounded-xl">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-text-secondary">
                                        {progress.completed_lesson_ids.length} of {progress.total_lessons} lessons complete
                                    </span>
                                    <span className="text-sm font-semibold text-primary">{progress.percentage}%</span>
                                </div>
                                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress.percentage}%` }} />
                                </div>
                                {resumeLessonId && (
                                    <button
                                        onClick={() => {
                                            setExpandedLessons(prev => new Set(prev).add(resumeLessonId));
                                            document.getElementById(`lesson-${resumeLessonId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        }}
                                        className="mt-3 btn btn-primary text-sm flex items-center gap-2"
                                    >
                                        <PlayCircle className="w-4 h-4" /> Resume learning
                                    </button>
                                )}
                            </div>
                        )}
                        {(() => {
                            const hasModules = modulesData && modulesData.modules.length > 0;
                            if (!hasModules) {
                                if (course.lessons.length === 0) {
                                    return (
                                        <div className="text-center py-12 text-text-secondary">
                                            <p>No lessons available yet.</p>
                                        </div>
                                    );
                                }
                                return (
                                    <div className="space-y-4">
                                        {course.lessons.map((lesson: any, index: number) => renderLessonCard(lesson, index))}
                                    </div>
                                );
                            }
                            const mp = (m: any) => moduleProgress(m);
                            return (
                                <div className="space-y-6">
                                    {modulesData.modules.map((m: any) => (
                                        <div key={m.id} className="border border-white/10 rounded-2xl overflow-hidden">
                                            <div className="bg-white/5 px-5 py-4 flex items-center justify-between">
                                                <div>
                                                    <h3 className="font-bold text-lg">{m.title}</h3>
                                                    {m.description && <p className="text-sm text-text-secondary">{m.description}</p>}
                                                    <p className="text-xs text-text-secondary mt-1">
                                                        {m.lessons.length} lesson{m.lessons.length === 1 ? '' : 's'}
                                                        {mp(m) && <> • {mp(m)!.n}/{mp(m)!.total} complete</>}
                                                    </p>
                                                </div>
                                                {isOwner && (
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => { setEditingModule(m); setModuleTitle(m.title); setModuleDesc(m.description || ''); setShowModuleModal(true); }}
                                                            className="p-2 text-text-secondary hover:text-white hover:bg-white/10 rounded-lg"
                                                            title="Edit module"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteModule(m.id)}
                                                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                                                            title="Delete module"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-4 space-y-3">
                                                {m.lessons.length === 0 ? (
                                                    <p className="text-sm text-text-secondary px-1">No lessons in this module yet.</p>
                                                ) : (
                                                    m.lessons.map((lesson: any, i: number) => renderLessonCard(lesson, i))
                                                )}
                                            </div>
                                            {mp(m) && mp(m)!.total > 0 && (
                                                <div className="px-5 pb-4">
                                                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                        <div className="h-full bg-primary rounded-full" style={{ width: `${mp(m)!.pct}%` }} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {modulesData.unassigned_lessons.length > 0 && (
                                        <div>
                                            <h3 className="font-semibold text-text-secondary mb-3 text-sm uppercase tracking-wide">Unassigned lessons</h3>
                                            <div className="space-y-4">
                                                {modulesData.unassigned_lessons.map((lesson: any, i: number) => renderLessonCard(lesson, i))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
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

                {activeTab === 'rubrics' && (
                    <div className="glass rounded-2xl p-8 border border-white/5">
                        <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
                            <Award className="w-7 h-7 text-primary" />
                            Grading Rubrics
                        </h2>
                        <p className="text-text-secondary text-sm mb-6">
                            How your work is evaluated in this course.
                        </p>
                        {rubrics.length === 0 ? (
                            <div className="text-center py-8 text-text-secondary">
                                <p>No rubrics published for this course yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {rubrics.map((rubric: any) => {
                                    const detail = rubricDetails[rubric.id];
                                    const isOpen = expandedRubric === rubric.id;
                                    return (
                                        <div key={rubric.id} className="bg-bg-secondary rounded-xl border border-white/5 overflow-hidden">
                                            <button
                                                onClick={() => toggleRubric(rubric.id)}
                                                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
                                            >
                                                <div>
                                                    <p className="font-semibold text-white">{rubric.title}</p>
                                                    {rubric.description && (
                                                        <p className="text-sm text-text-secondary mt-0.5">{rubric.description}</p>
                                                    )}
                                                </div>
                                                {isOpen ? (
                                                    <ChevronUp className="w-5 h-5 text-text-secondary shrink-0" />
                                                ) : (
                                                    <ChevronDown className="w-5 h-5 text-text-secondary shrink-0" />
                                                )}
                                            </button>
                                            {isOpen && (
                                                <div className="px-5 pb-5 space-y-2">
                                                    {detail ? (
                                                        <>
                                                            {detail.criteria.map((criterion: any) => (
                                                                <div
                                                                    key={criterion.id}
                                                                    className="flex items-center justify-between bg-bg-primary rounded-lg px-4 py-3"
                                                                >
                                                                    <div>
                                                                        <span className="text-white text-sm font-medium">{criterion.name}</span>
                                                                        {criterion.description && (
                                                                            <span className="text-text-secondary text-sm"> — {criterion.description}</span>
                                                                        )}
                                                                    </div>
                                                                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold whitespace-nowrap ml-3">
                                                                        {criterion.max_points} pts
                                                                    </span>
                                                                </div>
                                                            ))}
                                                            <p className="text-right text-sm text-text-secondary pt-1">
                                                                Total:{' '}
                                                                <span className="text-white font-bold">
                                                                    {detail.criteria.reduce((s: number, c: any) => s + c.max_points, 0)} pts
                                                                </span>
                                                            </p>
                                                        </>
                                                    ) : (
                                                        <p className="text-text-secondary text-sm py-2">Loading criteria...</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
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
