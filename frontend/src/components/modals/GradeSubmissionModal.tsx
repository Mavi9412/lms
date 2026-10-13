import { useState, useEffect } from 'react';
import { X, Star, Award, ChevronDown } from 'lucide-react';
import api from '../../services/api';

interface Submission {
    id: number;
    student_id: number;
    student_name: string;
    student_email: string;
    content: string;
    file_path: string | null;
    submitted_at: string;
    grade: number | null;
    feedback: string | null;
}

interface RubricCriterion {
    id: number;
    name: string;
    description: string | null;
    max_points: number;
}

interface Rubric {
    id: number;
    title: string;
    description: string | null;
}

interface RubricDetail extends Rubric {
    criteria: RubricCriterion[];
}

interface Props {
    submission: Submission;
    maxPoints: number;
    courseId?: number;
    onClose: () => void;
    onSuccess: () => void;
}

const GradeSubmissionModal = ({ submission, maxPoints, courseId, onClose, onSuccess }: Props) => {
    const [grade, setGrade] = useState(submission.grade?.toString() || '');
    const [feedback, setFeedback] = useState(submission.feedback || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [rubrics, setRubrics] = useState<RubricDetail[]>([]);
    const [showRubrics, setShowRubrics] = useState(false);

    useEffect(() => {
        if (courseId) fetchRubrics();
    }, [courseId]);

    const fetchRubrics = async () => {
        try {
            const listRes = await api.get(`/rubrics/course/${courseId}`);
            const details = await Promise.all(
                (listRes.data as Rubric[]).map((r) => api.get(`/rubrics/${r.id}`).then((res) => res.data))
            );
            setRubrics(details);
        } catch (err) {
            console.error('Failed to fetch rubrics:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const gradeNum = parseFloat(grade);
        if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > maxPoints) {
            setError(`Grade must be between 0 and ${maxPoints}`);
            setLoading(false);
            return;
        }

        try {
            await api.post(`/assignments/submissions/${submission.id}/grade`, {
                grade: gradeNum,
                feedback: feedback
            });
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to grade submission');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-bg-secondary rounded-xl border border-white/10 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-bg-secondary z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Grade Submission</h2>
                        <p className="text-text-secondary text-sm mt-1">
                            {submission.student_name} • {submission.student_email}
                        </p>
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
                    {error && (
                        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
                            {error}
                        </div>
                    )}

                    {/* Submission Details */}
                    <div className="bg-bg-primary rounded-lg p-4 mb-6">
                        <h3 className="text-sm font-medium text-text-secondary mb-2">Submission Details</h3>
                        <p className="text-sm text-text-secondary mb-2">
                            Submitted: {formatDate(submission.submitted_at)}
                        </p>

                        <div className="mt-4">
                            <h4 className="text-sm font-medium text-white mb-2">Student's Work:</h4>
                            <div className="bg-bg-secondary rounded-lg p-4 border border-white/5">
                                {submission.content ? (
                                    <p className="text-white whitespace-pre-wrap">{submission.content}</p>
                                ) : (
                                    <p className="text-text-secondary italic">No text content provided</p>
                                )}
                            </div>
                        </div>

                        {submission.file_path && (
                            <div className="mt-4">
                                <h4 className="text-sm font-medium text-white mb-2">Attached File:</h4>
                                <a
                                    href={`http://localhost:8000/${submission.file_path}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors"
                                >
                                    <Star className="w-4 h-4" />
                                    Download / View File
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Grading Rubric Reference */}
                    {rubrics.length > 0 && (
                        <div className="bg-bg-primary rounded-lg p-4 mb-6 border border-white/5">
                            <button
                                type="button"
                                onClick={() => setShowRubrics(!showRubrics)}
                                className="flex items-center justify-between w-full text-left"
                            >
                                <span className="flex items-center gap-2 text-sm font-medium text-white">
                                    <Award className="w-4 h-4 text-primary" />
                                    Grading Rubric{rubrics.length > 1 ? 's' : ''} ({rubrics.length})
                                </span>
                                <ChevronDown
                                    className={`w-4 h-4 text-text-secondary transition-transform ${showRubrics ? 'rotate-180' : ''}`}
                                />
                            </button>
                            {showRubrics && (
                                <div className="mt-3 space-y-4">
                                    {rubrics.map((rubric) => (
                                        <div key={rubric.id}>
                                            <p className="text-sm font-medium text-primary mb-2">{rubric.title}</p>
                                            <div className="space-y-1.5">
                                                {rubric.criteria.map((criterion) => (
                                                    <div
                                                        key={criterion.id}
                                                        className="flex items-center justify-between text-sm bg-bg-secondary rounded-lg px-3 py-2"
                                                    >
                                                        <div>
                                                            <span className="text-white">{criterion.name}</span>
                                                            {criterion.description && (
                                                                <span className="text-text-secondary"> — {criterion.description}</span>
                                                            )}
                                                        </div>
                                                        <span className="text-text-secondary whitespace-nowrap ml-3">
                                                            {criterion.max_points} pts
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Grading Form */}
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            {/* Grade Input */}
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">
                                    Grade (out of {maxPoints} points) *
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={grade}
                                        onChange={(e) => setGrade(e.target.value)}
                                        className="w-full px-4 py-3 bg-bg-primary border border-white/10 rounded-lg focus:outline-none focus:border-primary transition-colors text-white"
                                        placeholder="0"
                                        min="0"
                                        max={maxPoints}
                                        step="0.5"
                                        required
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary">
                                        / {maxPoints}
                                    </div>
                                </div>
                                {grade && (
                                    <p className="text-sm text-text-secondary mt-1">
                                        Percentage: {((parseFloat(grade) / maxPoints) * 100).toFixed(1)}%
                                    </p>
                                )}
                            </div>

                            {/* Feedback */}
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">
                                    Feedback (Optional)
                                </label>
                                <textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    className="w-full px-4 py-3 bg-bg-primary border border-white/10 rounded-lg focus:outline-none focus:border-primary transition-colors text-white min-h-[120px]"
                                    placeholder="Provide constructive feedback to help the student improve..."
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-white/10">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : 'Save Grade'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default GradeSubmissionModal;
