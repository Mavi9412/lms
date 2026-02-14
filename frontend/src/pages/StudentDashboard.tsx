import { useEffect, useState } from 'react';
import { BookOpen, Clock, Megaphone, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { Link } from 'react-router-dom';

interface Enrollment {
    course_id: number;
    course_title: string;
    course_code: string;
}

interface Assignment {
    id: number;
    title: string;
    due_date: string;
    course_id: number;
    course_title: string;
}

interface Quiz {
    id: number;
    title: string;
    available_until: string;
    course_id: number;
    course_title: string;
}

interface Deadline extends Assignment {
    type?: string;
}

interface Announcement {
    id: number;
    title: string;
    content: string;
    created_at: string;
    course_id: number;
    creator_name: string;
    is_pinned: boolean;
}

interface AttendanceStats {
    total_classes: number;
    attended: number;
    percentage: number;
}

const StudentDashboard = () => {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [upcomingDeadlines, setUpcomingDeadlines] = useState<Deadline[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchEnrollments(),
                fetchUpcomingDeadlines(),
                fetchRecentAnnouncements(),
                fetchAttendanceStats()
            ]);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEnrollments = async () => {
        try {
            const response = await api.get('/auth/me');
            const enrollmentsResponse = await api.get(`/users/${response.data.id}/enrollments`);
            setEnrollments(enrollmentsResponse.data || []);
        } catch (error) {
            console.error('Failed to fetch enrollments:', error);
            setEnrollments([]);
        }
    };

    const fetchUpcomingDeadlines = async () => {
        try {
            const user = await api.get('/auth/me');
            const enrollmentsResponse = await api.get(`/users/${user.data.id}/enrollments`);

            const deadlines: Array<Assignment | Quiz> = [];

            // Fetch assignments and quizzes for each enrolled course
            for (const enrollment of enrollmentsResponse.data || []) {
                try {
                    // Fetch assignments
                    const assignmentsRes = await api.get(`/assignments/course/${enrollment.course_id}`);
                    const assignments = assignmentsRes.data
                        .filter((a: Assignment) => a.due_date && new Date(a.due_date) > new Date())
                        .map((a: Assignment) => ({
                            ...a,
                            course_title: enrollment.course_title,
                            type: 'assignment'
                        }));
                    deadlines.push(...assignments);

                    // Fetch quizzes
                    const quizzesRes = await api.get(`/quizzes/course/${enrollment.course_id}`);
                    const quizzes = quizzesRes.data
                        .filter((q: Quiz) => q.available_until && new Date(q.available_until) > new Date())
                        .map((q: Quiz) => ({
                            ...q,
                            course_title: enrollment.course_title,
                            type: 'quiz',
                            due_date: q.available_until
                        }));
                    deadlines.push(...quizzes);
                } catch (error) {
                    console.error(`Failed to fetch deadlines for course ${enrollment.course_id}:`, error);
                }
            }

            // Sort by due date
            deadlines.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
            setUpcomingDeadlines(deadlines.slice(0, 5)); // Show only next 5
        } catch (error) {
            console.error('Failed to fetch deadlines:', error);
            setUpcomingDeadlines([]);
        }
    };

    const fetchRecentAnnouncements = async () => {
        try {
            const user = await api.get('/auth/me');
            const enrollmentsResponse = await api.get(`/users/${user.data.id}/enrollments`);

            const allAnnouncements: Announcement[] = [];

            for (const enrollment of enrollmentsResponse.data || []) {
                try {
                    const response = await api.get(`/announcements/course/${enrollment.course_id}`);
                    allAnnouncements.push(...response.data);
                } catch (error) {
                    console.error(`Failed to fetch announcements for course ${enrollment.course_id}:`, error);
                }
            }

            // Sort by pinned first, then by date
            allAnnouncements.sort((a, b) => {
                if (a.is_pinned && !b.is_pinned) return -1;
                if (!a.is_pinned && b.is_pinned) return 1;
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });

            setAnnouncements(allAnnouncements.slice(0, 5)); // Show only 5 most recent
        } catch (error) {
            console.error('Failed to fetch announcements:', error);
            setAnnouncements([]);
        }
    };

    const fetchAttendanceStats = async () => {
        try {
            const response = await api.get('/attendance/my-summary');
            if (response.data) {
                const attended = response.data.filter((a: any) => a.status === 'present').length;
                const total = response.data.length;
                setAttendanceStats({
                    total_classes: total,
                    attended: attended,
                    percentage: total > 0 ? Math.round((attended / total) * 100) : 0
                });
            }
        } catch (error) {
            console.error('Failed to fetch attendance stats:', error);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = date.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays < 7) return `In ${diffDays} days`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    };

    const formatAnnouncementDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

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
                    My Dashboard
                </h1>
                <p className="text-text-secondary mt-1">Welcome back! Here's your overview</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Enrolled Courses */}
                <div className="bg-bg-secondary rounded-xl p-6 border border-white/5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-primary/20 rounded-lg">
                            <BookOpen className="w-6 h-6 text-primary" />
                        </div>
                        <span className="text-3xl font-bold text-white">{enrollments.length}</span>
                    </div>
                    <h3 className="text-text-secondary text-sm font-medium">Enrolled Courses</h3>
                </div>

                {/* Upcoming Deadlines */}
                <div className="bg-bg-secondary rounded-xl p-6 border border-white/5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-orange-500/20 rounded-lg">
                            <Clock className="w-6 h-6 text-orange-400" />
                        </div>
                        <span className="text-3xl font-bold text-white">{upcomingDeadlines.length}</span>
                    </div>
                    <h3 className="text-text-secondary text-sm font-medium">Upcoming Deadlines</h3>
                </div>

                {/* New Announcements */}
                <div className="bg-bg-secondary rounded-xl p-6 border border-white/5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-500/20 rounded-lg">
                            <Megaphone className="w-6 h-6 text-blue-400" />
                        </div>
                        <span className="text-3xl font-bold text-white">{announcements.length}</span>
                    </div>
                    <h3 className="text-text-secondary text-sm font-medium">Recent Announcements</h3>
                </div>

                {/* Attendance */}
                <div className="bg-bg-secondary rounded-xl p-6 border border-white/5">
                    <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-lg ${(attendanceStats?.percentage || 0) >= 75
                            ? 'bg-green-500/20'
                            : 'bg-red-500/20'
                            }`}>
                            {(attendanceStats?.percentage || 0) >= 75 ? (
                                <CheckCircle className="w-6 h-6 text-green-400" />
                            ) : (
                                <AlertCircle className="w-6 h-6 text-red-400" />
                            )}
                        </div>
                        <span className="text-3xl font-bold text-white">
                            {attendanceStats?.percentage || 0}%
                        </span>
                    </div>
                    <h3 className="text-text-secondary text-sm font-medium">
                        Attendance ({attendanceStats?.attended || 0}/{attendanceStats?.total_classes || 0})
                    </h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Deadlines Section */}
                <div className="bg-bg-secondary rounded-xl p-6 border border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                        <Clock className="w-5 h-5 text-orange-400" />
                        <h2 className="text-xl font-semibold text-white">Upcoming Deadlines</h2>
                    </div>

                    {upcomingDeadlines.length === 0 ? (
                        <p className="text-text-secondary text-center py-8">No upcoming deadlines</p>
                    ) : (
                        <div className="space-y-3">
                            {upcomingDeadlines.map((deadline, index) => (
                                <div
                                    key={index}
                                    className="p-4 bg-bg-primary rounded-lg border border-white/5 hover:border-primary/30 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-white truncate">{deadline.title}</h3>
                                            <p className="text-sm text-text-secondary">{deadline.course_title}</p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <span className="text-sm font-medium text-orange-400">
                                                {formatDate(deadline.due_date)}
                                            </span>
                                            <p className="text-xs text-text-secondary text-right">
                                                {'type' in deadline && deadline.type === 'quiz' ? 'Quiz' : 'Assignment'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Announcements Section */}
                <div className="bg-bg-secondary rounded-xl p-6 border border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                        <Megaphone className="w-5 h-5 text-blue-400" />
                        <h2 className="text-xl font-semibold text-white">Recent Announcements</h2>
                    </div>

                    {announcements.length === 0 ? (
                        <p className="text-text-secondary text-center py-8">No recent announcements</p>
                    ) : (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto">
                            {announcements.map((announcement) => (
                                <div
                                    key={announcement.id}
                                    className="p-4 bg-bg-primary rounded-lg border border-white/5"
                                >
                                    {announcement.is_pinned && (
                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary mb-2">
                                            📌 Pinned
                                        </span>
                                    )}
                                    <h3 className="font-medium text-white mb-1">{announcement.title}</h3>
                                    <p className="text-sm text-text-secondary line-clamp-2 mb-2">
                                        {announcement.content}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                                        <span>{announcement.creator_name}</span>
                                        <span>•</span>
                                        <span>{formatAnnouncementDate(announcement.created_at)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Enrolled Courses Section */}
                <div className="bg-bg-secondary rounded-xl p-6 border border-white/5 lg:col-span-2">
                    <div className="flex items-center gap-3 mb-4">
                        <BookOpen className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-semibold text-white">My Courses</h2>
                    </div>

                    {enrollments.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-text-secondary mb-4">You are not enrolled in any courses yet</p>
                            <Link
                                to="/courses"
                                className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium inline-flex items-center gap-2"
                            >
                                Browse Courses
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {enrollments.map((enrollment) => (
                                <Link
                                    key={enrollment.course_id}
                                    to={`/courses/${enrollment.course_id}`}
                                    className="p-4 bg-bg-primary rounded-lg border border-white/5 hover:border-primary/50 transition-all duration-300"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-primary/20 rounded-lg">
                                            <BookOpen className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-white mb-1 truncate">
                                                {enrollment.course_title}
                                            </h3>
                                            <p className="text-sm text-text-secondary">{enrollment.course_code}</p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
