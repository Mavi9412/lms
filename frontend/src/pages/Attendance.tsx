import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, Users, Check, X, Clock, Save, ChevronDown } from 'lucide-react';
import api from '../services/api';

interface Section {
    id: number;
    name: string;
    course_title: string;
    course_code: string;
}

interface Student {
    id: number;
    full_name: string;
    email: string;
}

type AttendanceStatus = 'present' | 'absent' | 'late';

interface AttendanceRecord {
    student_id: number;
    status: AttendanceStatus;
}

const Attendance = () => {
    const { user } = useAuth();
    const [sections, setSections] = useState<Section[]>([]);
    const [selectedSection, setSelectedSection] = useState<Section | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendance, setAttendance] = useState<Record<number, AttendanceStatus>>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Fetch teacher's sections
    useEffect(() => {
        const fetchSections = async () => {
            try {
                const response = await api.get('/attendance/my-sections');
                setSections(response.data);
                if (response.data.length > 0) {
                    setSelectedSection(response.data[0]);
                }
            } catch (error) {
                console.error('Failed to fetch sections:', error);
            }
        };

        if (user?.role === 'teacher' || user?.role === 'admin') {
            fetchSections();
        }
    }, [user]);

    // Fetch students when section changes
    useEffect(() => {
        const fetchStudents = async () => {
            if (!selectedSection) return;

            setLoading(true);
            try {
                const response = await api.get(`/attendance/sections/${selectedSection.id}/students`);
                setStudents(response.data);

                // Initialize all as present
                const initialAttendance: Record<number, AttendanceStatus> = {};
                response.data.forEach((student: Student) => {
                    initialAttendance[student.id] = 'present';
                });
                setAttendance(initialAttendance);

                // Try to fetch existing records for this date
                try {
                    const recordsResponse = await api.get(`/attendance/sections/${selectedSection.id}/records?date=${date}T00:00:00`);
                    if (recordsResponse.data.length > 0) {
                        const existingAttendance: Record<number, AttendanceStatus> = {};
                        recordsResponse.data.forEach((record: any) => {
                            existingAttendance[record.student_id] = record.status as AttendanceStatus;
                        });
                        setAttendance(prev => ({ ...prev, ...existingAttendance }));
                    }
                } catch {
                    // No existing records, use default
                }
            } catch (error) {
                console.error('Failed to fetch students:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, [selectedSection, date]);

    const handleStatusChange = (studentId: number, status: AttendanceStatus) => {
        setAttendance(prev => ({ ...prev, [studentId]: status }));
    };

    const handleMarkAll = (status: AttendanceStatus) => {
        const newAttendance: Record<number, AttendanceStatus> = {};
        students.forEach(student => {
            newAttendance[student.id] = status;
        });
        setAttendance(newAttendance);
    };

    const handleSubmit = async () => {
        if (!selectedSection) return;

        setSaving(true);
        setMessage(null);

        try {
            const records: AttendanceRecord[] = Object.entries(attendance).map(([studentId, status]) => ({
                student_id: parseInt(studentId),
                status
            }));

            await api.post(`/attendance/sections/${selectedSection.id}/mark`, {
                date: `${date}T00:00:00`,
                records
            });

            setMessage({ type: 'success', text: 'Attendance saved successfully!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save attendance. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    const getStatusColor = (status: AttendanceStatus) => {
        switch (status) {
            case 'present': return 'bg-green-500/20 border-green-500 text-green-400';
            case 'absent': return 'bg-red-500/20 border-red-500 text-red-400';
            case 'late': return 'bg-yellow-500/20 border-yellow-500 text-yellow-400';
        }
    };

    const getStatusIcon = (status: AttendanceStatus) => {
        switch (status) {
            case 'present': return <Check className="w-4 h-4" />;
            case 'absent': return <X className="w-4 h-4" />;
            case 'late': return <Clock className="w-4 h-4" />;
        }
    };

    // Count statistics
    const stats = {
        present: Object.values(attendance).filter(s => s === 'present').length,
        absent: Object.values(attendance).filter(s => s === 'absent').length,
        late: Object.values(attendance).filter(s => s === 'late').length,
    };

    if (user?.role !== 'teacher' && user?.role !== 'admin') {
        return (
            <div className="container mx-auto px-6 py-8">
                <div className="glass p-8 rounded-2xl text-center">
                    <h2 className="text-2xl font-bold text-red-400">Access Denied</h2>
                    <p className="text-text-secondary mt-2">Only teachers can access the attendance page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
                        Take Attendance
                    </span>
                </h1>
                <p className="text-text-secondary">Mark attendance for your class sections</p>
            </div>

            {/* Controls */}
            <div className="glass p-6 rounded-2xl mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Section Selector */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Select Section
                        </label>
                        <div className="relative">
                            <select
                                value={selectedSection?.id || ''}
                                onChange={(e) => {
                                    const section = sections.find(s => s.id === parseInt(e.target.value));
                                    setSelectedSection(section || null);
                                }}
                                className="w-full glass px-4 py-3 rounded-xl appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                {sections.map(section => (
                                    <option key={section.id} value={section.id} className="bg-gray-900">
                                        {section.course_code} - {section.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary pointer-events-none" />
                        </div>
                    </div>

                    {/* Date Picker */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Date
                        </label>
                        <div className="relative">
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full glass px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary pointer-events-none" />
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Quick Actions
                        </label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleMarkAll('present')}
                                className="flex-1 px-3 py-3 rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors text-sm font-medium"
                            >
                                All Present
                            </button>
                            <button
                                onClick={() => handleMarkAll('absent')}
                                className="flex-1 px-3 py-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-medium"
                            >
                                All Absent
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="glass p-4 rounded-xl text-center">
                    <div className="flex items-center justify-center gap-2 text-green-400 mb-1">
                        <Check className="w-5 h-5" />
                        <span className="text-2xl font-bold">{stats.present}</span>
                    </div>
                    <p className="text-text-secondary text-sm">Present</p>
                </div>
                <div className="glass p-4 rounded-xl text-center">
                    <div className="flex items-center justify-center gap-2 text-red-400 mb-1">
                        <X className="w-5 h-5" />
                        <span className="text-2xl font-bold">{stats.absent}</span>
                    </div>
                    <p className="text-text-secondary text-sm">Absent</p>
                </div>
                <div className="glass p-4 rounded-xl text-center">
                    <div className="flex items-center justify-center gap-2 text-yellow-400 mb-1">
                        <Clock className="w-5 h-5" />
                        <span className="text-2xl font-bold">{stats.late}</span>
                    </div>
                    <p className="text-text-secondary text-sm">Late</p>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-xl mb-6 ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {message.text}
                </div>
            )}

            {/* Student List */}
            <div className="glass rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold">Students ({students.length})</h2>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={saving || students.length === 0}
                        className="btn btn-primary px-6 py-2.5 flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Attendance'}
                    </button>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-text-secondary">
                        Loading students...
                    </div>
                ) : students.length === 0 ? (
                    <div className="p-8 text-center text-text-secondary">
                        No students enrolled in this section.
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {students.map((student, index) => (
                            <div key={student.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-4">
                                    <span className="text-text-secondary font-mono text-sm w-8">{index + 1}.</span>
                                    <div>
                                        <h3 className="font-medium">{student.full_name}</h3>
                                        <p className="text-text-secondary text-sm">{student.email}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {(['present', 'absent', 'late'] as AttendanceStatus[]).map(status => (
                                        <button
                                            key={status}
                                            onClick={() => handleStatusChange(student.id, status)}
                                            className={`px-4 py-2 rounded-lg border-2 flex items-center gap-2 transition-all ${attendance[student.id] === status
                                                    ? getStatusColor(status)
                                                    : 'border-white/10 text-text-secondary hover:border-white/20'
                                                }`}
                                        >
                                            {getStatusIcon(status)}
                                            <span className="capitalize text-sm font-medium">{status}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Attendance;
