import { useEffect, useState } from 'react';
import { Award, BookOpen, FileText, TrendingUp, ChevronDown } from 'lucide-react';
import api from '../services/api';

interface Assignment {
    id: number;
    title: string;
    max_points: number;
    course_id: number;
}

interface Submission {
    id: number;
    assignment_id: number;
    grade: number | null;
    feedback: string | null;
}

interface AssignmentGrade {
    assignment_title: string;
    max_points: number;
    grade: number | null;
    percentage: number | null;
}

interface QuizAttempt {
    id: number;
    quiz_id: number;
    quiz_title: string;
    score: number;
    total_questions: number;
    percentage: number;
    submitted_at: string;
}

interface CourseGrades {
    course_id: number;
    course_title: string;
    course_code: string;
    assignments: AssignmentGrade[];
    quizzes: QuizAttempt[];
    overall_percentage: number | null;
}

const StudentGrades = () => {
    const [courseGrades, setCourseGrades] = useState<CourseGrades[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState<number | null>(null);

    useEffect(() => {
        fetchGrades();
    }, []);

    const fetchGrades = async () => {
        setLoading(true);
        try {
            const userResponse = await api.get('/auth/me');
            const enrollmentsResponse = await api.get(`/users/${userResponse.data.id}/enrollments`);

            const allCourseGrades: CourseGrades[] = [];

            for (const enrollment of enrollmentsResponse.data || []) {
                const assignments: AssignmentGrade[] = [];
                const quizzes: QuizAttempt[] = [];

                // Fetch assignments and grades
                try {
                    const assignmentsRes = await api.get(`/assignments/course/${enrollment.course_id}`);

                    for (const assignment of assignmentsRes.data) {
                        try {
                            const submissionRes = await api.get(`/assignments/${assignment.id}/my-submission`);
                            const submission = submissionRes.data;

                            if (submission && submission.grade !== null && submission.grade !== undefined) {
                                const percentage = (submission.grade / assignment.max_points) * 100;
                                assignments.push({
                                    assignment_title: assignment.title,
                                    max_points: assignment.max_points,
                                    grade: submission.grade,
                                    percentage: Math.round(percentage)
                                });
                            }
                        } catch (err) {
                            // No submission or not graded yet
                        }
                    }
                } catch (error) {
                    console.error(`Failed to fetch assignments for course ${enrollment.course_id}:`, error);
                }

                // Fetch quiz attempts and scores
                try {
                    const quizzesRes = await api.get(`/quizzes/course/${enrollment.course_id}`);

                    for (const quiz of quizzesRes.data) {
                        try {
                            const attemptsRes = await api.get(`/quizzes/${quiz.id}/my-attempts`);
                            const attempts = attemptsRes.data || [];

                            const completedAttempts = attempts.filter((a: any) => a.submitted_at && a.score !== null);

                            if (completedAttempts.length > 0) {
                                // Get best attempt
                                const bestAttempt = completedAttempts.reduce((best: any, current: any) =>
                                    current.score > best.score ? current : best
                                );

                                const percentage = (bestAttempt.score / bestAttempt.total_questions) * 100;
                                quizzes.push({
                                    id: bestAttempt.id,
                                    quiz_id: quiz.id,
                                    quiz_title: quiz.title,
                                    score: bestAttempt.score,
                                    total_questions: bestAttempt.total_questions,
                                    percentage: Math.round(percentage),
                                    submitted_at: bestAttempt.submitted_at
                                });
                            }
                        } catch (err) {
                            // No attempts yet
                        }
                    }
                } catch (error) {
                    console.error(`Failed to fetch quizzes for course ${enrollment.course_id}:`, error);
                }

                // Calculate overall percentage
                let overall_percentage: number | null = null;
                const allGrades = [
                    ...assignments.filter(a => a.percentage !== null).map(a => a.percentage!),
                    ...quizzes.map(q => q.percentage)
                ];

                if (allGrades.length > 0) {
                    overall_percentage = Math.round(
                        allGrades.reduce((sum, grade) => sum + grade, 0) / allGrades.length
                    );
                }

                allCourseGrades.push({
                    course_id: enrollment.course_id,
                    course_title: enrollment.course_title,
                    course_code: enrollment.course_code || `COURSE-${enrollment.course_id}`,
                    assignments,
                    quizzes,
                    overall_percentage
                });
            }

            setCourseGrades(allCourseGrades);
        } catch (error) {
            console.error('Failed to fetch grades:', error);
        } finally {
            setLoading(false);
        }
    };

    const getGradeColor = (percentage: number | null) => {
        if (percentage === null) return 'text-gray-400';
        if (percentage >= 90) return 'text-green-400';
        if (percentage >= 80) return 'text-blue-400';
        if (percentage >= 70) return 'text-yellow-400';
        if (percentage >= 60) return 'text-orange-400';
        return 'text-red-400';
    };

    const getGradeLetter = (percentage: number | null) => {
        if (percentage === null) return 'N/A';
        if (percentage >= 90) return 'A';
        if (percentage >= 80) return 'B';
        if (percentage >= 70) return 'C';
        if (percentage >= 60) return 'D';
        return 'F';
    };

    const filteredCourses = selectedCourse
        ? courseGrades.filter(c => c.course_id === selectedCourse)
        : courseGrades;

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
                    My Grades
                </h1>
                <p className="text-text-secondary mt-1">View your grades and academic performance</p>
            </div>

            {/* Course Filter */}
            <div className="bg-bg-secondary rounded-xl p-4 mb-6 flex items-center gap-4">
                <BookOpen className="w-5 h-5 text-primary" />
                <label className="text-sm font-medium text-text-secondary">Filter by Course:</label>
                <div className="relative flex-1 max-w-md">
                    <select
                        value={selectedCourse || ''}
                        onChange={(e) => setSelectedCourse(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full bg-bg-primary border border-white/10 px-4 py-2 rounded-lg text-white appearance-none cursor-pointer focus:outline-none focus:border-primary"
                    >
                        <option value="">All Courses</option>
                        {courseGrades.map(course => (
                            <option key={course.course_id} value={course.course_id}>
                                {course.course_code} - {course.course_title}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary pointer-events-none" />
                </div>
            </div>

            {/* Grades by Course */}
            {filteredCourses.length === 0 ? (
                <div className="bg-bg-secondary rounded-xl p-12 text-center">
                    <Award className="w-16 h-16 text-text-secondary mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Grades Available</h3>
                    <p className="text-text-secondary">
                        Complete assignments and quizzes to see your grades here
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {filteredCourses.map((course) => {
                        const hasGrades = course.assignments.length > 0 || course.quizzes.length > 0;

                        return (
                            <div
                                key={course.course_id}
                                className="bg-bg-secondary rounded-xl border border-white/5 overflow-hidden"
                            >
                                {/* Course Header */}
                                <div className="p-6 bg-gradient-to-r from-primary/20 to-blue-500/20 border-b border-white/10">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h2 className="text-2xl font-bold text-white mb-1">
                                                {course.course_title}
                                            </h2>
                                            <p className="text-text-secondary">{course.course_code}</p>
                                        </div>
                                        {course.overall_percentage !== null && (
                                            <div className="text-right">
                                                <div className={`text-4xl font-bold ${getGradeColor(course.overall_percentage)}`}>
                                                    {getGradeLetter(course.overall_percentage)}
                                                </div>
                                                <div className="text-sm text-text-secondary">
                                                    {course.overall_percentage}%
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {!hasGrades ? (
                                    <div className="p-8 text-center text-text-secondary">
                                        No graded items yet for this course
                                    </div>
                                ) : (
                                    <div className="p-6 space-y-6">
                                        {/* Assignments */}
                                        {course.assignments.length > 0 && (
                                            <div>
                                                <div className="flex items-center gap-2 mb-4">
                                                    <FileText className="w-5 h-5 text-primary" />
                                                    <h3 className="text-lg font-semibold text-white">Assignments</h3>
                                                    <span className="text-sm text-text-secondary">
                                                        ({course.assignments.length})
                                                    </span>
                                                </div>
                                                <div className="space-y-3">
                                                    {course.assignments.map((assignment, index) => (
                                                        <div
                                                            key={index}
                                                            className="bg-bg-primary rounded-lg p-4 flex items-center justify-between"
                                                        >
                                                            <div className="flex-1">
                                                                <h4 className="font-medium text-white">
                                                                    {assignment.assignment_title}
                                                                </h4>
                                                                <p className="text-sm text-text-secondary">
                                                                    Max Points: {assignment.max_points}
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className={`text-2xl font-bold ${getGradeColor(assignment.percentage)}`}>
                                                                    {assignment.grade}/{assignment.max_points}
                                                                </div>
                                                                <div className="text-sm text-text-secondary">
                                                                    {assignment.percentage}%
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Quizzes */}
                                        {course.quizzes.length > 0 && (
                                            <div>
                                                <div className="flex items-center gap-2 mb-4">
                                                    <TrendingUp className="w-5 h-5 text-primary" />
                                                    <h3 className="text-lg font-semibold text-white">Quizzes</h3>
                                                    <span className="text-sm text-text-secondary">
                                                        ({course.quizzes.length})
                                                    </span>
                                                </div>
                                                <div className="space-y-3">
                                                    {course.quizzes.map((quiz) => (
                                                        <div
                                                            key={quiz.id}
                                                            className="bg-bg-primary rounded-lg p-4 flex items-center justify-between"
                                                        >
                                                            <div className="flex-1">
                                                                <h4 className="font-medium text-white">
                                                                    {quiz.quiz_title}
                                                                </h4>
                                                                <p className="text-sm text-text-secondary">
                                                                    Best Attempt
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className={`text-2xl font-bold ${getGradeColor(quiz.percentage)}`}>
                                                                    {quiz.score}/{quiz.total_questions}
                                                                </div>
                                                                <div className="text-sm text-text-secondary">
                                                                    {quiz.percentage}%
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default StudentGrades;
