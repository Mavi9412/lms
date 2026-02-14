import { useState, useEffect } from 'react';
import { Calendar, Users, Check, X, Clock, Save, FileText, Edit, BarChart3 } from 'lucide-react';
import api from '../../services/api';

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
    id: number;
    student_id: number;
    student_name: string;
    status: AttendanceStatus;
    date: string;
}

interface StudentReport {
    student_id: number;
    student_name: string;
    student_email: string;
    total_classes: number;
    present: number;
    absent: number;
    late: number;
    attendance_percentage: number;
}

const TeacherAttendance = () => {
    const [activeTab, setActiveTab] = useState<'mark' | 'edit' | 'report'>('mark');
    const [sections, setSections] = useState<Section[]>([]);
    const [selectedSection, setSelectedSection] = useState<Section | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendance, setAttendance] = useState<Record<number, AttendanceStatus>>({});
    const [existingRecords, setExistingRecords] = useState<AttendanceRecord[]>([]);
    const [reportData, setReportData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Fetch sections
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
        fetchSections();
    }, []);

    // Fetch students for Mark tab
    useEffect(() => {
        if (activeTab !== 'mark' || !selectedSection) return;

        const fetchStudents = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/attendance/sections/${selectedSection.id}/students`);
                setStudents(response.data);

                // Initialize attendance
                const initialAttendance: Record<number, AttendanceStatus> = {};
                response.data.forEach((student: Student) => {
                    initialAttendance[student.id] = 'present';
                });
                setAttendance(initialAttendance);

                // Try to fetch existing records
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
                    // No existing records
                }
            } catch (error) {
                console.error('Failed to fetch students:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, [selectedSection, date, activeTab]);

    // Fetch existing records for Edit tab
    useEffect(() => {
        if (activeTab !== 'edit' || !selectedSection) return;

        const fetchRecords = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/attendance/sections/${selectedSection.id}/records?date=${date}T00:00:00`);
                setExistingRecords(response.data);
            } catch (error) {
                console.error('Failed to fetch records:', error);
                setExistingRecords([]);
            } finally {
                setLoading(false);
            }
        };
        fetchRecords();
    }, [selectedSection, date, activeTab]);

    // Fetch report for Report tab
    useEffect(() => {
        if (activeTab !== 'report' || !selectedSection) return;

        const fetchReport = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/attendance/reports/${selectedSection.id}`);
                setReportData(response.data);
            } catch (error) {
                console.error('Failed to fetch report:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [selectedSection, activeTab]);

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
            const records = Object.entries(attendance).map(([studentId, status]) => ({
                student_id: parseInt(studentId),
                status
            }));

            await api.post(`/attendance/sections/${selectedSection.id}/mark`, {
                date: `${date}T00:00:00`,
                records
            });

            setMessage({ type: 'success', text: 'Attendance saved successfully!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save attendance.' });
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateRecord = async (attendanceId: number, newStatus: AttendanceStatus) => {
        try {
            await api.patch(`/attendance/${attendanceId}`, null, {
                params: { status: newStatus }
            });
            setMessage({ type: 'success', text: 'Attendance updated!' });
            // Refresh records
            const response = await api.get(`/attendance/sections/${selectedSection!.id}/records?date=${date}T00:00:00`);
            setExistingRecords(response.data);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update attendance.' });
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

    const stats = {
        present: Object.values(attendance).filter(s => s === 'present').length,
        absent: Object.values(attendance).filter(s => s === 'absent').length,
        late: Object.values(attendance).filter(s => s === 'late').length,
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                    Attendance Management
                </h1>
                <p className="text-text-secondary mt-1">Mark, edit, and view attendance reports</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 bg-bg-secondary rounded-xl p-2 w-fit">
                <button
                    onClick={() => setActiveTab('mark')}
                    className={`px-6 py-3 rounded-lg transition-all flex items-center gap-2 font-medium ${activeTab === 'mark'
                            ? 'bg-primary text-white'
                            : 'text-text-secondary hover:text-white'
                        }`}
                >
                    <FileText className="w-4 h-4" />
                    Mark Attendance
                </button>
                <button
                    onClick={() => setActiveTab('edit')}
                    className={`px-6 py-3 rounded-lg transition-all flex items-center gap-2 font-medium ${activeTab === 'edit'
                            ? 'bg-primary text-white'
                            : 'text-text-secondary hover:text-white'
                        }`}
                >
                    <Edit className="w-4 h-4" />
                    Edit Attendance
                </button>
                <button
                    onClick={() => setActiveTab('report')}
                    className={`px-6 py-3 rounded-lg transition-all flex items-center gap-2 font-medium ${activeTab === 'report'
                            ? 'bg-primary text-white'
                            : 'text-text-secondary hover:text-white'
                        }`}
                >
                    <BarChart3 className="w-4 h-4" />
                    Attendance Report
                </button>
            </div>

            {/* Section and Date Selection */}
            <div className="bg-bg-secondary rounded-xl p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Select Section
                        </label>
                        <select
                            value={selectedSection?.id || ''}
                            onChange={(e) => {
                                const section = sections.find(s => s.id === parseInt(e.target.value));
                                setSelectedSection(section || null);
                            }}
                            className="w-full px-4 py-3 bg-bg-primary border border-white/10 rounded-lg focus:outline-none focus:border-primary transition-colors text-white"
                        >
                            {sections.map(section => (
                                <option key={section.id} value={section.id}>
                                    {section.course_code} - {section.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {activeTab !== 'report' && (
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">
                                Date
                            </label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full px-4 py-3 bg-bg-primary border border-white/10 rounded-lg focus:outline-none focus:border-primary transition-colors text-white"
                                />
                                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary pointer-events-none" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-xl mb-6 ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {message.text}
                </div>
            )}

            {/* Tab Content */}
            {activeTab === 'mark' && (
                <div>
                    {/* Quick Actions */}
                    <div className="flex gap-3 mb-6">
                        <button
                            onClick={() => handleMarkAll('present')}
                            className="px-6 py-3 rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors font-medium"
                        >
                            Mark All Present
                        </button>
                        <button
                            onClick={() => handleMarkAll('absent')}
                            className="px-6 py-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors font-medium"
                        >
                            Mark All Absent
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-bg-secondary p-4 rounded-xl text-center">
                            <div className="flex items-center justify-center gap-2 text-green-400 mb-1">
                                <Check className="w-5 h-5" />
                                <span className="text-2xl font-bold">{stats.present}</span>
                            </div>
                            <p className="text-text-secondary text-sm">Present</p>
                        </div>
                        <div className="bg-bg-secondary p-4 rounded-xl text-center">
                            <div className="flex items-center justify-center gap-2 text-red-400 mb-1">
                                <X className="w-5 h-5" />
                                <span className="text-2xl font-bold">{stats.absent}</span>
                            </div>
                            <p className="text-text-secondary text-sm">Absent</p>
                        </div>
                        <div className="bg-bg-secondary p-4 rounded-xl text-center">
                            <div className="flex items-center justify-center gap-2 text-yellow-400 mb-1">
                                <Clock className="w-5 h-5" />
                                <span className="text-2xl font-bold">{stats.late}</span>
                            </div>
                            <p className="text-text-secondary text-sm">Late</p>
                        </div>
                    </div>

                    {/* Students List */}
                    <div className="bg-bg-secondary rounded-xl overflow-hidden">
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
                            <div className="p-8 text-center text-text-secondary">Loading students...</div>
                        ) : students.length === 0 ? (
                            <div className="p-8 text-center text-text-secondary">No students enrolled.</div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {students.map((student, index) => (
                                    <div key={student.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <span className="text-text-secondary font-mono text-sm w-8">{index + 1}.</span>
                                            <div>
                                                <h3 className="font-medium text-white">{student.full_name}</h3>
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
            )}

            {activeTab === 'edit' && (
                <div className="bg-bg-secondary rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-white/10">
                        <h2 className="text-lg font-semibold">Edit Attendance for {date}</h2>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center text-text-secondary">Loading records...</div>
                    ) : existingRecords.length === 0 ? (
                        <div className="p-8 text-center text-text-secondary">No attendance records for this date.</div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {existingRecords.map((record, index) => (
                                <div key={record.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <span className="text-text-secondary font-mono text-sm w-8">{index + 1}.</span>
                                        <div>
                                            <h3 className="font-medium text-white">{record.student_name}</h3>
                                            <p className="text-text-secondary text-sm">Current: <span className="capitalize">{record.status}</span></p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {(['present', 'absent', 'late'] as AttendanceStatus[]).map(status => (
                                            <button
                                                key={status}
                                                onClick={() => handleUpdateRecord(record.id, status)}
                                                className={`px-4 py-2 rounded-lg border-2 flex items-center gap-2 transition-all ${record.status === status
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
            )}

            {activeTab === 'report' && (
                <div>
                    {loading ? (
                        <div className="bg-bg-secondary rounded-xl p-8 text-center text-text-secondary">
                            Loading report...
                        </div>
                    ) : !reportData ? (
                        <div className="bg-bg-secondary rounded-xl p-8 text-center text-text-secondary">
                            No report data available.
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Overall Stats */}
                            <div className="bg-bg-secondary rounded-xl p-6">
                                <h3 className="text-lg font-semibold mb-4">Overall Statistics</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-white">{reportData.overall_stats.total_students}</p>
                                        <p className="text-text-secondary text-sm">Students</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-white">{reportData.overall_stats.total_classes}</p>
                                        <p className="text-text-secondary text-sm">Classes</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-green-400">{reportData.overall_stats.total_present}</p>
                                        <p className="text-text-secondary text-sm">Total Present</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-primary">{reportData.overall_stats.average_attendance}%</p>
                                        <p className="text-text-secondary text-sm">Avg Attendance</p>
                                    </div>
                                </div>
                            </div>

                            {/* Student-wise Report */}
                            <div className="bg-bg-secondary rounded-xl overflow-hidden">
                                <div className="p-4 border-b border-white/10">
                                    <h3 className="text-lg font-semibold">Student-wise Attendance</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/10 text-left">
                                                <th className="p-4 text-text-secondary font-medium">Student</th>
                                                <th className="p-4 text-text-secondary font-medium text-center">Present</th>
                                                <th className="p-4 text-text-secondary font-medium text-center">Absent</th>
                                                <th className="p-4 text-text-secondary font-medium text-center">Late</th>
                                                <th className="p-4 text-text-secondary font-medium text-center">Percentage</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportData.students.map((student: StudentReport) => (
                                                <tr key={student.student_id} className="border-b border-white/5 hover:bg-white/5">
                                                    <td className="p-4">
                                                        <div>
                                                            <p className="font-medium text-white">{student.student_name}</p>
                                                            <p className="text-sm text-text-secondary">{student.student_email}</p>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-center text-green-400 font-medium">{student.present}</td>
                                                    <td className="p-4 text-center text-red-400 font-medium">{student.absent}</td>
                                                    <td className="p-4 text-center text-yellow-400 font-medium">{student.late}</td>
                                                    <td className="p-4 text-center">
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${student.attendance_percentage >= 75 ? 'bg-green-500/20 text-green-400' :
                                                                student.attendance_percentage >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                                                                    'bg-red-500/20 text-red-400'
                                                            }`}>
                                                            {student.attendance_percentage}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TeacherAttendance;
