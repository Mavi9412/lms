import { useEffect, useState } from 'react';
import { BookOpen, Users, ClipboardList, Calendar, TrendingUp, Clock } from 'lucide-react';
import api from '../../services/api';

interface CourseInfo {
    id: number;
    title: string;
    code: string;
    credit_hours: number;
}

interface AssignedSection {
    id: number;
    name: string;
    course: CourseInfo;
    semester: string;
    enrolled_count: number;
    capacity: number;
}

interface PendingTask {
    assignment_id: number;
    assignment_title: string;
    section_id: number;
    section_name: string;
    course_code: string;
    course_title: string;
    pending_count: number;
    total_submissions: number;
    due_date: string | null;
}

interface DashboardStats {
    total_courses: number;
    total_students: number;
    pending_tasks: number;
    total_assignments: number;
}

interface DashboardData {
    assigned_sections: AssignedSection[];
    total_students: number;
    pending_grading: PendingTask[];
    upcoming_classes: any[];
    stats: DashboardStats;
}

const TeacherDashboard = () => {
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await api.get('/teacher/dashboard');
            setDashboardData(response.data);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!dashboardData) {
        return (
            <div className="text-center text-text-secondary py-12">
                Failed to load dashboard data
            </div>
        );
    }

    const stats = [
        {
            title: 'Total Courses',
            value: dashboardData.stats.total_courses,
            icon: BookOpen,
            color: 'from-blue-500 to-cyan-500',
            bgColor: 'bg-blue-500/10'
        },
        {
            title: 'Total Students',
            value: dashboardData.stats.total_students,
            icon: Users,
            color: 'from-green-500 to-emerald-500',
            bgColor: 'bg-green-500/10'
        },
        {
            title: 'Pending Grading',
            value: dashboardData.stats.pending_tasks,
            icon: ClipboardList,
            color: 'from-orange-500 to-red-500',
            bgColor: 'bg-orange-500/10'
        },
        {
            title: 'Total Assignments',
            value: dashboardData.stats.total_assignments,
            icon: TrendingUp,
            color: 'from-purple-500 to-pink-500',
            bgColor: 'bg-purple-500/10'
        }
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                    Teacher Dashboard
                </h1>
                <p className="text-text-secondary mt-1">Welcome! Here's your teaching overview</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="bg-bg-secondary rounded-xl border border-white/5 p-6 hover:border-primary/50 transition-all duration-300 group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                                <stat.icon className={`w-6 h-6 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} />
                            </div>
                        </div>
                        <h3 className="text-text-secondary text-sm font-medium mb-1">{stat.title}</h3>
                        <p className="text-3xl font-bold text-white">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Assigned Courses */}
                <div className="bg-bg-secondary rounded-xl border border-white/5 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <BookOpen className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-bold text-white">Assigned Courses</h2>
                    </div>

                    {dashboardData.assigned_sections.length === 0 ? (
                        <p className="text-text-secondary text-center py-8">No courses assigned yet</p>
                    ) : (
                        <div className="space-y-3">
                            {dashboardData.assigned_sections.map((section) => (
                                <div
                                    key={section.id}
                                    className="bg-bg-primary rounded-lg p-4 border border-white/5 hover:border-primary/50 transition-colors"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-semibold text-white">{section.course.title}</h3>
                                            <p className="text-sm text-text-secondary">
                                                {section.course.code} - {section.name}
                                            </p>
                                        </div>
                                        <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-medium">
                                            {section.semester}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-text-secondary mt-3">
                                        <div className="flex items-center gap-1">
                                            <Users className="w-4 h-4" />
                                            <span>{section.enrolled_count}/{section.capacity} students</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            <span>{section.course.credit_hours} credits</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pending Grading Tasks */}
                <div className="bg-bg-secondary rounded-xl border border-white/5 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <ClipboardList className="w-5 h-5 text-orange-400" />
                        <h2 className="text-xl font-bold text-white">Pending Grading</h2>
                    </div>

                    {dashboardData.pending_grading.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-green-400 font-medium">🎉 All caught up!</p>
                            <p className="text-text-secondary text-sm mt-1">No pending grading tasks</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto">
                            {dashboardData.pending_grading.map((task) => (
                                <div
                                    key={task.assignment_id}
                                    className="bg-bg-primary rounded-lg p-4 border border-white/5 hover:border-orange-500/50 transition-colors cursor-pointer"
                                    onClick={() => window.location.href = `/teacher/gradebook?assignment=${task.assignment_id}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-semibold text-white">{task.assignment_title}</h3>
                                            <p className="text-sm text-text-secondary">
                                                {task.course_code} - {task.section_name}
                                            </p>
                                        </div>
                                        <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-bold">
                                            {task.pending_count} pending
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm mt-3">
                                        <span className="text-text-secondary">
                                            {task.pending_count} of {task.total_submissions} submissions
                                        </span>
                                        {task.due_date && (
                                            <span className="text-xs text-text-secondary">
                                                Due: {new Date(task.due_date).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Upcoming Classes - Placeholder */}
            {dashboardData.upcoming_classes.length > 0 && (
                <div className="mt-6 bg-bg-secondary rounded-xl border border-white/5 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar className="w-5 h-5 text-blue-400" />
                        <h2 className="text-xl font-bold text-white">Upcoming Classes</h2>
                    </div>
                    <p className="text-text-secondary text-center py-8">
                        Class schedule feature coming soon!
                    </p>
                </div>
            )}
        </div>
    );
};

export default TeacherDashboard;
