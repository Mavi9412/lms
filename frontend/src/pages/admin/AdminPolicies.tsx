import { useEffect, useState } from 'react';
import { Save, AlertCircle, Trash2, Plus, GraduationCap, Clock } from 'lucide-react';
import api from '../../services/api';

interface GradingScale {
    id: number;
    grade_letter: string;
    min_percentage: number;
    gpa_point: number;
}

const AdminPolicies = () => {
    const [scales, setScales] = useState<GradingScale[]>([]);
    const [attendanceMin, setAttendanceMin] = useState(75);
    const [lateTolerance, setLateTolerance] = useState(15);
    const [loading, setLoading] = useState(false);
    const [newScale, setNewScale] = useState({ grade_letter: '', min_percentage: '', gpa_point: '' });

    useEffect(() => {
        fetchPolicies();
    }, []);

    const fetchPolicies = async () => {
        try {
            const [scalesRes, policyRes] = await Promise.all([
                api.get('/admin/grading-scales'),
                api.get('/admin/attendance-policy'),
            ]);
            setScales(scalesRes.data);
            setAttendanceMin(policyRes.data.min_percentage);
            setLateTolerance(policyRes.data.late_tolerance_minutes);
        } catch (error) {
            console.error('Failed to fetch policies', error);
        }
    };

    const handleSaveAttendance = async () => {
        setLoading(true);
        try {
            await api.put('/admin/attendance-policy', {
                min_percentage: Number(attendanceMin),
                late_tolerance_minutes: Number(lateTolerance),
                is_active: true,
            });
            alert('Attendance policy updated');
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to update policy');
        } finally {
            setLoading(false);
        }
    };

    const handleAddScale = async () => {
        if (!newScale.grade_letter || newScale.min_percentage === '') return;
        try {
            await api.post('/admin/grading-scales', {
                grade_letter: newScale.grade_letter.toUpperCase(),
                min_percentage: Number(newScale.min_percentage),
                gpa_point: Number(newScale.gpa_point) || 0,
            });
            setNewScale({ grade_letter: '', min_percentage: '', gpa_point: '' });
            fetchPolicies();
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to add scale');
        }
    };

    const handleDeleteScale = async (id: number) => {
        if (!confirm('Delete this grading band?')) return;
        try {
            await api.delete(`/admin/grading-scales/${id}`);
            fetchPolicies();
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to delete');
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-bold mb-6">Institutional Policies</h1>

            <div className="grid gap-6">
                {/* Attendance Policy */}
                <div className="glass rounded-xl p-6 border border-white/5">
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-orange-500/10 text-orange-400">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold mb-2">Attendance Requirements</h2>
                            <p className="text-text-secondary mb-4">
                                Minimum attendance enforced at final-grade publish — students below the threshold get flagged in the gradebook.
                            </p>
                            <div className="flex flex-wrap items-center gap-6">
                                <div className="flex items-center gap-3">
                                    <label className="text-sm text-text-secondary">Minimum %</label>
                                    <input
                                        type="number" min={0} max={100}
                                        value={attendanceMin}
                                        onChange={(e) => setAttendanceMin(Number(e.target.value))}
                                        className="w-20 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-center"
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock className="w-4 h-4 text-text-secondary" />
                                    <label className="text-sm text-text-secondary">Late tolerance (min)</label>
                                    <input
                                        type="number" min={0}
                                        value={lateTolerance}
                                        onChange={(e) => setLateTolerance(Number(e.target.value))}
                                        className="w-20 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-center"
                                    />
                                </div>
                                <button
                                    onClick={handleSaveAttendance}
                                    disabled={loading}
                                    className="btn btn-primary flex items-center gap-2 text-sm"
                                >
                                    <Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Policy'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grading Scale */}
                <div className="glass rounded-xl p-6 border border-white/5">
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-primary/10 text-primary">
                            <GraduationCap className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold mb-2">Grading Scale</h2>
                            <p className="text-text-secondary mb-4">
                                Letter bands used when publishing final grades. Highest matching band wins.
                            </p>
                            <table className="w-full mb-4">
                                <thead>
                                    <tr className="text-left text-sm text-text-secondary border-b border-white/10">
                                        <th className="py-2">Grade</th>
                                        <th className="py-2">Min %</th>
                                        <th className="py-2">GPA Points</th>
                                        <th className="py-2"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {scales.map((s) => (
                                        <tr key={s.id} className="border-b border-white/5">
                                            <td className="py-2 font-bold text-white">{s.grade_letter}</td>
                                            <td className="py-2">{s.min_percentage}%</td>
                                            <td className="py-2">{s.gpa_point}</td>
                                            <td className="py-2 text-right">
                                                <button onClick={() => handleDeleteScale(s.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded" title="Delete">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {scales.length === 0 && (
                                        <tr><td colSpan={4} className="py-4 text-text-secondary text-sm">No bands yet — publish falls back to the default A/B/C/D/F scale.</td></tr>
                                    )}
                                </tbody>
                            </table>
                            <div className="flex flex-wrap items-end gap-3">
                                <div>
                                    <label className="text-xs text-text-secondary block mb-1">Grade</label>
                                    <input value={newScale.grade_letter} onChange={(e) => setNewScale({ ...newScale, grade_letter: e.target.value })}
                                        placeholder="A" maxLength={3}
                                        className="w-20 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-center uppercase" />
                                </div>
                                <div>
                                    <label className="text-xs text-text-secondary block mb-1">Min %</label>
                                    <input type="number" value={newScale.min_percentage} onChange={(e) => setNewScale({ ...newScale, min_percentage: e.target.value })}
                                        placeholder="90"
                                        className="w-24 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-center" />
                                </div>
                                <div>
                                    <label className="text-xs text-text-secondary block mb-1">GPA</label>
                                    <input type="number" step={0.1} value={newScale.gpa_point} onChange={(e) => setNewScale({ ...newScale, gpa_point: e.target.value })}
                                        placeholder="4.0"
                                        className="w-24 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-center" />
                                </div>
                                <button onClick={handleAddScale} className="btn btn-primary flex items-center gap-2 text-sm">
                                    <Plus className="w-4 h-4" /> Add Band
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPolicies;
