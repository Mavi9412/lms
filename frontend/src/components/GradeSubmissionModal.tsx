import React, { useState, useEffect } from 'react';
import { X, CheckCircle, User, Clock, FileText } from 'lucide-react';
import api from '../services/api';

interface Submission {
    id: number;
    student_id: number;
    content: string;
    submitted_at: string;
    grade: number | null;
    feedback: string | null;
}

interface GradeSubmissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    assignmentId: number;
    assignmentTitle: string;
}

const GradeSubmissionModal = ({ isOpen, onClose, assignmentId, assignmentTitle }: GradeSubmissionModalProps) => {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [gradingId, setGradingId] = useState<number | null>(null);
    const [grade, setGrade] = useState<number>(0);
    const [feedback, setFeedback] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && assignmentId) {
            fetchSubmissions();
        }
    }, [isOpen, assignmentId]);

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/assignments/${assignmentId}/submissions`);
            setSubmissions(response.data);
        } catch (error) {
            console.error('Failed to fetch submissions', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGrade = async (submissionId: number) => {
        setSubmitting(true);
        try {
            await api.post(`/assignments/submissions/${submissionId}/grade`, {
                grade,
                feedback
            });
            // Update local state
            setSubmissions(prev => prev.map(sub =>
                sub.id === submissionId ? { ...sub, grade, feedback } : sub
            ));
            setGradingId(null);
        } catch (error) {
            alert('Failed to submit grade');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-4xl bg-bg-secondary border border-white/10 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-bg-primary/50">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-primary" />
                            Grade Submissions
                        </h2>
                        <p className="text-sm text-text-secondary mt-1">Assignment: <span className="text-white font-medium">{assignmentTitle}</span></p>
                    </div>
                    <button onClick={onClose} className="text-text-secondary hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                        </div>
                    ) : submissions.length === 0 ? (
                        <div className="text-center py-12 text-text-secondary">
                            <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-8 h-8 opacity-40" />
                            </div>
                            <p className="text-lg">No submissions yet.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {submissions.map((submission) => (
                                <div key={submission.id} className="bg-bg-primary border border-white/5 rounded-xl p-5 hover:border-primary/20 transition-colors">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                                                    <User className="w-4 h-4 text-secondary" />
                                                </div>
                                                <span className="font-medium text-white">Student ID: {submission.student_id}</span>
                                                <span className="text-xs text-text-secondary flex items-center gap-1 bg-white/5 px-2 py-1 rounded">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(submission.submitted_at).toLocaleString()}
                                                </span>
                                            </div>

                                            <div className="bg-black/20 rounded-lg p-3 text-sm text-gray-300 mb-3 border border-white/5">
                                                {submission.content}
                                            </div>

                                            {submission.grade !== null && gradingId !== submission.id && (
                                                <div className="flex items-center gap-4 text-sm">
                                                    <div className="text-green-400 font-medium">Grade: {submission.grade}</div>
                                                    {submission.feedback && <div className="text-text-secondary italic">"{submission.feedback}"</div>}
                                                </div>
                                            )}
                                        </div>

                                        <div className="min-w-[250px] border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6 flex flex-col justify-center">
                                            {gradingId === submission.id ? (
                                                <div className="space-y-3 animate-in fade-in duration-200">
                                                    <div>
                                                        <label className="text-xs text-text-secondary mb-1 block">Grade (0-100)</label>
                                                        <input
                                                            type="number"
                                                            className="w-full bg-bg-secondary border border-white/20 rounded px-3 py-1.5 focus:border-primary outline-none"
                                                            value={grade}
                                                            onChange={e => setGrade(Number(e.target.value))}
                                                            autoFocus
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-text-secondary mb-1 block">Feedback</label>
                                                        <input
                                                            type="text"
                                                            className="w-full bg-bg-secondary border border-white/20 rounded px-3 py-1.5 focus:border-primary outline-none"
                                                            value={feedback}
                                                            onChange={e => setFeedback(e.target.value)}
                                                            placeholder="Good job..."
                                                        />
                                                    </div>
                                                    <div className="flex gap-2 text-sm pt-2">
                                                        <button
                                                            onClick={() => setGradingId(null)}
                                                            className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 rounded transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => handleGrade(submission.id)}
                                                            disabled={submitting}
                                                            className="flex-1 px-3 py-2 bg-primary hover:bg-primary-hover rounded transition-colors text-white font-medium"
                                                        >
                                                            {submitting ? 'Saving...' : 'Save'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setGradingId(submission.id);
                                                        setGrade(submission.grade || 0);
                                                        setFeedback(submission.feedback || '');
                                                    }}
                                                    className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${submission.grade !== null
                                                            ? 'bg-white/5 text-text-secondary hover:bg-white/10'
                                                            : 'btn-primary shadow-lg shadow-primary/20'
                                                        }`}
                                                >
                                                    {submission.grade !== null ? 'Update Grade' : 'Grade Submission'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GradeSubmissionModal;
