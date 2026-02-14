import { useEffect, useState } from 'react';
import { Plus, BookOpen, Calendar, Users, FileText, Eye } from 'lucide-react';
import api from '../../services/api';
import CreateAssignmentModal from '../../components/modals/CreateAssignmentModal';
import ViewSubmissionsModal from '../../components/modals/ViewSubmissionsModal';

interface Section {
    id: number;
    name: string;
    course_id: number;
    course_title: string;
    course_code: string;
}

interface Assignment {
    id: number;
    title: string;
    description: string;
    due_date: string;
    max_points: number;
    course_id: number;
}

interface AssignmentWithStats extends Assignment {
    total_submissions: number;
    graded_submissions: number;
}

const TeacherAssignments = () => {
    const [sections, setSections] = useState<Section[]>([]);
    const [selectedSection, setSelectedSection] = useState<Section | null>(null);
    const [assignments, setAssignments] = useState<AssignmentWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

    useEffect(() => {
        fetchSections();
    }, []);

    useEffect(() => {
        if (selectedSection) {
            fetchAssignments();
        }
    }, [selectedSection]);

    const fetchSections = async () => {
        try {
            const response = await api.get('/teacher/sections');
            setSections(response.data);
            if (response.data.length > 0) {
                setSelectedSection(response.data[0]);
            }
        } catch (error) {
            console.error('Failed to fetch sections:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAssignments = async () => {
        if (!selectedSection) return;

        setLoading(true);
        try {
            const response = await api.get(`/assignments/course/${selectedSection.course_id}`);

            // Fetch submission stats for each assignment
            const assignmentsWithStats = await Promise.all(
                response.data.map(async (assignment: Assignment) => {
                    try {
                        const submissionsRes = await api.get(`/assignments/${assignment.id}/submissions`);
                        const submissions = submissionsRes.data;
                        return {
                            ...assignment,
                            total_submissions: submissions.length,
                            graded_submissions: submissions.filter((s: any) => s.grade !== null).length
                        };
                    } catch {
                        return {
                            ...assignment,
                            total_submissions: 0,
                            graded_submissions: 0
                        };
                    }
                })
            );

            setAssignments(assignmentsWithStats);
        } catch (error) {
            console.error('Failed to fetch assignments:', error);
            setAssignments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSuccess = () => {
        setShowCreateModal(false);
        fetchAssignments();
    };

    const handleViewSubmissions = (assignment: Assignment) => {
        setSelectedAssignment(assignment);
        setShowSubmissionsModal(true);
    };

    const isOverdue = (dueDate: string) => {
        return new Date(dueDate) < new Date();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading && sections.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                        Assignment Management
                    </h1>
                    <p className="text-text-secondary mt-1">Create and manage assignments for your sections</p>
                </div>
                {selectedSection && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium flex items-center gap-2 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Create Assignment
                    </button>
                )}
            </div>

            {/* Section Selector */}
            <div className="bg-bg-secondary rounded-xl p-6 mb-6">
                <label className="block text-sm font-medium text-text-secondary mb-2">
                    Select Section
                </label>
                <select
                    value={selectedSection?.id || ''}
                    onChange={(e) => {
                        const section = sections.find(s => s.id === parseInt(e.target.value));
                        setSelectedSection(section || null);
                    }}
                    className="w-full md:w-1/2 px-4 py-3 bg-bg-primary border border-white/10 rounded-lg focus:outline-none focus:border-primary transition-colors text-white"
                >
                    {sections.map(section => (
                        <option key={section.id} value={section.id}>
                            {section.course_code} - {section.name} ({section.course_title})
                        </option>
                    ))}
                </select>
            </div>

            {/* Assignments List */}
            {loading ? (
                <div className="bg-bg-secondary rounded-xl p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                    <p className="text-text-secondary mt-4">Loading assignments...</p>
                </div>
            ) : assignments.length === 0 ? (
                <div className="bg-bg-secondary rounded-xl p-12 text-center">
                    <FileText className="w-16 h-16 text-text-secondary mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Assignments Yet</h3>
                    <p className="text-text-secondary mb-6">Get started by creating your first assignment</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium inline-flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Create Assignment
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {assignments.map((assignment) => (
                        <div
                            key={assignment.id}
                            className="bg-bg-secondary rounded-xl border border-white/5 p-6 hover:border-primary/50 transition-all duration-300"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-white mb-2">
                                        {assignment.title}
                                    </h3>
                                    <p className="text-text-secondary text-sm line-clamp-2">
                                        {assignment.description}
                                    </p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${isOverdue(assignment.due_date)
                                    ? 'bg-red-500/20 text-red-400'
                                    : 'bg-green-500/20 text-green-400'
                                    }`}>
                                    {isOverdue(assignment.due_date) ? 'Overdue' : 'Active'}
                                </span>
                            </div>

                            <div className="space-y-3 mb-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="w-4 h-4 text-text-secondary" />
                                    <span className="text-text-secondary">Due:</span>
                                    <span className={`font-medium ${isOverdue(assignment.due_date) ? 'text-red-400' : 'text-white'
                                        }`}>
                                        {formatDate(assignment.due_date)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <BookOpen className="w-4 h-4 text-text-secondary" />
                                    <span className="text-text-secondary">Max Points:</span>
                                    <span className="text-white font-medium">{assignment.max_points}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Users className="w-4 h-4 text-text-secondary" />
                                    <span className="text-text-secondary">Submissions:</span>
                                    <span className="text-white font-medium">
                                        {assignment.total_submissions} total
                                    </span>
                                    {assignment.graded_submissions < assignment.total_submissions && (
                                        <span className="text-orange-400 text-xs">
                                            ({assignment.total_submissions - assignment.graded_submissions} pending)
                                        </span>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() => handleViewSubmissions(assignment)}
                                className="w-full px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                            >
                                <Eye className="w-4 h-4" />
                                View Submissions ({assignment.total_submissions})
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Modals */}
            {showCreateModal && selectedSection && (
                <CreateAssignmentModal
                    courseId={selectedSection.course_id}
                    courseName={`${selectedSection.course_code} - ${selectedSection.name}`}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={handleCreateSuccess}
                />
            )}

            {showSubmissionsModal && selectedAssignment && (
                <ViewSubmissionsModal
                    assignment={selectedAssignment}
                    onClose={() => {
                        setShowSubmissionsModal(false);
                        setSelectedAssignment(null);
                        fetchAssignments(); // Refresh to update stats
                    }}
                />
            )}
        </div>
    );
};

export default TeacherAssignments;
