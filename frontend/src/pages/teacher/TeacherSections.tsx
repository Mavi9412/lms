import { useEffect, useState } from 'react';
import { BookOpen, Users, Calendar, Eye, X } from 'lucide-react';
import api from '../../services/api';

interface Course {
    id: number;
    title: string;
    code: string;
    description: string | null;
    credit_hours: number;
}

interface Section {
    id: number;
    name: string;
    course_id: number;
    course_title: string;
    course_code: string;
    course_description: string | null;
    credit_hours: number;
    semester: string;
    enrolled_count: number;
    capacity: number;
}

interface Student {
    id: number;
    full_name: string;
    email: string;
    enrollment_date: string | null;
}

interface SectionDetails {
    id: number;
    name: string;
    semester: string;
    capacity: number;
    enrolled_count: number;
    course: Course;
}

const TeacherSections = () => {
    const [sections, setSections] = useState<Section[]>([]);
    const [selectedSection, setSelectedSection] = useState<SectionDetails | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchSections();
    }, []);

    const fetchSections = async () => {
        try {
            const response = await api.get('/teacher/sections');
            setSections(response.data);
        } catch (error) {
            console.error('Failed to fetch sections:', error);
        } finally {
            setLoading(false);
        }
    };

    const viewSectionDetails = async (sectionId: number) => {
        try {
            const [detailsResponse, studentsResponse] = await Promise.all([
                api.get(`/teacher/sections/${sectionId}`),
                api.get(`/teacher/sections/${sectionId}/students`)
            ]);
            setSelectedSection(detailsResponse.data);
            setStudents(studentsResponse.data);
            setShowModal(true);
        } catch (error) {
            console.error('Failed to fetch section details:', error);
            alert('Failed to load section details');
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedSection(null);
        setStudents([]);
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
                    My Sections
                </h1>
                <p className="text-text-secondary mt-1">View your assigned courses and enrolled students</p>
            </div>

            {/* Sections List */}
            {sections.length === 0 ? (
                <div className="bg-bg-secondary rounded-xl border border-white/5 p-12 text-center">
                    <BookOpen className="w-16 h-16 text-text-secondary mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Sections Assigned</h3>
                    <p className="text-text-secondary">You don't have any sections assigned yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {sections.map((section) => (
                        <div
                            key={section.id}
                            className="bg-bg-secondary rounded-xl border border-white/5 p-6 hover:border-primary/50 transition-all duration-300 group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">
                                        {section.course_title}
                                    </h3>
                                    <p className="text-text-secondary text-sm mt-1">
                                        {section.course_code} - {section.name}
                                    </p>
                                </div>
                                <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-medium">
                                    {section.semester}
                                </span>
                            </div>

                            <div className="flex items-center gap-6 text-sm text-text-secondary mb-4">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    <span>{section.enrolled_count}/{section.capacity} students</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>{section.credit_hours} credits</span>
                                </div>
                            </div>

                            {section.course_description && (
                                <p className="text-text-secondary text-sm line-clamp-2 mb-4">
                                    {section.course_description}
                                </p>
                            )}

                            <button
                                onClick={() => viewSectionDetails(section.id)}
                                className="w-full px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                            >
                                <Eye className="w-4 h-4" />
                                View Details & Students
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Section Details Modal */}
            {showModal && selectedSection && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-bg-secondary rounded-xl border border-white/10 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-bg-secondary z-10">
                            <div>
                                <h2 className="text-2xl font-bold text-white">{selectedSection.course.title}</h2>
                                <p className="text-text-secondary text-sm mt-1">
                                    {selectedSection.course.code} - {selectedSection.name}
                                </p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6">
                            {/* Course Information */}
                            <div className="bg-bg-primary rounded-lg p-4 mb-6">
                                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-primary" />
                                    Course Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-text-secondary">Course Code:</span>
                                        <p className="text-white font-medium">{selectedSection.course.code}</p>
                                    </div>
                                    <div>
                                        <span className="text-text-secondary">Credit Hours:</span>
                                        <p className="text-white font-medium">{selectedSection.course.credit_hours}</p>
                                    </div>
                                    <div>
                                        <span className="text-text-secondary">Semester:</span>
                                        <p className="text-white font-medium">{selectedSection.semester}</p>
                                    </div>
                                    <div>
                                        <span className="text-text-secondary">Capacity:</span>
                                        <p className="text-white font-medium">
                                            {selectedSection.enrolled_count} / {selectedSection.capacity}
                                        </p>
                                    </div>
                                </div>
                                {selectedSection.course.description && (
                                    <div className="mt-4">
                                        <span className="text-text-secondary">Description:</span>
                                        <p className="text-white mt-1">{selectedSection.course.description}</p>
                                    </div>
                                )}
                            </div>

                            {/* Enrolled Students */}
                            <div className="bg-bg-primary rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-green-400" />
                                    Enrolled Students ({students.length})
                                </h3>

                                {students.length === 0 ? (
                                    <p className="text-text-secondary text-center py-8">No students enrolled yet</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-white/10">
                                                    <th className="text-left py-3 px-4 text-text-secondary font-medium text-sm">Name</th>
                                                    <th className="text-left py-3 px-4 text-text-secondary font-medium text-sm">Email</th>
                                                    <th className="text-left py-3 px-4 text-text-secondary font-medium text-sm">Enrolled Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {students.map((student, index) => (
                                                    <tr
                                                        key={student.id}
                                                        className={`border-b border-white/5 ${index % 2 === 0 ? 'bg-white/[0.02]' : ''}`}
                                                    >
                                                        <td className="py-3 px-4 text-white">{student.full_name}</td>
                                                        <td className="py-3 px-4 text-text-secondary">{student.email}</td>
                                                        <td className="py-3 px-4 text-text-secondary">
                                                            {student.enrollment_date
                                                                ? new Date(student.enrollment_date).toLocaleDateString()
                                                                : 'N/A'
                                                            }
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-white/10 flex justify-end">
                            <button
                                onClick={closeModal}
                                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherSections;
