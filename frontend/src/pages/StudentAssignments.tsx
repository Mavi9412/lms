import { useEffect, useState } from 'react';
import {
    Clock, CheckCircle, XCircle, FileText, Upload, Eye, Award, AlertCircle, BookOpen
} from 'lucide-react';
import api from '../services/api';
import SubmitAssignmentModal from '../components/modals/SubmitAssignmentModal';

interface Assignment {
    id: number;
    title: string;
    description: string;
    due_date: string;
    max_points: number;
    course_id: number;
    course_title: string;
}

interface Submission {
    id: number;
    assignment_id: number;
    student_id: number;
    content: string;
    submitted_at: string;
    grade?: number;
    feedback?: string;
}

interface AssignmentWithSubmission extends Assignment {
    submission?: Submission;
    status: 'pending' | 'submitted' | 'late' | 'graded';
}

const StudentAssignments = () => {
    const [assignments, setAssignments] = useState<AssignmentWithSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('all');

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        setLoading(true);
        try {
            const userResponse = await api.get('/auth/me');
            const enrollmentsResponse = await api.get(`/users/${userResponse.data.id}/enrollments`);

            const allAssignments: AssignmentWithSubmission[] = [];

            for (const enrollment of enrollmentsResponse.data || []) {
                try {
                    const assignmentsRes = await api.get(`/assignments/course/${enrollment.course_id}`);

                    for (const assignment of assignmentsRes.data) {
                        // Fetch submission status
                        try {
                            const submissionRes = await api.get(`/assignments/${assignment.id}/my-submission`);
                            const submission = submissionRes.data;

                            let status: 'pending' | 'submitted' | 'late' | 'graded' = 'pending';

                            if (submission) {
                                if (submission.grade !== null && submission.grade !== undefined) {
                                    status = 'graded';
                                } else if (new Date(submission.submitted_at) > new Date(assignment.due_date)) {
                                    status = 'late';
                                } else {
                                    status = 'submitted';
                                }
                            } else if (new Date() > new Date(assignment.due_date)) {
                                status = 'late';
                            }

                            allAssignments.push({
                                ...assignment,
                                course_title: enrollment.course_title,
                                submission,
                                status
                            });
                        } catch (err) {
                            // No submission yet
                            const status = new Date() > new Date(assignment.due_date) ? 'late' as const : 'pending' as const;
                            allAssignments.push({
                                ...assignment,
                                course_title: enrollment.course_title,
                                status
                            });
                        }
                    }
                } catch (error) {
                    console.error(`Failed to fetch assignments for course ${enrollment.course_id}:`, error);
                }
            }

            // Sort by due date
            allAssignments.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

            setAssignments(allAssignments);
        } catch (error) {
            console.error('Failed to fetch assignments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitSuccess = () => {
        setShowSubmitModal(false);
        setSelectedAssignment(null);
        fetchAssignments();
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'graded':
                return { color: 'bg-green-500/20 text-green-400', icon: Award, label: 'Graded' };
            case 'submitted':
                return { color: 'bg-blue-500/20 text-blue-400', icon: CheckCircle, label: 'Submitted' };
            case 'late':
                return { color: 'bg-red-500/20 text-red-400', icon: XCircle, label: 'Late' };
            default:
                return { color: 'bg-yellow-500/20 text-yellow-400', icon: Clock, label: 'Pending' };
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = date.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'Overdue';
        if (diffDays === 0) return 'Due Today';
        if (diffDays === 1) return 'Due Tomorrow';

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    };

    const filteredAssignments = filterStatus === 'all'
        ? assignments
        : assignments.filter(a => a.status === filterStatus);

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
                    My Assignments
                </h1>
                <p className="text-text-secondary mt-1">{assignments.length} Total Assignments</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                {['all', 'pending', 'submitted', 'graded', 'late'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${filterStatus === status
                                ? 'bg-primary text-white'
                                : 'bg-bg-secondary text-text-secondary hover:bg-white/10'
                            }`}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                        <span className="ml-2 text-xs opacity-75">
                            ({status === 'all' ? assignments.length : assignments.filter(a => a.status === status).length})
                        </span>
                    </button>
                ))}
            </div>

            {/* Assignments List */}
            {filteredAssignments.length === 0 ? (
                <div className="bg-bg-secondary rounded-xl p-12 text-center">
                    <FileText className="w-16 h-16 text-text-secondary mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Assignments</h3>
                    <p className="text-text-secondary">
                        {filterStatus === 'all' ? 'No assignments available yet' : `No ${filterStatus} assignments`}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredAssignments.map((assignment) => {
                        const statusBadge = getStatusBadge(assignment.status);
                        const StatusIcon = statusBadge.icon;
                        const isOverdue = new Date() > new Date(assignment.due_date) && !assignment.submission;

                        return (
                            <div
                                key={assignment.id}
                                className={`bg-bg-secondary rounded-xl border p-6 transition-all duration-300 ${isOverdue
                                        ? 'border-red-500/30'
                                        : 'border-white/5 hover:border-primary/30'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="p-2 bg-primary/20 rounded-lg">
                                                <FileText className="w-5 h-5 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-white mb-1">
                                                    {assignment.title}
                                                </h3>
                                                <div className="flex items-center gap-2 text-sm text-text-secondary">
                                                    <BookOpen className="w-4 h-4" />
                                                    <span>{assignment.course_title}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-text-secondary mb-4 line-clamp-2">
                                            {assignment.description}
                                        </p>

                                        {/* Metadata */}
                                        <div className="flex flex-wrap items-center gap-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-text-secondary" />
                                                <span className={isOverdue ? 'text-red-400' : 'text-text-secondary'}>
                                                    {formatDate(assignment.due_date)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Award className="w-4 h-4 text-text-secondary" />
                                                <span className="text-text-secondary">{assignment.max_points} points</span>
                                            </div>
                                            <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${statusBadge.color}`}>
                                                <StatusIcon className="w-4 h-4" />
                                                <span className="font-medium">{statusBadge.label}</span>
                                            </div>
                                        </div>

                                        {/* Submission Info */}
                                        {assignment.submission && (
                                            <div className="mt-4 p-4 bg-bg-primary rounded-lg border border-white/10">
                                                <div className="flex items-start justify-between gap-4 mb-2">
                                                    <div className="flex-1">
                                                        <h4 className="text-sm font-medium text-white mb-1">Your Submission</h4>
                                                        <p className="text-xs text-text-secondary">
                                                            Submitted: {new Date(assignment.submission.submitted_at).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    {assignment.submission.grade !== null && assignment.submission.grade !== undefined && (
                                                        <div className="text-right">
                                                            <div className="text-2xl font-bold text-green-400">
                                                                {assignment.submission.grade}/{assignment.max_points}
                                                            </div>
                                                            <div className="text-xs text-text-secondary">
                                                                {Math.round((assignment.submission.grade / assignment.max_points) * 100)}%
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {assignment.submission.feedback && (
                                                    <div className="mt-3 pt-3 border-t border-white/10">
                                                        <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                                                            <Eye className="w-4 h-4" />
                                                            Teacher Feedback
                                                        </h4>
                                                        <p className="text-sm text-text-secondary">
                                                            {assignment.submission.feedback}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    {!assignment.submission && (
                                        <button
                                            onClick={() => {
                                                setSelectedAssignment(assignment);
                                                setShowSubmitModal(true);
                                            }}
                                            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${isOverdue
                                                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                                    : 'bg-primary hover:bg-primary/90 text-white'
                                                }`}
                                        >
                                            <Upload className="w-4 h-4" />
                                            {isOverdue ? 'Submit Late' : 'Submit'}
                                        </button>
                                    )}
                                </div>

                                {isOverdue && !assignment.submission && (
                                    <div className="mt-4 flex items-center gap-2 text-sm text-red-400">
                                        <AlertCircle className="w-4 h-4" />
                                        <span>This assignment is overdue. Late submissions may receive reduced credit.</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Submit Modal */}
            {showSubmitModal && selectedAssignment && (
                <SubmitAssignmentModal
                    assignment={selectedAssignment}
                    onClose={() => {
                        setShowSubmitModal(false);
                        setSelectedAssignment(null);
                    }}
                    onSuccess={handleSubmitSuccess}
                />
            )}
        </div>
    );
};

export default StudentAssignments;
