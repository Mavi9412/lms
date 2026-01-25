import { useState, useEffect } from 'react';
import { UserCheck } from 'lucide-react';
import api from '../../services/api';

const AdminAllocations = () => {
    const [teachers, setTeachers] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [teachersRes, sectionsRes] = await Promise.all([
                api.get('/admin/users?role=teacher'),
                api.get('/academic/sections') // Need to ensure this endpoint exists or create it
            ]);
            setTeachers(teachersRes.data);
            setSections(sectionsRes.data);
        } catch (error) {
            console.error('Failed to fetch allocations data');
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (sectionId: number, teacherId: string) => {
        if (!teacherId) return;
        try {
            await api.post(`/admin/sections/${sectionId}/assign-teacher/${teacherId}`);
            alert('Teacher assigned successfully');
            fetchData();
        } catch (error) {
            alert('Failed to assign teacher');
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-bold mb-6">Course Allocations</h1>
            <p className="text-text-secondary mb-8">Assign teachers to active course sections.</p>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="glass rounded-xl border border-white/5 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-text-secondary text-sm">
                            <tr>
                                <th className="px-6 py-3">Section</th>
                                <th className="px-6 py-3">Course</th>
                                <th className="px-6 py-3">Current Instructor</th>
                                <th className="px-6 py-3">Assign New</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {sections.map((section: any) => (
                                <tr key={section.id} className="hover:bg-white/5">
                                    <td className="px-6 py-4 font-medium">{section.name}</td>
                                    <td className="px-6 py-4">{section.course?.title}</td>
                                    <td className="px-6 py-4">
                                        {section.teacher ? (
                                            <div className="flex items-center gap-2 text-green-400">
                                                <UserCheck className="w-4 h-4" />
                                                {section.teacher.full_name}
                                            </div>
                                        ) : (
                                            <span className="text-red-400 text-sm">Unassigned</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            className="bg-bg-primary border border-white/10 rounded px-3 py-1.5 text-sm outline-none focus:border-primary"
                                            onChange={(e) => handleAssign(section.id, e.target.value)}
                                            defaultValue=""
                                        >
                                            <option value="" disabled>Select Teacher</option>
                                            {teachers.map(t => (
                                                <option key={t.id} value={t.id}>{t.full_name}</option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {sections.length === 0 && (
                        <div className="p-12 text-center text-text-secondary">
                            No sections found. Create sections in Academic Structure first.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminAllocations;
