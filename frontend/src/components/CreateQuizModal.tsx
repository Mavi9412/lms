import { useState } from 'react';
import { X, Plus, Trash2, GripVertical } from 'lucide-react';
import api from '../services/api';

interface CreateQuizModalProps {
    isOpen: boolean;
    onClose: () => void;
    courseId: number;
    onCreated: () => void;
}

interface Question {
    question_type: 'mcq' | 'true_false';
    question_text: string;
    points: number;
    order: number;
    options?: string[];
    correct_answer: string;
}

export default function CreateQuizModal({ isOpen, onClose, courseId, onCreated }: CreateQuizModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [timeLimit, setTimeLimit] = useState<number | ''>('');
    const [maxAttempts, setMaxAttempts] = useState(1);
    const [passingScore, setPassingScore] = useState<number | ''>('');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const addQuestion = (type: 'mcq' | 'true_false') => {
        const newQuestion: Question = {
            question_type: type,
            question_text: '',
            points: 1,
            order: questions.length,
            options: type === 'mcq' ? ['', '', '', ''] : undefined,
            correct_answer: type === 'true_false' ? 'true' : '0'
        };
        setQuestions([...questions, newQuestion]);
    };

    const updateQuestion = (index: number, updates: Partial<Question>) => {
        const updated = [...questions];
        updated[index] = { ...updated[index], ...updates };
        setQuestions(updated);
    };

    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
        const updated = [...questions];
        if (updated[questionIndex].options) {
            const newOptions = [...updated[questionIndex].options!];
            newOptions[optionIndex] = value;
            updated[questionIndex].options = newOptions;
            setQuestions(updated);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.post('/quizzes/', {
                course_id: courseId,
                title,
                description,
                time_limit: timeLimit || null,
                max_attempts: maxAttempts,
                passing_score: passingScore || null,
                questions: questions.map((q, i) => ({ ...q, order: i }))
            });

            onCreated();
            onClose();
            // Reset form
            setTitle('');
            setDescription('');
            setTimeLimit('');
            setMaxAttempts(1);
            setPassingScore('');
            setQuestions([]);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to create quiz');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-4xl bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">Create Quiz</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Quiz Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                placeholder="Mid-Term Quiz"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Description (Optional)</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={2}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                                placeholder="Quiz covering chapters 1-5..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Time Limit (minutes)</label>
                            <input
                                type="number"
                                value={timeLimit}
                                onChange={(e) => setTimeLimit(e.target.value ? parseInt(e.target.value) : '')}
                                min="1"
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                placeholder="No limit"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Max Attempts</label>
                            <input
                                type="number"
                                value={maxAttempts}
                                onChange={(e) => setMaxAttempts(parseInt(e.target.value) || 1)}
                                min="1"
                                required
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Passing Score (%)</label>
                            <input
                                type="number"
                                value={passingScore}
                                onChange={(e) => setPassingScore(e.target.value ? parseInt(e.target.value) : '')}
                                min="0"
                                max="100"
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                placeholder="Optional"
                            />
                        </div>
                    </div>

                    {/* Questions */}
                    <div className="border-t border-gray-700 pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">Questions</h3>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => addQuestion('mcq')}
                                    className="px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-sm rounded-lg transition-colors"
                                >
                                    + MCQ
                                </button>
                                <button
                                    type="button"
                                    onClick={() => addQuestion('true_false')}
                                    className="px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-sm rounded-lg transition-colors"
                                >
                                    + True/False
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {questions.map((question, qIndex) => (
                                <div key={qIndex} className="bg-gray-750 border border-gray-600 rounded-lg p-4">
                                    <div className="flex items-start gap-3 mb-3">
                                        <GripVertical className="w-5 h-5 text-gray-500 mt-2" />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-sm font-medium text-teal-400">
                                                    Q{qIndex + 1} - {question.question_type === 'mcq' ? 'Multiple Choice' : 'True/False'}
                                                </span>
                                                <input
                                                    type="number"
                                                    value={question.points}
                                                    onChange={(e) => updateQuestion(qIndex, { points: parseFloat(e.target.value) || 1 })}
                                                    min="0.5"
                                                    step="0.5"
                                                    className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                                                    placeholder="Points"
                                                />
                                                <span className="text-sm text-gray-400">pts</span>
                                            </div>

                                            <textarea
                                                value={question.question_text}
                                                onChange={(e) => updateQuestion(qIndex, { question_text: e.target.value })}
                                                required
                                                rows={2}
                                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-teal-500 resize-none mb-3"
                                                placeholder="Enter your question..."
                                            />

                                            {question.question_type === 'mcq' && question.options && (
                                                <div className="space-y-2">
                                                    {question.options.map((option, oIndex) => (
                                                        <div key={oIndex} className="flex items-center gap-2">
                                                            <input
                                                                type="radio"
                                                                name={`correct-${qIndex}`}
                                                                checked={question.correct_answer === String(oIndex)}
                                                                onChange={() => updateQuestion(qIndex, { correct_answer: String(oIndex) })}
                                                                className="text-teal-500"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={option}
                                                                onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                                                required
                                                                className="flex-1 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                                                                placeholder={`Option ${oIndex + 1}`}
                                                            />
                                                        </div>
                                                    ))}
                                                    <p className="text-xs text-gray-400 mt-2">Select the correct answer</p>
                                                </div>
                                            )}

                                            {question.question_type === 'true_false' && (
                                                <div className="flex gap-4">
                                                    <label className="flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            name={`tf-${qIndex}`}
                                                            checked={question.correct_answer === 'true'}
                                                            onChange={() => updateQuestion(qIndex, { correct_answer: 'true' })}
                                                            className="text-teal-500"
                                                        />
                                                        <span className="text-sm text-white">True</span>
                                                    </label>
                                                    <label className="flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            name={`tf-${qIndex}`}
                                                            checked={question.correct_answer === 'false'}
                                                            onChange={() => updateQuestion(qIndex, { correct_answer: 'false' })}
                                                            className="text-teal-500"
                                                        />
                                                        <span className="text-sm text-white">False</span>
                                                    </label>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => removeQuestion(qIndex)}
                                            className="text-red-400 hover:text-red-300 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {questions.length === 0 && (
                                <p className="text-center text-gray-400 py-8">
                                    No questions added yet. Click "MCQ" or "True/False" to add questions.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-gray-700 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || questions.length === 0}
                            className="px-6 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg font-semibold hover:from-teal-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating...' : 'Create Quiz'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
