import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import api from '../../services/api';

const AdminAcademic = () => {
    const [activeTab, setActiveTab] = useState<'departments' | 'programs' | 'courses' | 'sections' | 'semesters'>('departments');
    const [departments, setDepartments] = useState<any[]>([]);
    const [programs, setPrograms] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [semesters, setSemesters] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Form Stats
    const [newItem, setNewItem] = useState({ name: '', code: '', department_id: '', course_id: '', semester_id: '', year: new Date().getFullYear().toString(), is_active: true });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'departments') {
                const res = await api.get('/academic/departments');
                setDepartments(res.data);
            } else if (activeTab === 'programs') {
                const res = await api.get('/academic/programs');
                setPrograms(res.data);
            } else if (activeTab === 'courses') {
                const res = await api.get('/courses');
                setCourses(res.data);
            } else if (activeTab === 'sections') {
                const res = await api.get('/academic/sections');
                setSections(res.data);
            } else {
                const res = await api.get('/academic/semesters');
                setSemesters(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (activeTab === 'departments') {
                await api.post('/admin/departments', { name: newItem.name, code: newItem.code });
            } else if (activeTab === 'programs') {
                await api.post('/admin/programs', { name: newItem.name, code: newItem.code, department_id: parseInt(newItem.department_id) });
            } else if (activeTab === 'courses') {
                await api.post('/admin/courses', {
                    title: newItem.name,
                    code: newItem.code,
                    department_id: parseInt(newItem.department_id)
                });
            } else if (activeTab === 'sections') {
                await api.post('/admin/sections', {
                    name: newItem.name,
                    course_id: parseInt(newItem.course_id),
                    semester_id: parseInt(newItem.semester_id)
                });
            } else {
                await api.post('/admin/semesters', {
                    name: newItem.name,
                    year: parseInt(newItem.year),
                    is_active: newItem.is_active
                });
            }
            fetchData();
            setNewItem({ name: '', code: '', department_id: '', course_id: '', semester_id: '', year: new Date().getFullYear().toString(), is_active: true });
            alert('Created successfully');
        } catch (error) {
            console.error(error);
            alert('Failed to create item');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this item?')) return;
        try {
            await api.delete(`/admin/${activeTab}/${id}`);
            fetchData();
        } catch (error) {
            alert('Failed to delete');
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-bold mb-6">Academic Structure</h1>

            <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
                {(['departments', 'programs', 'courses', 'sections', 'semesters'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`capitalize px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === tab ? 'bg-primary text-white' : 'bg-white/5 text-text-secondary hover:bg-white/10'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create Form */}
                <div className="glass rounded-xl p-6 border border-white/5 h-fit">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-primary" />
                        Add New {activeTab.slice(0, -1)}
                    </h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="text-sm text-text-secondary mb-1 block">Name / Title</label>
                            <input
                                className="w-full bg-bg-secondary border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-primary"
                                value={newItem.name}
                                onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                required
                                placeholder={activeTab === 'semesters' ? 'e.g. Spring 2026' : ''}
                            />
                        </div>

                        {activeTab === 'semesters' && (
                            <div>
                                <label className="text-sm text-text-secondary mb-1 block">Year</label>
                                <input
                                    className="w-full bg-bg-secondary border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-primary"
                                    type="number"
                                    value={newItem.year}
                                    onChange={e => setNewItem({ ...newItem, year: e.target.value })}
                                    required
                                />
                            </div>
                        )}

                        {(activeTab === 'departments' || activeTab === 'programs' || activeTab === 'courses') && (
                            <div>
                                <label className="text-sm text-text-secondary mb-1 block">Code</label>
                                <input
                                    className="w-full bg-bg-secondary border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-primary"
                                    value={newItem.code}
                                    onChange={e => setNewItem({ ...newItem, code: e.target.value })}
                                    required
                                />
                            </div>
                        )}
                        {(activeTab === 'programs' || activeTab === 'courses') && (
                            <div>
                                <label className="text-sm text-text-secondary mb-1 block">Department ID</label>
                                <input
                                    className="w-full bg-bg-secondary border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-primary"
                                    type="number"
                                    value={newItem.department_id}
                                    onChange={e => setNewItem({ ...newItem, department_id: e.target.value })}
                                    required
                                />
                            </div>
                        )}
                        {activeTab === 'sections' && (
                            <>
                                <div>
                                    <label className="text-sm text-text-secondary mb-1 block">Course ID</label>
                                    <input
                                        className="w-full bg-bg-secondary border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-primary"
                                        type="number"
                                        value={newItem.course_id}
                                        onChange={e => setNewItem({ ...newItem, course_id: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-text-secondary mb-1 block">Semester ID</label>
                                    <input
                                        className="w-full bg-bg-secondary border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-primary"
                                        type="number"
                                        value={newItem.semester_id}
                                        onChange={e => setNewItem({ ...newItem, semester_id: e.target.value })}
                                        required
                                    />
                                </div>
                            </>
                        )}
                        <button className="w-full btn btn-primary py-2 mt-4">Create</button>
                    </form>
                </div>

                {/* List */}
                <div className="lg:col-span-2 glass rounded-xl border border-white/5 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-text-secondary text-sm">
                            <tr>
                                <th className="px-6 py-3">ID</th>
                                <th className="px-6 py-3">Name</th>
                                <th className="px-6 py-3">
                                    {activeTab === 'sections' ? 'Details' : activeTab === 'semesters' ? 'Year' : 'Code'}
                                </th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {(activeTab === 'departments' ? departments :
                                activeTab === 'programs' ? programs :
                                    activeTab === 'courses' ? courses :
                                        activeTab === 'sections' ? sections : semesters).map((item: any) => (
                                            <tr key={item.id} className="hover:bg-white/5">
                                                <td className="px-6 py-4 text-text-secondary">#{item.id}</td>
                                                <td className="px-6 py-4 font-medium">{item.name || item.title}</td>
                                                <td className="px-6 py-4">
                                                    <span className="bg-white/5 px-2 py-1 rounded text-xs border border-white/10">
                                                        {activeTab === 'sections' ? `Course #${item.course_id}` :
                                                            activeTab === 'semesters' ? item.year : item.code}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="text-text-secondary hover:text-red-400 p-2"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminAcademic;
