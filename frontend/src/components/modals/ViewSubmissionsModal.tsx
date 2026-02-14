import { useEffect, useState } from 'react';
import { X, User, Calendar, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import GradeSubmissionModal from './GradeSubmissionModal';

interface Assignment {
    id: number;
    title: string;
    description: string;
    due_date: string;
    max_points: number;
}

interface Submission {
    id: number;
    assignment_id: number;
    student_id: number;
    content: string;
    file_path: string | null;
    submitted_at: string;
    grade: number | null;
    feedback: string | null;
}

interface SubmissionWithStudent extends Submission {
    student_name: string;
    student_email: string;
}

interface Props {
    assignment: Assignment;
    onClose: () => void;
}

const ViewSubmissionsModal = ({ assignment, onClose }: Props) => {
    const [submissions, setSubmissions] = useState<SubmissionWithStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithStudent | null>(null);
    const [showGradeModal, setShowGradeModal] = useState(false);

    useEffect(() => {
        fetchSubmissions();
    }, [assignment.id]);

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/assignments/${assignment.id}/submissions`);

            // Map submissions with student info (assuming backend includes it)
            const submissionsWithStudents = response.data.map((submission: any) => ({
                ...submission,
                student_name: submission.student?.full_name || 'Unknown Student',
                student_email: submission.student?.email || ''
            }));

            setSubmissions(submissionsWithStudents);
        } catch (error) {
            console.error('Failed to fetch submissions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGradeClick = (submission: SubmissionWithStudent) => {
        setSelectedSubmission(submission);
        setShowGradeModal(true);
    };

    const handleGradeSuccess = () => {
        setShowGradeModal(false);
        setSelectedSubmission(null);
        fetchSubmissions();
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

    const gradedCount = submissions.filter(s => s.grade !== null).length;
    const pendingCount = submissions.length - gradedCount;

    return (
        <>
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-bg-secondary rounded-xl border border-white/10 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-bg-secondary z-10">
                        <div>
                            <h2 className="text-2xl font-bold text-white">{assignment.title}</h2>
                            <p className="text-text-secondary text-sm mt-1">
                                {assignment.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                                <span className="text-text-secondary">
                                    Due: {formatDate(assignment.due_date)}
                                </span>
                                <span className="text-text-secondary">
                                    Max Points: {assignment.max_points}
                                </span>
                                <span className="text-green-400">
                                    {gradedCount} Graded
                                </span>
                                {pendingCount > 0 && (
                                    <span className="text-orange-400">
                                        {pendingCount} Pending
                                    </span>
                                )}
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
                                <p className="text-text-secondary mt-4">Loading submissions...</p>
                            </div>
                        ) : submissions.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="w-16 h-16 text-text-secondary mx-auto mb-4 opacity-50" />
                                <h3 className="text-xl font-semibold text-white mb-2">No Submissions Yet</h3>
                                <p className="text-text-secondary">Students haven't submitted any work for this assignment.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            <th className="text-left py-3 px-4 text-text-secondary font-medium">Student</th>
                                            <th className="text-left py-3 px-4 text-text-secondary font-medium">Submitted</th>
                                            <th className="text-left py-3 px-4 text-text-secondary font-medium">Content</th>
                                            <th className="text-center py-3 px-4 text-text-secondary font-medium">Grade</th>
                                            <th className="text-center py-3 px-4 text-text-secondary font-medium">Status</th>
                                            <th className="text-center py-3 px-4 text-text-secondary font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {submissions.map((submission) => (
                                            <tr
                                                key={submission.id}
                                                className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                            >
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <User className="w-8 h-8 p-1.5 bg-primary/20 text-primary rounded-full" />
                                                        <div>
                                                            <p className="font-medium text-white">{submission.student_name}</p>
                                                            <p className="text-sm text-text-secondary">{submission.student_email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                                                        <Calendar className="w-4 h-4" />
                                                        {formatDate(submission.submitted_at)}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <p className="text-sm text-white line-clamp-2 max-w-md">
                                                        {submission.content || 'No content'}
                                                    </p>
                                                    {submission.file_path && (
                                                        <a
                                                            href={`http://localhost:8000/${submission.file_path}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm text-primary hover:underline mt-1 inline-block"
                                                        >
                                                            View File
                                                        </a>
                                                    )}
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    {submission.grade !== null ? (
                                                        <span className="text-lg font-bold text-white">
                                                            {submission.grade}/{assignment.max_points}
                                                        </span>
                                                    ) : (
                                                        <span className="text-text-secondary">-</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    {submission.grade !== null ? (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                                                            <CheckCircle className="w-4 h-4" />
                                                            Graded
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm font-medium">
                                                            <AlertCircle className="w-4 h-4" />
                                                            Pending
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <button
                                                        onClick={() => handleGradeClick(submission)}
                                                        className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors text-sm font-medium"
                                                    >
                                                        {submission.grade !== null ? 'Edit Grade' : 'Grade'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
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

            {/* Grade Modal */}
            {showGradeModal && selectedSubmission && (
                <GradeSubmissionModal
                    submission={selectedSubmission}
                    maxPoints={assignment.max_points}
                    onClose={() => {
                        setShowGradeModal(false);
                        setSelectedSubmission(null);
                    }}
                    onSuccess={handleGradeSuccess}
                />
            )}
        </>
    );
};

export default ViewSubmissionsModal;
