import { useEffect, useState } from 'react';
import { Plus, Clock, Users, FileQuestion, Eye, Trash2 } from 'lucide-react';
import api from '../../services/api';
import CreateQuizModal from '../../components/modals/CreateQuizModal';
import ViewQuizAttemptsModal from '../../components/modals/ViewQuizAttemptsModal';

interface Section {
    id: number;
    name: string;
    course_id: number;
    course_title: string;
    course_code: string;
}

interface Quiz {
    id: number;
    course_id: number;
    title: string;
    description: string | null;
    time_limit: number | null;
    max_attempts: number;
    passing_score: number | null;
    available_from: string | null;
    available_until: string | null;
    created_at: string;
}

interface QuizWithStats extends Quiz {
    question_count: number;
    attempt_count: number;
}

const TeacherQuizzes = () => {
    const [sections, setSections] = useState<Section[]>([]);
    const [selectedSection, setSelectedSection] = useState<Section | null>(null);
    const [quizzes, setQuizzes] = useState<QuizWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAttemptsModal, setShowAttemptsModal] = useState(false);
    const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

    useEffect(() => {
        fetchSections();
    }, []);

    useEffect(() => {
        if (selectedSection) {
            fetchQuizzes();
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

    const fetchQuizzes = async () => {
        if (!selectedSection) return;

        setLoading(true);
        try {
            const response = await api.get(`/quizzes/course/${selectedSection.course_id}`);

            // Fetch stats for each quiz
            const quizzesWithStats = await Promise.all(
                response.data.map(async (quiz: Quiz) => {
                    try {
                        const [detailsRes, attemptsRes] = await Promise.all([
                            api.get(`/quizzes/${quiz.id}`),
                            api.get(`/quizzes/${quiz.id}/attempts`)
                        ]);
                        return {
                            ...quiz,
                            question_count: detailsRes.data.questions?.length || 0,
                            attempt_count: attemptsRes.data.length || 0
                        };
                    } catch {
                        return {
                            ...quiz,
                            question_count: 0,
                            attempt_count: 0
                        };
                    }
                })
            );

            setQuizzes(quizzesWithStats);
        } catch (error) {
            console.error('Failed to fetch quizzes:', error);
            setQuizzes([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSuccess = () => {
        setShowCreateModal(false);
        fetchQuizzes();
    };

    const handleViewAttempts = (quiz: Quiz) => {
        setSelectedQuiz(quiz);
        setShowAttemptsModal(true);
    };

    const handleDeleteQuiz = async (quizId: number) => {
        if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
            return;
        }

        try {
            await api.delete(`/quizzes/${quizId}`);
            fetchQuizzes();
        } catch (error) {
            console.error('Failed to delete quiz:', error);
            alert('Failed to delete quiz');
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'No limit';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const isAvailable = (quiz: Quiz) => {
        const now = new Date();
        if (quiz.available_from && new Date(quiz.available_from) > now) return false;
        if (quiz.available_until && new Date(quiz.available_until) < now) return false;
        return true;
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
                        Quiz Management
                    </h1>
                    <p className="text-text-secondary mt-1">Create and manage quizzes with auto-grading</p>
                </div>
                {selectedSection && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium flex items-center gap-2 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Create Quiz
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

            {/* Quizzes List */}
            {loading ? (
                <div className="bg-bg-secondary rounded-xl p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                    <p className="text-text-secondary mt-4">Loading quizzes...</p>
                </div>
            ) : quizzes.length === 0 ? (
                <div className="bg-bg-secondary rounded-xl p-12 text-center">
                    <FileQuestion className="w-16 h-16 text-text-secondary mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Quizzes Yet</h3>
                    <p className="text-text-secondary mb-6">Create your first quiz to get started</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium inline-flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Create Quiz
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {quizzes.map((quiz) => (
                        <div
                            key={quiz.id}
                            className="bg-bg-secondary rounded-xl border border-white/5 p-6 hover:border-primary/50 transition-all duration-300"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-white mb-2">
                                        {quiz.title}
                                    </h3>
                                    {quiz.description && (
                                        <p className="text-text-secondary text-sm line-clamp-2">
                                            {quiz.description}
                                        </p>
                                    )}
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${isAvailable(quiz)
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-gray-500/20 text-gray-400'
                                    }`}>
                                    {isAvailable(quiz) ? 'Available' : 'Unavailable'}
                                </span>
                            </div>

                            <div className="space-y-3 mb-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <Clock className="w-4 h-4 text-text-secondary" />
                                    <span className="text-text-secondary">Time Limit:</span>
                                    <span className="text-white font-medium">
                                        {quiz.time_limit ? `${quiz.time_limit} min` : 'No limit'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <FileQuestion className="w-4 h-4 text-text-secondary" />
                                    <span className="text-text-secondary">Questions:</span>
                                    <span className="text-white font-medium">{quiz.question_count}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Users className="w-4 h-4 text-text-secondary" />
                                    <span className="text-text-secondary">Attempts:</span>
                                    <span className="text-white font-medium">{quiz.attempt_count}</span>
                                </div>
                                {quiz.passing_score && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-text-secondary">Passing Score:</span>
                                        <span className="text-white font-medium">{quiz.passing_score}%</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleViewAttempts(quiz)}
                                    className="flex-1 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                                >
                                    <Eye className="w-4 h-4" />
                                    View Attempts ({quiz.attempt_count})
                                </button>
                                <button
                                    onClick={() => handleDeleteQuiz(quiz.id)}
                                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modals */}
            {showCreateModal && selectedSection && (
                <CreateQuizModal
                    courseId={selectedSection.course_id}
                    courseName={`${selectedSection.course_code} - ${selectedSection.name}`}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={handleCreateSuccess}
                />
            )}

            {showAttemptsModal && selectedQuiz && (
                <ViewQuizAttemptsModal
                    quiz={selectedQuiz}
                    onClose={() => {
                        setShowAttemptsModal(false);
                        setSelectedQuiz(null);
                        fetchQuizzes();
                    }}
                />
            )}
        </div>
    );
};

export default TeacherQuizzes;
