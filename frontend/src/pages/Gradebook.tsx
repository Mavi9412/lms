import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Assignment {
    id: number;
    title: string;
    max_points: number;
}

interface StudentGrade {
    student_id: number;
    student_name: string;
    student_email: string;
    grades: { [key: number]: number | null };
    total_points: number;
    max_points: number;
    percentage: number;
}

interface GradebookData {
    course_id: number;
    course_title: string;
    assignments: Assignment[];
    students: StudentGrade[];
}

export default function Gradebook() {
    const { courseId } = useParams<{ courseId: string }>();
    const { token } = useAuth();
    const [gradebook, setGradebook] = useState<GradebookData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadGradebook();
    }, [courseId]);

    const loadGradebook = async () => {
        try {
            const response = await axios.get(`${API_URL}/gradebook/course/${courseId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGradebook(response.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load gradebook');
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = () => {
        if (!gradebook) return;

        const headers = ['Student Name', 'Email', ...gradebook.assignments.map(a => a.title), 'Total', 'Percentage'];
        const rows = gradebook.students.map(student => [
            student.student_name,
            student.student_email,
            ...gradebook.assignments.map(a => {
                const grade = student.grades[a.id];
                return grade !== null ? grade.toString() : '-';
            }),
            student.total_points.toString(),
            `${student.percentage.toFixed(2)}%`
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gradebook_${gradebook.course_title.replace(/\s+/g, '_')}.csv`;
        a.click();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400"></div>
            </div>
        );
    }

    if (error || !gradebook) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
                    <p className="text-red-400">{error || 'Gradebook not found'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        to={`/courses/${courseId}`}
                        className="text-gray-400 hover:text-gray-200 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white">{gradebook.course_title}</h1>
                        <p className="text-gray-400 mt-1">Gradebook</p>
                    </div>
                </div>

                <button
                    onClick={exportToCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors"
                >
                    <Download className="w-4 h-4" />
                    Export to CSV
                </button>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-900">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider sticky left-0 bg-gray-900 z-10">
                                    Student
                                </th>
                                {gradebook.assignments.map(assignment => (
                                    <th
                                        key={assignment.id}
                                        className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider"
                                    >
                                        <div>{assignment.title}</div>
                                        <div className="text-gray-500 font-normal">({assignment.max_points} pts)</div>
                                    </th>
                                ))}
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider bg-gray-800">
                                    Total
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider bg-gray-800">
                                    Percentage
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {gradebook.students.map(student => (
                                <tr key={student.student_id} className="hover:bg-gray-750">
                                    <td className="px-4 py-4 sticky left-0 bg-gray-800 z-10">
                                        <div>
                                            <div className="text-sm font-medium text-white">{student.student_name}</div>
                                            <div className="text-xs text-gray-400">{student.student_email}</div>
                                        </div>
                                    </td>
                                    {gradebook.assignments.map(assignment => {
                                        const grade = student.grades[assignment.id];
                                        return (
                                            <td key={assignment.id} className="px-4 py-4 text-center">
                                                {grade !== null ? (
                                                    <span className={`text-sm font-medium ${(grade / assignment.max_points) >= 0.9 ? 'text-green-400' :
                                                            (grade / assignment.max_points) >= 0.7 ? 'text-yellow-400' :
                                                                'text-red-400'
                                                        }`}>
                                                        {grade}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-gray-500">-</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                    <td className="px-4 py-4 text-center bg-gray-850">
                                        <span className="text-sm font-bold text-white">
                                            {student.total_points.toFixed(1)} / {student.max_points}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-center bg-gray-850">
                                        <span className={`text-sm font-bold ${student.percentage >= 90 ? 'text-green-400' :
                                                student.percentage >= 70 ? 'text-yellow-400' :
                                                    student.percentage >= 60 ? 'text-orange-400' :
                                                        'text-red-400'
                                            }`}>
                                            {student.percentage.toFixed(2)}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {gradebook.students.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-400">No students enrolled in this course yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
