import { useState, useEffect } from 'react';
import {
    School,
    BookOpen,
    Calendar,
    Plus,
    Trash2,
    Loader2,
    Building2
} from 'lucide-react';
import api from '../../services/api';

const AcademicStructure = () => {
    const [activeTab, setActiveTab] = useState<'departments' | 'programs' | 'semesters'>('departments');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]); // For program creation dropdown

    // Form States
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        fetchData();
        if (activeTab === 'programs') {
            fetchDepartments();
        }
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Use academic router for reading public data
            const endpoint = `/academic/${activeTab}`;
            const response = await api.get(endpoint);
            setData(response.data);
        } catch (error) {
            console.error(`Failed to fetch ${activeTab}`, error);
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

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure? This modification cannot be undone.')) return;
        try {
            await api.delete(`/admin/${activeTab}/${id}`);
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to delete');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post(`/admin/${activeTab}`, formData);
            setIsFormOpen(false);
            setFormData({});
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to create');
        }
    };

    const renderForm = () => {
        if (activeTab === 'departments') {
            return (
                <>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1.5">Department Name</label>
                        <input
                            required
                            className="w-full bg-bg-primary border border-white/10 rounded-lg py-2 px-3 focus:border-primary outline-none"
                            placeholder="e.g. Computer Science"
                            value={formData.name || ''}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1.5">Code</label>
                        <input
                            required
                            className="w-full bg-bg-primary border border-white/10 rounded-lg py-2 px-3 focus:border-primary outline-none"
                            placeholder="e.g. CS"
                            value={formData.code || ''}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        />
                    </div>
                </>
            );
        }
        if (activeTab === 'programs') {
            return (
                <>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1.5">Program Name</label>
                        <input
                            required
                            className="w-full bg-bg-primary border border-white/10 rounded-lg py-2 px-3 focus:border-primary outline-none"
                            placeholder="e.g. BS Computer Science"
                            value={formData.name || ''}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1.5">Code</label>
                        <input
                            required
                            className="w-full bg-bg-primary border border-white/10 rounded-lg py-2 px-3 focus:border-primary outline-none"
                            placeholder="e.g. BSCS"
                            value={formData.code || ''}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1.5">Department</label>
                        <select
                            required
                            className="w-full bg-bg-primary border border-white/10 rounded-lg py-2 px-3 focus:border-primary outline-none"
                            value={formData.department_id || ''}
                            onChange={(e) => setFormData({ ...formData, department_id: Number(e.target.value) })}
                        >
                            <option value="">Select Department</option>
                            {departments.map(dept => (
                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                            ))}
                        </select>
                    </div>
                </>
            );
        }
        if (activeTab === 'semesters') {
            return (
                <>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1.5">Semester Name</label>
                        <input
                            required
                            className="w-full bg-bg-primary border border-white/10 rounded-lg py-2 px-3 focus:border-primary outline-none"
                            placeholder="e.g. Fall 2026"
                            value={formData.name || ''}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={formData.is_active || false}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            id="is_active"
                        />
                        <label htmlFor="is_active" className="text-sm font-medium text-text-secondary">Is Active?</label>
                    </div>
                </>
            );
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-bold mb-8">Academic Structure</h1>

            {/* Tabs */}
            <div className="flex items-center gap-4 border-b border-white/10 mb-8">
                <button
                    onClick={() => { setActiveTab('departments'); setIsFormOpen(false); }}
                    className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${activeTab === 'departments' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-white'}`}
                >
                    <Building2 className="w-4 h-4" />
                    Departments
                </button>
                <button
                    onClick={() => { setActiveTab('programs'); setIsFormOpen(false); }}
                    className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${activeTab === 'programs' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-white'}`}
                >
                    <School className="w-4 h-4" />
                    Programs
                </button>
                <button
                    onClick={() => { setActiveTab('semesters'); setIsFormOpen(false); }}
                    className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${activeTab === 'semesters' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-white'}`}
                >
                    <Calendar className="w-4 h-4" />
                    Semesters
                </button>
            </div>

            <div className="flex justify-end mb-6">
                <button
                    onClick={() => setIsFormOpen(!isFormOpen)}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    {isFormOpen ? 'Cancel' : `Add ${activeTab.slice(0, -1)}`}
                </button>
            </div>

            {isFormOpen && (
                <div className="glass p-6 rounded-xl border border-white/5 mb-8 animate-in slide-in-from-top-2">
                    <h3 className="text-lg font-bold mb-4 capitalize">Add New {activeTab.slice(0, -1)}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
                        {renderForm()}
                        <button type="submit" className="btn btn-primary w-full">Create</button>
                    </form>
                </div>
            )}

            {/* List */}
            <div className="glass rounded-xl border border-white/5 overflow-hidden">
                {loading ? (
                    <div className="p-8 flex justify-center">
                        <Loader2 className="animate-spin w-8 h-8 text-primary" />
                    </div>
                ) : data.length === 0 ? (
                    <div className="p-8 text-center text-text-secondary">
                        No {activeTab} found.
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-text-secondary text-sm">
                            <tr>
                                <th className="p-4">Name</th>
                                {activeTab === 'semesters' && <th className="p-4">Status</th>}
                                {(activeTab === 'departments' || activeTab === 'programs') && <th className="p-4">Code</th>}
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {data.map((item) => (
                                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-medium">{item.name}</td>
                                    {activeTab === 'semesters' && (
                                        <td className="p-4">
                                            {item.is_active ? (
                                                <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded text-xs">Active</span>
                                            ) : (
                                                <span className="bg-gray-500/10 text-gray-500 px-2 py-1 rounded text-xs">Inactive</span>
                                            )}
                                        </td>
                                    )}
                                    {(activeTab === 'departments' || activeTab === 'programs') && (
                                        <td className="p-4 text-text-secondary">{item.code}</td>
                                    )}
                                    <td className="p-4 text-right">
                                        <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-300 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AcademicStructure;
