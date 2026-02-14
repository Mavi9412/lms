import { useState } from 'react';
import { X, Plus, Trash2, GripVertical } from 'lucide-react';
import api from '../../services/api';

interface QuestionData {
    question_type: 'mcq' | 'true_false';
    question_text: string;
    points: number;
    order: number;
    options?: string[];
    correct_answer: string;
}

interface Props {
    courseId: number;
    courseName: string;
    onClose: () => void;
    onSuccess: () => void;
}

const CreateQuizModal = ({ courseId, courseName, onClose, onSuccess }: Props) => {
    const [step, setStep] = useState<'details' | 'questions'>('details');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Quiz details
    const [quizData, setQuizData] = useState({
        title: '',
        description: '',
        time_limit: '',
        max_attempts: 1,
        passing_score: '',
        available_from: '',
        available_until: ''
    });

    // Questions
    const [questions, setQuestions] = useState<QuestionData[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState<QuestionData>({
        question_type: 'mcq',
        question_text: '',
        points: 1,
        order: 0,
        options: ['', '', '', ''],
        correct_answer: ''
    });

    const handleAddQuestion = () => {
        if (!currentQuestion.question_text.trim()) {
            setError('Please enter a question');
            return;
        }

        if (currentQuestion.question_type === 'mcq') {
            const filledOptions = currentQuestion.options?.filter(opt => opt.trim()) || [];
            if (filledOptions.length < 2) {
                setError('Please provide at least 2 options for MCQ');
                return;
            }
            if (!currentQuestion.correct_answer) {
                setError('Please select the correct answer');
                return;
            }
        } else {
            if (!currentQuestion.correct_answer) {
                setError('Please select the correct answer (True/False)');
                return;
            }
        }

        const newQuestion = {
            ...currentQuestion,
            order: questions.length
        };

        setQuestions([...questions, newQuestion]);
        setCurrentQuestion({
            question_type: 'mcq',
            question_text: '',
            points: 1,
            order: 0,
            options: ['', '', '', ''],
            correct_answer: ''
        });
        setError('');
    };

    const handleRemoveQuestion = (index: number) => {
        const updated = questions.filter((_, i) => i !== index);
        // Update order
        updated.forEach((q, i) => q.order = i);
        setQuestions(updated);
    };

    const handleSubmit = async () => {
        if (questions.length === 0) {
            setError('Please add at least one question');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await api.post('/quizzes/', {
                course_id: courseId,
                title: quizData.title,
                description: quizData.description || null,
                time_limit: quizData.time_limit ? parseInt(quizData.time_limit) : null,
                max_attempts: quizData.max_attempts,
                passing_score: quizData.passing_score ? parseFloat(quizData.passing_score) : null,
                available_from: quizData.available_from || null,
                available_until: quizData.available_until || null,
                questions: questions.map(q => ({
                    ...q,
                    options: q.question_type === 'mcq' ? q.options?.filter(opt => opt.trim()) : null
                }))
            });
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to create quiz');
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        if (!quizData.title.trim()) {
            setError('Please enter a quiz title');
            return;
        }
        setError('');
        setStep('questions');
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-bg-secondary rounded-xl border border-white/10 max-w-4xl w-full my-8">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-bg-secondary z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            {step === 'details' ? 'Create Quiz - Details' : 'Create Quiz - Add Questions'}
                        </h2>
                        <p className="text-text-secondary text-sm mt-1">{courseName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {error && (
                        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
                            {error}
                        </div>
                    )}

                    {step === 'details' ? (
                        /* Quiz Details Form */
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">
                                    Quiz Title *
                                </label>
                                <input
                                    type="text"
                                    value={quizData.title}
                                    onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
                                    className="w-full px-4 py-3 bg-bg-primary border border-white/10 rounded-lg focus:outline-none focus:border-primary transition-colors text-white"
                                    placeholder="e.g., Chapter 5 Quiz"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={quizData.description}
                                    onChange={(e) => setQuizData({ ...quizData, description: e.target.value })}
                                    className="w-full px-4 py-3 bg-bg-primary border border-white/10 rounded-lg focus:outline-none focus:border-primary transition-colors text-white min-h-[100px]"
                                    placeholder="Brief description of the quiz..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-2">
                                        Time Limit (minutes)
                                    </label>
                                    <input
                                        type="number"
                                        value={quizData.time_limit}
                                        onChange={(e) => setQuizData({ ...quizData, time_limit: e.target.value })}
                                        className="w-full px-4 py-3 bg-bg-primary border border-white/10 rounded-lg focus:outline-none focus:border-primary transition-colors text-white"
                                        placeholder="No limit"
                                        min="1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-2">
                                        Max Attempts
                                    </label>
                                    <input
                                        type="number"
                                        value={quizData.max_attempts}
                                        onChange={(e) => setQuizData({ ...quizData, max_attempts: parseInt(e.target.value) || 1 })}
                                        className="w-full px-4 py-3 bg-bg-primary border border-white/10 rounded-lg focus:outline-none focus:border-primary transition-colors text-white"
                                        min="1"
                                        max="10"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-2">
                                        Passing Score (%)
                                    </label>
                                    <input
                                        type="number"
                                        value={quizData.passing_score}
                                        onChange={(e) => setQuizData({ ...quizData, passing_score: e.target.value })}
                                        className="w-full px-4 py-3 bg-bg-primary border border-white/10 rounded-lg focus:outline-none focus:border-primary transition-colors text-white"
                                        placeholder="Optional"
                                        min="0"
                                        max="100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-2">
                                        Available From
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={quizData.available_from}
                                        onChange={(e) => setQuizData({ ...quizData, available_from: e.target.value })}
                                        className="w-full px-4 py-3 bg-bg-primary border border-white/10 rounded-lg focus:outline-none focus:border-primary transition-colors text-white"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-text-secondary mb-2">
                                        Available Until
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={quizData.available_until}
                                        onChange={(e) => setQuizData({ ...quizData, available_until: e.target.value })}
                                        className="w-full px-4 py-3 bg-bg-primary border border-white/10 rounded-lg focus:outline-none focus:border-primary transition-colors text-white"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Questions Management */
                        <div className="space-y-6">
                            {/* Existing Questions */}
                            {questions.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-white mb-3">Added Questions ({questions.length})</h3>
                                    {questions.map((q, index) => (
                                        <div key={index} className="bg-bg-primary rounded-lg p-4 border border-white/5">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <GripVertical className="w-4 h-4 text-text-secondary" />
                                                        <span className="text-sm font-medium text-primary">
                                                            Question {index + 1}
                                                        </span>
                                                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                                                            {q.question_type === 'mcq' ? 'MCQ' : 'True/False'}
                                                        </span>
                                                        <span className="text-xs text-text-secondary">
                                                            {q.points} {q.points === 1 ? 'point' : 'points'}
                                                        </span>
                                                    </div>
                                                    <p className="text-white mb-2">{q.question_text}</p>
                                                    {q.question_type === 'mcq' && q.options && (
                                                        <div className="ml-4 space-y-1">
                                                            {q.options.filter(opt => opt.trim()).map((opt, i) => (
                                                                <div key={i} className="flex items-center gap-2 text-sm">
                                                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${opt === q.correct_answer
                                                                            ? 'bg-green-500/20 text-green-400 border border-green-400'
                                                                            : 'bg-white/5 text-text-secondary'
                                                                        }`}>
                                                                        {String.fromCharCode(65 + i)}
                                                                    </span>
                                                                    <span className="text-text-secondary">{opt}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveQuestion(index)}
                                                    className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add New Question Form */}
                            <div className="bg-bg-primary rounded-lg p-4 border border-white/10">
                                <h3 className="font-semibold text-white mb-4">Add New Question</h3>

                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-text-secondary mb-2">
                                                Question Type
                                            </label>
                                            <select
                                                value={currentQuestion.question_type}
                                                onChange={(e) => setCurrentQuestion({
                                                    ...currentQuestion,
                                                    question_type: e.target.value as 'mcq' | 'true_false',
                                                    options: e.target.value === 'mcq' ? ['', '', '', ''] : undefined,
                                                    correct_answer: ''
                                                })}
                                                className="w-full px-4 py-2 bg-bg-secondary border border-white/10 rounded-lg focus:outline-none focus:border-primary transition-colors text-white"
                                            >
                                                <option value="mcq">Multiple Choice (MCQ)</option>
                                                <option value="true_false">True/False</option>
                                            </select>
                                        </div>
                                        <div className="w-32">
                                            <label className="block text-sm font-medium text-text-secondary mb-2">
                                                Points
                                            </label>
                                            <input
                                                type="number"
                                                value={currentQuestion.points}
                                                onChange={(e) => setCurrentQuestion({ ...currentQuestion, points: parseFloat(e.target.value) || 1 })}
                                                className="w-full px-4 py-2 bg-bg-secondary border border-white/10 rounded-lg focus:outline-none focus:border-primary transition-colors text-white"
                                                min="0.5"
                                                step="0.5"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-2">
                                            Question Text *
                                        </label>
                                        <textarea
                                            value={currentQuestion.question_text}
                                            onChange={(e) => setCurrentQuestion({ ...currentQuestion, question_text: e.target.value })}
                                            className="w-full px-4 py-3 bg-bg-secondary border border-white/10 rounded-lg focus:outline-none focus:border-primary transition-colors text-white min-h-[80px]"
                                            placeholder="Enter your question here..."
                                        />
                                    </div>

                                    {currentQuestion.question_type === 'mcq' ? (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-text-secondary mb-2">
                                                    Options (at least 2)
                                                </label>
                                                <div className="space-y-2">
                                                    {currentQuestion.options?.map((option, index) => (
                                                        <div key={index} className="flex items-center gap-2">
                                                            <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-medium text-sm">
                                                                {String.fromCharCode(65 + index)}
                                                            </span>
                                                            <input
                                                                type="text"
                                                                value={option}
                                                                onChange={(e) => {
                                                                    const newOptions = [...(currentQuestion.options || [])];
                                                                    newOptions[index] = e.target.value;
                                                                    setCurrentQuestion({ ...currentQuestion, options: newOptions });
                                                                }}
                                                                className="flex-1 px-4 py-2 bg-bg-secondary border border-white/10 rounded-lg focus:outline-none focus:border-primary transition-colors text-white"
                                                                placeholder={`Option ${String.fromCharCode(65 + index)}`}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-text-secondary mb-2">
                                                    Correct Answer *
                                                </label>
                                                <select
                                                    value={currentQuestion.correct_answer}
                                                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, correct_answer: e.target.value })}
                                                    className="w-full px-4 py-2 bg-bg-secondary border border-white/10 rounded-lg focus:outline-none focus:border-primary transition-colors text-white"
                                                >
                                                    <option value="">Select correct answer</option>
                                                    {currentQuestion.options?.filter(opt => opt.trim()).map((opt, i) => (
                                                        <option key={i} value={opt}>
                                                            {String.fromCharCode(65 + i)} - {opt}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </>
                                    ) : (
                                        <div>
                                            <label className="block text-sm font-medium text-text-secondary mb-2">
                                                Correct Answer *
                                            </label>
                                            <div className="flex gap-4">
                                                <button
                                                    onClick={() => setCurrentQuestion({ ...currentQuestion, correct_answer: 'true' })}
                                                    className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${currentQuestion.correct_answer === 'true'
                                                            ? 'bg-green-500 text-white'
                                                            : 'bg-bg-secondary border border-white/10 text-text-secondary hover:border-primary'
                                                        }`}
                                                >
                                                    True
                                                </button>
                                                <button
                                                    onClick={() => setCurrentQuestion({ ...currentQuestion, correct_answer: 'false' })}
                                                    className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${currentQuestion.correct_answer === 'false'
                                                            ? 'bg-red-500 text-white'
                                                            : 'bg-bg-secondary border border-white/10 text-text-secondary hover:border-primary'
                                                        }`}
                                                >
                                                    False
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleAddQuestion}
                                        className="w-full px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Question
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 flex justify-between">
                    {step === 'questions' && (
                        <button
                            onClick={() => setStep('details')}
                            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium"
                        >
                            Back
                        </button>
                    )}
                    <div className="flex gap-3 ml-auto">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        {step === 'details' ? (
                            <button
                                onClick={handleNext}
                                className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium"
                            >
                                Next: Add Questions
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={loading || questions.length === 0}
                                className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                            >
                                {loading ? 'Creating...' : `Create Quiz (${questions.length} questions)`}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateQuizModal;
