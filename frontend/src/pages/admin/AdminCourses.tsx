import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, CheckCircle, Eye, EyeOff, Search } from 'lucide-react';
import api from '../../services/api';

interface Course {
    id: number;
    title: string;
    description: string;
    code: string;
    credit_hours: number;
    department_id: number;
    is_approved: boolean;
    is_published: boolean;
}

interface Department {
    id: number;
    name: string;
    code: string;
}

const AdminCourses = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

    useEffect(() => {
        fetchCourses();
        fetchDepartments();
    }, []);

    const fetchCourses = async () => {
        try {
            const response = await api.get('/admin/courses');
            setCourses(response.data);
        } catch (error) {
            console.error('Failed to fetch courses', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await api.get('/academic/departments');
            setDepartments(response.data);
        } catch (error) {
            console.error('Failed to fetch departments', error);
        }
    };

    const handleDelete = async (courseId: number) => {
        if (!confirm('Are you sure you want to delete this course?')) return;

        try {
            await api.delete(`/admin/courses/${courseId}`);
            setCourses(courses.filter(c => c.id !== courseId));
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to delete course');
        }
    };

    const handleApprove = async (courseId: number) => {
        try {
            await api.patch(`/admin/courses/${courseId}/approve`);
            setCourses(courses.map(c =>
                c.id === courseId ? { ...c, is_approved: true } : c
            ));
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to approve course');
        }
    };

    const handleTogglePublish = async (courseId: number, currentStatus: boolean) => {
        const action = currentStatus ? 'unpublish' : 'publish';
        if (!confirm(`Are you sure you want to ${action} this course?`)) return;

        try {
            const response = await api.patch(`/admin/courses/${courseId}/toggle-publish`);
            setCourses(courses.map(c =>
                c.id === courseId ? { ...c, is_published: response.data.is_published } : c
            ));
        } catch (error: any) {
            alert(error.response?.data?.detail || `Failed to ${action} course`);
        }
    };

    const filteredCourses = courses.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getDepartmentName = (deptId: number) => {
        const dept = departments.find(d => d.id === deptId);
        return dept ? dept.name : 'Unknown';
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
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Course Management</h1>
                    <p className="text-text-secondary">Create, manage, and publish courses.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Create Course
                </button>
            </div>

            {/* Search */}
            <div className="glass rounded-xl p-4 mb-6 border border-white/5">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <input
                        type="text"
                        placeholder="Search courses..."
                        className="w-full bg-bg-primary/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 focus:ring-1 ring-primary outline-none text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="glass rounded-xl border border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left bg-bg-secondary/30">
                        <thead className="text-text-secondary text-xs uppercase bg-black/20">
                            <tr>
                                <th className="px-6 py-4 font-medium">Course</th>
                                <th className="px-6 py-4 font-medium">Department</th>
                                <th className="px-6 py-4 font-medium">Credits</th>
                                <th className="px-6 py-4 font-medium">Approved</th>
                                <th className="px-6 py-4 font-medium">Published</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredCourses.map((course) => (
                                <tr key={course.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-medium text-sm text-white">{course.title}</p>
                                            <p className="text-xs text-text-secondary">{course.code}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm">{getDepartmentName(course.department_id)}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm">{course.credit_hours}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs px-2 py-1 rounded-md ${course.is_approved ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                            {course.is_approved ? 'Approved' : 'Pending'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs px-2 py-1 rounded-md ${course.is_published ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-500/10 text-gray-400'}`}>
                                            {course.is_published ? 'Published' : 'Draft'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {!course.is_approved && (
                                                <button
                                                    onClick={() => handleApprove(course.id)}
                                                    className="p-2 hover:bg-green-500/20 text-text-secondary hover:text-green-400 rounded-lg transition-colors"
                                                    title="Approve Course"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleTogglePublish(course.id, course.is_published)}
                                                className={`p-2 rounded-lg transition-colors ${course.is_published
                                                        ? 'hover:bg-orange-500/20 text-text-secondary hover:text-orange-400'
                                                        : 'hover:bg-blue-500/20 text-text-secondary hover:text-blue-400'
                                                    }`}
                                                title={course.is_published ? 'Unpublish Course' : 'Publish Course'}
                                            >
                                                {course.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedCourse(course);
                                                    setIsEditModalOpen(true);
                                                }}
                                                className="p-2 hover:bg-teal-500/20 text-text-secondary hover:text-teal-400 rounded-lg transition-colors"
                                                title="Edit Course"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(course.id)}
                                                className="p-2 hover:bg-red-500/20 text-text-secondary hover:text-red-400 rounded-lg transition-colors"
                                                title="Delete Course"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredCourses.length === 0 && (
                    <div className="p-8 text-center text-text-secondary">
                        No courses found matching your search.
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminCourses;
