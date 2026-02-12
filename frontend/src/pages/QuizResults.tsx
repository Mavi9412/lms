import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, XCircle, Trophy, Award, ArrowLeft } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface QuestionResult {
    question_id: number;
    question_text: string;
    question_type: string;
    points: number;
    student_answer: string;
    correct_answer: string;
    is_correct: boolean;
    points_earned: number;
    options?: string[];
}

interface AttemptData {
    id: number;
    score: number;
    max_score: number;
    percentage: number;
    submitted_at: string;
}

interface ResultsData {
    attempt: AttemptData;
    results: QuestionResult[];
}

export default function QuizResults() {
    const { attemptId } = useParams<{ attemptId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const { token } = useAuth();

    const [results, setResults] = useState<ResultsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if results passed from submit
        if (location.state?.result) {
            loadResults();
        } else {
            loadResults();
        }
    }, [attemptId]);

    const loadResults = async () => {
        try {
            const response = await axios.get(`${API_URL}/quizzes/attempt/${attemptId}/results`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setResults(response.data);
        } catch (err) {
            console.error('Failed to load results:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400"></div>
            </div>
        );
    }

    if (!results) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
                    <p className="text-red-400">Results not found</p>
                </div>
            </div>
        );
    }

    const { attempt, results: questionResults } = results;
    const passed = attempt.percentage >= 60; // Default passing

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-400 hover:text-gray-200 mb-6 transition-colors"
            >
                <ArrowLeft className="w-5 h-5" />
                Back
            </button>

            {/* Score Summary */}
            <div className={`border-2 rounded-xl p-8 mb-8 text-center ${passed
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}>
                <div className="flex justify-center mb-4">
                    {passed ? (
                        <Trophy className="w-16 h-16 text-green-400" />
                    ) : (
                        <Award className="w-16 h-16 text-red-400" />
                    )}
                </div>

                <h1 className="text-3xl font-bold text-white mb-2">
                    {passed ? 'Congratulations!' : 'Quiz Completed'}
                </h1>

                <div className="text-6xl font-bold mb-4">
                    <span className={passed ? 'text-green-400' : 'text-red-400'}>
                        {attempt.percentage.toFixed(1)}%
                    </span>
                </div>

                <p className="text-xl text-gray-300 mb-4">
                    Score: {attempt.score} / {attempt.max_score} points
                </p>

                <div className="flex justify-center gap-8 text-sm">
                    <div>
                        <span className="text-gray-400">Correct: </span>
                        <span className="text-green-400 font-semibold">
                            {questionResults.filter(r => r.is_correct).length}
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-400">Incorrect: </span>
                        <span className="text-red-400 font-semibold">
                            {questionResults.filter(r => !r.is_correct).length}
                        </span>
                    </div>
                </div>
            </div>

            {/* Detailed Results */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white mb-4">Question Review</h2>

                {questionResults.map((result, index) => (
                    <div
                        key={result.question_id}
                        className={`bg-gray-800 border-2 rounded-xl p-6 ${result.is_correct ? 'border-green-500/30' : 'border-red-500/30'
                            }`}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <h3 className="text-lg font-semibold text-white">
                                Question {index + 1}
                                <span className="ml-2 text-sm text-gray-400">
                                    ({result.points_earned} / {result.points} pts)
                                </span>
                            </h3>
                            {result.is_correct ? (
                                <CheckCircle className="w-6 h-6 text-green-400" />
                            ) : (
                                <XCircle className="w-6 h-6 text-red-400" />
                            )}
                        </div>

                        <p className="text-white mb-4">{result.question_text}</p>

                        {result.question_type === 'mcq' && result.options && (
                            <div className="space-y-2">
                                {result.options.map((option, optIndex) => {
                                    const isStudentAnswer = result.student_answer === String(optIndex);
                                    const isCorrectAnswer = result.correct_answer === String(optIndex);

                                    return (
                                        <div
                                            key={optIndex}
                                            className={`p-3 rounded-lg border-2 ${isCorrectAnswer
                                                    ? 'border-green-500 bg-green-500/10'
                                                    : isStudentAnswer
                                                        ? 'border-red-500 bg-red-500/10'
                                                        : 'border-gray-600'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                {isCorrectAnswer && <CheckCircle className="w-5 h-5 text-green-400" />}
                                                {isStudentAnswer && !isCorrectAnswer && <XCircle className="w-5 h-5 text-red-400" />}
                                                <span className="text-white">{option}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {result.question_type === 'true_false' && (
                            <div className="space-y-2">
                                {['true', 'false'].map((value) => {
                                    const isStudentAnswer = result.student_answer.toLowerCase() === value;
                                    const isCorrectAnswer = result.correct_answer.toLowerCase() === value;

                                    return (
                                        <div
                                            key={value}
                                            className={`p-3 rounded-lg border-2 ${isCorrectAnswer
                                                    ? 'border-green-500 bg-green-500/10'
                                                    : isStudentAnswer
                                                        ? 'border-red-500 bg-red-500/10'
                                                        : 'border-gray-600'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                {isCorrectAnswer && <CheckCircle className="w-5 h-5 text-green-400" />}
                                                {isStudentAnswer && !isCorrectAnswer && <XCircle className="w-5 h-5 text-red-400" />}
                                                <span className="text-white capitalize">{value}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {!result.is_correct && (
                            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                <p className="text-sm text-yellow-400">
                                    <strong>Correct Answer: </strong>
                                    {result.question_type === 'mcq' && result.options
                                        ? result.options[parseInt(result.correct_answer)]
                                        : result.correct_answer}
                                </p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
