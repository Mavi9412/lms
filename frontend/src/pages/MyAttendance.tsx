import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, Check, X, Clock, ChevronDown, TrendingUp, BookOpen } from 'lucide-react';
import api from '../services/api';

interface Section {
    id: number;
    name: string;
    course_title: string;
    course_code: string;
}

interface AttendanceRecord {
    id: number;
    date: string;
    status: 'present' | 'absent' | 'late';
    section_name: string;
    course_title: string;
    course_code: string;
}

interface AttendanceSummary {
    total_classes: number;
    present: number;
    absent: number;
    late: number;
    attendance_percentage: number;
}

const MyAttendance = () => {
    const { user } = useAuth();
    const [sections, setSections] = useState<Section[]>([]);
    const [selectedSection, setSelectedSection] = useState<number | null>(null);
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [summary, setSummary] = useState<AttendanceSummary | null>(null);
    const [loading, setLoading] = useState(false);

    // Fetch enrolled sections
    useEffect(() => {
        const fetchSections = async () => {
            try {
                const response = await api.get('/attendance/my-enrollments');
                setSections(response.data);
            } catch (error) {
                console.error('Failed to fetch sections:', error);
            }
        };

        if (user) {
            fetchSections();
        }
    }, [user]);

    // Fetch attendance records and summary
    useEffect(() => {
        const fetchAttendance = async () => {
            if (!user) return;

            setLoading(true);
            try {
                // Fetch records
                const recordsUrl = selectedSection
                    ? `/attendance/my-records?section_id=${selectedSection}`
                    : '/attendance/my-records';
                const recordsResponse = await api.get(recordsUrl);
                setRecords(recordsResponse.data);

                // Fetch summary
                const summaryUrl = selectedSection
                    ? `/attendance/students/${user.id}/summary?section_id=${selectedSection}`
                    : `/attendance/students/${user.id}/summary`;
                const summaryResponse = await api.get(summaryUrl);
                setSummary(summaryResponse.data);
            } catch (error) {
                console.error('Failed to fetch attendance:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAttendance();
    }, [user, selectedSection]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'present': return 'text-green-400 bg-green-500/20';
            case 'absent': return 'text-red-400 bg-red-500/20';
            case 'late': return 'text-yellow-400 bg-yellow-500/20';
            default: return 'text-gray-400 bg-gray-500/20';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'present': return <Check className="w-4 h-4" />;
            case 'absent': return <X className="w-4 h-4" />;
            case 'late': return <Clock className="w-4 h-4" />;
            default: return null;
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getPercentageColor = (percentage: number) => {
        if (percentage >= 75) return 'text-green-400';
        if (percentage >= 60) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <div className="container mx-auto px-6 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
                        My Attendance
                    </span>
                </h1>
                <p className="text-text-secondary">Track your class attendance records</p>
            </div>

            {/* Section Filter */}
            <div className="glass p-6 rounded-2xl mb-8">
                <div className="flex items-center gap-4">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <label className="text-sm font-medium text-text-secondary">Filter by Course:</label>
                    <div className="relative flex-1 max-w-md">
                        <select
                            value={selectedSection || ''}
                            onChange={(e) => setSelectedSection(e.target.value ? parseInt(e.target.value) : null)}
                            className="w-full glass px-4 py-3 rounded-xl appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            <option value="" className="bg-gray-900">All Courses</option>
                            {sections.map(section => (
                                <option key={section.id} value={section.id} className="bg-gray-900">
                                    {section.course_code} - {section.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    <div className="glass p-4 rounded-xl text-center">
                        <div className="flex items-center justify-center gap-2 text-primary mb-1">
                            <TrendingUp className="w-5 h-5" />
                            <span className={`text-2xl font-bold ${getPercentageColor(summary.attendance_percentage)}`}>
                                {summary.attendance_percentage}%
                            </span>
                        </div>
                        <p className="text-text-secondary text-sm">Attendance</p>
                    </div>
                    <div className="glass p-4 rounded-xl text-center">
                        <div className="flex items-center justify-center gap-2 text-blue-400 mb-1">
                            <Calendar className="w-5 h-5" />
                            <span className="text-2xl font-bold">{summary.total_classes}</span>
                        </div>
                        <p className="text-text-secondary text-sm">Total Classes</p>
                    </div>
                    <div className="glass p-4 rounded-xl text-center">
                        <div className="flex items-center justify-center gap-2 text-green-400 mb-1">
                            <Check className="w-5 h-5" />
                            <span className="text-2xl font-bold">{summary.present}</span>
                        </div>
                        <p className="text-text-secondary text-sm">Present</p>
                    </div>
                    <div className="glass p-4 rounded-xl text-center">
                        <div className="flex items-center justify-center gap-2 text-red-400 mb-1">
                            <X className="w-5 h-5" />
                            <span className="text-2xl font-bold">{summary.absent}</span>
                        </div>
                        <p className="text-text-secondary text-sm">Absent</p>
                    </div>
                    <div className="glass p-4 rounded-xl text-center">
                        <div className="flex items-center justify-center gap-2 text-yellow-400 mb-1">
                            <Clock className="w-5 h-5" />
                            <span className="text-2xl font-bold">{summary.late}</span>
                        </div>
                        <p className="text-text-secondary text-sm">Late</p>
                    </div>
                </div>
            )}

            {/* Attendance Warning */}
            {summary && summary.attendance_percentage < 75 && (
                <div className="bg-red-500/20 border border-red-500/30 text-red-400 p-4 rounded-xl mb-8">
                    <strong>Warning:</strong> Your attendance is below 75%. Please attend classes regularly to avoid academic penalties.
                </div>
            )}

            {/* Records List */}
            <div className="glass rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/10 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-semibold">Attendance History</h2>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-text-secondary">
                        Loading attendance records...
                    </div>
                ) : records.length === 0 ? (
                    <div className="p-8 text-center text-text-secondary">
                        No attendance records found.
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {records.map((record) => (
                            <div key={record.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-lg ${getStatusColor(record.status)}`}>
                                        {getStatusIcon(record.status)}
                                    </div>
                                    <div>
                                        <h3 className="font-medium">{formatDate(record.date)}</h3>
                                        <p className="text-text-secondary text-sm">
                                            {record.course_code} - {record.section_name}
                                        </p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(record.status)}`}>
                                    {record.status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyAttendance;
