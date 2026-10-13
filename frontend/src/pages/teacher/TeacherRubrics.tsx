import { useEffect, useState } from 'react';
import { Plus, Trash2, ClipboardCheck, ChevronLeft, Award } from 'lucide-react';
import api from '../../services/api';
import CreateRubricModal from '../../components/modals/CreateRubricModal';

interface Section {
    id: number;
    name: string;
    course_id: number;
    course_title: string;
    course_code: string;
}

interface Course {
    id: number;
    title: string;
    code: string;
}

interface Criterion {
    id: number;
    name: string;
    description: string | null;
    max_points: number;
    order: number;
}

interface Rubric {
    id: number;
    title: string;
    description: string | null;
    course_id: number | null;
    created_at: string;
}

interface RubricDetail extends Rubric {
    criteria: Criterion[];
}

const TeacherRubrics = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [rubrics, setRubrics] = useState<Rubric[]>([]);
    const [selectedRubric, setSelectedRubric] = useState<RubricDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        fetchCourses();
    }, []);

    useEffect(() => {
        if (selectedCourse) {
            fetchRubrics();
            setSelectedRubric(null);
        }
    }, [selectedCourse]);

    const fetchCourses = async () => {
        try {
            const response = await api.get('/teacher/sections');
            const sections: Section[] = response.data;
            const unique = new Map<number, Course>();
            for (const s of sections) {
                if (!unique.has(s.course_id)) {
                    unique.set(s.course_id, { id: s.course_id, title: s.course_title, code: s.course_code });
                }
            }
            const list = Array.from(unique.values());
            setCourses(list);
            if (list.length > 0) setSelectedCourse(list[0]);
        } catch (error) {
            console.error('Failed to fetch courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRubrics = async () => {
        if (!selectedCourse) return;
        setLoading(true);
        try {
            const response = await api.get(`/rubrics/course/${selectedCourse.id}`);
            setRubrics(response.data);
        } catch (error) {
            console.error('Failed to fetch rubrics:', error);
            setRubrics([]);
        } finally {
            setLoading(false);
        }
    };

    const openRubric = async (rubric: Rubric) => {
        try {
            const response = await api.get(`/rubrics/${rubric.id}`);
            setSelectedRubric(response.data);
        } catch (error) {
            console.error('Failed to fetch rubric details:', error);
        }
    };

    const handleDelete = async (rubricId: number) => {
        if (!confirm('Delete this rubric? This cannot be undone.')) return;
        try {
            await api.delete(`/rubrics/${rubricId}`);
            setSelectedRubric(null);
            fetchRubrics();
        } catch (error) {
            console.error('Failed to delete rubric:', error);
            alert('Failed to delete rubric');
        }
    };

    if (loading && courses.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">Rubrics</h1>
                    <p className="text-text-secondary mt-1">Define grading criteria students are evaluated against</p>
                </div>
                {selectedCourse && !selectedRubric && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium"
                    >
                        <Plus className="w-4 h-4" /> New Rubric
                    </button>
                )}
            </div>

            {/* Course selector */}
            <div className="flex gap-2 flex-wrap mb-6">
                {courses.map((course) => (
                    <button
                        key={course.id}
                        onClick={() => setSelectedCourse(course)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedCourse?.id === course.id
                                ? 'bg-primary text-white'
                                : 'bg-bg-secondary text-text-secondary hover:text-white border border-white/5'
                        }`}
                    >
                        {course.code} — {course.title}
                    </button>
                ))}
            </div>

            {courses.length === 0 && (
                <div className="text-center py-16 bg-bg-secondary rounded-xl border border-white/5">
                    <ClipboardCheck className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                    <p className="text-text-secondary">No courses assigned to you yet.</p>
                </div>
            )}

            {selectedCourse && !selectedRubric && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rubrics.map((rubric) => (
                        <div
                            key={rubric.id}
                            onClick={() => openRubric(rubric)}
                            className="bg-bg-secondary rounded-xl border border-white/5 p-5 hover:border-primary/50 transition-colors cursor-pointer"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                        <Award className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white">{rubric.title}</h3>
                                        <p className="text-xs text-text-secondary">
                                            {new Date(rubric.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(rubric.id);
                                    }}
                                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            {rubric.description && (
                                <p className="text-sm text-text-secondary mt-3 line-clamp-2">{rubric.description}</p>
                            )}
                        </div>
                    ))}
                    {rubrics.length === 0 && (
                        <div className="col-span-full text-center py-16 bg-bg-secondary rounded-xl border border-white/5">
                            <ClipboardCheck className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                            <p className="text-white font-medium mb-1">No rubrics yet</p>
                            <p className="text-text-secondary text-sm">Create one to standardize your grading.</p>
                        </div>
                    )}
                </div>
            )}

            {selectedRubric && (
                <div className="bg-bg-secondary rounded-xl border border-white/5 p-6">
                    <button
                        onClick={() => setSelectedRubric(null)}
                        className="flex items-center gap-1 text-sm text-text-secondary hover:text-white transition-colors mb-4"
                    >
                        <ChevronLeft className="w-4 h-4" /> Back to rubrics
                    </button>
                    <div className="flex items-start justify-between mb-2">
                        <div>
                            <h2 className="text-2xl font-bold text-white">{selectedRubric.title}</h2>
                            {selectedRubric.description && (
                                <p className="text-text-secondary mt-1">{selectedRubric.description}</p>
                            )}
                        </div>
                        <button
                            onClick={() => handleDelete(selectedRubric.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors text-sm font-medium"
                        >
                            <Trash2 className="w-4 h-4" /> Delete
                        </button>
                    </div>

                    <div className="mt-6 space-y-3">
                        {selectedRubric.criteria.map((criterion) => (
                            <div
                                key={criterion.id}
                                className="flex items-center justify-between bg-bg-primary rounded-lg p-4 border border-white/5"
                            >
                                <div>
                                    <p className="font-medium text-white">{criterion.name}</p>
                                    {criterion.description && (
                                        <p className="text-sm text-text-secondary mt-0.5">{criterion.description}</p>
                                    )}
                                </div>
                                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-bold whitespace-nowrap">
                                    {criterion.max_points} pts
                                </span>
                            </div>
                        ))}
                        <div className="flex justify-end pt-2">
                            <span className="text-sm text-text-secondary">
                                Total:{' '}
                                <span className="text-white font-bold">
                                    {selectedRubric.criteria.reduce((s, c) => s + c.max_points, 0)} pts
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {showCreateModal && selectedCourse && (
                <CreateRubricModal
                    courseId={selectedCourse.id}
                    courseName={`${selectedCourse.code} — ${selectedCourse.title}`}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        fetchRubrics();
                    }}
                />
            )}
        </div>
    );
};

export default TeacherRubrics;
