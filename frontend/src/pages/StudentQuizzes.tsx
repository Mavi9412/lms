import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle, PlayCircle, Award, BookOpen, AlertCircle, FileText } from 'lucide-react';
import api from '../services/api';

interface Quiz {
    id: number;
    title: string;
    description: string;
    time_limit: number;
    max_attempts: number;
    passing_score: number;
    available_from: string | null;
    available_until: string | null;
    show_correct_answers: boolean;
    course_id: number;
    course_title: string;
}

interface Attempt {
    id: number;
    quiz_id: number;
    student_id: number;
    score: number;
    total_questions: number;
    started_at: string;
    submitted_at: string | null;
}

interface QuizWithStatus extends Quiz {
    attempts: Attempt[];
    best_score: number | null;
    attempt_count: number;
    status: 'available' | 'in_progress' | 'completed' | 'expired' | 'max_attempts';
}

const StudentQuizzes = () => {
    const [quizzes, setQuizzes] = useState<QuizWithStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async () => {
        setLoading(true);
        try {
            const userResponse = await api.get('/auth/me');
            const enrollmentsResponse = await api.get(`/users/${userResponse.data.id}/enrollments`);

            const allQuizzes: QuizWithStatus[] = [];

            for (const enrollment of enrollmentsResponse.data || []) {
                try {
                    const quizzesRes = await api.get(`/quizzes/course/${enrollment.course_id}`);

                    for (const quiz of quizzesRes.data) {
                        // Fetch attempts for this quiz
                        try {
                            const attemptsRes = await api.get(`/quizzes/${quiz.id}/my-attempts`);
                            const attempts = attemptsRes.data || [];

                            const completedAttempts = attempts.filter((a: Attempt) => a.submitted_at);
                            const bestScore = completedAttempts.length > 0
                                ? Math.max(...completedAttempts.map((a: Attempt) => a.score))
                                : null;

                            const inProgressAttempt = attempts.find((a: Attempt) => !a.submitted_at);

                            let status: 'available' | 'in_progress' | 'completed' | 'expired' | 'max_attempts' = 'available';

                            if (inProgressAttempt) {
                                status = 'in_progress';
                            } else if (quiz.available_until && new Date() > new Date(quiz.available_until)) {
                                status = 'expired';
                            } else if (completedAttempts.length >= quiz.max_attempts) {
                                status = 'max_attempts';
                            } else if (completedAttempts.length > 0) {
                                status = 'completed';
                            }

                            allQuizzes.push({
                                ...quiz,
                                course_title: enrollment.course_title,
                                attempts,
                                best_score: bestScore,
                                attempt_count: completedAttempts.length,
                                status
                            });
                        } catch (err) {
                            // No attempts yet
                            let status: 'available' | 'expired' = 'available';
                            if (quiz.available_until && new Date() > new Date(quiz.available_until)) {
                                status = 'expired';
                            }

                            allQuizzes.push({
                                ...quiz,
                                course_title: enrollment.course_title,
                                attempts: [],
                                best_score: null,
                                attempt_count: 0,
                                status
                            });
                        }
                    }
                } catch (error) {
                    console.error(`Failed to fetch quizzes for course ${enrollment.course_id}:`, error);
                }
            }

            setQuizzes(allQuizzes);
        } catch (error) {
            console.error('Failed to fetch quizzes:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'in_progress':
                return { color: 'bg-blue-500/20 text-blue-400', icon: PlayCircle, label: 'In Progress' };
            case 'completed':
                return { color: 'bg-green-500/20 text-green-400', icon: CheckCircle, label: 'Completed' };
            case 'expired':
                return { color: 'bg-red-500/20 text-red-400', icon: AlertCircle, label: 'Expired' };
            case 'max_attempts':
                return { color: 'bg-orange-500/20 text-orange-400', icon: FileText, label: 'Max Attempts' };
            default:
                return { color: 'bg-primary/20 text-primary', icon: PlayCircle, label: 'Available' };
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'No deadline';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredQuizzes = filterStatus === 'all'
        ? quizzes
        : quizzes.filter(q => q.status === filterStatus);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                    My Quizzes
                </h1>
                <p className="text-text-secondary mt-1">{quizzes.length} Total Quizzes</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                {['all', 'available', 'in_progress', 'completed', 'expired'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${filterStatus === status
                                ? 'bg-primary text-white'
                                : 'bg-bg-secondary text-text-secondary hover:bg-white/10'
                            }`}
                    >
                        {status === 'all' ? 'All' : status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        <span className="ml-2 text-xs opacity-75">
                            ({status === 'all' ? quizzes.length : quizzes.filter(q => q.status === status).length})
                        </span>
                    </button>
                ))}
            </div>

            {/* Quizzes List */}
            {filteredQuizzes.length === 0 ? (
                <div className="bg-bg-secondary rounded-xl p-12 text-center">
                    <FileText className="w-16 h-16 text-text-secondary mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Quizzes</h3>
                    <p className="text-text-secondary">
                        {filterStatus === 'all' ? 'No quizzes available yet' : `No ${filterStatus.replace('_', ' ')} quizzes`}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredQuizzes.map((quiz) => {
                        const statusBadge = getStatusBadge(quiz.status);
                        const StatusIcon = statusBadge.icon;
                        const canAttempt = quiz.status === 'available' ||
                            (quiz.status === 'completed' && quiz.attempt_count < quiz.max_attempts);
                        const inProgress = quiz.status === 'in_progress';
                        const inProgressAttempt = quiz.attempts.find(a => !a.submitted_at);

                        return (
                            <div
                                key={quiz.id}
                                className="bg-bg-secondary rounded-xl border border-white/5 overflow-hidden hover:border-primary/30 transition-all duration-300"
                            >
                                {/* Header */}
                                <div className="p-6 border-b border-white/5">
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="p-2 bg-primary/20 rounded-lg">
                                            <FileText className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-white mb-1">
                                                {quiz.title}
                                            </h3>
                                            <div className="flex items-center gap-2 text-sm text-text-secondary">
                                                <BookOpen className="w-4 h-4" />
                                                <span>{quiz.course_title}</span>
                                            </div>
                                        </div>
                                        <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${statusBadge.color}`}>
                                            <StatusIcon className="w-4 h-4" />
                                            <span className="text-sm font-medium">{statusBadge.label}</span>
                                        </div>
                                    </div>

                                    <p className="text-text-secondary text-sm line-clamp-2">
                                        {quiz.description}
                                    </p>
                                </div>

                                {/* Quiz Details */}
                                <div className="p-6 bg-bg-primary/50 space-y-3">
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-text-secondary" />
                                            <span className="text-text-secondary">{quiz.time_limit} minutes</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Award className="w-4 h-4 text-text-secondary" />
                                            <span className="text-text-secondary">Pass: {quiz.passing_score}%</span>
                                        </div>
                                    </div>

                                    <div className="text-sm">
                                        <span className="text-text-secondary">Attempts: </span>
                                        <span className="text-white font-medium">
                                            {quiz.attempt_count} / {quiz.max_attempts}
                                        </span>
                                    </div>

                                    {quiz.available_until && (
                                        <div className="text-sm">
                                            <span className="text-text-secondary">Available until: </span>
                                            <span className={new Date() > new Date(quiz.available_until) ? 'text-red-400' : 'text-white'}>
                                                {formatDate(quiz.available_until)}
                                            </span>
                                        </div>
                                    )}

                                    {quiz.best_score !== null && (
                                        <div className="p-3 bg-bg-secondary rounded-lg border border-white/10">
                                            <div className="text-sm text-text-secondary mb-1">Best Score</div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-2xl font-bold text-green-400">
                                                    {Math.round((quiz.best_score / quiz.attempts[0]?.total_questions || 1) * 100)}%
                                                </span>
                                                <span className="text-sm text-text-secondary">
                                                    ({quiz.best_score} / {quiz.attempts[0]?.total_questions || 0})
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="p-6 border-t border-white/5">
                                    {inProgress && inProgressAttempt ? (
                                        <Link
                                            to={`/quiz/${quiz.id}/take`}
                                            className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-2"
                                        >
                                            <PlayCircle className="w-5 h-5" />
                                            Continue Quiz
                                        </Link>
                                    ) : canAttempt ? (
                                        <Link
                                            to={`/quiz/${quiz.id}/take`}
                                            className="w-full px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-2"
                                        >
                                            <PlayCircle className="w-5 h-5" />
                                            {quiz.attempt_count > 0 ? 'Retake Quiz' : 'Start Quiz'}
                                        </Link>
                                    ) : quiz.status === 'max_attempts' && quiz.attempts.length > 0 ? (
                                        <Link
                                            to={`/quiz-results/${quiz.attempts[quiz.attempts.length - 1].id}`}
                                            className="w-full px-4 py-2 bg-bg-primary hover:bg-white/10 text-white rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-2"
                                        >
                                            <FileText className="w-5 h-5" />
                                            View Latest Results
                                        </Link>
                                    ) : (
                                        <button
                                            disabled
                                            className="w-full px-4 py-2 bg-gray-500 text-gray-300 rounded-lg font-medium cursor-not-allowed"
                                        >
                                            {quiz.status === 'expired' ? 'Quiz Expired' : 'No Attempts Remaining'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default StudentQuizzes;
