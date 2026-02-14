import { useEffect, useState } from 'react';
import { X, User, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import api from '../../services/api';

interface Quiz {
    id: number;
    title: string;
    time_limit: number | null;
    max_attempts: number;
    passing_score: number | null;
}

interface Attempt {
    id: number;
    quiz_id: number;
    student_id: number;
    attempt_number: number;
    started_at: string;
    submitted_at: string | null;
    score: number | null;
    max_score: number | null;
    percentage: number | null;
}

interface AttemptWithStudent extends Attempt {
    student_name: string;
    student_email: string;
}

interface Props {
    quiz: Quiz;
    onClose: () => void;
}

const ViewQuizAttemptsModal = ({ quiz, onClose }: Props) => {
    const [attempts, setAttempts] = useState<AttemptWithStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAttempt, setSelectedAttempt] = useState<number | null>(null);
    const [attemptDetails, setAttemptDetails] = useState<any>(null);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        fetchAttempts();
    }, [quiz.id]);

    const fetchAttempts = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/quizzes/${quiz.id}/attempts`);

            // Fetch student details for each attempt
            const attemptsWithStudents = await Promise.all(
                response.data.map(async (attempt: Attempt) => {
                    try {
                        // Get student info from admin endpoint
                        const userRes = await api.get(`/admin/users`);
                        const student = userRes.data.find((u: any) => u.id === attempt.student_id);
                        return {
                            ...attempt,
                            student_name: student?.full_name || 'Unknown Student',
                            student_email: student?.email || ''
                        };
                    } catch {
                        return {
                            ...attempt,
                            student_name: 'Unknown Student',
                            student_email: ''
                        };
                    }
                })
            );

            setAttempts(attemptsWithStudents);
        } catch (error) {
            console.error('Failed to fetch attempts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (attemptId: number) => {
        try {
            const response = await api.get(`/quizzes/attempt/${attemptId}/results`);
            setAttemptDetails(response.data);
            setSelectedAttempt(attemptId);
            setShowDetails(true);
        } catch (error) {
            console.error('Failed to fetch attempt details:', error);
            alert('Failed to load attempt details');
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'In progress';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTimeTaken = (started: string, submitted: string | null) => {
        if (!submitted) return 'In progress';
        const start = new Date(started).getTime();
        const end = new Date(submitted).getTime();
        const diff = Math.floor((end - start) / 1000 / 60); // minutes
        return `${diff} min`;
    };

    const getPassStatus = (percentage: number | null) => {
        if (percentage === null) return null;
        if (!quiz.passing_score) return null;
        return percentage >= quiz.passing_score;
    };

    const submittedAttempts = attempts.filter(a => a.submitted_at);
    const avgScore = submittedAttempts.length > 0
        ? submittedAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / submittedAttempts.length
        : 0;

    return (
        <>
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-bg-secondary rounded-xl border border-white/10 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-bg-secondary z-10">
                        <div>
                            <h2 className="text-2xl font-bold text-white">{quiz.title} - Attempts</h2>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                                <span className="text-text-secondary">
                                    Total Attempts: <span className="text-white font-medium">{attempts.length}</span>
                                </span>
                                <span className="text-text-secondary">
                                    Submitted: <span className="text-white font-medium">{submittedAttempts.length}</span>
                                </span>
                                <span className="text-text-secondary">
                                    Avg Score: <span className="text-white font-medium">{avgScore.toFixed(1)}%</span>
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                                <p className="text-text-secondary mt-4">Loading attempts...</p>
                            </div>
                        ) : attempts.length === 0 ? (
                            <div className="text-center py-12">
                                <Clock className="w-16 h-16 text-text-secondary mx-auto mb-4 opacity-50" />
                                <h3 className="text-xl font-semibold text-white mb-2">No Attempts Yet</h3>
                                <p className="text-text-secondary">Students haven't taken this quiz yet.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            <th className="text-left py-3 px-4 text-text-secondary font-medium">Student</th>
                                            <th className="text-center py-3 px-4 text-text-secondary font-medium">Attempt</th>
                                            <th className="text-center py-3 px-4 text-text-secondary font-medium">Submitted</th>
                                            <th className="text-center py-3 px-4 text-text-secondary font-medium">Time Taken</th>
                                            <th className="text-center py-3 px-4 text-text-secondary font-medium">Score</th>
                                            <th className="text-center py-3 px-4 text-text-secondary font-medium">Status</th>
                                            <th className="text-center py-3 px-4 text-text-secondary font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attempts.map((attempt) => {
                                            const passStatus = getPassStatus(attempt.percentage);
                                            return (
                                                <tr
                                                    key={attempt.id}
                                                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                                >
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <User className="w-8 h-8 p-1.5 bg-primary/20 text-primary rounded-full" />
                                                            <div>
                                                                <p className="font-medium text-white">{attempt.student_name}</p>
                                                                <p className="text-sm text-text-secondary">{attempt.student_email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        <span className="text-white font-medium">
                                                            #{attempt.attempt_number}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        <span className="text-sm text-text-secondary">
                                                            {formatDate(attempt.submitted_at)}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        <span className="text-sm text-text-secondary">
                                                            {getTimeTaken(attempt.started_at, attempt.submitted_at)}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        {attempt.submitted_at ? (
                                                            <div>
                                                                <span className="text-lg font-bold text-white block">
                                                                    {attempt.percentage?.toFixed(1)}%
                                                                </span>
                                                                <span className="text-xs text-text-secondary">
                                                                    {attempt.score?.toFixed(1)} / {attempt.max_score}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-text-secondary">-</span>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        {attempt.submitted_at ? (
                                                            passStatus !== null ? (
                                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${passStatus
                                                                        ? 'bg-green-500/20 text-green-400'
                                                                        : 'bg-red-500/20 text-red-400'
                                                                    }`}>
                                                                    {passStatus ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                                    {passStatus ? 'Passed' : 'Failed'}
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
                                                                    Completed
                                                                </span>
                                                            )
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm font-medium">
                                                                <Clock className="w-4 h-4" />
                                                                In Progress
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        {attempt.submitted_at && (
                                                            <button
                                                                onClick={() => handleViewDetails(attempt.id)}
                                                                className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors text-sm font-medium inline-flex items-center gap-2"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                                View Answers
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-white/10 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>

            {/* Attempt Details Modal */}
            {showDetails && attemptDetails && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-bg-secondary rounded-xl border border-white/10 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-bg-secondary">
                            <h3 className="text-xl font-bold text-white">Attempt Details</h3>
                            <button
                                onClick={() => setShowDetails(false)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {attemptDetails.results.map((result: any, index: number) => (
                                <div
                                    key={index}
                                    className={`border rounded-lg p-4 ${result.is_correct
                                            ? 'border-green-500/30 bg-green-500/5'
                                            : 'border-red-500/30 bg-red-500/5'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h4 className="font-medium text-white flex-1">
                                            Question {index + 1}: {result.question_text}
                                        </h4>
                                        <span className={`text-sm font-medium ${result.is_correct ? 'text-green-400' : 'text-red-400'
                                            }`}>
                                            {result.points_earned} / {result.points} pts
                                        </span>
                                    </div>

                                    {result.options && (
                                        <div className="ml-4 space-y-1 mb-2">
                                            {result.options.map((opt: string, i: number) => (
                                                <div
                                                    key={i}
                                                    className={`text-sm p-2 rounded ${opt === result.correct_answer
                                                            ? 'bg-green-500/20 text-green-400'
                                                            : opt === result.student_answer && !result.is_correct
                                                                ? 'bg-red-500/20 text-red-400'
                                                                : 'text-text-secondary'
                                                        }`}
                                                >
                                                    {String.fromCharCode(65 + i)}. {opt}
                                                    {opt === result.correct_answer && ' ✓'}
                                                    {opt === result.student_answer && opt !== result.correct_answer && ' ✗'}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="text-sm space-y-1">
                                        <p className="text-text-secondary">
                                            Student Answer: <span className={result.is_correct ? 'text-green-400' : 'text-red-400'}>
                                                {result.student_answer || 'No answer'}
                                            </span>
                                        </p>
                                        {!result.is_correct && (
                                            <p className="text-text-secondary">
                                                Correct Answer: <span className="text-green-400">{result.correct_answer}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-6 border-t border-white/10 flex justify-end">
                            <button
                                onClick={() => setShowDetails(false)}
                                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ViewQuizAttemptsModal;
