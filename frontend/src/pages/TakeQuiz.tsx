import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Clock, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Question {
    id: number;
    question_type: 'mcq' | 'true_false';
    question_text: string;
    points: number;
    order: number;
    options?: string[];
}

interface Quiz {
    id: number;
    title: string;
    description: string;
    time_limit: number | null;
    max_attempts: number;
    passing_score: number | null;
    questions: Question[];
}

export default function TakeQuiz() {
    const { quizId } = useParams<{ quizId: string }>();
    const navigate = useNavigate();
    const { token, user } = useAuth();

    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [attemptId, setAttemptId] = useState<number | null>(null);
    const [answers, setAnswers] = useState<{ [key: number]: string }>({});
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadQuizAndStart();
    }, [quizId]);

    useEffect(() => {
        if (timeRemaining === null || timeRemaining <= 0) return;

        const timer = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev === null || prev <= 1) {
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeRemaining]);

    const loadQuizAndStart = async () => {
        try {
            // Get quiz details
            const quizRes = await axios.get(`${API_URL}/quizzes/${quizId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setQuiz(quizRes.data);

            // Start attempt
            const attemptRes = await axios.post(
                `${API_URL}/quizzes/${quizId}/start`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setAttemptId(attemptRes.data.id);

            // Set timer if applicable
            if (quizRes.data.time_limit) {
                setTimeRemaining(quizRes.data.time_limit * 60); // Convert minutes to seconds
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load quiz');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (questionId: number, answer: string) => {
        setAnswers({ ...answers, [questionId]: answer });
    };

    const handleSubmit = async () => {
        if (!attemptId) return;

        setSubmitting(true);

        try {
            const result = await axios.post(
                `${API_URL}/quizzes/${quizId}/submit/${attemptId}`,
                { answers },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Navigate to results page
            navigate(`/quiz-results/${attemptId}`, { state: { result: result.data } });
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to submit quiz');
            setSubmitting(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400"></div>
            </div>
        );
    }

    if (error || !quiz) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
                    <p className="text-red-400">{error || 'Quiz not found'}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="mt-4 text-teal-400 hover:text-teal-300 underline"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-3xl font-bold text-white">{quiz.title}</h1>
                    {timeRemaining !== null && (
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${timeRemaining < 300 ? 'bg-red-500/20 text-red-400' : 'bg-teal-500/20 text-teal-400'
                            }`}>
                            <Clock className="w-5 h-5" />
                            <span className="font-mono font-bold">{formatTime(timeRemaining)}</span>
                        </div>
                    )}
                </div>
                {quiz.description && (
                    <p className="text-gray-400">{quiz.description}</p>
                )}
            </div>

            {/* Questions */}
            <div className="space-y-6">
                {quiz.questions.map((question, index) => (
                    <div key={question.id} className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                        <div class="flex items-start justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">
                                Question {index + 1}
                                <span className="ml-2 text-sm text-gray-400">({question.points} pts)</span>
                            </h3>
                        </div>

                        <p className="text-white mb-4">{question.question_text}</p>

                        {question.question_type === 'mcq' && question.options && (
                            <div className="space-y-2">
                                {question.options.map((option, optIndex) => (
                                    <label
                                        key={optIndex}
                                        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${answers[question.id] === String(optIndex)
                                                ? 'border-teal-500 bg-teal-500/10'
                                                : 'border-gray-600 hover:border-gray-500'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name={`question-${question.id}`}
                                            value={optIndex}
                                            checked={answers[question.id] === String(optIndex)}
                                            onChange={(e) => handleAnswer(question.id, e.target.value)}
                                            className="text-teal-500 focus:ring-teal-500"
                                        />
                                        <span className="text-white">{option}</span>
                                    </label>
                                ))}
                            </div>
                        )}

                        {question.question_type === 'true_false' && (
                            <div className="flex gap-4">
                                <label className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${answers[question.id] === 'true'
                                        ? 'border-teal-500 bg-teal-500/10'
                                        : 'border-gray-600 hover:border-gray-500'
                                    }`}>
                                    <input
                                        type="radio"
                                        name={`question-${question.id}`}
                                        value="true"
                                        checked={answers[question.id] === 'true'}
                                        onChange={(e) => handleAnswer(question.id, e.target.value)}
                                        className="text-teal-500 focus:ring-teal-500"
                                    />
                                    <span className="text-white font-medium">True</span>
                                </label>
                                <label className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${answers[question.id] === 'false'
                                        ? 'border-teal-500 bg-teal-500/10'
                                        : 'border-gray-600 hover:border-gray-500'
                                    }`}>
                                    <input
                                        type="radio"
                                        name={`question-${question.id}`}
                                        value="false"
                                        checked={answers[question.id] === 'false'}
                                        onChange={(e) => handleAnswer(question.id, e.target.value)}
                                        className="text-teal-500 focus:ring-teal-500"
                                    />
                                    <span className="text-white font-medium">False</span>
                                </label>
                            </div>
                        )}

                        {!answers[question.id] && (
                            <p className="text-sm text-yellow-400 mt-2">⚠️ Not answered</p>
                        )}
                    </div>
                ))}
            </div>

            {/* Submit Button */}
            <div className="sticky bottom-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 p-6 mt-6 -mx-4 sm:-mx-6 lg:-mx-8">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <p className="text-gray-400">
                        {Object.keys(answers).length} of {quiz.questions.length} answered
                    </p>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="px-8 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg font-semibold hover:from-teal-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Submitting...' : 'Submit Quiz'}
                    </button>
                </div>
            </div>
        </div>
    );
}
